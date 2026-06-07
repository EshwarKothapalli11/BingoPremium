import { cn } from "@/lib/utils";

interface BingoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function BingoButton({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: BingoButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg shadow-primary/25",
    secondary:
      "glass-card hover:bg-white/80 text-text-primary",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "bg-transparent hover:bg-white/40 text-text-muted",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-6 py-3 text-sm font-medium rounded-2xl",
    lg: "px-8 py-4 text-base font-semibold rounded-2xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
