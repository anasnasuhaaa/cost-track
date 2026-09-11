"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => undefined;

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted) return <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" aria-label="Pilih tema">
      {[{ value: "light", label: "Terang", icon: Sun }, { value: "dark", label: "Gelap", icon: Moon }, { value: "system", label: "Sistem", icon: Monitor }].map((item) => (
        <button
          key={item.value}
          className={`flex h-8 items-center justify-center gap-1 rounded-lg text-xs transition ${theme === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          onClick={() => setTheme(item.value)}
          type="button"
          title={item.label}
          aria-pressed={theme === item.value}
        >
          <item.icon className="size-3.5" /><span className="sr-only xl:not-sr-only">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
