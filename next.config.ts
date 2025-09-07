import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost",
          port: "8000",
          pathname: "/storage/addresses/**",
        },
        {
          protocol: "https",
          hostname: "adrify.odclaravel.tech",
          pathname: "/storage/addresses/**",
          port: "443",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
      ],
    },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://adrify.odclaravel.tech/api/:path*',
      },
      
    ];
  },
};

export default nextConfig;
