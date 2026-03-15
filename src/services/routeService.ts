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
  fuelConsumption: number
): Promise<RouteResult> {
  const prompt = `Você é um especialista em logística e rotas.
  Calcule a distância e o tempo de viagem entre:
  Origem: "${origin}"
  Destino: "${destination}"
  
  Use obrigatoriamente a ferramenta Google Maps para obter dados reais e precisos.
  
  Retorne a resposta estritamente como um objeto JSON válido, sem blocos de código markdown, contendo:
  {
    "distanceKm": número (apenas o valor numérico em km),
    "durationText": "texto com o tempo (ex: 30 min)",
    "mapsUrl": "URL direta da rota no Google Maps",
    "originCoords": [latitude, longitude],
    "destCoords": [latitude, longitude]
  }
  
  Não escreva mais nada além do JSON.`;

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
      throw new Error("Não foi possível obter dados da rota.");
    }

    const result = JSON.parse(jsonMatch[0]);
    
    const distance = Number(result.distanceKm) || 0;
    const cost = (distance / (fuelConsumption || 10)) * (fuelPrice || 5);

    return {
      distanceKm: distance,
      durationText: result.durationText || "N/A",
      fuelCost: cost,
      mapsUrl: result.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      originCoords: result.originCoords,
      destCoords: result.destCoords
    };
  } catch (error) {
    console.error("Erro ao calcular rota:", error);
    return {
      distanceKm: 0,
      durationText: "Erro ao calcular",
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
