import type {DataPoint, PlotType} from "./types";

const clean = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

export const makeCsv = (points: DataPoint[], plotType: PlotType) => {
  const rows =
    plotType === "bar"
      ? [
          ["label/index", "value"],
          ...points.map((p, i) => [p.label ?? i + 1, p.y])
        ]
      : [["series", "x", "y"], ...points.map(p => [p.series, p.x, p.y])];
  return rows.map(row => row.map(clean).join(",")).join("\n");
};

export const downloadCsv = (csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], {type: "text/csv"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "digitized-plot.csv";
  link.click();
  URL.revokeObjectURL(url);
};
