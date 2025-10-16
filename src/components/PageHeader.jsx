// src/components/PageHeader.jsx
import { TYPOGRAPHY, COLORS } from "../theme";

export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 pb-4 border-b border-gray-200" style={{ borderColor: COLORS.cfa.light }}>
      <h1 className={`text-3xl md:text-4xl font-serif mb-2`} style={{ color: COLORS.cfa.dark }}>
        {title}
      </h1>
      {subtitle && (
        <p className={`text-base md:text-lg ${TYPOGRAPHY.body}`} style={{ color: COLORS.chart.text }}>
          {subtitle}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
