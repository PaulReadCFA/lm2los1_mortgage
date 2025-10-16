

// src/components/ui/Card.jsx
export const Card = ({ title, children, className = "" }) => (
  <section className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
    {title && (
      <header className="px-6 py-4 border-b border-gray-100">
        <h2 className={`text-xl font-serif text-[#06005A]`}>{title}</h2>
      </header>
    )}
    <div className="p-6">{children}</div>
  </section>
);
