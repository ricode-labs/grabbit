import { Button } from "@/components/ui/button"

export function App() {
  return (
    <div className="p-6 flex min-h-svh">
      <div className="max-w-md min-w-0 gap-4 text-sm leading-loose flex flex-col">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
