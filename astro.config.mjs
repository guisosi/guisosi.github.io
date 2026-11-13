// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://guisosi.github.io',
  trailingSlash: 'ignore',
  markdown: {
    shikiConfig: { theme: 'vitesse-black' },
  },
  vite: {
    // never inline scripts, CSP only allows script-src 'self'
    build: { assetsInlineLimit: 0 },
  },
});
