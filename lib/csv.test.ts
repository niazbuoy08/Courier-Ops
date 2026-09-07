import { describe, expect, it } from "vitest";
import { toCsv, type CsvColumn } from "./csv";

interface Row {
  id: string;
  label: string;
  weight: number;
  flagged: boolean;
  note: string | null;
}

const columns: CsvColumn<Row>[] = [
  { header: "ID", value: (r) => r.id },
  { header: "Label", value: (r) => r.label },
  { header: "Weight", value: (r) => r.weight },
  { header: "Flagged", value: (r) => r.flagged },
  { header: "Note", value: (r) => r.note },
];

describe("toCsv", () => {
  it("emits a header row even with no data", () => {
    expect(toCsv([], columns)).toBe("ID,Label,Weight,Flagged,Note");
  });

  it("serializes plain values without quoting", () => {
    const csv = toCsv(
      [{ id: "CX1", label: "Box", weight: 2.5, flagged: true, note: null }],
      columns,
    );
    expect(csv.split("\r\n")).toEqual([
      "ID,Label,Weight,Flagged,Note",
      "CX1,Box,2.5,true,",
    ]);
  });

  it("quotes cells containing a comma, quote, or newline and doubles quotes", () => {
    const csv = toCsv(
      [
        {
          id: "CX2",
          label: 'Big, "fragile" box',
          weight: 1,
          flagged: false,
          note: "line1\nline2",
        },
      ],
      columns,
    );
    const dataRow = csv.split("\r\n")[1];
    expect(dataRow).toBe('CX2,"Big, ""fragile"" box",1,false,"line1\nline2"');
  });

  it("renders null and undefined as empty cells", () => {
    const csv = toCsv(
      [{ id: "CX3", label: "", weight: 0, flagged: false, note: null }],
      columns,
    );
    expect(csv.split("\r\n")[1]).toBe("CX3,,0,false,");
  });
});
