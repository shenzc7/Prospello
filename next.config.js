/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  // Skip type checking during dev for speed
  experimental: {
    // Faster page loading
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
}

module.exports = nextConfig
