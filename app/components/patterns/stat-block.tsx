// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface StatBlockProps {
  value: string | number;
  label: string;
  mono?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function StatBlock({
  value,
  label,
  mono = false,
  className = "",
}: StatBlockProps) {
  return (
    <div className={`text-center ${className}`}>
      <div
        className={`
          text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))]
          ${mono ? "font-mono tracking-tight" : ""}
        `.trim().replace(/\s+/g, " ")}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-[hsl(var(--foreground-muted))]">
        {label}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stat Grid (convenience wrapper)
// -----------------------------------------------------------------------------

interface StatGridProps {
  stats: Array<{ value: string | number; label: string }>;
  mono?: boolean;
  className?: string;
}

export function StatGrid({ stats, mono = false, className = "" }: StatGridProps) {
  return (
    <div
      className={`
        grid gap-8
        ${stats.length === 2 ? "grid-cols-2" : ""}
        ${stats.length === 3 ? "grid-cols-3" : ""}
        ${stats.length === 4 ? "grid-cols-2 md:grid-cols-4" : ""}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {stats.map((stat, index) => (
        <StatBlock
          key={index}
          value={stat.value}
          label={stat.label}
          mono={mono}
        />
      ))}
    </div>
  );
}

export default StatBlock;
