# Copilot Instructions

This document provides guidance for AI agents to effectively contribute to the `nextjs-react-sse-starter` project.

## Architecture Overview

This project is a monorepo with two main parts:

1.  **Next.js Frontend (`app/`)**: A React-based frontend using Next.js and the App Router. It's responsible for rendering the UI and handling client-side interactions.
2.  **FastAPI Backend (`api/`)**: A Python-based backend using the FastAPI framework. It serves the API endpoints, particularly for handling Server-Sent Events (SSE) streaming.

The frontend and backend communicate primarily through SSE, allowing the server to push real-time updates to the client. The project is configured for deployment on Vercel, where the `api/` directory is deployed as Serverless Functions.

## Developer Workflow

### Initial Setup

1.  Install Node.js dependencies:
    ```bash
    pnpm install
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env.local` file in the root directory and add your OpenAI API key:
    ```
    OPENAI_API_KEY=your_key_here
    ```

### Running the Application

-   To run both the frontend and backend concurrently for development, use:
    ```bash
    pnpm run dev:all
    ```
-   To run only the frontend:
    ```bash
    pnpm run dev
    ```
-   To run only the backend:
    ```bash
    pnpm run backend:dev
    ```

The application will be available at `http://localhost:3000`.

## Key Components and Patterns

### Backend (`api/`)

-   **API Entrypoint**: The main FastAPI application is defined in `api/index.py`. New API routes, especially for streaming, should be added here.
-   **SSE Streaming**: The core of the backend is its ability to stream data using SSE. The backend uses `StreamingResponse` from FastAPI to send events.
-   **Custom Streaming Protocol**: This project uses a custom, human-readable protocol for SSE messages, defined in files under `api/utils/`. The protocol uses prefixes like `TEXT:`, `FUNC:`, and `RESP:` to denote different types of messages. When adding new streaming features, adhere to this semantic protocol.
    -   `TEXT:`: For content tokens.
    -   `FUNC:`: For function calls.
    -   `RESP:`: For function results.
-   **Function Calling**: The backend can send `FUNC:` events to instruct the client to perform actions, demonstrating AI function-calling capabilities over a stream.

### Frontend (`app/`)

-   **UI Components**: The UI is built with React, Tailwind CSS, and shadcn/ui components, which can be found in `components/ui/`.
-   **Consuming SSE Streams**: The frontend uses the browser's native `EventSource` API or the `fetch-event-source` library to connect to the backend's SSE endpoints.
-   **Debug Console**: The `app/debug/page.tsx` file provides a great example of how to connect to and visualize raw SSE streams. Use this as a reference when implementing new client-side stream handling.

### Adding New Features

-   **New Streaming Endpoint**: To add a new streaming feature, you would typically:
    1.  Create a new endpoint in `api/index.py` that returns a `StreamingResponse`.
    2.  Implement the streaming logic, using the custom protocol prefixes.
    3.  Create a new page in the `app/` directory to consume the stream.
    4.  Use `EventSource` or `fetch-event-source` on the new page to connect to the endpoint and handle the incoming messages.
