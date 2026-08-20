import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"

type SelectedDesignItem = {
  id: string
  title: string | null
  quantity: number
  designName: string
  imageUrl: string | null
}

const OrderSelectedDesignsWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const items = getSelectedDesignItems(order)

  if (!items.length) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Selected designs</Heading>
      </div>
      <div className="flex flex-col gap-y-4 px-6 py-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-x-4">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.designName}
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-ui-bg-subtle" />
            )}
            <div className="flex flex-col">
              <Text size="small" weight="plus">
                {item.designName}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {item.title} &middot; Qty {item.quantity}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

function getSelectedDesignItems(order: AdminOrder): SelectedDesignItem[] {
  return (order.items ?? [])
    .filter((item) => {
      const value = item.metadata?.selected_design_name
      return typeof value === "string" && value.length > 0
    })
    .map((item) => {
      const imageUrl = item.metadata?.selected_image_url

      return {
        id: item.id,
        title: item.product_title ?? item.title ?? null,
        quantity: item.quantity,
        designName: item.metadata?.selected_design_name as string,
        imageUrl: typeof imageUrl === "string" && imageUrl ? imageUrl : null,
      }
    })
}

export const config = defineWidgetConfig({
  zone: "order.details",
})

export default OrderSelectedDesignsWidget
