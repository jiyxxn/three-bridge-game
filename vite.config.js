import { defineConfig } from 'vite'

export default defineConfig({
  // public 폴더의 정적 파일들이 제대로 복사되도록 설정
  publicDir: 'public',

  build: {
    // 빌드 결과물이 나오는 폴더
    outDir: 'dist',

    // 정적 파일 복사 설정
    assetsDir: 'assets',

    // 파일 크기 경고 제한 (선택사항)
    chunkSizeWarningLimit: 1000,
  },

  // 개발 서버 설정
  server: {
    port: 3000,
  }
})