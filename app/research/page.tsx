"use client";

import { useState } from "react";
import { useChat } from "ai/react";

export default function ResearchPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat/retrieval",
  });

  const handleIngest = async () => {
    if (!text) {
      setError("Please enter some text to summarize");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/retrieval/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to ingest text");
      }

      // Clear the input after successful ingestion
      setText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Research Summarizer</h1>
      
      {/* Text Input Section */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your research text here..."
          className="w-full h-40 p-2 border rounded-lg mb-2"
        />
        <button
          onClick={handleIngest}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-blue-300"
        >
          {isLoading ? "Processing..." : "Ingest Text"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Chat Interface */}
      <div className="border rounded-lg p-4">
        <div className="mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-2 p-2 rounded-lg ${
                message.role === "assistant"
                  ? "bg-gray-100"
                  : "bg-blue-100"
              }`}
            >
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the research..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
} 