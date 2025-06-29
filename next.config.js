/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  // NEW: Yeh line Next.js app ko standalone serverless function ke roop mein deploy karegi.
  // Isse useSearchParams() jaise dynamic features wale pages build time par error nahi denge.
  output: 'standalone', 
};

export default nextConfig;