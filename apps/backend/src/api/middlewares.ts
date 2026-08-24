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
  ],
})
