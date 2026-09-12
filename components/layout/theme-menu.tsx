"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => undefined;

export function ThemeMenu() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted) return <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />;
  const activeTheme = theme === "dark" || (theme === "system" && resolvedTheme === "dark") ? "dark" : "light";

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" aria-label="Pilih tema" role="group">
      {[{ value: "light", label: "Terang", icon: Sun }, { value: "dark", label: "Gelap", icon: Moon }].map((item) => (
        <Button
          key={item.value}
          className={`h-11 gap-1.5 rounded-lg px-2 text-xs font-medium ${activeTheme === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTheme(item.value)}
          type="button"
          variant="ghost"
          title={item.label}
          aria-pressed={activeTheme === item.value}
        >
          <item.icon className="size-3.5" /><span>{item.label}</span>
        </Button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const dark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  if (!mounted) return <span className="size-10 animate-pulse rounded-full bg-muted" aria-hidden />;

  return (
    <Button
      className="size-10 rounded-full bg-card text-primary shadow-sm ring-1 ring-border"
      onClick={() => setTheme(dark ? "light" : "dark")}
      size="icon"
      type="button"
      variant="ghost"
      aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={dark ? "Tema terang" : "Tema gelap"}
    >
      {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  );
}
