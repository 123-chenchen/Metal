import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { HOME_CONTENT_MODULE } from "../modules/home-content"
import HomeContentModuleService from "../modules/home-content/service"
import { HomeHeroConfig } from "../lib/home-hero"

const saveHomeHeroStep = createStep(
  "save-home-hero",
  async (config: HomeHeroConfig, { container }) => {
    const service =
      container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    const id = "home-hero-settings"
    const [previous] = await service.listHeroSettings({ id })
    if (previous) {
      await service.updateHeroSettings({ id, config })
    } else {
      await service.createHeroSettings({ id, config })
    }
    return new StepResponse(config, { id, previous: previous?.config })
  },
  async (data, { container }) => {
    if (!data) return
    const service =
      container.resolve<HomeContentModuleService>(HOME_CONTENT_MODULE)
    if (data.previous) {
      await service.updateHeroSettings({ id: data.id, config: data.previous })
    } else {
      await service.deleteHeroSettings(data.id)
    }
  }
)

export const saveHomeHeroWorkflow = createWorkflow(
  "save-home-hero",
  (config: HomeHeroConfig) => new WorkflowResponse(saveHomeHeroStep(config))
)
