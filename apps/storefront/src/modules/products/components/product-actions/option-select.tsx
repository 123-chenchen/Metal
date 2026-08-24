import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-base font-medium text-ui-fg-subtle">
        Select {title}
      </span>
      <div className="flex flex-wrap gap-3" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          const isActive = v === current

          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-w-20 h-14 px-4 rounded-base border font-bold text-lg transition-all duration-150",
                isActive
                  ? "bg-ui-button-inverted border-ui-button-inverted text-ui-fg-on-inverted shadow-elevation-card-hover"
                  : "bg-ui-bg-subtle border-ui-border-base text-ui-fg-base hover:border-ui-border-interactive"
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
