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

  // Prompt mais direto e imperativo
  const prompt = `GPS: Calcule a distância de condução entre estas coordenadas/endereços.
  DE: ${originStr}
  PARA: ${destStr}
  
  Use obrigatoriamente a ferramenta Google Maps.
  Responda EXATAMENTE neste formato:
  DISTANCIA: [valor numérico] km
  TEMPO: [texto do tempo]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0, // Mais determinístico
      },
    });

    const text = response.text || '';
    console.log("Resposta do GPS:", text);

    // Regex mais flexível para capturar números com vírgula ou ponto
    const distanceMatch = text.match(/DISTANCIA:\s*([\d.,]+)\s*km/i);
    const durationMatch = text.match(/TEMPO:\s*([^\n|]+)/i);
    
    let distance = 0;
    if (distanceMatch) {
      // Converte vírgula em ponto para o parseFloat
      const distStr = distanceMatch[1].replace(',', '.');
      distance = parseFloat(distStr);
    }

    // Tenta extrair URL dos grounding chunks
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.maps?.uri) {
          mapsUrl = chunk.maps.uri;
          break;
        }
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
      originCoords: originCoords,
      destCoords: destCoords
    };
  } catch (error) {
    console.error("Erro crítico calculateRoute:", error);
    return {
      distanceKm: 0,
      durationText: "Erro de conexão",
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
