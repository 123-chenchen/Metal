import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Select, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type LinkType = "none" | "collection" | "category"

type HeroBanner = {
  id: string
  position: number
  image_url: string
  image_file_id: string | null
  heading: string | null
  subheading: string | null
  kicker: string | null
  link_type: LinkType
  link_value: string | null
}

type FeaturedGridItem = {
  id: string
  position: number
  media_url: string
  media_file_id: string | null
  media_type: "image" | "video"
  link_type: "collection" | "category"
  link_value: string
  title: string | null
}

type PromoBar = {
  id: string
  text: string
  is_active: boolean
}

type HomeContentResponse = {
  hero_slides: HeroBanner[]
  grid_items: FeaturedGridItem[]
  promo_bar: PromoBar | null
}

type PickerOption = { value: string; label: string }

const HOME_CONTENT_QUERY_KEY = ["home-content"]

async function uploadMedia(file: File): Promise<{ id: string; url: string }> {
  const response = await sdk.admin.upload.create({ files: [file] })
  const uploaded = response.files[0]
  return { id: uploaded.id, url: uploaded.url }
}

function useHomeContent() {
  return useQuery({
    queryKey: HOME_CONTENT_QUERY_KEY,
    queryFn: () => sdk.client.fetch<HomeContentResponse>("/admin/home-content"),
  })
}

function useCollectionOptions() {
  const { data } = useQuery({
    queryKey: ["home-content", "collections"],
    queryFn: () =>
      sdk.admin.productCollection.list({ fields: "id,handle,title", limit: 1000 }),
  })

  return (data?.collections ?? []).map(
    (collection): PickerOption => ({
      value: collection.handle ?? "",
      label: collection.title ?? collection.handle ?? "",
    })
  )
}

function useCategoryOptions() {
  const { data } = useQuery({
    queryKey: ["home-content", "categories"],
    queryFn: () =>
      sdk.admin.productCategory.list({ fields: "id,handle,name", limit: 1000 }),
  })

  return (data?.product_categories ?? []).map(
    (category): PickerOption => ({
      value: category.handle ?? "",
      label: category.name ?? category.handle ?? "",
    })
  )
}

const LinkPicker = ({
  linkType,
  linkValue,
  onLinkTypeChange,
  onLinkValueChange,
  allowNone,
  collectionOptions,
  categoryOptions,
}: {
  linkType: LinkType
  linkValue: string
  onLinkTypeChange: (value: LinkType) => void
  onLinkValueChange: (value: string) => void
  allowNone: boolean
  collectionOptions: PickerOption[]
  categoryOptions: PickerOption[]
}) => {
  const options =
    linkType === "collection"
      ? collectionOptions
      : linkType === "category"
      ? categoryOptions
      : []

  return (
    <div className="flex gap-x-3">
      <div className="flex flex-col gap-y-1 w-1/2">
        <Label size="small">Liên kết tới</Label>
        <Select value={linkType} onValueChange={(value) => onLinkTypeChange(value as LinkType)}>
          <Select.Trigger>
            <Select.Value placeholder="Chọn loại liên kết" />
          </Select.Trigger>
          <Select.Content>
            {allowNone && <Select.Item value="none">Không liên kết</Select.Item>}
            <Select.Item value="collection">Collection</Select.Item>
            <Select.Item value="category">Category</Select.Item>
          </Select.Content>
        </Select>
      </div>
      {linkType !== "none" && (
        <div className="flex flex-col gap-y-1 w-1/2">
          <Label size="small">
            {linkType === "collection" ? "Collection" : "Category"}
          </Label>
          <Select value={linkValue} onValueChange={onLinkValueChange}>
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
        </div>
      )}
    </div>
  )
}

const MediaPreview = ({
  url,
  mediaType,
}: {
  url: string | null
  mediaType: "image" | "video"
}) => {
  if (!url) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-md bg-ui-bg-subtle">
        <Text size="small" className="text-ui-fg-muted">
          Chưa có media
        </Text>
      </div>
    )
  }

  if (mediaType === "video") {
    return (
      <video
        src={url}
        controls
        className="h-40 w-full rounded-md object-cover bg-black"
      />
    )
  }

  return <img src={url} alt="" className="h-40 w-full rounded-md object-cover" />
}

