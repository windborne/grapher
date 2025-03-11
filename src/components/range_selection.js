import React from 'react';
import PropTypes from 'prop-types';
import RangeSelectionButton from './range_selection_button';
import RangeSelectionButtonBase from './range_selection_button_base';
import {Y_AXIS_WIDTH} from '../helpers/axis_sizes';
import CustomPropTypes from '../helpers/custom_prop_types';
import StateController from '../state/state_controller';
import {
    useBoundCalculator, useBoundHistory,
    useGlobalBounds,
    useLeftAxisCount,
    useRightAxisCount,
    useShowingOptions
} from '../state/hooks';
import BOUND_CALCULATORS from '../state/bound_calculators';
import Options from './options';

export default React.memo(RangeSelection);

function RangeSelection({stateController, customBoundsSelectors, customBoundsSelectorsOnly, sidebarEnabled}) {
    const rightAxisCount = useRightAxisCount(stateController);
    const leftAxisCount = useLeftAxisCount(stateController);
    const showingOptions = useShowingOptions(stateController);

    let marginRight = Y_AXIS_WIDTH*rightAxisCount;
    if (rightAxisCount > 0) {
        marginRight += 5;
    }

    let marginLeft = Y_AXIS_WIDTH*leftAxisCount;
    if (leftAxisCount > 0) {
        marginLeft += 5;
    }

    const { dates } = useGlobalBounds(stateController);

    const currentBoundCalculator = useBoundCalculator(stateController);
    const { hasPreviousBounds, hasNextBounds } = useBoundHistory(stateController);

    const customBoundSelectorNames = new Set(customBoundsSelectors.map(({ label }) => label));

    return (
        <div className={`range-selection${dates ? '' : ' range-not-dates'}`} style={{ marginRight, marginLeft }}>
            <div className="range-buttons">
                {
                    showingOptions &&
                        <Options
                            stateController={stateController}
                            sidebarEnabled={sidebarEnabled}
                        />
                }

                <RangeSelectionButtonBase
                    className="showing-options-button"
                    selected={showingOptions}
                    onClick={() => stateController.toggleShowingOptions()}
                    description="Show additional options"
                >
                    <div className="icon-container icon-container-square">
                        <svg focusable="false" viewBox="0 0 512 512">
                            <path fill="currentColor" d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
                        </svg>
                    </div>
                </RangeSelectionButtonBase>
                
                <RangeSelectionButtonBase
                    className="range-selection-history"
                    selected={false}
                    onClick={() => stateController.previousBounds()}
                    disabled={!hasPreviousBounds}
                >
                    <div className="icon-container">
                        <svg focusable="false" viewBox="0 0 256 512">
                            <path fill="currentColor" d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z" />
                        </svg>
                    </div>
                </RangeSelectionButtonBase>
                
                <RangeSelectionButtonBase
                    className="range-selection-history"
                    selected={false}
                    onClick={() => stateController.nextBounds()}
                    disabled={!hasNextBounds}
                >
                    <div className="icon-container">
                        <svg focusable="false" viewBox="0 0 256 512">
                            <path fill="currentColor" d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"/>
                        </svg>
                    </div>
                </RangeSelectionButtonBase>

                {
                    customBoundsSelectors.map(({label, calculator, datesOnly}, i) => {
                        return (
                            <RangeSelectionButton
                                key={i}
                                stateController={stateController}
                                currentBoundCalculator={currentBoundCalculator}
                                boundCalculator={calculator}
                                disabled={datesOnly && !dates}
                            >
                                {label}
                            </RangeSelectionButton>
                        );
                    })
                }

                {
                    !customBoundSelectorNames.has('1m') && !customBoundsSelectorsOnly &&
                    <RangeSelectionButton
                        stateController={stateController}
                        currentBoundCalculator={currentBoundCalculator}
                        boundCalculator={BOUND_CALCULATORS.lastMinute}
                        disabled={!dates}
                    >
                        1m
                    </RangeSelectionButton>
                }

                {
                    !customBoundSelectorNames.has('10m') && !customBoundsSelectorsOnly &&
                    <RangeSelectionButton
                        stateController={stateController}
                        currentBoundCalculator={currentBoundCalculator}
                        boundCalculator={BOUND_CALCULATORS.last10Minutes}
                        disabled={!dates}
                    >
                        10m
                    </RangeSelectionButton>
                }

                {
                    !customBoundSelectorNames.has('1h') && !customBoundsSelectorsOnly &&
                    <RangeSelectionButton
                        stateController={stateController}
                        currentBoundCalculator={currentBoundCalculator}
                        boundCalculator={BOUND_CALCULATORS.lastHour}
                        disabled={!dates}
                    >
                        1h
                    </RangeSelectionButton>
                }

                {
                    !customBoundSelectorNames.has('1d') && !customBoundsSelectorsOnly &&
                    <RangeSelectionButton
                        stateController={stateController}
                        currentBoundCalculator={currentBoundCalculator}
                        boundCalculator={BOUND_CALCULATORS.lastDay}
                        disabled={!dates}
                    >
                        1d
                    </RangeSelectionButton>
                }

                <RangeSelectionButton
                    stateController={stateController}
                    currentBoundCalculator={currentBoundCalculator}
                    boundCalculator={BOUND_CALCULATORS.all}
                    disabled={false}
                >
                    All
                </RangeSelectionButton>
            </div>
        </div>
    );

}

RangeSelection.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    customBoundsSelectors: CustomPropTypes.CustomBoundsSelectors.isRequired,
    customBoundsSelectorsOnly: PropTypes.bool,
    sidebarEnabled: PropTypes.bool
};
