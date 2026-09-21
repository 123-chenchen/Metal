import { authenticate, defineMiddlewares } from "@medusajs/framework/http"
import { preventDuplicateProductCreate } from "./admin/products/prevent-duplicate-create"
import { removeProductOptionsSafely } from "./admin/products/remove-options"
import { validateDesignCartItem, preventDesignSnapshotEdit, validateCartDesignAvailability } from "./store/design-cart-middleware"

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/products/:id/options/batch", methods: ["POST"], middlewares: [authenticate("user", ["session", "bearer", "api-key"]), removeProductOptionsSafely] },
    { matcher: "/store/carts/:id/line-items", methods: ["POST"], middlewares: [validateDesignCartItem] },
    { matcher: "/store/carts/:id/line-items/:line_id", methods: ["POST"], middlewares: [preventDesignSnapshotEdit] },
    { matcher: "/store/carts/:id/complete", methods: ["POST"], middlewares: [validateCartDesignAvailability] },
    {
      matcher: "/admin/products/:id/designs",
      methods: ["POST"],
      bodyParser: { sizeLimit: "12mb" },
    },
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
