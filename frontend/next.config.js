const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  webpack: (config) => {
    if (process.env.E2E_COVERAGE === '1') {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        include: path.resolve(__dirname, 'src'),
        enforce: 'post',
        use: path.resolve(__dirname, 'scripts/istanbul-loader.cjs')
      });
    }

    return config;
  },
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {}
};

module.exports = nextConfig;
