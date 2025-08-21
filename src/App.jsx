import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * CFA Institute – Quantitative Methods: LOS 1
 * 1) Coupon Bond Cash Flows & Price
 * 2) Mortgage Amortization (stacked Interest + Principal)
 * 3) Dividend Discount Models (no growth, Gordon, two-stage)
 */

const CHART_MARGINS = { top: 8, right: 12, left: 72, bottom: 36 };

// ---- CFA palette & helpers ----
const CFA = { primary: "#4476FF", dark: "#06005A" };
const fmtUSD = (x) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

/* -------------------------------------------------------------------------- */
/*                             Compact calculator UI                           */
/* -------------------------------------------------------------------------- */

const Card = ({ title, children }) => (
  <section className="bg-white rounded-2xl shadow-md border border-gray-200">
    <header className="px-6 pt-6 pb-3 border-b border-gray-100">
      <h2 className="text-2xl font-georgia text-cfa-dark">{title}</h2>
    </header>
    <div className="p-6">{children}</div>
  </section>
);

// Label left, compact input(s) right
const InlineRow = ({ label, children }) => (
  <div className="flex items-center gap-4 py-1.5">
    <label className="grow text-sm font-arial text-gray-700">{label}</label>
    <div className="shrink-0 flex items-center gap-2">{children}</div>
  </div>
);

// Base input: fixed width, readable text/caret
const InputBase = ({ className = "", style, ...props }) => (
  <input
    {...props}
    className={
      "shrink-0 w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 " +
      "text-right text-sm text-gray-900 caret-cfa-blue font-arial shadow-sm " +
      "focus:outline-none focus:ring-2 focus:ring-cfa-blue/40 focus:border-cfa-blue " +
      className
    }
    style={{ width: "8rem", ...style }}
  />
);

// Handles $/% adornment without blocking caret; adds padding automatically
function InputWithAdorn({ left, right, inputClassName = "", ...props }) {
  const padLeft = left ? "pl-6" : "";
  const padRight = right ? "pr-8" : ""; // reserve space so text/caret never sit under adorn
  return (
    <div className="relative shrink-0">
      {left && (
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-500 text-sm font-arial">
          {left}
        </span>
      )}
      <InputBase {...props} className={`${padLeft} ${padRight} ${inputClassName}`} />
      {right && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 text-sm font-arial">
          {right}
        </span>
      )}
    </div>
  );
}

// Currency ($ shown, stores raw number)
function CurrencyField({ value, onChange }) {
  const display = Number.isFinite(value) ? value.toFixed(2) : "";
  return (
    <InputWithAdorn
      left="$"
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      onBlur={(e) => {
        const v = parseFloat(e.target.value);
        e.target.value = Number.isFinite(v) ? v.toFixed(2) : "0.00";
        onChange(Number.isFinite(v) ? v : 0);
      }}
      placeholder="0.00"
    />
  );
}

// Percent (% shown, stores decimal 0–1)
function PercentField({ value, onChange }) {
  const display = Number.isFinite(value) ? (value * 100).toFixed(2) : "";
  return (
    <InputWithAdorn
      right="%"
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v / 100 : 0);
      }}
      onBlur={(e) => {
        const v = parseFloat(e.target.value);
        e.target.value = Number.isFinite(v) ? v.toFixed(2) : "0.00";
        onChange(Number.isFinite(v) ? v / 100 : 0);
      }}
      placeholder="0.00"
    />
  );
}

