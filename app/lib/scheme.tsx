"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProblemCardsSection from "../components/ProblemCardsSection";

type View = "lesson" | "dashboard" | "library" | "schedule" | "profile";
type LessonTab = "overview" | "cards" | "quiz" | "activity" | "glossary";

const sources = [
  { name: "RR Paper balance sheet", kind: "Spreadsheet", meta: "1,284 rows" },
  { name: "Inventory screenshots", kind: "Images", meta: "8 files" },
  { name: "Production SOP notes", kind: "PDF", meta: "42 pages" },
  { name: "Manager voice note", kind: "Audio", meta: "11 min" },
  { name: "Raw material journal", kind: "Web link", meta: "tacniju.vercel.app" },
];

const modules = [
  {
    title: "Accounting Foundations",
    time: "28 min",
    score: 86,
    topics: ["Balance sheet", "Profit and loss", "Working capital"],
  },
  {
    title: "Inventory Operations",
    time: "35 min",
    score: 72,
    topics: ["Stock summary", "Bills pending", "Raw material journal"],
  },
  {
    title: "Production Controls",
    time: "31 min",
    score: 64,
    topics: ["Batch numbers", "Material issued", "Narration rules"],
  },
  {
    title: "New: Procurement Exceptions",
    time: "18 min",
    score: 0,
    topics: ["Supplier gaps", "Overdue bills"],
  },
];

const glossary = [
  ["Current asset", "Resource expected to convert to cash or be used within one operating cycle."],
  ["Closing stock", "Inventory remaining at the end of a reporting period."],
  ["Gross profit", "Sales less direct production and purchase costs."],
  ["Bills pending", "Goods received or delivered where the matching invoice is not complete."],
  ["Batch number", "Identifier used to trace a production run from input to output."],
];

const quizQuestions = [
  {
    q: "Which report best shows whether assets equal liabilities plus capital?",
    options: ["Balance Sheet", "Stock Summary", "Sales Bills Pending", "Raw Material Journal"],
    answer: 0,
  },
  {
    q: "If goods are received but the invoice is missing, where should the learner investigate?",
    options: ["Profit and Loss", "Purchase Bills Pending", "Calendar", "Glossary"],
    answer: 1,
  },
  {
    q: "What should expanding sources do after a scheme already exists?",
    options: ["Regenerate all modules", "Delete weak modules", "Insert new modules only", "Hide old sources"],
    answer: 2,
  },
];

// ---- Generated-scheme types + predefined fallback ----
export type SchemeModule = {
  title: string;
  time: string;
  score: number;
  topics: string[];
  lesson: string;
  mnemonic: { phrase: string; explanation: string };
  cards: { title: string; body: string }[];
  quiz: { q: string; options: string[]; answer: number }[];
  glossary: { term: string; definition: string }[];
};
export type Scheme = { courseTitle: string; modules: SchemeModule[] };

const FALLBACK_LESSON =
  "The balance sheet tells the learner what the business owns and owes at a point in time. The profit and loss statement explains whether trading activity created profit. Inventory reports connect the two by showing stock, pending bills, and production movements.";
const FALLBACK_CARDS = ["Define the report", "Spot the risk", "Use the source", "Explain to a teammate"].map((title) => ({
  title,
  body: "Short, scannable learning card generated from the uploaded sources.",
}));

const FALLBACK_SCHEME: Scheme = {
  courseTitle: "RR Paper Products learning scheme",
  modules: modules.map((m) => ({
    ...m,
    lesson: FALLBACK_LESSON,
    mnemonic: {
      phrase: "BIP: Balance, Income, Production",
      explanation: "Balance sheet for position, income statement for performance, production records for process.",
    },
    cards: FALLBACK_CARDS,
    quiz: quizQuestions,
    glossary: glossary.map(([term, definition]) => ({ term, definition })),
  })),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeScheme(raw: any): Scheme | null {
  if (!raw || !Array.isArray(raw.modules) || raw.modules.length === 0) return null;
  const modulesOut: SchemeModule[] = raw.modules.slice(0, 6).map((m: any, index: number) => ({
    title: String(m?.title ?? `Module ${index + 1}`),
    time: String(m?.time ?? "20 min"),
    score: 0,
    topics: Array.isArray(m?.topics) ? m.topics.map(String).slice(0, 4) : [],
    lesson: String(m?.lesson ?? ""),
    mnemonic: { phrase: String(m?.mnemonic?.phrase ?? ""), explanation: String(m?.mnemonic?.explanation ?? "") },
    cards: Array.isArray(m?.cards)
      ? m.cards.map((c: any) => ({ title: String(c?.title ?? ""), body: String(c?.body ?? "") })).slice(0, 6)
      : [],
    quiz: Array.isArray(m?.quiz)
      ? m.quiz
          .map((q: any) => ({
            q: String(q?.q ?? ""),
            options: Array.isArray(q?.options) ? q.options.map(String) : [],
            answer: Number.isInteger(q?.answer) ? q.answer : 0,
          }))
          .filter((q: { q: string; options: string[] }) => q.q && q.options.length >= 2)
      : [],
    glossary: Array.isArray(m?.glossary)
      ? m.glossary.map((g: any) => ({ term: String(g?.term ?? ""), definition: String(g?.definition ?? "") })).slice(0, 8)
      : [],
  }));
  const usable = modulesOut.filter((m) => m.title && m.lesson);
  if (usable.length === 0) return null;
  return { courseTitle: String(raw.courseTitle ?? "Generated learning scheme"), modules: usable };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    blue: "border-blue-300/25 bg-[#6ea2ff]/10 text-[#6ea2ff]",
    green: "border-blue-300/25 bg-white/[0.04] text-blue-50",
    amber: "border-[#6ea2ff]/25 bg-transparent text-blue-100/80",
    rose: "border-blue-300/25 bg-blue-300/[0.06] text-blue-100/80",
    slate: "border-blue-300/25 bg-transparent text-blue-100/80",
  };
  return <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${tones[tone]}`}>{children}</span>;
}

function Bar({ value, tone = "bg-[#6ea2ff]" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 rounded-full bg-white/10">
      <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${value}%` }} />
    </div>
  );
}

function acceptFor(kind: string) {
  const accept: Record<string, string> = {
    Spreadsheet: ".csv,.xls,.xlsx",
    Word: ".doc,.docx",
    PDF: ".pdf",
    Image: ".png,.jpg,.jpeg,.webp",
    Text: ".txt,.md",
    HTML: ".html,.htm",
    Audio: ".mp3,.wav,.m4a",
    Video: ".mp4,.mov,.webm",
  };
  return accept[kind] ?? "*";
}

function kindShort(kind: string) {
  const labels: Record<string, string> = {
    Spreadsheet: "XLS",
    Word: "DOC",
    PDF: "PDF",
    Image: "IMG",
    Text: "TXT",
    HTML: "HTML",
    Audio: "WAV",
    Video: "MP4",
  };
  return labels[kind] ?? "FILE";
}

