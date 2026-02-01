import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] || "gym-app";
console.log(`Next.js config: isProd=${isProd}, repo=${repo}`);

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",                 // makes `next build` output /out  [oai_citation:1‡nextjs.org](https://nextjs.org/docs/pages/guides/static-exports?utm_source=chatgpt.com)
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: { unoptimized: true },    // required for static export if you use next/image  [oai_citation:2‡nextjs.org](https://nextjs.org/docs/messages/export-image-api?utm_source=chatgpt.com)
  trailingSlash: true,
};

export default nextConfig;
