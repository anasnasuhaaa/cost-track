import type { Metadata } from "next";

import { AssistantClient } from "@/components/assistant/assistant-client";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Assistant" };
export default function AssistantPage() { return <div className="page-container"><PageHeader eyebrow="Finance Assistant" title="Tanya keuanganmu" description="Jawaban ringkas dengan angka yang dihitung langsung dari datamu." /><AssistantClient /></div>; }
