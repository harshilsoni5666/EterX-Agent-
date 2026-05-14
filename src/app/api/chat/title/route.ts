import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { history, currentTitle } = await req.json();

    // Auto-discover valid Google API key from the environment
    let apiKey = '';
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value === 'string' && value.startsWith('AIza')) {
        apiKey = value;
        break;
      }
    }
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey });

    // Exact model as requested
    const model = 'gemini-3-flash-preview';

    const prompt = `
      Analyze the chat history below and generate a short, professional, and catchy title representing the CURRENT conversation goal.

      STRICT RULES:
      1. Length: Exactly 2 to 4 words. 
      2. FORMAT: DO NOT use single words. Titles must be multi-word.
      3. SMART UPDATE: If the current title is "New chat", ALWAYS replace it with something specific. 
         Otherwise, if the current title "${ currentTitle }" still accurately reflects the main agenda, return "${ currentTitle }" exactly.
      4. Only return the title string. No punctuation at the end. No markdown.

      CHAT HISTORY:
      ${ JSON.stringify(history.slice(-10)) }
    `.trim();

    const result = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: {
          thinkingLevel: 'minimal' as any,
          includeThoughts: false,
        },
      },
    });

    const candidates = result.candidates || [];
    const titleText = candidates[0]?.content?.parts?.find(p => 'text' in p)?.text || "New chat";
    const title = titleText.trim().replace(/^["']|["']$/g, '').replace(/[.!?]$/, '');

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error('Title generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
