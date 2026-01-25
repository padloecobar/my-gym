import type { ButtonHTMLAttributes } from "react";

const sizeClasses = {
  sm: "min-h-[44px] px-3 text-xs",
  md: "min-h-[44px] px-4 text-sm",
  lg: "min-h-[48px] px-5 text-base",
};

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  size?: keyof typeof sizeClasses;
};

const Chip = ({
  selected = false,
  size = "md",
  className = "",
  ...props
}: ChipProps) => (
  <button
    type="button"
    className={`inline-flex min-w-[48px] items-center justify-center rounded-full border border-[var(--border)] leading-none ${
      sizeClasses[size]
    } ${
      selected
        ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow)]"
        : "bg-[color:var(--chip)] text-[color:var(--text)]"
    } transition ${className}`}
    {...props}
  />
);

export default Chip;
