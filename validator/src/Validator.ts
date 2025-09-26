// Validator.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { image_system_prompt, text_system_prompt } from './system_prompt';
import { createLLM, ValidationResult } from './sharedUtils';

export class Validator {
  constructor() {
    // No initialization needed for OpenAI-only setup
  }

  /**
   * Validates an image using AI analysis
   * @param imageInput - URL or path to the image
   * @param textPrompt - Description of what to validate in the image
   * @returns Promise<ValidationResult> - Image validation result
   */
  async validateImage(imageInput: string, textPrompt: string): Promise<ValidationResult> {
    console.log("🔍 Image Validator Starting...");
    console.log(`📷 Image input: ${imageInput}`);
    console.log(`📝 Text prompt: ${textPrompt}`);

    // Initialize AI model
    const llm = createLLM();

    // Build prompt template for multimodal input
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", image_system_prompt],
      [
        "human",
        [
          { type: "text", text: "{input}" },
          { 
            type: "image_url", 
            image_url: { 
              url: "{image_url}" 
            } 
          },
        ],
      ],
    ]);

    // Run the validation directly with the LLM
    console.log("🤖 Running image validation...");
    try {
      const response = await llm.invoke(
        await prompt.format({
          input: textPrompt,
          image_url: imageInput,
        })
      );

      console.log("\n✅ Image Validation Result:");
      console.log("Raw Output:", response.content);

      try {
        const parsedOutput = JSON.parse(response.content as string);
        console.log("Parsed JSON Output:", parsedOutput);
        return parsedOutput;
      } catch (parseError) {
        console.error("❌ Failed to parse LLM output as JSON:", parseError);
        console.error("Malformed JSON received:", response.content);
        return { error: "Failed to parse JSON response" };
      }
    } catch (error) {
      console.error("❌ Error during image validation:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        const openaiError = error as any;
        if (openaiError.status) console.error("API Status:", openaiError.status);
        if (openaiError.error) {
          console.error("API Error Details:", openaiError.error);
          if (openaiError.error.param) console.error("Missing Parameter:", openaiError.error.param);
          if (openaiError.error.code) console.error("Error Code:", openaiError.error.code);
        }
      } else {
        console.error("Unknown error type:", error);
      }
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Validates text content using AI analysis
   * @param textInput - The text to validate
   * @returns Promise<ValidationResult> - Text validation result
   */
  async validateText(textInput: string): Promise<ValidationResult> {
    console.log("🔍 Text Validator Starting...");
    console.log(`📝 Text input: ${textInput}`);

    // Initialize AI model
    const llm = createLLM();

    // Build prompt template for text-only validation
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", text_system_prompt],
      ["human", "Validate this text: {input}"],
    ]);

    // Run the validation directly with the LLM
    console.log("🤖 Running text validation...");
    try {
      const response = await llm.invoke(
        await prompt.format({
          input: textInput,
        })
      );

      console.log("\n✅ Text Validation Result:");
      console.log("Raw Output:", response.content);

      try {
        const parsedOutput = JSON.parse(response.content as string);
        console.log("Parsed JSON Output:", parsedOutput);
        return parsedOutput;
      } catch (parseError) {
        console.error("❌ Failed to parse LLM output as JSON:", parseError);
        console.error("Malformed JSON received:", response.content);
        return { error: "Failed to parse JSON response" };
      }
    } catch (error) {
      console.error("❌ Error during text validation:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Closes any connections (no-op for OpenAI-only setup)
   */
  close(): void {
    console.log("Validator closed.");
  }
}
