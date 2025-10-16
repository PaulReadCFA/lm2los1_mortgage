// src/components/ui/HelpTooltip.jsx
import React, { useState } from "react";

export const HelpTooltip = ({ id, text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-block ml-2">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-xs font-bold 
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-describedby={visible ? `${id}-help` : undefined}
        aria-label="More information"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        ?
      </button>
      {visible && (
        <span
          id={`${id}-help`}
          role="tooltip"
          className="absolute left-6 top-0 z-10 w-56 p-2 text-xs text-white bg-gray-800 rounded shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
};
