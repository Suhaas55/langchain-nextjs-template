import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { createOpenRouterChat, getFallbackModel } from "@/lib/llm/openrouter";
import { createVectorStore } from "@/lib/vector-store/supabase";
import { summaryPrompt, tldrPrompt, bulletPrompt } from "@/lib/prompts/summary";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const runtime = "edge";

// Helper to combine retrieved documents
const combineDocumentsFn = (docs: any[]) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Helper to format chat history
const formatVercelMessages = (messages: VercelChatMessage[]) => {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, summaryType = "full" } = body;
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    // Initialize LLM with fallback support
    let model = createOpenRouterChat();
    let retryCount = 0;
    const maxRetries = 2;

    // Get vector store instance
    const vectorstore = await createVectorStore();

    // Create retriever
    const retriever = vectorstore.asRetriever({
      k: 5, // Number of chunks to retrieve
    });

    // Select prompt based on summary type
    const getPrompt = () => {
      switch (summaryType) {
        case "tldr":
          return tldrPrompt;
        case "bullet":
          return bulletPrompt;
        default:
          return summaryPrompt;
      }
    };

    // Create summarization chain
    const summarizationChain = RunnableSequence.from([
      {
        context: retriever.pipe(combineDocumentsFn),
      },
      getPrompt(),
      model,
      new StringOutputParser(),
    ]);

    // Execute chain with retry logic
    let result;
    while (retryCount <= maxRetries) {
      try {
        result = await summarizationChain.invoke({
          question: currentMessageContent,
        });
        break;
      } catch (error) {
        if (retryCount === maxRetries) throw error;
        model = createOpenRouterChat(getFallbackModel(model.modelName));
        retryCount++;
      }
    }

    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(result);
        controller.close();
      },
    });

    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
      },
    });
  } catch (e: any) {
    console.error("Error during summarization:", e);
    return NextResponse.json(
      { 
        error: e.message,
        details: "Failed to generate summary"
      },
      { status: e.status ?? 500 }
    );
  }
}
