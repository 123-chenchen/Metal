import { useState } from "react"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import type { HomeHeroConfig } from "../../../lib/home-hero"

type Slide = HomeHeroConfig["media_slides"][number]
function Choice({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder="Chọn..." />
      </Select.Trigger>
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

export default function HeroEditor({
  initialConfig,
}: {
  initialConfig: HomeHeroConfig
}) {
  const [config, setConfig] = useState(initialConfig)
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()
  const { data: links = [] } = useQuery({
    queryKey: ["home-banner-links"],
    queryFn: async () => {
      const [collections, categories] = await Promise.all([
        sdk.admin.productCollection.list({
          fields: "id,handle,title",
          limit: 1000,
        }),
        sdk.admin.productCategory.list({
          fields: "id,handle,name",
          limit: 1000,
        }),
      ])
      return [
        ...collections.collections
          .filter((item) => item.handle)
          .map((item) => ({
            label: `Collection: ${item.title}`,
            href: `/collections/${item.handle}`,
          })),
        ...categories.product_categories
          .filter((item) => item.handle)
          .map((item) => ({
            label: `Category: ${item.name}`,
            href: `/categories/${item.handle}`,
          })),
      ]
    },
  })
  const save = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ hero_config: HomeHeroConfig }>(
        "/admin/home-content/hero-settings",
        { method: "POST", body: config }
      ),
    onSuccess: ({ hero_config }) => {
      setConfig(hero_config)
      queryClient.invalidateQueries({ queryKey: ["home-content"] })
      toast.success("Đã lưu banner")
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const addSlide = (patch: Partial<Slide> = {}) => {
    const id = crypto.randomUUID()
    setConfig((current) => ({
      ...current,
      media_slides: [
        ...current.media_slides,
        {
          id,
          media_type: "image",
          media_url: "",
          media_file_id: null,
          media_object_position: "center center",
          link_url: "",
          ...patch,
        },
      ],
    }))
  }
  const updateSlide = (id: string, patch: Partial<Slide>) =>
    setConfig((current) => ({
      ...current,
      media_slides: current.media_slides.map((slide) =>
        slide.id === id ? { ...slide, ...patch } : slide
      ),
    }))
  const upload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    id?: string
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await sdk.admin.upload.create({ files: [file] })
      const media = result.files[0]
      if (!media?.url) throw new Error("Upload không trả về URL")
      const patch: Partial<Slide> = {
        media_url: media.url,
        media_file_id: media.id,
        media_type: "image",
      }
      if (id) updateSlide(id, patch)
      else addSlide(patch)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải media thất bại")
    } finally {
      setUploading(false)
      input.value = ""
    }
  }
  const selected = config.media_slides.find(
    (slide) => slide.id === selectedSlideId
  )
  const linkType = selected?.link_url.startsWith("/collections/")
    ? "collection"
    : selected?.link_url.startsWith("/categories/")
      ? "category"
      : selected?.link_url
        ? "existing"
        : "none"
  const destinations = links.filter((link) =>
    link.href.startsWith(
      linkType === "collection" ? "/collections/" : "/categories/"
    )
  )

  return (
    <Container className="p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const incomplete = config.media_slides.find((slide) =>
            ["/collections/", "/categories/"].includes(slide.link_url)
          )
          if (incomplete) {
            setSelectedSlideId(incomplete.id)
            toast.error("Chọn Collection hoặc Category cho slide")
            return
          }
          save.mutate()
        }}
      >
        <fieldset
          disabled={save.isPending || uploading}
          className="grid min-w-0 gap-4"
        >
          <Heading level="h2">Banner</Heading>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid w-40 gap-1">
              <Label htmlFor="banner-time">Thời gian (giây)</Label>
              <Input
                id="banner-time"
                required
                type="number"
                min={2}
                max={300}
                step="any"
                value={config.slide_interval_seconds || ""}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    slide_interval_seconds: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="grid min-w-0 max-w-xs gap-1">
              <Label htmlFor="banner-upload">Chọn ảnh</Label>
              <Input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={(event) => upload(event)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.media_slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Chỉnh slide ${index + 1}`}
                aria-pressed={selectedSlideId === slide.id}
                onClick={() =>
                  setSelectedSlideId(
                    selectedSlideId === slide.id ? null : slide.id
                  )
                }
                className={`w-28 overflow-hidden rounded border-2 focus-visible:outline focus-visible:outline-2 ${selectedSlideId === slide.id ? "border-ui-border-interactive" : "border-ui-border-base"}`}
              >
                {slide.media_type === "video" ? (
                  <video
                    src={slide.media_url}
                    muted
                    preload="metadata"
                    className="pointer-events-none h-16 w-full object-cover"
                  />
                ) : (
                  <img
                    src={slide.media_url}
                    alt={`Slide ${index + 1}`}
                    className="h-16 w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
          {selected && (
            <div className="grid max-w-sm gap-3 rounded border border-ui-border-base p-3">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Slide {config.media_slides.indexOf(selected) + 1}
                </Text>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() => {
                    setConfig({
                      ...config,
                      media_slides: config.media_slides.filter(
                        (slide) => slide.id !== selected.id
                      ),
                    })
                    setSelectedSlideId(null)
                  }}
                >
                  Xoá
                </Button>
              </div>
              <div className="grid gap-1">
                <Label>Thay ảnh</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => upload(event, selected.id)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Tỉ lệ</Label>
                <Choice
                  value={selected.media_aspect_ratio ?? "inherit"}
                  onChange={(value) =>
                    updateSlide(selected.id, {
                      media_aspect_ratio:
                        value === "inherit"
                          ? undefined
                          : (value as Slide["media_aspect_ratio"]),
                    })
                  }
                  options={[
                    { value: "inherit", label: "Mặc định" },
                    ...["16 / 9", "4 / 3", "1 / 1", "21 / 9"].map((value) => ({
                      value,
                      label: value.replace(" / ", ":"),
                    })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid content-start gap-1">
                  <Label>Liên kết tới</Label>
                  <Choice
                    value={linkType}
                    onChange={(value) =>
                      updateSlide(selected.id, {
                        link_url:
                          value === "collection"
                            ? "/collections/"
                            : value === "category"
                              ? "/categories/"
                              : value === "existing"
                                ? selected.link_url
                                : "",
                      })
                    }
                    options={[
                      { value: "none", label: "Không liên kết" },
                      { value: "collection", label: "Collection" },
                      { value: "category", label: "Category" },
                      ...(linkType === "existing"
                        ? [{ value: "existing", label: "Liên kết đã lưu" }]
                        : []),
                    ]}
                  />
                </div>
                {(linkType === "collection" || linkType === "category") && (
                  <div className="grid content-start gap-1">
                    <Label>
                      {linkType === "collection" ? "Collection" : "Category"}
                    </Label>
                    <Choice
                      value={
                        ["/collections/", "/categories/"].includes(
                          selected.link_url
                        )
                          ? ""
                          : selected.link_url
                      }
                      onChange={(value) =>
                        updateSlide(selected.id, { link_url: value })
                      }
                      options={destinations.map((item) => ({
                        value: item.href,
                        label: item.label.replace(
                          /^(Collection|Category): /,
                          ""
                        ),
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <Button
              type="submit"
              size="small"
              isLoading={save.isPending}
              disabled={uploading}
            >
              Lưu
            </Button>
          </div>
        </fieldset>
      </form>
    </Container>
  )
}
