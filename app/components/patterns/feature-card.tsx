import { type ReactNode } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`
        group
        p-6
        bg-[hsl(var(--surface))]
        border border-[hsl(var(--border))]
        rounded-[var(--radius-lg)]
        transition-colors
        hover:border-[hsl(var(--border-hover))]
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {/* Icon */}
      <div className="mb-4 text-[hsl(var(--foreground-muted))] group-hover:text-[hsl(var(--foreground))] transition-colors">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))] mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
