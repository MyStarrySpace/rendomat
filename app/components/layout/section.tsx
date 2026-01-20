import { forwardRef, type HTMLAttributes } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type SectionSpacing = "none" | "sm" | "default" | "lg" | "xl";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing;
  as?: "section" | "div" | "article";
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const spacingStyles: Record<SectionSpacing, string> = {
  none: "",
  sm: "py-8 md:py-12",
  default: "py-12 md:py-16",
  lg: "py-16 md:py-24",
  xl: "py-24 md:py-32",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className = "",
      spacing = "default",
      as: Component = "section",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={`${spacingStyles[spacing]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = "Section";

export default Section;
