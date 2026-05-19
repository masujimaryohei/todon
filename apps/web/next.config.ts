import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@todon/shared'],
  turbopack: {
    root: '../..',
  },
};

export default nextConfig;
