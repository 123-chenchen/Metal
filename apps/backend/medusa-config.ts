import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    maxUploadFileSize: 500 * 1024 * 1024, // 500MB
    vite: (config) => {
      const path = require("path")
      const react = require("@vitejs/plugin-react").default
      const plugins = (config.plugins ?? []) as any[]
      const nonReactPlugins = plugins
        .flat(Infinity)
        .filter(
          (plugin: any) =>
            !(
              plugin &&
              typeof plugin.name === "string" &&
              plugin.name.startsWith("vite:react")
            )
        )
      const aliases = Array.isArray(config.resolve?.alias)
        ? config.resolve.alias
        : Object.entries(config.resolve?.alias ?? {}).map(
            ([find, replacement]) => ({ find, replacement })
          )

      // The backend Admin uses React 18 while the storefront workspace uses
      // React 19. On Linux, Vite can otherwise resolve both workspace copies
      // into the same Admin bundle, causing React error #31 at runtime.
      const reactRoot = path.dirname(require.resolve("react/package.json"))
      const reactDomRoot = path.dirname(
        require.resolve("react-dom/package.json")
      )

      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: [
            { find: "react-dom", replacement: reactDomRoot },
            { find: "react", replacement: reactRoot },
            ...aliases,
          ],
          dedupe: Array.from(
            new Set([
              ...(config.resolve?.dedupe ?? []),
              "react",
              "react-dom",
            ])
          ),
        },
        server: {
          ...config.server,
          allowedHosts: [".trycloudflare.com"],
        },
        plugins: [
          ...nonReactPlugins,
          // Fast Refresh injects duplicate preamble code for files under
          // src/admin/widgets and src/admin/routes (upstream admin-vite-plugin
          // bug), crashing the dev server on first load. Excluding them from
          // Fast Refresh means a manual page reload is needed after editing
          // those files, but keeps HMR working for the rest of the admin.
          react({
            exclude: [/[\\/]src[\\/]admin[\\/](widgets|routes)[\\/]/],
          }),
        ],
      }
    },
  },

  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE || "shared") as
      | "shared"
      | "worker"
      | "server",

    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },

  modules: [
    {
      resolve: "./src/modules/home-content",
    },
    {
      resolve: "./src/modules/wishlist",
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "r2",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION || "auto",
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              prefix: "products",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/sepay",
            id: "sepay",
            options: {
              bankAccountNumber: process.env.SEPAY_BANK_ACCOUNT_NUMBER,
              bankCode: process.env.SEPAY_BANK_CODE,
              accountHolderName: process.env.SEPAY_ACCOUNT_HOLDER_NAME,
              apiToken: process.env.SEPAY_API_TOKEN,
              webhookApiKey: process.env.SEPAY_WEBHOOK_API_KEY,
            },
          },
        ],
      },
    },
  ],
})
