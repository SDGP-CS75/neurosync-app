import {
  getDateKeyForTimeZone,
  getLocalDateKey,
} from "../../utils/dates";

describe("date utilities", () => {
  it("uses the local calendar day east of UTC", () => {
    expect(
      getDateKeyForTimeZone(
        new Date("2026-10-28T19:00:00.000Z"),
        "Asia/Kolkata"
      )
    ).toBe("2026-10-29");
  });

  it("uses the local calendar day west of UTC", () => {
    expect(
      getDateKeyForTimeZone(
        new Date("2026-10-28T02:00:00.000Z"),
        "America/Los_Angeles"
      )
    ).toBe("2026-10-27");
  });

  it("handles daylight-saving transitions", () => {
    expect(
      getDateKeyForTimeZone(
        new Date("2026-03-08T06:30:00.000Z"),
        "America/New_York"
      )
    ).toBe("2026-03-08");
    expect(
      getDateKeyForTimeZone(
        new Date("2026-11-01T04:30:00.000Z"),
        "America/New_York"
      )
    ).toBe("2026-11-01");
  });

  it("returns a stable local key for Date objects", () => {
    const date = new Date(2026, 9, 28, 23, 30);
    expect(getLocalDateKey(date)).toBe("2026-10-28");
  });
});
