import type { Metadata } from "next";

import { AssistantClient } from "@/components/assistant/assistant-client";

export const metadata: Metadata = { title: "Assistant" };
export default function AssistantPage() { return <AssistantClient />; }
