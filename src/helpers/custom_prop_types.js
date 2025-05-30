import PropTypes from 'prop-types';
import {DATA_TYPES} from '../state/data_types';

// checking the shape of data is slow if there's a lot of it
// it can be convenient in development, but should not be done when testing high cardinality data
const ENABLE_DATA_CHECK = false;

const PointY = function (props, propName) {
    if (typeof props[propName] !== 'number' && props[propName] !== null) {
        return new Error(`${propName} needs to be a number or null`);
    }

    return null;
};

const PointTuple = function (props, propName) {
    if (!Array.isArray(props) || props.length !== 2) { // eslint-disable-line react/prop-types
        return new Error(`${propName} needs to be an array of length two`);
    }

    const [x, y] = props;
    if (typeof x !== 'number' && !(x instanceof Date)) {
        return new Error(`${propName}.x needs to be a number or date`);
    }

    if (typeof y !== 'number' && y !== null) {
        return new Error(`${propName}.y needs to be a number or null`);
    }

    return null;
};

const Data = ENABLE_DATA_CHECK ? PropTypes.oneOfType([
    PropTypes.arrayOf(PointY), // values
    PropTypes.arrayOf(PropTypes.arrayOf(PointTuple)), // tuples
    PropTypes.arrayOf(PropTypes.object), // objects
    PropTypes.shape({ observe: PropTypes.func.isRequired }), // observable
    PropTypes.func // generator function
]) : PropTypes.any;

const SingleSeries = PropTypes.shape({
    data: Data.isRequired,
    type: PropTypes.oneOf([
        ...DATA_TYPES,
        'infer'
    ]),
    xKey: PropTypes.string,
    yKey: PropTypes.string,
    xUnixDates: PropTypes.bool,
    color: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    xLabel: PropTypes.string,
    yLabel: PropTypes.string,
    ignoreDiscontinuities: PropTypes.bool,
    dashed: PropTypes.bool,
    dashPattern: PropTypes.arrayOf(PropTypes.number),
    width: PropTypes.number,
    rangeSelectorWidth: PropTypes.number,
    axis: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    expandYWith: PropTypes.arrayOf(PropTypes.number),
    defaultAlwaysTooltipped: PropTypes.bool,
    square: PropTypes.bool,
    shiftXBy: PropTypes.number,
    graph: PropTypes.number, // affects multigrapher only
    background: PropTypes.object,
    hideFromKey: PropTypes.bool,
    showIndividualPoints: PropTypes.bool,
    rendering: PropTypes.oneOf(['line', 'bar', 'area']), // defaults to line
    negativeColor: PropTypes.string, // only applies to bar
    gradient: PropTypes.array, // only applies to area
    zeroLineWidth: PropTypes.number, // only applies to bar and area
    zeroLineColor: PropTypes.string,  // only applies to bar and area
    zeroLineY: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // only applies to bar and area
    pointRadius: PropTypes.number, // only applies to area
    tooltipWidth: PropTypes.number,
    hasAreaBottom: PropTypes.bool,
    shadowColor: PropTypes.string,
    rangeKey: PropTypes.string
});

const Series = PropTypes.arrayOf(SingleSeries);

const Axis = PropTypes.shape({
    axisIndex: PropTypes.number.isRequired,
    series: PropTypes.array.isRequired,
    side: PropTypes.oneOf(['left', 'right']).isRequired,
    scale: PropTypes.oneOf(['linear', 'log']).isRequired,
    label: PropTypes.string
});

const Axes = PropTypes.arrayOf(Axis);

const CustomBoundsSelector = PropTypes.shape({
    label: PropTypes.string.isRequired,
    calculator: PropTypes.func.isRequired,
    datesOnly: PropTypes.bool
});

const CustomBoundsSelectors = PropTypes.arrayOf(CustomBoundsSelector);

const TooltipOptionsRaw = {
    includeSeriesLabel: PropTypes.bool,
    includeXLabel: PropTypes.bool,
    includeYLabel: PropTypes.bool,
    includeXValue: PropTypes.bool,
    includeYValue: PropTypes.bool,
    floating: PropTypes.bool,
    alwaysFixedPosition: PropTypes.bool,
    floatPosition: PropTypes.oneOf(['top', 'bottom']),
    floatDelta: PropTypes.number,
    savingDisabled: PropTypes.bool,
    customTooltip: PropTypes.func,
    combineTooltips: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
};

const TooltipOptions = PropTypes.shape(TooltipOptionsRaw);

const Annotation = PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    startX: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    endX: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    series: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.string,
    lineOnly: PropTypes.bool
});
const Annotations = PropTypes.arrayOf(Annotation);

const DraggablePoint = PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    radius: PropTypes.number,
    fillColor: PropTypes.string,
    strokeColor: PropTypes.string,
    strokeWidth: PropTypes.number,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func
});
const DraggablePoints = PropTypes.arrayOf(DraggablePoint);

const VerticalLine = PropTypes.shape({
    x: PropTypes.number.isRequired,
    color: PropTypes.string,
    lineTop: PropTypes.number,
    width: PropTypes.number,
    markTop: PropTypes.bool,
    style: PropTypes.object,
    markerStyle: PropTypes.object,
    text: PropTypes.string,
    textTop: PropTypes.number,
    textStyle: PropTypes.object,
    minPixelX: PropTypes.number,
    maxPixelX: PropTypes.number,
    onRangeGraph: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object // anything that can be passed into the overall vertical line
    ]),
    onRangeGraphOnly: PropTypes.bool
});
const VerticalLines = PropTypes.arrayOf(VerticalLine);

const CustomPropTypes = {
    Data,
    SingleSeries,
    Series,
    Axis,
    Axes,
    CustomBoundsSelector,
    CustomBoundsSelectors,
    TooltipOptions,
    TooltipOptionsRaw,
    Annotations,
    DraggablePoint,
    DraggablePoints,
    VerticalLine,
    VerticalLines
};


export default CustomPropTypes;
