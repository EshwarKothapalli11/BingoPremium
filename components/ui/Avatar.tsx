"use client";

import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  const sizes = {
    xs: "w-5 h-5 text-[8px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-white/60", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold",
        "bg-gradient-to-br from-primary to-accent text-white ring-2 ring-white/60",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
