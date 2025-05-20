import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Research Summarizer</title>
        <meta
          name="description"
          content="AI-powered research paper summarization tool"
        />
        <meta property="og:title" content="Research Summarizer" />
        <meta
          property="og:description"
          content="AI-powered research paper summarization tool"
        />
      </head>
      <body className={`${publicSans.className} bg-gray-900 text-gray-100`}>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto py-8 px-4">
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
