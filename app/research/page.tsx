import ResearchSummarizer from "@/components/ResearchSummarizer";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-400 mb-4">
            🧠 Research Summarizer
          </h1>
          <p className="text-lg text-green-100 max-w-2xl mx-auto">
            Transform complex research papers into clear, concise summaries. 
            Get instant insights with AI-powered analysis.
          </p>
        </div>
        <ResearchSummarizer />
      </div>
    </div>
  );
} 