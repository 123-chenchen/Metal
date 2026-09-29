"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CustomLineItemThumbnail from "@modules/common/components/custom-line-item-thumbnail"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQuantity = 10
  const customImageUrl = getCustomImageUrl(item)
  const selectedImageUrl = getSelectedImageUrl(item)
  const selectedDesignName = getSelectedDesignName(item)
  const itemHref = customImageUrl
    ? getCustomPageHref(item)
    : `/products/${item.product_handle}`

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={itemHref}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          {customImageUrl ? (
            <CustomLineItemThumbnail item={item} />
          ) : (
            <Thumbnail
              thumbnail={selectedImageUrl ?? item.thumbnail}
              images={item.variant?.product?.images}
              size="square"
            />
          )}
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        {selectedDesignName && (
          <Text
            className="txt-small text-ui-fg-subtle"
            data-testid="product-design-name"
          >
            Design: {selectedDesignName}
          </Text>
        )}
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div
              role="group"
              aria-label="Quantity"
              aria-busy={updating}
              className="flex h-10 shrink-0 items-center rounded-md border border-ui-border-base"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={updating || item.quantity <= 1}
                onClick={() => changeQuantity(item.quantity - 1)}
                className="flex h-full w-9 items-center justify-center rounded-l-md text-lg hover:bg-ui-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-ui-border-interactive disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="product-decrease-quantity"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="min-w-8 text-center text-sm tabular-nums"
                data-testid="product-quantity"
              >
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={updating || item.quantity >= maxQuantity}
                onClick={() => changeQuantity(item.quantity + 1)}
                className="flex h-full w-9 items-center justify-center rounded-r-md text-lg hover:bg-ui-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-ui-border-interactive disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="product-increase-quantity"
              >
                +
              </button>
            </div>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

function getCustomImageUrl(item: HttpTypes.StoreCartLineItem) {
  const value = item.metadata?.custom_image_url

  return typeof value === "string" && value ? value : null
}

function getCustomPageHref(item: HttpTypes.StoreCartLineItem) {
  const source = item.metadata?.custom_source

  if (source === "custom_standard") {
    return "/custom/standard"
  }

  if (source === "custom_wall") {
    return "/custom/wall"
  }

  return "/custom/hexagon"
}

function getSelectedImageUrl(item: HttpTypes.StoreCartLineItem) {
  const value = item.metadata?.selected_image_url

  return typeof value === "string" && value ? value : null
}

function getSelectedDesignName(item: HttpTypes.StoreCartLineItem) {
  const value = item.metadata?.selected_design_name

  return typeof value === "string" && value ? value : null
}

export default Item
