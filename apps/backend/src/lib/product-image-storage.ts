export type ProductImageRecord = {
  id: string
  url: string
  product_id?: string
  created_at?: string | Date
}

export type ProductImageLookupService = {
  listProductImages: (
    filters: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<ProductImageRecord[]>
}

export type ProductImageWriteService = ProductImageLookupService & {
  deleteProductImages: (ids: string[]) => Promise<void>
}

export type FileModuleWriteService = {
  deleteFiles: (ids: string[]) => Promise<void>
}

/**
 * Derives the storage key of an uploaded file from its public URL, matching
 * the shape the configured Cloudflare R2 provider (@medusajs/medusa/file-s3)
 * produces on upload: `${S3_FILE_URL}/${encodedKey}`. Returns null for URLs
 * not hosted by the configured provider (e.g. external/hotlinked images).
 */
export function deriveFileKey(url: string, fileBaseUrl?: string): string | null {
  if (!fileBaseUrl || !url.startsWith(`${fileBaseUrl}/`)) {
    return null
  }
  return decodeURIComponent(url.slice(fileBaseUrl.length + 1))
}

/**
 * Deletes the given URLs from storage, but only the ones not referenced by
 * any active product image row - callers that already know a URL is fresh
 * (never persisted) can skip that check by passing skipUsageCheck.
 */
export async function deleteUnusedFilesByUrl(
  urls: string[],
  productImageService: ProductImageLookupService,
  fileModuleService: FileModuleWriteService,
  fileBaseUrl: string | undefined
): Promise<string[]> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)))
  const keysToDelete: string[] = []

  for (const url of uniqueUrls) {
    const fileKey = deriveFileKey(url, fileBaseUrl)
    if (!fileKey) {
      continue
    }

    const activeImagesWithUrl = await productImageService.listProductImages({
      url,
    })
    if (activeImagesWithUrl.length > 0) {
      continue
    }

    keysToDelete.push(fileKey)
  }

  if (keysToDelete.length) {
    await fileModuleService.deleteFiles(keysToDelete)
  }

  return keysToDelete
}
