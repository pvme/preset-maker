export const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#2b241d",
      color: "#f4e7c8",
      border: "1px solid rgba(193, 163, 98, 0.45)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
      fontSize: "0.9rem",
      fontWeight: 600,
      lineHeight: 1.1,
      px: 1.5,
      py: 0.75,
      borderRadius: "3px",
      backgroundImage: "var(--preset-extras-bg)",
    },
  },
  arrow: {
    sx: {
      color: "#2b241d",
      "&::before": {
        border: "1px solid rgba(193, 163, 98, 0.45)",
        boxSizing: "border-box",
      },
    },
  },
} as const;
