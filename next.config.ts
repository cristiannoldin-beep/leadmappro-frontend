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
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@swc/core-linux-x64-gnu/**',
      './node_modules/@swc/core-linux-x64-musl/**',
      './node_modules/@esbuild/**',
      './node_modules/sharp/**',
      './node_modules/**/*.map',
    ],
  },
}

export default nextConfig
