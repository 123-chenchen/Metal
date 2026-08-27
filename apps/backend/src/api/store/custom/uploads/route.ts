import { randomUUID } from "crypto"
import path from "path"

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

type UploadPayload = {
  filename?: unknown
  mime_type?: unknown
  data_url?: unknown
}

export async function POST(
  req: MedusaRequest<UploadPayload>,
  res: MedusaResponse
): Promise<void> {
  const filename = typeof req.body.filename === "string" ? req.body.filename : ""
  const mimeType =
    typeof req.body.mime_type === "string" ? req.body.mime_type : ""
  const dataUrl = typeof req.body.data_url === "string" ? req.body.data_url : ""

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

  const extension = getExtension(filename, mimeType)
  const storedFilename = `${Date.now()}-${randomUUID()}${extension}`
  let uploadedFile: { url: string; id: string }

  try {
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: {
        files: [
          {
            filename: `custom-uploads/${storedFilename}`,
            mimeType,
            content: fileBuffer.toString("base64"),
            access: "public",
          },
        ],
      },
    })
    uploadedFile = result[0]
  } catch (error) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to upload custom image to storage: ${message}`, error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Could not upload image to storage. Please try again."
    )
  }

  res.status(200).json({
    url: uploadedFile.url,
    id: uploadedFile.id,
    filename,
    mime_type: mimeType,
    size: fileBuffer.length,
  })
}

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
