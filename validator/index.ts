// index.ts
import dotenv from 'dotenv';
dotenv.config();

import { Validator } from './src/Validator';

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

  const validator = new Validator();

  try {
    if (command === "text") {
      await validator.validateText(input);
    } else if (command === "image") {
      await validator.validateImage(input, textPrompt);
    } else {
      console.error("❌ Invalid command. Use 'text' or 'image'");
      process.exit(1);
    }
  } finally {
    validator.close();
  }
}

// main().catch(console.error);

// Test both validators
async function testValidators() {
  const validator = new Validator();

  try {
    // Test image validation
    console.log("=== Testing Image Validation ===");
    await validator.validateImage(
      "https://fastly.picsum.photos/id/165/536/354.jpg?hmac=3U0MeDyOPgSqPmDhXtEZRTWV80bfX3cmko0I2uXX244", 
      "Validate this property listing image"
    );

    // Test text validation
    console.log("\n=== Testing Text Validation ===");
    await validator.validateText("Beautiful 2BHK apartment with modern amenities, located in downtown area. Rent: $10000/month");
  } finally {
    validator.close();
  }
}

// Run tests
testValidators().catch(console.error);