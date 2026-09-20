import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * The brand's quiet, layered container: 20px corners, hairline border,
 * a whisper of a gradient so it reads as a surface rather than a box.
 */
export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[20px] border border-hairline bg-card',
        'bg-gradient-to-b from-white/[0.02] to-transparent dark:from-white/[0.03]',
        className,
      )}
      {...props}
    />
  ),
)
Panel.displayName = 'Panel'

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3 sm:px-6 sm:pt-6', className)} {...props} />
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('eyebrow', className)} {...props} />
}
