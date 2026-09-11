import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";

import { AccountsClient } from "@/components/finance/accounts-client";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Akun" };
export default function AccountsPage() { return <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Sumber dana" title="Akun keuangan" description="Pantau saldo Cash, rekening bank, dan e-wallet dari satu tempat." action={<Link href="/categories" className="tap-target flex items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold"><Tags className="size-4" />Kelola kategori</Link>} /><AccountsClient /></div>; }
