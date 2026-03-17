import { NextRequest } from "next/server"
import crypto from "crypto"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!
const UPLOAD_FOLDER = "orderkaro/menu-items"
const EAGER_TRANSFORMATION = "f_auto,q_auto"

function buildSignature(params: Record<string, string>): string {
  const sortedParamString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")
  return crypto
    .createHash("sha1")
    .update(sortedParamString + CLOUDINARY_API_SECRET)
    .digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    requireRole(request, "OWNER", "MANAGER")

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof Blob)) {
      throw new AuthError("No file provided", 400)
    }

    const timestamp = String(Math.floor(Date.now() / 1000))

    const signatureParams: Record<string, string> = {
      eager: EAGER_TRANSFORMATION,
      folder: UPLOAD_FOLDER,
      timestamp,
    }

    const signature = buildSignature(signatureParams)

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("api_key", CLOUDINARY_API_KEY)
    uploadFormData.append("timestamp", timestamp)
    uploadFormData.append("folder", UPLOAD_FOLDER)
    uploadFormData.append("eager", EAGER_TRANSFORMATION)
    uploadFormData.append("signature", signature)

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: uploadFormData }
    )

    const cloudinaryData = await cloudinaryResponse.json()

    if (!cloudinaryResponse.ok) {
      throw new AuthError(
        cloudinaryData?.error?.message ?? "Cloudinary upload failed",
        502
      )
    }

    return success({ url: cloudinaryData.secure_url, publicId: cloudinaryData.public_id })
  } catch (err) {
    return handleError(err)
  }
}
