# Minimind

Minimind is a full-stack character-based AI chat application where users can sign up, log in, chat with curated personas, and create/import their own custom characters.

The project combines real-time conversational UX, secure authentication, and server-side AI orchestration.

## Why I Built It

I built Minimind to explore how to deliver a production-style AI experience with:
- strong persona control and consistent character behavior,
- account-level data isolation,
- secure API key handling through server-side routes,
- and a polished, interactive frontend.

## Core Features

- User authentication with Supabase (email/password and Google OAuth)
- Protected app flow: users authenticate before accessing chat and character management
- Curated and user-created character system with:
  - editable bios and personality prompts
  - categories and tags
  - favorites
  - character import flow
- Conversation memory by injecting recent message history into prompts
- Server-side AI proxy route for secure model calls (no secret keys exposed in browser)
- Theme support (light/dark), responsive UI, and persistent client preferences

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Supabase (Auth + Postgres + user-scoped data access)
- Serverless API route (`app/api/chat/route.ts`) for AI request handling
- Tailwind CSS
- LLM provider API integration from backend route

## Architecture Overview

1. Frontend authenticates users with Supabase.
2. Client sends user message and character context to a protected API route.
3. API route validates bearer token with Supabase.
4. API fetches character profile and recent user-specific chat history.
5. API composes a system prompt and calls the LLM provider.
6. API stores both user and assistant messages and returns the assistant reply.

## Security Practices

- API keys are stored server-side in environment variables.
- Auth token is required for chat endpoint access.
- User records are scoped by user ID when fetching and storing messages.
- Sensitive operations run in backend routes, not in client code.

## Engineering Highlights

- Multi-user isolation and authenticated access patterns
- Reusable component architecture (`AuthForms`, `ChatWindow`, `CharacterSelector`, and more)
- End-to-end data flow from UI -> API -> model -> database -> UI
- Robust error handling for auth, configuration, and LLM-provider failures

## Challenges and Learnings

- Handling model and API version changes safely
- Designing prompt templates that keep roleplay behavior consistent and natural
- Managing auth-aware UI transitions without disrupting active user sessions

## Future Improvements

- Role-based admin panel for managing a global character catalog
- Streaming responses with improved typing indicators
- Rate limiting and abuse protection on AI endpoints
- Automated tests (unit, integration, and API route tests)
- Analytics for retention, session length, and character engagement

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set required environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
3. Start development server:
   `npm run dev`

## Build and Run Production

1. Build the app:
   `npm run build`
2. Start the production server:
   `npm run start`
