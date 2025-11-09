import { defineConfig } from 'vite';
import { resolve } from 'path';

// Check if building IIFE format specifically
const buildIIFE = process.env.BUILD_IIFE === 'true';

export default defineConfig({
  build: {
    outDir: 'bundles',
    emptyOutDir: !buildIIFE, // Don't empty when building IIFE (it's a second pass)
    lib: buildIIFE ? {
      // IIFE format - single entry at a time
      entry: resolve(__dirname, process.env.ENTRY_FILE || 'src/konami-reveal.ts'),
      formats: ['iife'],
      name: 'KonamiLit',
      fileName: () => {
        const base = process.env.OUTPUT_NAME || 'konami-reveal';
        return `${base}.iife.js`;
      }
    } : {
      // ES modules - can handle multiple entries
      entry: {
        'konami-reveal': resolve(__dirname, 'src/konami-reveal.ts'),
        'konami-reveal.light': resolve(__dirname, 'src/bundles/konami-reveal-light.ts'),
      },
      formats: ['es'],
      fileName: '[name].esm'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    sourcemap: true
  }
});
