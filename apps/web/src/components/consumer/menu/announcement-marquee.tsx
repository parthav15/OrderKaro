"use client"

import { motion } from "framer-motion"
import type { Announcement } from "./types"

interface AnnouncementMarqueeProps {
  announcements: Announcement[] | undefined
}

export function AnnouncementMarquee({ announcements }: AnnouncementMarqueeProps) {
  if (!announcements || announcements.length === 0) return null

  const messages = announcements.map((a) => a.message)
  const isMarquee = messages.length > 1

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-ink text-canvas overflow-hidden"
    >
      {isMarquee ? (
        <div className="relative h-8 flex items-center mask-fade-x">
          <div className="flex animate-marquee pause-on-hover whitespace-nowrap">
            {[...messages, ...messages].map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-6 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-8 flex items-center justify-center gap-2 px-4 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
          <span className="truncate">{messages[0]}</span>
        </div>
      )}
    </motion.div>
  )
}
