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
          <SelectLabel className="mb-1.5 block px-0 py-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </SelectLabel>
        )}
        <SelectTrigger
          className={`${className} border-zinc-300 bg-white py-2 pr-2 pl-3 text-xs text-zinc-900 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100`}
        >
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent
          className={`${className} border-zinc-300 bg-white text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100`}
          align="start"
          alignItemWithTrigger={false}
        >
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="py-2 pr-8 pl-3 text-xs focus:bg-indigo-100 focus:text-indigo-900 dark:focus:bg-indigo-900/30 dark:focus:text-indigo-100"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </div>
    </Select>
  )
}
