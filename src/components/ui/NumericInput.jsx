import React, { useState, useEffect, useCallback } from "react";

export const NumericInput = ({
  value,
  onChange = () => {},
  min,
  max,
  step = 0.01,
  prefix = "",
  suffix = "",
  placeholder = "0.00",
  hideSteppers = false
}) => {
  // ✅ wrap toStr in useCallback so it's memoized and stable
  const toStr = useCallback(
    (val) =>
      val !== undefined && val !== null && !Number.isNaN(val)
        ? Number(val).toFixed(step >= 1 ? 0 : step === 0.1 ? 1 : 2)
        : "",
    [step]
  );

  const [displayValue, setDisplayValue] = useState(toStr(value));

  useEffect(() => {
    setDisplayValue(toStr(value));
  }, [value, step, toStr]); // ✅ include toStr

  const clamp = useCallback(
    (num) => Math.min(Math.max(num, min ?? -Infinity), max ?? Infinity),
    [min, max]
  );

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setDisplayValue(newValue);
      const numericValue = parseFloat(newValue);
      if (!Number.isNaN(numericValue)) onChange(clamp(numericValue));
    },
    [onChange, clamp]
  );

  const handleBlur = useCallback(
    (e) => {
      const numericValue = parseFloat(e.target.value);
      if (!Number.isNaN(numericValue)) {
        const c = clamp(numericValue);
        setDisplayValue(Number(c).toFixed(step >= 1 ? 0 : step === 0.1 ? 1 : 2));
        onChange(c);
      } else {
        setDisplayValue(step >= 1 ? "0" : step === 0.1 ? "0.0" : "0.00");
        onChange(0);
      }
    },
    [onChange, clamp, step]
  );

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${prefix ? "pl-8" : ""} ${suffix ? "pr-12" : ""} ${
          hideSteppers ? "no-spinners" : ""
        }`}
      />
      {suffix && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
