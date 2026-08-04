import React from "react"
import { Check } from "lucide-react"

interface CheckboxWrapperProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  accent?: "pink" | "red"
}

export const CheckboxWrapper: React.FC<CheckboxWrapperProps> = ({
  checked,
  onChange,
  label,
  className = "",
  accent = "pink",
}) => {
  const accentClasses = {
    pink: "border-[#FF7D90] bg-[#FF7D90]",
    red: "border-[#E85C61] bg-[#E85C61]",
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(!checked)
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        className={`relative inline-flex h-4 w-4 shrink-0 cursor-pointer rounded border transition-all ${
          checked
            ? accentClasses[accent]
            : "border-[#F0DED8] bg-white"
        } focus-visible:ring-2 focus-visible:ring-[#FFE6EC] focus-visible:ring-offset-0 focus-visible:outline-none`}
      >
        {checked && (
          <Check
            size={14}
            className="pointer-events-none absolute inset-0.5 text-white"
          />
        )}
      </div>
      {label && (
        <span
          className="cursor-pointer text-sm font-medium text-[#2D2522]"
          onClick={handleClick}
        >
          {label}
        </span>
      )}
    </div>
  )
}
