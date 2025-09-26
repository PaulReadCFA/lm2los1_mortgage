import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const HelpTooltip = ({ id, text }) => {
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


// =========================
// CFA Institute brand tokens
// =========================
const COLORS = {
  cfa: { primary: "#4476FF", dark: "#06005A", light: "#E8F0FF" },
  semantic: { positive: "#10B981", negative: "#EF4444", neutral: "#6B7280" },
  chart: { grid: "#E5E7EB", text: "#374151", background: "#FFFFFF" }
};

const TYPOGRAPHY = {
  heading: "font-serif text-slate-800",
  body: "font-sans text-gray-700",
  caption: "font-sans text-sm text-gray-600",
  label: "font-sans text-sm font-medium text-gray-700"
};

// Default values for easy reset
const DEFAULT_INPUTS = { principal: 800000, rate: 0.06, years: 30 };

// =========================
// Reusable UI
// =========================
const Card = ({ title, children, className = "" }) => (
  <section className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
    {title && (
      <header className="px-6 py-4 border-b border-gray-100">
        <h2 className={`text-xl ${TYPOGRAPHY.heading}`}>{title}</h2>
      </header>
    )}
    <div className="p-6">{children}</div>
  </section>
);

const FormField = ({ id, label, children, error, helpText, required = false }) => {
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = errorId ? errorId : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className={`block ${TYPOGRAPHY.label} flex items-center ${
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
        <p id={errorId} className={`${TYPOGRAPHY.caption} text-red-600`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};


// Simple numeric input - let browser handle spinners naturally
const NumericInput = ({
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
  const toStr = (val) =>
    val !== undefined && val !== null && !Number.isNaN(val)
      ? Number(val).toFixed(step >= 1 ? 0 : 2)
      : "";

  const [displayValue, setDisplayValue] = useState(toStr(value));

  useEffect(() => {
    setDisplayValue(toStr(value));
  }, [value, step]);

  const clamp = useCallback(
    (num) => Math.min(Math.max(num, min ?? -Infinity), max ?? Infinity),
    [min, max]
  );

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setDisplayValue(newValue);
      const numericValue = parseFloat(newValue);
      if (!Number.isNaN(numericValue)) {
        onChange(clamp(numericValue));
      }
    },
    [onChange, clamp]
  );

  const handleBlur = useCallback(
    (e) => {
      const numericValue = parseFloat(e.target.value);
      if (!Number.isNaN(numericValue)) {
        const c = clamp(numericValue);
        setDisplayValue(Number(c).toFixed(step >= 1 ? 0 : 2));
        onChange(c);
      } else {
        setDisplayValue(step >= 1 ? "0" : "0.00");
        onChange(0);
      }
    },
    [onChange, clamp, step]
  );

  // Use inline styles to control spinner visibility
  const inputStyles = {};

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{prefix}</span>
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
        style={inputStyles}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${prefix ? "pl-8" : ""} ${suffix ? "pr-12" : ""} ${hideSteppers ? "no-spinners" : ""}`}
      />
      {suffix && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{suffix}</span>
      )}
    </div>
  );
};

// =========================
// Core logic
// =========================
const validateMortgageInputs = (inputs) => {
  const errors = {};
  if (!inputs.principal || inputs.principal <= 0) {
    errors.principal = "Loan amount must be greater than $0";
  } else if (inputs.principal > 10000000) {
    errors.principal = "Loan amount cannot exceed $10,000,000";
  }
  if (inputs.rate < 0) {
    errors.rate = "Interest rate cannot be negative";
  } else if (inputs.rate > 0.5) {
    errors.rate = "Interest rate cannot exceed 50%";
  }
  if (!inputs.years || inputs.years <= 0) {
    errors.years = "Term must be greater than 0 years";
  } else if (inputs.years > 50) {
    errors.years = "Term cannot exceed 50 years";
  }
  return errors;
};

