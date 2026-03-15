import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RouteResult {
  distanceKm: number;
  durationText: string;
  fuelCost: number;
  mapsUrl: string;
}

export async function calculateRoute(
  origin: string,
  destination: string,
  fuelPrice: number,
  fuelConsumption: number
): Promise<RouteResult> {
  const prompt = `Calcule a distância e o tempo de viagem entre "${origin}" e "${destination}". 
  Retorne apenas um JSON com os campos: 
  - distanceKm (número, apenas o valor em km)
  - durationText (texto, ex: "25 min")
  - mapsUrl (URL do Google Maps para essa rota)
  
  Use ferramentas de mapas para precisão.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      responseMimeType: "application/json",
    },
  });

  const result = JSON.parse(response.text || '{}');
  
  // Calculate fuel cost: (Distance / Consumption) * Price
  // We multiply by 2 for round trip if needed, but let's stick to one way for now as requested.
  const distance = result.distanceKm || 0;
  const cost = (distance / (fuelConsumption || 10)) * (fuelPrice || 5);

  return {
    distanceKm: distance,
    durationText: result.durationText || "N/A",
    fuelCost: cost,
    mapsUrl: result.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
  };
}
