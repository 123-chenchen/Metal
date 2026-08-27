"use client"

import { Button } from "@modules/common/components/ui"
import { PointerEvent, useState } from "react"

export const CROP_FRAME_WIDTH = 340
export const CROP_FRAME_HEIGHT = 390
const CROP_MIN_ZOOM = 1
const CROP_MAX_ZOOM = 4
const CROP_HEX_TOP = 0
const CROP_HEX_BOTTOM = 100
const CROP_HEX_SIDE_X = ((CROP_FRAME_WIDTH - 340) / 2 / CROP_FRAME_WIDTH) * 100
const cropHexPoints = `50,${CROP_HEX_TOP} ${100 - CROP_HEX_SIDE_X},25 ${
  100 - CROP_HEX_SIDE_X
},75 50,${CROP_HEX_BOTTOM} ${CROP_HEX_SIDE_X},75 ${CROP_HEX_SIDE_X},25`

export type CropShape = "hexagon" | "rectangle"

export type CustomCrop = {
  offsetX: number
  offsetY: number
  zoom: number
  imageRatio?: number | null
}

export type CustomUploadDraft = {
  file: File
  previewUrl: string
  crop: CustomCrop
}

export function getDefaultCrop(): CustomCrop {
  return {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    imageRatio: null,
  }
}

export function getFrameCoverSize(
  imageRatio: CustomCrop["imageRatio"],
  frame: {
    height: number
    width: number
  }
) {
  const ratio =
    typeof imageRatio === "number" &&
    Number.isFinite(imageRatio) &&
    imageRatio > 0
      ? imageRatio
      : 1
  const frameRatio = frame.width / frame.height

  if (ratio >= frameRatio) {
    return {
      height: frame.height,
      width: frame.height * ratio,
    }
  }

  return {
    height: frame.width / ratio,
    width: frame.width,
  }
}

export function clampCrop(crop: CustomCrop): CustomCrop {
  const zoom = clamp(crop.zoom, CROP_MIN_ZOOM, CROP_MAX_ZOOM)
  const baseSize = getFrameCoverSize(crop.imageRatio, {
    height: CROP_FRAME_HEIGHT,
    width: CROP_FRAME_WIDTH,
  })
  const maxOffsetX = Math.max(0, (baseSize.width * zoom - CROP_FRAME_WIDTH) / 2)
  const maxOffsetY = Math.max(
    0,
    (baseSize.height * zoom - CROP_FRAME_HEIGHT) / 2
  )

  return {
    ...crop,
    offsetX: clamp(crop.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(crop.offsetY, -maxOffsetY, maxOffsetY),
    zoom,
  }
}

export function buildCropImageStyle(
  crop?: CustomCrop,
  frame = {
    height: CROP_FRAME_HEIGHT,
    width: CROP_FRAME_WIDTH,
  }
) {
  const normalized = clampCrop(crop ?? getDefaultCrop())
  const baseSize = getFrameCoverSize(normalized.imageRatio, frame)
  const scaleX = frame.width / CROP_FRAME_WIDTH
  const scaleY = frame.height / CROP_FRAME_HEIGHT

  return {
    height: `${baseSize.height}px`,
    transform: `translate(calc(-50% + ${
      normalized.offsetX * scaleX
    }px), calc(-50% + ${normalized.offsetY * scaleY}px)) scale(${
      normalized.zoom
    })`,
    width: `${baseSize.width}px`,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export const CustomCropModal = ({
  draft,
  shape,
  isUploading,
  onCancel,
  onConfirm,
  onCropChange,
}: {
  draft: CustomUploadDraft
  shape: CropShape
  isUploading: boolean
  onCancel: () => void
  onConfirm: () => void
  onCropChange: (crop: Partial<CustomCrop>) => void
}) => {
  const [dragStart, setDragStart] = useState<{
    x: number
    y: number
    offsetX: number
    offsetY: number
  } | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragStart({
      x: event.clientX,
      y: event.clientY,
      offsetX: draft.crop.offsetX,
      offsetY: draft.crop.offsetY,
    })
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart) {
      return
    }

    onCropChange({
      offsetX: dragStart.offsetX + event.clientX - dragStart.x,
      offsetY: dragStart.offsetY + event.clientY - dragStart.y,
    })
  }

  const handlePointerEnd = () => {
    setDragStart(null)
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-[460px] border border-ui-border-base bg-ui-bg-subtle px-6 pb-6 pt-6 text-ui-fg-base shadow-2xl">
        <div className="relative mb-2 text-center">
          <h2 className="text-[22px] font-bold leading-7 text-ui-fg-base">
            Crop Your Image
          </h2>
          <div className="mt-2 h-px w-full bg-ui-border-base" />
          <p className="mt-2 text-sm font-medium text-ui-fg-subtle">
            {shape === "hexagon"
              ? "Drag to position, zoom to fit the hexagon"
              : "Drag to position, zoom to fit the frame"}
          </p>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="absolute right-0 top-0 grid h-8 w-8 place-items-center border border-ui-border-base text-sm font-bold text-ui-fg-subtle transition-colors hover:text-ui-fg-base"
            aria-label="Close crop"
          >
            x
          </button>
        </div>

        <p className="mb-3 text-center text-xs font-bold text-ui-fg-subtle">
          Image 1 of 1
        </p>

        <div className="grid justify-center">
          <div
            className="relative cursor-grab overflow-hidden bg-ui-bg-subtle active:cursor-grabbing"
            style={{
              height: CROP_FRAME_HEIGHT,
              width: CROP_FRAME_WIDTH,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.previewUrl}
              alt=""
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget
                const imageRatio = image.naturalWidth / image.naturalHeight

                if (Number.isFinite(imageRatio) && imageRatio > 0) {
                  onCropChange({ imageRatio })
                }
              }}
              style={buildCropImageStyle(draft.crop, {
                height: CROP_FRAME_HEIGHT,
                width: CROP_FRAME_WIDTH,
              })}
            />
            {shape === "hexagon" && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <mask id="custom-crop-hex-mask">
                    <rect width="100" height="100" fill="white" />
                    <polygon points={cropHexPoints} fill="black" />
                  </mask>
                </defs>
                <rect
                  width="100"
                  height="100"
                  fill="rgba(21, 21, 21, 0.42)"
                  mask="url(#custom-crop-hex-mask)"
                />
                <polygon
                  points={cropHexPoints}
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.68)"
                  strokeWidth="0.35"
                />
              </svg>
            )}
          </div>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-semibold text-ui-fg-subtle">
          <span className="flex items-center justify-between">
            <span>Zoom</span>
            <span className="text-xs font-medium text-ui-fg-subtle">
              {Math.round(draft.crop.zoom * 100)}%
            </span>
          </span>
          <input
            type="range"
            min={CROP_MIN_ZOOM}
            max={CROP_MAX_ZOOM}
            step="0.05"
            value={draft.crop.zoom}
            onChange={(event) =>
              onCropChange({ zoom: Number(event.target.value) })
            }
            className="w-full"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 small:flex-row small:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="h-11 flex-1 border border-ui-border-base bg-ui-bg-subtle px-6 text-sm font-bold uppercase text-ui-fg-subtle transition-colors hover:text-ui-fg-base disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isUploading}
            disabled={isUploading}
            className="h-11 flex-1 px-7 text-sm font-bold uppercase"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
