/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel uses its own output system; standalone is for Docker self-hosting
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
};

export default nextConfig;
