import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/popup.ts',
      output: {
        entryFileNames: 'popup.js',
      }
    }
  }
});
