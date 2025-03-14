import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import CustomPropTypes from './helpers/custom_prop_types';
import GraphBody from './components/graph_body';
import './grapher.scss';
import XAxis from './components/x_axis';
import YAxis from './components/y_axis';
import RangeSelection from './components/range_selection';
import RangeGraph from './components/range_graph';
import SeriesKey from './components/series_key';
import {Y_AXIS_WIDTH} from './helpers/axis_sizes';
import GraphTitle from './components/graph_title';
import {LINE_COLORS} from './helpers/colors';
import StateController from './state/state_controller';
import {useDraggingY, useLeftAxes, useRightAxes, useShowingSidebar, useTheme} from './state/hooks';
import Sidebar from './components/sidebar';
import SyncPool from './state/sync_pool.js';
import BOUND_CALCULATORS from './state/bound_calculators.js';

function calculateClassNamesAndStyles(props, { draggingY, theme }) {
    const { fullscreen, height, width } = props;

    const classNames = [
        'grapher',
        `grapher-${theme}`
    ];

    const styles = {};

    if (draggingY) {
        classNames.push('grapher-dragging-y');
    }

    if (fullscreen) {
        classNames.push('grapher-fullscreen');
        classNames.push('grapher-fixed-height');
    } else if (height) {
        classNames.push('grapher-fixed-height');
        if (typeof height === 'number') {
            styles.height = height - 20;
        } else {
            styles.height = `calc(${height} - 20px)`;
        }
    }

    if (width) {
        styles.width = width;
    }

    return {
        styles,
        classNames
    };
}

export default React.memo(Grapher);

const grapherDefaultProps = {
    theme: 'night',
    showAxes: true,
    showRangeGraph: true,
    showRangeSelectors: true,
    showSeriesKey: true,
    showTooltips: true,
    boundsSelectionEnabled: true,
    customBoundsSelectors: [],
    sidebarEnabled: false,
    defaultShowAnnotations: true,
    defaultShowOptions: true
};

