# AI Validator

A TypeScript class-based validator for text and image content using AI analysis with Hedera integration.

## Features

- **Text Validation**: Validates text content for appropriateness, quality, and safety
- **Image Validation**: Analyzes images for content, quality, and compliance
- **Hedera Integration**: Built with Hedera blockchain integration
- **TypeScript Support**: Full TypeScript support with type definitions

## Installation

```bash
pnpm install
```

## Environment Setup

Create a `.env` file with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
HEDERA_ACCOUNT_ID=your_hedera_account_id
HEDERA_PRIVATE_KEY=your_hedera_private_key
```

## Usage

### Using the Validator Class

```typescript
import { Validator } from './src/Validator';

async function validateContent() {
  const validator = new Validator();

  try {
    // Validate text
    const textResult = await validator.validateText(
      "Beautiful 2BHK apartment with modern amenities"
    );
    console.log(textResult);

    // Validate image
    const imageResult = await validator.validateImage(
      "https://example.com/image.jpg",
      "Validate this property listing image"
    );
    console.log(imageResult);

  } finally {
    validator.close(); // Always close to clean up resources
  }
}
```

### Command Line Usage

```bash
# Validate text
pnpm run text "Your text to validate"

# Validate image
pnpm run image "https://example.com/image.jpg" "Validation prompt"

# Run example
pnpm run example

# Run tests
pnpm run start
```

## API Reference

### Validator Class

#### Constructor
```typescript
new Validator()
```
Creates a new validator instance. Requires environment variables to be set.

#### Methods

##### `validateText(textInput: string): Promise<ValidationResult>`
Validates text content.

**Parameters:**
- `textInput` (string): The text to validate

**Returns:**
- `Promise<ValidationResult>`: Validation result object

##### `validateImage(imageInput: string, textPrompt: string): Promise<ValidationResult>`
Validates image content.

**Parameters:**
- `imageInput` (string): URL or path to the image
- `textPrompt` (string): Description of what to validate in the image

**Returns:**
- `Promise<ValidationResult>`: Validation result object

##### `close(): void`
Closes the Hedera client connection and cleans up resources.

### ValidationResult Interface

```typescript
interface ValidationResult {
  validation_status: "PASS" | "FAIL" | "REVIEW_REQUIRED";
  reasoning_summary: string;
  image_check?: "PASS" | "FAIL" | "NA";  // Only for image validation
  text_check?: "PASS" | "FAIL" | "NA";   // Only for text validation
  error?: string;                         // If validation failed
}
```

## Examples

### Text Validation
```typescript
const validator = new Validator();
const result = await validator.validateText("Sample property listing text");
// Returns: { validation_status: "PASS", reasoning_summary: "...", text_check: "PASS" }
```

### Image Validation
```typescript
const validator = new Validator();
const result = await validator.validateImage(
  "https://drive.google.com/uc?export=view&id=FILE_ID",
  "Validate this property listing image"
);
// Returns: { validation_status: "PASS", reasoning_summary: "...", image_check: "PASS" }
```

## Error Handling

The validator includes comprehensive error handling:

- **API Errors**: Handles OpenAI API errors with detailed logging
- **JSON Parsing**: Gracefully handles malformed JSON responses
- **Network Issues**: Manages connection problems
- **Resource Cleanup**: Ensures proper cleanup of Hedera connections

## Development

```bash
# Run in development mode with watch
pnpm run dev

# Run specific validation
pnpm run text "Your text"
pnpm run image "image_url" "prompt"
```