import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSmartImage } from "@/data/destinationImages";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini API client
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const getDestinationImage = async (query: string): Promise<string> => {
    // Return high-quality static image from our curated database
    return getSmartImage(query);
};

export const getGeminiImagePrompt = async (destination: string): Promise<string> => {
    if (!genAI) return destination;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const prompt = `Describe a breathtaking, photorealistic travel photography shot of ${destination}, capturing its most iconic landmark or atmosphere. Keep it concise, under 15 words. Focus on visual elements.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (e) {
        return destination + " beautiful travel view";
    }
}