// Integer years / frequency
function IntField({ value, onChange }) {
  const display = Number.isFinite(value) ? String(value) : "";
  return (
    <InputBase
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={display}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      onBlur={(e) => {
        const v = parseInt(e.target.value, 10);
        e.target.value = Number.isFinite(v) ? String(v) : "0";
        onChange(Number.isFinite(v) ? v : 0);
      }}
      placeholder="0"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                Calculations                                */
/* -------------------------------------------------------------------------- */

// Mortgage schedule - Fixed to handle zero interest rate
function buildMortgageSchedule({ principal = 800_000, rate = 0.06, years = 30 }) {
  const m = 12;
  const n = years * m;
  const i = rate / m;
  
  let pmt;
  
  // Handle zero interest rate case
  if (rate === 0 || i === 0) {
    pmt = round2(principal / n); // Simple division when no interest
  } else {
    pmt = round2((i * principal) / (1 - Math.pow(1 + i, -n)));
  }

  let bal = principal;
  const rows = [];
  
  for (let t = 1; t <= n; t++) {
    let interest, principalPaid;
    
    if (rate === 0 || i === 0) {
      // Zero interest case
      interest = 0;
      principalPaid = round2(pmt);
      
      // Handle final payment to ensure balance goes to exactly zero
      if (t === n) {
        principalPaid = round2(bal);
      }
    } else {
      // Normal interest case
      interest = round2(bal * i);
      principalPaid = round2(pmt - interest);
      
      if (t === n) {
        principalPaid = round2(bal);
        interest = round2(pmt - principalPaid);
      }
    }
    
    bal = round2(bal - principalPaid);
    
    rows.push({
      month: t,
      interest,
      principal: principalPaid,
      total: round2(interest + principalPaid),
      balance: Math.max(bal, 0),
    });
  }
  
  return { rows, pmt };
}

/* -------------------------------------------------------------------------- */
/*                                   App                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  // Mortgage state
  const [mortgageAmt, setMortgageAmt] = useState(800000);
  const [mortgageRate, setMortgageRate] = useState(0.06);
  const [mortgageYears, setMortgageYears] = useState(30);
  const mortgage = useMemo(() => buildMortgageSchedule({ principal: mortgageAmt, rate: mortgageRate, years: mortgageYears }), [mortgageAmt, mortgageRate, mortgageYears]);

  // Mortgage x-axis ticks at whole years
  const mortgageChart = useMemo(() => mortgage.rows, [mortgage]);
  const mortgageTicks = useMemo(() => {
    const yrs = Math.ceil(mortgageChart.length / 12);
    return Array.from({ length: yrs }, (_, i) => (i + 1) * 12);
  }, [mortgageChart]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Mortgage */}
        <Card title="Mortgage Amortization (Level Payment)">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-georgia text-cfa-blue mb-2">Inputs</h3>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <InlineRow label="Mortgage Amount"><CurrencyField value={mortgageAmt} onChange={setMortgageAmt} /></InlineRow>
                <InlineRow label="Annual Interest Rate"><PercentField value={mortgageRate} onChange={setMortgageRate} /></InlineRow>
                <InlineRow label="Term (years)"><IntField value={mortgageYears} onChange={setMortgageYears} /></InlineRow>
                <div className="h-px bg-gray-200 my-3" />
                <p className="text-sm font-arial text-gray-700">
                  <strong>Level Payment:</strong> {fmtUSD(mortgage.pmt)} <span className="text-gray-500">/ month</span>
                </p>
                {mortgageRate === 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-arial">
                    Zero interest: Payment is principal ÷ {mortgageYears * 12} months
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div style={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mortgageChart} margin={CHART_MARGINS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        type="number"
                        domain={[1, mortgageChart.length]}
                        ticks={mortgageTicks}
                        tickFormatter={(m) => (m / 12).toFixed(0)}
                        tickMargin={8}
                        label={{ value: "Years", position: "insideBottom", offset: -20 }}
                      />
                      <YAxis tickFormatter={fmtUSD} width={80} />
                      <Tooltip 
                        formatter={(v, name, props) => {
                          if (props.dataKey === 'interest') {
                            return [fmtUSD(v), 'Interest Cash Flows'];
                          } else if (props.dataKey === 'principal') {
                            return [fmtUSD(v), 'Principal Amortization'];
                          }
                          return [fmtUSD(v), name];
                        }}
                        contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }} 
                      />
                      <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ paddingBottom: 6 }} />
                      <Bar dataKey="interest" name="Interest Cash Flows" stackId="pmt" fill={CFA.primary} radius={[0,0,3,3]} />
                      <Bar dataKey="principal" name="Principal Amortization" stackId="pmt" fill={CFA.dark} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-arial">X-axis spans the full mortgage term. Bars show payment split into principal and interest.</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}