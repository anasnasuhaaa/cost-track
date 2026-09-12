import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";

import { AccountsClient } from "@/components/finance/accounts-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akun" };
export default function AccountsPage() { return <div className="page-container"><PageHeader eyebrow="Sumber dana" title="Akun keuangan" action={<Button render={<Link href="/categories" />} variant="outline"><Tags />Kelola kategori</Button>} /><AccountsClient /></div>; }
