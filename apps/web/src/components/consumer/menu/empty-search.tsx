"use client"

import { motion } from "framer-motion"

interface EmptySearchProps {
  query: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  onReset?: () => void
}

export function EmptySearch({ query, suggestions = [], onSuggestionClick, onReset }: EmptySearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 px-4 text-center max-w-md mx-auto"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">
        No matches
      </p>
      <h3 className="font-heading text-3xl font-extrabold text-ink mt-3 leading-tight">
        We couldn&apos;t find anything for{" "}
        <span className="font-serif italic font-normal">&ldquo;{query}&rdquo;</span>
      </h3>
      {suggestions.length > 0 && (
        <p className="font-serif italic text-base text-ink/55 mt-4">
          Try{" "}
          {suggestions.map((s, i) => (
            <span key={s}>
              {i > 0 && (i === suggestions.length - 1 ? ", or " : ", ")}
              <button
                type="button"
                onClick={() => onSuggestionClick?.(s)}
                className="not-italic font-sans font-semibold text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink"
              >
                {s}
              </button>
            </span>
          ))}
          .
        </p>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
        >
          Clear search →
        </button>
      )}
    </motion.div>
  )
}
