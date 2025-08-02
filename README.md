# NextJS React SSE FastAPI Demo

A demonstration of Server-Sent Events (SSE) streaming between a Next.js React frontend and FastAPI Python backend. This repo shows how to implement, customize, and optimize real-time streaming for AI.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-preview-python-streaming&env=OPENAI_API_KEY&envDescription=API%20keys%20needed%20for%20application&project-name=nextjs-react-sse-fastapi-demo&repository-name=nextjs-react-sse-fastapi-demo)

## 🚀 Key Features

- **Raw SSE Protocol Exploration**: See exactly how SSE works under the hood
- **Custom Streaming Protocols**: Create your own message formats and event types
- **Function Calling**: Demonstrate tool/function calling during streaming
- **Interactive Debug Console**: Visualize and inspect every streaming event

## ✨ Why Server-Sent Events?

Server-Sent Events (SSE) provide a simple, efficient way for servers to push data to clients over a single HTTP connection. Unlike WebSockets, SSE:

- Only flows in one direction (server → client)
- Uses standard HTTP, not a separate protocol
- Has built-in reconnection handling
- Works through most firewalls and proxies
- Has native browser support via the EventSource API

This makes SSE ideal for real-time updates like notifications, data feeds, and—as shown in this demo—streaming AI responses.

## 🛠️ Project Structure

```
/
├── api/                  # FastAPI backend
│   ├── index.py          # Main API with streaming endpoints
│   └── utils/            # Helper functions and tools
├── app/                  # Next.js pages
│   ├── debug/            # Raw stream debug console
│   └── page.tsx          # Custom protocol demo
├── components/           # React components
```

## 🔮 Streaming Protocol Examples

This demo showcases multiple approaches to streaming protocols:

### 1. Vercel AI SDK Protocol

The original Vercel AI SDK protocol uses numeric and alphabetic prefixes:

```
0:{"Hello"}             # Content token
9:{"toolCallId":"123"}  # Function call
a:{"result":"data"}     # Function result
e:{"finishReason":"stop"} # End of stream
```

### 2. Custom Semantic Protocol

A more readable custom protocol with meaningful prefixes:

```
TEXT: "Hello there"              # Content token
FUNC: {"name":"get_weather"}     # Function call
RESP: {"result":{"temp":72}}     # Function result
META: {"tokens":45}              # Stream metadata
DEBUG: {"event":"stream_start"}  # Debug information
```

## 🔄 SSE Limitations & Best Practices

- **Connection Limits**: Browsers typically limit to 6 connections per domain in HTTP/1.1
- **Message Size**: No official size limit, but best to send many small messages
- **Timeouts**: Use heartbeat messages to keep connections alive
- **Binary Data**: SSE is text-only (UTF-8); binary data must be encoded
- **Reconnection**: Implement proper reconnection strategies for reliability

## 📚 Advanced Features

### Microsoft SSE Client Library

For production applications, consider using [microsoft/fetch-event-source](https://github.com/microsoft/fetch-event-source), which provides:

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

// More robust connection handling
fetchEventSource('/api/stream', {
  onmessage(event) {
    // Handle each event
    console.log(event.data);
  },
  onerror(err) {
    // Better error handling
  },
  onclose() {
    // Connection closed
  },
  openWhenHidden: true,
  // Many more options!
});
```

## 🚀 Getting Started

To run the example locally you need to:

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   pip install -r requirements.txt
   ```
3. Create `.env.local` with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_key_here
   ```
4. Run the development server:
   ```bash
   pnpm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## 📊 Demo Pages

- **/debug**: Raw SSE protocol visualization
- **/**: Custom streaming protocol demo (main page)

## 📄 License

MIT
