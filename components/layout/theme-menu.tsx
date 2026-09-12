"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => undefined;

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted) return <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" aria-label="Pilih tema" role="group">
      {[{ value: "light", label: "Terang", icon: Sun }, { value: "dark", label: "Gelap", icon: Moon }, { value: "system", label: "Sistem", icon: Monitor }].map((item) => (
        <Button
          key={item.value}
          className={`h-11 gap-1.5 rounded-lg px-2 text-xs font-medium ${theme === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTheme(item.value)}
          type="button"
          variant="ghost"
          title={item.label}
          aria-pressed={theme === item.value}
        >
          <item.icon className="size-3.5" /><span>{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
