/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.spackle.so/:path*',
        permanent: true,
      },
      {
        source: '/docs/:path*',
        destination: 'https://docs.spackle.so/:path*',
        permanent: true,
      }
    ]
  }
}

module.exports = nextConfig
