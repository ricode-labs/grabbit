import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // 8px above the element
        left: rect.left + rect.width / 2,
      });
    }
  }, [isVisible]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={className || 'inline-block'}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-700 rounded-lg shadow-lg border border-zinc-700 dark:border-zinc-600 whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-700"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
