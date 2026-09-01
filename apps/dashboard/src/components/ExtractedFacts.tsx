import React from "react";

export interface FactData {
  fact_type: string;
  fact_key: string;
  fact_value: Record<string, any> | string;
  confidence?: number;
}

export function ExtractedFacts({ facts }: { facts: FactData[] }) {
  if (!facts || facts.length === 0) {
    return <div style={{ color: "#888", fontStyle: "italic" }}>No facts extracted yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {facts.map((fact, idx) => {
        let displayValue = "";
        if (typeof fact.fact_value === 'object' && fact.fact_value !== null) {
          // If it's an object with a 'value' key, prefer that, otherwise format properties nicely
          if ('value' in fact.fact_value) {
            displayValue = String(fact.fact_value.value);
          } else {
            displayValue = Object.entries(fact.fact_value)
              .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
              .join(", ");
          }
        } else {
          displayValue = String(fact.fact_value);
        }

        return (
          <div key={idx} style={{
            backgroundColor: "#f0f4f8",
            border: "1px solid #d9e2ec",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "0.85rem",
            color: "#334e68",
            display: "flex",
            flexDirection: "column",
            minWidth: "120px",
            flex: "1 1 auto"
          }}>
            <span style={{ 
              fontSize: "0.7rem", 
              textTransform: "uppercase", 
              fontWeight: 600, 
              color: "#829ab1", 
              marginBottom: "4px" 
            }}>
              {fact.fact_type.replace(/_/g, ' ')} • {fact.fact_key.replace(/_/g, ' ')}
            </span>
            <span style={{ fontWeight: 500, wordBreak: "break-word" }}>
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
