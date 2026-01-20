import { forwardRef, type HTMLAttributes } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type StackDirection = "vertical" | "horizontal";
type StackGap = "none" | "xs" | "sm" | "default" | "lg" | "xl";
type StackAlign = "start" | "center" | "end" | "stretch";
type StackJustify = "start" | "center" | "end" | "between" | "around";

interface StackProps extends HTMLAttributes<HTMLElement> {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  as?: "div" | "ul" | "ol" | "nav";
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const directionStyles: Record<StackDirection, string> = {
  vertical: "flex-col",
  horizontal: "flex-row",
};

const gapStyles: Record<StackGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  default: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const alignStyles: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Stack = forwardRef<HTMLElement, StackProps>(
  (
    {
      className = "",
      direction = "vertical",
      gap = "default",
      align = "stretch",
      justify = "start",
      wrap = false,
      as: Component = "div",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={`
          flex
          ${directionStyles[direction]}
          ${gapStyles[gap]}
          ${alignStyles[align]}
          ${justifyStyles[justify]}
          ${wrap ? "flex-wrap" : ""}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Stack.displayName = "Stack";

// Convenience exports
export const HStack = forwardRef<HTMLElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="horizontal" {...props} />
);

export const VStack = forwardRef<HTMLElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="vertical" {...props} />
);

HStack.displayName = "HStack";
VStack.displayName = "VStack";

export default Stack;
