import React from 'react';

export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond';

export interface SeriesData {
  data: any[] | { observe: (callback: Function) => void } | Function;
  type?: 'values' | 'tuples' | 'objects' | 'tuple_observable' | 'object_observable' | 'infer';
  xKey?: string;
  yKey?: string;
  windXKey?: string;
  windYKey?: string;
  windComp?: React.ComponentType<{ windX: number; windY: number; speed: number; speedPercentile: number }>;
  xUnixDates?: boolean;
  color?: string | number;
  name?: string;
  unitText?: string;
  xLabel?: string;
  yLabel?: string;
  ignoreDiscontinuities?: boolean;
  dashed?: boolean;
  dashPattern?: number[];
  width?: number;
  rangeSelectorWidth?: number;
  axis?: string | object;
  expandYWith?: (number | null)[] | null;
  defaultAlwaysTooltipped?: boolean;
  followingMouseTooltip?: boolean;
  square?: boolean;
  shiftXBy?: number;
  graph?: number;
  background?: object;
  hideFromKey?: boolean;
  showIndividualPoints?: boolean;
  minPointSpacing?: number;
  rendering?: 'line' | 'bar' | 'area' | 'shadow';
  negativeColor?: string;
  negativeGradient?: string[] | [number, string][];
  zeroLineWidth?: number;
  zeroLineColor?: string;
  zeroLineY?: number | string;
  pointRadius?: number;
  pointShape?: PointShape | ((datum: unknown, index: number) => PointShape);
  pointColor?: string | ((datum: unknown, index: number) => string | null | undefined);
  tooltipWidth?: number;
  hasAreaBottom?: boolean;
  shadowColor?: string;
  gradient?: string[] | [number, string][];
  rangeKey?: string;
  cutoffTime?: number | Date | 'now';
  cutoffOpacity?: number;
}

export interface TooltipOptions {
  includeSeriesLabel?: boolean;
  includeXLabel?: boolean;
  includeYLabel?: boolean;
  includeXValue?: boolean;
  includeYValue?: boolean;
  floating?: boolean;
  alwaysFixedPosition?: boolean;
  floatPosition?: 'top' | 'bottom';
  mode?: 'nearest' | 'interpolate';
  floatDelta?: number;
  savingDisabled?: boolean;
  customTooltip?: React.ComponentType<any> | 'simple';
  combineTooltips?: boolean | number;
}

export interface CustomBoundsSelector {
  label: string;
  calculator: (globalBounds?: any) => any;
  datesOnly?: boolean;
}

export interface Annotation {
  x?: string | number | Date;
  startX?: string | number | Date;
  endX?: string | number | Date;
  series?: string[];
  content?: string;
  lineOnly?: boolean;
}

export interface DraggablePoint {
  x: number;
  y: number;
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  onClick?: (point: DraggablePoint) => void;
  onDoubleClick?: (point: DraggablePoint) => void;
}

export interface VerticalLine {
  x: number | Date;
  color?: string;
  lineTop?: number;
  width?: number;
  markTop?: boolean;
  style?: object;
  markerStyle?: object;
  text?: string;
  textPosition?: 'top' | 'bottom';
  textTop?: number;
  textHeight?: number;
  textGapPadding?: number;
  lineGapAroundText?: boolean;
  textStyle?: object;
  minPixelX?: number;
  maxPixelX?: number;
  datesOnly?: boolean;
  onRangeGraph?: boolean | object;
  onRangeGraphOnly?: boolean;
}

export interface XAxisTick {
  x: number | Date;
  label: React.ReactNode;
  skipGrid?: boolean;
}

export type XAxisTicksCalculator = (args: {
  minX: number;
  maxX: number;
  dates: boolean;
  elementWidth: number;
  elementHeight: number;
  clockStyle?: '12h' | '24h';
  timeZone?: string;
}) => XAxisTick[];

export type YAxisTick = number | {
  y: number;
  label: React.ReactNode;
  skipGrid?: boolean;
};

export type YAxisTicksCalculator = (args: {
  minY: number;
  maxY: number;
  axis: any;
}) => YAxisTick[];

export interface GrapherProps {
  series: SeriesData[];

  id?: string;
  webgl?: boolean;
  requireWASM?: boolean;
  checkIntersection?: boolean;

  onAxisChange?: (axes: any) => void;
  onRenderTime?: (time: number) => void;
  exportStateController?: (controller: any) => void;
  onPointDrag?: (point: any) => void;
  onDraggablePointsDoubleClick?: (point: any) => void;
  onPointClick?: (point: any) => void;
  timingFrameCount?: number;

  stateControllerInitialization?: any;
  syncPool?: any;
  dragPositionYOffset?: number;

  preset?: 'simple';
  theme?: 'day' | 'night' | 'export' | 'simple';
  title?: string;
  fullscreen?: boolean;
  bodyHeight?: number;
  height?: number | string;
  width?: number | string;

  showAxes?: boolean;
  showRangeGraph?: boolean;
  showRangeSelectors?: boolean;
  showSeriesKey?: boolean;
  showTooltips?: boolean;
  showContextMenu?: boolean;
  showGrid?: boolean;
  showAxisColors?: boolean;
  bigLabels?: boolean;

  xTickUnit?: 'year';
  formatXAxisLabel?: (value: any) => string;
  xAxisTicks?: 'auto' | 'compact-time' | XAxisTick[] | XAxisTicksCalculator;
  yAxisTicks?: 'auto' | 'temperature-f' | 'temperature-c' | YAxisTick[] | YAxisTicksCalculator;
  xAxisIntegersOnly?: boolean;
  clockStyle?: '12h' | '24h';
  timeZone?: string;
  markRangeGraphDates?: boolean;

  boundsSelectionEnabled?: boolean;
  customBoundsSelectors?: CustomBoundsSelector[];
  customBoundsSelectorsOnly?: boolean;
  sidebarEnabled?: boolean;
  defaultBoundsCalculator?: string;

  percentile?: number;
  defaultShowAnnotations?: boolean;
  defaultShowOptions?: boolean;
  defaultShowIndividualPoints?: boolean;
  defaultShowSidebar?: boolean;
  defaultLineWidth?: number;
  roundedLines?: boolean;

  tooltipOptions?: TooltipOptions;
  annotations?: Annotation[];
  draggablePoints?: DraggablePoint[];
  verticalLines?: VerticalLine[];
  markCurrentTime?: boolean | Partial<VerticalLine>;
  currentTime?: number | Date;
}

export interface MultiGrapherProps extends GrapherProps {
  syncBounds?: boolean;
  syncTooltips?: boolean;
  newUpperEnabled?: boolean;
  onMultiseriesChange?: (series: any[]) => void;
}

export interface RangeSelectionProps {
  stateController: any;
  customBoundsSelectors?: CustomBoundsSelector[];
  customBoundsSelectorsOnly?: boolean;
  sidebarEnabled?: boolean;
}

export interface SyncPoolOptions {
  syncBounds?: boolean;
  syncTooltips?: boolean | 'onShift';
  syncDragState?: boolean;
}

declare const Grapher: React.ComponentType<GrapherProps>;
declare const MultiGrapher: React.ComponentType<MultiGrapherProps>;
declare const RangeSelection: React.ComponentType<RangeSelectionProps>;
declare const SyncPool: {
  new (options?: SyncPoolOptions): any;
};

export const AVAILABLE_COLORS: string[];
export const BUILT_IN_BOUND_CALCULATORS: Record<string, (globalBounds?: any) => any>;

export { Grapher, MultiGrapher, RangeSelection, SyncPool };
export default Grapher;
