import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

// OpenRouter configuration
export const openRouterConfig = {
  baseURL: "https://openrouter.ai/api/v1",
  defaultModel: "anthropic/claude-3-opus:beta",
  fallbackModels: [
    "openai/gpt-4-turbo-preview",
    "google/gemini-pro",
  ],
};

// Create OpenRouter chat model instance
export const createOpenRouterChat = (modelName: string = openRouterConfig.defaultModel) => {
  return new ChatOpenAI({
    modelName,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: openRouterConfig.baseURL,
    },
    temperature: 0.2,
  });
};

// Create embeddings instance
export const createEmbeddings = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: openRouterConfig.baseURL,
    },
    modelName: "text-embedding-ada-002",
  });
};

// Helper to get fallback model if primary fails
export const getFallbackModel = (currentModel: string) => {
  const index = openRouterConfig.fallbackModels.indexOf(currentModel);
  if (index === -1) return openRouterConfig.fallbackModels[0];
  return openRouterConfig.fallbackModels[index + 1] || openRouterConfig.defaultModel;
}; 