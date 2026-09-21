import { Module } from "@medusajs/framework/utils"
import DesignModuleService from "./service"

export const DESIGN_MODULE = "design"

export default Module(DESIGN_MODULE, { service: DesignModuleService })
