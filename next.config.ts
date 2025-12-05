import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Previne clickjacking - bloqueia iframe embedding
          { key: 'X-Frame-Options', value: 'DENY' },
          
          // Previne MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // XSS Protection (legado, mas ainda útil para browsers antigos)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          
          // Controla informações enviadas no Referer header
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // Desabilita APIs sensíveis não utilizadas
          { 
            key: 'Permissions-Policy', 
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' 
          },
          
          // HSTS - força HTTPS por 1 ano
          { 
            key: 'Strict-Transport-Security', 
            value: 'max-age=31536000; includeSubDomains; preload' 
          },
          
          // Content Security Policy - controla origens de recursos
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
