import type { Metadata } from "next";
import { CategoriesClient } from "@/components/finance/categories-client";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Kategori" };
export default function CategoriesPage() { return <div className="page-container"><PageHeader eyebrow="Klasifikasi" title="Kategori" description="Gunakan kategori bawaan atau buat kategorimu sendiri." /><CategoriesClient /></div>; }