const HeroSlideForm = ({
  slide,
  index,
  collectionOptions,
  categoryOptions,
}: {
  slide?: HeroBanner
  index: number
  collectionOptions: PickerOption[]
  categoryOptions: PickerOption[]
}) => {
  const queryClient = useQueryClient()
  const isNew = !slide
  const [imageUrl, setImageUrl] = useState(slide?.image_url ?? "")
  const [imageFileId, setImageFileId] = useState(slide?.image_file_id ?? "")
  const [heading, setHeading] = useState(slide?.heading ?? "")
  const [subheading, setSubheading] = useState(slide?.subheading ?? "")
  const [kicker, setKicker] = useState(slide?.kicker ?? "")
  const [linkType, setLinkType] = useState<LinkType>(slide?.link_type ?? "none")
  const [linkValue, setLinkValue] = useState(slide?.link_value ?? "")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setImageUrl(slide?.image_url ?? "")
    setImageFileId(slide?.image_file_id ?? "")
    setHeading(slide?.heading ?? "")
    setSubheading(slide?.subheading ?? "")
    setKicker(slide?.kicker ?? "")
    setLinkType(slide?.link_type ?? "none")
    setLinkValue(slide?.link_value ?? "")
  }, [slide])

  const resetForNewSlide = () => {
    setImageUrl("")
    setImageFileId("")
    setHeading("")
    setSubheading("")
    setKicker("")
    setLinkType("none")
    setLinkValue("")
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(
        slide ? `/admin/home-content/hero/${slide.id}` : "/admin/home-content/hero",
        {
          method: "POST",
          body: {
            image_url: imageUrl,
            image_file_id: imageFileId,
            heading: heading || null,
            subheading: subheading || null,
            kicker: kicker || null,
            link_type: linkType,
            link_value: linkType === "none" ? null : linkValue,
          },
        }
      ),
    onSuccess: () => {
      toast.success(isNew ? "Đã thêm slide" : "Đã lưu slide")
      queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY })
      if (isNew) {
        resetForNewSlide()
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Lưu slide thất bại")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/home-content/hero/${slide?.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Đã xoá slide")
      queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Xoá slide thất bại")
    },
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadMedia(file)
      setImageUrl(uploaded.url)
      setImageFileId(uploaded.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải ảnh lên thất bại")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <Container className="flex flex-col gap-y-4">
      <Heading level="h3">{isNew ? "Thêm slide mới" : `Slide ${index + 1}`}</Heading>
      <MediaPreview url={imageUrl || null} mediaType="image" />
      <div className="flex flex-col gap-y-1">
        <Label size="small">Ảnh slide</Label>
        <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="small">Nhãn nhỏ (VD: Buy more, save more)</Label>
        <Input
          value={kicker}
          onChange={(e) => setKicker(e.target.value)}
          placeholder="Buy more, save more"
        />
      </div>
      <div className="flex gap-x-3">
        <div className="flex flex-col gap-y-1 w-1/2">
          <Label size="small">Tiêu đề</Label>
          <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
        </div>
        <div className="flex flex-col gap-y-1 w-1/2">
          <Label size="small">Mô tả phụ</Label>
          <Input value={subheading} onChange={(e) => setSubheading(e.target.value)} />
        </div>
      </div>
      <LinkPicker
        linkType={linkType}
        linkValue={linkValue}
        onLinkTypeChange={(value) => {
          setLinkType(value)
          setLinkValue("")
        }}
        onLinkValueChange={setLinkValue}
        allowNone
        collectionOptions={collectionOptions}
        categoryOptions={categoryOptions}
      />
      <div className="flex gap-x-2">
        <Button
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          disabled={!imageUrl || !imageFileId || uploading}
        >
          {isNew ? "Thêm slide" : "Lưu slide"}
        </Button>
        {slide && (
          <Button
            variant="secondary"
            onClick={() => deleteMutation.mutate()}
            isLoading={deleteMutation.isPending}
          >
            Xoá
          </Button>
        )}
      </div>
    </Container>
  )
}

