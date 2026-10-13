import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built bundle works from any folder, a subpath on a
// static host, and inside a Capacitor iOS shell (file:// style loading).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
