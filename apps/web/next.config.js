/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@orderkaro/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
}

module.exports = nextConfig
