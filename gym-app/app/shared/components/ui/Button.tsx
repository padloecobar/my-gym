'use client';

import type { ComponentProps } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Shared Button component with consistent styling and accessibility.
 * Uses CSS custom properties for theming and maintains 48px tap target minimum.
 * 
 * @param variant - Visual style (primary, secondary, ghost, danger)
 * @param size - Button size (sm: 48px, md: 48px, lg: 56px)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  
  return (
    <button
      type={type}
      className={`button ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    />
  );
}
