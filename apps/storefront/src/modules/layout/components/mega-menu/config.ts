export type MegaMenuEntryType = "category" | "collection"

export type MegaMenuEntry = {
  handle: string
  type: MegaMenuEntryType
}

export type MegaMenuSectionConfig = {
  title: string
  entries: MegaMenuEntry[]
}

/**
 * Manual structure of the Explore mega menu: which section a handle
 * appears under, and in what order. This is the only thing hardcoded here
 * - the display label and destination link for each entry are resolved
 * from the real category/collection data at render time (see index.tsx),
 * so editing a name in the admin doesn't require touching this file. An
 * entry whose handle doesn't exist in Medusa is silently skipped instead
 * of rendering a dead link.
 */
export const MEGA_MENU_SECTIONS: MegaMenuSectionConfig[] = [
  {
    title: "Collections",
    entries: [
      { handle: "poke-framium-square", type: "collection" },
      { handle: "poke-framium-hexagonal", type: "collection" },
    ],
  },
  {
    title: "Categories",
    entries: [
      { handle: "anime", type: "category" },
      { handle: "sports", type: "category" },
      { handle: "gaming", type: "category" },
    ],
  },
]
