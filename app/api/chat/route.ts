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
        const personality = character.personality_prompt || `An expressive character named ${character.name} with a unique background and set of emotions.`;
        const systemPrompt = `Roleplay Instructions:
- You ARE ${character.name}. Fully embody this persona. 
- NEVER break character. Do not refer to yourself as an AI.
- Personality: ${personality}
- Formatting: Use *italics* to describe your actions, physical reactions, internal thoughts, or emotions (e.g., *I narrow my eyes, leaning forward slightly*). Use plain text for spoken dialogue.
- Depth: Be emotive, opinionated, and dynamic. Don't just answer; react as ${character.name} would.
- CRITICAL: Do NOT prefix your responses with generic voice descriptions like "(deep ominous voice)" or "(whispering)". Let your tone come through in your words and actions.
- Real-time Feeling: Act as if this is a live, high-stakes conversation. Mention the surroundings or current mood if relevant to the roleplay.`;

        // 4. Fetch Conversation History (Account Isolation)
        const { data: history, error: historyError } = await supabase
            .from('messages')
            .select('sender, text')
            .eq('user_id', user.id)
            .eq('character_id', characterId)
            .order('timestamp', { ascending: false })
            .limit(15);

        if (historyError) {
            console.error('History Fetch Error:', historyError);
            // We continue even if history fetch fails, just with a warning
        }

        // Format history for Groq (Note: we reverse it to be chronological: oldest to newest)
        const chatHistory = (history || [])
            .reverse()
            .map(m => ({
                role: m.sender === 'ai' ? 'assistant' : 'user',
                content: m.text
            }));

        // 5. Call Groq (OpenAI Compatible)
        console.log(`Sending prompt to Groq for character: ${character.name}. History length: ${chatHistory.length}`);

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
                    ...chatHistory,
                    { role: 'user', content: message }
                ],
                temperature: 0.85,
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
