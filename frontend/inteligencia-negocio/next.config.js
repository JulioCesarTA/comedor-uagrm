/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://44.252.104.3:8080',
    KEYCLOAK_URL: process.env.KEYCLOAK_URL || 'http://44.252.104.3:8085',
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'comedor-uagrm',
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'http', hostname: '**' }, { protocol: 'https', hostname: '**' }],
  },
};
