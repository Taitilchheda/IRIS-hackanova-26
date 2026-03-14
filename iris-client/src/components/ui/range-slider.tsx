import * as React from "react"
import { cn } from "@/utils"

export interface RangeSliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onValueChange?: (value: number) => void
  displayValue?: string
}

const RangeSlider = React.forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ className, value, onValueChange, displayValue, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(Number(e.target.value))
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text2 tracking-wider">{props.title}</span>
          <span className="text-xs text-teal font-medium">
            {displayValue || value}
          </span>
        </div>
        <input
          type="range"
          className={cn(
            "w-full h-2 bg-border2 rounded-lg appearance-none cursor-pointer slider",
            "focus:outline-none focus:ring-2 focus:ring-teal",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)
RangeSlider.displayName = "RangeSlider"

export { RangeSlider }