const buildMortgageSchedule = ({ principal = 800000, rate = 0.06, years = 30 }) => {
  try {
    if (principal <= 0 || years <= 0) throw new Error("Invalid loan parameters");

    const monthlyRate = rate / 12;
    const numPayments = years * 12;
    let monthlyPayment;

    if (!rate || monthlyRate === 0) {
      monthlyPayment = principal / numPayments;
    } else {
      monthlyPayment =
        (monthlyRate * principal * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    let remainingBalance = principal;
    const schedule = [];

    for (let month = 1; month <= numPayments; month++) {
      let interestPayment, principalPayment;

      if (!rate || monthlyRate === 0) {
        interestPayment = 0;
        principalPayment = monthlyPayment;
        if (month === numPayments) principalPayment = remainingBalance;
      } else {
        interestPayment = remainingBalance * monthlyRate;
        principalPayment = monthlyPayment - interestPayment;
        if (month === numPayments) {
          principalPayment = remainingBalance;
          interestPayment = monthlyPayment - principalPayment;
        }
      }

      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        interestPayment: Math.round(interestPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        totalPayment: Math.round((interestPayment + principalPayment) * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        yearLabel: Math.ceil(month / 12).toString()
      });
    }

    return {
      schedule,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: schedule.reduce((s, p) => s + p.interestPayment, 0),
      totalPaid: schedule.reduce((s, p) => s + p.totalPayment, 0)
    };
  } catch (error) {
    return { schedule: [], monthlyPayment: 0, totalInterest: 0, totalPaid: 0, error: error.message };
  }
};

const CustomTooltip = ({ active, payload, isMonthly }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className={`${TYPOGRAPHY.body} font-medium mb-2`}>
          {isMonthly ? `Month ${data?.month}` : `Year ${data?.year}`}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className={TYPOGRAPHY.caption}>
            {`${entry.name}: $${Number(entry.value).toFixed(2)}`}
          </p>
        ))}
        {data && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className={`${TYPOGRAPHY.caption} text-gray-600`}>
              Remaining Balance: ${Number(data.remainingBalance).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// =========================
// Main Component
// =========================
export default function EnhancedMortgageCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [view, setView] = useState("monthly");
  const [monthRange, setMonthRange] = useState({ start: 1, end: 120 });

  const validationErrors = useMemo(() => validateMortgageInputs(inputs), [inputs]);
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Force spinners to be visible by injecting CSS into document head
  useEffect(() => {
    const styleId = 'force-number-spinners';
    if (document.getElementById(styleId)) return; // Don't add twice
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Force number input spinners to be visible - overrides framework CSS */
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: auto !important;
        opacity: 1 !important;
        height: auto !important;
        margin: 0 !important;
      }
      
      /* Only hide spinners when explicitly requested with no-spinners class */
      input[type="number"].no-spinners::-webkit-outer-spin-button,
      input[type="number"].no-spinners::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        height: 0 !important;
        margin: 0 !important;
      }
      
      input[type="number"].no-spinners {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  const mortgage = useMemo(() => {
    if (hasErrors) return null;
    return buildMortgageSchedule(inputs);
  }, [inputs, hasErrors]);

  const chartDataMonthly = useMemo(() => {
    if (!mortgage?.schedule?.length) return [];
    return mortgage.schedule.map((p) => ({ ...p, monthLabel: `M${p.month}` }));
  }, [mortgage]);

  const chartDataAnnual = useMemo(() => {
    if (!mortgage?.schedule?.length) return [];
    const yearly = {};
    mortgage.schedule.forEach((p) => {
      const y = p.year;
      if (!yearly[y])
        yearly[y] = {
          year: y,
          yearLabel: `${y}`,
          interestPayment: 0,
          principalPayment: 0,
          remainingBalance: p.remainingBalance
        };
      yearly[y].interestPayment += p.interestPayment;
      yearly[y].principalPayment += p.principalPayment;
      yearly[y].remainingBalance = p.remainingBalance;
    });
    return Object.values(yearly).map((y) => ({
      ...y,
      interestPayment: Math.round(y.interestPayment * 100) / 100,
      principalPayment: Math.round(y.principalPayment * 100) / 100
    }));
  }, [mortgage]);

  const chartData = view === "monthly" ? chartDataMonthly : chartDataAnnual;
  
  const visibleChartData = useMemo(() => {
    if (view === "annual") return chartData;
    const start = Math.max(0, monthRange.start - 1);
    const end = Math.min(chartData.length - 1, monthRange.end - 1);
    return chartData.slice(start, end + 1);
  }, [chartData, monthRange, view]);

  const updateInput = useCallback((field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setView("monthly");
    setMonthRange({ start: 1, end: 120 });
  }, []);

  useEffect(() => {
    const maxMonth = Math.max(1, chartDataMonthly.length);
    setMonthRange((r) => ({
      start: Math.min(r.start, maxMonth),
      end: Math.min(r.end, maxMonth)
    }));
  }, [chartDataMonthly.length]);

  const getXAxisInterval = useCallback((dataLength) => {
    if (dataLength <= 12) return 0;
    const targetTicks = 8;
    const interval = Math.ceil(dataLength / targetTicks) - 1;
    return Math.max(0, interval);
  }, []);

  const setStartMonth = useCallback((m) => {
    const maxMonth = Math.max(1, chartDataMonthly.length);
    const clamped = Math.max(1, Math.min(m || 1, maxMonth));
    setMonthRange((r) => ({
      start: Math.min(clamped, r.end),
      end: r.end
    }));
  }, [chartDataMonthly.length]);

  const setEndMonth = useCallback((m) => {
    const maxMonth = Math.max(1, chartDataMonthly.length);
    const clamped = Math.max(1, Math.min(m || 1, maxMonth));
    setMonthRange((r) => ({
      start: r.start,
      end: Math.max(clamped, r.start)
    }));
  }, [chartDataMonthly.length]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card title="Payment Summary">
              {hasErrors ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className={`font-semibold ${TYPOGRAPHY.body} text-red-800 mb-2`}>Please correct the following errors:</h3>
                  <ul className="space-y-1">
                    {Object.values(validationErrors).map((err, i) => (
                      <li key={i} className={`${TYPOGRAPHY.caption} text-red-700`}>• {err}</li>
                    ))}
                  </ul>
                </div>
              ) : mortgage?.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className={`${TYPOGRAPHY.body} text-red-800`}>{mortgage.error}</p>
                </div>
              ) : mortgage ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-2xl font-bold mb-1" style={{ color: COLORS.cfa.dark }}>{formatCurrency(mortgage.monthlyPayment)}</div>
                    <p className={`${TYPOGRAPHY.body}`} style={{ color: COLORS.cfa.dark }}>Monthly Payment</p>
                  </div>
                  <div className="p-4 border rounded-lg" style={{ backgroundColor: '#E8F0FF', borderColor: COLORS.cfa.primary }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: COLORS.cfa.primary }}>{formatCurrency(mortgage.totalInterest)}</div>
                    <p className={`${TYPOGRAPHY.body}`} style={{ color: COLORS.cfa.primary }}>Total Interest</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-500 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{formatCurrency(mortgage.totalPaid)}</div>
                    <p className={`${TYPOGRAPHY.body} text-purple-800`}>Total Paid</p>
                  </div>
                </div>
              ) : null}
            </Card>

            {mortgage && !hasErrors && (
              <Card title="Mortgage Payment Formula">
                <div className="space-y-4">
                  <div className="text-center font-mono text-lg bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center flex-wrap gap-2">
                      <span className="font-bold px-2 py-1 rounded text-white text-base" style={{ backgroundColor: COLORS.cfa.dark }}>
                        M
                      </span>
                      <span>=</span>
                      <span className="font-bold px-2 py-1 rounded text-white text-base" style={{ backgroundColor: COLORS.semantic.neutral }}>
                        P
                      </span>
                      <span>×</span>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 border-b-2 border-gray-400 pb-1">
                          <span className="font-bold px-1 py-1 rounded text-white text-sm" style={{ backgroundColor: COLORS.cfa.primary }}>
                            r
                          </span>
                          <span className="text-sm">(1+</span>
                          <span className="font-bold px-1 py-1 rounded text-white text-sm" style={{ backgroundColor: COLORS.cfa.primary }}>
                            r
                          </span>
                          <span className="text-sm">)<sup>n</sup></span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <span className="text-sm">(1+</span>
                          <span className="font-bold px-1 py-1 rounded text-white text-sm" style={{ backgroundColor: COLORS.cfa.primary }}>
                            r
                          </span>
                          <span className="text-sm">)<sup>n</sup> - 1</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: COLORS.cfa.dark }}>
                        M
                      </span>
                      <span>Monthly Payment = <strong>{formatCurrency(mortgage.monthlyPayment)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: COLORS.semantic.neutral }}>
                        P
                      </span>
                      <span>Principal = <strong>{formatCurrency(inputs.principal)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: COLORS.cfa.primary }}>
                        r
                      </span>
                      <span>Monthly Rate = <strong>{(inputs.rate / 12 * 100).toFixed(3)}%</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded text-gray-700 border border-gray-400 flex items-center justify-center font-bold text-sm">
                        n
                      </span>
                      <span>Number of Payments = <strong>{inputs.years * 12}</strong></span>
                    </div>
                  </div>

                  {inputs.rate === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className={`${TYPOGRAPHY.caption} text-amber-800 text-center`}>
                        <strong>Special Case:</strong> With 0% interest rate, Monthly Payment = Principal ÷ Number of Payments = {formatCurrency(inputs.principal)} ÷ {inputs.years * 12} = <strong>{formatCurrency(mortgage.monthlyPayment)}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="md:col-span-3 space-y-6">
            <Card title="Mortgage Cash Flows">
              {mortgage && chartData.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span>Principal Payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.cfa.primary }} />
                        <span>Interest Payments</span>
                      </div>
                    </div>
                    <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
                      <button className={`px-3 py-1 ${view === "monthly" ? "bg-blue-50 text-blue-600" : "bg-white"}`} onClick={() => setView("monthly")} aria-pressed={view === "monthly"}>Monthly</button>
                      <button className={`px-3 py-1 border-l border-gray-200 ${view === "annual" ? "bg-blue-50 text-blue-600" : "bg-white"}`} onClick={() => setView("annual")} aria-pressed={view === "annual"}>Annual</button>
                    </div>
                  </div>

                  <div className="sr-only">
                    <table>
                      <caption>Mortgage payment breakdown by {view === "monthly" ? "month" : "year"} showing first 10 periods</caption>
                      <thead>
                        <tr>
                          <th scope="col">{view === "monthly" ? "Month" : "Year"}</th>
                          <th scope="col" className="text-right">Interest Payment</th>
                          <th scope="col" className="text-right">Principal Payment</th>
                          <th scope="col" className="text-right">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleChartData.slice(0, 10).map(row => (
                          <tr key={row.month || row.year}>
                            <th scope="row">{view === "monthly" ? `Month ${row.month}` : `Year ${row.year}`}</th>
                            <td className="text-right">${row.interestPayment.toFixed(2)}</td>
                            <td className="text-right">${row.principalPayment.toFixed(2)}</td>
                            <td className="text-right">${row.remainingBalance.toFixed(2)}</td>
                          </tr>
                        ))}
                        {visibleChartData.length > 10 && (
                          <tr><td colSpan="4" className="text-center">... and {visibleChartData.length - 10} more {view === "monthly" ? "months" : "years"}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="h-96 w-full" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
                    <div className="sr-only">
                      <h3 id="chart-title">Mortgage Payment Composition Chart</h3>
                      <p id="chart-description">
                        Stacked bar chart showing the breakdown of {view === "monthly" ? "monthly" : "annual"} payments 
                        between interest and principal. Early payments are mostly interest, with principal portion increasing over time.
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={visibleChartData} 
                        margin={{ top: 20, right: 54, left: 20, bottom: 60 }}
                        barCategoryGap="5%"
                        maxBarSize={60}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                        <XAxis
                          dataKey={view === "monthly" ? "monthLabel" : "yearLabel"}
                          tick={{ fontSize: 12, fill: COLORS.chart.text }}
                          label={{ value: view === "monthly" ? "Months" : "Years", position: "bottom", offset: 24 }}
                          interval={view === "monthly" ? getXAxisInterval(visibleChartData.length) : 0}
                          height={40}
                          padding={{ left: 0, right: 0 }}
                          tickMargin={8}
                        />
                        <YAxis tick={{ fontSize: 12, fill: COLORS.chart.text }} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${Math.round(v)}`} />
                        <Tooltip content={<CustomTooltip isMonthly={view === "monthly"} />} />
                        <Bar dataKey="interestPayment" name="Interest Payments" stackId="payment" fill={COLORS.cfa.primary} />
                        <Bar dataKey="principalPayment" name="Principal Payments" stackId="payment" fill={COLORS.semantic.positive} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {view === "monthly" && (
                    <div role="group" aria-label="Select visible month range" className="mt-3 flex flex-wrap items-end gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="start-month" className={`${TYPOGRAPHY.caption}`}>Start month</label>
                        <div className="w-20">
                          <NumericInput
                            value={monthRange.start}
                            onChange={setStartMonth}
                            min={1}
                            max={Math.max(1, chartDataMonthly.length)}
                            step={1}
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="end-month" className={`${TYPOGRAPHY.caption}`}>End month</label>
                        <div className="w-20">
                          <NumericInput
                            value={monthRange.end}
                            onChange={setEndMonth}
                            min={1}
                            max={Math.max(1, chartDataMonthly.length)}
                            step={1}
                            placeholder="120"
                          />
                        </div>
                      </div>
                      <div aria-live="polite" className={`${TYPOGRAPHY.caption} text-gray-600`}>
                        Showing M{monthRange.start}–M{monthRange.end}
                      </div>
                    </div>
                  )}

                  <p className={`${TYPOGRAPHY.caption} mt-4 text-center`}>
                    {view === "monthly" ? (
                      <>Chart shows monthly composition of each payment. {inputs.rate === 0 && "With 0% interest, all payments go toward principal."}</>
                    ) : (
                      <>Chart shows annual totals (sum of 12 monthly payments each year). {inputs.rate === 0 && "With 0% interest, all payments go toward principal."}</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className={`${TYPOGRAPHY.body} text-gray-500`}>Complete the inputs above to see amortization schedule</p>
                </div>
              )}
            </Card>

            <Card title="Mortgage Parameters">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
  id="principal"
  label="Loan Amount"
  error={validationErrors.principal}
  helpText="Total amount borrowed"
  required
>
  <NumericInput
    value={inputs.principal}
    onChange={(v) => updateInput("principal", v)}
    min={1000}
    max={10000000}
    step={1000}
    prefix="$"
  />
</FormField>

<FormField
  id="rate"
  label="Annual Interest Rate"
  error={validationErrors.rate}
  helpText="Enter as percentage (e.g., enter 6 for 6%)"
  required
>
  <NumericInput
    value={inputs.rate * 100}
    onChange={(v) => updateInput("rate", v / 100)}
    min={0}
    max={50}
    step={0.01}
    suffix="%"
  />
</FormField>

<FormField
  id="years"
  label="Loan Term"
  error={validationErrors.years}
  helpText="Length of loan in years"
  required
>
  <NumericInput
    value={inputs.years}
    onChange={(v) => updateInput("years", Math.round(v))}
    min={1}
    max={50}
    step={1}
    suffix="years"
    hideSteppers
  />
</FormField>

              </div>

              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={resetToDefaults}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-describedby="reset-help"
                >
                  Reset to Defaults
                </button>
                <p id="reset-help" className={`${TYPOGRAPHY.caption} text-gray-500 mt-1`}>
                  Resets to: $800K loan, 6% rate, 30 years
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}