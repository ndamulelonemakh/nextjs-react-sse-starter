"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface StreamEvent {
    timestamp: string;
    prefix: string;
    data: string;
    parsed?: any;
    type: 'content' | 'tool-call' | 'tool-result' | 'end' | 'unknown';
}

export default function DebugPage() {
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [input, setInput] = useState("What's the weather like in New York?");
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const parseStreamEvent = (line: string): StreamEvent => {
        const timestamp = new Date().toISOString();

        if (line.startsWith('0:')) {
            // Content token
            const data = line.slice(2);
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                parsed = data;
            }
            return {
                timestamp,
                prefix: '0',
                data,
                parsed,
                type: 'content'
            };
        } else if (line.startsWith('9:')) {
            // Tool call request
            const data = line.slice(2);
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                parsed = data;
            }
            return {
                timestamp,
                prefix: '9',
                data,
                parsed,
                type: 'tool-call'
            };
        } else if (line.startsWith('a:')) {
            // Tool call result
            const data = line.slice(2);
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                parsed = data;
            }
            return {
                timestamp,
                prefix: 'a',
                data,
                parsed,
                type: 'tool-result'
            };
        } else if (line.startsWith('e:')) {
            // Stream end
            const data = line.slice(2);
            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                parsed = data;
            }
            return {
                timestamp,
                prefix: 'e',
                data,
                parsed,
                type: 'end'
            };
        } else {
            return {
                timestamp,
                prefix: 'unknown',
                data: line,
                type: 'unknown'
            };
        }
    };

    const startStreaming = async () => {
        setEvents([]);
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: input
                        }
                    ]
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No reader available');
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('Stream completed');
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

                for (const line of lines) {
                    if (line.trim()) {
                        const event = parseStreamEvent(line);
                        setEvents(prev => [...prev, event]);
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                console.error('Stream error:', error);
                setEvents(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    prefix: 'error',
                    data: `Error: ${error}`,
                    type: 'unknown'
                }]);
            }
        } finally {
            setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    const getEventColor = (type: StreamEvent['type']) => {
        switch (type) {
            case 'content': return 'bg-blue-100 text-blue-800';
            case 'tool-call': return 'bg-orange-100 text-orange-800';
            case 'tool-result': return 'bg-green-100 text-green-800';
            case 'end': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEventLabel = (type: StreamEvent['type']) => {
        switch (type) {
            case 'content': return 'CONTENT';
            case 'tool-call': return 'TOOL CALL';
            case 'tool-result': return 'TOOL RESULT';
            case 'end': return 'STREAM END';
            default: return 'UNKNOWN';
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">FastAPI Streaming Debug Console</h1>

            <div className="mb-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Test Message:</label>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter your message..."
                        className="w-full"
                        rows={3}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={startStreaming}
                        disabled={isStreaming}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isStreaming ? 'Streaming...' : 'Start Stream'}
                    </Button>
                    <Button
                        onClick={stopStreaming}
                        disabled={!isStreaming}
                        variant="destructive"
                    >
                        Stop Stream
                    </Button>
                    <Button
                        onClick={clearEvents}
                        variant="outline"
                    >
                        Clear Events
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-900 text-white min-h-[500px]">
                <h2 className="text-xl font-semibold mb-4">
                    Raw Stream Events ({events.length})
                </h2>

                {events.length === 0 ? (
                    <p className="text-gray-300 italic">No events yet. Click "Start Stream" to begin.</p>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {events.map((event, index) => (
                            <div key={index} className="border border-slate-700 rounded p-3 bg-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs text-gray-300 font-mono">
                                        {event.timestamp}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getEventColor(event.type)}`}>
                                        {getEventLabel(event.type)}
                                    </span>
                                    <span className="text-xs font-mono bg-gray-200 text-gray-900 px-1 py-0.5 rounded">
                                        Prefix: {event.prefix}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Raw Data:</h4>
                                        <pre className="text-xs bg-gray-100 text-gray-900 p-2 rounded overflow-x-auto font-mono border border-gray-300">
                                            {event.data}
                                        </pre>
                                    </div>

                                    {event.parsed && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Parsed JSON:</h4>
                                            <pre className="text-xs bg-blue-50 text-blue-900 p-2 rounded overflow-x-auto font-mono border border-blue-200">
                                                {JSON.stringify(event.parsed, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-gray-800 text-white border border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Stream Protocol Legend:</h3>
                <ul className="text-sm space-y-2">
                    <li><span className="font-mono bg-blue-600 text-white px-2 py-0.5 rounded mr-2">0:</span> Content tokens from the AI model</li>
                    <li><span className="font-mono bg-orange-600 text-white px-2 py-0.5 rounded mr-2">9:</span> Tool call requests with function name and arguments</li>
                    <li><span className="font-mono bg-green-600 text-white px-2 py-0.5 rounded mr-2">a:</span> Tool call results after function execution</li>
                    <li><span className="font-mono bg-purple-600 text-white px-2 py-0.5 rounded mr-2">e:</span> Stream end with finish reason and token usage</li>
                </ul>
            </div>
        </div>
    );
}
