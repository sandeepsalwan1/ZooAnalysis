/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ['*'] }
  },
  output: 'standalone'
}

module.exports = nextConfig

