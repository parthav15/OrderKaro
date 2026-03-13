"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { CustomizationManager } from "@/components/admin/CustomizationManager"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface CustomizationPanelTarget {
  itemId: string
  itemName: string
}

export default function MenuManagement() {
  const queryClient = useQueryClient()
  const [canteenId, setCanteenId] = useState<string>("")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    isVeg: true,
    categoryId: "",
    tags: "",
  })
  const [customizationTarget, setCustomizationTarget] = useState<CustomizationPanelTarget | null>(null)

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: categories } = useQuery({
    queryKey: ["categories", canteenId],
    queryFn: () => api.get(`/api/v1/canteens/${canteenId}/categories`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["full-menu", canteenId],
    queryFn: () => api.get(`/api/v1/canteens/${canteenId}/menu`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const createCategory = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/canteens/${canteenId}/categories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      setShowCategoryModal(false)
      setCategoryForm({ name: "", description: "" })
      setEditingCategory(null)
      toast.success("Category created")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const updateCategory = useMutation({
    mutationFn: ({ catId, data }: { catId: string; data: any }) =>
      api.put(`/api/v1/canteens/${canteenId}/categories/${catId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      setShowCategoryModal(false)
      setCategoryForm({ name: "", description: "" })
      setEditingCategory(null)
      toast.success("Category updated")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const deleteCategory = useMutation({
    mutationFn: (catId: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/categories/${catId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      toast.success("Category deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const createItem = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/canteens/${canteenId}/menu/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      setShowItemModal(false)
      setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "" })
      setEditingItem(null)
      toast.success("Item created")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      api.put(`/api/v1/canteens/${canteenId}/menu/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      setShowItemModal(false)
      setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "" })
      setEditingItem(null)
      toast.success("Item updated")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const toggleAvailability = useMutation({
    mutationFn: (itemId: string) =>
      api.patch(`/api/v1/canteens/${canteenId}/menu/items/${itemId}/availability`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["full-menu"] }),
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/menu/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      toast.success("Item deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  function openEditCategory(cat: any) {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name, description: cat.description || "" })
    setShowCategoryModal(true)
  }

  function openEditItem(item: any, categoryId: string) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      isVeg: item.isVeg,
      categoryId,
      tags: item.tags?.join(", ") || "",
    })
    setShowItemModal(true)
  }

  function closeCategoryModal() {
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({ name: "", description: "" })
  }

  function closeItemModal() {
    setShowItemModal(false)
    setEditingItem(null)
    setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "" })
  }

  function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingCategory) {
      updateCategory.mutate({ catId: editingCategory.id, data: categoryForm })
    } else {
      createCategory.mutate(categoryForm)
    }
  }

  function handleItemSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...itemForm,
      price: Number(itemForm.price),
      tags: itemForm.tags ? itemForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    }
    if (editingItem) {
      updateItem.mutate({ itemId: editingItem.id, data: payload })
    } else {
      createItem.mutate(payload)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Menu Management</h1>
          <p className="text-neutral-500 mt-1">Manage categories and menu items</p>
        </div>
        <div className="flex items-center gap-2">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Button variant="outline" onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "" }); setShowCategoryModal(true) }}>
            <Plus className="w-4 h-4" /> Category
          </Button>
          <Button onClick={() => {
            setEditingItem(null)
            setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: categories?.[0]?.id || "", tags: "" })
            setShowItemModal(true)
          }}>
            <Plus className="w-4 h-4" /> Item
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!menuData?.categories || menuData.categories.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl"
        >
          <p className="text-neutral-400 font-medium">No categories yet. Create one to start adding items.</p>
        </motion.div>
      )}

      <div className="space-y-4">
        {menuData?.categories?.map((category: any, catIdx: number) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.05 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.id ? null : category.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-brand-black">{category.name}</h3>
                    <p className="text-sm text-neutral-500">{category.items?.length || 0} items</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditCategory(category)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${category.name}"? All items will be deleted.`)) {
                          deleteCategory.mutate(category.id)
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-brand-red" />
                    </button>
                    {expandedCategory === category.id ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedCategory === category.id && (
                <CardContent>
                  <div className="space-y-3">
                    {category.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-100"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={item.isVeg ? "veg" : "nonveg"}>
                                {item.isVeg ? "Veg" : "Non-veg"}
                              </Badge>
                              <span className="font-semibold text-sm">{item.name}</span>
                              {item.customizations?.length > 0 && (
                                <Badge variant="default" className="text-xs">
                                  <Settings2 className="w-2.5 h-2.5" />
                                  {item.customizations.length} group{item.customizations.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-bold mt-0.5">{formatPrice(item.price)}</p>
                            {item.tags?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {item.tags.map((tag: string) => (
                                  <Badge key={tag} variant="danger" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAvailability.mutate(item.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              item.isAvailable
                                ? "bg-brand-black text-white"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </button>
                          <button
                            onClick={() =>
                              setCustomizationTarget({ itemId: item.id, itemName: item.name })
                            }
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
                            title="Manage customizations"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditItem(item, category.id)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${item.name}"?`)) {
                                deleteItem.mutate(item.id)
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-brand-red"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!category.items || category.items.length === 0) && (
                      <p className="text-sm text-neutral-400 text-center py-4">No items in this category</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {customizationTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setCustomizationTarget(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <CustomizationManager
                itemId={customizationTarget.itemId}
                itemName={customizationTarget.itemName}
                canteenId={canteenId}
                onClose={() => setCustomizationTarget(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={closeCategoryModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showItemModal}
        onClose={closeItemModal}
        title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
              required
            >
              <option value="">Select category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Item Name"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
          />
          <Input
            label="Price (₹)"
            type="number"
            min="0"
            step="0.01"
            value={itemForm.price}
            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
            required
          />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Type:</label>
            <button
              type="button"
              onClick={() => setItemForm({ ...itemForm, isVeg: true })}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                itemForm.isVeg ? "bg-brand-black text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              Veg
            </button>
            <button
              type="button"
              onClick={() => setItemForm({ ...itemForm, isVeg: false })}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                !itemForm.isVeg ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              Non-veg
            </button>
          </div>
          <Input
            label="Tags (comma-separated)"
            placeholder="bestseller, new, spicy"
            value={itemForm.tags}
            onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={closeItemModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
