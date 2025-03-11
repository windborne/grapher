import React from 'react';
import PropTypes from 'prop-types';

export default React.memo(RangeSelectionButtonBase);

function RangeSelectionButtonBase({ selected, disabled, className, onClick, children, description }) {
    const classes = [
        'range-button'
    ];

    if (selected) {
        classes.push('range-button-selected');
    }

    if (disabled) {
        classes.push('range-button-disabled');
    }

    if (className) {
        classes.push(className);
    }

    if (description) {
        classes.push('option-tooltip');
    }

    return (
        <div
            className={classes.join(' ')}
            onClick={onClick && ((event) => disabled || onClick(event))}
        >
            {children}

            {
                description &&
                <div className="option-tooltip-text">
                    {description}
                </div>
            }
        </div>
    );
}

RangeSelectionButtonBase.propTypes = {
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    description: PropTypes.string
};
