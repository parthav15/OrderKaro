import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

const PEXELS_KEY = "K8NAaKAdDIuwoXKKHcX4ybbnb7s9g4fa6zNymE87Rz7Z1ofZACfLeB5g"
const CLOUD_NAME = "dpjw3fe8d"
const CLOUD_KEY = "228696467959957"
const CLOUD_SECRET = "A_SYQeudeFbe5ZpRWcMCCcolrsk"
const OWNER_EMAIL = "sachidanandsabrwal@gmail.com"

const searchQueries: Record<string, string> = {
  "Black Tea": "black tea cup",
  "Milk Tea": "indian chai tea",
  "Elaichi Tea": "cardamom tea",
  "Ginger Tea": "ginger tea",
  "Masala Tea": "masala chai",
  "Lemon Tea": "lemon tea",
  "Green Tea": "green tea cup",
  "Black Coffee": "black coffee cup",
  "Milk Coffee": "latte coffee milk",
  "Cold Coffee": "iced coffee glass",
  "Banana Shake": "banana milkshake",
  "Chocolate Shake": "chocolate milkshake",
  "Flavoured Shakes": "fruit milkshake",
  "Soft Drink": "cola glass ice",
  "Water Bottle": "water bottle",
  "Soya Milk": "soy milk",
  "Sweet Lassi": "lassi indian drink",
  "Namkeen Lassi": "buttermilk glass",
  "Soups (Seasonal)": "tomato soup bowl",
  "Aloo Tikki Burger": "veggie burger",
  "Noodle Tikki Burger": "vegetable burger",
  "Veg Cheese Burger": "cheese burger",
  "French Fries (Small)": "french fries",
  "French Fries (Large)": "french fries plate",
  "Peri Peri Fries": "spicy fries",
  "Veg Sandwich": "vegetable sandwich",
  "Grilled Sandwich": "grilled sandwich",
  "Masala Maggi": "instant noodles",
  "Veg Maggi": "noodles vegetables",
  "Egg Maggi": "egg noodles",
  "Samosa": "samosa indian",
  "Samosa Chana (Half)": "samosa chaat",
  "Samosa Chana (Full)": "samosa chickpea",
  "Spl Matthi Cholle": "chole indian food",
  "Bread Pakora": "bread pakora fried",
  "Spring Roll": "spring roll fried",
  "Kulcha": "indian bread naan",
  "Kulcha Chana": "chole kulcha",
  "Tikki Plate (Half)": "aloo tikki",
  "Tikki Plate (Full)": "potato tikki chutney",
  "Aloo Patty": "potato patty",
  "Mix Pakora (250g)": "pakora indian fritter",
  "Mix Pakora (500g)": "vegetable pakora plate",
  "Chana Plate (Half)": "chickpea curry",
  "Chana Plate (Full)": "chole indian curry",
  "Noodle Plate (Half)": "chow mein noodles",
  "Noodle Plate (Full)": "noodles plate",
  "Curd (Dahi)": "yogurt bowl",
  "Pasta": "pasta plate",
  "Gulab Jamun": "gulab jamun dessert",
  "Pastry": "pastry slice",
  "Jam Roll": "jam roll cake",
  "Cream Roll": "cream roll pastry",
  "Veg Burger Meal": "burger fries combo",
  "Cha Samosa Meal - 1": "samosa tea",
  "Cha Samosa Meal - 2": "samosa plate",
  "Cha Pakora Meal": "pakora tea",
  "Bread Pakora Meal": "bread pakora tea",
  "Veg Sandwich Meal": "sandwich drink combo",
  "Grilled Sandwich Meal": "grilled sandwich drink",
  "Spl Spring Roll Meal - 1": "spring roll plate",
  "Spl Spring Roll Meal - 2": "spring rolls snack",
  "Boiled Egg": "boiled egg",
  "Boiled Egg with Pudina Chutney": "boiled egg chutney",
  "Omelette (2 Eggs)": "omelette plate",
  "Bread Omelette (3 Eggs)": "bread omelette",
  "Egg Bhurji (4 Eggs)": "scrambled eggs indian",
  "Chapati": "chapati roti",
  "Plain Parantha": "paratha indian bread",
  "Aloo Parantha with Curd": "aloo paratha",
  "Onion Parantha with Curd": "stuffed paratha",
  "Paneer Parantha with Curd": "paneer paratha",
  "Gobhi Parantha with Curd": "paratha indian",
  "Mix Parantha with Curd": "stuffed paratha butter",
  "Dal Fry (Half)": "dal lentil bowl",
  "Dal Fry (Full)": "dal tadka indian",
}

async function searchPexels(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      { headers: { Authorization: PEXELS_KEY } }
    )
    const data = await res.json()
    return data.photos?.[0]?.src?.medium || null
  } catch {
    return null
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadToCloudinary(imageBuffer: Buffer, publicId: string): Promise<string | null> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const folder = "orderkaro/menu-items"
  const overwrite = "true"
  const paramsToSign = `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}${CLOUD_SECRET}`
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex")

  const formData = new FormData()
  formData.append("file", new Blob([imageBuffer], { type: "image/jpeg" }), `${publicId}.jpg`)
  formData.append("api_key", CLOUD_KEY)
  formData.append("timestamp", timestamp)
  formData.append("signature", signature)
  formData.append("folder", folder)
  formData.append("public_id", publicId)
  formData.append("overwrite", overwrite)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData })
    const data = await res.json()
    return data.secure_url || null
  } catch {
    return null
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

async function main() {
  const owner = await prisma.owner.findUnique({ where: { email: OWNER_EMAIL } })
  if (!owner) throw new Error("Owner not found")
  const canteen = await prisma.canteen.findFirst({ where: { ownerId: owner.id } })
  if (!canteen) throw new Error("Canteen not found")

  const items = await prisma.menuItem.findMany({
    where: { category: { canteenId: canteen.id } },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  })

  console.log(`Fetching Pexels images for ${items.length} items\n`)
  let success = 0, failed = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const query = searchQueries[item.name] || `${item.name} food`
    console.log(`[${i + 1}/${items.length}] ${item.name} → "${query}"`)

    const photoUrl = await searchPexels(query)
    if (!photoUrl) {
      console.error(`  ✗ No photo found`)
      failed++
      continue
    }

    const buf = await downloadImage(photoUrl)
    if (!buf) {
      console.error(`  ✗ Download failed`)
      failed++
      continue
    }
    console.log(`  ✓ Downloaded (${(buf.length / 1024).toFixed(0)}KB)`)

    const publicId = "pexels-" + slugify(item.name)
    const cloudUrl = await uploadToCloudinary(buf, publicId)
    if (!cloudUrl) {
      console.error(`  ✗ Upload failed`)
      failed++
      continue
    }

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl: cloudUrl },
    })
    console.log(`  ✓ Done\n`)
    success++

    await new Promise((r) => setTimeout(r, 250))
  }

  console.log(`\nFinished! ${success} succeeded, ${failed} failed out of ${items.length}.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
