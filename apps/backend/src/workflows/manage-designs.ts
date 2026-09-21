import { createHash, randomUUID } from "node:crypto"
import sharp from "sharp"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { uploadFilesWorkflow, deleteFilesWorkflow } from "@medusajs/medusa/core-flows"
import DesignModuleService from "../modules/design/service"
import { DESIGN_MODULE } from "../modules/design"
import { DesignCommand, defaultDesignCrop, designHandle, designTitle, readGallery, reorderGallery, validateDesignFile } from "../lib/designs"

type Input = { product_id: string; command: DesignCommand }

async function retainAsset(service: DesignModuleService, url: string, fileId: string | null) {
  const id = `dasset_${createHash("sha256").update(url).digest("hex")}`
  if ((await service.listDesignAssets({ id }, { take: 1 })).length) return
  try {
    await service.createDesignAssets({ id, url, file_id: fileId })
  } catch (error) {
    if (!(await service.listDesignAssets({ id }, { take: 1 })).length) throw error
  }
}

async function importImages(container: MedusaContainer, productId: string) {
  const service = container.resolve<DesignModuleService>(DESIGN_MODULE)
  const productService = container.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(productId, { relations: ["images"] })
  const existing = await service.listDesigns({ product_id: productId }, { take: null })
  const imported = new Set(existing.map((design) => design.legacy_image_id))
  let sequence = Math.max(0, ...existing.map((design) => design.sequence))
  for (const [index, image] of (product.images ?? []).entries()) {
    if (imported.has(image.id)) continue
    const id = `design_${image.id}`
    await retainAsset(service, image.url, null)
    sequence += 1
    await service.createDesigns({
      id, product_id: productId, sequence,
      title: `${product.title} ${index + 1}`,
      handle: designHandle(product.title, id),
      legacy_image_id: image.id, legacy_index: index + 1,
      artwork_url: image.url, artwork_file_id: null,
      shape: "original", crop: defaultDesignCrop, gallery: { images: [] }, retained_urls: { urls: [] },
      request_key: `legacy:${productId}:${image.id}`,
    })
  }
  return product
}

