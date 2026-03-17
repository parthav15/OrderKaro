import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const OWNER_EMAIL = "sachidanandsabrwal@gmail.com"

const menu = [
  {
    category: "Tea & Milk",
    sortOrder: 1,
    items: [
      { name: "Black Tea", price: 10, isVeg: true },
      { name: "Milk Tea", price: 15, isVeg: true },
      { name: "Elaichi Tea", price: 15, isVeg: true },
      { name: "Ginger Tea", price: 15, isVeg: true },
      { name: "Masala Tea", price: 20, isVeg: true },
      { name: "Lemon Tea", price: 20, isVeg: true },
      { name: "Green Tea", price: 20, isVeg: true },
    ],
  },
  {
    category: "Coffee",
    sortOrder: 2,
    items: [
      { name: "Black Coffee", price: 25, isVeg: true },
      { name: "Milk Coffee", price: 40, isVeg: true },
    ],
  },
  {
    category: "Shakes",
    sortOrder: 3,
    items: [
      { name: "Cold Coffee", price: 50, isVeg: true },
      { name: "Banana Shake", price: 50, isVeg: true },
      { name: "Chocolate Shake", price: 50, isVeg: true },
      { name: "Flavoured Shakes", price: 50, isVeg: true },
    ],
  },
  {
    category: "Beverages",
    sortOrder: 4,
    items: [
      { name: "Soft Drink", price: 50, isVeg: true },
      { name: "Water Bottle", price: 20, isVeg: true },
      { name: "Soya Milk", price: 40, isVeg: true },
      { name: "Sweet Lassi", price: 40, isVeg: true },
      { name: "Namkeen Lassi", price: 50, isVeg: true },
      { name: "Soups (Seasonal)", price: 40, isVeg: true },
    ],
  },
  {
    category: "Burger",
    sortOrder: 5,
    items: [
      { name: "Aloo Tikki Burger", price: 40, isVeg: true },
      { name: "Noodle Tikki Burger", price: 50, isVeg: true },
      { name: "Veg Cheese Burger", price: 60, isVeg: true },
    ],
  },
  {
    category: "Fries",
    sortOrder: 6,
    items: [
      { name: "French Fries (Small)", price: 50, isVeg: true },
      { name: "French Fries (Large)", price: 80, isVeg: true },
      { name: "Peri Peri Fries", price: 80, isVeg: true },
    ],
  },
  {
    category: "Sandwich",
    sortOrder: 7,
    items: [
      { name: "Veg Sandwich", price: 40, isVeg: true },
      { name: "Grilled Sandwich", price: 50, isVeg: true },
    ],
  },
  {
    category: "Maggi",
    sortOrder: 8,
    items: [
      { name: "Masala Maggi", price: 40, isVeg: true },
      { name: "Veg Maggi", price: 50, isVeg: true },
      { name: "Egg Maggi", price: 60, isVeg: false },
    ],
  },
  {
    category: "Appetizers",
    sortOrder: 9,
    items: [
      { name: "Samosa", price: 15, isVeg: true },
      { name: "Samosa Chana (Half)", price: 20, isVeg: true },
      { name: "Samosa Chana (Full)", price: 30, isVeg: true },
      { name: "Spl Matthi Cholle", price: 50, isVeg: true },
      { name: "Bread Pakora", price: 30, isVeg: true },
      { name: "Spring Roll", price: 15, isVeg: true },
      { name: "Kulcha", price: 20, isVeg: true },
      { name: "Kulcha Chana", price: 15, isVeg: true },
      { name: "Tikki Plate (Half)", price: 30, isVeg: true },
      { name: "Tikki Plate (Full)", price: 50, isVeg: true },
      { name: "Aloo Patty", price: 20, isVeg: true },
      { name: "Mix Pakora (250g)", price: 70, isVeg: true },
      { name: "Mix Pakora (500g)", price: 140, isVeg: true },
      { name: "Chana Plate (Half)", price: 20, isVeg: true },
      { name: "Chana Plate (Full)", price: 40, isVeg: true },
      { name: "Noodle Plate (Half)", price: 40, isVeg: true },
      { name: "Noodle Plate (Full)", price: 60, isVeg: true },
      { name: "Curd (Dahi)", price: 20, isVeg: true },
      { name: "Pasta", price: 60, isVeg: true },
    ],
  },
  {
    category: "Dessert",
    sortOrder: 10,
    items: [
      { name: "Gulab Jamun", price: 12, isVeg: true },
      { name: "Pastry", price: 30, isVeg: true },
      { name: "Jam Roll", price: 15, isVeg: true },
      { name: "Cream Roll", price: 20, isVeg: true },
    ],
  },
  {
    category: "Meals",
    sortOrder: 11,
    items: [
      { name: "Veg Burger Meal", price: 55, isVeg: true, description: "1 Aloo Tikki Burger + 1 Soft Drink" },
      { name: "Cha Samosa Meal - 1", price: 40, isVeg: true, description: "2 Pc Samosa + 1 Tea" },
      { name: "Cha Samosa Meal - 2", price: 70, isVeg: true, description: "4 Pc Samosa + 2 Tea" },
      { name: "Cha Pakora Meal", price: 90, isVeg: true, description: "250g Mix Pakora + 2 Tea" },
      { name: "Bread Pakora Meal", price: 50, isVeg: true, description: "2 Bread Pakora + 2 Tea" },
      { name: "Veg Sandwich Meal", price: 80, isVeg: true, description: "1 Veg Sandwich + 1 Soft Drink" },
      { name: "Grilled Sandwich Meal", price: 55, isVeg: true, description: "1 Grilled Sandwich + 1 Soft Drink" },
      { name: "Spl Spring Roll Meal - 1", price: 120, isVeg: true, description: "2 Spring Roll + 1 Soft Drink" },
      { name: "Spl Spring Roll Meal - 2", price: 15, isVeg: true, description: "5 Spring Roll + 2 Soft Drink" },
    ],
  },
  {
    category: "Non-Veg",
    sortOrder: 12,
    items: [
      { name: "Boiled Egg", price: 15, isVeg: false },
      { name: "Boiled Egg with Pudina Chutney", price: 20, isVeg: false },
      { name: "Omelette (2 Eggs)", price: 20, isVeg: false },
      { name: "Bread Omelette (3 Eggs)", price: 40, isVeg: false },
      { name: "Egg Bhurji (4 Eggs)", price: 50, isVeg: false },
    ],
  },
  {
    category: "Breakfast",
    sortOrder: 13,
    items: [
      { name: "Chapati", price: 10, isVeg: true },
      { name: "Plain Parantha", price: 20, isVeg: true },
      { name: "Aloo Parantha with Curd", price: 40, isVeg: true },
      { name: "Onion Parantha with Curd", price: 40, isVeg: true },
      { name: "Paneer Parantha with Curd", price: 50, isVeg: true },
      { name: "Gobhi Parantha with Curd", price: 40, isVeg: true },
      { name: "Mix Parantha with Curd", price: 40, isVeg: true },
      { name: "Dal Fry (Half)", price: 50, isVeg: true },
      { name: "Dal Fry (Full)", price: 80, isVeg: true },
    ],
  },
]

