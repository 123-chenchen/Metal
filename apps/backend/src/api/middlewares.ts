import { authenticate, defineMiddlewares } from "@medusajs/framework/http"
import { preventDuplicateProductCreate } from "./admin/products/prevent-duplicate-create"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      methods: ["POST"],
      middlewares: [preventDuplicateProductCreate],
    },
    {
      matcher: "/store/wishlist*",
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
      ],
    },
    {
      matcher: "/store/custom/uploads",
      methods: ["POST"],
      // Custom poster images arrive as base64 JSON (~33% bigger than the
      // raw file), which blows past Express's default 100kb body limit long
      // before hitting the route's own 8MB file-size check below.
      bodyParser: { sizeLimit: "12mb" },
    },
  ],
})
