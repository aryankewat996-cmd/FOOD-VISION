import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  productName: string;
  classification: "Food" | "Beverage" | "Supplement";
  energyKcal: number;
  sugar: "Low" | "Medium" | "High";
  fat: "Low" | "Medium" | "High";
  protein: number;
  sodium: number;
  ingredients: {
    name: string;
    category: "Natural" | "Artificial" | "Preservative" | "Additive" | "Allergen";
  }[];
  healthScore: number;
  naturalPercentage: number;
  artificialPercentage: number;
  explanation: string;
  alternatives: string[];
  processedScore: number;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING },
    classification: { type: Type.STRING, enum: ["Food", "Beverage", "Supplement"] },
    energyKcal: { type: Type.NUMBER },
    sugar: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    fat: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    protein: { type: Type.NUMBER },
    sodium: { type: Type.NUMBER },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Natural", "Artificial", "Preservative", "Additive", "Allergen"] }
        },
        required: ["name", "category"]
      }
    },
    healthScore: { type: Type.NUMBER },
    naturalPercentage: { type: Type.NUMBER },
    artificialPercentage: { type: Type.NUMBER },
    explanation: { type: Type.STRING },
    alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
    processedScore: { type: Type.NUMBER }
  },
  required: [
    "productName", "classification", "energyKcal", "sugar", "fat", 
    "protein", "sodium", "ingredients", "healthScore", 
    "naturalPercentage", "artificialPercentage", "explanation", 
    "alternatives", "processedScore"
  ]
};

export async function analyzeFoodImage(base64Image: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this food product image. Extract the ingredients list and nutrition table.
    Classify each ingredient. Calculate health metrics.
    Provide the result in the specified JSON format.
    
    Guidelines for Health Score (0-10):
    - Higher score for natural, whole ingredients.
    - Lower score for high sugar, high sodium, and ultra-processed additives.
    - Consider the balance of protein and fiber if visible.
    
    Guidelines for Processed Score (0-10):
    - 0: Unprocessed
    - 10: Ultra-processed (many additives, preservatives, artificial flavors).
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
}

export async function analyzeProductData(productData: any): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this food product data from Open Food Facts.
    Data: ${JSON.stringify(productData)}
    
    Calculate health metrics and provide the result in the specified JSON format.
    
    Guidelines for Health Score (0-10):
    - Higher score for natural, whole ingredients.
    - Lower score for high sugar, high sodium, and ultra-processed additives.
    
    Guidelines for Processed Score (0-10):
    - 0: Unprocessed
    - 10: Ultra-processed.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
}
