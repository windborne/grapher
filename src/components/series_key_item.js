import React from 'react';
import getColor from '../helpers/colors';
import CustomPropTypes from '../helpers/custom_prop_types';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller';
import nameForSeries from '../helpers/name_for_series.js';

export default React.memo(SeriesKeyItem);

function SeriesKeyItem({ series, i, style, onMouseDown, theme, stateController, highlighted }) {
    const color = getColor(series.color, i, series.multigrapherSeriesIndex);

    if (theme === 'day') {
        style = Object.assign({}, style, {
            backgroundColor: color
        });
    } else {
        style = Object.assign({}, style, {
            color
        });
    }

    const classes = ['series-key-item'];
    if (highlighted) {
        classes.push('series-key-item-highlighted');
    }

    const name = nameForSeries(series, i);

    return (
        <div
            className={classes.join(' ')}
            style={style}
            onMouseDown={onMouseDown}
            onMouseOver={() => stateController.setHighlightedSeries(i)}
            onMouseOut={() => stateController.setHighlightedSeries(null)}
            onClick={() => stateController.registerSeriesClick(i)}
        >
            {name}
        </div>
    );
}

SeriesKeyItem.propTypes = {
    series: CustomPropTypes.SingleSeries.isRequired,
    stateController: PropTypes.instanceOf(StateController),
    i: PropTypes.number.isRequired,
    style: PropTypes.object,
    onMouseDown: PropTypes.func,
    theme: PropTypes.string.isRequired,
    highlighted: PropTypes.bool
};
