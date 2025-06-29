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
  output: 'standalone', 
  async redirects() {
    return [
      {
        source: '/', // The incoming request path
        destination: '/login', // The path to redirect to
        permanent: true, // true for 308 (permanent), false for 307 (temporary)
      },
    ];
  },
};

module.exports = nextConfig;
