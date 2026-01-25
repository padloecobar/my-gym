import type { ButtonHTMLAttributes } from "react";

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
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
    className={`inline-flex min-w-[48px] items-center justify-center rounded-full border border-transparent ${
      sizeClasses[size]
    } ${
      selected
        ? "bg-[color:var(--accent)] text-black"
        : "bg-[color:var(--chip)] text-[color:var(--text)]"
    } transition ${className}`}
    {...props}
  />
);

export default Chip;
