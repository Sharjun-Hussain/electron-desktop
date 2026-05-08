import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-pos.inzeedo.lk',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  webpack: (config) => {
    config.resolve.alias['next-auth/react'] = path.resolve(__dirname, 'src/components/auth/DesktopAuthProvider.jsx');
    config.resolve.alias['next-auth'] = path.resolve(__dirname, 'src/components/auth/DesktopAuthProvider.jsx');
    return config;
  },
};

export default nextConfig;