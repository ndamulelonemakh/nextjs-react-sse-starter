"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';

const PROTOCOL = {
  TEXT: "TEXT:",
  FUNC_REQ: "FUNC:",
  FUNC_RES: "RESP:",
  META: "META:",
  DEBUG: "DEBUG:"
};

type CustomStreamEvent = {
  type: 'text' | 'function-call' | 'function-response' | 'metadata' | 'debug';
  data: any;
  timestamp: string;
  raw: string;
};

type FunctionRegistry = {
  [key: string]: (args: any) => Promise<any> | any;
};

export default function CustomProtocolDemo() {
  const [userInput, setUserInput] = useState('What\'s the weather in San Francisco?');
  const [responseText, setResponseText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<CustomStreamEvent[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const functionRegistry: FunctionRegistry = {
    get_current_weather: async (args) => {
      console.log("Client-side weather function called with:", args);
      return {
        temperature: 72,
        conditions: "Sunny",
        location: `${args.latitude}, ${args.longitude}`
      };
    }
  };

  const parseStreamLine = (line: string): CustomStreamEvent | null => {
    if (!line.trim()) return null;

    const timestamp = new Date().toISOString();

    if (line.startsWith(PROTOCOL.TEXT)) {
      const data = line.slice(PROTOCOL.TEXT.length).trim();
      try {
        const parsed = JSON.parse(data);
        return {
          type: 'text',
          data: parsed,
          timestamp,
          raw: line
        };
      } catch (e) {
        console.error("Failed to parse TEXT data:", data);
        return null;
      }
    }
    else if (line.startsWith(PROTOCOL.FUNC_REQ)) {
      const data = line.slice(PROTOCOL.FUNC_REQ.length).trim();
      try {
        const parsed = JSON.parse(data);
        return {
          type: 'function-call',
          data: parsed,
          timestamp,
          raw: line
        };
      } catch (e) {
        console.error("Failed to parse FUNC_REQ data:", data);
        return null;
      }
    }
    else if (line.startsWith(PROTOCOL.FUNC_RES)) {
      const data = line.slice(PROTOCOL.FUNC_RES.length).trim();
      try {
        const parsed = JSON.parse(data);
        return {
          type: 'function-response',
          data: parsed,
          timestamp,
          raw: line
        };
      } catch (e) {
        console.error("Failed to parse FUNC_RES data:", data);
        return null;
      }
    }
    else if (line.startsWith(PROTOCOL.META)) {
      const data = line.slice(PROTOCOL.META.length).trim();
      try {
        const parsed = JSON.parse(data);
        return {
          type: 'metadata',
          data: parsed,
          timestamp,
          raw: line
        };
      } catch (e) {
        console.error("Failed to parse META data:", data);
        return null;
      }
    }
    else if (line.startsWith(PROTOCOL.DEBUG)) {
      const data = line.slice(PROTOCOL.DEBUG.length).trim();
      try {
        const parsed = JSON.parse(data);
        return {
          type: 'debug',
          data: parsed,
          timestamp,
          raw: line
        };
      } catch (e) {
        console.error("Failed to parse DEBUG data:", data);
        return null;
      }
    }

    return null;
  };

  const processEvent = async (event: CustomStreamEvent) => {
    setEvents(prev => [...prev, event]);

    switch (event.type) {
      case 'text':
        // Append text to the response
        setResponseText(prev => prev + (event.data || ''));
        break;

      case 'function-call':
        // Handle function call request
        const { name, id, arguments: args } = event.data;

        if (functionRegistry[name]) {
          try {
            // This would be where you execute the function and send the result back
            // In a real implementation, you'd send this back to the backend
            console.log(`Would execute function: ${name} with args:`, args);
          } catch (e) {
            console.error(`Error executing function ${name}:`, e);
          }
        } else {
          console.warn(`Function ${name} not found in registry`);
        }
        break;

      case 'metadata':
        // Handle metadata (like completion)
        console.log("Stream completed with metadata:", event.data);
        break;

      case 'debug':
        // Log debug information
        console.debug("Debug info:", event.data);
        break;
    }
  };

  const startStream = async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setResponseText('');
    setEvents([]);

    abortControllerRef.current = new AbortController();

    try {
      // In a real implementation, you'd call your custom endpoint
      // This is just a simulation to demonstrate the concept
      console.log("Starting custom protocol stream with input:", userInput);

      // Simulate the streaming response with our custom protocol
      // In a real app, you'd fetch from your custom endpoint
      const simulateStream = async function* () {
        yield `${PROTOCOL.DEBUG} ${JSON.stringify({ event: 'stream_start' })}\n`;
        yield `${PROTOCOL.TEXT} ${JSON.stringify("I'll check the weather in San Francisco for you.")}\n`;
        yield `${PROTOCOL.FUNC_REQ} ${JSON.stringify({ id: "func_123", name: "get_current_weather", arguments: { latitude: 37.7749, longitude: -122.4194 } })}\n`;
        yield `${PROTOCOL.FUNC_RES} ${JSON.stringify({ id: "func_123", name: "get_current_weather", success: true, result: { temperature: 68, conditions: "Foggy" } })}\n`;
        yield `${PROTOCOL.TEXT} ${JSON.stringify(" The current temperature in San Francisco is ")}\n`;
        yield `${PROTOCOL.TEXT} ${JSON.stringify("68°F")}\n`;
        yield `${PROTOCOL.TEXT} ${JSON.stringify(" with foggy conditions.")}\n`;
        yield `${PROTOCOL.META} ${JSON.stringify({ finishReason: "stop", tokens: { prompt: 54, completion: 42, total: 96 } })}\n`;
      };

      // Process the stream
      for await (const chunk of simulateStream()) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        // Split by newlines and process each line
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const event = parseStreamLine(line);
            if (event) {
              await processEvent(event);
            }
          }
        }

        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const getEventColor = (type: CustomStreamEvent['type']) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'function-call': return 'bg-orange-100 text-orange-800';
      case 'function-response': return 'bg-green-100 text-green-800';
      case 'metadata': return 'bg-purple-100 text-purple-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4"><Link target='__blank' href="https://platform.openai.com/docs/guides/streaming-responses?api-mode=chat">OpenAI</Link> SSE Streaming Demo</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Your message:</label>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask about the weather..."
          rows={2}
          className="w-full mb-2"
        />

        <div className="flex gap-2">
          <Button
            onClick={startStream}
            disabled={isStreaming}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Stream
          </Button>

          <Button
            onClick={stopStream}
            disabled={!isStreaming}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Stop Stream
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-slate-900 text-white h-64 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <div className="whitespace-pre-wrap">{responseText}</div>
        </div>

        <div className="border rounded-lg p-4 bg-slate-900 text-white h-64 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Events:</h2>
          <div className="space-y-2">
            {events.map((event, i) => (
              <div key={i} className="border border-slate-700 rounded p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded ${getEventColor(event.type)}`}>
                    {event.type.toUpperCase()}
                  </span>
                  <span className="text-gray-400">{event.timestamp}</span>
                </div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-gray-400 italic">No events yet. Click "Start Stream" to begin.</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-800 text-white rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Custom Protocol Format</h3>
        <p className="text-sm mb-3">
          This demo uses a custom protocol for streaming AI responses with prefix-based events:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Stream Format:</h4>
            <ul className="space-y-1 text-sm">
              <li><span className="font-mono bg-blue-600 text-white px-2 py-0.5 rounded mr-2">TEXT:</span> Content tokens from the AI</li>
              <li><span className="font-mono bg-orange-600 text-white px-2 py-0.5 rounded mr-2">FUNC:</span> Function call requests</li>
              <li><span className="font-mono bg-green-600 text-white px-2 py-0.5 rounded mr-2">RESP:</span> Function execution results</li>
              <li><span className="font-mono bg-purple-600 text-white px-2 py-0.5 rounded mr-2">META:</span> Stream metadata (completion, tokens)</li>
              <li><span className="font-mono bg-gray-600 text-white px-2 py-0.5 rounded mr-2">DEBUG:</span> Debug information</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Example:</h4>
            <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
              {`TEXT: "I'll check the weather"
FUNC: {"name": "get_weather", "args": {"city": "SF"}}
RESP: {"name": "get_weather", "result": {"temp": 72}}
TEXT: "It's 72 degrees in SF"
META: {"finishReason": "stop", "tokens": 45}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
