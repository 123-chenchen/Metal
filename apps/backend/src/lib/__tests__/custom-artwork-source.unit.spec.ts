import {
  customArtworkSourceUrl,
  readCustomArtworkSource,
} from "../custom-artwork-source"

describe("custom artwork source", () => {
  it("accepts only configured storage paths", () => {
    const base = "https://cdn.example.com/products"
    expect(customArtworkSourceUrl(`${base}/custom.png`, base)).toBe(
      `${base}/custom.png`
    )
    expect(customArtworkSourceUrl("/static/custom.png", "")).toBe(
      "http://localhost:9000/static/custom.png"
    )
    for (const url of [
      "https://evil.example/custom.png",
      "http://localhost:9000/admin/orders",
      "https://cdn.example.com/private.png",
      "https://cdn.example.com/products/../private.png",
      "https://user:pass@cdn.example.com/products/test.png",
      "https://cdn.example.com/products/%2e%2e%2fprivate.png",
    ]) {
      expect(customArtworkSourceUrl(url, base)).toBeNull()
    }
  })

  it("reads the original without following redirects", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new Uint8Array([1, 2, 3])))
    try {
      expect(
        await readCustomArtworkSource("http://localhost:9000/static/test.png")
      ).toEqual(Buffer.from([1, 2, 3]))
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ redirect: "error" })
      )
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("stops reading oversized originals", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new Uint8Array(8 * 1024 * 1024 + 1)))
    try {
      await expect(
        readCustomArtworkSource("http://localhost:9000/static/test.png")
      ).rejects.toThrow("8 MB")
    } finally {
      fetchMock.mockRestore()
    }
  })
})
