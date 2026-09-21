export function catalogFilterQuery(query: string, key: "collection_id" | "category_id", value: string) {
  const params = new URLSearchParams(query)
  if (value) params.set(key, value)
  else params.delete(key)
  params.delete("page")
  return params.toString()
}
