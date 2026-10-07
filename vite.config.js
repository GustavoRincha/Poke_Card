import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'PokeCard Coleção TCG',
        short_name: 'PokeCard',
        description: 'Gerencie sua coleção de cartas Pokémon TCG em tempo real na nuvem.',
        theme_color: '#06070a',
        background_color: '#06070a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // Cache de Imagens de Cartas do TCGdex (Imagens em baixa e alta resolução)
            urlPattern: /^https:\/\/assets\.tcgdex\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tcgdex-card-images',
              expiration: {
                maxEntries: 1200,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache das Coleções e Cartas da API TCGdex
            urlPattern: /^https:\/\/api\.tcgdex\.net\/v2\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tcgdex-api-data',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de Câmbio de Moedas
            urlPattern: /^https:\/\/economia\.awesomeapi\.com\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rates-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60 // 1 dia
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de Fontes do Google
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true
  }
})
