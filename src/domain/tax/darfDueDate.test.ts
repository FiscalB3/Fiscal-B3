import { describe, expect, it } from "vitest";
import { darfDueDate } from "./darfDueDate";

describe("darfDueDate", () => {
  it("returns last calendar day of following month when it is a weekday", () => {
    // 2024-03 → April 2024 ends on Tuesday 30
    expect(darfDueDate("2024-03")).toBe("2024-04-30");
  });

  it("rolls back from Sunday to Friday", () => {
    // 2024-05 → June 2024 ends on Sunday 30 → Friday 28
    expect(darfDueDate("2024-05")).toBe("2024-06-28");
  });

  it("rolls back from Saturday to Friday", () => {
    // 2023-08 → September 2023 ends on Saturday 30 → Friday 29
    expect(darfDueDate("2023-08")).toBe("2023-09-29");
  });

  it("crosses year boundary", () => {
    // 2024-12 → January 2025 ends on Friday 31
    expect(darfDueDate("2024-12")).toBe("2025-01-31");
  });

  it("rejects invalid month", () => {
    expect(() => darfDueDate("2024/03")).toThrow("month must be YYYY-MM");
  });
});
