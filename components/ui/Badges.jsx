const SEVERITY_CLASS = {
  CRITICAL: "sx-badge-critical",
  HIGH: "sx-badge-high",
  MEDIUM: "sx-badge-medium",
  LOW: "sx-badge-low",
  INFO: "sx-badge-info",
};

const STATUS_CLASS = {
  NEW: "sx-badge-info",
  IN_REVIEW: "sx-badge-medium",
  INVESTIGATING: "sx-badge-medium",
  TRUE_POSITIVE: "sx-badge-critical",
  FALSE_POSITIVE: "sx-badge-neutral",
  RESOLVED: "sx-badge-low",
  CLOSED: "sx-badge-neutral",
};

export function SeverityBadge({ severity }) {
  return <span className={`sx-badge ${SEVERITY_CLASS[severity] || "sx-badge-neutral"}`}>{severity}</span>;
}

export function StatusBadge({ status }) {
  return (
    <span className={`sx-badge ${STATUS_CLASS[status] || "sx-badge-neutral"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
