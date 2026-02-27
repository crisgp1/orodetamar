import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's6pohubmjm0vyowd.public.blob.vercel-storage.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/catalogo',
        destination: '/',
        permanent: true,
      },
      {
        source: '/catalogo/:path*',
        destination: '/',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
