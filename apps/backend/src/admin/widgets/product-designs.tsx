import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Button, Container, Drawer, Heading, Input, Text, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../lib/sdk"
import { cropGeometry, dragCrop, zoomCrop } from "../lib/artwork-crop"

type Shape = "original" | "vertical" | "horizontal" | "hexagon" | "multi-panel"
type Crop = { offsetX: number; offsetY: number; zoom: number; imageRatio: number | null }
type GalleryImage = { id: string; url: string }
type Design = {
  id: string; title: string; sequence: number; version: number; active: boolean; archived: boolean
  artwork_url: string; shape: Shape; crop: Crop; gallery: { images: GalleryImage[] }
}
type Draft = { id: string; file: File; preview: string; title: string; edited?: boolean; status: "pending" | "uploading" | "done" | "error"; error?: string }
const shapes: Record<Shape, string> = { original: "Tỷ lệ ảnh gốc", vertical: "Chữ nhật dọc", horizontal: "Chữ nhật ngang", hexagon: "Lục giác", "multi-panel": "Bộ ba tấm" }
const emptyCrop: Crop = { offsetX: 0, offsetY: 0, zoom: 1, imageRatio: null }
const accept = "image/jpeg,image/png,image/webp"
const multiPanelMask = "linear-gradient(to right, #000 0% 32%, transparent 32% 34%, #000 34% 66%, transparent 66% 68%, #000 68% 100%)"

function fileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1])
    reader.onerror = () => reject(new Error("Không đọc được file"))
    reader.readAsDataURL(file)
  })
}

function ShapePicker({ value, onChange, disabled }: { value: Shape; onChange: (shape: Shape) => void; disabled?: boolean }) {
  return <label className="grid gap-1 text-sm">Hình dạng tranh
    <select className="rounded border bg-ui-bg-field px-2 py-2" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as Shape)}>
      {Object.entries(shapes).map(([shape, label]) => <option key={shape} value={shape}>{label}</option>)}
    </select>
  </label>
}

