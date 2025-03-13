import React from 'react';
import PropTypes from 'prop-types';
import {formatX, formatY} from '../helpers/format';
import {Y_AXIS_WIDTH} from '../helpers/axis_sizes';
import CustomPropTypes from '../helpers/custom_prop_types';

function getYLabelContent({ yLabel, y, fullYPrecision}) {
    if (fullYPrecision && !yLabel) {
        if (y === undefined) {
            return 'undefined';
        }

        if (y === null) {
            return 'null';
        }

        return y.toString();
    }

    if (typeof yLabel === 'number') {
        if (fullYPrecision) {
            return yLabel.toString();
        } else {
            return formatY(yLabel);
        }
    }

    return yLabel || formatY(y);
}

function TooltipLabel({ axisLabel, x, y, xLabel, yLabel, textLeft, textTop, includeSeriesLabel, includeXValue, includeYValue, includeXLabel, includeYLabel, fullYPrecision, formatXOptions }) {
    let i = 0;

    return (
        <g>
            {
                includeSeriesLabel &&
                <text x={textLeft} y={textTop + (i++)*12}>
                    {axisLabel}
                </text>
            }

            {
                includeXValue &&
                <text x={textLeft} y={textTop + (i++) * 12}>
                    {includeXLabel && 'x: '}{xLabel || formatX(x, formatXOptions)}
                </text>
            }

            {
                includeYValue &&
                <text x={textLeft} y={textTop + (i++) * 12}>
                    {includeYLabel && 'y: '}{getYLabelContent({ yLabel, y, fullYPrecision})}
                </text>
            }
        </g>
    );
}

TooltipLabel.propTypes = {
    axisLabel: PropTypes.string,
    x: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(Date)]),
    y: PropTypes.number,
    xLabel: PropTypes.string,
    yLabel: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    textLeft: PropTypes.number.isRequired,
    textTop: PropTypes.number.isRequired,
    fullYPrecision: PropTypes.bool,
    formatXOptions: PropTypes.object,
    ...CustomPropTypes.TooltipOptionsRaw
};

export default class Tooltip extends React.PureComponent {

