"use client";

import { PrintIcon } from "./icons";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary no-print">
      <PrintIcon /> Print / save PDF
    </button>
  );
}
