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

  const prompt = `GPS: Forneça a distância de condução (carro) entre:
  A: ${originStr}
  B: ${destStr}
  
  Use o Google Maps. Responda APENAS com a distância em km e o tempo.
  Exemplo: 12.5 km, 20 min`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0,
      },
    });

    const text = response.text || '';
    console.log("GPS Raw:", text);

    // Regex para pegar o primeiro número que parece uma distância
    const distanceMatch = text.match(/([\d.,]+)\s*km/i);
    const durationMatch = text.match(/(\d+)\s*(min|hora|hr|h)/i);
    
    let distance = 0;
    if (distanceMatch) {
      distance = parseFloat(distanceMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Se falhar o GPS, mas tivermos coordenadas, podemos tentar uma estimativa básica
    if (distance === 0 && originCoords && destCoords) {
      // Haversine formula for a rough estimate if tool fails
      const R = 6371; // Earth radius in km
      const dLat = (destCoords[0] - originCoords[0]) * Math.PI / 180;
      const dLon = (destCoords[1] - originCoords[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(originCoords[0] * Math.PI / 180) * Math.cos(destCoords[0] * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const directDist = R * c;
      distance = parseFloat((directDist * 1.3).toFixed(1)); // 30% more for road distance
      console.log("Fallback distance used:", distance);
    }

    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.maps?.uri) mapsUrl = chunk.maps.uri;
      }
    }

    const consumption = fuelConsumption > 0 ? fuelConsumption : 10;
    const price = fuelPrice > 0 ? fuelPrice : 0;
    const cost = (distance / consumption) * price;

    return {
      distanceKm: distance,
      durationText: durationMatch ? durationMatch[0] : (distance > 0 ? "Estimado" : "N/A"),
      fuelCost: cost,
      mapsUrl: mapsUrl,
      originCoords: originCoords,
      destCoords: destCoords
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
  const prompt = `Localize o endereço completo e as coordenadas geográficas exatas (latitude e longitude) para: "${query}".
  Use o Google Maps. Responda com o endereço formatado e as coordenadas no formato [lat, lng].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    // Busca por padrões de coordenadas: [-23.55, -46.63] ou apenas os números
    const coordsMatch = text.match(/\[?\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]?/);
    
    let coords: [number, number] | undefined = undefined;
    if (coordsMatch) {
      coords = [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
    }

    // Tenta pegar o endereço da primeira linha ou de um padrão
    const addressMatch = text.match(/Endereço:\s*([^\n]+)/i) || text.match(/^([^,\n]+,[^,\n]+,[^,\n]+)/);
    const address = addressMatch ? addressMatch[1].trim() : text.split('\n')[0].trim();

    return { 
      address: address || query, 
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
  Use o Google Maps. Responda apenas o endereço formatado.`;

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