const GridItemSection = ({
  position,
  item,
  collectionOptions,
  categoryOptions,
}: {
  position: number
  item: FeaturedGridItem | undefined
  collectionOptions: PickerOption[]
  categoryOptions: PickerOption[]
}) => {
  const queryClient = useQueryClient()
  const [mediaUrl, setMediaUrl] = useState(item?.media_url ?? "")
  const [mediaFileId, setMediaFileId] = useState(item?.media_file_id ?? "")
  const [mediaType, setMediaType] = useState<"image" | "video">(item?.media_type ?? "image")
  const [title, setTitle] = useState(item?.title ?? "")
  const [linkType, setLinkType] = useState<"collection" | "category">(
    item?.link_type ?? "collection"
  )
  const [linkValue, setLinkValue] = useState(item?.link_value ?? "")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setMediaUrl(item?.media_url ?? "")
    setMediaFileId(item?.media_file_id ?? "")
    setMediaType(item?.media_type ?? "image")
    setTitle(item?.title ?? "")
    setLinkType(item?.link_type ?? "collection")
    setLinkValue(item?.link_value ?? "")
  }, [item])

  const saveMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/home-content/grid-items/${position}`, {
        method: "POST",
        body: {
          media_url: mediaUrl,
          media_file_id: mediaFileId,
          media_type: mediaType,
          link_type: linkType,
          link_value: linkValue,
          title: title || null,
        },
      }),
    onSuccess: () => {
      toast.success(`Đã lưu ô ${position}`)
      queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : `Lưu ô ${position} thất bại`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/home-content/grid-items/${position}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success(`Đã xoá ô ${position}`)
      queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : `Xoá ô ${position} thất bại`)
    },
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadMedia(file)
      setMediaUrl(uploaded.url)
      setMediaFileId(uploaded.id)
      setMediaType(file.type.startsWith("video/") ? "video" : "image")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải media lên thất bại")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <Container className="flex flex-col gap-y-4">
      <Heading level="h3">Ô {position}</Heading>
      <MediaPreview url={mediaUrl || null} mediaType={mediaType} />
      <div className="flex flex-col gap-y-1">
        <Label size="small">Ảnh hoặc video</Label>
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="small">Tiêu đề hiển thị (tuỳ chọn)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <LinkPicker
        linkType={linkType}
        linkValue={linkValue}
        onLinkTypeChange={(value) => {
          setLinkType(value as "collection" | "category")
          setLinkValue("")
        }}
        onLinkValueChange={setLinkValue}
        allowNone={false}
        collectionOptions={collectionOptions}
        categoryOptions={categoryOptions}
      />
      <div className="flex gap-x-2">
        <Button
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          disabled={!mediaUrl || !mediaFileId || !linkValue || uploading}
        >
          Lưu ô {position}
        </Button>
        {item && (
          <Button
            variant="secondary"
            onClick={() => deleteMutation.mutate()}
            isLoading={deleteMutation.isPending}
          >
            Xoá
          </Button>
        )}
      </div>
    </Container>
  )
}

const PromoBarSection = ({ promoBar }: { promoBar: PromoBar | null }) => {
  const queryClient = useQueryClient()
  const [text, setText] = useState(promoBar?.text ?? "")
  const [isActive, setIsActive] = useState(promoBar?.is_active ?? true)

  useEffect(() => {
    setText(promoBar?.text ?? "")
    setIsActive(promoBar?.is_active ?? true)
  }, [promoBar])

  const saveMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/home-content/promo-bar", {
        method: "POST",
        body: { text, is_active: isActive },
      }),
    onSuccess: () => {
      toast.success("Đã lưu thanh khuyến mãi")
      queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Lưu thất bại")
    },
  })

  return (
    <Container className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">Thanh khuyến mãi</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Dòng chữ chạy ngang trên cùng mọi trang của storefront. Để trống hoặc tắt để hiển thị
          mặc định.
        </Text>
      </div>
      <div className="flex flex-col gap-y-1">
        <Label size="small">Tiêu đề</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Redefine Your Space — Buy 3+, Get 40% Off"
        />
      </div>
      <div className="flex items-center gap-x-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="promo-bar-active" />
        <Label size="small" htmlFor="promo-bar-active">
          Hiển thị trên storefront
        </Label>
      </div>
      <div>
        <Button
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          disabled={!text.trim()}
        >
          Lưu thanh khuyến mãi
        </Button>
      </div>
    </Container>
  )
}

const HomeContentPage = () => {
  const { data, isLoading } = useHomeContent()
  const collectionOptions = useCollectionOptions()
  const categoryOptions = useCategoryOptions()

  if (isLoading) {
    return (
      <Container>
        <Text>Đang tải...</Text>
      </Container>
    )
  }

  const gridItemByPosition = new Map(
    (data?.grid_items ?? []).map((item) => [item.position, item])
  )

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-1">
        <Heading level="h1">Nội dung trang chủ</Heading>
        <Text className="text-ui-fg-subtle">
          Quản lý hero banner và 3 ô nổi bật hiển thị trên trang chủ storefront.
        </Text>
      </div>
      <PromoBarSection promoBar={data?.promo_bar ?? null} />
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">Hero banner (slideshow)</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Thêm nhiều ảnh để hero tự động chuyển slide trên trang chủ. Mỗi slide có tiêu đề,
          mô tả, nhãn nhỏ và liên kết riêng.
        </Text>
      </div>
      <div className="flex flex-col gap-y-4">
        {(data?.hero_slides ?? []).map((slide, index) => (
          <HeroSlideForm
            key={slide.id}
            slide={slide}
            index={index}
            collectionOptions={collectionOptions}
            categoryOptions={categoryOptions}
          />
        ))}
        <HeroSlideForm
          index={(data?.hero_slides ?? []).length}
          collectionOptions={collectionOptions}
          categoryOptions={categoryOptions}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 medium:grid-cols-3">
        {[1, 2, 3].map((position) => (
          <GridItemSection
            key={position}
            position={position}
            item={gridItemByPosition.get(position)}
            collectionOptions={collectionOptions}
            categoryOptions={categoryOptions}
          />
        ))}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Nội dung trang chủ",
  icon: Photo,
})

export default HomeContentPage
