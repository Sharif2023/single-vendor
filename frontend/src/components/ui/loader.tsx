import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  variant?: "primary" | "white" | "lime";
}

export function Loader({
  size = "lg",
  color,
  variant = "primary",
  className,
  style,
  ...props
}: LoaderProps) {
  const sizeMultiplier = {
    xs: "0.35px",
    sm: "0.5px",
    md: "0.75px",
    lg: "1px",
    xl: "1.25px",
  }[size];

  const variantColor = {
    primary: "var(--color-brand-blue, #003be2)",
    white: "#ffffff",
    lime: "var(--color-brand-lime, #d6fd04)",
  }[variant];

  const customStyle: React.CSSProperties = {
    "--size": sizeMultiplier,
    "--color-1": color || variantColor,
    ...style,
  } as React.CSSProperties;

  return (
    <span
      className={cn("loader", className)}
      style={customStyle}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

export function LoadingSpinner({
  message,
  size = "lg",
  className,
}: {
  message?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3.5", className)}>
      <span className="loader" />
      {message && (
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
}
