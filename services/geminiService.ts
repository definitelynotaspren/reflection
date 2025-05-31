
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GeminiEmotionAnalysis } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

const parseJsonFromText = <T,>(text: string): T | null => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    // Fallback: if the string itself is valid JSON (e.g. not wrapped in fences but Gemini still sent it)
    try {
        return JSON.parse(text) as T;
    } catch (finalError) {
        console.error("Final attempt to parse JSON also failed.", finalError);
        throw new Error(`AI returned malformed JSON. Raw text: ${text.substring(0,1000)}`);
    }
  }
};


export const analyzeJournalEntryWithGemini = async (apiKey: string, entryContent: string): Promise<GeminiEmotionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze the following journal entry to determine the primary emotional state (e.g., happy, sad, frustrated, excited, anxious, calm, contemplative, grateful) and extract 2-4 key qualities or themes (e.g., achievement, interpersonal conflict, self-doubt, gratitude, problem-solving, future planning).
Return the response strictly as a JSON object with keys "emotion" (string) and "qualities" (an array of strings).

Journal Entry:
---
${entryContent}
---

JSON Response:`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more factual/deterministic extraction
      },
    });

    const analysisResult = parseJsonFromText<GeminiEmotionAnalysis>(response.text);
    if (!analysisResult || typeof analysisResult.emotion !== 'string' || !Array.isArray(analysisResult.qualities)) {
        throw new Error('AI response is not in the expected JSON format for emotion analysis.');
    }
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing journal entry with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error during analysis: ${error.message}`);
    }
    throw new Error("Unknown error during Gemini API analysis.");
  }
};

export const generateCheckInQuestionWithGemini = async (apiKey: string, emotion: string, qualities: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Based on this recent journal insight:
Emotion: "${emotion}"
Qualities: "${qualities.join(', ')}"

Generate a single, supportive, and empathetic follow-up question for a check-in. The question should be open-ended and encourage reflection.
For example:
- If emotion was "frustrated" and qualities "unappreciated, unsure", a question could be: "Reflecting on feeling ${emotion} about ${qualities.join(' and ')}, what's one small step you could consider today, or how are you feeling about that situation now?"
- If emotion was "excited" and qualities "achievement, hard work", a question could be: "It sounds like you experienced something exciting related to ${qualities.join(' and ')}! How can you carry that positive energy forward or celebrate that success today?"

The question should be phrased naturally and directly to the person. Avoid starting with "The AI suggests..." or similar meta-commentary. Just provide the question.

Question:`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7, // Higher temperature for more creative/varied questions
      },
    });
    
    let questionText = response.text.trim();
    // Remove potential quotation marks if the AI wraps the question
    if (questionText.startsWith('"') && questionText.endsWith('"')) {
        questionText = questionText.substring(1, questionText.length - 1);
    }

    if (!questionText) {
        throw new Error('AI returned an empty question.');
    }
    return questionText;
  } catch (error) {
    console.error("Error generating check-in question with Gemini:", error);
     if (error instanceof Error) {
        throw new Error(`Gemini API error during question generation: ${error.message}`);
    }
    throw new Error("Unknown error during Gemini API question generation.");
  }
};
