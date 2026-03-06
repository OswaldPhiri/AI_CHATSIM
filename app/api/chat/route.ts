import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    // Check for missing environment variables explicitly
    if (!supabaseUrl) {
        return NextResponse.json({ error: 'Config Error: Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 });
    }
    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Config Error: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }
    if (!groqApiKey) {
        return NextResponse.json({ error: 'Config Error: Missing GROQ_API_KEY. Please get one from console.groq.com' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { message, characterId, conversationId } = await req.json();

        // 1. Verify Session
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: No Auth Header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
        }

        // 2. Fetch Character Prompt
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (charError || !character) {
            console.error('Character Fetch Error:', charError);
            return NextResponse.json({ error: `Character not found: ${characterId}` }, { status: 404 });
        }

        // 3. Construct System Prompt
        const personality = character.personality_prompt || "You are a helpful assistant.";
        const systemPrompt = `Character Name: ${character.name}
Character Personality: ${personality}

Safety Instructions: This is a safe chat environment for all ages. Maintain appropriate boundaries, do not share dangerous content, and always stay in character.`;

        // 4. Call Groq (OpenAI Compatible)
        console.log(`Sending prompt to Groq for character: ${character.name}`);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API Error:', errorData);
            throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content;

        if (!reply) {
            throw new Error('Empty response from Groq');
        }

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
