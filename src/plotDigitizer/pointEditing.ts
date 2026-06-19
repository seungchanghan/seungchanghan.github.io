import type {PixelPoint} from "./types";

export const pointId = () =>
  crypto.randomUUID?.() ?? String(Date.now() + Math.random());

export const nearestPoint = (
  points: PixelPoint[],
  px: number,
  py: number,
  radius = 10
) => points.find(point => Math.hypot(point.px - px, point.py - py) <= radius);

export const pointsInRect = (
  points: PixelPoint[],
  rect: {x1: number; y1: number; x2: number; y2: number}
) => {
  const x1 = Math.min(rect.x1, rect.x2);
  const x2 = Math.max(rect.x1, rect.x2);
  const y1 = Math.min(rect.y1, rect.y2);
  const y2 = Math.max(rect.y1, rect.y2);
  return points.filter(
    point =>
      point.px >= x1 && point.px <= x2 && point.py >= y1 && point.py <= y2
  );
};
