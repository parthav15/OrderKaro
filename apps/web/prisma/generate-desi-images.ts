import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

const GEMINI_KEY = "AIzaSyAQ2DutedvotzYQdc6rz8A61MMZDvbmOVg"
const CLOUD_NAME = "dpjw3fe8d"
const CLOUD_KEY = "228696467959957"
const CLOUD_SECRET = "A_SYQeudeFbe5ZpRWcMCCcolrsk"
const OWNER_EMAIL = "sachidanandsabrwal@gmail.com"

async function generateImage(itemName: string, isVeg: boolean): Promise<Buffer | null> {
  const vegLabel = isVeg ? "vegetarian" : "non-vegetarian"
  const prompt = `Realistic photograph of Indian street food "${itemName}" (${vegLabel}) served at a small Indian roadside rehri or thela (street food cart). The food is served on a simple steel plate or paper plate or newspaper or small disposable plate. The setting is a typical Indian street food stall — you can see the steel counter, a gas stove in background, simple plastic chairs, maybe some chutney bowls on the side. The food looks authentic, homemade, slightly messy, real — NOT fancy restaurant plating. Think Punjab/North India roadside dhaba or college canteen style. Natural daylight, slightly warm tones, shot on a phone camera style — casual, real, not professional studio lighting. No text, no watermarks.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    )

    const data = await res.json()

    if (data.error) {
      console.error(`  ✗ Error for "${itemName}":`, data.error.message)
      return null
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"))

    if (!imagePart) {
      console.error(`  ✗ No image for "${itemName}"`)
      return null
    }

    return Buffer.from(imagePart.inlineData.data, "base64")
  } catch (err: any) {
    console.error(`  ✗ Fetch error for "${itemName}":`, err.message)
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
  formData.append("file", new Blob([imageBuffer], { type: "image/png" }), `${publicId}.png`)
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
      console.error(`  ✗ Cloudinary error:`, data.error.message)
      return null
    }
    return data.secure_url
  } catch (err: any) {
    console.error(`  ✗ Upload error:`, err.message)
    return null
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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

  console.log(`Regenerating all ${items.length} images in desi street food style\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    console.log(`[${i + 1}/${items.length}] ${item.category.name} > ${item.name}`)

    const imageBuffer = await generateImage(item.name, item.isVeg)
    if (!imageBuffer) {
      failed++
      continue
    }
    console.log(`  ✓ Generated (${(imageBuffer.length / 1024).toFixed(0)}KB)`)

    const publicId = "desi-" + slugify(item.name)
    const cloudUrl = await uploadToCloudinary(imageBuffer, publicId)
    if (!cloudUrl) {
      failed++
      continue
    }
    console.log(`  ✓ Uploaded`)

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl: cloudUrl },
    })
    console.log(`  ✓ Done\n`)
    success++

    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\nFinished! ${success} succeeded, ${failed} failed out of ${items.length}.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
