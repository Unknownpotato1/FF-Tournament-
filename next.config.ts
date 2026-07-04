import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // firebase-admin (and its deps jwks-rsa, jose) ship ESM-only code
  // that breaks when bundled by Turbopack. Marking as external makes
  // Next.js load them as native Node modules at runtime instead.
  serverExternalPackages: [
    "firebase-admin",
    "@firebase/database",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "jwks-rsa",
    "jose",
    "google-auth-library",
    "googleapis",
    "dicer",
    "ws",
  ],
};

export default nextConfig;
