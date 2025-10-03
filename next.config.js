/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental features that might cause webpack issues
  experimental: {
    // Disable appDir since it's stable in Next.js 15 and might be causing confusion
    // appDir: true,
  },
  // Dev indicators configuration (keeping minimal)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add webpack configuration to fix chunk resolution
  webpack: (config, { dev }) => {
    if (dev) {
      // Ensure proper chunk naming in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
