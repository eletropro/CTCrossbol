import { GoogleGenAI } from "@google/genai";

export interface RouteResult {
  distanceKm: number;
  durationText: string;
  fuelCost: number;
  mapsUrl: string;
  originCoords?: [number, number];
  destCoords?: [number, number];
}

function getAi() {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
  return new GoogleGenAI({ apiKey });
}

export async function calculateRoute(
  origin: string,
  destination: string,
  fuelPrice: number,
  fuelConsumption: number,
  originCoords?: [number, number],
  destCoords?: [number, number]
): Promise<RouteResult> {
  const ai = getAi();
  const originStr = originCoords ? `${originCoords[0]}, ${originCoords[1]}` : origin;
  const destStr = destCoords ? `${destCoords[0]}, ${destCoords[1]}` : destination;

  const prompt = `Calcule a distância de condução e o tempo de viagem entre:
  ORIGEM: ${originStr}
  DESTINO: ${destStr}
  
  Use o Google Maps para encontrar a rota real.
  Responda no formato:
  Distância: [valor] km
  Tempo: [valor]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const distanceMatch = text.match(/Distância:\s*([\d.,]+)\s*km/i);
    const durationMatch = text.match(/Tempo:\s*([^\n]+)/i);
    
    let distance = 0;
    if (distanceMatch) {
      distance = parseFloat(distanceMatch[1].replace(',', '.'));
    }

    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;
    let finalOriginCoords = originCoords;
    let finalDestCoords = destCoords;

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.maps?.uri) mapsUrl = chunk.maps.uri;
        // Note: groundingChunks usually don't have lat/lng directly, 
        // but the model might have them in the text if we ask.
      }
    }

    const consumption = fuelConsumption > 0 ? fuelConsumption : 10;
    const price = fuelPrice > 0 ? fuelPrice : 0;
    const cost = (distance / consumption) * price;

    return {
      distanceKm: distance,
      durationText: durationMatch ? durationMatch[1].trim() : "N/A",
      fuelCost: cost,
      mapsUrl: mapsUrl,
      originCoords: finalOriginCoords,
      destCoords: finalDestCoords
    };
  } catch (error) {
    console.error("Erro calculateRoute:", error);
    return {
      distanceKm: 0,
      durationText: "Erro",
      fuelCost: 0,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
    };
  }
}

export async function searchAddress(query: string): Promise<{ address: string; coords?: [number, number] }> {
  const ai = getAi();
  const prompt = `Localize o endereço completo e as coordenadas (latitude e longitude) para: "${query}".
  Use o Google Maps. Responda no formato:
  Endereço: [endereço completo]
  Coordenadas: [lat], [lng]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const addressMatch = text.match(/Endereço:\s*([^\n]+)/i);
    const coordsMatch = text.match(/Coordenadas:\s*([\d.-]+)\s*,\s*([\d.-]+)/i);

    let coords: [number, number] | undefined = undefined;
    if (coordsMatch) {
      coords = [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
    }

    return { 
      address: addressMatch ? addressMatch[1].trim() : query, 
      coords 
    };
  } catch (error) {
    console.error("Erro searchAddress:", error);
    return { address: query };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const ai = getAi();
  const prompt = `Qual é o endereço exato para estas coordenadas: ${lat}, ${lng}? 
  Use o Google Maps. Responda apenas o endereço.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    return response.text?.trim() || `${lat}, ${lng}`;
  } catch (error) {
    console.error("Erro reverseGeocode:", error);
    return `${lat}, ${lng}`;
  }
}
