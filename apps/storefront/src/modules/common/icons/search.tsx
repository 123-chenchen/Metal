import React from "react"

import { IconProps } from "types/icon"

const Search: React.FC<IconProps> = ({
  size = "16",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <circle cx="8.5" cy="8.5" r="5.5" stroke={color} strokeWidth="1.6" />
      <line
        x1="16.2"
        y1="16.2"
        x2="12.6"
        y2="12.6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Search
