// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // or vue from '@vitejs/plugin-vue'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
