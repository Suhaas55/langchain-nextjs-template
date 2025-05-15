import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createVectorStore } from "@/lib/vector-store/supabase";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

export const runtime = "edge";

// Before running, follow set-up instructions at
// https://js.langchain.com/v0.2/docs/integrations/vectorstores/supabase

/**
 * This handler takes input text, splits it into chunks, and embeds those chunks
 * into a vector store for later retrieval.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;

  if (!text) {
    return NextResponse.json(
      { error: "No text provided" },
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

  try {
    // Create text splitter with research-optimized settings
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 1000, // Larger chunks for research context
      chunkOverlap: 200, // More overlap for better context preservation
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""], // Prioritize paragraph breaks
    });

    // Split the text into documents
    const splitDocuments = await splitter.createDocuments([text]);

    // Get vector store instance
    const vectorstore = await createVectorStore();

    // Add documents to vector store
    await vectorstore.addDocuments(splitDocuments);

    return NextResponse.json({ 
      ok: true,
      chunks: splitDocuments.length,
      message: "Research text successfully indexed"
    }, { status: 200 });
  } catch (e: any) {
    console.error("Error during ingestion:", e);
    return NextResponse.json({ 
      error: e.message,
      details: "Failed to process and index the research text"
    }, { status: 500 });
  }
}
