"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-brand-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20",
            error && "border-brand-red",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-brand-red">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
