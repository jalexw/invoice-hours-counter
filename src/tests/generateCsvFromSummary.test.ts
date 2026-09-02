import { describe, test, expect } from "bun:test";
import generateCsvFromSummary, {
  escapeCsvField,
} from "@/lib/generateCsvFromSummary";
import type { ISummaryGenerationResult } from "@/lib/summarizeHours";

describe("escapeCsvField", () => {
  test("wraps values in double quotes", () => {
    expect(escapeCsvField("hello")).toBe('"hello"');
  });
  test("escapes embedded double quotes by doubling them", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });
});

describe("generateCsvFromSummary", () => {
  test("produces a header row and one row per event", () => {
    const summary: ISummaryGenerationResult = {
      sum: 1.5,
      events: [
        {
          id: "1",
          description: "Kickoff",
          durationHours: 1,
          startTime: new Date(Date.UTC(2025, 10, 17, 12, 0, 0)),
        },
        {
          id: "2",
          description: "Review",
          durationHours: 0.5,
          startTime: new Date(Date.UTC(2025, 10, 18, 12, 0, 0)),
        },
      ],
    };
    expect(generateCsvFromSummary(summary)).toBe(
      [
        '"Date","Description","Hours"',
        '2025-11-17T12:00:00.000Z,"Kickoff",1',
        '2025-11-18T12:00:00.000Z,"Review",0.5',
      ].join("\n"),
    );
  });

  test("escapes descriptions containing quotes and commas", () => {
    const summary: ISummaryGenerationResult = {
      sum: 1,
      events: [
        {
          id: "1",
          description: 'Call with "Bob", then review',
          durationHours: 1,
          startTime: new Date(Date.UTC(2025, 10, 17, 12, 0, 0)),
        },
      ],
    };
    const lines: string[] = generateCsvFromSummary(summary).split("\n");
    expect(lines[1]).toBe(
      '2025-11-17T12:00:00.000Z,"Call with ""Bob"", then review",1',
    );
  });

  test("does not throw for invalid dates or non-finite hours", () => {
    const summary: ISummaryGenerationResult = {
      sum: 0,
      events: [
        {
          id: "1",
          description: "Broken",
          durationHours: Number.NaN,
          startTime: new Date(Number.NaN),
        },
      ],
    };
    const lines: string[] = generateCsvFromSummary(summary).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(',"Broken",0');
  });

  test("returns only the header for an empty summary", () => {
    expect(generateCsvFromSummary({ sum: 0, events: [] })).toBe(
      '"Date","Description","Hours"',
    );
  });
});
