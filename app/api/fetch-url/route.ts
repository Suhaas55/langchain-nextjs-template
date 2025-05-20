import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url);
    const html = await response.text();

    // Parse the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove unwanted elements
    const unwantedElements = document.querySelectorAll("script, style, nav, footer, header, aside");
    unwantedElements.forEach((element) => element.remove());

    // Extract text content
    const content = document.body.textContent
      ?.replace(/\s+/g, " ")
      .trim();

    if (!content) {
      throw new Error("No content found on the page");
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error fetching URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch URL content" },
      { status: 500 }
    );
  }
} 