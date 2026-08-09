import React from "react"
import carrotUrl from "../assets/carrot.png"

interface CarrotProgressProps {
  progress: number
  isActive?: boolean
  className?: string
}

export const CarrotProgress: React.FC<CarrotProgressProps> = ({
  progress,
  isActive = false,
  className = "",
}) => {
  const percentage = Math.min(Math.max(progress, 0), 100)

  return (
    <div
      className={`relative h-6 w-full ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percentage)}
    >
      <div className="absolute top-[10px] right-0 left-0 h-1 rounded-full bg-[#F0ECE9]" />
      <div className="absolute top-[10px] left-0 h-1 rounded-full bg-[#F7A94A] transition-[width] duration-700 ease-out" style={{ width: `${percentage}%` }} />
      <div className="absolute top-0 right-0 bottom-0 left-0">
        {percentage > 0 && (
          <img
            src={carrotUrl}
            alt=""
            className={`absolute top-0 h-6 w-6 object-contain ${
              isActive ? "animate-[carrot-bob_1.6s_ease-in-out_infinite]" : ""
            }`}
            style={{ left: `calc(${percentage}% - 12px)` }}
          />
        )}
      </div>
    </div>
  )
}
