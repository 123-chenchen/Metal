import { MedusaError } from "@medusajs/framework/utils"

export function customArtworkSourceUrl(
  value: unknown,
  fileBase = process.env.S3_FILE_URL
): string | null {
  if (typeof value !== "string") return null
  const bases = [fileBase, "http://localhost:9000/static"].filter(
    Boolean
  ) as string[]
  for (const base of bases) {
    try {
      const allowed = new URL(base)
      const url = new URL(value, allowed.origin)
      const path = decodeURIComponent(url.pathname)
      const prefix =
        decodeURIComponent(allowed.pathname).replace(/\/$/, "") + "/"
      if (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.origin === allowed.origin &&
        path.startsWith(prefix) &&
        !path.split("/").includes("..") &&
        !path.includes("\\")
      )
        return url.href
    } catch {}
  }
  return null
}

export async function readCustomArtworkSource(value: unknown): Promise<Buffer> {
  const url = customArtworkSourceUrl(value)
  if (!url)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Artwork source is not in the configured storage"
    )
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok || !response.body)
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Original artwork could not be loaded"
    )
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let size = 0
  try {
    while (true) {
      const { done, value: chunk } = await reader.read()
      if (done) break
      size += chunk.byteLength
      if (size > 8 * 1024 * 1024)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Original artwork exceeds 8 MB"
        )
      chunks.push(Buffer.from(chunk))
    }
  } finally {
    await reader.cancel()
  }
  return Buffer.concat(chunks)
}
