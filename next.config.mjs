import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "firebase/app": path.resolve(__dirname, "node_modules/firebase/app/dist/esm/index.esm.js"),
      "firebase/auth": path.resolve(__dirname, "node_modules/firebase/auth/dist/esm/index.esm.js"),
      "firebase/firestore": path.resolve(__dirname, "node_modules/firebase/firestore/dist/esm/index.esm.js"),
      "firebase/storage": path.resolve(__dirname, "node_modules/firebase/storage/dist/esm/index.esm.js"),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
