module.exports = {
  swSrc: 'src/serviceWorker.js',
  swDest: 'build/service-worker.js',
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,json}'
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
};