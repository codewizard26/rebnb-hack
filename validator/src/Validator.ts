// Validator.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { HederaLangchainToolkit, coreAccountPlugin } from 'hedera-agent-kit';
import { image_system_prompt, text_system_prompt } from './system_prompt';
import { createLLM, ValidationResult } from './sharedUtils';

export class Validator {
  private client: Client | null = null;

  constructor() {
    // Initialize Hedera client
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      throw new Error("HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY not found in environment variables");
    }

    this.client = Client.forTestnet().setOperator(
      process.env.HEDERA_ACCOUNT_ID!,
      PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!),
    );
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

    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }

    // Initialize AI model
    const llm = createLLM();

    const hederaAgentToolkit = new HederaLangchainToolkit({
      client: this.client,
      configuration: {
        plugins: [coreAccountPlugin],
      },
    });

    // Build prompt template for multimodal input
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", image_system_prompt],
      ["placeholder", "{chat_history}"],
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
      ["placeholder", "{agent_scratchpad}"],
    ]);

    // Tools from Hedera toolkit
    const tools = hederaAgentToolkit.getTools();

    // Create agent + executor
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });

    // Run the agent with image input
    console.log("🤖 Running image validation...");
    try {
      const response = await agentExecutor.invoke({
        input: textPrompt,
        image_url: `${imageInput}`,
        chat_history: [],
      });

      console.log("\n✅ Image Validation Result:");
      console.log("Raw Output:", response.output);

      try {
        const parsedOutput = JSON.parse(response.output);
        console.log("Parsed JSON Output:", parsedOutput);
        return parsedOutput;
      } catch (parseError) {
        console.error("❌ Failed to parse LLM output as JSON:", parseError);
        console.error("Malformed JSON received:", response.output);
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

    if (!this.client) {
      throw new Error("Hedera client not initialized");
    }

    // Initialize AI model
    const llm = createLLM();

    const hederaAgentToolkit = new HederaLangchainToolkit({
      client: this.client,
      configuration: {
        plugins: [coreAccountPlugin],
      },
    });

    // Build prompt template for text-only validation
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", text_system_prompt],
      ["placeholder", "{chat_history}"],
      ["human", "Validate this text: {input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    // Tools from Hedera toolkit
    const tools = hederaAgentToolkit.getTools();

    // Create agent + executor
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });

    // Run the agent with text input
    console.log("🤖 Running text validation...");
    try {
      const response = await agentExecutor.invoke({
        input: textInput,
        chat_history: [],
      });

      console.log("\n✅ Text Validation Result:");
      console.log("Raw Output:", response.output);

      try {
        const parsedOutput = JSON.parse(response.output);
        console.log("Parsed JSON Output:", parsedOutput);
        return parsedOutput;
      } catch (parseError) {
        console.error("❌ Failed to parse LLM output as JSON:", parseError);
        console.error("Malformed JSON received:", response.output);
        return { error: "Failed to parse JSON response" };
      }
    } catch (error) {
      console.error("❌ Error during text validation:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Closes the Hedera client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
      console.log("Hedera client closed.");
      this.client = null;
    }
  }
}

// Export individual functions for backward compatibility
export { validateImage } from './imageValidator';
export { validateText } from './chatValidator';
