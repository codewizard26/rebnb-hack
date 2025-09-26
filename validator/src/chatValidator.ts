// chatValidator.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { text_system_prompt } from './system_prompt';
import { createLLM, ValidationResult, extractJsonFromMarkdown } from './sharedUtils';

// Function for text-only validation
export async function validateText(textPrompt: string): Promise<ValidationResult> {
  console.log("🔍 Text Validator Starting...");
  console.log(`📝 Text prompt: ${textPrompt}`);

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
        input: textPrompt,
      })
    );

    console.log("\n✅ Text Validation Result:");
    console.log("Raw Output:", response.content);

    try {
      const cleanedJson = extractJsonFromMarkdown(response.content as string);
      const parsedOutput = JSON.parse(cleanedJson);
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
