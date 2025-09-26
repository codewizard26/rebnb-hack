// index.ts
import dotenv from 'dotenv';
dotenv.config();

import { validateText } from './src/chatValidator';
import { validateImage } from './src/imageValidator';

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0]; // First argument is the command (text or image)
  const input = args[1]; // Second argument is the input
  const textPrompt = args[2] || "Please validate this content.";

  if (!command || !input) {
    console.log("Usage:");
    console.log("  Text validation: pnpm run validate text 'Your text to validate'");
    console.log("  Image validation (local file): pnpm run validate image /path/to/image.jpg 'Your validation prompt'");
    console.log("  Image validation (URL): pnpm run validate image https://example.com/image.jpg 'Your validation prompt'");
    process.exit(1);
  }

  if (command === "text") {
    await validateText(input);
  } else if (command === "image") {
    await validateImage(input, textPrompt);
  } else {
    console.error("❌ Invalid command. Use 'text' or 'image'");
    process.exit(1);
  }
}

// main().catch(console.error);
validateImage("https://drive.google.com/uc?export=view&id=13YMcpVKiXP4IqRFQUgrjEciYY1fq9fMF", "Validate this property listing image");