import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY');
        return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const { message, characterId, conversationId } = await req.json();

        // 1. Verify Session
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Character Prompt
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (charError || !character) {
            console.error('Character Fetch Error:', charError);
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        // 3. Construct System Prompt
        const personality = character.personality_prompt || "You are a helpful assistant.";
        const systemPrompt = `
Character Name: ${character.name}
Character Personality: ${personality}

Safety Instructions: This is a safe chat environment for all ages. Maintain appropriate boundaries, do not share dangerous content, and always stay in character.
`;

        // 4. Call Gemini
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // Construct the full prompt
        const fullPrompt = `${systemPrompt.trim()}\n\nUser: ${message}`;

        console.log(`Sending prompt to Gemini for character: ${character.name}`);

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error('Empty response from AI');
        }

        const reply = responseText;

        // 5. Store Messages
        const { error: insertError } = await supabase.from('messages').insert([
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

        if (insertError) {
            console.error('Database Insert Error:', insertError);
            // We still return the reply to the user even if saving to history fails
        }

        // 6. Return Response
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('Detailed API Error:', error);
        return NextResponse.json({
            error: 'Failed to generate AI response',
            details: error.message
        }, { status: 500 });
    }
}
