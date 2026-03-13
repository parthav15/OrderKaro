import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12)
  const kitchenHash = await bcrypt.hash("kitchen123", 12)
  const consumerPin = await bcrypt.hash("1234", 12)

  const owner = await prisma.owner.upsert({
    where: { email: "admin@orderkaro.com" },
    update: {},
    create: {
      email: "admin@orderkaro.com",
      passwordHash,
      name: "Admin Owner",
      phone: "9876543210",
      isVerified: true,
    },
  })

  const canteen = await prisma.canteen.upsert({
    where: { slug: "campus-cafe" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Campus Cafe",
      slug: "campus-cafe",
      description: "The best food on campus",
      address: "Main Building, Ground Floor",
      phone: "9876543211",
      openingTime: "08:00",
      closingTime: "22:00",
      avgPrepTime: 15,
    },
  })

  const existingStaff = await prisma.staff.findUnique({
    where: { canteenId_email: { canteenId: canteen.id, email: "kitchen@orderkaro.com" } },
  })
  if (!existingStaff) {
    await prisma.staff.create({
      data: {
        canteenId: canteen.id,
        email: "kitchen@orderkaro.com",
        passwordHash: kitchenHash,
        pin: "5678",
        name: "Kitchen Staff",
        role: "KITCHEN",
      },
    })
  }

  const existingBeverages = await prisma.category.findFirst({
    where: { canteenId: canteen.id, name: "Beverages" },
  })
  const beverages = existingBeverages || await prisma.category.create({
    data: { canteenId: canteen.id, name: "Beverages", sortOrder: 0 },
  })

  const existingSnacks = await prisma.category.findFirst({
    where: { canteenId: canteen.id, name: "Snacks" },
  })
  const snacks = existingSnacks || await prisma.category.create({
    data: { canteenId: canteen.id, name: "Snacks", sortOrder: 1 },
  })

  const existingMeals = await prisma.category.findFirst({
    where: { canteenId: canteen.id, name: "Meals" },
  })
  const meals = existingMeals || await prisma.category.create({
    data: { canteenId: canteen.id, name: "Meals", sortOrder: 2 },
  })

  const menuItemDefs = [
    { categoryId: beverages.id, name: "Masala Chai", price: 20, isVeg: true, sortOrder: 0, tags: ["bestseller"] },
    { categoryId: beverages.id, name: "Cold Coffee", price: 50, isVeg: true, sortOrder: 1, tags: ["popular"] },
    { categoryId: snacks.id, name: "Samosa", price: 15, isVeg: true, sortOrder: 0, tags: ["bestseller"] },
    { categoryId: snacks.id, name: "Grilled Sandwich", price: 60, isVeg: true, sortOrder: 1, tags: [] },
    { categoryId: meals.id, name: "Veg Thali", price: 120, isVeg: true, sortOrder: 0, tags: ["popular"] },
    { categoryId: meals.id, name: "Chicken Biryani", price: 150, isVeg: false, sortOrder: 1, tags: ["bestseller", "spicy"] },
  ]

  for (const item of menuItemDefs) {
    const existing = await prisma.menuItem.findFirst({
      where: { categoryId: item.categoryId, name: item.name },
    })
    if (!existing) {
      await prisma.menuItem.create({ data: item })
    }
  }

  for (let i = 1; i <= 3; i++) {
    const label = `Table ${i}`
    const existing = await prisma.table.findUnique({
      where: { canteenId_label: { canteenId: canteen.id, label } },
    })
    if (!existing) {
      await prisma.table.create({
        data: {
          canteenId: canteen.id,
          label,
          section: "Ground Floor",
        },
      })
    }
  }

  const consumer = await prisma.consumer.upsert({
    where: { phone: "9999999999" },
    update: {},
    create: {
      name: "Test Student",
      phone: "9999999999",
      passwordHash: consumerPin,
      wallet: { create: { balance: 500 } },
    },
  })

  console.log("Seed completed successfully")
  console.log(`Owner: admin@orderkaro.com / password123`)
  console.log(`Kitchen: kitchen@orderkaro.com / kitchen123`)
  console.log(`Consumer: 9999999999 / PIN: 1234 (Wallet: ₹500)`)
  console.log(`Canteen: ${canteen.name} (${canteen.slug})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
