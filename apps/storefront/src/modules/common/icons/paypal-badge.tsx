const PayPalBadge = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 38 24"
      width="38"
      height="24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="38" height="24" rx="3" fill="#fff" />
      <text
        x="19"
        y="15.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize="9"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009cde">Pal</tspan>
      </text>
    </svg>
  )
}

export default PayPalBadge
