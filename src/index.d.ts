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

declare const Grapher: React.ComponentType<GrapherProps>;
declare const MultiGrapher: React.ComponentType<MultiGrapherProps>;

export { Grapher, MultiGrapher };
export default Grapher; 