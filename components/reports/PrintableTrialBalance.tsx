import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface Row {
  id:     string;
  name:   string;
  debit:  number;
  credit: number;
}

interface Props {
  rows:          Row[];
  totalDebits:   number;
  totalCredits:  number;
  isBalanced:    boolean;
  generatedAt:   string;
}

// This component is rendered off-screen and passed to react-to-print.
// All styles are inline so they survive the print context.
const PrintableTrialBalance = React.forwardRef<HTMLDivElement, Props>(
  ({ rows, totalDebits, totalCredits, isBalanced, generatedAt }, ref) => {
    return (
      <div
        ref={ref}
        style={{ fontFamily: "Georgia, serif", padding: "40px", color: "#1e293b", maxWidth: "800px", margin: "0 auto" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "2px solid #1e293b", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Scholium</h1>
          <h2 style={{ fontSize: "16px", fontWeight: "normal", margin: "4px 0 0", color: "#475569" }}>
            Trial Balance
          </h2>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0 0" }}>
            Generated {generatedAt}
          </p>
        </div>

        {/* Balance status */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderRadius: "8px",
          marginBottom: "24px",
          backgroundColor: isBalanced ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${isBalanced ? "#bbf7d0" : "#fecaca"}`,
        }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: isBalanced ? "#16a34a" : "#dc2626" }}>
            {isBalanced ? "✓ Books are balanced — debits equal credits" : "✗ Imbalance detected"}
          </span>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ textAlign: "left",  padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Account</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Debit</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                }}
              >
                <td style={{ padding: "9px 12px", color: "#1e293b" }}>{row.name}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>
                  {row.debit > 0 ? row.debit.toFixed(2) : "—"}
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>
                  {row.credit > 0 ? row.credit.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #1e293b", backgroundColor: "#f8fafc" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>Total</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                {totalDebits.toFixed(2)}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                {totalCredits.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "32px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Total Debits</p>
            <p style={{ fontSize: "15px", fontFamily: "monospace", fontWeight: 700, margin: "2px 0 0", color: "#1e293b" }}>
              {totalDebits.toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Total Credits</p>
            <p style={{ fontSize: "15px", fontFamily: "monospace", fontWeight: 700, margin: "2px 0 0", color: "#1e293b" }}>
              {totalCredits.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: "11px", color: "#cbd5e1", textAlign: "center", marginTop: "40px" }}>
          Scholium — Study Journal · Double-Entry Bookkeeping
        </p>
      </div>
    );
  }
);

PrintableTrialBalance.displayName = "PrintableTrialBalance";
export default PrintableTrialBalance;