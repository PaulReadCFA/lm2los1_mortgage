import React, { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// CFA-branded color palette
const COLORS = {
  primary: "#4476ff",
  dark: "#06005a",
  darkAlt: "#38337b",
  positive: "#6991ff",
  negative: "#ea792d",
  purple: "#7a46ff",
  purpleAlt: "#50037f",
  lightBlue: "#4476ff",
  orange: "#ea792d",
  darkText: "#06005a",
  green: "#10b981",
};

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function InfoIcon({ children, id }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`${id}-tooltip`}
        aria-label="More information"
      >
        ?
      </button>
      
      {showTooltip && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
        >
          {children}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h3 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h3>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

const formatCurrency = (amount) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(amount || 0);

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
      let interestPayment, principalAmortization;

      if (!rate || monthlyRate === 0) {
        interestPayment = 0;
        principalAmortization = monthlyPayment;
        if (month === numPayments) principalAmortization = remainingBalance;
      } else {
        interestPayment = remainingBalance * monthlyRate;
        principalAmortization = monthlyPayment - interestPayment;
        if (month === numPayments) {
          principalAmortization = remainingBalance;
          interestPayment = monthlyPayment - principalAmortization;
        }
      }

      remainingBalance = Math.max(0, remainingBalance - principalAmortization);

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        interestPayment: Math.round(interestPayment * 100) / 100,
        principalAmortization: Math.round(principalAmortization * 100) / 100,
        totalPayment: Math.round((interestPayment + principalAmortization) * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        monthLabel: month.toString(),
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

function ResultsSection({ mortgage, hasErrors, validationErrors }) {
  if (hasErrors) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-sm text-red-800 mb-2">Please correct errors:</h3>
        <ul className="space-y-1">
          {Object.values(validationErrors).map((err, i) => (
            <li key={i} className="text-xs text-red-700">• {err}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!mortgage) return null;

  return (
    <div className="space-y-6">
      {/* Monthly Payment */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-3xl font-serif text-blue-600 mb-2">{formatCurrency(mortgage.monthlyPayment)}</div>
        <div className="text-sm text-gray-700">
          <div><strong>Monthly Payment</strong></div>
        </div>
      </div>

      {/* Total Interest */}
      <div className="p-4 rounded-lg border" style={{ backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }}>
        <div className="text-3xl font-serif mb-2" style={{ color: COLORS.primary }}>{formatCurrency(mortgage.totalInterest)}</div>
        <div className="text-sm text-gray-700">
          <div><strong>Total Interest</strong></div>
        </div>
      </div>

      {/* Total Paid */}
      <div className="p-4 rounded-lg border" style={{ backgroundColor: COLORS.purple + '20', borderColor: COLORS.purple }}>
        <div className="text-3xl font-serif mb-2" style={{ color: COLORS.purple }}>{formatCurrency(mortgage.totalPaid)}</div>
        <div className="text-sm text-gray-700">
          <div><strong>Total Paid</strong></div>
        </div>
      </div>
    </div>
  );
}

function MortgageChart({ mortgage, view }) {
  if (!mortgage || !mortgage.schedule.length) return null;

  const chartDataAnnual = useMemo(() => {
    const yearly = {};
    mortgage.schedule.forEach((p) => {
      const y = p.year;
      if (!yearly[y])
        yearly[y] = {
          year: y,
          yearLabel: `${y}`,
          interestPayment: 0,
          principalAmortization: 0,
          remainingBalance: p.remainingBalance
        };
      yearly[y].interestPayment += p.interestPayment;
      yearly[y].principalAmortization += p.principalAmortization;
      yearly[y].remainingBalance = p.remainingBalance;
    });
    return Object.values(yearly).map((y) => ({
      ...y,
      interestPayment: Math.round(y.interestPayment * 100) / 100,
      principalAmortization: Math.round(y.principalAmortization * 100) / 100
    }));
  }, [mortgage]);

  const chartData = view === "monthly" ? mortgage.schedule : chartDataAnnual;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2 text-sm">
            {view === "monthly" ? `Month ${data?.month}` : `Year ${data?.year}`}
          </p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color }} className="text-xs">
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
          {data && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Remaining: {formatCurrency(data.remainingBalance)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{backgroundColor: COLORS.green}}></span>
          Principal Amortization
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{backgroundColor: COLORS.primary}}></span>
          Interest Payments
        </span>
      </div>

      {/* Chart */}
      <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
        <div className="sr-only">
          <h3 id="chart-title">Mortgage Payment Composition Chart</h3>
          <p id="chart-description">
            Stacked bar chart showing breakdown of {view === "monthly" ? "monthly" : "annual"} payments between interest and principal.
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 54, left: 20, bottom: 60 }}
            barCategoryGap="5%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={view === "monthly" ? "monthLabel" : "yearLabel"}
              label={{ value: view === "monthly" ? "Months" : "Years", position: "bottom", offset: 24 }}
              interval={view === "monthly" ? "preserveStartEnd" : 0}
              height={40}
            />
            <YAxis tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${Math.round(v)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="interestPayment" name="Interest" stackId="payment" fill={COLORS.primary} />
            <Bar dataKey="principalAmortization" name="Principal" stackId="payment" fill={COLORS.green} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Educational note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
        <strong>Mortgage Amortization:</strong> Early payments are mostly interest; principal portion increases over time as balance decreases.
      </div>
    </>
  );
}

export default function App() {
  const [inputs, setInputs] = useState({ principal: 800000, rate: 0.06, years: 30 });
  const [view, setView] = useState("annual");

  const validationErrors = useMemo(() => validateMortgageInputs(inputs), [inputs]);
  const hasErrors = Object.keys(validationErrors).length > 0;

  const mortgage = useMemo(() => {
    if (hasErrors) return null;
    return buildMortgageSchedule(inputs);
  }, [inputs, hasErrors]);

  const updateInput = useCallback((field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">

        {/* RESULTS AND CHART */}
        <>
          {/* MOBILE */}
          <div className="lg:hidden space-y-6">
            <Card title="Results">
              <ResultsSection mortgage={mortgage} hasErrors={hasErrors} validationErrors={validationErrors} />
            </Card>
            <Card title="Mortgage Cash Flows">
              {/* View Toggle */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
                  <button 
                    className={`px-3 py-1 text-sm ${view === "monthly" ? "bg-blue-50 text-blue-600 font-semibold" : "bg-white"}`} 
                    onClick={() => setView("monthly")}
                  >
                    Monthly
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm border-l ${view === "annual" ? "bg-blue-50 text-blue-600 font-semibold" : "bg-white"}`} 
                    onClick={() => setView("annual")}
                  >
                    Annual
                  </button>
                </div>
              </div>
              <MortgageChart mortgage={mortgage} view={view} />
            </Card>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-1">
              <Card title="Results">
                <ResultsSection mortgage={mortgage} hasErrors={hasErrors} validationErrors={validationErrors} />
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card title="Mortgage Cash Flows">
                {/* View Toggle */}
                <div className="flex justify-end mb-4">
                  <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
                    <button 
                      className={`px-3 py-1 text-sm ${view === "monthly" ? "bg-blue-50 text-blue-600 font-semibold" : "bg-white"}`} 
                      onClick={() => setView("monthly")}
                    >
                      Monthly
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm border-l ${view === "annual" ? "bg-blue-50 text-blue-600 font-semibold" : "bg-white"}`} 
                      onClick={() => setView("annual")}
                    >
                      Annual
                    </button>
                  </div>
                </div>
                <MortgageChart mortgage={mortgage} view={view} />
              </Card>
            </div>
          </div>
        </>

        {/* INPUTS */}
        <Card title="Mortgage Calculator">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            
            <div className="flex items-center gap-2">
              <label htmlFor="principal" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Loan Amount
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="principal">Total amount borrowed</InfoIcon>
              </label>
              <div className="w-32">
                <input
                  id="principal"
                  type="number"
                  step="1000"
                  value={inputs.principal}
                  onChange={(e) => updateInput('principal', +e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    validationErrors.principal ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="rate" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Annual Rate (%)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="rate">Annual interest rate</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="rate"
                  type="number"
                  step="0.1"
                  value={inputs.rate * 100}
                  onChange={(e) => updateInput('rate', +e.target.value / 100)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    validationErrors.rate ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="years" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Loan Term (years)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="years">Length of loan</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="years"
                  type="number"
                  step="1"
                  value={inputs.years}
                  onChange={(e) => updateInput('years', Math.round(+e.target.value))}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    validationErrors.years ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

          </div>
          
          <ValidationMessage errors={validationErrors} />
        </Card>

      </main>
    </div>
  );
}