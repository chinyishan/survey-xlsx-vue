import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite'; //自動導入
import Components from 'unplugin-vue-components/vite'; //自動導入
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'; //自動導入
import UnoCSS from 'unocss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/survey-xlsx-vue/',
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3100,
  },
  build: {
    outDir: 'dist', // 指定輸出目錄
    sourcemap: false, // 生成 source map
    rollupOptions: {
      // 自定義 Rollup 配置
      output: {
        // 自定義輸出選項
        // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
        entryFileNames: 'js/[name].[hash].js',
        // 用于命名代码拆分时创建的共享块的输出命名
        chunkFileNames: 'js/[name].[hash].js',
        // 用于输出静态资源的命名，[ext]表示文件扩展名
        assetFileNames: (assetInfo: any) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          // console.log('文件信息', assetInfo.name)
          if (
            /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)
          ) {
            extType = 'media';
          } else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
            extType = 'img';
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'fonts';
          }
          return `${extType}/[name].[hash].[ext]`;
        },
      },
    },
  },
});
