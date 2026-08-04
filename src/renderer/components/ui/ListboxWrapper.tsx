import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select"

interface ListboxWrapperProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  label?: string
  className?: string
}

export const ListboxWrapper: React.FC<ListboxWrapperProps> = ({
  value,
  onChange,
  options,
  label,
  className = "w-auto",
}) => {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => nextValue && onChange(nextValue)}
    >
      <div className="relative">
        {label && (
          <SelectLabel className="mb-1.5 block px-0 py-0 text-sm font-medium text-[#6B5448]">
            {label}
          </SelectLabel>
        )}
        <SelectTrigger
          className={`${className} border-[#F0DED8] bg-white py-2 pr-2 pl-3 text-xs text-[#2D2522] focus-visible:border-[#FFC3CF] focus-visible:ring-[#FFE6EC]`}
        >
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent
          className={`${className} border-[#F0DED8] bg-[#FFFBF8] text-xs text-[#2D2522]`}
          align="start"
          alignItemWithTrigger={false}
        >
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="py-2 pr-8 pl-3 text-xs focus:bg-[#FFF1F4] focus:text-[#FF5C78]"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </div>
    </Select>
  )
}
