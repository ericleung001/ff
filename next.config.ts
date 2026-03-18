import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 輸出對 Vercel 不需要，但對其他部署有用
  // output: "standalone", // Vercel 會自動處理
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
