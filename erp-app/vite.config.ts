import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'], // 더 넓은 브라우저 지원
    cssTarget: 'chrome87', // CSS 호환성
    minify: 'terser', // 더 나은 호환성을 위한 minify
    terserOptions: {
      compress: {
        drop_console: false, // 콘솔 로그 유지 (디버깅용)
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'], // 사전 번들링
  },
})
