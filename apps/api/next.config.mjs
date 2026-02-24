/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@daily-news/core", "@daily-news/db"]
};

export default nextConfig;
