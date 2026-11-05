import { cn } from '@/lib/utils'

export type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps {
  /** Ukuran mark/logo: kecil, sedang, besar. */
  size?: LogoSize
  /** Tampilkan tulisan WARJOK dan subjudul. */
  label?: boolean
  className?: string
}

const markSize: Record<LogoSize, string> = {
  sm: 'h-6 w-auto shrink-0',
  md: 'h-8 w-auto shrink-0',
  lg: 'h-10 w-auto shrink-0',
}

const textSize: Record<LogoSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function Logo({
  size = 'md',
  label = true,
  className,
}: LogoProps) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <img
        src="/Logo.png"
        alt="WARJOK"
        className={markSize[size]}
        loading="eager"
        decoding="async"
      />
      {label && (
        <div className="flex flex-col leading-none text-left">
          <span className={cn(textSize[size], 'font-semibold tracking-tight')}>
            WARJOK
          </span>
          <span className="text-[10px] leading-none text-muted-foreground">
            Enterprise POS
          </span>
        </div>
      )}
    </div>
  )
}
