import type { ComponentProps } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

interface BookIconProps extends Omit<ComponentProps<'svg'>, 'children' | 'viewBox'> {
  size?: IconSize;
}

export function BookIcon({ size = 'md', className, ...props }: BookIconProps) {
  const dimension = sizeMap[size];
  
  return (
    <svg
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
      />
    </svg>
  );
}
