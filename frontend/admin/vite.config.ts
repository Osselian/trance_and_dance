import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/auth': {
        target: 'https://localhost:3000', // куда реально ходит бек-энд
        changeOrigin: true,
        secure: false,                    // принять self-signed https
      },
    },
  },
})