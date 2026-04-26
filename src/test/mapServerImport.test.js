import { describe, expect, it } from "vitest";

import {
  mapImportPayloadToTransactions,
  mapServerRowToTransaction,
} from "@/lib/mapServerImport.js";

describe("mapServerImport", () => {
  it("maps accepted preview rows using normalized payload", () => {
    const result = mapImportPayloadToTransactions([
      {
        normalized: {
          amount: 1250,
          type: "income",
          category: "Income",
          description: "Salary credit",
          date: "2026-04-05T00:00:00.000Z",
        },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].iconType).toBe("receive");
    expect(result[0].name).toBe("Salary credit");
    expect(result[0].amount).toBe("₹1250");
  });

  it("falls back unknown categories to Other", () => {
    const result = mapServerRowToTransaction(
      {
        amount: 450,
        type: "expense",
        category: "MysteryCategory",
        description: "Unknown vendor",
        date: "2026-04-05T00:00:00.000Z",
      },
      0
    );

    expect(result.category).toBe("Other");
    expect(result.iconType).toBe("send");
  });
});
