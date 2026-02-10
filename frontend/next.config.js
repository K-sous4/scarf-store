/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled temporarily to debug session issues
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
