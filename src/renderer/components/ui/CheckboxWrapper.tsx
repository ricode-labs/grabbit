import React from "react"
import { Check } from "lucide-react"

interface CheckboxWrapperProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  accent?: "indigo" | "red"
}

export const CheckboxWrapper: React.FC<CheckboxWrapperProps> = ({
  checked,
  onChange,
  label,
  className = "",
  accent = "indigo",
}) => {
  const accentClasses = {
    indigo: "border-indigo-500 bg-indigo-500",
    red: "border-red-500 bg-red-500",
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
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-700"
        } focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:ring-${accent}-500/20`}
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
          className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-100"
          onClick={handleClick}
        >
          {label}
        </span>
      )}
    </div>
  )
}
