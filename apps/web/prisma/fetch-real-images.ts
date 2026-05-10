import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

const CLOUD_NAME = "dpjw3fe8d"
const CLOUD_KEY = "228696467959957"
const CLOUD_SECRET = "A_SYQeudeFbe5ZpRWcMCCcolrsk"
const OWNER_EMAIL = "sachidanandsabrwal@gmail.com"
const GEMINI_KEY = "AIzaSyAQ2DutedvotzYQdc6rz8A61MMZDvbmOVg"

async function searchImageUrl(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Find me a real photograph URL of Indian street food item "${query}". I need a direct image URL (ending in .jpg, .png, or .webp) from a public source like Wikimedia Commons, Unsplash, or Pexels. The image should show the real desi version of this food — as served at Indian roadside stalls, dhabas, or college canteens. NOT fancy restaurant style. Return ONLY the direct image URL, nothing else. No explanation, no markdown, just the URL.`,
                },
              ],
            },
          ],
        }),
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (text && text.startsWith("http")) {
      return text.split("\n")[0].trim()
    }
    return null
  } catch {
    return null
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("image")) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
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
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    )
    const data = await res.json()
    if (data.error) {
      console.error(`  ✗ Cloudinary:`, data.error.message)
      return null
    }
    return data.secure_url
  } catch (err: any) {
    console.error(`  ✗ Upload:`, err.message)
    return null
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

const manualMap: Record<string, string> = {
  "Black Tea": "indian black tea chai glass",
  "Milk Tea": "indian chai cutting glass tapri",
  "Elaichi Tea": "elaichi chai indian street",
  "Ginger Tea": "adrak chai indian glass",
  "Masala Tea": "masala chai indian kulhad street",
  "Lemon Tea": "lemon tea indian glass nimbu",
  "Green Tea": "green tea cup indian",
  "Black Coffee": "black coffee indian cup",
  "Milk Coffee": "indian filter coffee tumbler",
  "Cold Coffee": "cold coffee glass indian street",
  "Banana Shake": "banana milkshake glass indian",
  "Chocolate Shake": "chocolate shake glass indian",
  "Flavoured Shakes": "strawberry milkshake glass indian",
  "Soft Drink": "thums up bottle indian shop",
  "Water Bottle": "bisleri water bottle indian",
  "Soya Milk": "soya milk glass indian",
  "Sweet Lassi": "sweet lassi punjabi glass",
  "Namkeen Lassi": "salted lassi chaas glass indian",
  "Soups (Seasonal)": "tomato soup indian street stall",
  "Aloo Tikki Burger": "aloo tikki burger indian street food",
  "Noodle Tikki Burger": "noodle burger indian street food",
  "Veg Cheese Burger": "veg cheese burger indian",
  "French Fries (Small)": "french fries small plate indian",
  "French Fries (Large)": "french fries large plate indian",
  "Peri Peri Fries": "peri peri fries indian street",
  "Veg Sandwich": "veg sandwich indian street food",
  "Grilled Sandwich": "grilled sandwich indian street food",
  "Masala Maggi": "masala maggi indian street food plate",
  "Veg Maggi": "veg maggi noodles plate indian",
  "Egg Maggi": "egg maggi noodles indian street",
  "Samosa": "samosa indian street food plate",
  "Samosa Chana (Half)": "samosa chaat plate indian",
  "Samosa Chana (Full)": "samosa chole plate indian street",
  "Spl Matthi Cholle": "matthi chole indian street food",
  "Bread Pakora": "bread pakora indian street food plate",
  "Spring Roll": "veg spring roll indian",
  "Kulcha": "kulcha bread indian dhaba",
  "Kulcha Chana": "chole kulcha indian street food",
  "Tikki Plate (Half)": "aloo tikki chaat plate indian",
  "Tikki Plate (Full)": "aloo tikki plate chutney indian",
  "Aloo Patty": "aloo patty indian bakery",
  "Mix Pakora (250g)": "mix pakora plate indian street food",
  "Mix Pakora (500g)": "pakora plate onion indian",
  "Chana Plate (Half)": "chana masala plate indian dhaba",
  "Chana Plate (Full)": "chole plate indian street food",
  "Noodle Plate (Half)": "chow mein noodles plate indian street",
  "Noodle Plate (Full)": "hakka noodles plate indian",
  "Curd (Dahi)": "dahi curd bowl indian",
  "Pasta": "masala pasta indian street style",
  "Gulab Jamun": "gulab jamun plate indian sweet",
  "Pastry": "pastry indian bakery",
  "Jam Roll": "jam roll indian bakery",
  "Cream Roll": "cream roll indian bakery",
  "Veg Burger Meal": "burger meal combo indian",
  "Cha Samosa Meal - 1": "samosa chai combo indian",
  "Cha Samosa Meal - 2": "samosa chai plate indian street",
  "Cha Pakora Meal": "pakora chai combo indian",
  "Bread Pakora Meal": "bread pakora chai indian",
  "Veg Sandwich Meal": "sandwich cold drink combo indian",
  "Grilled Sandwich Meal": "grilled sandwich combo indian",
  "Spl Spring Roll Meal - 1": "spring roll plate indian",
  "Spl Spring Roll Meal - 2": "spring roll combo plate indian",
  "Boiled Egg": "boiled egg plate indian",
  "Boiled Egg with Pudina Chutney": "boiled egg chutney indian street",
  "Omelette (2 Eggs)": "egg omelette indian dhaba",
  "Bread Omelette (3 Eggs)": "bread omelette indian street food",
  "Egg Bhurji (4 Eggs)": "egg bhurji indian dhaba plate",
  "Chapati": "chapati roti indian plate",
  "Plain Parantha": "plain parantha indian dhaba",
  "Aloo Parantha with Curd": "aloo paratha curd butter indian",
  "Onion Parantha with Curd": "onion paratha curd indian dhaba",
  "Paneer Parantha with Curd": "paneer paratha butter curd indian",
  "Gobhi Parantha with Curd": "gobi paratha curd indian",
  "Mix Parantha with Curd": "mix paratha curd butter indian dhaba",
  "Dal Fry (Half)": "dal fry bowl indian dhaba",
  "Dal Fry (Full)": "dal tadka plate indian dhaba",
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

  console.log(`Fetching real images for ${items.length} items\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const searchQuery = manualMap[item.name] || `${item.name} indian street food`
    console.log(`[${i + 1}/${items.length}] ${item.name}`)
    console.log(`  Searching: "${searchQuery}"`)

    const imageUrl = await searchImageUrl(searchQuery)
    if (!imageUrl) {
      console.error(`  ✗ No URL found`)
      failed++
      continue
    }
    console.log(`  Found: ${imageUrl.substring(0, 80)}...`)

    const imageBuffer = await downloadImage(imageUrl)
    if (!imageBuffer) {
      console.error(`  ✗ Download failed`)
      failed++
      continue
    }
    console.log(`  ✓ Downloaded (${(imageBuffer.length / 1024).toFixed(0)}KB)`)

    const publicId = "real-" + slugify(item.name)
    const cloudUrl = await uploadToCloudinary(imageBuffer, publicId)
    if (!cloudUrl) {
      failed++
      continue
    }

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl: cloudUrl },
    })
    console.log(`  ✓ Done\n`)
    success++

    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\nFinished! ${success} succeeded, ${failed} failed out of ${items.length}.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
