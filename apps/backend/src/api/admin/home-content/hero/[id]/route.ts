import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deleteHeroBannerWorkflow,
  updateHeroBannerWorkflow,
} from "../../../../../workflows/home-content"
import { validateLink } from "../../utils"

type HeroPayload = {
  image_url?: unknown
  image_file_id?: unknown
  heading?: unknown
  subheading?: unknown
  kicker?: unknown
  link_type?: unknown
  link_value?: unknown
}

export async function POST(
  req: MedusaRequest<HeroPayload>,
  res: MedusaResponse
): Promise<void> {
  const id = req.params.id

  const imageUrl = req.body.image_url
  const imageFileId = req.body.image_file_id

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "image_url is required")
  }

  if (typeof imageFileId !== "string" || !imageFileId.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "image_file_id is required"
    )
  }

  const { link_type, link_value } = validateLink(
    req.body.link_type,
    req.body.link_value,
    ["none", "collection", "category"] as const
  )

  const heading =
    typeof req.body.heading === "string" && req.body.heading.trim()
      ? req.body.heading.trim()
      : null
  const subheading =
    typeof req.body.subheading === "string" && req.body.subheading.trim()
      ? req.body.subheading.trim()
      : null
  const kicker =
    typeof req.body.kicker === "string" && req.body.kicker.trim()
      ? req.body.kicker.trim()
      : null

  const { result: hero } = await updateHeroBannerWorkflow(req.scope).run({
    input: {
      id,
      image_url: imageUrl.trim(),
      image_file_id: imageFileId.trim(),
      heading,
      subheading,
      kicker,
      link_type,
      link_value,
    },
  })

  res.status(200).json({ hero })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const id = req.params.id

  const { result } = await deleteHeroBannerWorkflow(req.scope).run({
    input: { id },
  })

  res.status(200).json({ id: result.id, deleted: true })
}
