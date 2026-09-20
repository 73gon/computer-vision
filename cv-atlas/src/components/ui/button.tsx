import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-sans text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 active:translate-y-px',
  {
    variants: {
      variant: {
        // Brand: primary fills are #292929 (light) / #ededed (dark) with an inset highlight.
        primary:
          'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:opacity-90 dark:shadow-[inset_0_1px_0_rgba(0,0,0,0.10)]',
        secondary:
          'bg-[var(--control-surface)] text-foreground border border-[var(--field-edge)]/60 hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        outline: 'border border-border bg-transparent hover:bg-accent',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-9 rounded-full p-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
