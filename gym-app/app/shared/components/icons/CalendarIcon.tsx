import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface CalendarIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
}

export function CalendarIcon({ size = 'md', className, ...props }: CalendarIconProps) {
  const dimension = sizeMap[size];
  
  return (
    <svg
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" />
    </svg>
  );
}
