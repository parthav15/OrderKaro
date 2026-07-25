/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@orderkaro/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: "/api/v1/canteens/:path*", destination: "/api/v1/restaurants/:path*" },
      { source: "/api/v1/public/canteen/:path*", destination: "/api/v1/public/restaurant/:path*" },
    ]
  },
}

module.exports = nextConfig
