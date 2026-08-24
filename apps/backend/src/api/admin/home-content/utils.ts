import { MedusaError } from "@medusajs/framework/utils"

export type LinkType = "none" | "collection" | "category"

export function validateLink<T extends LinkType>(
  linkType: unknown,
  linkValue: unknown,
  allowedTypes: readonly T[]
): { link_type: T; link_value: string | null } {
  if (
    typeof linkType !== "string" ||
    !(allowedTypes as readonly string[]).includes(linkType)
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `link_type must be one of: ${allowedTypes.join(", ")}`
    )
  }

  if (linkType === "none") {
    return { link_type: linkType as T, link_value: null }
  }

  if (typeof linkValue !== "string" || !linkValue.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "link_value is required when link_type is not 'none'"
    )
  }

  return { link_type: linkType as T, link_value: linkValue.trim() }
}
