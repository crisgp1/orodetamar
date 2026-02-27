import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
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
