import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface ClockIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
}

export function ClockIcon({ size = 'md', className, ...props }: ClockIconProps) {
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M12 7v5l3 3" stroke="currentColor" />
    </svg>
  );
}