function fileKind(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (["csv", "xls", "xlsx"].includes(extension ?? "")) return "Spreadsheet";
  if (["doc", "docx"].includes(extension ?? "")) return "Word";
  if (extension === "pdf") return "PDF";
  if (["png", "jpg", "jpeg", "webp"].includes(extension ?? "")) return "Image";
  if (["html", "htm"].includes(extension ?? "")) return "HTML";
  if (["mp3", "wav", "m4a"].includes(extension ?? "")) return "Audio";
  if (["mp4", "mov", "webm"].includes(extension ?? "")) return "Video";
  return "Text";
}

// File contents are read at submit and handed to /processing via module scope —
// File objects aren't serializable and base64 payloads blow past sessionStorage limits.
type PendingFile = { name: string; kind: string; mimeType?: string; data?: string; text?: string };
let pendingPrompt = "";
let pendingFiles: PendingFile[] = [];

const TEXT_EXTS = ["txt", "md", "csv", "html", "htm", "json"];
const INLINE_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};
const MAX_INLINE_BYTES = 12 * 1024 * 1024;

function readUploadedFile(file: File): Promise<PendingFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const base: PendingFile = { name: file.name, kind: fileKind(file.name) };
  return new Promise((resolve) => {
    if (TEXT_EXTS.includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => resolve({ ...base, text: String(reader.result ?? "").slice(0, 100_000) });
      reader.onerror = () => resolve(base);
      reader.readAsText(file);
      return;
    }
    const mimeType = INLINE_MIME[ext];
    if (!mimeType || file.size > MAX_INLINE_BYTES) {
      resolve(base); // unsupported format or too large to inline — name only
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.slice(result.indexOf(",") + 1) : "";
      resolve(data ? { ...base, mimeType, data } : base);
    };
    reader.onerror = () => resolve(base);
    reader.readAsDataURL(file);
  });
}

