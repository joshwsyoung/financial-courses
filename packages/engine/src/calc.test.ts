import { describe, expect, it } from "vitest";
import { evaluate } from "./calc";


describe("evaluate", () => {
  it("handles precedence, powers and functions", () => {
    expect(evaluate("1 + 2 * 3", {})).toBe(7);
    expect(evaluate("2 ^ 3 ^ 2", {})).toBe(512);
    expect(evaluate("-x + sqrt(16)", { x: 1 })).toBe(3);
    expect(evaluate("round(coupon / price * 100, 2)", { coupon: 5, price: 120 })).toBe(4.17);
    expect(evaluate("fv / (1 + r) ^ n", { fv: 110, r: 0.1, n: 1 })).toBeCloseTo(100);
  });

  it("rejects unknown names and junk", () => {
    expect(() => evaluate("x + 1", {})).toThrow(/Unknown variable/);
    expect(() => evaluate("process.exit()", {})).toThrow();
    expect(() => evaluate("1 +", {})).toThrow();
  });
});

