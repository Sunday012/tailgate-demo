// Contextual AI chat for the workspace, backed by Google Gemini (free tier).
// Get a key at https://aistudio.google.com/app/apikey and put it in .env.local:
//   GEMINI_API_KEY=your_key_here
// The key stays server-side — it is never shipped to the browser.

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

type Turn = { role: "user" | "model"; text: string };

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI is not configured. Add GEMINI_API_KEY to .env.local and restart the dev server." },
      { status: 503 },
    );
  }

  let body: { message?: unknown; highlight?: unknown; moduleTitle?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "A message is required." }, { status: 400 });
  }
  const highlight = typeof body.highlight === "string" ? body.highlight : "";
  const moduleTitle = typeof body.moduleTitle === "string" ? body.moduleTitle : "";

  const system = [
    "You are Tailgate's in-document study assistant for the 'RR Paper Products' learning scheme.",
    "The learner studies operational accounting: balance sheets, profit & loss, inventory operations (stock summary, bills pending), and production controls (batch numbers, material issued).",
    moduleTitle ? `They currently have the module "${moduleTitle}" open.` : "",
    highlight ? `They highlighted this passage and may be asking about it: "${highlight}".` : "",
    "Answer concisely (2-4 sentences) in plain language, grounded in those sources. If a question falls outside the material, say so briefly.",
  ]
    .filter(Boolean)
    .join(" ");

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  if (Array.isArray(body.history)) {
    for (const turn of body.history as Turn[]) {
      if (turn && (turn.role === "user" || turn.role === "model") && typeof turn.text === "string") {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `The AI service returned an error (${res.status}).`, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const blocked = data?.promptFeedback?.blockReason;
    if (!reply && blocked) {
      return Response.json({ reply: "I can't answer that one — try rephrasing." });
    }
    return Response.json({ reply: reply || "(The AI returned an empty response.)" });
  } catch {
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
