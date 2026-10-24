import type { NextConfig } from 'next';

const config: NextConfig = {
  // Contract tests build into a fixed separate directory; the normal preview stays untouched.
  distDir: process.env.CUTPLAN_CONTRACT_BUILD === 'true' ? '.next-auth-contract' : '.next',
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  }
};

export default config;
