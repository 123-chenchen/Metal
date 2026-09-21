import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

type Input = { product_id: string; remove: string[] }

const prepareRemoval = createStep("prepare-safe-option-removal", async (input: Input, { container }) => {
  const products = container.resolve(Modules.PRODUCT)
  const product = await products.retrieveProduct(input.product_id, { relations: ["options", "options.values", "variants", "variants.options"] })
  const removed = new Set(input.remove)
  if (input.remove.some((id) => !product.options?.some((option) => option.id === id))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Option does not belong to this product")
  }
  const remaining = (product.options ?? []).filter((option) => !removed.has(option.id))
  const variants = (product.variants ?? []).map((variant) => ({
    id: variant.id,
    options: Object.fromEntries(remaining.map((option) => {
      const value = variant.options?.find((value) => value.option_id === option.id)?.value
      if (value == null) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variant is missing a remaining option value")
      return [option.title, value]
    })),
  }))
  const combinations = variants.map((variant) => JSON.stringify(variant.options))
  if (new Set(combinations).size !== combinations.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Không thể gỡ: các variant sẽ trùng lựa chọn còn lại. Hãy xử lý variant trùng trước; chưa có dữ liệu nào bị xóa.")
  }
  return new StepResponse({ products: [{ id: product.id, option_ids: remaining.map((option) => option.id), variants }] })
})

export const removeProductOptionsSafelyWorkflow = createWorkflow("remove-product-options-safely", (input: Input) => {
  const update = prepareRemoval(input)
  const result = updateProductsWorkflow.runAsStep({ input: update })
  return new WorkflowResponse(result)
})
