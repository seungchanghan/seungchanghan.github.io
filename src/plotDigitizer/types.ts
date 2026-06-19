export type PlotType = "xy" | "bar";

export type PixelPoint = {
  id: string;
  series: string;
  px: number;
  py: number;
  selected?: boolean;
  label?: string;
};

export type DataPoint = {
  series: string;
  x: number;
  y: number;
  label?: string;
};

export type AxisCalibration = {
  p1?: PixelPoint;
  p2?: PixelPoint;
  v1: number;
  v2: number;
};

export type Calibration = {
  x: AxisCalibration;
  y: AxisCalibration;
};

export type Series = {
  id: string;
  name: string;
  points: PixelPoint[];
};
