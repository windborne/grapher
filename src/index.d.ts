import React from 'react';

export interface GrapherProps {
  id: string;
  series: any[];
  theme?: string;
  showAxes?: boolean;
  showRangeGraph?: boolean;
  showRangeSelectors?: boolean;
  showSeriesKey?: boolean;
  showTooltips?: boolean;
  boundsSelectionEnabled?: boolean;
  customBoundsSelectors?: any[];
  sidebarEnabled?: boolean;
  defaultShowAnnotations?: boolean;
  defaultShowOptions?: boolean;
  fullscreen?: boolean;
  height?: number | string;
  width?: number | string;
  title?: string;
  annotations?: any[];
  onAxisChange?: (axes: any) => void;
  onRenderTime?: (time: number) => void;
  exportStateController?: (controller: any) => void;
  stateControllerInitialization?: any;
  timingFrameCount?: number;
  percentile?: number;
  showAxisColors?: boolean;
  showGrid?: boolean;
  bigLabels?: boolean;
  defaultLineWidth?: number;
  bodyHeight?: number;
  dragPositionYOffset?: number;
  syncPool?: any;
}

export interface MultiGrapherProps extends GrapherProps {
  syncBounds?: boolean;
  syncTooltips?: boolean;
  newUpperEnabled?: boolean;
  onMultiseriesChange?: (series: any[]) => void;
}

export interface RangeSelectionProps {
  stateController: any;
  customBoundsSelectors?: any[];
  customBoundsSelectorsOnly?: boolean;
  sidebarEnabled?: boolean;
}

export interface SyncPoolOptions {
  syncBounds?: boolean;
  syncTooltips?: boolean;
  syncDragState?: boolean;
}

declare const Grapher: React.ComponentType<GrapherProps>;
declare const MultiGrapher: React.ComponentType<MultiGrapherProps>;
declare const RangeSelection: React.ComponentType<RangeSelectionProps>;
declare const SyncPool: any;

export const AVAILABLE_COLORS: string[];
export const BUILT_IN_BOUND_CALCULATORS: Record<string, (globalBounds?: any) => any>;

export { Grapher, MultiGrapher, RangeSelection, SyncPool };
export default Grapher; 