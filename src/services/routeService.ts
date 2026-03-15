import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '' });

export interface RouteResult {
  distanceKm: number;
  durationText: string;
  fuelCost: number;
  mapsUrl: string;
  originCoords?: [number, number];
  destCoords?: [number, number];
}

export async function calculateRoute(
  origin: string,
  destination: string,
  fuelPrice: number,
  fuelConsumption: number,
  originCoords?: [number, number],
  destCoords?: [number, number]
): Promise<RouteResult> {
  const originStr = originCoords ? `${originCoords[0]}, ${originCoords[1]} (${origin})` : origin;
  const destStr = destCoords ? `${destCoords[0]}, ${destCoords[1]} (${destination})` : destination;

  const prompt = `Aja como um GPS de alta precisão.
  Calcule a rota exata entre:
  PONTO A: "${originStr}"
  PONTO B: "${destStr}"
  
  INSTRUÇÕES CRÍTICAS:
  1. Use a ferramenta Google Maps para obter a distância real de condução (não em linha reta).
  2. Retorne APENAS o JSON abaixo, sem explicações:
  {
    "distanceKm": número (ex: 15.5),
    "durationText": "texto do tempo (ex: 25 min)",
    "mapsUrl": "URL da rota",
    "originCoords": [lat, lng],
    "destCoords": [lat, lng]
  }
  3. Se a rota for impossível, retorne distanceKm: 0.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return {
        distanceKm: 0,
        durationText: "Erro de formato",
        fuelCost: 0,
        mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    const distance = parseFloat(result.distanceKm) || 0;
    
    const consumption = fuelConsumption > 0 ? fuelConsumption : 10;
    const price = fuelPrice > 0 ? fuelPrice : 0;
    const cost = (distance / consumption) * price;

    return {
      distanceKm: distance,
      durationText: result.durationText || "N/A",
      fuelCost: cost,
      mapsUrl: result.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      originCoords: result.originCoords || originCoords,
      destCoords: result.destCoords || destCoords
    };
  } catch (error) {
    console.error("Erro no cálculo de rota:", error);
    return {
      distanceKm: 0,
      durationText: "Erro no serviço",
      fuelCost: 0,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
    };
  }
}

export async function searchAddress(query: string): Promise<{ address: string; coords?: [number, number] }> {
  const prompt = `Encontre o endereço completo, oficial e formatado para: "${query}". 
  Use o Google Maps para validar. 
  Retorne a resposta estritamente como um objeto JSON válido:
  {
    "address": "endereço completo",
    "coords": [latitude, longitude]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return { address: result.address, coords: result.coords };
    }
    return { address: query };
  } catch (error) {
    console.error("Erro ao buscar endereço:", error);
    return { address: query };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const prompt = `Qual o endereço completo para as coordenadas latitude: ${lat}, longitude: ${lng}? 
  Use o Google Maps para validar. Retorne apenas o endereço formatado em uma única linha.`;

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
    console.error("Erro no reverse geocode:", error);
    return `${lat}, ${lng}`;
  }
}
