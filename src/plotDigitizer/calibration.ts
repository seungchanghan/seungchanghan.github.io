import type {Calibration, DataPoint, PixelPoint, PlotType} from "./types";

export const emptyCalibration = (): Calibration => ({
  x: {v1: 0, v2: 1},
  y: {v1: 0, v2: 1}
});

const mapAxis = (
  value: number,
  a?: PixelPoint,
  b?: PixelPoint,
  av = 0,
  bv = 1
) => {
  if (!a || !b || Math.abs(b.px - a.px + b.py - a.py) < 0.0001) return value;
  const pixelDelta =
    Math.abs(b.px - a.px) >= Math.abs(b.py - a.py) ? b.px - a.px : b.py - a.py;
  const pixelValue =
    Math.abs(b.px - a.px) >= Math.abs(b.py - a.py)
      ? value - a.px
      : value - a.py;
  return av + (pixelValue / pixelDelta) * (bv - av);
};

export const toDataPoint = (
  point: PixelPoint,
  calibration: Calibration,
  plotType: PlotType
): DataPoint => {
  const x = mapAxis(
    point.px,
    calibration.x.p1,
    calibration.x.p2,
    calibration.x.v1,
    calibration.x.v2
  );
  const y = mapAxis(
    point.py,
    calibration.y.p1,
    calibration.y.p2,
    calibration.y.v1,
    calibration.y.v2
  );
  return plotType === "bar"
    ? {series: point.series, x, y, label: point.label ?? point.id}
    : {series: point.series, x, y};
};

export const dataToPixel = (
  x: number,
  y: number,
  calibration: Calibration,
  fallback: PixelPoint
): PixelPoint => {
  const invert = (
    value: number,
    a?: PixelPoint,
    b?: PixelPoint,
    av = 0,
    bv = 1,
    axis: "x" | "y" = "x"
  ) => {
    if (!a || !b || Math.abs(bv - av) < 0.0001)
      return axis === "x" ? fallback.px : fallback.py;
    const start = axis === "x" ? a.px : a.py;
    const end = axis === "x" ? b.px : b.py;
    return start + ((value - av) / (bv - av)) * (end - start);
  };
  return {
    ...fallback,
    px: invert(
      x,
      calibration.x.p1,
      calibration.x.p2,
      calibration.x.v1,
      calibration.x.v2,
      "x"
    ),
    py: invert(
      y,
      calibration.y.p1,
      calibration.y.p2,
      calibration.y.v1,
      calibration.y.v2,
      "y"
    )
  };
};
