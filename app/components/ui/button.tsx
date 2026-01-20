import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  asChild?: boolean;
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]
  disabled:pointer-events-none disabled:opacity-50
`.trim().replace(/\s+/g, " ");

const variantStyles: Record<ButtonVariant, string> = {
  default: `
    bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
    hover:bg-[hsl(var(--accent-hover))]
  `.trim().replace(/\s+/g, " "),
  secondary: `
    bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]
    border border-[hsl(var(--border))]
    hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--border-hover))]
  `.trim().replace(/\s+/g, " "),
  ghost: `
    text-[hsl(var(--foreground-muted))]
    hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]
  `.trim().replace(/\s+/g, " "),
  destructive: `
    bg-[hsl(var(--error))] text-white
    hover:bg-[hsl(var(--error))]/90
  `.trim().replace(/\s+/g, " "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      loading = false,
      icon,
      iconPosition = "left",
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Spinner />
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

// -----------------------------------------------------------------------------
// Spinner (internal)
// -----------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
