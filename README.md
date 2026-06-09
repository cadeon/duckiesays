# Duckie Says

A rubber duck oracle. Ask it anything — get a short, thought-provoking aphorism back.

## What It Does

Duckie Says is a minimal web app that wraps an LLM in a rubber duck interface. Type a prompt, hit Enter or click the duck, get back a one- or two-sentence response that actually relates to what you said. No generic platitudes — it grounds every answer in your specific prompt.

It also accepts URLs as prompts: paste a link and Duckie reads the page, strips HTML, and responds to the content.

## Architecture

```
┌──────────────┐     POST /api/v2/thinks      ┌──────────────┐
│   Browser     │ ────────────────────────────► │  Koa Server   │
│  (index.html) │ ◄──────────────────────────── │  (server.js)  │
└──────────────┘     { says: "..." }           └──────┬───────┘
                                                       │
                                              fetch() to LLM API
                                              (OpenAI-compatible)
```

- **Frontend**: Vanilla HTML/CSS/JS with jQuery for AJAX. Single page, no build step.
- **Backend**: Koa.js, single endpoint `POST /api/v2/thinks`
- **LLM**: OpenAI-compatible chat completions API (any provider)
- **Deployment**: Docker, runs on port 3000

## API

### `POST /api/v2/thinks`

Ask the duck for wisdom.

**Request:**
```json
{ "prompt": "your question or statement" }
```

**Response:**
```json
{ "says": "The duck's response." }
```

**Error responses:**
- `400` — Missing or empty prompt, or prompt exceeds 1000 characters
- `504` — LLM request timed out
- `500` — LLM API error

**URL prompts:** If the prompt starts with `http://` or `https://`, Duckie fetches the page text (strips HTML/JS/CSS, 10s timeout) and responds to the content instead.

## Configuration

All via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `LLM_API_URL` | `https://llm.not-really.me/v1/chat/completions` | LLM endpoint |
| `LLM_API_KEY` | *(none)* | Bearer token for LLM (optional) |
| `LLM_MODEL` | `qwen-35b-a3b` | Model name |

### System Prompt

The duck's personality is defined in `config/config.js`. It instructs the LLM to:
- Respond in 1–2 sentences
- Address the user's specific prompt
- Deliver as an aphorism or fortune-cookie-style saying
- Avoid generic platitudes

### LLM Parameters

| Parameter | Value |
|-----------|-------|
| `max_tokens` | 100 |
| `temperature` | 1.2 |

## Running

### Docker (recommended)

```bash
docker compose up -d
```

Access at `http://localhost:3999` (mapped to container port 3000).

### Local development

```bash
npm install
npm run dev
```

Access at `http://localhost:3000`.

### Production

```bash
npm install --only=production
npm start
```

## Project Structure

```
├── app/
│   ├── controllers/
│   │   └── thinks.server.controller.js   # LLM call, URL fetching, response logic
│   └── routes/
│       └── thinks.server.routes.js       # Route definition
├── config/
│   └── config.js                         # Server config, LLM settings, system prompt
├── public/
│   ├── index.html                        # Frontend UI
│   ├── img/                              # Duck icons
│   └── js/
├── utils/
│   └── conversationLogger.js             # Conversation logging
├── server.js                             # Koa app entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## License

MIT
