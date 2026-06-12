"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const problemCards = [
  {
    title: "Fragmented Source Evidence",
    body: "Spreadsheets, PDFs, screenshots, recordings, links, and pasted notes pile up faster than learners can turn them into a usable path.",
    icon: "shield",
    visual: "ascii",
  },
  {
    title: "Unstructured Learning Drift",
    body: "When a course is generated without grounded structure, cards, quizzes, mnemonics, glossary terms, and schedules drift away from the source.",
    icon: "ring",
    visual: "pills",
  },
  {
    title: "Expansion Breaks Flow",
    body: "Adding new sources after a scheme is created often rewrites the whole experience instead of inserting only the new modules.",
    icon: "arrow",
    visual: "blocks",
  },
];

function SectionMarker({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-8">
      <span className="rounded-[4px] border border-blue-300/35 bg-blue-950/20 px-4 py-2 font-mono text-sm text-[#7fb0ff]">
        {children}
      </span>
      <span className="h-8 w-px bg-[#6ea2ff]" />
    </div>
  );
}

export default function ProblemCardsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackShift, setTrackShift] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;

      if (!section || !viewport || !track) return;

      const maxShift = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), scrollDistance);

      setTrackShift(maxShift);
      setScrollProgress(scrolled / scrollDistance);
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative left-1/2 w-screen -translate-x-1/2 bg-[#070b24]"
      style={{ height: trackShift ? `calc(100vh + ${trackShift}px)` : "180vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_72%,rgba(65,105,182,0.38),rgba(8,14,48,0.9)_36%,#070b24_74%)]" />
        <div className="relative z-10 flex h-full flex-col py-10 lg:py-12">
          <SectionMarker>The Problem</SectionMarker>
          <h2 className="mx-auto mt-8 max-w-5xl px-6 text-[clamp(2.4rem,3.4vw,4.25rem)] font-normal leading-[1.12] text-white">
            Source overload is outpacing learning workflows
          </h2>

          <div ref={viewportRef} className="my-auto overflow-hidden py-6">
            <div
              ref={trackRef}
              className="flex w-max gap-6 px-[max(32px,calc((100vw-760px)/2))]"
              style={{ transform: `translateX(-${scrollProgress * trackShift}px)` }}
            >
              {problemCards.map((card) => (
                <article
                  key={card.title}
                  className="relative h-[min(500px,72vh)] w-[760px] overflow-hidden rounded-[14px] border border-[#5b83db]/60 bg-[#121b49]/80 p-9 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="relative z-20 max-w-[390px]">
                    <div className="mb-10 grid size-8 place-items-center text-[#5f9bff]">
                      {card.icon === "shield" ? (
                        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 3 20 6v6c0 5-3.2 8-8 9-4.8-1-8-4-8-9V6l8-3Z" />
                        </svg>
                      ) : card.icon === "ring" ? (
                        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M5.6 5.6 18.4 18.4" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M8 16H5V5h11v3" />
                          <path d="M13 19h6V8" />
                          <path d="M14 8h5v5" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-2xl font-normal text-[#5f9bff]">{card.title}</h3>
                    <p className="mt-7 text-base leading-7 text-blue-50/90">{card.body}</p>
                  </div>

                  <div className="pointer-events-none absolute inset-y-0 right-0 w-[68%] opacity-80">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,27,73,0),rgba(18,27,73,0.25)_22%,rgba(18,27,73,0.96)_92%)]" />
                    {card.visual === "ascii" ? (
                      <>
                        <div className="absolute bottom-0 right-0 h-[88%] w-full bg-[radial-gradient(circle_at_64%_42%,rgba(92,154,255,0.56),rgba(49,90,172,0.22)_28%,rgba(49,90,172,0)_56%)]" />
                        <pre className="absolute bottom-0 right-0 font-mono text-[12px] leading-[13px] text-[#6fa5ff]/35">
{`001101 100101 001011 101010 111001
010011 001001 101110 000101 110011
101010 111001 010101 001101 010010
000111 110101 010101 101001 110010
101101 001010 111010 010010 101010
010101 111001 001101 100101 000101
110010 101010 010011 111001 010011
001101 101110 001010 110101 010110
111001 001011 101010 000111 110010
101010 010011 111001 001101 101101
010010 110101 001011 101010 010011`}
                        </pre>
                      </>
                    ) : null}

                    {card.visual === "pills" ? (
                      <div className="absolute right-5 top-10 w-[420px] space-y-5">
                        {[
                          ["Source missing", "right-8"],
                          ["Quiz drift", "left-0"],
                          ["Glossary gap", "right-16"],
                          ["Schedule skipped", "left-12"],
                          ["Unlinked card", "right-2"],
                          ["Weak feedback", "left-24"],
                          ["Context lost", "right-20"],
                        ].map(([label, align]) => (
                          <div
                            key={label}
                            className={`relative ${align} inline-flex rounded-full border border-[#5f9bff]/55 bg-[#07113a]/82 px-5 py-3 text-sm font-semibold text-blue-50 shadow-[0_0_24px_rgba(95,155,255,0.2)]`}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {card.visual === "blocks" ? (
                      <div className="absolute right-12 top-20 h-80 w-80">
                        <div className="absolute left-16 top-0 h-36 w-36 rotate-45 border border-[#5f9bff]/45 bg-[#101947]/75 shadow-[0_0_30px_rgba(95,155,255,0.18)]" />
                        <div className="absolute bottom-8 right-0 h-40 w-40 rotate-45 border border-[#5f9bff]/45 bg-[#07113a]/85 shadow-[0_0_34px_rgba(95,155,255,0.18)]" />
                        <div className="absolute left-36 top-16 h-40 w-px bg-gradient-to-b from-white via-[#5f9bff] to-[#1f74ff]" />
                        <div className="absolute left-[134px] top-12 h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-white" />
                        <div className="absolute left-[134px] bottom-12 h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-[#1f74ff]" />
                        <span className="absolute left-8 top-28 font-mono text-3xl text-white/80">$</span>
                        <span className="absolute bottom-28 right-[4.5rem] font-mono text-3xl text-[#5f9bff]">$</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
