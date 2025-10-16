

// src/components/ui/FormField.jsx
import React from "react";
import { HelpTooltip } from "./HelpTooltip";

export const FormField = ({ id, label, children, error, helpText, required = false }) => {
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = errorId ? errorId : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className={`block font-sans text-sm font-medium text-gray-700 flex items-center ${
          required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
        }`}
      >
        {label}
        {helpText && <HelpTooltip id={id} text={helpText} />}
      </label>

      {React.cloneElement(children, {
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? "true" : "false"
      })}

      {error && (
        <p id={errorId} className="font-sans text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
