import {useEffect, useMemo, useRef, useState} from "react";
import {
  dataToPixel,
  emptyCalibration,
  toDataPoint
} from "./plotDigitizer/calibration";
import {downloadCsv, makeCsv} from "./plotDigitizer/csv";
import {detectPlotPoints} from "./plotDigitizer/cvPipeline";
import {fileToImage, imageFromClipboard} from "./plotDigitizer/imageInput";
import {
  nearestPoint,
  pointId,
  pointsInRect
} from "./plotDigitizer/pointEditing";
import type {Calibration, PixelPoint, PlotType} from "./plotDigitizer/types";

type CalKey = "x1" | "x2" | "y1" | "y2";
type DigitizerMode = "edit" | "select" | CalKey;

const calibrationSteps: {key: CalKey; label: string; valueLabel: string}[] = [
  {key: "x1", label: "1. X reference left", valueLabel: "x1 value"},
  {key: "x2", label: "2. X reference right", valueLabel: "x2 value"},
  {key: "y1", label: "3. Y reference low", valueLabel: "y1 value"},
  {key: "y2", label: "4. Y reference high", valueLabel: "y2 value"}
];

export default function PlotDigitizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rectRef = useRef<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [plotType, setPlotType] = useState<PlotType>("xy");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<PixelPoint[]>([]);
  const [calibration, setCalibration] = useState<Calibration>(emptyCalibration);
  const [mode, setMode] = useState<DigitizerMode>("edit");
  const [dragId, setDragId] = useState<string | null>(null);
  const [rect, setRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [note, setNote] = useState("Paste or upload a plot image.");

  const dataPoints = useMemo(
    () => points.map(point => toDataPoint(point, calibration, plotType)),
    [points, calibration, plotType]
  );
  const csv = useMemo(
    () => makeCsv(dataPoints, plotType),
    [dataPoints, plotType]
  );
  const selectedCount = points.filter(point => point.selected).length;

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      const next = await imageFromClipboard(event);
      if (next) loadImage(next);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const loadImage = (next: HTMLImageElement) => {
    setImage(next);
    setCalibration(emptyCalibration());
    setPoints([]);
    setNote("Image loaded. Detect points or click the plot to add points.");
    requestAnimationFrame(() => draw(next));
  };

  const draw = (target = image) => {
    const canvas = canvasRef.current;
    if (!canvas || !target) return;
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;
    canvas.getContext("2d")?.drawImage(target, 0, 0);
  };

  useEffect(() => draw(), [image]);

  const detect = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const result = detectPlotPoints(
      context.getImageData(0, 0, canvas.width, canvas.height),
      plotType
    );
    setPoints(result.points);
    setNote(`${result.points.length} points detected. ${result.note}`);
  };

  const localPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const box = svg.getBoundingClientRect();
    return {
      px: ((event.clientX - box.left) / box.width) * svg.viewBox.baseVal.width,
      py: ((event.clientY - box.top) / box.height) * svg.viewBox.baseVal.height
    };
  };

  const placeCalibration = (key: CalKey, point: PixelPoint) => {
    setCalibration(current => {
      const axis = key[0] as "x" | "y";
      return {
        ...current,
        [axis]: {...current[axis], [key[1] === "1" ? "p1" : "p2"]: point}
      };
    });
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!image) return;
    const {px, py} = localPoint(event);
    if (mode === "select") {
      const nextRect = {x1: px, y1: py, x2: px, y2: py};
      rectRef.current = nextRect;
      setRect(nextRect);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const hit = nearestPoint(points, px, py);
    if (isCalibrationMode(mode)) {
      const point = hit ?? {
        id: pointId(),
        series: plotType === "bar" ? "bars" : "series 1",
        px,
        py
      };
      if (!hit) setPoints(current => [...current, point]);
      placeCalibration(mode, point);
      setMode("edit");
      return;
    }
    if (hit) {
      setDragId(hit.id);
      setPoints(current =>
        current.map(point => ({
          ...point,
          selected: point.id === hit.id || point.selected
        }))
      );
    } else {
      setPoints(current => [
        ...current,
        {
          id: pointId(),
          series: plotType === "bar" ? "bars" : "series 1",
          label: String(current.length + 1),
          px,
          py
        }
      ]);
    }
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const {px, py} = localPoint(event);
    if (rectRef.current) {
      const nextRect = {...rectRef.current, x2: px, y2: py};
      rectRef.current = nextRect;
      setRect(nextRect);
    }
    if (dragId)
      setPoints(current =>
        current.map(point => (point.id === dragId ? {...point, px, py} : point))
      );
  };

  const onPointerUp = () => {
    if (rectRef.current) {
      const selected = new Set(
        pointsInRect(points, rectRef.current).map(point => point.id)
      );
      setPoints(current =>
        current.map(point => ({...point, selected: selected.has(point.id)}))
      );
    }
    rectRef.current = null;
    setRect(null);
    setDragId(null);
  };

  const deleteSelected = () =>
    setPoints(current => current.filter(point => !point.selected));

  const updateData = (index: number, field: "x" | "y", value: number) => {
    const current = dataPoints[index];
    setPoints(items =>
      items.map((point, i) =>
        i === index
          ? dataToPixel(
              field === "x" ? value : current.x,
              field === "y" ? value : current.y,
              calibration,
              point
            )
          : point
      )
    );
  };

  return (
    <div className="digitizer-tool">
      <div className="digitizer-toolbar control-panel">
        <label className="digitizer-upload">
          <span>Upload image</span>
          <input
            type="file"
            accept="image/*"
            onChange={event =>
              event.target.files?.[0] &&
              fileToImage(event.target.files[0]).then(loadImage)
            }
          />
        </label>
        <label className="digitizer-type">
          Type
          <select
            value={plotType}
            onChange={event => setPlotType(event.target.value as PlotType)}
          >
            <option value="xy">xy</option>
            <option value="bar">bar</option>
          </select>
        </label>
        <button type="button" onClick={detect} disabled={!image}>
          Auto-detect
        </button>
        <button type="button" onClick={deleteSelected}>
          Delete selected
        </button>
        <div className="digitizer-mode-switch" aria-label="Editing mode">
          <button
            type="button"
            className={mode === "edit" ? "active" : ""}
            onClick={() => setMode("edit")}
          >
            Edit points
          </button>
          <button
            type="button"
            className={mode === "select" ? "active" : ""}
            onClick={() => setMode("select")}
          >
            Select box
          </button>
        </div>
        <div className="digitizer-status" aria-live="polite">
          <span>{points.length} pts</span>
          <span>{selectedCount} selected</span>
        </div>
      </div>

      <div className="digitizer-grid">
        <div className="digitizer-stage results-panel">
          {!image && (
            <div className="digitizer-empty">
              <strong>Paste or upload a plot image</strong>
              <span>Ctrl+V works from the clipboard.</span>
            </div>
          )}
          {image && (
            <div className="digitizer-stage-tip">
              {mode === "select"
                ? "Drag a box around points to select them."
                : isCalibrationMode(mode)
                  ? `Click the ${mode.toUpperCase()} reference point on the plot.`
                  : "Click to add. Drag points to move."}
            </div>
          )}
          <canvas ref={canvasRef} />
          {image && (
            <svg
              className={`digitizer-overlay mode-${mode}`}
              viewBox={`0 0 ${image.naturalWidth} ${image.naturalHeight}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {points.map(point => (
                <circle
                  key={point.id}
                  cx={point.px}
                  cy={point.py}
                  r="5"
                  className={point.selected ? "selected" : ""}
                />
              ))}
              {calibrationSteps.map(step => {
                const axis = step.key[0] as "x" | "y";
                const point =
                  calibration[axis][step.key[1] === "1" ? "p1" : "p2"];
                return point ? (
                  <g className="calibration-marker" key={step.key}>
                    <rect
                      x={point.px - 7}
                      y={point.py - 7}
                      width="14"
                      height="14"
                    />
                    <text x={point.px + 10} y={point.py - 10}>
                      {step.key.toUpperCase()}
                    </text>
                  </g>
                ) : null;
              })}
              {rect && (
                <rect
                  x={Math.min(rect.x1, rect.x2)}
                  y={Math.min(rect.y1, rect.y2)}
                  width={Math.abs(rect.x2 - rect.x1)}
                  height={Math.abs(rect.y2 - rect.y1)}
                />
              )}
            </svg>
          )}
        </div>

        <div className="digitizer-side control-panel">
          <div className="digitizer-panel-heading">
            <p className="eyebrow">Calibration</p>
            <strong>Reference points</strong>
          </div>
          <p className="model-note">{note}</p>
          <div className="digitizer-calibration">
            {calibrationSteps.map(step => (
              <div className="calibration-step" key={step.key}>
                <button
                  type="button"
                  className={mode === step.key ? "active" : ""}
                  onClick={() => setMode(step.key)}
                >
                  {step.label}
                </button>
                <label>
                  {step.valueLabel}
                  <input
                    type="number"
                    value={
                      step.key === "x1"
                        ? calibration.x.v1
                        : step.key === "x2"
                          ? calibration.x.v2
                          : step.key === "y1"
                            ? calibration.y.v1
                            : calibration.y.v2
                    }
                    onChange={event => {
                      const value = Number(event.target.value);
                      setCalibration(current =>
                        step.key === "x1"
                          ? {...current, x: {...current.x, v1: value}}
                          : step.key === "x2"
                            ? {...current, x: {...current.x, v2: value}}
                            : step.key === "y1"
                              ? {...current, y: {...current.y, v1: value}}
                              : {...current, y: {...current.y, v2: value}}
                      );
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <p className="digitizer-hint">
            Use Select box, drag over points, then Delete selected.
          </p>
          <div className="digitizer-actions">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(csv)}
            >
              Copy CSV
            </button>
            <button type="button" onClick={() => downloadCsv(csv)}>
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="digitizer-table results-panel">
        <div className="digitizer-table-head">
          <div>
            <p className="eyebrow">Data</p>
            <strong>CSV preview</strong>
          </div>
          <span>{dataPoints.length} rows</span>
        </div>
        <table>
          <thead>
            <tr>
              {plotType === "bar" ? (
                <>
                  <th>label/index</th>
                  <th>value</th>
                </>
              ) : (
                <>
                  <th>series</th>
                  <th>x</th>
                  <th>y</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((point, index) => (
              <tr key={`${point.series}-${index}`}>
                {plotType === "bar" ? (
                  <>
                    <td>{point.label ?? index + 1}</td>
                    <td>
                      <input
                        value={round(point.y)}
                        onChange={event =>
                          updateData(index, "y", Number(event.target.value))
                        }
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>{point.series}</td>
                    <td>
                      <input
                        value={round(point.x)}
                        onChange={event =>
                          updateData(index, "x", Number(event.target.value))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={round(point.y)}
                        onChange={event =>
                          updateData(index, "y", Number(event.target.value))
                        }
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const round = (value: number) =>
  Number.isFinite(value) ? Number(value.toFixed(6)) : 0;

const isCalibrationMode = (mode: DigitizerMode): mode is CalKey =>
  mode === "x1" || mode === "x2" || mode === "y1" || mode === "y2";
