import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export const runtime = "edge";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * This handler takes input text, splits it into chunks, and embeds those chunks
 * into a vector store for later retrieval.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    if (testError) {
      console.error("Supabase connection test failed:", testError);
      return NextResponse.json(
        { 
          success: false,
          error: "Database connection failed",
          details: testError.message
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const text = body.text;

    if (!text) {
      return NextResponse.json(
        { 
          success: false,
          error: "No text provided" 
        },
        { status: 400 }
      );
    }

    if (process.env.NEXT_PUBLIC_DEMO === "true") {
      return NextResponse.json(
        {
          error: [
            "Ingest is not supported in demo mode.",
            "Please set up your own version of the repo here: https://github.com/langchain-ai/langchain-nextjs-template",
          ].join("\n"),
        },
        { status: 403 },
      );
    }

    console.log("Creating text splitter...");
    // Create text splitter with research-optimized settings
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    });

    console.log("Splitting text into documents...");
    // Split the text into documents
    const splitDocuments = await splitter.createDocuments([text]);
    console.log(`Created ${splitDocuments.length} documents`);

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

    console.log("Adding documents to vector store...");
    // Add documents to vector store
    await vectorStore.addDocuments(splitDocuments);
    console.log("Documents added successfully");

    return NextResponse.json({ 
      success: true,
      chunks: splitDocuments.length,
      message: "Research text successfully indexed"
    });
  } catch (error: any) {
    console.error("Error during ingestion:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to process and index the research text",
      details: error.stack
    }, { status: 500 });
  }
}
