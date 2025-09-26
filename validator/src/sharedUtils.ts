import fs from 'fs';
import path from 'path';

// Choose your AI provider (install the one you want to use)
export function createLLM() {
  // Option 1: OpenAI (requires OPENAI_API_KEY in .env)
  if (process.env.OPENAI_API_KEY) {
    const { ChatOpenAI } = require('@langchain/openai');
    return new ChatOpenAI({ 
      model: 'gpt-4o', // Using gpt-4o for vision capabilities
      temperature: 0.1 // Lower temperature for more consistent validation results
    });
  }
  console.error("Open Api key not found");
  throw new Error("Open Api key not found");
}

// Helper function to check if input is a URL
export function isUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

// Helper function to convert local image to base64 data URL
export function imageToBase64DataUrl(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().slice(1);

    // Ensure comprehensive and correct MIME type mapping
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    };

    const mimeType = mimeTypes[ext];
    if (!mimeType) {
      console.warn(`⚠️ Warning: Unknown image extension '${ext}'. Defaulting to 'image/jpeg'.`);
      return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    }

    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to read image file or generate data URL: ${imagePath}. Error: ${error}`);
  }
}

// Helper function to extract JSON from markdown code blocks
export function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code block markers
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // If no code blocks found, try to find JSON object in the text
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0].trim();
  }
  
  // Return original text if no JSON found
  return text.trim();
}

// Common types
export interface ValidationResult {
  [key: string]: any;
  error?: string;
}
