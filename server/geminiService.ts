import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function generateDiagram({
  prompt,
  aspectRatio = '1:1',
  imageSize = '1K',
}: {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '1K' | '2K' | '4K';
}) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: `Educational diagram or visual study aid for teaching: ${prompt}. Professional, high-contrast, informative, clear educational illustration.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio || '1:1',
        imageSize: imageSize || '1K',
      },
    },
  });

  let imageUrl: string | null = null;
  let textDescription: string = '';

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }
  }

  if (!imageUrl) {
    throw new Error('Image generation completed but no image data returned.');
  }

  return { imageUrl, textDescription };
}

export async function deepThinkProblem({
  query,
  subject,
  targetAudience = 'students',
}: {
  query: string;
  subject?: string;
  targetAudience?: string;
}) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Subject: ${subject || 'General Education'}\nAudience: ${targetAudience}\nQuery/Problem:\n${query}`,
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
      systemInstruction:
        'You are TutorFlow Master AI Assistant & Senior Pedagogical Expert. You provide profound, step-by-step thinking breakdown for complex educational concepts, math/science problems, lesson curricula, question generation, and grading rubrics. Structure your response with: 1. Core Concept & First Principles, 2. Deep Step-by-Step Breakdown, 3. Common Misconceptions to Watch Out For, 4. Practice Application & Solution Summary.',
    },
  });

  return {
    solution: response.text || 'No text output returned.',
  };
}
