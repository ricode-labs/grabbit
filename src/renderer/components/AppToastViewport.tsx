import { Toast } from "@base-ui/react/toast"
import { CheckCircle2, Info, TriangleAlert } from "lucide-react"

const getToastIcon = (type?: string) => {
  if (type === "success") return CheckCircle2
  if (type === "error") return TriangleAlert
  return Info
}

const getToastTone = (type?: string) => {
  if (type === "success") return "bg-[#EAF8ED] text-[#67A94D]"
  if (type === "error") return "bg-[#FFE8EA] text-[#E85C61]"
  return "bg-[#EAF3FF] text-[#4C8ED6]"
}

export function AppToastViewport() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2 outline-none">
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.type)

          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className="rounded-[12px] border border-[#F2DED6] bg-[#FFFBF8]/98 text-[#2D2522] shadow-[0_14px_34px_rgba(107,84,72,0.18)] transition-all duration-200 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-limited:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
            >
              <Toast.Content className="flex items-start gap-3 px-3 py-2.5">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${getToastTone(toast.type)}`}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <Toast.Title className="text-[13px] leading-5 font-semibold text-[#2D2522]" />
                  <Toast.Description className="mt-0.5 text-[12px] leading-5 text-[#7A6257] empty:hidden" />
                </div>
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
