import React from "react";

export interface MeddicData {
  metrics?: Record<string, any>;
  economic_buyer?: Record<string, any>;
  decision_criteria?: Record<string, any>;
  decision_process?: Record<string, any>;
  identified_pain?: Record<string, any>;
  champion?: Record<string, any>;
  timeline?: Record<string, any>;
  budget?: Record<string, any>;
  completeness_score?: number;
}

export function MeddicProfile({ data }: { data: MeddicData | null }) {
  if (!data) {
    return <div style={{ color: "#888", fontStyle: "italic" }}>No MEDDIC profile available yet.</div>;
  }

  const renderSection = (title: string, content?: Record<string, any>) => {
    const isCompleted = content && Object.keys(content).length > 0;
    
    return (
      <div style={{
        padding: "10px",
        marginBottom: "8px",
        border: `1px solid ${isCompleted ? "#c3e6cb" : "#f5c6cb"}`,
        borderRadius: "6px",
        backgroundColor: isCompleted ? "#d4edda" : "#f8d7da",
        color: isCompleted ? "#155724" : "#721c24"
      }}>
        <h4 style={{ margin: "0 0 5px 0", fontSize: "0.9rem" }}>{title}</h4>
        {isCompleted ? (
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem" }}>
            {Object.entries(content).map(([k, v]) => {
              let displayValue = String(v);
              if (typeof v === 'object' && v !== null) {
                if ('value' in v) {
                  displayValue = String(v.value);
                } else {
                  displayValue = Object.entries(v)
                    .map(([subK, subV]) => `${subK.replace(/_/g, ' ')}: ${subV}`)
                    .join(", ");
                }
              }
              return (
                <li key={k}>
                  <strong>{k.replace(/_/g, ' ')}:</strong> {displayValue}
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>Needs discovery...</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {renderSection("Metrics (M)", data.metrics)}
      {renderSection("Economic Buyer (E)", data.economic_buyer)}
      {renderSection("Decision Criteria (D)", data.decision_criteria)}
      {renderSection("Decision Process (D)", data.decision_process)}
      {renderSection("Identified Pain (I)", data.identified_pain)}
      {renderSection("Champion (C)", data.champion)}
      
      <div style={{ gridColumn: "1 / -1", marginTop: "10px", borderTop: "1px dashed #ccc", paddingTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {renderSection("Timeline", data.timeline)}
        {renderSection("Budget", data.budget)}
      </div>
    </div>
  );
}
