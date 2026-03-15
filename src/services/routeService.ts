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
  const prompt = `Você é um especialista em logística.
  Calcule a distância (km) e o tempo entre:
  DE: "${origin}"
  PARA: "${destination}"
  
  USE A FERRAMENTA GOOGLE MAPS.
  
  Retorne APENAS um JSON no formato:
  {
    "distanceKm": número,
    "durationText": "tempo",
    "mapsUrl": "link",
    "originCoords": [lat, lng],
    "destCoords": [lat, lng]
  }
  
  IMPORTANTE: Se não encontrar a rota, retorne distanceKm: 0.`;

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
      // Fallback: try to at least get a maps URL if JSON fails
      return {
        distanceKm: 0,
        durationText: "Erro no formato",
        fuelCost: 0,
        mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    const distance = parseFloat(result.distanceKm) || 0;
    
    // Calculate cost safely
    const consumption = fuelConsumption > 0 ? fuelConsumption : 10;
    const price = fuelPrice > 0 ? fuelPrice : 0;
    const cost = (distance / consumption) * price;

    return {
      distanceKm: distance,
      durationText: result.durationText || "N/A",
      fuelCost: cost,
      mapsUrl: result.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      originCoords: result.originCoords,
      destCoords: result.destCoords
    };
  } catch (error) {
    console.error("Erro crítico no cálculo:", error);
    return {
      distanceKm: 0,
      durationText: "Erro de conexão",
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
