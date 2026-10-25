import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/** Fills {{SUPPORT_CONTACT}} in the static privacy/support pages after the build. */
function legalPages(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const email = env.VITE_SUPPORT_EMAIL || process.env.VITE_SUPPORT_EMAIL || '';
  const contact = email
    ? `Email <a href="mailto:${email}">${email}</a>. We answer within two business days.`
    : 'Use the <b>Send feedback</b> button in the game (Boost tab → ⚙️ Settings). A support email will be listed here before the App Store release.';
  return {
    name: 'ss-legal-pages',
    apply: 'build',
    closeBundle() {
      for (const f of ['privacy.html', 'support.html']) {
        const p = path.resolve('dist', f);
        if (existsSync(p)) writeFileSync(p, readFileSync(p, 'utf8').replace(/\{\{SUPPORT_CONTACT\}\}/g, contact));
      }
    },
  };
}

// Relative base so the built bundle works from any folder, a subpath on a
// static host, and inside a Capacitor iOS shell (file:// style loading).
export default defineConfig(({ mode }) => ({
  plugins: [react(), legalPages(mode)],
  base: './',
  build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
}) as any);
