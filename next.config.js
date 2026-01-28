/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // 👈 objeto vacío (OBLIGATORIO si existe)
};

module.exports = withPWA(nextConfig);
