// Build optimization configuration for webpack/Vite
module.exports = {
  mode: 'production',

  // Code splitting strategy
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        // React framework
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendors',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Blockchain libraries
        blockchain: {
          test: /[\\/]node_modules[\\/](ethers|web3|wagmi|viem)[\\/]/,
          name: 'blockchain-vendors',
          priority: 15,
          reuseExistingChunk: true,
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@mui|antd|tailwindcss)[\\/]/,
          name: 'ui-vendors',
          priority: 12,
          reuseExistingChunk: true,
        },
        // Common code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
    minimizer: [
      {
        apply: (compiler) => {
          // TerserPlugin for JS minimization
          compiler.hooks.compilation.tap('TerserPlugin', (compilation) => {
            // Minification config
          });
        },
      },
    ],
  },

  // Vite config equivalent
  vite: {
    build: {
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          pure_funcs: ['console.log', 'console.info'],
        },
      },
      rollupOptions: {
        output: {
          // Asset file names with content hash
          assetFileNames: 'assets/[name].[hash][extname]',
          // Chunk file names
          chunkFileNames: 'chunks/[name].[hash].js',
          // Entry file names
          entryFileNames: '[name].[hash].js',
        },
      },
      sourcemap: false, // Production: no sourcemaps
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
    },

    // Dynamic imports configuration
    dynamicImport: {
      loader: 'vite-plugin-dynamic-import',
    },
  },

  // Lazy loading routes
  routes: [
    {
      path: '/',
      component: () => import('../pages/Home'),
      name: 'home',
    },
    {
      path: '/explore',
      component: () => import('../pages/Explore'),
      name: 'explore',
    },
    {
      path: '/nft/:id',
      component: () => import('../pages/NFTDetail'),
      name: 'nft-detail',
    },
    {
      path: '/auctions',
      component: () => import('../pages/Auctions'),
      name: 'auctions',
    },
    {
      path: '/portfolio',
      component: () => import('../pages/Portfolio'),
      name: 'portfolio',
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('../pages/AdminPanel'),
      name: 'admin',
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],

  // Image optimization
  image: {
    formats: ['avif', 'webp', 'jpeg'],
    densities: [1, 2],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },

  // Font optimization
  fonts: {
    preload: [
      {
        href: '/fonts/inter-var.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    ],
  },

  // Critical CSS
  criticalCss: {
    routes: ['/', '/explore', '/nft/:id'],
  },

  // Service worker for offline support
  serviceWorker: {
    enabled: true,
    scope: '/',
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.durchex\.com\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'durchex-api',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 3600,
            },
          },
        },
        {
          urlPattern: /^https:\/\/gateway\.pinata\.cloud\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'ipfs-gateway',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 86400,
            },
          },
        },
      ],
    },
  },
};
