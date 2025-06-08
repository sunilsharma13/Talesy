/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {    
    appDir: true,
    typedRoutes: true, // optional, agar tu typedRoutes use kar raha hai toh
  },
};

module.exports = nextConfig;
