"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function serializeDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function DatePicker({ value, onChange, name, placeholder = "Pilih tanggal", className, ariaLabel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <PopoverTrigger
        aria-label={ariaLabel ?? placeholder}
        render={
          <Button
            className={cn("h-11 w-full justify-start bg-background px-3 font-normal", !selected && "text-muted-foreground", className)}
            variant="outline"
          />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="truncate">{selected ? format(selected, "d MMMM yyyy", { locale: id }) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          locale={id}
          onSelect={(date) => {
            if (!date) return;
            onChange(serializeDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
