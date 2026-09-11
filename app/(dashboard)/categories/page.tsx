import type { Metadata } from "next";
import { CategoriesClient } from "@/components/finance/categories-client";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Kategori" };
export default function CategoriesPage() { return <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Klasifikasi" title="Kategori" description="Gunakan kategori bawaan atau buat kategorimu sendiri." /><CategoriesClient /></div>; }
