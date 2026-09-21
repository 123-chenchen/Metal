import { randomUUID } from "crypto"
import path from "path"

import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { renderCustomArtwork, CustomArtworkCrop } from "../lib/custom-artwork"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export type UploadPayload = {
  filename?: unknown
  mime_type?: unknown
  data_url?: unknown
  crop?: CustomArtworkCrop
  shape?: "rectangle" | "hexagon"
}

const uploadCustomArtworkStep = createStep(
  "upload-custom-artwork",
  async (input: UploadPayload, { container }) => {
    const filename = typeof input.filename === "string" ? input.filename : ""
    const mimeType = typeof input.mime_type === "string" ? input.mime_type : ""
    const dataUrl = typeof input.data_url === "string" ? input.data_url : ""

    if (!filename || !mimeType || !dataUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "filename, mime_type, and data_url are required"
      )
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only JPG, PNG, and WebP images are supported"
      )
    }

    const fileBuffer = parseDataUrl(dataUrl, mimeType)

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Image must be 8 MB or smaller"
      )
    }

    if (
      input.shape !== undefined &&
      input.shape !== "rectangle" &&
      input.shape !== "hexagon"
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid crop shape"
      )
    }
    let cropped: Buffer | undefined
    if (input.shape) {
      try {
        cropped = await renderCustomArtwork(
          fileBuffer,
          input.crop ?? {},
          input.shape
        )
      } catch {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Could not crop image. Use a valid JPG, PNG, or WebP up to 40 megapixels."
        )
      }
    }
    const extension = getExtension(filename, mimeType)
    const storedFilename = `${Date.now()}-${randomUUID()}${extension}`
    let croppedUrl: string | undefined
    let uploadedFile: { url: string; id: string }

    try {
      const { result } = await uploadFilesWorkflow(container).run({
        input: {
          files: [
            {
              filename: `custom-uploads/${storedFilename}`,
              mimeType,
              content: fileBuffer.toString("base64"),
              access: "public",
            },
            ...(cropped
              ? [
                  {
                    filename: `custom-uploads/${storedFilename}-cropped.png`,
                    mimeType: "image/png",
                    content: cropped.toString("base64"),
                    access: "public" as const,
                  },
                ]
              : []),
          ],
        },
      })
      uploadedFile = result[0]
      croppedUrl = result[1]?.url
    } catch (error) {
      const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        `Failed to upload custom image to storage: ${message}`,
        error
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Could not upload image to storage. Please try again."
      )
    }

    return new StepResponse({
      url: uploadedFile.url,
      cropped_url: croppedUrl,
      id: uploadedFile.id,
      filename,
      mime_type: mimeType,
      size: fileBuffer.length,
    })
  }
)

export const uploadCustomArtworkWorkflow = createWorkflow(
  "upload-custom-artwork",
  (input: UploadPayload) => {
    return new WorkflowResponse(uploadCustomArtworkStep(input))
  }
)

function parseDataUrl(dataUrl: string, expectedMimeType: string): Buffer {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

  if (!match || match[1] !== expectedMimeType) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid image data")
  }

  return Buffer.from(match[2], "base64")
}

function getExtension(filename: string, mimeType: string) {
  const extension = path.extname(filename.toLowerCase())

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return extension
  }

  if (mimeType === "image/png") {
    return ".png"
  }

  if (mimeType === "image/webp") {
    return ".webp"
  }

  return ".jpg"
}
