import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

// -----------------------------------------------------------------------------
// Shared Styles
// -----------------------------------------------------------------------------

const baseInputStyles = `
  w-full
  bg-[hsl(var(--surface))]
  border border-[hsl(var(--border))]
  text-[hsl(var(--foreground))]
  placeholder:text-[hsl(var(--foreground-subtle))]
  rounded-[var(--radius-md)]
  transition-colors
  focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]
  disabled:cursor-not-allowed disabled:opacity-50
`.trim().replace(/\s+/g, " ");

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error = false, icon, ...props }, ref) => {
    const errorStyles = error
      ? "border-[hsl(var(--error))] focus:border-[hsl(var(--error))] focus:ring-[hsl(var(--error))]"
      : "";

    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-subtle))]">
            {icon}
          </div>
          <input
            ref={ref}
            className={`${baseInputStyles} ${errorStyles} h-10 px-3 pl-10 text-sm ${className}`}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`${baseInputStyles} ${errorStyles} h-10 px-3 text-sm ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// -----------------------------------------------------------------------------
// Textarea
// -----------------------------------------------------------------------------

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error = false, ...props }, ref) => {
    const errorStyles = error
      ? "border-[hsl(var(--error))] focus:border-[hsl(var(--error))] focus:ring-[hsl(var(--error))]"
      : "";

    return (
      <textarea
        ref={ref}
        className={`${baseInputStyles} ${errorStyles} min-h-[80px] px-3 py-2 text-sm resize-y ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

// -----------------------------------------------------------------------------
// Label
// -----------------------------------------------------------------------------

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5 ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-[hsl(var(--error))] ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

// -----------------------------------------------------------------------------
// FormField (composed)
// -----------------------------------------------------------------------------

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && (
        <p className="text-sm text-[hsl(var(--error))]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-[hsl(var(--foreground-subtle))]">{hint}</p>
      )}
    </div>
  );
}

export default Input;
