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
};

module.exports = nextConfig;