/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This project is a prototype; some deps ship TS sources that fail typecheck on Vercel.
    // Keep builds unblocked.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
