// example.ts - Example usage of the Validator class
import dotenv from 'dotenv';
dotenv.config();

import { Validator } from './src/Validator';

async function example() {
  // Create a new validator instance
  const validator = new Validator();

  try {
    // Example 1: Validate text
    console.log("=== Text Validation Example ===");
    const textResult = await validator.validateText(
      "Beautiful 2BHK apartment with modern amenities, located in downtown area. Rent: $2000/month"
    );
    console.log("Text validation result:", textResult);

    // Example 2: Validate image
    console.log("\n=== Image Validation Example ===");
    const imageResult = await validator.validateImage(
      "https://drive.google.com/uc?export=view&id=13YMcpVKiXP4IqRFQUgrjEciYY1fq9fMF",
      "Validate this property listing image"
    );
    console.log("Image validation result:", imageResult);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Always close the validator to clean up resources
    validator.close();
  }
}

// Run the example
example().catch(console.error);
