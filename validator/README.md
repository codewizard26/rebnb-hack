# Image Validator

A TypeScript-based validator that can process both text and images using OpenAI's GPT-4o model and Hedera blockchain integration.

## Features

- **Text Validation**: Validate text content using AI
- **Image Validation**: Validate images with optional text prompts
- **Hedera Integration**: Built-in Hedera blockchain tools
- **JSON Output**: Structured validation results

## Usage

### Text Validation
```bash
# Validate text content
pnpm run validate text "Your text to validate"

# Or using the shorthand
pnpm run text "Your text to validate"
```

### Image Validation
```bash
# Validate an image with a custom prompt
pnpm run validate image /path/to/image.jpg "Your validation prompt"

# Or using the shorthand
pnpm run image /path/to/image.jpg "Your validation prompt"
```

## Environment Setup

Create a `.env` file with:
```env
OPENAI_API_KEY=your_openai_api_key_here
HEDERA_ACCOUNT_ID=your_hedera_account_id
HEDERA_PRIVATE_KEY=your_hedera_private_key
```

## Installation

```bash
pnpm install
```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

## Output Format

The validator returns a JSON response:
```json
{
  "validation_status": "PASS" | "FAIL" | "REVIEW_REQUIRED",
  "reasoning_summary": "Brief summary of findings",
  "image_check": "PASS" | "FAIL" | "NA",
  "text_check": "PASS" | "FAIL" | "NA"
}
```

## Examples

```bash
# Text validation
pnpm run text "This is a property listing for a 3-bedroom house"

# Image validation
pnpm run image ./samples/property.jpg "Validate this property listing image"
```
