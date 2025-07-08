import React from 'react';
import PropTypes from 'prop-types';
import RangeSelectionButtonBase from './range_selection_button_base.jsx';
import StateController from '../state/state_controller';

export default React.memo(RangeSelectionButton);

function RangeSelectionButton({ stateController, currentBoundCalculator, boundCalculator, children, disabled }) {
    return (
        <RangeSelectionButtonBase
            selected={currentBoundCalculator === boundCalculator}
            onClick={() => stateController.boundCalculator = boundCalculator}
            disabled={disabled}
        >
            {children}
        </RangeSelectionButtonBase>
    );
}

RangeSelectionButton.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    boundCalculator: PropTypes.func.isRequired,
    currentBoundCalculator: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool
};
