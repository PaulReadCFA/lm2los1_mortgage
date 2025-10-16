// src/components/Layout.jsx
export default function ExplorerLayout({ header, sidebar, main, extras }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {header && <div className="mb-8">{header}</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-6 order-3 md:order-1">{sidebar}</div>
          <div className="md:col-span-3 space-y-6 order-1 md:order-2">
            {main}
            {extras}
          </div>
        </div>
      </div>
    </div>
  );
}
