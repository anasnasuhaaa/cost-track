"use client";

import { useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, UserRound } from "lucide-react";

type Answer = { answer: string; metric?: string; details?: string[]; suggestions: string[] };
type Message = { role: "user"; text: string } | { role: "assistant"; data: Answer };

const initialSuggestions = ["Pengeluaran bulan ini", "Kategori terbesar", "Bandingkan dengan bulan lalu"];

export function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function ask(value: string) {
    const trimmed = value.trim(); if (trimmed.length < 3 || pending) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]); setQuestion(""); setPending(true); setError("");
    const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: trimmed }) });
    const body = await response.json().catch(() => null); setPending(false);
    if (!response.ok) { setError(body?.error ?? "Assistant sedang tidak tersedia."); return; }
    setMessages((current) => [...current, { role: "assistant", data: body }]);
  }

  return (
    <section className="flex min-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl border bg-card lg:min-h-[calc(100dvh-8rem)]">
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-6" /></span><h2 className="mt-5 font-heading text-xl font-semibold">Apa yang ingin kamu pahami?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Aku mengambil angka langsung dari perhitungan database. AI hanya membantu memahami maksud pertanyaanmu.</p><div className="mt-7 flex flex-wrap justify-center gap-2">{initialSuggestions.map((suggestion) => <button key={suggestion} className="tap-target rounded-full border bg-background px-4 text-sm hover:border-primary" onClick={() => ask(suggestion)} type="button">{suggestion}</button>)}</div></div> : messages.map((message, index) => message.role === "user" ? <div key={index} className="ml-auto flex max-w-[85%] flex-row-reverse items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted"><UserRound className="size-4" /></span><p className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">{message.text}</p></div> : <div key={index} className="flex max-w-[92%] items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span><div className="rounded-2xl rounded-tl-sm border bg-background p-4"><p className="text-sm leading-6">{message.data.answer}</p>{message.data.metric ? <p className="mt-2 font-heading text-2xl font-semibold">{message.data.metric}</p> : null}{message.data.details?.length ? <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{message.data.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}<div className="mt-4 flex flex-wrap gap-2">{message.data.suggestions.slice(0, 3).map((suggestion) => <button key={suggestion} className="rounded-full border px-3 py-2 text-xs hover:border-primary" onClick={() => ask(suggestion)} type="button">{suggestion}</button>)}</div></div></div>)}
        {pending ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Menganalisis pertanyaan dan menghitung data...</div> : null}
        {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <form className="sticky bottom-0 border-t bg-card p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); void ask(question); }}><div className="flex gap-2"><label className="sr-only" htmlFor="assistant-question">Pertanyaan keuangan</label><input id="assistant-question" className="h-12 min-w-0 flex-1 rounded-xl border bg-background px-4" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} placeholder="Tanya kondisi keuanganmu..." /><button className="tap-target grid place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" disabled={pending || question.trim().length < 3} type="submit" aria-label="Kirim pertanyaan"><Send className="size-4" /></button></div></form>
    </section>
  );
}
