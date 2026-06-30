import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Security headers plugin — injected on every dev-server response
    // and baked into the build via vercel.json / _headers for production
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Content-Security-Policy: tight, allows Supabase APIs + CDN fonts
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",   // Vite HMR needs inline
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join('; ')
          )
          res.setHeader('X-Frame-Options',        'DENY')
          res.setHeader('X-Content-Type-Options',  'nosniff')
          res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin')
          res.setHeader('Permissions-Policy',      'camera=(), microphone=(), geolocation=()')
          res.setHeader('X-XSS-Protection',        '1; mode=block')
          next()
        })
      },
    },
  ],
})
