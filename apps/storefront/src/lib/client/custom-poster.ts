// Browser-side helper for the Custom poster/wall upload flow.

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

type CustomUploadResponse = {
  url: string
  filename: string
  mime_type: string
  size: number
}

export async function uploadCustomImage(
  file: File
): Promise<CustomUploadResponse> {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/store/custom/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(MEDUSA_PUBLISHABLE_KEY
        ? { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY }
        : {}),
    },
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type,
      data_url: await readFileAsDataUrl(file),
    }),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.message ?? "Could not upload custom image")
  }

  return {
    ...(payload as CustomUploadResponse),
    url: normalizeAssetUrl(payload.url),
  }
}

function normalizeAssetUrl(url: string) {
  return url.startsWith("/") ? `${MEDUSA_BACKEND_URL}${url}` : url
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Could not read image file"))
      }
    })
    reader.addEventListener("error", () => {
      reject(new Error("Could not read image file"))
    })
    reader.readAsDataURL(file)
  })
}
