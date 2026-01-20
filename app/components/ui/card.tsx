import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type CardVariant = "default" | "elevated" | "bordered" | "ghost";
type CardPadding = "none" | "sm" | "default" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  as?: "div" | "article" | "section";
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
}
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const baseStyles = "rounded-[var(--radius-lg)] transition-colors";

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[hsl(var(--surface))]
    border border-[hsl(var(--border))]
  `.trim().replace(/\s+/g, " "),
  elevated: `
    bg-[hsl(var(--surface))]
    shadow-[var(--shadow-md)]
  `.trim().replace(/\s+/g, " "),
  bordered: `
    bg-transparent
    border-2 border-[hsl(var(--border))]
  `.trim().replace(/\s+/g, " "),
  ghost: `
    bg-transparent
  `.trim().replace(/\s+/g, " "),
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  default: "p-6",
  lg: "p-8",
};

const interactiveStyles = `
  cursor-pointer
  hover:bg-[hsl(var(--surface-hover))]
  hover:border-[hsl(var(--border-hover))]
`.trim().replace(/\s+/g, " ");

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      padding = "default",
      interactive = false,
      as: Component = "div",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${interactive ? interactiveStyles : ""}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col gap-1.5 ${className}`}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", as: Component = "h3", ...props }, ref) => (
    <Component
      ref={ref}
      className={`text-lg font-semibold text-[hsl(var(--foreground))] leading-tight ${className}`}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-[hsl(var(--foreground-muted))] ${className}`}
      {...props}
    />
  )
);

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
);

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center gap-2 pt-4 ${className}`}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

export default Card;
