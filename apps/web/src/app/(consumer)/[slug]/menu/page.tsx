"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Search, Wallet } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"

const CONSUMER_STORAGE_KEY = "orderkaro-consumer"

interface StoredConsumer {
  id: string
  name: string
  phone: string
  accessToken: string
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isVeg: boolean
  isAvailable: boolean
  tags: string[]
  customizations: Array<{
    id: string
    name: string
    type: string
    isRequired: boolean
    options: Array<{
      id: string
      name: string
      priceAdjustment: string
      isDefault: boolean
    }>
  }>
}

interface Category {
  id: string
  name: string
  items: MenuItem[]
}

export default function MenuPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const tableToken = searchParams.get("table")
  const { addItem, getItemCount, setContext } = useCartStore()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [activeCategory, setActiveCategory] = useState<string>("")
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

  const [consumerReady, setConsumerReady] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [showIdentifyModal, setShowIdentifyModal] = useState(false)
  const [identifyForm, setIdentifyForm] = useState({ name: "", phone: "" })
  const [identifyLoading, setIdentifyLoading] = useState(false)
  const [identifyError, setIdentifyError] = useState("")

  const identifyConsumer = useCallback(async (name: string, phone: string) => {
    const { data } = await api.post("/api/v1/public/identify", { name, phone })
    return data.data as {
      consumer: { id: string; name: string; phone: string }
      wallet: { balance: number }
      accessToken: string
    }
  }, [])

  useEffect(() => {
    async function bootstrap() {
      const raw = localStorage.getItem(CONSUMER_STORAGE_KEY)
      if (!raw) {
        setShowIdentifyModal(true)
        return
      }

      try {
        const stored: StoredConsumer = JSON.parse(raw)
        const result = await identifyConsumer(stored.name, stored.phone)

        const updatedConsumer: StoredConsumer = {
          id: result.consumer.id,
          name: result.consumer.name,
          phone: result.consumer.phone,
          accessToken: result.accessToken,
        }
        localStorage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(updatedConsumer))

        setAuth(
          { id: result.consumer.id, name: result.consumer.name, phone: result.consumer.phone, role: "CONSUMER" },
          result.accessToken,
          ""
        )
        setWalletBalance(result.wallet.balance)
        setConsumerReady(true)
      } catch {
        localStorage.removeItem(CONSUMER_STORAGE_KEY)
        setShowIdentifyModal(true)
      }
    }

    bootstrap()
  }, [identifyConsumer, setAuth])

  async function handleIdentifySubmit(e: React.FormEvent) {
    e.preventDefault()
    setIdentifyError("")

    const phone = identifyForm.phone.trim()
    const name = identifyForm.name.trim()

    if (!name) {
      setIdentifyError("Please enter your name")
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      setIdentifyError("Enter a valid 10-digit phone number")
      return
    }

    setIdentifyLoading(true)
    try {
      const result = await identifyConsumer(name, phone)

      const stored: StoredConsumer = {
        id: result.consumer.id,
        name: result.consumer.name,
        phone: result.consumer.phone,
        accessToken: result.accessToken,
      }
      localStorage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(stored))

      setAuth(
        { id: result.consumer.id, name: result.consumer.name, phone: result.consumer.phone, role: "CONSUMER" },
        result.accessToken,
        ""
      )
      setWalletBalance(result.wallet.balance)
      setShowIdentifyModal(false)
      setConsumerReady(true)
    } catch (err: any) {
      setIdentifyError(err.response?.data?.error || "Something went wrong. Please try again.")
    } finally {
      setIdentifyLoading(false)
    }
  }

  const { data: qrData } = useQuery({
    queryKey: ["resolve-qr", tableToken],
    queryFn: () => api.get(`/api/v1/public/resolve-qr/${tableToken}`).then((r) => r.data.data),
    enabled: !!tableToken,
  })

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu", params.slug],
    queryFn: () => api.get(`/api/v1/public/canteen/${params.slug}/menu`).then((r) => r.data.data),
  })

  useEffect(() => {
    if (menuData?.categories?.[0]) {
      setActiveCategory(menuData.categories[0].id)
    }
  }, [menuData])

  useEffect(() => {
    if (qrData?.canteen?.id && qrData?.table?.id) {
      setContext(qrData.canteen.id, qrData.table.id)
    }
  }, [qrData, setContext])

  const categories: Category[] = menuData?.categories || []

  const filteredCategories = search
    ? categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : categories

  function handleAddToCart() {
    if (!selectedItem) return

    const opts = Object.entries(selectedOptions).map(([custId, optIds]) => {
      const cust = selectedItem.customizations.find((c) => c.id === custId)
      const selectedOpts = cust?.options.filter((o) => optIds.includes(o.id)) || []
      return {
        customizationId: custId,
        customizationName: cust?.name || "",
        optionIds: optIds,
        optionNames: selectedOpts.map((o) => o.name),
        priceAdjustment: selectedOpts.reduce((s, o) => s + Number(o.priceAdjustment), 0),
      }
    })

    addItem({
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      price: Number(selectedItem.price),
      quantity,
      imageUrl: selectedItem.imageUrl || undefined,
      isVeg: selectedItem.isVeg,
      selectedOptions: opts,
    })

    setSelectedItem(null)
    setQuantity(1)
    setSelectedOptions({})
  }

  function toggleOption(customizationId: string, optionId: string, type: string) {
    setSelectedOptions((prev) => {
      const current = prev[customizationId] || []
      if (type === "SINGLE_SELECT") {
        return { ...prev, [customizationId]: [optionId] }
      }
      if (current.includes(optionId)) {
        return { ...prev, [customizationId]: current.filter((id) => id !== optionId) }
      }
      return { ...prev, [customizationId]: [...current, optionId] }
    })
  }

  const itemCount = getItemCount()

  return (
    <>
      <AnimatePresence>
        {showIdentifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-sm"
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-brand-black">
                  Order<span className="text-brand-red">Karo</span>
                </h1>
                <p className="text-neutral-500 mt-2 text-sm">
                  {menuData?.canteen?.name
                    ? `Welcome to ${menuData.canteen.name}`
                    : "Welcome!"}
                </p>
              </div>

              <form onSubmit={handleIdentifySubmit} className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="Enter your full name"
                  value={identifyForm.name}
                  onChange={(e) => setIdentifyForm({ ...identifyForm, name: e.target.value })}
                  required
                  autoFocus
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={identifyForm.phone}
                  onChange={(e) => setIdentifyForm({ ...identifyForm, phone: e.target.value })}
                  maxLength={10}
                  required
                />

                <AnimatePresence>
                  {identifyError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-brand-red font-medium"
                    >
                      {identifyError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={identifyLoading}
                >
                  Continue to Menu
                </Button>
              </form>

              <p className="text-center text-xs text-neutral-400 mt-6">
                Your info is used only for this order session
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-white pb-24">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-0 z-30 bg-white border-b border-neutral-100"
            >
              <div className="px-4 py-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-brand-black">
                    {menuData?.canteen?.name || "Menu"}
                  </h1>
                  {qrData?.table && (
                    <p className="text-sm text-neutral-500">{qrData.table.label}</p>
                  )}
                </div>
                {consumerReady && walletBalance !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 bg-neutral-100 rounded-xl px-3 py-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5 text-brand-black" />
                    <span className="text-xs font-bold text-brand-black">
                      {formatPrice(walletBalance)}
                    </span>
                  </motion.div>
                )}
              </div>

              {qrData?.announcements?.length > 0 && (
                <div className="px-4 pb-2">
                  {qrData.announcements.map((a: any) => (
                    <div key={a.id} className="bg-brand-red/10 text-brand-red text-sm px-3 py-2 rounded-lg">
                      {a.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {!search && (
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === cat.id
                          ? "bg-brand-red text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="px-4 py-4 space-y-6">
              {filteredCategories.map((category, catIdx) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.05 }}
                >
                  {search && (
                    <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
                      {category.name}
                    </h2>
                  )}
                  {(search || activeCategory === category.id) && (
                    <div className="space-y-3">
                      {category.items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => {
                            if (item.isAvailable) {
                              setSelectedItem(item)
                              setQuantity(1)
                              const defaults: Record<string, string[]> = {}
                              item.customizations.forEach((c) => {
                                const def = c.options.filter((o) => o.isDefault).map((o) => o.id)
                                if (def.length) defaults[c.id] = def
                              })
                              setSelectedOptions(defaults)
                            }
                          }}
                          className={`flex gap-3 p-3 rounded-xl border border-neutral-100 ${
                            item.isAvailable ? "cursor-pointer hover:shadow-sm transition-shadow" : "opacity-50"
                          }`}
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                                item.isVeg ? "border-brand-black" : "border-brand-red"
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  item.isVeg ? "bg-brand-black" : "bg-brand-red"
                                }`} />
                              </span>
                              <h3 className="font-semibold text-brand-black text-sm truncate">{item.name}</h3>
                            </div>
                            {item.description && (
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-bold text-brand-black">{formatPrice(item.price)}</span>
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="danger">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          {item.isAvailable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="self-center flex-shrink-0 border-brand-red text-brand-red"
                              onClick={(e) => {
                                e.stopPropagation()
                                addItem({
                                  menuItemId: item.id,
                                  name: item.name,
                                  price: Number(item.price),
                                  quantity: 1,
                                  imageUrl: item.imageUrl || undefined,
                                  isVeg: item.isVeg,
                                  selectedOptions: [],
                                })
                              }}
                            >
                              ADD
                            </Button>
                          )}
                          {!item.isAvailable && (
                            <span className="self-center text-xs text-neutral-400 font-medium">Unavailable</span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {itemCount > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-neutral-100"
              >
                <Link href={`/${params.slug}/cart`}>
                  <Button className="w-full" size="lg">
                    <ShoppingCart className="w-5 h-5" />
                    View Cart ({itemCount} items)
                  </Button>
                </Link>
              </motion.div>
            )}

            <BottomSheet
              isOpen={!!selectedItem}
              onClose={() => setSelectedItem(null)}
              title={selectedItem?.name}
            >
              {selectedItem && (
                <div className="space-y-4">
                  {selectedItem.imageUrl && (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  )}
                  {selectedItem.description && (
                    <p className="text-sm text-neutral-600">{selectedItem.description}</p>
                  )}
                  <p className="text-xl font-bold">{formatPrice(selectedItem.price)}</p>

                  {selectedItem.customizations.map((cust) => (
                    <div key={cust.id}>
                      <h4 className="font-semibold text-sm mb-2">
                        {cust.name}
                        {cust.isRequired && <span className="text-brand-red"> *</span>}
                      </h4>
                      <div className="space-y-2">
                        {cust.options.map((opt) => {
                          const isSelected = (selectedOptions[cust.id] || []).includes(opt.id)
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(cust.id, opt.id, cust.type)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-colors ${
                                isSelected
                                  ? "border-brand-red bg-red-50"
                                  : "border-neutral-200"
                              }`}
                            >
                              <span>{opt.name}</span>
                              {Number(opt.priceAdjustment) > 0 && (
                                <span className="text-neutral-500">+{formatPrice(opt.priceAdjustment)}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-neutral-200 rounded-xl">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-lg font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <Button className="flex-1" size="lg" onClick={handleAddToCart}>
                      Add {formatPrice(Number(selectedItem.price) * quantity)}
                    </Button>
                  </div>
                </div>
              )}
            </BottomSheet>
          </>
        )}
      </div>
    </>
  )
}
