import { GoogleAuth } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (resets on serverless cold start — sufficient for portfolio scale)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_LOCALES = ["en", "pt"];

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const { message, sessionId, locale } = await req.json();

    // Input validation
    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (typeof message !== "string" || message.length > 1000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    const safeLocale = ALLOWED_LOCALES.includes(locale) ? locale : "en";

    const rawCreds = process.env.GOOGLE_CREDENTIALS;
    const projectId = process.env.DIALOGFLOW_PROJECT_ID;

    if (!rawCreds)
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    if (!projectId)
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

    let credentials;
    try {
      credentials = JSON.parse(rawCreds);
    } catch {
      console.error("[chat] Invalid GOOGLE_CREDENTIALS format");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const token = await auth.getAccessToken();

    if (!token) {
      console.error("[chat] Failed to get access token");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`;
    const dfRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryInput: {
          text: {
            text: message,
            languageCode: safeLocale === "pt" ? "pt-PT" : "en",
          },
        },
      }),
    });

    if (!dfRes.ok) {
      console.error("[chat] Dialogflow error:", dfRes.status);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const data = await dfRes.json();
    const reply =
      data.queryResult?.fulfillmentText ||
      (safeLocale === "pt"
        ? "Desculpe, não compreendi."
        : "Sorry, I didn't understand that.");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] Unhandled error:", err);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
