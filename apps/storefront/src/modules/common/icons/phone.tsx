import React from "react"

import { IconProps } from "types/icon"

const Phone: React.FC<IconProps> = ({
  size = "20",
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
      <path
        d="M6.1 8.6c1 2 2.6 3.6 4.6 4.6l1.5-1.5c.2-.2.5-.3.8-.2 1 .3 2 .5 3 .5.5 0 .8.4.8.8v2.7c0 .5-.4.8-.8.8C8.5 16.3 3.7 11.5 3.7 5c0-.5.4-.8.8-.8H7.2c.5 0 .8.3.8.8 0 1 .2 2 .5 3 .1.3 0 .6-.2.8L6.1 8.6Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Phone
