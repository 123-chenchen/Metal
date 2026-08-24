import { MedusaContainer } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { deleteFilesWorkflow } from "@medusajs/medusa/core-flows"
import { HOME_CONTENT_MODULE } from "../modules/home-content"
import HomeContentModuleService from "../modules/home-content/service"

type LinkType = "none" | "collection" | "category"

/**
 * Best-effort cleanup of a replaced/removed R2 file. Never throws - an
 * orphaned file is a minor annoyance, losing the admin's edit because R2
 * hiccuped is not.
 */
async function deleteFileIfChanged(
  container: MedusaContainer,
  previousFileId: string | null | undefined,
  nextFileId: string | null | undefined
): Promise<void> {
  if (!previousFileId || previousFileId === nextFileId) {
    return
  }

  try {
    await deleteFilesWorkflow(container).run({
      input: { ids: [previousFileId] },
    })
  } catch (error) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.warn(
      `[home-content] Failed to delete replaced file ${previousFileId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export type CreateHeroBannerInput = {
  image_url: string
  image_file_id: string
  heading: string | null
  subheading: string | null
  kicker: string | null
  link_type: LinkType
  link_value: string | null
}

const createHeroBannerStep = createStep(
  "create-hero-banner",
  async (input: CreateHeroBannerInput, { container }) => {
    const service = container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const existing = await service.listHeroBanners({})

    const hero = await service.createHeroBanners({
      ...input,
      position: existing.length,
    })

    return new StepResponse(hero)
  }
)

export const createHeroBannerWorkflow = createWorkflow(
  "create-hero-banner",
  (input: CreateHeroBannerInput) => {
    return new WorkflowResponse(createHeroBannerStep(input))
  }
)

export type UpdateHeroBannerInput = {
  id: string
  image_url: string
  image_file_id: string
  heading: string | null
  subheading: string | null
  kicker: string | null
  link_type: LinkType
  link_value: string | null
}

const updateHeroBannerStep = createStep(
  "update-hero-banner",
  async (input: UpdateHeroBannerInput, { container }) => {
    const service = container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const [existing] = await service.listHeroBanners({ id: input.id }, { take: 1 })

    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Hero banner ${input.id} not found`)
    }

    const hero = await service.updateHeroBanners(input)

    await deleteFileIfChanged(container, existing.image_file_id, input.image_file_id)

    return new StepResponse(hero)
  }
)

export const updateHeroBannerWorkflow = createWorkflow(
  "update-hero-banner",
  (input: UpdateHeroBannerInput) => {
    return new WorkflowResponse(updateHeroBannerStep(input))
  }
)

export type DeleteHeroBannerInput = {
  id: string
}

const deleteHeroBannerStep = createStep(
  "delete-hero-banner",
  async (input: DeleteHeroBannerInput, { container }) => {
    const service = container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const [existing] = await service.listHeroBanners({ id: input.id }, { take: 1 })

    if (existing) {
      await service.deleteHeroBanners(existing.id)
      await deleteFileIfChanged(container, existing.image_file_id, null)
    }

    return new StepResponse({ id: existing?.id ?? null })
  }
)

export const deleteHeroBannerWorkflow = createWorkflow(
  "delete-hero-banner",
  (input: DeleteHeroBannerInput) => {
    return new WorkflowResponse(deleteHeroBannerStep(input))
  }
)

export type UpsertFeaturedGridItemInput = {
  position: number
  media_url: string
  media_file_id: string
  media_type: "image" | "video"
  link_type: "collection" | "category"
  link_value: string
  title: string | null
}

const upsertFeaturedGridItemStep = createStep(
  "upsert-featured-grid-item",
  async (input: UpsertFeaturedGridItemInput, { container }) => {
    const service = container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const [existing] = await service.listFeaturedGridItems(
      { position: input.position },
      { take: 1 }
    )

    const gridItem = existing
      ? await service.updateFeaturedGridItems({ id: existing.id, ...input })
      : await service.createFeaturedGridItems(input)

    await deleteFileIfChanged(container, existing?.media_file_id, input.media_file_id)

    return new StepResponse(gridItem)
  }
)

export const upsertFeaturedGridItemWorkflow = createWorkflow(
  "upsert-featured-grid-item",
  (input: UpsertFeaturedGridItemInput) => {
    return new WorkflowResponse(upsertFeaturedGridItemStep(input))
  }
)

export type DeleteFeaturedGridItemInput = {
  position: number
}

const deleteFeaturedGridItemStep = createStep(
  "delete-featured-grid-item",
  async (input: DeleteFeaturedGridItemInput, { container }) => {
    const service = container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const [existing] = await service.listFeaturedGridItems(
      { position: input.position },
      { take: 1 }
    )

    if (existing) {
      await service.deleteFeaturedGridItems(existing.id)
      await deleteFileIfChanged(container, existing.media_file_id, null)
    }

    return new StepResponse({ id: existing?.id ?? null })
  }
)

export const deleteFeaturedGridItemWorkflow = createWorkflow(
  "delete-featured-grid-item",
  (input: DeleteFeaturedGridItemInput) => {
    return new WorkflowResponse(deleteFeaturedGridItemStep(input))
  }
)
