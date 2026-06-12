"use client";

import { useState } from "react";
import { useTrades } from "@/contexts/TradesContext";
import { exportData } from "@/app/exports/exportEngine";
import styles from "./ExportPanel.module.css";
import { Loader2 } from "lucide-react";

export default function ExportPanel() {
  const { trades, isLoading } = useTrades();
  const [format, setFormat] = useState("csv");
  const [fileName, setFileName] = useState("export"); // Default filename
  const [fields, setFields] = useState(["asset_name", "pnl_amount", "trade_date"]); // Default fields
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export Engine</h2>
          <p className={styles.subtitle}>Configure institutional-grade data reports</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : trades.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.checkboxText}>No data available for export</p>
          </div>
        ) : (
        <div className={styles.formSection}>
          {/* FILE NAME */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Filename</label>
            <input
              className={styles.input}
              placeholder="e.g. trades_q1_report"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          {/* FORMAT SELECT */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Target Format</label>
            <select 
              className={styles.select}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="csv">CSV (Raw Data)</option>
              <option value="json">JSON (API Object)</option>
              <option value="xlsx">Excel (Worksheet)</option>
              <option value="pdf">PDF (Document)</option>
              <option value="txt">TXT (Flat File)</option>
              <option value="zip">ZIP (Archive All)</option>
            </select>
          </div>

          {/* FIELD FILTERS */}
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>Data Fields to Include</label>
            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={fields.includes("asset_name")}
                  onChange={() => setFields(prev =>
                    prev.includes("asset_name")
                      ? prev.filter(f => f !== "asset_name")
                      : [...prev, "asset_name"]
                  )}
                />
                <span className={styles.checkboxText}>Asset Name</span>
              </label>

              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={fields.includes("pnl_amount")}
                  onChange={() => setFields(prev =>
                    prev.includes("pnl_amount")
                      ? prev.filter(f => f !== "pnl_amount")
                      : [...prev, "pnl_amount"]
                  )}
                />
                <span className={styles.checkboxText}>P&L Amount</span>
              </label>

              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={fields.includes("trade_date")}
                  onChange={() => setFields(prev =>
                    prev.includes("trade_date")
                      ? prev.filter(f => f !== "trade_date")
                      : [...prev, "trade_date"]
                  )}
                />
                <span className={styles.checkboxText}>Trade Date</span>
              </label>
            </div>
          </div>

          <button
            className={styles.button}
            onClick={() =>
              exportData(trades, {
                fileName,
                format,
                selectedFields: fields,
                includeHeaders: true,
                prettyPrint: true
              } as any)
            }
          >
            Execute Export
          </button>
        </div>
        )}
      </div>
    </div>
  );
}