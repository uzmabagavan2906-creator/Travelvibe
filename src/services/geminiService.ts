import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateItinerary = async (destination: string, days: number, interests: string) => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please add it to your secrets.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Create a detailed ${days}-day travel itinerary for ${destination} focusing on ${interests}. 
  Include day-by-day plans with specific activities and key highlights.
  Return the response in JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                title: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["day", "title", "activities"]
            }
          }
        },
        required: ["title", "description", "highlights", "itinerary"]
      }
    }
  });

  return JSON.parse(response.text);
};
