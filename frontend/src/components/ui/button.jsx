import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const buttonStyles = cva('button inline-flex items-center justify-center gap-2', {
  variants: {
    variant: {
      default: 'button-primary',
      outline: 'button-outline',
      ghost: 'button-ghost',
      danger: 'button-danger'
    }
  },
  defaultVariants: { variant: 'default' }
})

export function Button({ asChild, variant, className, ...props }) {
  const Component = asChild ? Slot : 'button'
  return <Component className={twMerge(clsx(buttonStyles({ variant }), className))} {...props} />
}
