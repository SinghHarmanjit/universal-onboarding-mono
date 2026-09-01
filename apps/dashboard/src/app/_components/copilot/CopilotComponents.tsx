import React from "react";
import { z } from "zod";
import { useComponent } from "@copilotkit/react-core/v2";

// 1. Table Component Schema
const tableSchema = z.object({
  heading: z.string().describe("The heading to explain the comparison being shown"),
  columns: z.array(z.string()).describe("The column headers for the table"),
  rows: z.array(z.array(z.string())).describe("The rows of data. Each row is an array of strings corresponding to the columns."),
});

// 2. Heading Component Schema
const headingSchema = z.object({
  text: z.string().describe("The text content of the heading"),
  level: z.enum(["h1", "h2", "h3", "h4"]).describe("The heading level").default("h2"),
});

// 3. Paragraph Component Schema
const paragraphSchema = z.object({
  text: z.string().describe("The text content of the paragraph"),
});

/**
 * Hook to register all Copilot UI Components.
 * Call this hook inside your Chat page or a high-level wrapper component
 * so that the AI agent knows these components exist and can render them.
 */
export function useCopilotComponents() {

  // Register Table Component
  useComponent({
    name: "Table",
    description: "Displays a data table to show features, or structured data",
    parameters: tableSchema,
    render: ({ heading, columns, rows }) => (
      <div className="my-4 border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
        {heading && (
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 m-0">{heading}</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns?.map((col, idx) => (
                  <th key={idx} className="p-3 font-medium text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-3 text-gray-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  });

  // Register Heading Component
  useComponent({
    name: "SectionHeading",
    description: "Displays a formatted heading to break down sections of text",
    parameters: headingSchema,
    render: ({ text, level }) => {
      const Tag = level as React.ElementType;
      const baseStyles = "font-bold text-gray-900 my-4";

      const sizeStyles = {
        h1: "text-3xl",
        h2: "text-2xl",
        h3: "text-xl",
        h4: "text-lg",
      };

      return <Tag className={`${baseStyles} ${sizeStyles[level as keyof typeof sizeStyles]}`}>{text}</Tag>;
    },
  });

  // Register Paragraph Component
  useComponent({
    name: "TextParagraph",
    description: "Displays a standard paragraph of text",
    parameters: paragraphSchema,
    render: ({ text }) => (
      <p className="my-3 text-gray-700 leading-relaxed">
        {text}
      </p>
    ),
  });
}
