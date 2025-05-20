import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { createOpenRouterChat, getFallbackModel } from "@/lib/llm/openrouter";
import { createVectorStore } from "@/lib/vector-store/supabase";
import { summaryPrompt, tldrPrompt, bulletPrompt } from "@/lib/prompts/summary";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SUMMARY_PROMPT = PromptTemplate.fromTemplate(`
You are a research paper summarizer. Given the following research text, provide a {summaryType} summary:

{context}

Summary Type: {summaryType}
- For "full": Provide a comprehensive summary covering all key points
- For "tldr": Provide a very brief summary in 2-3 sentences
- For "bullet": Provide key points in bullet format

Summary:
`);

export async function POST(req: NextRequest) {
  try {
    console.log("Starting chat retrieval process...");
    
    const body = await req.json();
    console.log("Request body:", { 
      messagesCount: body.messages?.length,
      summaryType: body.summaryType 
    });
    
    const { messages, summaryType = "full" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("No messages provided in request");
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    const currentMessageContent = messages[messages.length - 1].content;
    console.log("Current message content:", currentMessageContent);

    console.log("Initializing embeddings...");
    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
          "X-Title": "Research Summarizer",
        },
      },
    });

    console.log("Initializing vector store...");
    // Initialize vector store
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      embeddings,
      {
        client: supabase,
        tableName: "documents",
      }
    );

    console.log("Searching for relevant documents...");
    // Search for relevant documents
    const results = await vectorStore.similaritySearch(currentMessageContent, 3);
    console.log(`Found ${results.length} relevant documents`);
    const context = results.map((doc) => doc.pageContent).join("\n\n");

    console.log("Initializing chat model...");
    // Initialize chat model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
          "X-Title": "Research Summarizer",
        },
      },
      modelName: "openai/gpt-3.5-turbo",
    });

    console.log("Creating chain...");
    // Create chain
    const chain = RunnableSequence.from([
      {
        context: () => context,
        summaryType: () => summaryType,
      },
      SUMMARY_PROMPT,
      model,
      new StringOutputParser(),
    ]);

    console.log("Generating summary...");
    // Generate summary
    const summary = await chain.invoke({});
    console.log("Summary generated successfully");

    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(summary);
        controller.close();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error("Error during summarization:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to generate summary",
        details: error.stack
      },
      { status: 500 }
    );
  }
}
