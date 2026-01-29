import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface ChevronIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
  direction?: 'left' | 'right' | 'up' | 'down';
}

const rotationMap = {
  left: 0,
  up: 90,
  right: 180,
  down: 270,
};

export function ChevronIcon({ size = 'md', direction = 'left', className, style, ...props }: ChevronIconProps) {
  const dimension = sizeMap[size];
  const rotation = rotationMap[direction];
  
  return (
    <svg
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ ...style, transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" stroke="currentColor" />
    </svg>
  );
}
