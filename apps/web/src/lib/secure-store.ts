import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function encryptionKey(): Buffer {
  const configured = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!configured) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is not configured")
  }
  const raw = Buffer.from(configured, "base64")
  if (raw.length === 32) return raw
  return createHash("sha256").update(configured).digest()
}

export function isCredentialStoreConfigured(): boolean {
  return Boolean(process.env.CREDENTIAL_ENCRYPTION_KEY)
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
    "."
  )
}

export function decryptSecret(cipherText: string): string {
  const [ivPart, tagPart, dataPart] = cipherText.split(".")
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Stored credential is malformed")
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivPart, "base64")
  )
  decipher.setAuthTag(Buffer.from(tagPart, "base64"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return "••••"
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}
