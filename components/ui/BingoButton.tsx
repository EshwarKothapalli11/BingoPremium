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
      "bg-gradient-to-r from-primary to-accent text-white hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:-translate-y-[2px] shadow-lg shadow-primary/25",
    secondary:
      "bg-white border border-primary/20 text-slate-800 hover:bg-slate-50 hover:border-primary/40 shadow-sm",
    danger: "bg-danger text-white hover:opacity-90 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
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
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
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
