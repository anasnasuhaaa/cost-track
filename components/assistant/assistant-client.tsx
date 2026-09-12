"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Answer = { answer: string; metric?: string; details?: string[]; suggestions: string[] };
type Message = { role: "user"; text: string } | { role: "assistant"; data: Answer };

const initialSuggestions = ["Saldo saya sekarang", "Pengeluaran bulan ini", "Kategori terbesar", "Bandingkan dengan bulan lalu"];

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
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-3 border-b bg-primary/[0.04] px-4 py-3 sm:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
        <div><p className="text-sm font-semibold">Cost Track Assistant</p><p className="text-xs text-muted-foreground">Terhubung dengan data keuanganmu</p></div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center sm:py-16"><span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/[0.03]"><Sparkles className="size-7" /></span><h2 className="mt-6 font-heading text-2xl font-semibold">Apa yang ingin kamu pahami?</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Angka dihitung langsung dari datamu. Assistant membantu mengubahnya menjadi jawaban yang mudah dipahami.</p><div className="mt-7 grid w-full gap-2 sm:grid-cols-2">{initialSuggestions.map((suggestion) => <Button key={suggestion} className="justify-start rounded-xl bg-background" onClick={() => void ask(suggestion)} type="button" variant="outline"><Sparkles className="text-primary" />{suggestion}</Button>)}</div></div> : messages.map((message, index) => message.role === "user" ? <div key={index} className="ml-auto flex max-w-[88%] flex-row-reverse items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted"><UserRound className="size-4" /></span><p className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">{message.text}</p></div> : <div key={index} className="flex max-w-[94%] items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span><div className="rounded-2xl rounded-tl-sm border bg-background p-4 shadow-xs"><p className="text-sm leading-6">{message.data.answer}</p>{message.data.metric ? <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">{message.data.metric}</p> : null}{message.data.details?.length ? <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{message.data.details.map((detail) => <li key={detail} className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-primary">{detail}</li>)}</ul> : null}<div className="mt-4 flex flex-wrap gap-2">{message.data.suggestions.slice(0, 3).map((suggestion) => <Button key={suggestion} className="rounded-full" onClick={() => void ask(suggestion)} size="sm" type="button" variant="outline">{suggestion}</Button>)}</div></div></div>)}
        {pending ? <div className="flex max-w-[94%] items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span><div className="w-64 space-y-2 rounded-2xl rounded-tl-sm border bg-background p-4"><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/5" /><span className="sr-only">Menganalisis pertanyaan dan menghitung data...</span></div></div> : null}
        {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      <form className="sticky bottom-0 border-t bg-background/95 p-3 backdrop-blur sm:p-4" onSubmit={(event) => { event.preventDefault(); void ask(question); }}><div className="flex gap-2"><label className="sr-only" htmlFor="assistant-question">Pertanyaan keuangan</label><Input id="assistant-question" className="h-12 min-w-0 flex-1" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} placeholder="Tanya kondisi keuanganmu..." /><Button className="size-12 shrink-0" disabled={pending || question.trim().length < 3} size="icon" type="submit" aria-label="Kirim pertanyaan"><Send /></Button></div><p className="mt-2 px-1 text-[11px] text-muted-foreground">Assistant dapat keliru memahami konteks. Periksa kembali keputusan finansial penting.</p></form>
    </section>
  );
}
