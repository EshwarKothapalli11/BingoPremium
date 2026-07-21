"use client";

import { memo } from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const Avatar = memo(function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-primary/20 shadow-sm", 
          sizes[size], 
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold tracking-wider",
        "bg-primary/10 text-primary border border-primary/20 shadow-sm",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
});