async function main() {
  const owner = await prisma.owner.findUnique({ where: { email: OWNER_EMAIL } })
  if (!owner) throw new Error("Owner not found")

  const canteen = await prisma.canteen.findFirst({ where: { ownerId: owner.id } })
  if (!canteen) throw new Error("Canteen not found")

  console.log(`Updating menu for canteen: ${canteen.name} (${canteen.id})`)

  console.log("Deleting existing menu items and categories...")

  const existingItems = await prisma.menuItem.findMany({
    where: { category: { canteenId: canteen.id } },
    select: { id: true },
  })
  const itemIds = existingItems.map((i) => i.id)

  if (itemIds.length > 0) {
    await prisma.orderItem.deleteMany({ where: { menuItemId: { in: itemIds } } })
  }

  await prisma.customizationOption.deleteMany({
    where: { customization: { menuItem: { category: { canteenId: canteen.id } } } },
  })
  await prisma.customization.deleteMany({
    where: { menuItem: { category: { canteenId: canteen.id } } },
  })
  await prisma.menuItem.deleteMany({
    where: { category: { canteenId: canteen.id } },
  })
  await prisma.category.deleteMany({
    where: { canteenId: canteen.id },
  })
  console.log("Existing menu cleared.")

  for (const cat of menu) {
    console.log(`Creating category: ${cat.category}`)
    const category = await prisma.category.create({
      data: {
        canteenId: canteen.id,
        name: cat.category,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    })

    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i]
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          description: (item as any).description || null,
          price: item.price,
          isVeg: item.isVeg,
          isAvailable: true,
          sortOrder: i + 1,
          tags: [],
        },
      })
      console.log(`  + ${item.name} - ₹${item.price}`)
    }
  }

  const totalItems = menu.reduce((sum, c) => sum + c.items.length, 0)
  console.log(`\nDone! Created ${menu.length} categories with ${totalItems} items.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
