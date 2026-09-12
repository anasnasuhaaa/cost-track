"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PeriodSelector({ period }: { period: string }) {
  const [year, month] = period.split("-").map(Number);
  const options = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    return {
      value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(date),
    };
  });

  return (
    <form className="flex w-full gap-2 sm:w-auto">
      <Select name="period" defaultValue={period} items={options}>
        <SelectTrigger className="h-11 min-w-0 flex-1 bg-card px-3 sm:w-52">
          <CalendarDays className="size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" type="submit">Terapkan</Button>
    </form>
  );
}
