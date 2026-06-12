// Generates a full study scheme from the user's prompt (+ uploaded file names)
// using Google Gemini with a forced JSON schema. Key stays server-side.
// Falls back are handled on the client: if this errors, the workspace shows
// the predefined scheme.

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SCHEME_SCHEMA = {
  type: "OBJECT",
  properties: {
    courseTitle: { type: "STRING" },
    modules: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          time: { type: "STRING" },
          topics: { type: "ARRAY", items: { type: "STRING" } },
          lesson: { type: "STRING" },
          mnemonic: {
            type: "OBJECT",
            properties: { phrase: { type: "STRING" }, explanation: { type: "STRING" } },
            required: ["phrase", "explanation"],
          },
          cards: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { title: { type: "STRING" }, body: { type: "STRING" } },
              required: ["title", "body"],
            },
          },
          quiz: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                q: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                answer: { type: "INTEGER" },
              },
              required: ["q", "options", "answer"],
            },
          },
          glossary: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { term: { type: "STRING" }, definition: { type: "STRING" } },
              required: ["term", "definition"],
            },
          },
        },
        required: ["title", "time", "topics", "lesson", "mnemonic", "cards", "quiz", "glossary"],
      },
    },
  },
  required: ["courseTitle", "modules"],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI is not configured." }, { status: 503 });
  }

  let body: { prompt?: unknown; files?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return Response.json({ error: "A prompt is required." }, { status: 400 });
  }

  type UploadFile = { name?: string; kind?: string; mimeType?: string; data?: string; text?: string };
  const files: UploadFile[] = Array.isArray(body.files) ? (body.files as UploadFile[]).slice(0, 12) : [];

  const fileNames = files.map((f) => (f?.name ? `${f.kind ?? "File"}: ${f.name}` : "")).filter(Boolean);

  const system =
    "You are Tailgate, an engine that turns a learner's request and their uploaded sources into a structured, grounded study scheme. " +
    "Read every attached source (documents, images, audio, video, and pasted text) and ground the scheme in their actual content. " +
    "Produce 3 or 4 modules. Each module: a clear title; an estimated time like \"28 min\"; exactly 3 short topic labels; " +
    "a 2-3 sentence lesson written for the learner; a memorable mnemonic (a short phrase plus a one-line explanation); " +
    "exactly 4 study cards (title + 1-2 sentence body); exactly 3 multiple-choice quiz questions (4 options each, and the 0-based index of the correct option); " +
    "and 4-5 glossary terms with concise definitions. Return only the JSON.";

  const userText =
    `Learner request:\n${prompt}\n\n` +
    (fileNames.length
      ? `Uploaded sources (some are attached below as files):\n- ${fileNames.join("\n- ")}\n`
      : "No files uploaded; infer reasonable sources from the request.");

  // Build a multimodal user turn: lead text, then each source's content.
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: userText }];
  for (const f of files) {
    if (typeof f.text === "string" && f.text.trim()) {
      parts.push({ text: `\n\n--- Source: ${f.name ?? "file"} ---\n${f.text.slice(0, 100000)}` });
    } else if (typeof f.data === "string" && f.data && typeof f.mimeType === "string" && f.mimeType) {
      parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    }
  }

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: SCHEME_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  try {
    // Retry transient overload/rate-limit (503/429) — Gemini's free tier spikes.
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody },
      );
      if (res.ok || (res.status !== 503 && res.status !== 429)) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }

    if (!res || !res.ok) {
      const detail = res ? await res.text() : "";
      return Response.json(
        { error: `Generation failed (${res?.status ?? "no response"}).`, detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    let scheme: unknown;
    try {
      scheme = JSON.parse(raw);
    } catch {
      return Response.json({ error: "AI returned malformed JSON." }, { status: 502 });
    }

    return Response.json({ scheme });
  } catch {
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
