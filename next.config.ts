import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.leadmappro.com.br',
      },
    ],
  },
}

export default nextConfig
