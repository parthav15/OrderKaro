"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Settings2, UtensilsCrossed, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { CustomizationManager } from "@/components/admin/CustomizationManager"
import { ImageUpload } from "@/components/admin/ImageUpload"
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
    imageUrl: "",
  })
  const [customizationTarget, setCustomizationTarget] = useState<CustomizationPanelTarget | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<any>(null)
  const [deleteItemTarget, setDeleteItemTarget] = useState<any>(null)

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
      setDeleteCategoryTarget(null)
      toast.success("Category deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const createItem = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/canteens/${canteenId}/menu/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-menu"] })
      setShowItemModal(false)
      setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "", imageUrl: "" })
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
      setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "", imageUrl: "" })
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
      setDeleteItemTarget(null)
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
      imageUrl: item.imageUrl || "",
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
    setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: "", tags: "", imageUrl: "" })
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
      imageUrl: itemForm.imageUrl || undefined,
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Menu Management</h1>
          </div>
          <p className="text-neutral-500 ml-13 pl-0.5">Add categories and menu items your customers will see</p>
        </div>
        <div className="flex items-center gap-3">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "" }); setShowCategoryModal(true) }}
          >
            <Plus className="w-5 h-5" /> Add Category
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setEditingItem(null)
              setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: categories?.[0]?.id || "", tags: "", imageUrl: "" })
              setShowItemModal(true)
            }}
          >
            <Plus className="w-5 h-5" /> Add Item
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!menuData || menuData.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <UtensilsCrossed className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">Your menu is empty</h3>
          <p className="text-neutral-400 mb-6">Start by creating a category like "Meals" or "Beverages"</p>
          <Button
            size="lg"
            onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "" }); setShowCategoryModal(true) }}
          >
            <Plus className="w-5 h-5" /> Create First Category
          </Button>
        </motion.div>
      )}

      <div className="space-y-4">
        {menuData?.map((category: any, catIdx: number) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.05 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer py-5"
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.id ? null : category.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedCategory === category.id ? (
                      <ChevronUp className="w-6 h-6 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-neutral-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-brand-black">{category.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {category.items?.length || 0} {category.items?.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditCategory(category)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-600"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteCategoryTarget(category)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium text-brand-red border border-brand-red/30"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="border-t border-neutral-100 pt-4">
                      <div className="space-y-3">
                        {category.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                  <UtensilsCrossed className="w-6 h-6 text-neutral-300" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={item.isVeg ? "veg" : "nonveg"}>
                                    {item.isVeg ? "Veg" : "Non-veg"}
                                  </Badge>
                                  {item.customizations?.length > 0 && (
                                    <Badge variant="default" className="text-xs">
                                      <Settings2 className="w-2.5 h-2.5" />
                                      {item.customizations.length} customisation{item.customizations.length !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-bold text-brand-black">{item.name}</p>
                                <p className="text-lg font-extrabold text-brand-red mt-0.5">{formatPrice(item.price)}</p>
                                {item.tags?.length > 0 && (
                                  <div className="flex gap-1 mt-1.5">
                                    {item.tags.map((tag: string) => (
                                      <Badge key={tag} variant="danger" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => toggleAvailability.mutate(item.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                  item.isAvailable
                                    ? "bg-brand-black text-white"
                                    : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </button>
                              <button
                                onClick={() => setCustomizationTarget({ itemId: item.id, itemName: item.name })}
                                className="p-2.5 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors"
                                title="Manage customisations"
                              >
                                <Settings2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openEditItem(item, category.id)}
                                className="p-2.5 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setDeleteItemTarget({ item, categoryName: category.name })}
                                className="p-2.5 hover:bg-red-50 rounded-xl text-neutral-400 hover:text-brand-red transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {(!category.items || category.items.length === 0) && (
                          <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                            <p className="text-neutral-400 font-medium mb-3">No items in this category yet</p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingItem(null)
                                setItemForm({ name: "", description: "", price: "", isVeg: true, categoryId: category.id, tags: "", imageUrl: "" })
                                setShowItemModal(true)
                              }}
                            >
                              <Plus className="w-4 h-4" /> Add First Item
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
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
        isOpen={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        title="Delete Category"
      >
        {deleteCategoryTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">This action cannot be undone</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Deleting <strong>"{deleteCategoryTarget.name}"</strong> will permanently remove this category and all {deleteCategoryTarget.items?.length || 0} item{deleteCategoryTarget.items?.length !== 1 ? "s" : ""} inside it.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteCategoryTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={deleteCategory.isPending}
                onClick={() => deleteCategory.mutate(deleteCategoryTarget.id)}
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete Category
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        title="Delete Item"
      >
        {deleteItemTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">Are you sure?</p>
                <p className="text-sm text-neutral-600 mt-1">
                  <strong>"{deleteItemTarget.item.name}"</strong> will be permanently removed from the menu.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteItemTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={deleteItem.isPending}
                onClick={() => deleteItem.mutate(deleteItemTarget.item.id)}
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete Item
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Category Name</label>
            <input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g. Meals, Beverages, Snacks"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Description <span className="font-normal text-neutral-400">(optional)</span></label>
            <input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Brief description of this category"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={closeCategoryModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
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
        title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}
      >
        <form onSubmit={handleItemSubmit} className="space-y-5">
          <ImageUpload
            value={itemForm.imageUrl}
            onUpload={(url) => setItemForm({ ...itemForm, imageUrl: url })}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Category</label>
            <select
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-base focus:outline-none focus:border-brand-red"
              required
            >
              <option value="">Select a category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Item Name</label>
            <input
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              placeholder="e.g. Butter Chicken, Masala Chai"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Description <span className="font-normal text-neutral-400">(optional)</span></label>
            <input
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Brief description of this item"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              placeholder="e.g. 120"
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Food Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors border-2 ${
                  itemForm.isVeg
                    ? "bg-brand-black text-white border-brand-black"
                    : "bg-white text-neutral-500 border-neutral-200"
                }`}
              >
                Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors border-2 ${
                  !itemForm.isVeg
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-white text-neutral-500 border-neutral-200"
                }`}
              >
                Non-Vegetarian
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-brand-black">Tags <span className="font-normal text-neutral-400">(comma-separated)</span></label>
            <input
              placeholder="bestseller, new, spicy"
              value={itemForm.tags}
              onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={closeItemModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              loading={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? "Save Changes" : "Add Item to Menu"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
