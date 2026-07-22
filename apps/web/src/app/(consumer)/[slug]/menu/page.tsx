"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { useScrollSpy } from "@/hooks/use-scroll-spy"
import { triggerFlyToCart } from "@/hooks/use-fly-to-cart"

import { MenuHero } from "@/components/consumer/menu/menu-hero"
import { MenuStickyHeader } from "@/components/consumer/menu/menu-sticky-header"
import { CategoryNav } from "@/components/consumer/menu/category-nav"
import { AnnouncementMarquee } from "@/components/consumer/menu/announcement-marquee"
import { SignatureRail } from "@/components/consumer/menu/signature-rail"
import { SectionHeading } from "@/components/consumer/menu/section-heading"
import { ItemRow } from "@/components/consumer/menu/item-row"
import { CartDrawer } from "@/components/consumer/menu/cart-drawer"
import { ItemDetailSheet } from "@/components/consumer/menu/item-detail-sheet"
import { IdentifyModal } from "@/components/consumer/menu/identify-modal"
import { EmptySearch } from "@/components/consumer/menu/empty-search"
import { MenuSkeleton } from "@/components/consumer/menu/menu-skeleton"
import { FlyToCartLayer } from "@/components/consumer/menu/fly-to-cart-layer"
import { ArViewer } from "@/components/consumer/menu/ar-viewer"
import { StorefrontTheme } from "@/components/consumer/storefront-theme"
import { useViewTracking } from "@/hooks/use-view-tracking"

import type { Category, MenuItem, Announcement, ResolvedTable } from "@/components/consumer/menu/types"

const SIGNATURE_TAG_PATTERN = /popular|chef|signature|special|featured|bestseller/i
const STICKY_OFFSET = 132

interface VerifiedResult {
  consumer: { id: string; name: string; phone: string }
  accessToken: string
  refreshToken: string
}

