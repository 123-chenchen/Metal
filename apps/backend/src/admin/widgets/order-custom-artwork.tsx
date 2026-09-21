import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { orderArtwork, orderCropStyle } from "../lib/order-custom-artwork"

type Artwork = ReturnType<typeof orderArtwork>

function CroppedArtwork({ artwork }: { artwork: Artwork }) {
  const [ratio, setRatio] = useState(0)
  const [failed, setFailed] = useState(false)
  const [useOriginal, setUseOriginal] = useState(!artwork.cropped)
  const url = useOriginal ? artwork.original : artwork.cropped
  if (!url || failed)
    return <Text>Không tải được ảnh. Vui lòng kiểm tra file gốc.</Text>
  if (useOriginal && !artwork.crop)
    return <Text>Đơn này chưa lưu thông số crop của khách.</Text>

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "340 / 390",
        clipPath: artwork.hexagon
          ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          : undefined,
      }}
    >
      {useOriginal && !ratio && <Text>Đang tải ảnh crop…</Text>}
      <img
        src={url}
        alt="Ảnh theo vùng khách đã crop"
        className={
          useOriginal ? "absolute max-w-none" : "h-full w-full object-contain"
        }
        style={
          useOriginal
            ? {
                ...orderCropStyle(artwork.crop!, ratio),
                visibility: ratio ? "visible" : "hidden",
              }
            : undefined
        }
        onLoad={(event) =>
          setRatio(
            event.currentTarget.naturalWidth / event.currentTarget.naturalHeight
          )
        }
        onError={() => {
          if (!useOriginal && artwork.crop && artwork.original)
            setUseOriginal(true)
          else setFailed(true)
        }}
      />
    </div>
  )
}

function CustomArtworkItem({
  item,
  orderId,
}: {
  orderId: string
  item: NonNullable<AdminOrder["items"]>[number]
}) {
  const artwork = orderArtwork(item.metadata)
  if (!artwork.original) return null
  const hasCrop = Boolean(artwork.cropped || artwork.crop)
  const cropUrl =
    artwork.cropped ??
    `/admin/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(item.id)}/custom-artwork`
  return (
    <div className="space-y-3 px-6 py-4">
      <Text weight="plus">
        {item.product_title ?? item.title} · {item.variant_title} · SL{" "}
        {item.quantity}
      </Text>
      <Text size="small">
        {String(item.metadata?.custom_original_filename ?? "")}
      </Text>
      <div className="flex flex-wrap gap-6">
        <div className="w-48 space-y-2">
          <Text weight="plus">Ảnh gốc</Text>
          <a
            href={artwork.original}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-ui-fg-interactive"
          >
            <img
              src={artwork.original}
              alt="Ảnh gốc của khách"
              className="mb-2 h-56 w-full rounded border object-contain"
            />
            Xem ảnh gốc
          </a>
        </div>
        <div className="w-48 space-y-2">
          <Text weight="plus">Ảnh khách đã crop</Text>
          {hasCrop ? (
            <>
              <a
                href={cropUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded border p-2"
                aria-label="Xem ảnh khách đã crop"
              >
                <CroppedArtwork artwork={artwork} />
              </a>
              <a
                href={cropUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-ui-fg-interactive"
              >
                Xem ảnh crop
              </a>
            </>
          ) : (
            <Text>Đơn này chưa lưu thông số crop của khách.</Text>
          )}
        </div>
      </div>
    </div>
  )
}

const OrderCustomArtwork = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const items = (order.items ?? []).filter(
    (item) => orderArtwork(item.metadata).original
  )
  if (!items.length) return null
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Ảnh đơn hàng custom</Heading>
      </div>
      {items.map((item) => (
        <CustomArtworkItem key={item.id} item={item} orderId={order.id} />
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "order.details" })
export default OrderCustomArtwork
