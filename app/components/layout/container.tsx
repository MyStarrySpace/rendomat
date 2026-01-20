import { forwardRef, type HTMLAttributes } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ContainerSize = "sm" | "default" | "lg" | "xl" | "full";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  as?: "div" | "main" | "section" | "article";
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const sizeStyles: Record<ContainerSize, string> = {
  sm: "max-w-2xl",      // 672px
  default: "max-w-4xl", // 896px
  lg: "max-w-6xl",      // 1152px
  xl: "max-w-7xl",      // 1280px
  full: "max-w-full",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className = "",
      size = "lg",
      as: Component = "div",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = "Container";

export default Container;
