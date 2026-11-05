import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, baseUrl, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Please enter an API Key to test.' },
        { status: 400 }
      );
    }

    const testUrl = baseUrl || 'https://api.together.xyz/v1';
    const testModel = model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

    const client = new OpenAI({
      apiKey: apiKey.trim(),
      baseURL: testUrl.trim(),
      dangerouslyAllowBrowser: false,
    });

    // Make a lightweight completion test
    const response = await client.chat.completions.create({
      model: testModel,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5,
    });

    return NextResponse.json({
      ok: true,
      message: `Connection successful! Model "${testModel}" responded.`,
      model: testModel,
    });
  } catch (err: any) {
    const message = err?.message || 'Failed to connect to LLM provider.';
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}

