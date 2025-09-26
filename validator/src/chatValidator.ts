// chatValidator.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { HederaLangchainToolkit, coreAccountPlugin } from 'hedera-agent-kit';
import { text_system_prompt } from './system_prompt';
import { createLLM, ValidationResult } from './sharedUtils';

// Function for text-only validation
export async function validateText(textPrompt: string): Promise<ValidationResult> {
  console.log("🔍 Text Validator Starting...");
  console.log(`📝 Text prompt: ${textPrompt}`);

  // Initialize AI model
  const llm = createLLM();

  // Hedera client setup
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    console.error("❌ HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_ACCOUNT_ID!,
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!),
  );

  const hederaAgentToolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      plugins: [coreAccountPlugin],
    },
  });

  // Build prompt template for text-only validation
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", text_system_prompt],
    ["human", "Validate this text: {input}"],
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
      input: textPrompt,
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
  } finally {
    if (client) {
      client.close();
      console.log("Hedera client closed.");
    }
  }
}
