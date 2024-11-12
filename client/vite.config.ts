import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../src/main/webapp/dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'SciencePortal',
      fileName: () => 'react-app.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM'
        },
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'react-app.css'
          }
          return 'assets/[name].[ext]'
        }
      },
      external: ['react', 'react-dom']
    }
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production')
  }
}) as UserConfig