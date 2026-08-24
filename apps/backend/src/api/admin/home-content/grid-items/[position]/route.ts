import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deleteFeaturedGridItemWorkflow,
  upsertFeaturedGridItemWorkflow,
} from "../../../../../workflows/home-content"
import { validateLink } from "../../utils"

const VALID_POSITIONS = [1, 2, 3]

type GridItemPayload = {
  media_url?: unknown
  media_file_id?: unknown
  media_type?: unknown
  link_type?: unknown
  link_value?: unknown
  title?: unknown
}

function parsePosition(raw: string): number {
  const position = Number(raw)

  if (!VALID_POSITIONS.includes(position)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `position must be one of: ${VALID_POSITIONS.join(", ")}`
    )
  }

  return position
}

export async function POST(
  req: MedusaRequest<GridItemPayload>,
  res: MedusaResponse
): Promise<void> {
  const position = parsePosition(req.params.position)

  const mediaUrl = req.body.media_url
  const mediaFileId = req.body.media_file_id
  const mediaTypeRaw = req.body.media_type

  if (typeof mediaUrl !== "string" || !mediaUrl.trim()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "media_url is required")
  }

  if (typeof mediaFileId !== "string" || !mediaFileId.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "media_file_id is required"
    )
  }

  if (mediaTypeRaw !== "image" && mediaTypeRaw !== "video") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "media_type must be 'image' or 'video'"
    )
  }

  const mediaType: "image" | "video" = mediaTypeRaw

  const { link_type, link_value } = validateLink(
    req.body.link_type,
    req.body.link_value,
    ["collection", "category"] as const
  )

  const title =
    typeof req.body.title === "string" && req.body.title.trim()
      ? req.body.title.trim()
      : null

  const { result: gridItem } = await upsertFeaturedGridItemWorkflow(req.scope).run({
    input: {
      position,
      media_url: mediaUrl.trim(),
      media_file_id: mediaFileId.trim(),
      media_type: mediaType,
      link_type,
      link_value: link_value as string,
      title,
    },
  })

  res.status(200).json({ grid_item: gridItem })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const position = parsePosition(req.params.position)

  const { result } = await deleteFeaturedGridItemWorkflow(req.scope).run({
    input: { position },
  })

  res.status(200).json({ id: result.id, deleted: true })
}
