"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadIncidentReportPDF(report) {
  const { alert, playbookSteps, generatedAt, generatedBy } = report.snapshot;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header / branding
  doc.setFillColor(11, 15, 20);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("SentinelX", 14, 17);
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Identity Threat Detection & Response Platform", 14, 23);

  y = 38;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(`Incident Report: ${alert.title}`, 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Report ID: ${report.reportId}   |   Alert ID: ${alert.alertId}`, 14, y);
  y += 5;
  doc.text(`Generated: ${new Date(generatedAt).toLocaleString()} by ${generatedBy.name} (${generatedBy.role})`, 14, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Field", "Value"]],
    body: [
      ["Severity", alert.severity],
      ["Status", alert.status],
      ["Detection Type", alert.detectionType],
      ["Risk Score", `${alert.riskScore} / 100`],
      ["Affected User", alert.username || "-"],
      ["Source IP", alert.sourceIP || "-"],
      ["Timestamp", new Date(alert.timestamp).toLocaleString()],
      ["MITRE Technique", `${alert.mitreTechniqueId} - ${alert.mitreTechniqueName}`],
      ["False Positive Reason", alert.falsePositiveReason || "N/A"],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 24, 35] },
  });

  y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Description", 14, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  const descLines = doc.splitTextToSize(alert.description, pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4.5 + 6;

  if (alert.riskFactors?.length) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Risk Score Breakdown", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y + 3,
      theme: "striped",
      head: [["Factor", "Points"]],
      body: alert.riskFactors.map((f) => [f.factor, `+${f.points}`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 24, 35] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (alert.evidence?.length) {
    if (y > 240) { doc.addPage(); y = 18; }
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Attack Timeline / Evidence", 14, y);
    autoTable(doc, {
      startY: y + 3,
      theme: "striped",
      head: [["Time", "Event Type", "Result", "Source IP"]],
      body: alert.evidence
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((e) => [new Date(e.timestamp).toLocaleString(), e.eventType, e.result, e.sourceIP || "-"]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 35] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (alert.investigationNotes?.length) {
    if (y > 240) { doc.addPage(); y = 18; }
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Investigation Notes", 14, y);
    autoTable(doc, {
      startY: y + 3,
      theme: "striped",
      head: [["Author", "Note", "Date"]],
      body: alert.investigationNotes.map((n) => [n.author?.name || "-", n.note, new Date(n.createdAt).toLocaleString()]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 35] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (playbookSteps?.length) {
    if (y > 230) { doc.addPage(); y = 18; }
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Recommended Response Actions (Playbook)", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    playbookSteps.forEach((step, i) => {
      if (y > 280) { doc.addPage(); y = 18; }
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 1.5;
    });
  }

  doc.save(`${report.reportId}.pdf`);
}
