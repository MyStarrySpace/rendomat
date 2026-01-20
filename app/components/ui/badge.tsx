import { forwardRef, type HTMLAttributes } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "error" | "outline";
type BadgeSize = "sm" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  mono?: boolean;
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const baseStyles = `
  inline-flex items-center font-medium
  rounded-full
  transition-colors
`.trim().replace(/\s+/g, " ");

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]
  `.trim().replace(/\s+/g, " "),
  secondary: `
    bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))]
  `.trim().replace(/\s+/g, " "),
  success: `
    bg-[hsl(var(--success-muted))] text-[hsl(var(--success))]
  `.trim().replace(/\s+/g, " "),
  warning: `
    bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning))]
  `.trim().replace(/\s+/g, " "),
  error: `
    bg-[hsl(var(--error-muted))] text-[hsl(var(--error))]
  `.trim().replace(/\s+/g, " "),
  outline: `
    bg-transparent border border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))]
  `.trim().replace(/\s+/g, " "),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  default: "px-2.5 py-0.5 text-sm",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      mono = false,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${mono ? "font-mono" : ""}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
