const isStrictBuild = process.env.CI === 'true' || process.env.VERCEL === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Make Vercel/CI builds fail fast, keep dev flexible
    ignoreBuildErrors: !isStrictBuild,
  },
  eslint: {
    ignoreDuringBuilds: !isStrictBuild,
  },
  // Turbopack configuration (used when running with --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Optimize for faster dev
  reactStrictMode: false,
  // Skip certain optimizations in dev for speed
  experimental: {
    // Faster page loading
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
  // Ensure CJS-only packages are externalized for RSC/Turbopack
  serverExternalPackages: ['nodemailer'],
}

module.exports = nextConfig
