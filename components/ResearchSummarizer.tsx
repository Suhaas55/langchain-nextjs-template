"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, MessageSquare, Link as LinkIcon } from "lucide-react";

export default function ResearchSummarizer() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<"full" | "tldr" | "bullet">("full");
  const [isIngested, setIsIngested] = useState(false);
  const [inputType, setInputType] = useState<"text" | "url">("text");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat/retrieval",
    body: {
      summaryType,
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setError(error.message);
      setDebugInfo(error);
    },
  });

  const handleIngest = async () => {
    if (!text) {
      setError("Please enter some text or URL to summarize");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      let content = text;
      
      // If URL is provided, fetch the content
      if (inputType === "url") {
        const response = await fetch("/api/fetch-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: text }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch URL content");
        }

        content = data.content;
      }

      // Ingest the content
      const response = await fetch("/api/retrieval/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to ingest text");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to process text");
      }

      setText("");
      setIsIngested(true);
    } catch (err: any) {
      console.error("Error during ingestion:", err);
      setError(err.message || "An unexpected error occurred");
      setDebugInfo({
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Input Section */}
      <Card className="md:col-span-2 bg-gray-800 border-green-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <FileText className="h-5 w-5" />
            Research Input
          </CardTitle>
          <CardDescription className="text-green-100">
            Paste your research paper, article, or text below for analysis
          </CardDescription>
          <Tabs
            defaultValue="text"
            onValueChange={(value) => setInputType(value as "text" | "url")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-green-600">
              <TabsTrigger value="text" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Paste Text
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Summarize URL
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {inputType === "text" ? (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your research text here..."
              className="h-64 mb-4 font-mono text-sm bg-gray-900 border-green-600 text-green-100 placeholder-green-400"
            />
          ) : (
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter article URL..."
              className="mb-4 bg-gray-900 border-green-600 text-green-100 placeholder-green-400"
            />
          )}
          <div className="flex justify-between items-center">
            <Button
              onClick={handleIngest}
              disabled={isLoading || !text}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isIngested ? (
                "Update Text"
              ) : (
                "Analyze Text"
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-800">
              <p className="text-red-400 font-semibold mb-2">Error:</p>
              <p className="text-red-300">{error}</p>
              {debugInfo && (
                <div className="mt-2">
                  <p className="text-red-300 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Section */}
      {isIngested && (
        <Card className="md:col-span-2 bg-gray-800 border-green-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <MessageSquare className="h-5 w-5" />
              Research Summary
            </CardTitle>
            <CardDescription className="text-green-100">
              Choose your preferred summary format
            </CardDescription>
            <div className="flex gap-4 mt-2">
              <Button
                variant={summaryType === "full" ? "default" : "outline"}
                onClick={() => setSummaryType("full")}
                className={summaryType === "full" ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-100"}
              >
                Full Summary
              </Button>
              <Button
                variant={summaryType === "tldr" ? "default" : "outline"}
                onClick={() => setSummaryType("tldr")}
                className={summaryType === "tldr" ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-100"}
              >
                TL;DR
              </Button>
              <Button
                variant={summaryType === "bullet" ? "default" : "outline"}
                onClick={() => setSummaryType("bullet")}
                className={summaryType === "bullet" ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-100"}
              >
                Bullet Points
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.role === "assistant"
                      ? "bg-green-900/20 border border-green-800"
                      : "bg-gray-900/50 border border-green-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-100">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a specific question about the research..."
                className="flex-1 bg-gray-900 border-green-600 text-green-100 placeholder-green-400"
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Ask
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 