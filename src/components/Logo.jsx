import React from "react";

// Logo: quadrato scuro con la "S" e il segnalibro ocra.
export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Scribae">
      <rect width="64" height="64" rx="15" fill="#1a1a1a" />
      <text
        x="31"
        y="46"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif"
        fontWeight="800"
        fontSize="40"
        fill="#ffffff"
      >
        S
      </text>
      <path d="M46 6h8v17l-4-3.4L46 23z" fill="#c08a3e" />
    </svg>
  );
}
