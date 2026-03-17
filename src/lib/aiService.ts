/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export const getAIWatchCompanionResponse = async (
  mediaTitle: string,
  chatHistory: string[],
  userPrompt: string
) => {
  try {
    const prompt = `
      You are a "Watch Companion" for a real-time watch party app called HomeTheatre.
      The users are currently watching: "${mediaTitle}".
      
      Recent Chat History:
      ${chatHistory.slice(-10).join("\n")}
      
      User is asking: "${userPrompt}"
      
      Instructions:
      - Be helpful, engaging, and enthusiastic.
      - Provide interesting facts about the media if requested.
      - Summarize the conversation if asked.
      - Keep responses concise (under 3-4 sentences).
      - Use a friendly "movie buff" persona.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Companion Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Let's get back to the show!";
  }
};

export const getMediaInfo = async (title: string) => {
  try {
    const prompt = `Provide a very brief (2 sentence) engaging synopsis and one fun fact for the movie or show: "${title}".`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "No fun facts available right now, let's just enjoy the watch!";
  }
};
