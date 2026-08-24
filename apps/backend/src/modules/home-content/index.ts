import { Module } from "@medusajs/framework/utils"
import HomeContentModuleService from "./service"

export const HOME_CONTENT_MODULE = "home_content"

export default Module(HOME_CONTENT_MODULE, {
  service: HomeContentModuleService,
})
