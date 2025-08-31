# Permalink Feature Documentation

## Overview
The permalink feature allows users to share their Duckie Says prompts and responses via URLs. Since the application doesn't use a database, all data needed to recreate a session (prompt and response) is encoded directly into the URL.

## How It Works

### Creating a Permalink
1. User submits a prompt to Duckie
2. The application receives the response from LM Studio
3. Both the prompt and response are serialized into JSON format
4. The JSON is encoded using URL-safe Base64 encoding
5. The encoded string is added as a query parameter `p` to the current URL

### Loading a Permalink
1. When loading a page with a `p` parameter in the URL:
   - The JavaScript parses the parameter from the URL
   - It decodes and parses the Base64 encoded data back into prompt/response JSON
   - If valid, it populates the textarea with the prompt and displays the response
2. The application automatically submits the stored prompt to get the same response

## Implementation Details

### Encoding Process
- JSON serialization of `{prompt, response}` object
- URL-safe Base64 encoding:
  - `+` becomes `-`
  - `/` becomes `_`
  - `=` is removed
- Encoded string stored as URL parameter: `?p=...`

### Decoding Process  
- Base64 decoding with reverse transformations
- JSON parsing to reconstruct object
- Prompt and response values extracted

### URL Format
```
https://duckiesays.com/?p=eyJwcm9tcHQiOiJIZWxsbyB3b3JsZCIsInJlc3BvbnNlIjoiQW5zd2VyIGhlcmUifQ
```

## Security Considerations
- Since the data is in the URL, it's visible to anyone who sees the link
- The data is not encrypted - this is intended behavior for sharing purposes
- For long prompts/responses, the URL might become quite long

## Limitations
- URLs have length limitations (browser dependent)
- Very large prompts or responses may exceed URL capacity 
- Special characters in text are properly encoded
```
