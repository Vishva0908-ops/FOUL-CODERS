"use client";

import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const variantStyles = {
    primary: "bg-accent-blue text-white hover:bg-blue-600 active:bg-blue-700",
    secondary: "bg-dark-surface text-white hover:bg-dark-border active:bg-gray-600",
    outline: "border border-dark-border bg-transparent text-white hover:bg-dark-surface active:bg-dark-border",
    ghost: "bg-transparent text-white hover:bg-dark-surface active:bg-dark-border",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}