export default function MenuPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const searchParams = useSearchParams()
  const tableToken = searchParams.get("table")

  const setContext = useCartStore((s) => s.setContext)
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [search, setSearch] = useState("")
  const [activeCategoryId, setActiveCategoryId] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [arItem, setArItem] = useState<MenuItem | null>(null)

  const [showIdentifyModal, setShowIdentifyModal] = useState(false)

  const isConsumerSession = !!accessToken && user?.role === "CONSUMER"

  const { data: walletData } = useQuery({
    queryKey: ["consumer-wallet", slug, user?.id],
    queryFn: () => api.get(`/api/v1/consumer/wallet?slug=${slug}`).then((r) => r.data.data),
    enabled: isConsumerSession,
  })
  const walletBalance = walletData?.balance != null ? Number(walletData.balance) : null

  useEffect(() => {
    if (!isConsumerSession) setShowIdentifyModal(true)
  }, [isConsumerSession])

  function handleVerified(result: VerifiedResult) {
    setAuth(
      {
        id: result.consumer.id,
        name: result.consumer.name,
        phone: result.consumer.phone,
        role: "CONSUMER",
      },
      result.accessToken,
      result.refreshToken
    )
    setShowIdentifyModal(false)
  }

  const { data: qrData } = useQuery({
    queryKey: ["resolve-qr", tableToken],
    queryFn: () => api.get(`/api/v1/public/resolve-qr/${tableToken}`).then((r) => r.data.data),
    enabled: !!tableToken,
  })

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api.get(`/api/v1/public/restaurant/${slug}/menu`).then((r) => r.data.data),
  })

  const categories: Category[] = useMemo(() => menuData?.categories ?? [], [menuData])

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search, categories])

  const sectionIds = useMemo(
    () => filteredCategories.map((c) => `cat-${c.id}`),
    [filteredCategories]
  )
  const spiedId = useScrollSpy(sectionIds)

  useEffect(() => {
    if (spiedId) {
      const id = spiedId.replace("cat-", "")
      setActiveCategoryId(id)
    }
  }, [spiedId])

  useEffect(() => {
    if (filteredCategories[0] && !activeCategoryId) {
      setActiveCategoryId(filteredCategories[0].id)
    }
  }, [filteredCategories, activeCategoryId])

  useEffect(() => {
    if (qrData?.restaurant?.id && qrData?.table?.id) {
      setContext(qrData.restaurant.id, qrData.table.id)
    }
  }, [qrData, setContext])

  useEffect(() => {
    if (!tableToken && menuData?.restaurant?.id) {
      setContext(menuData.restaurant.id, null)
    }
  }, [tableToken, menuData, setContext])

  const signatureItems = useMemo(() => {
    const tagged: MenuItem[] = []
    for (const cat of categories) {
      for (const item of cat.items) {
        if (!item.isAvailable) continue
        if (item.tags.some((t) => SIGNATURE_TAG_PATTERN.test(t))) {
          tagged.push(item)
        }
      }
    }
    if (tagged.length >= 2) return tagged.slice(0, 6)
    const fallback: MenuItem[] = []
    for (const cat of categories.slice(0, 4)) {
      const first = cat.items.find((i) => i.isAvailable && i.imageUrl)
      if (first) fallback.push(first)
    }
    return fallback.slice(0, 4)
  }, [categories])

  const inlineQuantities = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of cartItems) {
      const noOptions = item.selectedOptions.length === 0 && !item.notes
      if (!noOptions) continue
      map[item.menuItemId] = (map[item.menuItemId] ?? 0) + item.quantity
    }
    return map
  }, [cartItems])

  function findInlineCartIndex(menuItemId: string): number {
    return cartItems.findIndex(
      (i) => i.menuItemId === menuItemId && i.selectedOptions.length === 0 && !i.notes
    )
  }

  function handleQuickAdd(item: MenuItem, sourceEl: HTMLElement | null) {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      imageUrl: item.imageUrl || undefined,
      isVeg: item.isVeg,
      selectedOptions: [],
    })
    triggerFlyToCart({
      source: sourceEl,
      src: item.imageUrl,
      label: item.name,
      isVeg: item.isVeg,
    })
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(8)
    }
  }

  function handleIncrement(item: MenuItem) {
    const idx = findInlineCartIndex(item.id)
    if (idx === -1) {
      handleQuickAdd(item, null)
      return
    }
    updateQuantity(idx, cartItems[idx].quantity + 1)
  }

  function handleDecrement(item: MenuItem) {
    const idx = findInlineCartIndex(item.id)
    if (idx === -1) return
    const next = cartItems[idx].quantity - 1
    if (next <= 0) {
      removeItem(idx)
      return
    }
    updateQuantity(idx, next)
  }

  function handleSelectCategory(categoryId: string) {
    setActiveCategoryId(categoryId)
    const el = document.getElementById(`cat-${categoryId}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET
    window.scrollTo({ top, behavior: "smooth" })
  }

  function handleAddFromSheet(params: {
    item: MenuItem
    quantity: number
    selectedOptions: Record<string, string[]>
  }) {
    const { item, quantity, selectedOptions } = params
    const opts = Object.entries(selectedOptions).map(([custId, optIds]) => {
      const cust = item.customizations.find((c) => c.id === custId)
      const selected = cust?.options.filter((o) => optIds.includes(o.id)) || []
      return {
        customizationId: custId,
        customizationName: cust?.name || "",
        optionIds: optIds,
        optionNames: selected.map((o) => o.name),
        priceAdjustment: selected.reduce((s, o) => s + Number(o.priceAdjustment), 0),
      }
    })
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity,
      imageUrl: item.imageUrl || undefined,
      isVeg: item.isVeg,
      selectedOptions: opts,
    })
    setSelectedItem(null)
  }

  const { trackItemView } = useViewTracking(slug, !!menuData)

  const handleOpenItem = useCallback(
    (item: MenuItem) => {
      setSelectedItem(item)
      trackItemView(item.id, "ITEM")
    },
    [trackItemView]
  )

  const handleOpenAr = useCallback(
    (item: MenuItem) => {
      setArItem(item)
      trackItemView(item.id, "AR")
    },
    [trackItemView]
  )

  const announcements: Announcement[] | undefined = qrData?.announcements
  const tableInfo: ResolvedTable | undefined = qrData?.table
  const restaurantName = menuData?.restaurant?.name ?? "Menu"
  const closingTime = menuData?.restaurant?.closingTime ?? qrData?.restaurant?.closingTime ?? null
  const isOpen = qrData?.isOpen ?? true
  const consumerFirstName = user?.name?.split(" ")[0] ?? null

  const selectedItemNumber = useMemo(() => {
    if (!selectedItem) return null
    for (const cat of filteredCategories) {
      const idx = cat.items.findIndex((i) => i.id === selectedItem.id)
      if (idx !== -1) return idx + 1
    }
    return null
  }, [selectedItem, filteredCategories])

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return []
    return categories
      .flatMap((c) => c.items.map((i) => i.name))
      .slice(0, 3)
  }, [search, categories])

  return (
    <>
      <IdentifyModal
        isOpen={showIdentifyModal}
        restaurantName={menuData?.restaurant?.name}
        onVerified={handleVerified}
      />

      <FlyToCartLayer />

      {arItem?.model3dUrl && (
        <ArViewer
          modelUrl={arItem.model3dUrl}
          posterUrl={arItem.model3dPosterUrl}
          usdzUrl={arItem.model3dUsdzUrl}
          itemName={arItem.name}
          onClose={() => setArItem(null)}
        />
      )}

      <StorefrontTheme
        primaryColor={menuData?.restaurant?.primaryColor}
        className="min-h-screen bg-white pb-32"
      >
        {isLoading ? (
          <MenuSkeleton />
        ) : (
          <>
            <AnnouncementMarquee announcements={announcements} />

            <MenuHero
              consumerFirstName={consumerFirstName}
              restaurantName={restaurantName}
              tableLabel={tableInfo?.label ?? null}
              walletBalance={walletBalance}
              closingTime={closingTime}
              isOpen={isOpen}
            />

            <MenuStickyHeader
              restaurantName={restaurantName}
              walletBalance={walletBalance}
              search={search}
              onSearchChange={setSearch}
            >
              {!search.trim() && (
                <CategoryNav
                  categories={categories}
                  activeId={activeCategoryId}
                  onSelect={handleSelectCategory}
                />
              )}
            </MenuStickyHeader>

            {!search.trim() && signatureItems.length > 0 && (
              <SignatureRail
                items={signatureItems}
                inlineQuantities={inlineQuantities}
                onOpen={(item) => handleOpenItem(item)}
                onAdd={(item, el) => handleQuickAdd(item, el)}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            )}

            <main className="px-5 pt-6 pb-12">
              {filteredCategories.length === 0 ? (
                <EmptySearch
                  query={search}
                  suggestions={searchSuggestions}
                  onSuggestionClick={(s) => setSearch(s)}
                  onReset={() => setSearch("")}
                />
              ) : (
                <div className="space-y-14">
                  {filteredCategories.map((category) => (
                    <section
                      key={category.id}
                      id={`cat-${category.id}`}
                      className="scroll-mt-[140px]"
                    >
                      <SectionHeading title={category.name} count={category.items.length} />
                      <div>
                        {category.items.map((item, idx) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            number={idx + 1}
                            inlineQuantity={inlineQuantities[item.id] ?? 0}
                            onOpen={() => handleOpenItem(item)}
                            onViewAr={item.model3dUrl ? () => handleOpenAr(item) : undefined}
                            onAdd={(el) => handleQuickAdd(item, el)}
                            onIncrement={() => handleIncrement(item)}
                            onDecrement={() => handleDecrement(item)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </main>
          </>
        )}
      </StorefrontTheme>

      <CartDrawer slug={slug} />

      <ItemDetailSheet
        item={selectedItem}
        number={selectedItemNumber}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddFromSheet}
        onViewAr={selectedItem?.model3dUrl ? () => handleOpenAr(selectedItem) : undefined}
      />
    </>
  )
}
