import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, generateJwtToken, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import { DESIGN_MODULE } from "../../src/modules/design"
import DesignModuleService from "../../src/modules/design/service"
import { WISHLIST_MODULE } from "../../src/modules/wishlist"
import WishlistModuleService from "../../src/modules/wishlist/service"
import migrateProductDesigns from "../../src/scripts/migrate-product-designs"
import { deleteRemovedProductImagesWorkflow } from "../../src/workflows/delete-removed-product-images"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  inApp: true,
  moduleName: "metal-designs",
  env: { NODE_ENV: "test", DISABLE_MEDUSA_ADMIN: "true", JWT_SECRET: "design-test-secret", COOKIE_SECRET: "design-test-cookie" },
  testSuite: ({ api, getContainer }) => {
    let product: any
    let admin: { headers: Record<string, string> }
    let store: { headers: Record<string, string> }
    let region: any
    let image: string
    const command = (body: Record<string, unknown>) => api.post(`/admin/products/${product.id}/designs`, body, admin)
    const list = async () => (await api.get(`/admin/products/${product.id}/designs`, admin)).data.designs
    const upload = (requestId = randomUUID(), designId?: string) => command({ action: "upload", request_id: requestId, design_id: designId, shape: "hexagon", file: { filename: "art.png", mime_type: "image/png", content: image } })

    beforeEach(async () => {
      const container = getContainer()
      image = (await sharp({ create: { width: 120, height: 80, channels: 3, background: "#ef4444" } }).png().toBuffer()).toString("base64")
      const user = await container.resolve(Modules.USER).createUsers({ email: "design-test@example.com" })
      const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
      admin = { headers: { Authorization: `Bearer ${generateJwtToken({ actor_id: user.id, actor_type: "user", auth_identity_id: "auth_design_test" }, { secret: config.projectConfig.http.jwtSecret, expiresIn: "1h" })}` } }
      const salesChannel = await container.resolve(Modules.SALES_CHANNEL).createSalesChannels({ name: "Design test" })
      const key = await container.resolve(Modules.API_KEY).createApiKeys({ title: "Design test", type: "publishable", created_by: user.id })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [salesChannel.id] } })
      store = { headers: { "x-publishable-api-key": key.token } }
      region = await container.resolve(Modules.REGION).createRegions({ name: "Design test", currency_code: "usd", countries: ["us"] })
      const profile = await container.resolve(Modules.FULFILLMENT).createShippingProfiles({ name: "Design test", type: "default" })
      const { result } = await createProductsWorkflow(container).run({ input: { products: [{
        title: "Dragon Ball", handle: `design-test-${randomUUID()}`, status: "published", shipping_profile_id: profile.id,
        sales_channels: [{ id: salesChannel.id }], options: [{ title: "Size", values: ["S"] }],
        variants: [{ title: "S", options: { Size: "S" }, manage_inventory: false, prices: [{ currency_code: "usd", amount: 25 }] }],
      }] } })
      product = result[0]
    })

    it("creates stable numbered designs, retries safely and keeps gallery out of numbering", async () => {
      const requestId = randomUUID()
      await upload(requestId)
      await upload(requestId)
      await upload()
      let designs = await list()
      expect(designs.map((design: any) => design.title)).toEqual(["Dragon Ball 001", "Dragon Ball 002"])
      const galleryRequest = randomUUID()
      await upload(galleryRequest, designs[0].id)
      await upload(galleryRequest, designs[0].id)
      await upload()
      designs = await list()
      expect(designs).toHaveLength(3)
      expect(designs[2].title).toBe("Dragon Ball 003")
      expect(designs[0].gallery.images).toHaveLength(1)
      const original = designs[0]
      await command({ action: "promote", design_id: original.id, version: original.version, image_id: original.gallery.images[0].id })
      const promoted = (await list())[0]
      expect(promoted.id).toBe(original.id)
      expect(promoted.title).toBe(original.title)
      expect(promoted.handle).toBe(original.handle)
      expect(promoted.artwork_url).toBe(original.gallery.images[0].url)
      expect(promoted.gallery.images[0].url).toBe(original.artwork_url)
      await expect(command({ action: "archive", design_id: original.id, version: original.version })).rejects.toMatchObject({ response: { status: 409 } })
      const response = await api.get(`/store/products?id[]=${product.id}&fields=*design&region_id=${region.id}`, store)
      expect(response.data.products[0].design).toHaveLength(3)
    })

    it("canonicalizes cart snapshots and keeps different designs of one variant separate", async () => {
      await upload()
      await upload()
      const designs = await list()
      const cart = (await api.post("/store/carts", { region_id: region.id }, store)).data.cart
      const add = (designId: string) => api.post(`/store/carts/${cart.id}/line-items`, {
        variant_id: product.variants[0].id, quantity: 1,
        metadata: { selected_design_id: designId, selected_design_name: "Forged title", selected_image_url: "https://invalid.example/forged.png" },
      }, store)
      await add(designs[0].id)
      const result = await add(designs[1].id)
      expect(result.data.cart.items).toHaveLength(2)
      expect(result.data.cart.items.map((item: any) => item.metadata.selected_design_name).sort()).toEqual(["Dragon Ball 001", "Dragon Ball 002"])
      expect(result.data.cart.items.every((item: any) => item.metadata.selected_image_url !== "https://invalid.example/forged.png")).toBe(true)
      for (const metadata of [{}, null, { selected_design_id: designs[1].id }]) {
        await expect(api.post(`/store/carts/${cart.id}/line-items/${result.data.cart.items[0].id}`, { metadata }, store)).rejects.toMatchObject({ response: { status: 400 } })
      }
      await expect(add("design_invalid")).rejects.toMatchObject({ response: { status: 400 } })
      await command({ action: "archive", design_id: designs[0].id, version: designs[0].version })
      await expect(add(designs[0].id)).rejects.toMatchObject({ response: { status: 400 } })
      await expect(api.post(`/store/carts/${cart.id}/complete`, {}, store)).rejects.toMatchObject({ response: { status: 400 } })
    })

    it("migrates legacy images and wishlist idempotently and retains referenced files", async () => {
      const container = getContainer()
      const products = container.resolve(Modules.PRODUCT)
      await products.updateProducts(product.id, { images: [{ url: "https://example.com/one.png" }, { url: "https://example.com/two.png" }] })
      const wishlist = container.resolve<WishlistModuleService>(WISHLIST_MODULE)
      await wishlist.createWishlistItems({ product_id: product.id, image_index: 2, guest_id: "design-test-guest" })
      await migrateProductDesigns({ container, args: [] })
      await migrateProductDesigns({ container, args: [] })
      const designs = await list()
      expect(designs.map((design: any) => design.title)).toEqual(["Dragon Ball 1", "Dragon Ball 2"])
      const entries = await wishlist.listWishlistItems({ guest_id: "design-test-guest" })
      expect(entries[0].design_id).toBe(designs[1].id)
      const service = container.resolve<DesignModuleService>(DESIGN_MODULE)
      expect(await service.listDesignAssets({ url: designs[0].artwork_url })).toHaveLength(1)
      const fileService = container.resolve(Modules.FILE)
      const deletion = jest.spyOn(fileService, "deleteFiles")
      await products.updateProducts(product.id, { images: [] })
      await deleteRemovedProductImagesWorkflow(container).run({ input: { productIds: [product.id], onlyDeleted: true } })
      expect(deletion).not.toHaveBeenCalled()
      deletion.mockRestore()
    })

    it("removes Default without replacing variants and buys without inventory", async () => {
      const url = `/admin/products/${product.id}`
      await api.post(`${url}/options/batch`, { add: [{ title: "Default option", values: ["Default value"] }] }, admin)
      await api.post(`${url}/variants/batch`, { update: [{ id: product.variants[0].id, options: { Size: "S", "Default option": "Default value" }, manage_inventory: true }] }, admin)
      const before = (await api.get(`${url}?fields=id,*options,*variants,*variants.options`, admin)).data.product
      await api.post(`${url}/options/batch`, { remove: [before.options.find((option: any) => option.title === "Default option").id] }, admin)
      await api.post(`${url}/variants/batch`, { update: [{ id: product.variants[0].id, manage_inventory: false }] }, admin)
      const after = (await api.get(`${url}?fields=id,*options,*variants,*variants.options`, admin)).data.product
      expect(after.options.map((option: any) => option.title)).toEqual(["Size"])
      expect(after.variants[0].id).toBe(product.variants[0].id)
      expect(after.variants[0].manage_inventory).toBe(false)
      await upload()
      const design = (await list())[0]
      const cart = (await api.post("/store/carts", { region_id: region.id }, store)).data.cart
      const added = (await api.post(`/store/carts/${cart.id}/line-items`, { variant_id: product.variants[0].id, quantity: 2, metadata: { selected_design_id: design.id } }, store)).data.cart
      expect(added.items[0].quantity).toBe(2)
      expect(added.items[0].unit_price).toBe(25)
      // A single variant can also retain its identity with no options left.
      await api.post(`${url}/options/batch`, { remove: [after.options[0].id] }, admin)
      const noOptions = (await api.get(`${url}?fields=id,*options,*variants,*variants.options`, admin)).data.product
      expect(noOptions.options).toHaveLength(0)
      expect(noOptions.variants[0].id).toBe(product.variants[0].id)
    })

    it("refuses option removal that would collapse distinct variants", async () => {
      const url = `/admin/products/${product.id}`
      const before = (await api.get(`${url}?fields=id,*options`, admin)).data.product
      await api.post(`${url}/options/batch`, { update: [{ product_option_id: before.options[0].id, add: [{ value: "M" }] }] }, admin)
      await api.post(`${url}/variants/batch`, { create: [{ title: "M", options: { Size: "M" }, manage_inventory: false, prices: [{ currency_code: "usd", amount: 30 }] }] }, admin)
      await expect(api.post(`${url}/options/batch`, { remove: [before.options[0].id] }, admin)).rejects.toMatchObject({ response: { status: 400 } })
      const after = (await api.get(`${url}?fields=id,*options,*variants`, admin)).data.product
      expect(after.options).toHaveLength(1)
      expect(after.variants).toHaveLength(2)
    })

    it("rejects unauthenticated writes and invalid images", async () => {
      await expect(api.post(`/admin/products/${product.id}/designs`, { action: "import" })).rejects.toMatchObject({ response: { status: 401 } })
      await expect(command({ action: "upload", request_id: randomUUID(), file: { filename: "bad.png", mime_type: "image/png", content: Buffer.from("bad image").toString("base64") } })).rejects.toMatchObject({ response: { status: 400 } })
      expect(await list()).toHaveLength(0)
    })
  },
})
