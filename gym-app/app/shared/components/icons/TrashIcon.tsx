import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface TrashIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
}

export function TrashIcon({ size = 'md', className, ...props }: TrashIconProps) {
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
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z" stroke="currentColor" />
      <path d="M6 7l1 13h10l1-13" stroke="currentColor" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" />
    </svg>
  );
}