    render() {
        let height = 12*3 + 6;

        if (!this.props.includeSeriesLabel) {
            height -= 12;
        }

        if (!this.props.includeXValue) {
            height -= 12;
        }

        if (!this.props.includeYValue) {
            height -= 12;
        }

        const caretSize = 7;
        const halfHeight = height/2;
        const caretPadding = 4;

        const textTop = -halfHeight + 3;

        const formatXOptions = {
            clockStyle: this.props.clockStyle,
            timeZone: this.props.timeZone
        };

        const passThroughProps = {
            includeSeriesLabel: this.props.includeSeriesLabel,
            includeXLabel: this.props.includeXLabel,
            includeYLabel: this.props.includeYLabel,
            includeXValue: this.props.includeXValue,
            includeYValue: this.props.includeYValue,
            formatXOptions
        };

        const preparedTooltips = this.props.tooltips.map((tooltip, i) => {
            const { x, y, color, pixelY, pixelX, series, index, xLabel, yLabel, fullYPrecision } = tooltip;

            const axisLabel = (series.name || series.yKey || index).toString();
            const width = Math.max(axisLabel.length, (xLabel || formatX(x, formatXOptions)).length + 4, getYLabelContent({ yLabel, y, fullYPrecision}).length + 4) * 7.5;

            let fixedPosition = this.props.elementWidth < (width + 2*caretSize + 2*caretPadding);

            let multiplier = 1;
            if (pixelX >= this.props.elementWidth - (width + 2*caretSize + caretPadding)) {
                multiplier = -1;
            }

            if (pixelX < width + 2*caretSize + caretPadding && multiplier === -1) {
                fixedPosition = true;
            }

            if (y === null) {
                fixedPosition = true;
            }

            if (this.props.alwaysFixedPosition) {
                fixedPosition = true;
            }

            let textLeft = caretSize + caretPadding;
            if (multiplier < 0) {
                textLeft = -width - textLeft;
            } else {
                textLeft += 6;
            }

            if (!isFinite(pixelX)) {
                return null;
            }

            const transform = `translate(${pixelX},${pixelY})`;

            const commonLabelProps = {
                fullYPrecision: fullYPrecision || this.props.maxPrecision,
                x,
                y,
                axisLabel,
                xLabel,
                yLabel,
                ...passThroughProps
            };

            let yTranslation = 0;
            let baseLeft;

            if (fixedPosition) {
                textLeft = 6;

                baseLeft = this.props.elementWidth / 2 - width / 2;

                if (width > this.props.elementWidth && !this.props.floating) {
                    baseLeft -= Y_AXIS_WIDTH * this.props.axisCount / 2;
                }

                yTranslation = 18;

                if (this.props.floating) {
                    if (this.props.floatPosition === 'bottom') {
                        yTranslation = this.props.elementHeight + halfHeight + 4;
                    } else {
                        yTranslation = -height;
                    }

                    if (this.props.floatDelta) {
                        yTranslation += this.props.floatDelta;
                    }
                }
            }

            return {
                ...tooltip,
                label: axisLabel,
                axisLabel,
                width,
                fixedPosition,
                multiplier,
                textLeft,
                transform,
                commonLabelProps,
                textTop,
                height,
                caretSize,
                halfHeight,
                caretPadding,
                yTranslation,
                baseLeft
            };
        });

        const CustomTooltipComponent = this.props.customTooltip;

        return (
            <div className="grapher-tooltip">
                <svg>
                    {
                        preparedTooltips.map((tooltip, i) => {
                            const { color, fixedPosition, width, transform, baseLeft, commonLabelProps, yTranslation, multiplier, textLeft, textTop } = tooltip;

                            if (this.props.customTooltip) {
                                return (
                                    <g key={i} transform={transform} className="tooltip-item">
                                        <circle r={4} fill={color}/>
                                    </g>
                                )
                            }

                            // display in a fixed position if not wide enough
                            if (fixedPosition) {
                                return (
                                    <g key={i} className="tooltip-item tooltip-item-fixed">
                                        <circle r={4} fill={color} transform={transform} />

                                        <g transform={`translate(${baseLeft}, ${yTranslation})`}>
                                            <path stroke={color} d={`M0,0 V-${halfHeight} h${width} V${halfHeight} h${-width} V0`} />

                                            <TooltipLabel
                                                textLeft={textLeft} textTop={textTop}
                                                {...commonLabelProps}
                                            />
                                        </g>
                                    </g>
                                );
                            }

                            return (
                                <g key={i} transform={transform} className="tooltip-item">
                                    <circle r={4} fill={color} />

                                    <path stroke={color} d={`M${multiplier*caretPadding},0 L${multiplier*caretSize*2},-${caretSize} V-${halfHeight} h${multiplier*width} V${halfHeight} h${multiplier*-width} V${caretSize} L${multiplier*caretPadding},0`} />

                                    <TooltipLabel
                                        textLeft={textLeft} textTop={textTop}
                                        {...commonLabelProps}
                                    />
                                </g>
                            );
                        })
                    }
                </svg>

                {
                    this.props.customTooltip &&
                    preparedTooltips.map((tooltip, i) =>
                        <div
                            key={i}
                            className="custom-tooltip-container"
                            style={{top: tooltip.pixelY, left: tooltip.pixelX}}
                        >
                            <CustomTooltipComponent {...tooltip} />
                        </div>
                    )
                }
            </div>
        );
    }

}

Tooltip.defaultProps = {
    includeSeriesLabel: true,
    includeXLabel: true,
    includeYLabel: true,
    includeXValue: true,
    includeYValue: true
};

Tooltip.propTypes = {
    mouseX: PropTypes.number.isRequired,
    mouseY: PropTypes.number.isRequired,
    elementHeight: PropTypes.number.isRequired,
    elementWidth: PropTypes.number.isRequired,
    tooltips: PropTypes.arrayOf(PropTypes.shape({
        x: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(Date)]),
        y: PropTypes.number,
        pixelY: PropTypes.number,
        color: PropTypes.string,
        xLabel: PropTypes.string,
        yLabel: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        fullYPrecision: PropTypes.bool
    })),
    axisCount: PropTypes.number.isRequired,
    maxPrecision: PropTypes.bool.isRequired,
    clockStyle: PropTypes.oneOf(['12h', '24h']),
    timeZone: PropTypes.string,
    ...CustomPropTypes.TooltipOptionsRaw
};
