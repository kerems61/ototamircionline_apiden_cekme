import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GOOGLE_PLACES_API_KEY

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/places': {
          target: 'https://places.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/places/, '/v1/places'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-Goog-Api-Key', apiKey)
              proxyReq.setHeader(
                'X-Goog-FieldMask',
                'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.currentOpeningHours.openNow,places.nationalPhoneNumber,places.location'
              )
            })
          },
        },
      },
    },
  }
})
