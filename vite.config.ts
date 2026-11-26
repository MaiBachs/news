import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'RADAR_');
  const apiPort = process.env.RADAR_PORT ?? env.RADAR_PORT ?? '8080';

  return {
    root: 'web',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': `http://127.0.0.1:${apiPort}` },
    },
    build: { outDir: '../dist/web', emptyOutDir: true },
  };
});
