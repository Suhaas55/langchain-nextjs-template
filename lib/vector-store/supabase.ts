import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createEmbeddings } from "../llm/openrouter";

// Initialize Supabase client
export const createSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PRIVATE_KEY!
  );
};

// Create vector store instance
export const createVectorStore = () => {
  const client = createSupabaseClient();
  return new SupabaseVectorStore(createEmbeddings(), {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });
};

// Helper to clear all documents from the vector store
export const clearVectorStore = async () => {
  const client = createSupabaseClient();
  await client.from("documents").delete().neq("id", 0);
}; 