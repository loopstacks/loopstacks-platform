interface ProgressBarProps {
  label: string
  value: number
  className?: string
}

export function ProgressBar({ label, value, className = '' }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="progress-bar h-2 rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}