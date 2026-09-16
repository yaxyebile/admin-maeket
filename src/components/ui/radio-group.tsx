"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
    value: string;
    onValueChange: (val: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export function RadioGroup({
    value,
    onValueChange,
    children,
    className,
}: {
    value: string;
    onValueChange: (val: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
            <div className={cn("grid gap-2", className)}>{children}</div>
        </RadioGroupContext.Provider>
    );
}

export function RadioGroupItem({
    value,
    id,
    className,
}: {
    value: string;
    id?: string;
    className?: string;
}) {
    const ctx = React.useContext(RadioGroupContext);
    const checked = ctx?.value === value;

    return (
        <button
            type="button"
            id={id}
            role="radio"
            aria-checked={checked}
            onClick={() => ctx?.onValueChange(value)}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
                checked ? "border-primary bg-primary text-white" : "border-slate-400 bg-white",
                className
            )}
        >
            {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </button>
    );
}
