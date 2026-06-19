import {pointId} from "./pointEditing";
import type {PixelPoint, PlotType} from "./types";

type Detection = {points: PixelPoint[]; note: string};

const isForeground = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 120 || (max - min > 45 && min < 235);
};

export const detectPlotPoints = (
  imageData: ImageData,
  plotType: PlotType
): Detection => {
  const cv = (window as unknown as {cv?: unknown}).cv;
  const note = cv
    ? "OpenCV.js detected; lightweight pixel fallback still used for portability."
    : "OpenCV.js unavailable; using lightweight pixel fallback.";
  return plotType === "bar"
    ? {points: detectBars(imageData), note}
    : {points: detectXY(imageData), note};
};

const detectXY = ({data, width, height}: ImageData): PixelPoint[] => {
  const columns = new Map<number, number[]>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (isForeground(data[i], data[i + 1], data[i + 2])) {
        const ys = columns.get(x) ?? [];
        ys.push(y);
        columns.set(x, ys);
      }
    }
  }
  const step = Math.max(1, Math.floor(width / 180));
  const points: PixelPoint[] = [];
  for (let x = 0; x < width; x += step) {
    const ys = columns.get(x);
    if (!ys || ys.length < 2 || ys.length > height * 0.35) continue;
    ys.sort((a, b) => a - b);
    points.push({
      id: pointId(),
      series: "series 1",
      px: x,
      py: ys[Math.floor(ys.length / 2)]
    });
  }
  return simplify(points, 260);
};

const detectBars = ({data, width, height}: ImageData): PixelPoint[] => {
  const active: number[] = [];
  for (let x = 0; x < width; x += 1) {
    let count = 0;
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * 4;
      if (isForeground(data[i], data[i + 1], data[i + 2])) count += 1;
    }
    if (count > height * 0.08 && count < height * 0.8) active.push(x);
  }
  const groups: number[][] = [];
  active.forEach(x => {
    const last = groups.at(-1);
    if (!last || x - last.at(-1)! > 2) groups.push([x]);
    else last.push(x);
  });
  return groups
    .filter(group => group.length > 4)
    .slice(0, 80)
    .map((group, index) => {
      const mid = Math.round((group[0] + group.at(-1)!) / 2);
      let top = height;
      for (const x of group) {
        for (let y = 0; y < height; y += 1) {
          const i = (y * width + x) * 4;
          if (isForeground(data[i], data[i + 1], data[i + 2]))
            top = Math.min(top, y);
        }
      }
      return {
        id: pointId(),
        series: "bars",
        label: String(index + 1),
        px: mid,
        py: top
      };
    });
};

const simplify = (points: PixelPoint[], max: number) => {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  return points.filter((_, index) => index % step === 0);
};
