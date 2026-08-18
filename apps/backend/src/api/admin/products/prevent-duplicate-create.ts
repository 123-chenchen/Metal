import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import {
  deleteUnusedFilesByUrl,
  FileModuleWriteService,
  ProductImageLookupService,
} from "../../../lib/product-image-storage"

// The admin dashboard's product-create form uploads media and creates the
// product from a single button click, with no guard against the button
// being clicked again while the first submission is still uploading (see
// @medusajs/dashboard's product-create-form.tsx handleSubmit). Each extra
// click re-uploads every selected file to Cloudflare R2 and creates a whole
// separate product, so N clicks on a product with M images produce N
// products and up to N*M orphaned files. Since the dashboard can't be
// patched (it ships from @medusajs/dashboard), reject same-title creates
// that land within this window of an already-created product and clean up
// whatever this duplicate request already uploaded.
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000

type CreateProductBody = {
  title?: string
  thumbnail?: string | null
  images?: { url?: string }[]
}

// Requests still being processed (upload finished, create-product workflow
// running). Catches near-simultaneous double-clicks that the DB check below
// would miss because neither request's product has committed yet.
const titlesInFlight = new Set<string>()

export async function preventDuplicateProductCreate(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as CreateProductBody | undefined
  const title = body?.title?.trim()

  if (!title) {
    return next()
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  if (titlesInFlight.has(title)) {
    return rejectDuplicate(req, res, logger, body)
  }

  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()

  const recentMatches = await productModuleService.listProducts({
    title,
    created_at: { $gte: since },
  })

  if (recentMatches.length) {
    return rejectDuplicate(req, res, logger, body)
  }

  titlesInFlight.add(title)
  const release = () => titlesInFlight.delete(title)
  res.once("finish", release)
  res.once("close", release)

  return next()
}

async function rejectDuplicate(
  req: MedusaRequest,
  res: MedusaResponse,
  logger: Logger,
  body: CreateProductBody | undefined
) {
  const candidateUrls = [
    body?.thumbnail ?? undefined,
    ...(body?.images?.map((image) => image.url) ?? []),
  ].filter((url): url is string => !!url)

  if (candidateUrls.length) {
    try {
      const productImageService = req.scope.resolve(
        Modules.PRODUCT
      ) as unknown as ProductImageLookupService
      const fileModuleService = req.scope.resolve(
        Modules.FILE
      ) as unknown as FileModuleWriteService

      await deleteUnusedFilesByUrl(
        candidateUrls,
        productImageService,
        fileModuleService,
        process.env.S3_FILE_URL
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn(
        `Failed to clean up files from a duplicate product-create request: ${message}`
      )
    }
  }

  return res.status(409).json({
    type: "duplicate_request",
    message:
      "A product with this title was just created or is still being created. This duplicate submission was discarded to avoid creating repeat uploads - please check the products list instead of submitting again.",
  })
}