const manageDesignsStep = createStep("manage-designs", async (input: Input, { container }) => {
  const service = container.resolve<DesignModuleService>(DESIGN_MODULE)
  const locking = container.resolve(Modules.LOCKING)
  const response = await locking.execute(`designs:${input.product_id}`, async () => {
    const command = input.command
    const productService = container.resolve(Modules.PRODUCT)
    const product = await productService.retrieveProduct(input.product_id)

    if (command.action === "import") {
      await importImages(container, product.id)
      return { success: true }
    }

    const design = "design_id" in command && command.design_id
      ? (await service.listDesigns({ id: command.design_id, product_id: product.id }, { take: 1 }))[0]
      : null
    if ("design_id" in command && command.design_id && (!design || design.archived)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Design not found")
    }

    if (command.action === "upload") {
      if (!design && !(await service.listDesigns({ product_id: product.id }, { take: 1 })).length) {
        await importImages(container, product.id)
      }
      const requestKey = `${product.id}:${command.request_id}`
      const existing = (await service.listDesigns({ request_key: requestKey }, { take: 1 }))[0]
      const gallery = readGallery(design?.gallery)
      if (existing || gallery.some((image) => image.request_key === requestKey)) {
        return { success: true, id: existing?.id ?? design?.id }
      }
      if (design && gallery.length >= 30) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "A design can have up to 30 gallery images")
      }
      let extension: string
      let imageRatio: number
      try { extension = validateDesignFile(command.file) } catch (error) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, (error as Error).message)
      }
      try {
        const image = sharp(Buffer.from(command.file.content, "base64"), { limitInputPixels: 40_000_000 })
        const metadata = await image.metadata()
        if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unsupported image")
        // Decode the image to reject corrupt data, not just a plausible header.
        await image.resize(1, 1).toBuffer()
        imageRatio = metadata.width / metadata.height
      } catch {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Image is corrupt, animated, or larger than 40 megapixels")
      }
      const { result: files } = await uploadFilesWorkflow(container).run({ input: { files: [{
        filename: `designs/${product.id}/${command.request_id}.${extension}`,
        mimeType: command.file.mime_type, content: command.file.content, access: "public",
      }] } })
      const file = files[0]
      let committed = false
      try {
        if (!file?.url) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Upload did not return an image URL")
        if (design) {
          const updated = await service.updateDesigns({
            selector: { id: design.id, version: design.version },
            data: { gallery: { images: [...gallery, { id: randomUUID(), url: file.url, file_id: file.id, request_key: requestKey }] }, version: design.version + 1 },
          })
          if (!updated.length) throw new MedusaError(MedusaError.Types.CONFLICT, "This design changed. Refresh and retry")
          committed = true
        } else {
          const designs = await service.listDesigns({ product_id: product.id }, { order: { sequence: "DESC" }, take: 1 })
          const sequence = (designs[0]?.sequence ?? 0) + 1
          const id = `design_${command.request_id}`
          await service.createDesigns({
            id, product_id: product.id, sequence,
            title: command.title ?? designTitle(product.title, sequence),
            handle: designHandle(product.title, id),
            artwork_url: file.url, artwork_file_id: file.id,
            shape: command.shape, crop: { ...defaultDesignCrop, imageRatio }, gallery: { images: [] }, retained_urls: { urls: [] }, request_key: requestKey,
          })
          committed = true
        }
        await retainAsset(service, file.url, file.id)
      } catch (error) {
        if (file?.id && !committed) {
          await deleteFilesWorkflow(container).run({ input: { ids: [file.id] } }).catch(() => {
            container.resolve(ContainerRegistrationKeys.LOGGER).warn("Failed to clean an uncommitted design upload")
          })
        }
        throw error
      }
      return { success: true }
    }

    if (!design || design.version !== command.version) {
      throw new MedusaError(MedusaError.Types.CONFLICT, "This design changed. Refresh before saving")
    }
    const gallery = readGallery(design.gallery)
    let patch: Record<string, unknown> = {}
    if (command.action === "update") {
      patch = { title: command.title, active: command.active, shape: command.shape, crop: command.crop }
    } else if (command.action === "archive") {
      patch = { archived: true, active: false }
    } else if (command.action === "reorder-gallery") {
      try { patch = { gallery: { images: reorderGallery(gallery, command.image_ids ?? []) } } } catch (error) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, (error as Error).message)
      }
    } else {
      const selected = gallery.find((image) => image.id === command.image_id)
      if (!selected) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Select a gallery image")
      const rest = gallery.filter((image) => image.id !== selected.id)
      const retained = Array.isArray(design.retained_urls?.urls) ? design.retained_urls.urls : []
      if (command.action === "remove-gallery") {
        patch = { gallery: { images: rest }, retained_urls: { urls: [...new Set([...retained, selected.url])] } }
      } else {
        patch = {
          artwork_url: selected.url, artwork_file_id: selected.file_id, crop: defaultDesignCrop,
          gallery: { images: [{ id: randomUUID(), url: design.artwork_url, file_id: design.artwork_file_id }, ...rest] },
          retained_urls: { urls: [...new Set([...retained, design.artwork_url, selected.url])] },
        }
      }
    }
    const updated = await service.updateDesigns({ selector: { id: design.id, version: command.version }, data: { ...patch, version: design.version + 1 } })
    if (!updated.length) throw new MedusaError(MedusaError.Types.CONFLICT, "This design changed. Refresh before saving")
    return { success: true }
  }, { timeout: 60 })
  return new StepResponse(response)
})

export const manageDesignsWorkflow = createWorkflow("manage-designs", (input: Input) => {
  return new WorkflowResponse(manageDesignsStep(input))
})