function ArtworkPreview({ url, shape, crop, onRatio, compact = false, onCrop, disabled = false }: { url: string; shape: Shape; crop: Crop; onRatio?: (ratio: number) => void; compact?: boolean; onCrop?: (crop: Crop) => void; disabled?: boolean }) {
  const [naturalRatio, setNaturalRatio] = useState(1)
  const frame = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)
  const liveCrop = useRef(crop)
  liveCrop.current = crop
  const ratios = { original: naturalRatio, vertical: 3 / 4, horizontal: 4 / 3, hexagon: Math.sqrt(3) / 2, "multi-panel": 4 / 3 }
  const ratio = ratios[shape]
  const source = crop.imageRatio || naturalRatio
  const width = source >= ratio ? source / ratio * 100 : 100
  const height = source >= ratio ? 100 : ratio / source * 100
  const maxX = Math.max(0, (width * crop.zoom - 100) / 2 / width * 100)
  const maxY = Math.max(0, (height * crop.zoom - 100) / 2 / height * 100)
  const x = Math.max(-maxX, Math.min(maxX, crop.offsetX))
  const y = Math.max(-maxY, Math.min(maxY, crop.offsetY))
  useEffect(() => {
    const element = frame.current
    if (!element || !onCrop || disabled) return
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      const bounds = element.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1)
      const next = zoomCrop(liveCrop.current, source, ratio, liveCrop.current.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002), (event.clientX - bounds.left) / bounds.width - 0.5, (event.clientY - bounds.top) / bounds.height - 0.5)
      liveCrop.current = next
      onCrop(next)
    }
    element.addEventListener("wheel", wheel, { passive: false })
    return () => element.removeEventListener("wheel", wheel)
  }, [onCrop, disabled, source, ratio])
  return <div className={`${compact ? "aspect-[4/3]" : "aspect-[4/5]"} bg-ui-bg-subtle p-4 flex items-center justify-center overflow-hidden`}>
    <div ref={frame} tabIndex={onCrop && !disabled ? 0 : undefined} role={onCrop ? "group" : undefined} aria-label={onCrop ? "Kéo ảnh để căn vị trí, lăn chuột để zoom. Phím mũi tên để dịch, cộng trừ để zoom." : undefined}
      className={`relative overflow-hidden max-w-full max-h-full ${onCrop && !disabled ? "touch-none cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2" : ""}`}
      onPointerDown={(event) => {
        if (!onCrop || disabled || !event.isPrimary || event.button !== 0) return
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }}
      onPointerMove={(event) => {
        const previous = pointer.current
        if (!previous || previous.id !== event.pointerId || !onCrop || disabled) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (!bounds.width || !bounds.height) return
        const next = dragCrop(liveCrop.current, source, ratio, bounds.width, bounds.height, event.clientX - previous.x, event.clientY - previous.y)
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        liveCrop.current = next
        onCrop(next)
      }}
      onPointerUp={() => { pointer.current = null }} onPointerCancel={() => { pointer.current = null }} onLostPointerCapture={() => { pointer.current = null }}
      onKeyDown={(event) => {
        if (!onCrop || disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) return
        event.preventDefault()
        const bounds = event.currentTarget.getBoundingClientRect()
        if (!bounds.width || !bounds.height) return
        const next = ["+", "=", "-"].includes(event.key) ? zoomCrop(crop, source, ratio, crop.zoom + (event.key === "-" ? -0.1 : 0.1)) : dragCrop(crop, source, ratio, bounds.width, bounds.height, event.key === "ArrowLeft" ? -5 : event.key === "ArrowRight" ? 5 : 0, event.key === "ArrowUp" ? -5 : event.key === "ArrowDown" ? 5 : 0)
        liveCrop.current = next
        onCrop(next)
      }}
      style={{ aspectRatio: ratio, width: `${Math.min(100, ratio / (compact ? 4 / 3 : 4 / 5) * 100)}%`, clipPath: shape === "hexagon" ? "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" : undefined, maskImage: shape === "multi-panel" ? multiPanelMask : undefined, WebkitMaskImage: shape === "multi-panel" ? multiPanelMask : undefined }}>
      <img src={url} alt="Xem trước mẫu" className="absolute max-w-none" draggable={false}
        onLoad={(event) => { const image = event.currentTarget; if (image.naturalHeight) { const value = image.naturalWidth / image.naturalHeight; setNaturalRatio(value); onRatio?.(value) } }}
        style={{ width: `${width}%`, height: `${height}%`, left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}%), calc(-50% + ${y}%)) scale(${crop.zoom})` }} />
    </div>
  </div>
}

const ProductDesignsWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [shape, setShape] = useState<Shape>("original")
  const [galleryTarget, setGalleryTarget] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const draftUrls = useRef<string[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const prompt = usePrompt()
  const endpoint = `/admin/products/${product.id}/designs`

  const load = async () => {
    setError("")
    try {
      const result = await sdk.client.fetch<{ designs: Design[] }>(endpoint)
      setDesigns(result.designs)
    } catch (err) { setError(err instanceof Error ? err.message : "Không tải được mẫu") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [product.id])
  useEffect(() => () => { draftUrls.current.forEach(URL.revokeObjectURL) }, [])

  const command = async (body: Record<string, unknown>) => {
    setBusy(true)
    try {
      await sdk.client.fetch(endpoint, { method: "POST", body })
      await load()
      toast.success("Đã lưu")
      return true
    } catch (err) { toast.error(err instanceof Error ? err.message : "Không lưu được thay đổi"); return false }
    finally { setBusy(false) }
  }
  const selectFiles = (files: FileList | null) => {
    if (!files) return
    const max = Math.max(0, ...designs.map((design) => design.sequence), product.images?.length ?? 0)
    draftUrls.current.forEach(URL.revokeObjectURL)
    const next = Array.from(files).map((file, index): Draft => {
      const preview = URL.createObjectURL(file)
      const invalid = !accept.split(",").includes(file.type) || file.size > 8 * 1024 * 1024
      return { id: crypto.randomUUID(), file, preview, title: `${product.title} ${String(max + index + 1).padStart(3, "0")}`, status: invalid ? "error" : "pending", error: invalid ? "Chỉ nhận JPG, PNG, WebP tối đa 8 MB" : undefined }
    })
    draftUrls.current = next.map((draft) => draft.preview)
    setDrafts(next)
  }
  const upload = async () => {
    setBusy(true)
    for (const draft of drafts.filter((item) => item.status !== "done")) {
      if (!accept.split(",").includes(draft.file.type) || draft.file.size > 8 * 1024 * 1024) continue
      const update = (patch: Partial<Draft>) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, ...patch } : item))
      update({ status: "uploading", error: undefined })
      try {
        await sdk.client.fetch(endpoint, { method: "POST", body: {
          action: "upload", request_id: draft.id, design_id: galleryTarget ?? undefined,
          title: galleryTarget || !draft.edited ? undefined : draft.title, shape,
          file: { filename: draft.file.name, mime_type: draft.file.type, content: await fileContent(draft.file) },
        } })
        update({ status: "done" })
      } catch (err) { update({ status: "error", error: err instanceof Error ? err.message : "Upload thất bại" }) }
    }
    await load()
    setBusy(false)
  }
  const startUpload = (target: string | null) => {
    if (drafts.length) { toast.info("Hoàn tất hoặc đóng danh sách ảnh đang chờ trước khi chọn thêm ảnh."); return }
    setGalleryTarget(target)
    fileInput.current?.click()
  }
  const closeUpload = async () => {
    if (busy) return
    if (drafts.some((draft) => draft.status !== "done") && !await prompt({ title: "Bỏ các ảnh chưa tải?", description: "Ảnh đã tạo vẫn được giữ. Các ảnh đang chờ sẽ bị bỏ khỏi danh sách này." })) return
    setDrafts([])
    draftUrls.current.forEach(URL.revokeObjectURL)
    draftUrls.current = []
  }
  const visible = designs.filter((design) => !design.archived)
  const filtered = visible.filter((design) => design.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (filter === "all" || design.active === (filter === "active")))
  const selected = designs.find((design) => design.id === editing)
  return <Container className="p-0 divide-y">
    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
      <div><Heading level="h2">Mẫu sản phẩm <span className="ml-2 text-ui-fg-muted">{visible.length}</span></Heading><Text size="small" className="text-ui-fg-subtle">Ảnh và gallery riêng · Giá, SKU và variant dùng chung.</Text></div>
      <div className="flex gap-2"><Button variant="secondary" size="small" onClick={() => void load()} disabled={busy || loading || !!editing}>Làm mới</Button><Button size="small" onClick={() => startUpload(null)} disabled={busy || loading || !!error || !!drafts.length}>Thêm mẫu</Button></div>
    </div>
    <div className="p-6 grid gap-5">
      {error && <div role="alert" className="text-ui-fg-error">{error}</div>}
      {loading ? <Text>Đang tải mẫu…</Text> : <>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1"><Input placeholder="Tìm tên mẫu…" aria-label="Tìm mẫu" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <select aria-label="Lọc trạng thái mẫu" className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả</option><option value="active">Đang hiển thị</option><option value="hidden">Đang ẩn</option></select>
        </div>
        {!visible.length && <div className="rounded-lg border border-dashed border-ui-border-strong bg-ui-bg-subtle px-6 py-10 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!busy && !drafts.length && !error) { setGalleryTarget(null); selectFiles(event.dataTransfer.files) } }}><Heading level="h3">Bắt đầu bằng ảnh chính</Heading><Text size="small" className="mt-2 text-ui-fg-subtle">Kéo thả ảnh vào đây hoặc chọn “Thêm mẫu”. Mỗi ảnh tạo một mẫu có tên riêng.</Text><Text size="xsmall" className="mt-2 text-ui-fg-muted">JPG, PNG, WebP · Tối đa 8 MB/ảnh</Text></div>}
        <input ref={fileInput} hidden type="file" accept={accept} multiple onChange={(event) => { selectFiles(event.target.files); event.target.value = "" }} />
        <Drawer open={!!drafts.length} onOpenChange={(open) => { if (!open) void closeUpload() }}>
          <Drawer.Content><Drawer.Header><Drawer.Title>{galleryTarget ? "Thêm ảnh gallery" : "Tạo mẫu từ ảnh"}</Drawer.Title></Drawer.Header><Drawer.Body className="overflow-y-auto"><div className="grid gap-4">
          <Drawer.Description>{galleryTarget ? `Ảnh bổ sung cho ${designs.find((design) => design.id === galleryTarget)?.title ?? "mẫu đã chọn"}; không tạo mẫu mới.` : "Kiểm tra ảnh và tên trước khi tạo. Giá và variant lấy từ Product."}</Drawer.Description>
          {!galleryTarget && <ShapePicker value={shape} onChange={setShape} disabled={busy} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drafts.map((draft) => <div key={draft.id} className="grid gap-2 border rounded p-2">
              {galleryTarget ? <img src={draft.preview} className="aspect-square object-contain w-full" alt={draft.file.name} /> : <ArtworkPreview url={draft.preview} shape={shape} crop={emptyCrop} compact />}
              {!galleryTarget && <Input aria-label="Tên mẫu mới" value={draft.title} disabled={busy || draft.status === "done"} onChange={(event) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, title: event.target.value, edited: true } : item))} />}
              <Text size="xsmall" className="truncate">{draft.file.name}</Text>
              <Text size="small" aria-live="polite">{draft.status === "done" ? "Đã tạo" : draft.status === "uploading" ? "Đang tải…" : draft.error ?? "Sẵn sàng"}</Text>
              {draft.status !== "done" && <Button size="small" variant="secondary" disabled={busy} onClick={() => setDrafts((items) => items.filter((item) => item.id !== draft.id))}>Bỏ ảnh</Button>}
            </div>)}
          </div>
          </div></Drawer.Body><Drawer.Footer>
            <Button onClick={() => void upload()} isLoading={busy} disabled={busy || drafts.every((draft) => draft.status === "done") || (!galleryTarget && drafts.some((draft) => !draft.title.trim()))}>{galleryTarget ? "Thêm ảnh bổ sung" : `Tạo ${drafts.filter((draft) => draft.status !== "done").length} mẫu / thử lại ảnh lỗi`}</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void closeUpload()}>Đóng</Button>
          </Drawer.Footer></Drawer.Content>
        </Drawer>
        {!!visible.length && !filtered.length && <Text className="py-6 text-center text-ui-fg-subtle">Không tìm thấy mẫu phù hợp.</Text>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {filtered.map((design) => <article key={design.id} className="min-w-0 border border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-base">
            <button type="button" className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ui-border-interactive" aria-label={`Chỉnh sửa ${design.title}`} disabled={busy} onClick={() => setEditing(design.id)}><ArtworkPreview url={design.artwork_url} shape={design.shape} crop={design.crop} compact /></button>
            <div className="p-3 grid gap-3">
              <div className="flex items-center justify-between gap-2"><Text size="xsmall" className="text-ui-fg-muted">Mẫu {String(design.sequence).padStart(3, "0")}</Text><Badge size="2xsmall" color={design.active ? "green" : "grey"}>{design.active ? "Hiển thị" : "Đang ẩn"}</Badge></div>
              <Text weight="plus" className="truncate" title={design.title}>{design.title}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{shapes[design.shape]} · {design.gallery.images.length} ảnh gallery</Text>
              <div className="flex gap-2"><Button size="small" variant="secondary" className="flex-1" disabled={busy} onClick={() => setEditing(design.id)}>Chỉnh sửa</Button><Button size="small" variant="secondary" disabled={busy || !!drafts.length} onClick={() => startUpload(design.id)}>Thêm gallery</Button></div>
              <details className="border-t border-ui-border-base pt-2"><summary className="cursor-pointer text-sm text-ui-fg-subtle">Gallery và quản lý</summary><div className="grid gap-3 pt-3">
              {!!design.gallery.images.length && <div className="grid grid-cols-2 gap-2">
                {design.gallery.images.map((image, index) => <div key={image.id} className="grid gap-1 border rounded p-1">
                  <img src={image.url} alt={`Ảnh bổ sung ${index + 1}`} className="aspect-square object-contain w-full" />
                  <Button size="small" variant="secondary" disabled={busy} onClick={async () => {
                    if (await prompt({ title: "Dùng ảnh này làm ảnh chính?", description: "Tên và ID mẫu được giữ. Ảnh chính cũ chuyển vào gallery; vùng cắt được đặt lại." })) await command({ action: "promote", design_id: design.id, version: design.version, image_id: image.id })
                  }}>Đặt làm ảnh chính</Button>
                  <div className="flex gap-1"><Button size="small" variant="secondary" disabled={busy || index === 0} onClick={() => {
                    const ids = design.gallery.images.map((item) => item.id)
                    const previous = ids[index - 1]
                    ids[index - 1] = ids[index]
                    ids[index] = previous
                    void command({ action: "reorder-gallery", design_id: design.id, version: design.version, image_ids: ids })
                  }}>Lên</Button><Button size="small" variant="secondary" disabled={busy} onClick={() => void command({ action: "remove-gallery", design_id: design.id, version: design.version, image_id: image.id })}>Bỏ ảnh</Button></div>
                </div>)}
              </div>}
              <Button size="small" variant="danger" disabled={busy} onClick={async () => {
                if (await prompt({ title: "Lưu trữ mẫu này?", description: "Mẫu ngừng bán. Ảnh và thông tin đơn hàng cũ được giữ lại." })) await command({ action: "archive", design_id: design.id, version: design.version })
              }}>Lưu trữ mẫu</Button>
              </div></details>
            </div>
          </article>)}
        </div>
        <Drawer open={!!selected} onOpenChange={async (open) => { if (!open && !busy && await prompt({ title: "Đóng chỉnh sửa?", description: "Những thay đổi chưa lưu sẽ bị bỏ." })) setEditing(null) }}>
          <Drawer.Content><Drawer.Header><Drawer.Title>Chỉnh sửa mẫu</Drawer.Title></Drawer.Header><Drawer.Body className="overflow-y-auto"><Drawer.Description>Thay đổi ở đây chỉ áp dụng cho mẫu này. Giá và variant không thay đổi.</Drawer.Description>{selected && <DesignEditor key={`${selected.id}:${selected.version}`} design={selected} busy={busy} save={async (body) => { const saved = await command(body); if (saved) setEditing(null); return saved }} />}</Drawer.Body></Drawer.Content>
        </Drawer>
      </>}
    </div>
  </Container>
}

function DesignEditor({ design, busy, save }: { design: Design; busy: boolean; save: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [title, setTitle] = useState(design.title)
  const [active, setActive] = useState(design.active)
  const [shape, setShape] = useState(design.shape)
  const [crop, setCrop] = useState(design.crop)
  return <div className="grid gap-3 border-t pt-3">
    <label className="grid gap-1 text-sm">Tên mẫu<Input value={title} disabled={busy} onChange={(event) => setTitle(event.target.value)} /></label>
    <ShapePicker value={shape} onChange={(next) => { setShape(next); setCrop((value) => ({ ...emptyCrop, imageRatio: value.imageRatio })) }} disabled={busy} />
    <ArtworkPreview url={design.artwork_url} shape={shape} crop={crop} onCrop={setCrop} disabled={busy} onRatio={(imageRatio) => setCrop((value) => {
      const ratios = { original: imageRatio, vertical: 3 / 4, horizontal: 4 / 3, hexagon: Math.sqrt(3) / 2, "multi-panel": 4 / 3 }
      return cropGeometry(imageRatio, ratios[shape], { ...value, imageRatio }).crop
    })} />
    <div className="flex items-center justify-between gap-3"><Text size="small" className="text-ui-fg-subtle">Kéo ảnh để căn · Lăn chuột để zoom ({Math.round(crop.zoom * 100)}%)</Text><Button size="small" variant="secondary" disabled={busy} onClick={() => setCrop((value) => ({ ...emptyCrop, imageRatio: value.imageRatio }))}>Đặt lại</Button></div>
    <Text size="xsmall" className="text-ui-fg-muted">Ảnh luôn phủ kín khung. Zoom lên để có thêm khoảng kéo. Kết quả dùng chung cho card và 3D.</Text>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={active} disabled={busy} onChange={(event) => setActive(event.target.checked)} />Hiển thị trên cửa hàng</label>
    <Button disabled={busy || !title.trim()} onClick={() => void save({ action: "update", design_id: design.id, version: design.version, title, active, shape, crop })}>Lưu thay đổi</Button>
  </div>
}

export const config = defineWidgetConfig({ zone: "product.details.after" })
export default ProductDesignsWidget
