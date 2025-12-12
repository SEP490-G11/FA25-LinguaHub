import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
//Dùng để xử lý đường dẫn file và thư mục

export default defineConfig({
  //plugins là danh sách các plugin mà Vite sẽ dùng.
  plugins: [react()],
  //đường dẫn rút gọn
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define global for sockjs-client compatibility
  define: {
    global: 'globalThis',
  },
  //optimizeDeps là cấu hình tối ưu hoá dependency
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000
  }
});
