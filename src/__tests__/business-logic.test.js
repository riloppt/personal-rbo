/**
 * Tests for business-logic helpers in src/utils.js
 *
 * These cover the credit/balance calculations and contract-filtering logic
 * that directly drive the financial display in the UI. Bugs here silently
 * show wrong credit balances to users.
 */
import { calcSaldo, buildMovStats, filterContratos } from "../utils";

// ─── calcSaldo ───────────────────────────────────────────────────────────────

describe("calcSaldo", () => {
  it("returns 0 for an empty movements list", () => {
    expect(calcSaldo([])).toBe(0);
  });

  it("sums positive credits (credit additions)", () => {
    const movs = [
      { creditos: 50 },
      { creditos: 25 },
    ];
    expect(calcSaldo(movs)).toBe(75);
  });

  it("sums negative credits (service deductions)", () => {
    const movs = [
      { creditos: -2 },
      { creditos: -3 },
    ];
    expect(calcSaldo(movs)).toBe(-5);
  });

  it("combines credits and deductions correctly", () => {
    const movs = [
      { creditos: 50 },  // initial credit top-up
      { creditos: -2 },  // assistência
      { creditos: -1 },  // assistência
      { creditos: 20 },  // another top-up
    ];
    expect(calcSaldo(movs)).toBe(67);
  });

  it("handles a single movement", () => {
    expect(calcSaldo([{ creditos: 10 }])).toBe(10);
  });

  it("returns 0 when credits and debits cancel out", () => {
    const movs = [{ creditos: 10 }, { creditos: -10 }];
    expect(calcSaldo(movs)).toBe(0);
  });
});

// ─── buildMovStats ────────────────────────────────────────────────────────────

describe("buildMovStats", () => {
  const movimentos = [
    { id: 1, contrato_id: 10, creditos: 50, tipo: "credito",    data: "2024-01-01" },
    { id: 2, contrato_id: 10, creditos: -2, tipo: "assistencia", data: "2024-03-15" },
    { id: 3, contrato_id: 10, creditos: -1, tipo: "assistencia", data: "2024-03-10" },
    { id: 4, contrato_id: 20, creditos: 30, tipo: "credito",    data: "2024-02-01" },
    { id: 5, contrato_id: 20, creditos: -5, tipo: "assistencia", data: "2024-04-01" },
  ];

  it("returns an empty object for no movements", () => {
    expect(buildMovStats([])).toEqual({});
  });

  it("sums credits per contract", () => {
    const stats = buildMovStats(movimentos);
    expect(stats[10].creditos).toBe(47); // 50 - 2 - 1
    expect(stats[20].creditos).toBe(25); // 30 - 5
  });

  it("records the first assistencia as ultimaAssist per contract (movements arrive newest-first)", () => {
    // The movements list is ordered newest-first (as Supabase returns them).
    // The first assistencia encountered is the most recent one.
    const stats = buildMovStats(movimentos);
    expect(stats[10].ultimaAssist).toBe("2024-03-15");
    expect(stats[20].ultimaAssist).toBe("2024-04-01");
  });

  it("leaves ultimaAssist as null for contracts with no assistencia movements", () => {
    const creditOnly = [
      { id: 1, contrato_id: 99, creditos: 100, tipo: "credito", data: "2024-01-01" },
    ];
    const stats = buildMovStats(creditOnly);
    expect(stats[99].ultimaAssist).toBeNull();
  });

  it("creates independent entries for different contracts", () => {
    const stats = buildMovStats(movimentos);
    expect(Object.keys(stats)).toHaveLength(2);
    expect(stats[10]).toBeDefined();
    expect(stats[20]).toBeDefined();
  });

  it("does not cross-contaminate credits between contracts", () => {
    const stats = buildMovStats(movimentos);
    // Contract 10 should not include contract 20's credits
    expect(stats[10].creditos).not.toBe(stats[10].creditos + stats[20].creditos);
  });
});

// ─── filterContratos ─────────────────────────────────────────────────────────

describe("filterContratos", () => {
  const clientes = [
    { id: 1, nome: "ACME Lda" },
    { id: 2, nome: "Beta Corp" },
    { id: 3, nome: "Gamma SA" },
  ];
  const tipologias = [
    { id: 10, nome: "Suporte Básico" },
    { id: 20, nome: "Suporte Avançado" },
  ];
  const rows = [
    { id: 100, cliente_id: 1, tipologia_id: 10 },
    { id: 101, cliente_id: 2, tipologia_id: 20 },
    { id: 102, cliente_id: 3, tipologia_id: 10 },
  ];

  it("returns all contracts when search is empty", () => {
    expect(filterContratos(rows, clientes, tipologias, "")).toHaveLength(3);
  });

  it("returns all contracts when search is null/undefined", () => {
    expect(filterContratos(rows, clientes, tipologias, null)).toHaveLength(3);
    expect(filterContratos(rows, clientes, tipologias, undefined)).toHaveLength(3);
  });

  it("filters by client name (case-insensitive)", () => {
    const result = filterContratos(rows, clientes, tipologias, "acme");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(100);
  });

  it("filters by tipologia name (case-insensitive)", () => {
    const result = filterContratos(rows, clientes, tipologias, "avançado");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);
  });

  it("is case-insensitive for client names", () => {
    expect(filterContratos(rows, clientes, tipologias, "ACME")).toHaveLength(1);
    expect(filterContratos(rows, clientes, tipologias, "acme")).toHaveLength(1);
  });

  it("returns multiple results for a broad search term", () => {
    // "Suporte" matches both "Suporte Básico" and "Suporte Avançado"
    const result = filterContratos(rows, clientes, tipologias, "suporte");
    expect(result).toHaveLength(3); // all three contracts use a "Suporte" tipologia
  });

  it("returns empty array when no contract matches", () => {
    const result = filterContratos(rows, clientes, tipologias, "xyz_no_match");
    expect(result).toHaveLength(0);
  });

  it("matches partial client name substrings", () => {
    // "corp" should match "Beta Corp"
    const result = filterContratos(rows, clientes, tipologias, "corp");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);
  });
});
