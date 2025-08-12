import React from 'react';
import PropTypes from 'prop-types';
import GraphBodyRenderer from '../renderer/graph_body_renderer';
import StateController from '../state/state_controller';
import placeGrid from '../helpers/place_grid';
import {formatX} from '../helpers/format';
import VerticalLines from './vertical_lines.jsx';
import CustomPropTypes from '../helpers/custom_prop_types';

export default class RangeGraph extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            elementWidth: 0,
            elementHeight: 0,
            selectionBounds: {
                minX: 0,
                maxX: 0
            },
            globalBounds: {
                minX: 0,
                maxX: 0
            }
        };

        this.onMouseMove = this.onMouseMove.bind(this);
        this.stopDragging = this.stopDragging.bind(this);
        this.startScroll = this.startScroll.bind(this);
        this.startLeftDrag = this.startLeftDrag.bind(this);
        this.startRightDrag = this.startRightDrag.bind(this);
    }

    getClientX(event) {
        if (event && event.touches && event.touches[0]) {
            return event.touches[0].clientX;
        }
        if (event && event.changedTouches && event.changedTouches[0]) {
            return event.changedTouches[0].clientX;
        }
        return event.clientX;
    }

    componentDidMount() {
        this._renderer = new GraphBodyRenderer({
            stateController: this.props.stateController,
            canvasElement: this.el,
            webgl: this.props.webgl,
            checkIntersection: this.props.checkIntersection
        });
        this.props.stateController.rangeGraphRenderer = this._renderer;

        this._renderer.on('size_changed', (sizing) => {
            this.setState(sizing);
        });

        this.setState({
            selectionBounds: this.props.stateController._selection,
            globalBounds: this.props.stateController._globalBounds
        });

        this.props.stateController.on('selection_changed', (selectionBounds) =>{
            this.setState({ selectionBounds });
        });

        this.props.stateController.on('global_bounds_changed', (globalBounds) =>{
            this.setState({ globalBounds: globalBounds });
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.draggingY !== this.props.draggingY) {
            this._renderer.resize();
        }
    }

    componentWillUnmount() {
        this._renderer.dispose();
        this._renderer = null;
    }

    onMouseMove(event) {
        if (!this._dragType) {
            return;
        }

        // Prevent scrolling during touch-drag
        if (event && event.touches && event.preventDefault) {
            event.preventDefault();
        }

        let boundCalculator;
        const leftX = this.el.getBoundingClientRect().left;

        this.setState(({selectionBounds, globalBounds, elementWidth}) => {
            const pixelX = this.getClientX(event) - leftX;
            let percentage = pixelX/elementWidth;

            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);

            let trueX = percentage * (globalBounds.maxX - globalBounds.minX) + globalBounds.minX;

            if (this._dragType === 'scroll') {
                const range = selectionBounds.maxX - selectionBounds.minX;
                let minX = trueX - range*this._scrollAnchorPercentage;
                let maxX = trueX + range*(1-this._scrollAnchorPercentage);

                if (minX < globalBounds.minX) {
                    minX = globalBounds.minX;
                    maxX = minX + range;
                }

                if (maxX > globalBounds.maxX) {
                    maxX = globalBounds.maxX;
                    minX = maxX - range;
                }

                boundCalculator = () => {
                    return {minX, maxX};
                };

                return {
                    selectionBounds: Object.assign({}, selectionBounds, {
                        minX, maxX
                    })
                };
            } else if (this._dragType === 'left') {
                if (trueX > selectionBounds.maxX) {
                    trueX = selectionBounds.maxX;
                }

                const boundToRight = globalBounds.maxX === selectionBounds.maxX;

                boundCalculator = () => {
                    if (boundToRight) {
                        return {
                            minX: trueX
                        };
                    } else {
                        return {
                            minX: trueX,
                            maxX: selectionBounds.maxX
                        };
                    }
                };

                return {
                    selectionBounds: Object.assign({}, selectionBounds, {
                        minX: trueX
                    })
                };
            } else if (this._dragType === 'right') {
                if (trueX < selectionBounds.minX) {
                    trueX = selectionBounds.minX;
                }

                const boundToLeft = globalBounds.minX === selectionBounds.minX;

                boundCalculator = () => {
                    if (boundToLeft) {
                        return {
                            maxX: trueX
                        };
                    } else {
                        return {
                            minX: selectionBounds.minX,
                            maxX: trueX
                        };
                    }
                };

                return {
                    selectionBounds: Object.assign({}, selectionBounds, {
                        maxX: trueX
                    })
                };
            }
        }, () => {
            if (!boundCalculator) {
                return;
            }

            boundCalculator.debounceHistory = true;
            this.props.stateController.boundCalculator = boundCalculator;
        });
    }

    addListeners() {
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.stopDragging);
        window.addEventListener('touchmove', this.onMouseMove, { passive: false });
        window.addEventListener('touchend', this.stopDragging);
        window.addEventListener('touchcancel', this.stopDragging);
    }

    stopDragging() {
        this._dragType = null;
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.stopDragging);
        window.removeEventListener('touchmove', this.onMouseMove);
        window.removeEventListener('touchend', this.stopDragging);
        window.removeEventListener('touchcancel', this.stopDragging);
    }

    startScroll(event) {
        this._dragType = 'scroll';

        const {selectionBounds, globalBounds, elementWidth} = this.state;
        const leftX = this.el.getBoundingClientRect().left;

        const pixelStartX = this.getClientX(event) - leftX;
        const pixelMinX = (selectionBounds.minX - globalBounds.minX)/(globalBounds.maxX - globalBounds.minX) * elementWidth || 0;
        const pixelMaxX = (selectionBounds.maxX - globalBounds.minX)/(globalBounds.maxX - globalBounds.minX) * elementWidth || 0;

        this._scrollAnchorPercentage = (pixelStartX-pixelMinX)/(pixelMaxX - pixelMinX);
        this.addListeners();
    }

    startLeftDrag(event) {
        this._dragType = 'left';
        this.addListeners();
    }

    startRightDrag(event) {
        this._dragType = 'right';
        this.addListeners();
    }

    render() {
        const { globalBounds, selectionBounds, elementWidth, elementHeight } = this.state;

        let pixelMinX = Math.min(Math.max((selectionBounds.minX - globalBounds.minX)/(globalBounds.maxX - globalBounds.minX), 0), 1) * elementWidth || 0;
        let pixelMaxX =  Math.min(Math.max((selectionBounds.maxX - globalBounds.minX)/(globalBounds.maxX - globalBounds.minX), 0), 1) * elementWidth || 0;

        if (isNaN(pixelMinX) || !isFinite(pixelMinX) || selectionBounds.maxX < selectionBounds.minX) {
            pixelMinX = 0;
        }

        if (isNaN(pixelMaxX) || !isFinite(pixelMaxX) || selectionBounds.maxX < selectionBounds.minX) {
            pixelMaxX = 0;
        }

        const barSize = 14;
        let ticks;

        if (selectionBounds.dates && this.props.markDates) {
            ticks = placeGrid({
                min: globalBounds.minX,
                max: globalBounds.maxX,
                totalSize: elementWidth,
                precision: 'day',
                dates: selectionBounds.dates,
                formatter: formatX,
                expectedLabelSize: 30,
                labelPadding: 5,
                formatOptions: {
                    justMonthAndDay: true,
                    unitOverride: 'day',
                    timeZone: this.props.timeZone
                },
                skipFirst: true,
                skipLast: true
            });
        }

        return (
            <div className="range-selection-graph">
                <div className="graph-body graph-body-secondary" style={{ touchAction: 'none' }}>
                    <canvas ref={(el) => this.el = el} />

                    <svg>
                        <g>
                            <rect
                                x={0}
                                y={elementHeight}
                                width={elementWidth}
                                height={barSize}
                                className="selection-bar-track"
                            />

                            {
                                ticks && ticks.map(({ pixelValue, label, size, position }, i) => {
                                    if (isNaN(pixelValue)) {
                                        return null;
                                    }

                                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];

                                    return (
                                        <g key={i} className={classes.join(' ')}>
                                            <path d={`M${pixelValue},0 v${elementHeight}`} />

                                            <text x={pixelValue + 3} y={elementHeight}>
                                                {label}
                                            </text>
                                        </g>
                                    );
                                })
                            }

                            <rect
                                x={pixelMinX}
                                y={elementHeight}
                                width={pixelMaxX - pixelMinX}
                                height={barSize}
                                className="selection-bar"
                                onMouseDown={this.startScroll}
                                onTouchStart={this.startScroll}
                            />

                            <path
                                d="M -3 3.5 L -3 9.333333333333334 M 0 3.5 L 0 9.333333333333334 M 3 3.5 L 3 9.333333333333334"
                                className="selection-bar-rifles"
                                transform={`translate(${pixelMinX + (pixelMaxX - pixelMinX)/2},${elementHeight})`}
                                onMouseDown={this.startScroll}
                                onTouchStart={this.startScroll}
                            />
                        </g>

                        <g>
                            <rect
                                x={pixelMinX}
                                y={0}
                                width={pixelMaxX - pixelMinX}
                                height={elementHeight}
                                className="target-selection"
                                onMouseDown={this.startScroll}
                                onTouchStart={this.startScroll}
                            />

                            <rect
                                x={pixelMinX}
                                y={0}
                                width={pixelMaxX - pixelMinX}
                                height={elementHeight + barSize}
                                className="target-selection-outline"
                            />
                        </g>

                        <g>
                            <rect
                                x={pixelMinX - 15}
                                y={(elementHeight - 30)/2}
                                width={30}
                                height={30}
                                fill="transparent"
                                className="selection-bar-handle-hit"
                                onMouseDown={this.startLeftDrag}
                                onTouchStart={this.startLeftDrag}
                            />
                            <path
                                d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
                                className="selection-bar-handle"
                                transform={`translate(${pixelMinX},${(elementHeight - 15)/2})`}
                                onMouseDown={this.startLeftDrag}
                                onTouchStart={this.startLeftDrag}
                            />
                        </g>

                        <g>
                            <rect
                                x={pixelMaxX - 15}
                                y={(elementHeight - 30)/2}
                                width={30}
                                height={30}
                                fill="transparent"
                                className="selection-bar-handle-hit"
                                onMouseDown={this.startRightDrag}
                                onTouchStart={this.startRightDrag}
                            />
                            <path
                                d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
                                className="selection-bar-handle"
                                transform={`translate(${pixelMaxX},${(elementHeight - 15)/2})`}
                                onMouseDown={this.startRightDrag}
                                onTouchStart={this.startRightDrag}
                            />
                        </g>
                    </svg>

                    {
                        this.props.verticalLines &&
                        <VerticalLines
                            stateController={this.props.stateController}
                            verticalLines={this.props.verticalLines}
                            isRangeGraph={true}
                            bounds={globalBounds}
                            elementHeight={elementHeight}
                            elementWidth={elementWidth}
                        />
                    }
                </div>
            </div>
        );
    }

}

RangeGraph.defaultProps = {
    width: 3,
    shadowColor: 'transparent'
};

RangeGraph.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    webgl: PropTypes.bool,
    draggingY: PropTypes.bool,
    checkIntersection: PropTypes.bool,
    markDates: PropTypes.bool,
    timeZone: PropTypes.string,
    verticalLines: CustomPropTypes.VerticalLines
};