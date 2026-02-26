import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin (or Service Role) for server-side persistence
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        const { message, characterId, conversationId } = await req.json();

        // 1. Verify Session (Using standard client check or JWT)
        // For simplicity in this direct migration, we expect the user ID to be passed or extracted
        // Recommendation: Pass the JWT in headers and verify here
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Character Prompt
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (charError || !character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        // 3. Construct System Prompt
        const systemPrompt = `
      Character Name: ${character.name}
      Character Personality: ${character.personality_prompt}
      
      Safety Instructions: This is a safe chat environment for all ages. Maintain appropriate boundaries, do not share dangerous content, and always stay in character.
    `;

        // 4. Call Gemini
        const model = (genAI as any).getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // Construct the full prompt for non-streaming
        const prompt = `${systemPrompt}\n\nUser: ${message}`;

        // Note: Streaming is handled differently in Serverless. For now, solid response.
        const result = await model.generateContent(message);
        const reply = result.response.text();

        // 5. Store Messages
        await supabase.from('messages').insert([
            {
                character_id: characterId,
                user_id: user.id,
                text: message,
                sender: 'user',
                timestamp: Date.now(),
                conversation_id: conversationId
            },
            {
                character_id: characterId,
                user_id: user.id,
                text: reply,
                sender: 'ai',
                timestamp: Date.now(),
                conversation_id: conversationId
            }
        ]);

        // 6. Return Response
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
