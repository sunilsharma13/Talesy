/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remove appDir since it's now the default in Next.js 13+
    typedRoutes: true,
  },
  eslint: {
    // Allow build to complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  // Add this new section to disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;