export function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Build me a three-day learning scheme from my accounting, inventory, production, audio, image, and document sources.",
  );
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; kind: string; meta: string; preview?: string; file?: File }[]>([]);

  function removeFile(index: number) {
    setUploadedFiles((current) => {
      const target = current[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  const startProcessing = async () => {
    pendingPrompt = prompt;
    try {
      sessionStorage.setItem("tailgate.prompt", prompt);
    } catch {}
    const withFiles = uploadedFiles.filter((entry) => entry.file);
    pendingFiles = await Promise.all(withFiles.map((entry) => readUploadedFile(entry.file as File)));
    router.push("/processing");
  };

  return (
      <main className="lucien-page min-h-screen overflow-x-clip text-blue-50">
        <section className="relative mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-6 py-5 md:px-16">
          <nav className="z-10 grid grid-cols-3 items-center font-mono text-sm text-white">
            <button className="justify-self-start text-blue-50 hover:text-[#7fb0ff]">→ About</button>
            <div className="justify-self-center text-2xl font-bold tracking-[0.22em] text-white">TAILGATE</div>
            <button
              onClick={startProcessing}
              className="justify-self-end rounded-[4px] bg-white px-5 py-3 text-[#070b24] hover:bg-blue-50"
            >
              Book a Demo
            </button>
          </nav>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen bg-[radial-gradient(ellipse_72%_58%_at_50%_82%,rgba(246,249,255,0.92)_0%,rgba(160,197,255,0.5)_24%,rgba(64,104,205,0.2)_46%,rgba(8,13,45,0)_70%)]" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-8 pt-16 text-center">
            <h1 className="max-w-xl bg-[linear-gradient(106deg,#f6f9ff_46%,rgba(150,190,255,0.6)_92%)] bg-clip-text text-[clamp(3.5rem,6.2vw,3.75rem)] font-normal leading-[0.95] tracking-normal text-transparent [-webkit-background-clip:text]">
              Real-Time Study Scheme Generation
              <span className="block">from Any Source</span>
            </h1>

            <p className="mt-7 max-w-2xl font-mono text-sm leading-6 text-blue-100/55">
              Turn spreadsheets, PDFs, images, audio, and links into a grounded, structured study scheme — in real time.
            </p>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-blue-100/35">
              8 source types supported
            </p>

            <div className="lucien-surface mt-4 w-full max-w-3xl rounded-[18px] border p-2 text-left">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-32 w-full resize-none rounded-[12px] border border-blue-300/15 bg-[#081036]/70 px-5 py-5 text-lg leading-8 text-blue-50 outline-none placeholder:text-blue-100/45"
                placeholder="Upload sources and tell Tailgate what study scheme to create..."
              />
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 px-3 pb-1 pt-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="group relative">
                      {file.preview ? (
                        <div className="h-[88px] w-[120px] overflow-hidden rounded-[12px] border border-blue-300/30 bg-[#081036]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-[88px] w-[190px] items-center gap-3 rounded-[12px] border border-blue-300/30 bg-[#0d1744] px-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#6ea2ff]/15 font-mono text-[11px] text-[#6ea2ff]">
                            {kindShort(file.kind)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{file.name}</p>
                            <p className="truncate text-xs text-blue-100/55">{file.kind} · {file.meta}</p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                        className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border border-blue-300/40 bg-[#070b24] text-xs leading-none text-blue-100/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="grid size-10 cursor-pointer place-items-center rounded-full border border-blue-300/25 text-2xl leading-none text-blue-100/80 hover:border-blue-300/40 hover:text-[#6ea2ff]">
                    +
                    <input
                      className="hidden"
                      type="file"
                      multiple
                      accept=".csv,.xls,.xlsx,.doc,.docx,.pdf,.png,.jpg,.jpeg,.txt,.html,.mp3,.wav,.mp4,.mov"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        setUploadedFiles((current) => [
                          ...current,
                          ...files.map((file) => ({
                            name: file.name,
                            kind: fileKind(file.name),
                            meta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                            file,
                          })),
                        ]);
                      }}
                    />
                  </label>
                  {["Spreadsheet", "Word", "PDF", "Image", "Text", "HTML", "Audio", "Video"].map((item) => (
                    <label
                      key={item}
                      className="cursor-pointer rounded-full border border-blue-300/25 px-3 py-2 text-xs text-blue-100/80 hover:border-blue-300/40 hover:text-[#6ea2ff]"
                    >
                      {item}
                      <input
                        className="hidden"
                        type="file"
                        multiple
                        accept={acceptFor(item)}
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          setUploadedFiles((current) => [
                            ...current,
                            ...files.map((file) => ({
                              name: file.name,
                              kind: item,
                              meta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                              preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                              file,
                            })),
                          ]);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-blue-300/15 pt-3">
                  <button
                    onClick={() => setPrompt("Search my uploaded sources for pending bills, stock gaps, and production controls before creating the scheme.")}
                    className="rounded-full border border-blue-300/25 px-4 py-2 text-sm text-blue-100/80 hover:border-blue-200/70"
                  >
                    Search sources
                  </button>
                  <button
                    onClick={startProcessing}
                    className="rounded-full bg-white px-6 py-2.5 font-mono text-sm text-[#070b24] hover:bg-blue-50"
                  >
                    Submit sources
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-24 flex flex-wrap items-center justify-center gap-3 text-sm text-blue-100/45">
              <span>or add</span>
              <button
                onClick={() => setPrompt((current) => `${current}\n\nLink added: https://tacniju.vercel.app/accounting/production/raw-material-journal`)}
                className="lucien-chip rounded-full border px-4 py-2"
              >
                Link
              </button>
              <button
                onClick={() => setPrompt((current) => `${current}\n\nPasted note: Pay attention to batch numbers, list of items, quantity, and narration fields.`)}
                className="lucien-chip rounded-full border px-4 py-2"
              >
                Paste text
              </button>
              <button
                onClick={() => setPrompt("Search the web and uploaded files, then generate a study scheme with cited source references.")}
                className="lucien-chip rounded-full border px-4 py-2"
              >
                Web search
              </button>
              <button
                onClick={() => {
                  try {
                    sessionStorage.removeItem("tailgate.scheme");
                  } catch {}
                  router.push("/workspace");
                }}
                className="lucien-chip rounded-full border px-4 py-2"
              >
                Skip demo
              </button>
            </div>

            <div className="mt-8 w-full max-w-5xl border-t border-blue-300/25 pt-5">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sources.map((source) => (
                  <span key={source.name} className="lucien-chip rounded-full border px-3 py-2 text-sm">
                    {source.kind}: <span className="text-blue-50">{source.name}</span>
                  </span>
                ))}
              </div>
              <p className="mt-5 font-mono text-sm text-blue-100/55">
                Try: &quot;Show me every place purchase bills are pending and why it matters.&quot;
              </p>
            </div>
          </div>
          <LandingSections startProcessing={startProcessing} />
        </section>
      </main>
  );
}

export function ProcessingScreen() {
  const router = useRouter();
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers = [0, 900, 1800, 2700].map((delay, index) =>
      window.setTimeout(() => {
        if (!cancelled) setProcessingStep(index);
      }, delay),
    );

    async function run() {
      let prompt = pendingPrompt;
      if (!prompt) {
        try {
          prompt = sessionStorage.getItem("tailgate.prompt") ?? "";
        } catch {}
      }
      const files = pendingFiles;

      const minDelay = new Promise((resolve) => window.setTimeout(resolve, 2600));

      if (!prompt.trim()) {
        try {
          sessionStorage.removeItem("tailgate.scheme");
        } catch {}
        await minDelay;
        if (!cancelled) router.push("/workspace");
        return;
      }

      const generate = (async () => {
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, files }),
          });
          const data = await res.json();
          if (res.ok && data.scheme) {
            sessionStorage.setItem("tailgate.scheme", JSON.stringify(data.scheme));
          } else {
            sessionStorage.removeItem("tailgate.scheme");
          }
        } catch {
          try {
            sessionStorage.removeItem("tailgate.scheme");
          } catch {}
        }
      })();

      await Promise.all([generate, minDelay]);
      if (!cancelled) router.push("/workspace");
    }

    run();

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [router]);

    const steps = [
      { title: "Reading sources", detail: "Parsing spreadsheets, PDFs, images, audio, and links." },
      { title: "Extracting topics", detail: "Clustering evidence into modules and key terms." },
      { title: "Creating scheme", detail: "Grounding cards, quizzes, mnemonics, and glossary." },
      { title: "Building quizzes", detail: "Generating objective checks and feedback rubrics." },
    ];
    const overall = Math.min(100, Math.round(((processingStep + 0.5) / steps.length) * 100));
  return (
      <main className="lucien-page grid min-h-screen place-items-center px-6 text-blue-50">
        <section className="lucien-surface w-full max-w-2xl rounded-[22px] border p-8">
          <div className="flex items-center justify-between gap-4">
            <Pill tone="blue">Processing sources</Pill>
            <span className="font-mono text-sm text-blue-100/60">{overall}%</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-white">Tailgate is building the learning scheme</h1>
          <p className="mt-3 text-blue-100/65">This is predefined for the demo, but shows the intended production flow.</p>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6ea2ff] to-[#a9c8ff] transition-all duration-700 ease-out"
              style={{ width: `${overall}%` }}
            />
          </div>

          <div className="mt-7 space-y-3">
            {steps.map((step, index) => {
              const done = index < processingStep;
              const active = index === processingStep;
              return (
                <div
                  key={step.title}
                  className={`flex items-center gap-4 rounded-[12px] border p-4 transition-all duration-500 ${
                    active
                      ? "border-blue-300/30 bg-[#6ea2ff]/10"
                      : done
                        ? "border-blue-300/25 bg-blue-300/[0.05]"
                        : "border-blue-300/15 bg-white/[0.02] opacity-60"
                  }`}
                >
                  <div className="relative grid size-9 shrink-0 place-items-center">
                    {active && <span className="absolute inset-0 animate-ping rounded-full bg-[#6ea2ff]/25" />}
                    <div
                      className={`relative grid size-9 place-items-center rounded-full text-xs font-semibold transition-colors ${
                        done
                          ? "bg-[#6ea2ff] text-[#070b24]"
                          : active
                            ? "border-2 border-blue-300/40 text-[#9cc2ff]"
                            : "bg-white/10 text-blue-100/45"
                      }`}
                    >
                      {done ? (
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 4.5 4.5L19 7" />
                        </svg>
                      ) : active ? (
                        <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 1 1-6.2-8.6" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`font-medium ${active || done ? "text-white" : "text-blue-100/60"}`}>{step.title}</p>
                      <span
                        className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${
                          active ? "text-[#9cc2ff]" : done ? "text-blue-100/45" : "text-blue-100/30"
                        }`}
                      >
                        {done ? "Done" : active ? "Working" : "Queued"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-blue-100/55">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
  );
}

export function WorkspaceScreen() {
  const [view, setView] = useState<View>("lesson");
  const [lessonTab, setLessonTab] = useState<LessonTab>("overview");
  const [selectedModule, setSelectedModule] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [expandedSources, setExpandedSources] = useState(false);
  const [addedSources, setAddedSources] = useState<{ name: string; kind: string; meta: string }[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([0, 1, 0]);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [scheme, setScheme] = useState<Scheme>(FALLBACK_SCHEME);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tailgate.scheme");
      if (raw) {
        const parsed = normalizeScheme(JSON.parse(raw));
        if (parsed) setScheme(parsed);
      }
    } catch {}
  }, []);

  const isGenerated = scheme !== FALLBACK_SCHEME;
  const schemeModules = scheme.modules;
  const activeModule = schemeModules[Math.min(selectedModule, schemeModules.length - 1)];
  const quizScore = useMemo(
    () => activeModule.quiz.filter((question, index) => answers[index] === question.answer).length,
    [answers, activeModule],
  );

  function selectModule(index: number) {
    setSelectedModule(index);
    setQuizSubmitted(false);
    setAnswers(Array(schemeModules[index]?.quiz.length ?? 0).fill(0));
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const history = chatMessages;
    setChatMessages((current) => [...current, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, highlight, moduleTitle: activeModule.title, history }),
      });
      const data = await res.json();
      const reply = res.ok ? (data.reply ?? "") : (data.error ?? "Something went wrong.");
      setChatMessages((current) => [...current, { role: "model", text: reply }]);
    } catch {
      setChatMessages((current) => [...current, { role: "model", text: "Could not reach the AI service." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(84,135,255,0.28),transparent_32%),linear-gradient(180deg,#070b24,#080d2e)] text-blue-50">
      <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-blue-300/20 bg-[#081033]/85 p-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-white">Tailgate</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-blue-100/45">Generated scheme</p>
            </div>
          </div>

          <div className="mt-8 border-y border-blue-300/25">
            {[
              ["lesson", "Course workspace"],
              ["dashboard", "Metrics"],
              ["library", "Source library"],
              ["schedule", "Study schedule"],
              ["profile", "User info"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key as View)}
                className={`flex w-full items-center justify-between border-b border-blue-300/20 py-4 text-left text-sm last:border-b-0 ${view === key ? "text-[#6ea2ff]" : "text-blue-100/80 hover:text-white"}`}
              >
                <span>{label}</span>
                <span className="text-blue-100/35">›</span>
              </button>
            ))}
          </div>

          {view === "lesson" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-100/80">Table of contents</p>
              <button
                onClick={() => setExpandedSources(true)}
                className="rounded-full border border-blue-300/35 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-blue-100/80 hover:border-blue-200/70"
              >
                Expand
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              {schemeModules.slice(0, expandedSources ? schemeModules.length : 3).map((module, index) => {
                const active = selectedModule === index && view === "lesson";
                return (
                  <button
                    key={module.title}
                    onClick={() => {
                      selectModule(index);
                      setView("lesson");
                    }}
                    className={`group w-full rounded-[12px] border p-4 text-left transition-all ${
                      active
                        ? "border-blue-300/30 bg-[#6ea2ff]/10"
                        : "border-blue-300/20 bg-white/[0.02] hover:border-blue-300/35 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${active ? "text-[#6ea2ff]" : "text-white"}`}>{module.title}</p>
                      <span className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${active ? "text-[#6ea2ff]" : "text-blue-100/35"}`}>›</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-blue-100/40">
                      <span>{module.time}</span>
                      {module.score > 0 && (
                        <>
                          <span className="text-blue-100/20">•</span>
                          <span>{module.score}% score</span>
                        </>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {module.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-2 py-0.5 text-[11px] text-blue-100/65"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            {expandedSources && <p className="mt-3 text-xs text-blue-200">New modules inserted. Existing modules stayed unchanged.</p>}
          </div>
          )}
        </aside>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-12 top-20 h-80 rounded-full bg-blue-400/10 blur-3xl" />
          <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-blue-300/25 bg-[#081033]/80 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/45">{scheme.courseTitle}</p>
              <h2 className="mt-1 text-2xl font-normal text-white">{viewTitle(view)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="green">Shareable scheme</Pill>
              <Pill tone="blue">7 sources</Pill>
              <Pill tone="amber">Demo mode</Pill>
            </div>
          </header>

          <div
            className="h-[calc(100vh-81px)] overflow-auto p-6"
            onMouseUp={(event) => {
              const text = window.getSelection()?.toString().trim() ?? "";
              if (text.length > 2) {
                setSelection({ text, x: event.clientX, y: event.clientY });
              } else {
                setSelection(null);
              }
            }}
          >
            {view === "lesson" && (
              <LessonView
                activeModule={activeModule}
                lessonTab={lessonTab}
                setLessonTab={setLessonTab}
                answers={answers}
                setAnswers={setAnswers}
                quizSubmitted={quizSubmitted}
                setQuizSubmitted={setQuizSubmitted}
                quizScore={quizScore}
                onNavigate={setView}
                showActivity={!isGenerated}
              />
            )}
            {view === "dashboard" && <DashboardView />}
            {view === "library" && (
              <LibraryView
                expandedSources={expandedSources}
                addedSources={addedSources}
                onAddSources={(items) => {
                  setAddedSources((current) => [...current, ...items]);
                  setExpandedSources(true);
                }}
              />
            )}
            {view === "schedule" && <ScheduleView />}
            {view === "profile" && <ProfileView />}
          </div>

          {selection && (
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setHighlight(selection.text);
                setChatOpen(true);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              style={{ left: selection.x, top: selection.y - 12 }}
              className="fixed z-40 -translate-x-1/2 -translate-y-full rounded-full border border-blue-300/35 bg-[#0d1744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13205a]"
            >
              ✦ Ask AI about this
            </button>
          )}

          <button
            onClick={() => setChatOpen((value) => !value)}
            className="fixed bottom-6 right-6 z-20 rounded-full border border-blue-300/30 bg-[#070b24] px-5 py-4 font-semibold text-white hover:border-blue-300/45 hover:text-[#6ea2ff]"
          >
            Ask AI
          </button>

          {chatOpen && (
            <div className="fixed bottom-24 right-6 z-30 w-[min(420px,calc(100vw-2rem))] rounded-[18px] border border-blue-300/30 bg-[#0d1744]">
              <div className="flex items-center justify-between border-b border-blue-300/20 p-4">
                <div>
                  <p className="font-semibold text-white">Context chat</p>
                  <p className="text-xs text-blue-100/40">Answers use the open document and highlighted text.</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-blue-100/65 hover:text-white">Close</button>
              </div>
              <div className="space-y-3 p-4 text-sm">
                {highlight && (
                  <div className="rounded-[8px] border border-blue-300/25 bg-[#6ea2ff]/10 p-3 text-blue-100">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-blue-100/45">Highlighted from the document</p>
                      <button onClick={() => setHighlight("")} className="text-xs text-blue-100/50 hover:text-white">Clear</button>
                    </div>
                    &ldquo;{highlight}&rdquo;
                  </div>
                )}
                <div className="max-h-72 space-y-3 overflow-y-auto">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="rounded-[8px] border border-dashed border-blue-300/25 p-3 text-blue-100/55">
                      Ask about the open module{highlight ? " or your highlighted text" : ""} — e.g. &ldquo;What does bills pending mean?&rdquo;.
                      Select any text in the document, then click <span className="text-blue-100">Ask AI about this</span> for context.
                    </div>
                  )}
                  {chatMessages.map((m, index) => (
                    <div
                      key={index}
                      className={
                        m.role === "user"
                          ? "ml-6 rounded-[8px] bg-blue-300/10 p-3 text-blue-50"
                          : "mr-6 whitespace-pre-wrap rounded-[8px] bg-[#6ea2ff]/12 p-3 text-white"
                      }
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="mr-6 rounded-[8px] bg-[#6ea2ff]/12 p-3 text-blue-100/60">Thinking…</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder="Ask about this screen..."
                    className="min-w-0 flex-1 rounded-full border border-blue-300/20 bg-blue-950/30 px-4 py-2 outline-none"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="rounded-full bg-[#6ea2ff] px-4 font-semibold text-[#070b24] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function viewTitle(view: View) {
  return {
    lesson: "Course workspace",
    dashboard: "Performance metrics",
    library: "Source library",
    schedule: "Study schedule",
    profile: "User information",
  }[view];
}

function SectionMarker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-8">
      <span className="rounded-[4px] border border-blue-300/35 bg-blue-950/20 px-4 py-2 font-mono text-sm text-[#7fb0ff]">
        {children}
      </span>
      <span className="h-8 w-px bg-[#6ea2ff]" />
    </div>
  );
}

function LandingSections({ startProcessing }: { startProcessing: () => void }) {
  const logos = ["oneTech", "WELLS FARGO", "mattilda.", "IRYS", "U.S. AIR FORCE", "WelcomeTech"];
  const faqs = [
    "How does Tailgate differ from ordinary course builders?",
    "Can users expand sources after a scheme is generated?",
    "Can the generated scheme be shared?",
    "What happens after a learner answers a quiz?",
    "Can reminders be set for study schedules?",
  ];
  const solutionInputs = [
    { label: "Input", icon: "I", y: 58 },
    { label: "Code", icon: "</>", y: 118 },
    { label: "Language", icon: "Ia", y: 300 },
    { label: "Agents", icon: "A", y: 360 },
  ];
  const solutionOutputs = [
    { label: "Datasets", icon: "D", y: 58 },
    { label: "Agents", icon: "A", y: 118 },
    { label: "Assessments", icon: "A", y: 300 },
    { label: "API", icon: "X", y: 360 },
  ];
  const solutionBenefits = [
    ["Stable source expansion", "Add new files later and Tailgate inserts only new modules, preserving the learner's existing path."],
    ["Grounded learning assets", "Cards, quizzes, mnemonics, glossary notes, and activities stay attached to their source evidence."],
    ["Context everywhere", "Learners can ask about the open module, highlighted text, quiz feedback, or uploaded library without losing place."],
  ];

  return (
    <div className="relative z-10 pb-20 pt-24">
      {/* <section className="min-h-[420px]">
        <SectionMarker>Trusted by</SectionMarker>
        <div className="mt-24 grid grid-cols-2 items-center gap-10 opacity-90 md:grid-cols-6">
          {logos.map((logo) => (
            <div key={logo} className="text-center text-xl font-semibold tracking-tight text-white/80">
              {logo}
            </div>
          ))}
        </div>
      </section> */}

      <section className="mx-auto max-w-6xl pb-20 text-center">
        <SectionMarker>The Mission</SectionMarker>
        <h2 className="mt-10 text-[clamp(3rem,5vw,5.75rem)] font-normal leading-[1.08] text-white">
          You can&apos;t study what you can&apos;t see. Hidden knowledge needs to be structured and usable.
        </h2>
      </section>

      <ProblemCardsSection />

      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden px-6 py-24 text-center lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_52%,rgba(83,134,220,0.45),rgba(10,18,59,0.94)_38%,#070b24_76%)]" />
        <div className="relative z-10 mx-auto max-w-[1600px]">
          <SectionMarker>Solution</SectionMarker>
          <h2 className="mx-auto mt-10 max-w-4xl text-[clamp(2.9rem,4.1vw,5rem)] font-normal leading-[1.1] text-white">
            Tailgate becomes the source-to-scheme layer for AI learning
          </h2>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-blue-50/85">
            It verifies every source, preserves existing modules when new sources arrive, and gives learners context
            chat, glossary support, objective quizzes, and feedback loops.
          </p>

          <div className="relative mx-auto mt-20 hidden h-[520px] max-w-[1500px] lg:block">
            <div className="absolute left-1/2 top-[46%] h-[320px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6ea2ff]/30 blur-[90px]" />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1200 420"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <g fill="none" stroke="rgba(122,164,255,0.42)" strokeWidth="1.2">
                <path d="M250 66 C330 76 340 218 405 218" />
                <path d="M250 115 C330 118 348 218 405 218" />
                <path d="M250 262 C330 254 348 218 405 218" />
                <path d="M250 310 C330 300 340 218 405 218" />
                <path d="M482 218 L501 218" />
                <path d="M699 218 L718 218" />
                <path d="M795 218 C865 218 878 76 962 66" />
                <path d="M795 218 C870 218 888 118 962 115" />
                <path d="M795 218 C870 218 888 254 962 262" />
                <path d="M795 218 C865 218 878 300 962 310" />
              </g>
              <g fill="#dce8ff">
                <circle cx="405" cy="218" r="3" />
                <circle cx="795" cy="218" r="3" />
                <circle cx="854" cy="218" r="3" />
                <circle cx="876" cy="246" r="3" />
              </g>
            </svg>

            {solutionInputs.map((node) => (
              <div
                key={node.label}
                className="absolute left-[7%] flex h-12 w-48 items-center justify-center gap-4 rounded-[18px] border border-blue-300/25 bg-[#101947]/78 text-base text-white"
                style={{ top: node.y }}
              >
                <span className="w-8 text-center font-mono text-xs text-[#6ea2ff]">{node.icon}</span>
                <span className="min-w-24 text-left">{node.label}</span>
              </div>
            ))}

            <div className="absolute left-1/2 top-[52%] flex -translate-x-1/2 -translate-y-1/2 items-start gap-6">
              <div className="text-center">
                <div className="grid size-24 place-items-center rounded-[14px] border border-blue-300/35 bg-[#13235e]/95">
                  <div className="grid size-16 place-items-center rounded-[10px] border border-blue-300/35 bg-[#07113a] text-2xl font-black text-white">
                    TG
                  </div>
                </div>
                <p className="mt-5 font-mono text-sm text-blue-50/80">Tailgate</p>
              </div>

              <div className="text-center">
                <div className="flex h-24 items-center gap-3 rounded-[14px] border border-blue-300/35 bg-[#13235e]/95 px-4">
                  {["◐", "◎", "✦"].map((item) => (
                    <div key={item} className="grid size-16 place-items-center rounded-[10px] border border-blue-300/35 bg-[#07113a] text-3xl text-white">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-5 font-mono text-sm text-blue-50/80">LLMs</p>
              </div>

              <div className="text-center">
                <div className="grid size-24 place-items-center rounded-[14px] border border-blue-300/35 bg-[#13235e]/95">
                  <div className="grid size-16 place-items-center rounded-[10px] border border-blue-300/35 bg-[#07113a] text-2xl font-black text-white">
                    TG
                  </div>
                </div>
                <p className="mt-5 font-mono text-sm text-blue-50/80">Tailgate</p>
              </div>
            </div>

            {solutionOutputs.map((node) => (
              <div
                key={node.label}
                className="absolute right-[7%] flex h-12 w-48 items-center justify-center gap-4 rounded-[18px] border border-blue-300/25 bg-[#101947]/78 text-base text-white"
                style={{ top: node.y }}
              >
                <span className="w-8 text-center font-mono text-xs text-[#6ea2ff]">{node.icon}</span>
                <span className="min-w-28 text-left">{node.label}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 grid max-w-7xl gap-6 text-left md:grid-cols-3">
            {solutionBenefits.map(([title, body], index) => (
              <div key={title} className="lucien-surface min-h-64 rounded-[18px] border p-8">
                <p className="font-mono text-3xl text-[#6ea2ff]">0{index + 1}</p>
                <h3 className="mt-8 text-2xl font-normal leading-tight text-[#6ea2ff]">{title}</h3>
                <p className="mt-7 leading-7 text-blue-50/90">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <SectionMarker>How it Works</SectionMarker>
        <h2 className="mx-auto mt-10 max-w-3xl text-center text-5xl font-normal leading-tight text-white">
          Deploy Tailgate as a guided study engine
        </h2>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {["Upload and search sources", "Generate stable modules", "Learn with chat and feedback"].map((item, index) => (
            <div key={item} className="lucien-surface rounded-[18px] border p-8">
              <p className="font-mono text-[#6ea2ff]">0{index + 1}</p>
              <h3 className="mt-8 text-2xl text-white">{item}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="relative grid min-h-[620px] place-items-center overflow-hidden py-24 text-center">
        <div className="lucien-orb absolute inset-x-0 top-0 mx-auto h-[560px] max-w-5xl opacity-80" />
        <div className="relative z-10">
          <h2 className="mx-auto max-w-3xl text-5xl font-normal leading-tight text-white">
            Build with certainty, teach without hesitation
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-blue-50/85">
            Your sources deserve a learning experience that can explain itself.
          </p>
          <button
            onClick={startProcessing}
            className="mt-10 rounded-[4px] bg-white px-6 py-3 font-mono text-[#070b24]"
          >
            Build Demo
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl py-24">
        <SectionMarker>FAQ</SectionMarker>
        <h2 className="mt-10 text-center text-5xl font-normal text-white">Your questions, answered</h2>
        <div className="mt-16 space-y-4">
          {faqs.map((faq) => (
            <details key={faq} className="rounded-[16px] border border-blue-300/25 bg-[#0b1440]/55 px-6 py-5">
              <summary className="cursor-pointer text-xl text-white">{faq}</summary>
              <p className="mt-4 leading-7 text-blue-50/80">
                This demo mocks the product behavior with predefined data so the full story can be presented in three days.
              </p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-blue-300/25 py-10 font-mono text-sm text-blue-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-5">
            <span>→ About</span>
            <span>→ Contact</span>
            <span>→ Terms and Conditions</span>
            <span>→ Privacy Policy</span>
          </div>
          <span>© 2026 Tailgate Learning Systems. All rights reserved.</span>
        </div>
        <div className="mt-16 text-[clamp(5rem,15vw,16rem)] font-black leading-none tracking-[0.04em] text-white">
          TAILGATE
        </div>
      </footer>
    </div>
  );
}

const activityPairs = [
  { source: "Balance sheet", decision: "Solvency" },
  { source: "Stock summary", decision: "Inventory value" },
  { source: "Bills pending", decision: "Accrual risk" },
  { source: "Batch note", decision: "Traceability" },
];
// Decisions shown in a different order than the sources so it isn't trivial.
const activityDecisions = ["Inventory value", "Traceability", "Solvency", "Accrual risk"];

function ActivityMatcher() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const decisionOwner = (decision: string) =>
    Object.keys(assignments).find((source) => assignments[source] === decision) ?? null;

  function pickDecision(decision: string) {
    if (!selectedSource) return;
    setChecked(false);
    setAssignments((current) => {
      const next: Record<string, string> = {};
      // keep other assignments, but free this decision from any previous owner
      for (const [source, value] of Object.entries(current)) {
        if (source !== selectedSource && value !== decision) next[source] = value;
      }
      next[selectedSource] = decision;
      return next;
    });
    setSelectedSource(null);
  }

  function reset() {
    setAssignments({});
    setSelectedSource(null);
    setChecked(false);
  }

  const correctFor = (source: string) => activityPairs.find((pair) => pair.source === source)?.decision;
  const score = activityPairs.filter((pair) => assignments[pair.source] === pair.decision).length;
  const allMatched = Object.keys(assignments).length === activityPairs.length;

  return (
    <div className="rounded-[12px] border border-blue-300/20 bg-blue-300/[0.06] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Match the evidence</h3>
          <p className="mt-2 text-blue-100/65">
            {selectedSource
              ? `Now pick the decision that "${selectedSource}" supports.`
              : "Click an evidence source, then click the decision it supports."}
          </p>
        </div>
        {checked && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${score === activityPairs.length ? "bg-blue-400/15 text-blue-200" : "bg-[#6ea2ff]/15 text-[#9cc2ff]"}`}>
            {score}/{activityPairs.length} correct
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/45">Evidence source</p>
          {activityPairs.map((pair) => {
            const assigned = assignments[pair.source];
            const isSelected = selectedSource === pair.source;
            const isCorrect = checked && assigned === correctFor(pair.source);
            const isWrong = checked && assigned && assigned !== correctFor(pair.source);
            return (
              <button
                key={pair.source}
                onClick={() => setSelectedSource(isSelected ? null : pair.source)}
                className={`w-full rounded-[10px] border p-4 text-left transition-all ${
                  isCorrect
                    ? "border-blue-400/60 bg-blue-400/10"
                    : isWrong
                      ? "border-rose-400/60 bg-rose-400/10"
                      : isSelected
                        ? "border-blue-300/35 bg-[#6ea2ff]/12"
                        : "border-blue-300/25 bg-blue-950/30 hover:border-blue-300/35"
                }`}
              >
                <p className="font-medium text-white">{pair.source}</p>
                <p className={`mt-1 text-sm ${assigned ? "text-[#9cc2ff]" : "text-blue-100/40"}`}>
                  {assigned ? `→ ${assigned}` : "→ unmatched"}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/45">Decision it supports</p>
          {activityDecisions.map((decision) => {
            const owner = decisionOwner(decision);
            return (
              <button
                key={decision}
                onClick={() => pickDecision(decision)}
                disabled={!selectedSource}
                className={`w-full rounded-[10px] border p-4 text-left transition-all ${
                  owner
                    ? "border-blue-300/30 bg-blue-300/[0.08]"
                    : selectedSource
                      ? "border-blue-300/30 bg-blue-950/30 hover:border-blue-300/40 hover:bg-[#6ea2ff]/10"
                      : "border-blue-300/20 bg-blue-950/30 opacity-70"
                }`}
              >
                <p className="font-medium text-white">{decision}</p>
                <p className={`mt-1 text-sm ${owner ? "text-blue-100/55" : "text-blue-100/35"}`}>
                  {owner ? `matched with ${owner}` : "available"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setChecked(true)}
          disabled={!allMatched}
          className={`rounded-full px-5 py-2.5 font-semibold transition-colors ${
            allMatched ? "bg-[#6ea2ff] text-[#070b24] hover:bg-[#86b4ff]" : "cursor-not-allowed bg-white/10 text-blue-100/40"
          }`}
        >
          Check answers
        </button>
        <button onClick={reset} className="rounded-full border border-blue-300/25 px-5 py-2.5 text-sm text-blue-100/80 hover:border-blue-200/70">
          Reset
        </button>
        {!allMatched && <span className="text-sm text-blue-100/45">Match all four to check.</span>}
        {checked && score === activityPairs.length && <span className="text-sm text-blue-200">Perfect — every source is linked to the right decision.</span>}
      </div>
    </div>
  );
}

function LessonView({
  activeModule,
  lessonTab,
  setLessonTab,
  answers,
  setAnswers,
  quizSubmitted,
  setQuizSubmitted,
  quizScore,
  onNavigate,
  showActivity,
}: {
  activeModule: SchemeModule;
  lessonTab: LessonTab;
  setLessonTab: (tab: LessonTab) => void;
  answers: number[];
  setAnswers: (answers: number[]) => void;
  quizSubmitted: boolean;
  setQuizSubmitted: (value: boolean) => void;
  quizScore: number;
  onNavigate: (view: View) => void;
  showActivity: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const tabs: LessonTab[] = showActivity
    ? ["overview", "cards", "quiz", "activity", "glossary"]
    : ["overview", "cards", "quiz", "glossary"];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <article className="border-y border-blue-300/25 bg-[#070b24]">
        <div className="border-b border-blue-300/25 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="blue">Module</Pill>
            <Pill tone="green">{activeModule.time}</Pill>
          </div>
          <h1 className="mt-6 text-5xl font-normal leading-tight text-white">{activeModule.title}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-blue-100/70">
            A generated study document — read the lesson, drill the cards, take the objective quiz, and review the key
            terms before moving on.
          </p>
        </div>
        <div className="flex gap-2 overflow-auto border-b border-blue-300/25 p-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setLessonTab(tab as LessonTab)}
              className={`rounded-full border px-4 py-2 text-sm capitalize ${lessonTab === tab ? "border-blue-300/35 text-[#6ea2ff]" : "border-blue-300/25 text-blue-100/70 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6">
          {lessonTab === "overview" && (
            <div className="space-y-5">
              <section className="border-b border-blue-300/25 pb-8">
                <h3 className="text-sm font-semibold uppercase text-blue-100/45">Generated lesson</h3>
                <p className="mt-5 text-2xl leading-[1.45] text-blue-50">{activeModule.lesson}</p>
                <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-300/25 px-4 py-2 text-sm text-blue-100/70">
                  <span className="text-[#6ea2ff]">✦</span>
                  Select any text above, then click &ldquo;Ask AI about this&rdquo;.
                </p>
              </section>
              {(activeModule.mnemonic.phrase || activeModule.mnemonic.explanation) && (
                <section className="border-b border-blue-300/25 pb-8">
                  <h3 className="text-sm font-semibold uppercase text-blue-100/45">Mnemonic</h3>
                  <p className="mt-4 text-4xl font-normal text-[#6ea2ff]">{activeModule.mnemonic.phrase}</p>
                  <p className="mt-3 text-blue-100/80">{activeModule.mnemonic.explanation}</p>
                </section>
              )}
              <section className="grid gap-3 md:grid-cols-3">
                {activeModule.topics.map((topic) => (
                  <div key={topic} className="rounded-[8px] border border-blue-300/20 bg-blue-300/[0.06] p-4">
                    <p className="font-medium text-white">{topic}</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100/65">A key topic covered in this module.</p>
                  </div>
                ))}
              </section>
            </div>
          )}
          {lessonTab === "cards" && (
            <div className="grid gap-4 md:grid-cols-2">
              {activeModule.cards.map((card, index) => (
                <div key={`${card.title}-${index}`} className="rounded-[8px] border border-blue-300/20 bg-blue-300/[0.06] p-5">
                  <Pill tone={index % 2 ? "amber" : "blue"}>Card {index + 1}</Pill>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 leading-7 text-blue-100/65">{card.body}</p>
                </div>
              ))}
            </div>
          )}
          {lessonTab === "quiz" && (
            <div className="space-y-5">
              {activeModule.quiz.map((item, questionIndex) => (
                <div key={item.q} className="rounded-[8px] border border-blue-300/20 bg-blue-300/[0.06] p-5">
                  <p className="font-semibold text-white">{questionIndex + 1}. {item.q}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {item.options.map((option, optionIndex) => (
                      <button
                        key={option}
                        onClick={() => {
                          const next = [...answers];
                          next[questionIndex] = optionIndex;
                          setAnswers(next);
                        }}
                        className={`rounded-[8px] border px-3 py-3 text-left text-sm ${answers[questionIndex] === optionIndex ? "border-blue-300/30 bg-blue-300/10 text-white" : "border-blue-300/20 bg-blue-950/30 text-blue-100/80"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setQuizSubmitted(true)}
                className="rounded-full bg-[#6ea2ff] px-5 py-3 font-semibold text-[#070b24]"
              >
                Submit quiz
              </button>
              {quizSubmitted && (() => {
                const total = activeModule.quiz.length || 1;
                const pct = Math.round((quizScore / total) * 100);
                return (
                  <div className="rounded-[8px] border border-blue-300/30 bg-blue-400/10 p-5">
                    <h3 className="text-xl font-semibold text-white">Animated feedback</h3>
                    <p className="mt-2 text-blue-100/80">
                      Score: {quizScore}/{activeModule.quiz.length}.{" "}
                      {pct >= 67 ? "Strong understanding — keep going." : "Review the items you missed and try again."}
                    </p>
                    <div className="mt-5 space-y-4">
                      <div><p className="mb-2 text-sm text-blue-100">Overall accuracy</p><Bar value={pct} tone="bg-blue-400" /></div>
                      <div><p className="mb-2 text-sm text-blue-200">Recall of key terms</p><Bar value={Math.max(20, pct - 14)} tone="bg-blue-500" /></div>
                      <div><p className="mb-2 text-sm text-blue-200">Application to new cases</p><Bar value={Math.max(15, pct - 28)} tone="bg-blue-700" /></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          {lessonTab === "activity" && showActivity && <ActivityMatcher />}
          {lessonTab === "glossary" && (
            <div className="grid gap-3">
              {activeModule.glossary.map(({ term, definition }) => (
                <div key={term} className="rounded-[8px] border border-blue-300/20 bg-blue-300/[0.06] p-4">
                  <p className="font-semibold text-white">{term}</p>
                  <p className="mt-1 text-blue-100/65">{definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      <aside className="space-y-5">
        <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
          <h3 className="font-semibold text-white">Document tools</h3>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText("https://tailgate.app/scheme/rr-paper-products").catch(() => {});
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-[8px] bg-blue-300/10 px-3 py-2 text-left text-sm text-blue-100/80 hover:bg-blue-300/20"
            >
              Share this scheme
              <span className={`text-xs ${copied ? "text-[#9cc2ff]" : "text-blue-100/35"}`}>{copied ? "Link copied ✓" : "Copy link"}</span>
            </button>
            <button
              onClick={() => onNavigate("library")}
              className="w-full rounded-[8px] bg-blue-300/10 px-3 py-2 text-left text-sm text-blue-100/80 hover:bg-blue-300/20"
            >
              Add sources to expand
            </button>
            <button
              onClick={() => onNavigate("schedule")}
              className="w-full rounded-[8px] bg-blue-300/10 px-3 py-2 text-left text-sm text-blue-100/80 hover:bg-blue-300/20"
            >
              Create reminder
            </button>
          </div>
        </div>
        <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
          <h3 className="font-semibold text-white">Progress snapshot</h3>
          <div className="mt-4 space-y-4">
            <div><p className="mb-2 text-sm text-blue-100/65">Quiz accuracy</p><Bar value={82} /></div>
            <div><p className="mb-2 text-sm text-blue-100/65">Glossary reviewed</p><Bar value={58} tone="bg-blue-400" /></div>
            <div><p className="mb-2 text-sm text-blue-100/65">Schedule adherence</p><Bar value={74} tone="bg-blue-500" /></div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["86%", "Quiz accuracy", "green"],
          ["12", "Documents uploaded", "blue"],
          ["43", "Glossary terms", "amber"],
          ["5", "Study reminders", "rose"],
        ].map(([value, label, tone]) => (
          <div key={label} className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
            <Pill tone={tone}>{label}</Pill>
            <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <h3 className="text-lg font-semibold text-white">Post-quiz feedback animation</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[8px] bg-blue-400/10 p-4"><p className="text-blue-100">Strong</p><p className="mt-2 text-white">Financial reports</p><Bar value={91} tone="bg-blue-400" /></div>
          <div className="rounded-[8px] bg-blue-500/10 p-4"><p className="text-blue-200">Developing</p><p className="mt-2 text-white">Inventory controls</p><Bar value={67} tone="bg-blue-500" /></div>
          <div className="rounded-[8px] bg-blue-700/10 p-4"><p className="text-blue-200">Needs work</p><p className="mt-2 text-white">Production tracing</p><Bar value={44} tone="bg-blue-700" /></div>
        </div>
      </div>
    </div>
  );
}

function LibraryView({
  expandedSources,
  addedSources,
  onAddSources,
}: {
  expandedSources: boolean;
  addedSources: { name: string; kind: string; meta: string }[];
  onAddSources: (items: { name: string; kind: string; meta: string }[]) => void;
}) {
  const allSources = sources.concat(addedSources);
  const added = expandedSources || addedSources.length > 0;
  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Uploaded documents</h3>
            <p className="mt-1 text-blue-100/65">Add sources anytime — Tailgate inserts only new modules and leaves existing ones untouched.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddSources([{ name: "Supplier exception email", kind: "Email export", meta: "19 threads" }])}
              className="rounded-full border border-blue-300/30 px-4 py-2 text-sm text-blue-100/80 hover:border-blue-200/70"
            >
              Add sample
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-full bg-[#6ea2ff] px-4 py-2 font-semibold text-[#070b24] hover:bg-[#86b4ff]">
              <span className="text-lg leading-none">+</span>
              Add more sources
              <input
                className="hidden"
                type="file"
                multiple
                accept=".csv,.xls,.xlsx,.doc,.docx,.pdf,.png,.jpg,.jpeg,.txt,.html,.mp3,.wav,.mp4,.mov"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (!files.length) return;
                  onAddSources(
                    files.map((file) => ({
                      name: file.name,
                      kind: fileKind(file.name),
                      meta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                    })),
                  );
                }}
              />
            </label>
          </div>
        </div>
        {added && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-blue-300/25 bg-[#6ea2ff]/10 px-4 py-3 text-sm text-blue-50">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#6ea2ff] text-xs text-[#070b24]">✓</span>
            New module <span className="font-semibold text-white">&ldquo;Procurement Exceptions&rdquo;</span> inserted from your added sources — existing modules stayed unchanged.
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {allSources.map((source, index) => {
          const isNew = index >= sources.length;
          return (
            <div
              key={`${source.name}-${index}`}
              className={`rounded-[18px] border bg-[#0d1744] p-4 ${isNew ? "border-blue-300/35" : "border-blue-300/30"}`}
            >
              <div className="relative h-28 overflow-hidden rounded-[6px] border border-dashed border-blue-300/35 bg-gradient-to-br from-blue-900/50 via-[#0d1744] to-[#050b24]">
                {isNew && (
                  <span className="absolute right-2 top-2 rounded-full bg-[#6ea2ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#070b24]">New</span>
                )}
              </div>
              <p className="mt-4 font-semibold text-white">{source.name}</p>
              <p className="mt-1 text-sm text-blue-100/65">{source.kind} - {source.meta}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleView() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">June 2026</h3>
          <Pill tone="blue">Week view</Pill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {["Mon 15", "Tue 16", "Wed 17", "Thu 18", "Fri 19"].map((day, index) => (
            <div key={day} className="min-h-56 rounded-[8px] border border-blue-300/20 bg-blue-300/[0.06] p-3">
              <p className="text-sm font-medium text-blue-100/80">{day}</p>
              {index !== 1 && (
                <div className="mt-4 rounded-[8px] bg-[#6ea2ff]/12 p-3 text-sm text-white">
                  {index % 2 ? "Glossary review" : "Accounting quiz"}<br />7:00 PM
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <h3 className="text-lg font-semibold text-white">Set reminder</h3>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-[8px] border border-blue-300/20 bg-blue-950/30 px-3 py-3 outline-none" defaultValue="Inventory Operations review" />
          <input className="w-full rounded-[8px] border border-blue-300/20 bg-blue-950/30 px-3 py-3 outline-none" defaultValue="2026-06-15 19:00" />
          <div className="grid grid-cols-3 gap-2">
            {["Email", "SMS", "Push"].map((item) => <button key={item} className="rounded-[8px] border border-blue-300/20 bg-blue-300/10 py-2 text-sm">{item}</button>)}
          </div>
          <button className="w-full rounded-full bg-[#6ea2ff] py-3 font-semibold text-[#070b24]">Save reminder</button>
        </div>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <h3 className="text-lg font-semibold text-white">Learner info</h3>
        <dl className="mt-5 space-y-4 text-sm">
          <div><dt className="text-blue-100/40">Name</dt><dd className="text-white">Favour Sunday</dd></div>
          <div><dt className="text-blue-100/40">Role</dt><dd className="text-white">Operations trainee</dd></div>
          <div><dt className="text-blue-100/40">Goal</dt><dd className="text-white">Understand production accounting reports in 3 days</dd></div>
        </dl>
      </div>
      <div className="rounded-[18px] border border-blue-300/30 bg-[#0d1744] p-5">
        <h3 className="text-lg font-semibold text-white">Saved glossaries</h3>
        <div className="mt-4 space-y-2">
          {["Accounting terms", "Inventory terms", "Production controls"].map((item) => <div key={item} className="rounded-[8px] bg-blue-300/10 p-3">{item}</div>)}
        </div>
      </div>
    </div>
  );
}
