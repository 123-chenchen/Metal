const MastercardBadge = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 38 24"
      width="38"
      height="24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="38" height="24" rx="3" fill="#fff" />
      <circle cx="15" cy="12" r="7" fill="#EB001B" />
      <circle
        cx="23"
        cy="12"
        r="7"
        fill="#F79E1B"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  )
}

export default MastercardBadge
