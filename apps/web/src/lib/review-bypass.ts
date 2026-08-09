export function isReviewOtpBypass(phone: string, code?: string): boolean {
  const testPhone = process.env.REVIEW_TEST_PHONE
  const testCode = process.env.REVIEW_TEST_CODE
  if (!testPhone || !testCode) return false
  if (phone !== testPhone) return false
  if (code === undefined) return true
  return code === testCode
}