function Grapher(props) {
    props = {...grapherDefaultProps, ...props};

    const stateController = useMemo(() => new StateController({
        grapherID: props.id,
        ...props,
        ...props.stateControllerInitialization
    }), []);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            window.stateController = stateController;
        }

        return () => {
            stateController.dispose();
        };
    }, [stateController]);

    useEffect(() => {
        props.exportStateController && props.exportStateController(stateController);
    }, [stateController, props.exportStateController]);

    useEffect(() => {
        stateController.timingFrameCount = props.timingFrameCount;
    }, [stateController, props.timingFrameCount]);

    useEffect(() => {
        props.onRenderTime && stateController.on('render_time', props.onRenderTime);

        return () => {
            props.onRenderTime && stateController.off('render_time', props.onRenderTime);
        };
    }, [stateController, props.onRenderTime]);

    useEffect(() => {
        stateController.setSeries(props.series);
    }, [stateController, props.series]);

    useEffect(() => {
        stateController.theme = props.theme;
    }, [stateController, props.theme]);

    const theme = useTheme(stateController);
    const bigLabels = props.bigLabels || theme === 'export';

    const defaultLineWidth = props.defaultLineWidth || (theme === 'export' ?  3 : undefined);
    useEffect(() => {
        stateController.defaultLineWidth = defaultLineWidth;
    }, [stateController, defaultLineWidth]);

    useEffect(() => {
        stateController.percentile = props.percentile;
    }, [stateController, props.percentile]);

    useEffect(() => {
        stateController.customBoundsSelectors = props.customBoundsSelectors;
    }, [stateController, props.customBoundsSelectors]);

    useEffect(() => {
        stateController.annotations = props.annotations;
    }, [stateController, props.annotations]);

    useEffect(() => {
        if (!props.onAxisChange) {
            return () => {};
        }

        stateController.on('exported_axes_changed', props.onAxisChange);
        return () => {
            stateController.off('exported_axes_changed', props.onAxisChange);
        };
    }, [stateController, props.onAxisChange]);

    useEffect(() => {
        stateController.primaryRenderer.resize();
    }, [props.height]);

    const draggingY = useDraggingY(stateController);

    const {styles, classNames} = calculateClassNamesAndStyles(props, { draggingY, theme });

    const rightAxes = useRightAxes(stateController);
    const leftAxes = useLeftAxes(stateController);
    const showingSidebar = useShowingSidebar(stateController);

    const showAxisColors = typeof props.showAxisColors === 'boolean' ? props.showAxisColors : (theme !== 'export');
    const showGrid = typeof props.showGrid === 'boolean' ? props.showGrid : (theme !== 'export');

    const commonYAxisProps = {
        stateController,
        showAxes: props.showAxes,
        showGrid,
        showSeriesKey: props.showSeriesKey,
        bodyHeight: props.bodyHeight,
        theme,
        grapherID: props.id,
        dragPositionYOffset: props.dragPositionYOffset,
        showAxisColors,
        bigLabels
    };

    return (
        <div className={classNames.join(' ')} style={styles} data-grapher-id={props.id}>
            {
                props.title &&
                <GraphTitle title={props.title} />
            }

            <div className="grapher-primary-container-outer">
                {
                    showingSidebar &&
                    <Sidebar stateController={stateController} />
                }

                <div className="grapher-primary-container-body">
                    {
                        props.showSeriesKey &&
                        <SeriesKey
                            stateController={stateController}
                            draggingY={draggingY}
                            theme={props.theme}
                            grapherID={props.id}
                            dragPositionYOffset={props.dragPositionYOffset}
                        />
                    }

                    {
                        props.showRangeSelectors &&
                        <RangeSelection
                            stateController={stateController}
                            customBoundsSelectors={props.customBoundsSelectors}
                            customBoundsSelectorsOnly={props.customBoundsSelectorsOnly}
                            sidebarEnabled={props.sidebarEnabled}
                        />
                    }

                    <div className="grapher-main-row">
                        {
                            draggingY &&
                            <div
                                className="axis y-axis"
                                data-axis-index="new-left"
                                data-grapher-id={props.id}
                                style={{
                                    width: Y_AXIS_WIDTH,
                                    height: typeof props.bodyHeight === 'number' ? props.bodyHeight : undefined
                                }}
                            />
                        }

                        {
                            leftAxes.map((axis, i) => {
                                return <YAxis
                                    key={i}
                                    axis={axis}
                                    sideIndex={leftAxes.length - i - 1}
                                    {...commonYAxisProps}
                                />;
                            })
                        }

                        <div className="central-container">
                            <GraphBody
                                stateController={stateController}
                                webgl={props.webgl}
                                bodyHeight={props.bodyHeight}
                                boundsSelectionEnabled={props.boundsSelectionEnabled}
                                showTooltips={props.showTooltips}
                                tooltipOptions={props.tooltipOptions}
                                checkIntersection={props.checkIntersection}
                                draggablePoints={props.draggablePoints}
                                onPointDrag={props.onPointDrag}
                                onDraggablePointsDoubleClick={props.onDraggablePointsDoubleClick}
                                verticalLines={props.verticalLines}
                                clockStyle={props.clockStyle}
                                timeZone={props.timeZone}
                            />

                            <XAxis
                                showGrid={showGrid}
                                showAxes={props.showAxes}
                                stateController={stateController}
                                bigLabels={bigLabels}
                                xTickUnit={props.xTickUnit}
                                clockStyle={props.clockStyle}
                                timeZone={props.timeZone}
                                integersOnly={props.xAxisIntegersOnly}
                            />

                            {
                                props.showRangeGraph &&
                                <div className="range-graph-container">
                                    <RangeGraph
                                        stateController={stateController}
                                        webgl={props.webgl}
                                        checkIntersection={props.checkIntersection}
                                        markDates={props.markRangeGraphDates}
                                        timeZone={props.timeZone}
                                        verticalLines={props.verticalLines}
                                    />
                                </div>
                            }
                        </div>

                        {
                            rightAxes.map((axis, i) => {
                                return <YAxis
                                    key={i}
                                    axis={axis}
                                    sideIndex={i}
                                    {...commonYAxisProps}
                                />;
                            })
                        }

                        {
                            draggingY &&
                            <div
                                className="axis y-axis"
                                data-axis-index="new-right"
                                data-grapher-id={props.id}
                                style={{
                                    width: Y_AXIS_WIDTH,
                                    height: typeof props.bodyHeight === 'number' ? props.bodyHeight : undefined
                                }}
                            />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

Grapher.propTypes = {
    series: CustomPropTypes.Series.isRequired,
    webgl: PropTypes.bool,
    requireWASM: PropTypes.bool,
    checkIntersection: PropTypes.bool,

    onAxisChange: PropTypes.func,
    onRenderTime: PropTypes.func,
    exportStateController: PropTypes.func,
    timingFrameCount: PropTypes.number,

    stateControllerInitialization: PropTypes.object,
    syncPool: PropTypes.instanceOf(SyncPool),
    id: PropTypes.string,
    dragPositionYOffset: PropTypes.number,

    theme: PropTypes.oneOf(['day', 'night', 'export']),
    title: PropTypes.string,
    fullscreen: PropTypes.bool,
    bodyHeight: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,

    showAxes: PropTypes.bool,
    showRangeGraph: PropTypes.bool,
    showRangeSelectors: PropTypes.bool,
    showSeriesKey: PropTypes.bool,
    showTooltips: PropTypes.bool,
    showGrid: PropTypes.bool,
    showAxisColors: PropTypes.bool,
    bigLabels: PropTypes.bool,
    xTickUnit: PropTypes.oneOf(['year']),
    xAxisIntegersOnly: PropTypes.bool,
    clockStyle: PropTypes.oneOf(['12h', '24h']),
    timeZone: PropTypes.string, // local, utc, or a full timezone string
    markRangeGraphDates: PropTypes.bool,

    boundsSelectionEnabled: PropTypes.bool,
    sidebarEnabled: PropTypes.bool,

    percentile: PropTypes.number,
    defaultShowOptions: PropTypes.bool,
    defaultShowIndividualPoints: PropTypes.bool,
    defaultShowSidebar: PropTypes.bool,
    defaultShowAnnotations: PropTypes.bool,
    defaultLineWidth: PropTypes.number,

    tooltipOptions: CustomPropTypes.TooltipOptions,

    customBoundsSelectors: CustomPropTypes.CustomBoundsSelectors,
    customBoundsSelectorsOnly: PropTypes.bool,
    defaultBoundsCalculator: PropTypes.string,

    annotations: CustomPropTypes.Annotations,
    draggablePoints: CustomPropTypes.DraggablePoints,
    onPointDrag: PropTypes.func,
    onDraggablePointsDoubleClick: PropTypes.func,
    verticalLines: CustomPropTypes.VerticalLines
};

export const AVAILABLE_COLORS = LINE_COLORS;
export const BUILT_IN_BOUND_CALCULATORS = BOUND_CALCULATORS;
