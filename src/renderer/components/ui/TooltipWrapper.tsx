import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface TooltipWrapperProps {
  content: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  className = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - 8, // 8px above the element
        left: rect.left + rect.width / 2,
      })
    }
  }, [isVisible])

  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={className || "inline-block"}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            className="animate-in fade-in-0 zoom-in-95 pointer-events-none fixed z-[9999] rounded-[12px] border border-[#8B6A5D] bg-[#6B5448] px-3 py-2 text-xs font-medium whitespace-nowrap text-white shadow-lg duration-200"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -mt-px -translate-x-1/2 transform">
              <div className="border-4 border-transparent border-t-[#6B5448]"></div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
