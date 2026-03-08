/**
 * Tests for pure utility functions in src/utils.js
 *
 * These functions were previously buried inside App.js and untestable.
 * Extracting them to utils.js lets us verify correctness in isolation,
 * catching regressions before they affect the UI.
 */
import {
  fmtDate,
  fmtDateTime,
  qrUrl,
  calcDuration,
  buildReportHtml,
  calcSaldo,
  buildMovStats,
  filterContratos,
} from "../utils";

// ─── fmtDate ─────────────────────────────────────────────────────────────────

describe("fmtDate", () => {
  it("formats a YYYY-MM-DD string using pt-PT locale", () => {
    // pt-PT locale formats as DD/MM/YYYY
    expect(fmtDate("2024-03-15")).toBe("15/03/2024");
  });

  it("returns an em-dash for null input", () => {
    expect(fmtDate(null)).toBe("—");
  });

  it("returns an em-dash for undefined input", () => {
    expect(fmtDate(undefined)).toBe("—");
  });

  it("returns an em-dash for empty string", () => {
    expect(fmtDate("")).toBe("—");
  });

  it("handles end-of-month dates correctly (no off-by-one from UTC shift)", () => {
    // Without the T00:00:00 suffix, new Date("2024-01-31") in UTC can become
    // Jan 30 in UTC-X timezones – this test guards that regression.
    const result = fmtDate("2024-01-31");
    expect(result).toBe("31/01/2024");
  });
});

// ─── fmtDateTime ─────────────────────────────────────────────────────────────

describe("fmtDateTime", () => {
  it("returns an em-dash for null input", () => {
    expect(fmtDateTime(null)).toBe("—");
  });

  it("returns an em-dash for undefined input", () => {
    expect(fmtDateTime(undefined)).toBe("—");
  });

  it("returns a non-empty string for a valid ISO timestamp", () => {
    const result = fmtDateTime("2024-03-15T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should contain the year somewhere
    expect(result).toMatch(/2024/);
  });
});

// ─── qrUrl ───────────────────────────────────────────────────────────────────

describe("qrUrl", () => {
  it("builds a qrserver.com URL", () => {
    const url = qrUrl("hello world");
    expect(url).toContain("https://api.qrserver.com/v1/create-qr-code/");
  });

  it("URL-encodes the data parameter", () => {
    const url = qrUrl("hello world");
    expect(url).toContain(encodeURIComponent("hello world"));
    // Raw spaces must not appear in the URL
    expect(url).not.toContain(" ");
  });

  it("includes size=200x200", () => {
    expect(qrUrl("test")).toContain("size=200x200");
  });

  it("encodes special characters", () => {
    const text = "Ref#42 | Empresa Lda | 15/03/2024";
    const url = qrUrl(text);
    expect(url).toContain(encodeURIComponent(text));
  });
});

// ─── calcDuration ────────────────────────────────────────────────────────────

describe("calcDuration", () => {
  it("returns em-dash when both times are missing", () => {
    expect(calcDuration(null, null)).toBe("—");
    expect(calcDuration("", "")).toBe("—");
    expect(calcDuration(undefined, undefined)).toBe("—");
  });

  it("returns em-dash when only start time is provided", () => {
    expect(calcDuration("09:00", null)).toBe("—");
  });

  it("returns em-dash when only end time is provided", () => {
    expect(calcDuration(null, "10:00")).toBe("—");
  });

  it("calculates a 1-hour duration", () => {
    expect(calcDuration("09:00", "10:00")).toBe("1h 0min");
  });

  it("calculates a 90-minute duration", () => {
    expect(calcDuration("08:30", "10:00")).toBe("1h 30min");
  });

  it("calculates a sub-hour duration", () => {
    expect(calcDuration("14:00", "14:45")).toBe("0h 45min");
  });

  it("returns em-dash when end is before start (negative duration)", () => {
    expect(calcDuration("10:00", "09:00")).toBe("—");
  });

  it("returns em-dash when start equals end", () => {
    expect(calcDuration("10:00", "10:00")).toBe("—");
  });

  it("handles midnight boundary", () => {
    expect(calcDuration("00:00", "01:00")).toBe("1h 0min");
  });
});

// ─── buildReportHtml ─────────────────────────────────────────────────────────

describe("buildReportHtml", () => {
  const baseMov = {
    id: 42,
    data: "2024-03-15",
    hora_inicio: "09:00",
    hora_fim: "10:30",
    creditos: -2,
    descritivo: "Instalação de software",
  };
  const cliente   = { nome: "ACME Lda", responsavel: "João Silva", morada: "Rua A 1", localidade: "Lisboa", telefone: "912345678" };
  const tipologia = { nome: "Suporte Avançado" };
  const tecnico   = { nome: "Carlos Ferreira" };
  const local     = { nome: "Sede do Cliente" };

  it("returns a valid HTML document string", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("embeds the movement ID in the report", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("#42");
  });

  it("embeds the client name", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("ACME Lda");
  });

  it("embeds the technician name", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("Carlos Ferreira");
  });

  it("embeds the service description", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("Instalação de software");
  });

  it("shows the calculated duration when both times are present", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    // 09:00 → 10:30 = 1h 30min
    expect(html).toContain("1h 30min");
  });

  it("shows em-dash duration when times are missing", () => {
    const movNoTime = { ...baseMov, hora_inicio: null, hora_fim: null };
    const html = buildReportHtml({ mov: movNoTime, cliente, tipologia, tecnico, local });
    // Duration cell should contain em dash
    expect(html).toMatch(/Duração[\s\S]*?—/);
  });

  it("applies 'neg' CSS class for negative credits", () => {
    const html = buildReportHtml({ mov: { ...baseMov, creditos: -2 }, cliente, tipologia, tecnico, local });
    expect(html).toContain("cred-val neg");
  });

  it("applies 'pos' CSS class for positive credits", () => {
    const html = buildReportHtml({ mov: { ...baseMov, creditos: 10 }, cliente, tipologia, tecnico, local });
    expect(html).toContain("cred-val pos");
  });

  it("handles missing optional fields gracefully", () => {
    const html = buildReportHtml({
      mov: { ...baseMov, hora_inicio: null, hora_fim: null },
      cliente: null,
      tipologia: null,
      tecnico: null,
      local: null,
    });
    expect(html).toContain("<!DOCTYPE html>");
    // Should not throw and should have em-dashes for missing values
    expect(html).toContain("—");
  });

  it("includes a QR code img tag", () => {
    const html = buildReportHtml({ mov: baseMov, cliente, tipologia, tecnico, local });
    expect(html).toContain("api.qrserver.com");
    expect(html).toContain('<img');
  });
});
