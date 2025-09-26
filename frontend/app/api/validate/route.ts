import { NextRequest, NextResponse } from 'next/server';
import { Validator } from '../../../../validator/src/Validator';

export async function POST(request: NextRequest) {
  try {
    const { type, data, prompt } = await request.json();

    const validator = new Validator();
    let result;

    if (type === 'text') {
      result = await validator.validateText(data);
    } else if (type === 'image') {
      result = await validator.validateImage(data, prompt);
    } else {
      return NextResponse.json(
        { error: 'Invalid validation type. Must be "text" or "image"' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during validation' },
      { status: 500 }
    );
  }
}
