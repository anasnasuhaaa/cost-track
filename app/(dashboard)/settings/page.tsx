import type { Metadata } from "next";
import { Globe2, Palette, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ThemeMenu } from "@/components/layout/theme-menu";
import { LogoutButton } from "@/components/settings/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="page-container">
      <PageHeader eyebrow="Preferensi" title="Pengaturan" />
      <div className="grid gap-5 lg:grid-cols-2">
        <SettingsCard icon={<UserRound />} title="Profil">
          <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Nama</dt><dd className="mt-1 font-medium">{user.name}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-all font-medium">{user.email}</dd></div></dl>
        </SettingsCard>
        <SettingsCard icon={<Palette />} title="Tampilan"><ThemeMenu /></SettingsCard>
        <SettingsCard icon={<Globe2 />} title="Regional">
          <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Mata uang</dt><dd className="mt-1 font-medium">Rupiah Indonesia (IDR)</dd></div><div><dt className="text-muted-foreground">Zona waktu</dt><dd className="mt-1 font-medium">Asia/Jakarta</dd></div><div><dt className="text-muted-foreground">Format lokal</dt><dd className="mt-1 font-medium">Bahasa Indonesia (id-ID)</dd></div></dl>
        </SettingsCard>
        <SettingsCard icon={<ShieldCheck />} title="Keamanan akun">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-sm text-muted-foreground">Keluar dari sesi ini pada perangkat yang sedang kamu gunakan.</p><LogoutButton /></div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return <Card><CardHeader className="flex-row items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-5">{icon}</span><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}
