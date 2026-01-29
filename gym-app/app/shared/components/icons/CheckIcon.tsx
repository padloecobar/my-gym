import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface CheckIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
}

export function CheckIcon({ size = 'md', className, ...props }: CheckIconProps) {
  const dimension = sizeMap[size];
  
  return (
    <svg
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5 13l4 4L19 7" stroke="currentColor" />
    </svg>
  );
}
