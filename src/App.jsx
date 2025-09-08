import React, { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Design system constants
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

// Form Field Component
const FormField = ({ id, label, children, error, helpText, required = false }) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label 
        htmlFor={id}
        className={`block ${TYPOGRAPHY.label} ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}`}
      >
        {label}
      </label>
      {React.cloneElement(children, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : 'false'
      })}
      {helpText && (
        <p id={helpId} className={`${TYPOGRAPHY.caption} text-gray-500`}>
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className={`${TYPOGRAPHY.caption} text-red-600`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Numeric Input Component
const NumericInput = ({ value, onChange, min, max, step = 0.01, prefix = "", suffix = "", placeholder = "0.00" }) => {
  const [displayValue, setDisplayValue] = useState(
    value !== undefined && value !== null ? value.toFixed(step >= 1 ? 0 : 2) : ""
  );

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue)) {
      const constrainedValue = Math.min(Math.max(numericValue, min || 0), max || Infinity);
      onChange?.(constrainedValue);
    }
  }, [onChange, min, max]);

  const handleBlur = useCallback((e) => {
    const numericValue = parseFloat(e.target.value);
    if (!isNaN(numericValue)) {
      const constrainedValue = Math.min(Math.max(numericValue, min || 0), max || Infinity);
      setDisplayValue(constrainedValue.toFixed(step >= 1 ? 0 : 2));
      onChange?.(constrainedValue);
    } else {
      setDisplayValue(step >= 1 ? "0" : "0.00");
      onChange?.(0);
    }
  }, [onChange, min, max, step]);

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${prefix ? "pl-8" : ""} ${suffix ? "pr-8" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

// Card Component
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

// Validation function
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

// Calculation function
const buildMortgageSchedule = ({ principal = 800000, rate = 0.06, years = 30 }) => {
  try {
    if (principal <= 0 || years <= 0) {
      throw new Error("Invalid loan parameters");
    }

    const monthlyRate = rate / 12;
    const numPayments = years * 12;
    let monthlyPayment;
    
    if (rate === 0 || monthlyRate === 0) {
      monthlyPayment = principal / numPayments;
    } else {
      monthlyPayment = (monthlyRate * principal * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    let remainingBalance = principal;
    const schedule = [];
    
    for (let month = 1; month <= numPayments; month++) {
      let interestPayment, principalPayment;
      
      if (rate === 0) {
        interestPayment = 0;
        principalPayment = monthlyPayment;
        
        if (month === numPayments) {
          principalPayment = remainingBalance;
        }
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
      totalInterest: schedule.reduce((sum, payment) => sum + payment.interestPayment, 0),
      totalPaid: schedule.reduce((sum, payment) => sum + payment.totalPayment, 0)
    };
  } catch (error) {
    return {
      schedule: [],
      monthlyPayment: 0,
      totalInterest: 0,
      totalPaid: 0,
      error: error.message
    };
  }
};

// Custom Tooltip - NO VALUE LABELS ON BARS
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className={`font-medium ${TYPOGRAPHY.body} mb-2`}>{`Year ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className={TYPOGRAPHY.caption}>
            {`${entry.name}: $${entry.value.toFixed(2)}`}
          </p>
        ))}
        {data && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className={`${TYPOGRAPHY.caption} text-gray-600`}>
              Remaining Balance: ${data.remainingBalance?.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Main Component
export default function CleanMortgageCalculator() {
  const [inputs, setInputs] = useState({
    principal: 800000,
    rate: 0.06,
    years: 30
  });
  
  const validationErrors = useMemo(() => validateMortgageInputs(inputs), [inputs]);
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  const mortgage = useMemo(() => {
    if (hasErrors) return null;
    return buildMortgageSchedule(inputs);
  }, [inputs, hasErrors]);

  // Aggregate by year for cleaner chart
  const chartData = useMemo(() => {
    if (!mortgage?.schedule || mortgage.schedule.length === 0) return [];
    
    const yearlyData = {};
    mortgage.schedule.forEach(payment => {
      const year = payment.year;
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          yearLabel: year.toString(),
          interestPayment: 0,
          principalPayment: 0,
          remainingBalance: payment.remainingBalance
        };
      }
      yearlyData[year].interestPayment += payment.interestPayment;
      yearlyData[year].principalPayment += payment.principalPayment;
      yearlyData[year].remainingBalance = payment.remainingBalance;
    });
    
    return Object.values(yearlyData).map(year => ({
      ...year,
      interestPayment: Math.round(year.interestPayment * 100) / 100,
      principalPayment: Math.round(year.principalPayment * 100) / 100
    }));
  }, [mortgage]);

  const updateInput = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className={`text-3xl font-bold ${TYPOGRAPHY.heading} mb-2`}>
            CFA Institute - Quantitative Methods: Mortgage Amortization
          </h1>
          <p className={`text-lg ${TYPOGRAPHY.body} mb-4`}>
            Analyze how mortgage payments are split between principal and interest over the loan term.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className={`font-semibold ${TYPOGRAPHY.body} mb-2`}>Learning Objective:</h3>
            <p className={TYPOGRAPHY.caption}>
              Understand amortization schedules and how level payments are allocated between 
              interest and principal reduction. Formula: <strong>PMT = P × [r(1+r)ⁿ] ÷ [(1+r)ⁿ - 1]</strong>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card title="Mortgage Parameters" className="lg:col-span-1">
            <div className="space-y-4">
              <FormField
                id="principal"
                label="Loan Amount"
                error={validationErrors.principal}
                helpText="Total amount borrowed"
                required
              >
                <NumericInput
                  value={inputs.principal}
                  onChange={(value) => updateInput('principal', value)}
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
                helpText="Yearly interest rate (e.g., 6% = 0.06)"
                required
              >
                <NumericInput
                  value={inputs.rate * 100}
                  onChange={(value) => updateInput('rate', value / 100)}
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
                  onChange={(value) => updateInput('years', value)}
                  min={1}
                  max={50}
                  step={1}
                  suffix="years"
                />
              </FormField>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className={`font-semibold ${TYPOGRAPHY.body} mb-2 text-amber-800`}>
                Key Concepts:
              </h4>
              <ul className={`${TYPOGRAPHY.caption} text-amber-700 space-y-1`}>
                <li>• Early payments are mostly interest</li>
                <li>• Principal portion increases over time</li>
                <li>• Total payment remains constant</li>
                <li>• Zero interest rate = equal principal payments</li>
              </ul>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Payment Summary">
              {hasErrors ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className={`font-semibold ${TYPOGRAPHY.body} text-red-800 mb-2`}>
                    Please correct the following errors:
                  </h3>
                  <ul className="space-y-1">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index} className={`${TYPOGRAPHY.caption} text-red-700`}>
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : mortgage?.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className={`${TYPOGRAPHY.body} text-red-800`}>{mortgage.error}</p>
                </div>
              ) : mortgage ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatCurrency(mortgage.monthlyPayment)}
                    </div>
                    <p className={`${TYPOGRAPHY.body} text-blue-800`}>Monthly Payment</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(mortgage.totalInterest)}
                    </div>
                    <p className={`${TYPOGRAPHY.body} text-green-800`}>Total Interest</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatCurrency(mortgage.totalPaid)}
                    </div>
                    <p className={`${TYPOGRAPHY.body} text-purple-800`}>Total Paid</p>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card title="Annual Payment Breakdown">
              {mortgage && chartData.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span>Principal Payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.cfa.primary }}></div>
                      <span>Interest Payments</span>
                    </div>
                  </div>
                  
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                        <XAxis 
                          dataKey="yearLabel"
                          tick={{ fontSize: 12, fill: COLORS.chart.text }}
                          label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: COLORS.chart.text }}
                          tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        <Bar 
                          dataKey="interestPayment" 
                          name="Interest Payments"
                          stackId="payment"
                          fill={COLORS.cfa.primary}
                        />
                        <Bar 
                          dataKey="principalPayment" 
                          name="Principal Payments"
                          stackId="payment"
                          fill={COLORS.semantic.positive}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <p className={`${TYPOGRAPHY.caption} mt-4 text-center`}>
                    Chart shows how payment composition shifts from mostly interest to mostly principal over time.
                    {inputs.rate === 0 && " With 0% interest, all payments go toward principal."}
                  </p>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className={`${TYPOGRAPHY.body} text-gray-500`}>
                    Complete the inputs above to see amortization schedule
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}