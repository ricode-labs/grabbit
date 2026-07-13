import { Download } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function AboutPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border bg-background/55 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(139,92,246,0.16),transparent_30%)]" />
      <header className="relative flex h-[84px] items-center border-b bg-background/35 px-6 backdrop-blur">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            About
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
            关于 Grabbit
          </h1>
        </div>
      </header>
      <div className="relative max-w-3xl p-6">
        <Card className="glass-panel border">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <Download />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Grabbit</h2>
                <p className="text-sm text-muted-foreground">
                  基于 Motrix 页面结构重做的下载管理器。
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              保留 Motrix
              的侧边栏、任务子导航、新建任务弹窗、任务列表和速度浮窗等大体结构，界面使用
              shadcn 组件实现。
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
