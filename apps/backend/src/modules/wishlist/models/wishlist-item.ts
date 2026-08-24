import { model } from "@medusajs/framework/utils"

const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  guest_id: model.text().nullable(),
  product_id: model.text(),
  // 1-based index into product.images, matching the `?img=N` design picker
  // used on listing cards and the product page. Lets a customer wishlist a
  // specific design of a product, not just the product as a whole.
  image_index: model.number().default(1),
})

export default WishlistItem
