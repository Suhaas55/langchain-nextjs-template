import { PromptTemplate } from "@langchain/core/prompts";

// Template for generating a summary from retrieved chunks
export const SUMMARY_TEMPLATE = `You are a research paper summarizer. Your task is to create a clear, concise summary of the provided research content.

Context:
{context}

Instructions:
1. Create a comprehensive yet concise summary
2. Focus on key findings, methodology, and conclusions
3. Use clear, academic language
4. Maintain objectivity
5. Include any important statistics or data points
6. Keep the summary under 500 words

Summary:`;

export const summaryPrompt = PromptTemplate.fromTemplate(SUMMARY_TEMPLATE);

// Template for generating a TL;DR version
export const TLDR_TEMPLATE = `Create a very brief TL;DR summary of the following research content:

Context:
{context}

Instructions:
1. Keep it under 100 words
2. Focus only on the most important findings
3. Use simple, clear language
4. Avoid technical jargon where possible

TL;DR:`;

export const tldrPrompt = PromptTemplate.fromTemplate(TLDR_TEMPLATE);

// Template for generating a bullet-point summary
export const BULLET_TEMPLATE = `Create a bullet-point summary of the following research content:

Context:
{context}

Instructions:
1. Use clear, concise bullet points
2. Focus on key findings and conclusions
3. Include important statistics where relevant
4. Keep each point under 2 lines
5. Use 5-7 bullet points maximum

Bullet Points:`;

export const bulletPrompt = PromptTemplate.fromTemplate(BULLET_TEMPLATE); 