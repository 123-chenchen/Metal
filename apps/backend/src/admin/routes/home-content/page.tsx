import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import HeroEditor from "./hero-editor"
import type { HomeHeroConfig } from "../../../lib/home-hero"

type PromoBar = { id: string; text: string; is_active: boolean }
type HomeContentResponse = {
  hero_config: HomeHeroConfig
  promo_bar: PromoBar | null
}
const HOME_CONTENT_QUERY_KEY = ["home-content"]

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
          Dòng chữ chạy ngang trên cùng mọi trang của storefront. Để trống hoặc
          tắt để hiển thị mặc định.
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
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          id="promo-bar-active"
        />
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
  const { data, isLoading, error } = useQuery({
    queryKey: HOME_CONTENT_QUERY_KEY,
    queryFn: () => sdk.client.fetch<HomeContentResponse>("/admin/home-content"),
  })
  if (isLoading)
    return (
      <Container>
        <Text>Đang tải...</Text>
      </Container>
    )
  if (error || !data)
    return (
      <Container>
        <Text>Không tải được nội dung trang chủ. Vui lòng tải lại trang.</Text>
      </Container>
    )
  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h1">Nội dung trang chủ</Heading>
      <PromoBarSection promoBar={data.promo_bar} />
      <HeroEditor initialConfig={data.hero_config} />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Nội dung trang chủ",
  icon: Photo,
})
export default HomeContentPage
