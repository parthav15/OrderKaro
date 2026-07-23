"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"

interface CartDrawerProps {
  slug: string
}

export function CartDrawer({ slug }: CartDrawerProps) {
  const items = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.getItemCount())
  const total = useCartStore((s) => s.getTotal())

  const controls = useAnimationControls()
  const previousCount = useRef<number>(itemCount)

  useEffect(() => {
    if (itemCount > previousCount.current) {
      controls.start({
        scale: [1, 1.035, 1],
        transition: { duration: 0.35, times: [0, 0.45, 1], ease: [0.22, 1, 0.36, 1] },
      })
    }
    previousCount.current = itemCount
  }, [itemCount, controls])

  const previewItems = items.slice(0, 3)
  const remaining = Math.max(0, items.length - previewItems.length)

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pointer-events-none"
        >
          <Link href={`/${slug}/cart`} className="block pointer-events-auto">
            <motion.div
              data-cart-target
              animate={controls}
              className="bg-ink text-canvas rounded-[22px] px-4 py-3 flex items-center gap-4 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.35)] border border-canvas/[0.04]"
            >
              <div className="flex items-center -space-x-2.5">
                {previewItems.map((item, i) => (
                  <div
                    key={`${item.menuItemId}-${i}`}
                    className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-ink bg-canvas/10 flex items-center justify-center"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-serif italic text-base text-canvas/85">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="w-9 h-9 rounded-full border-2 border-ink bg-canvas/15 flex items-center justify-center text-[10px] font-bold">
                    +{remaining}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-canvas/55 font-bold leading-none">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
                <p className="text-[17px] font-extrabold leading-tight tabular-nums mt-1">
                  {formatPrice(total)}
                </p>
              </div>

              <motion.div
                whileHover={{ x: 2 }}
                className="flex items-center gap-1.5 text-sm font-bold pl-2"
              >
                View cart
                <ChevronRight className="w-4 h-4" strokeWidth={2.6} />
              </motion.div>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
