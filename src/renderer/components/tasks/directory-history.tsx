import { Button } from "@/components/ui/button"

export function DirectoryHistory({
  directories,
  currentDirectory,
  onChoose,
}: {
  directories: string[]
  currentDirectory: string
  onChoose: (directory: string) => void
}) {
  const options = directories.filter(
    (directory) => directory && directory !== currentDirectory
  )

  if (options.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((directory) => (
        <Button
          key={directory}
          type="button"
          variant="secondary"
          size="sm"
          className="max-w-full justify-start truncate text-xs"
          title={directory}
          onClick={() => onChoose(directory)}
        >
          {directory}
        </Button>
      ))}
    </div>
  )
}
