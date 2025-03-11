import React from 'react';
import PercentileButton from './percentile_button';
import RangeSelectionButtonBase from './range_selection_button_base';
import {
    useAutoscaleY,
    useMaxPrecision,
    useShowIndividualPoints, useShowingAnnotations,
    useShowingSidebar, useTheme
} from '../state/hooks';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller';

export default React.memo(Options);

function Options({stateController, sidebarEnabled}) {

    const showIndividualPoints = useShowIndividualPoints(stateController);
    const autoscaleY = useAutoscaleY(stateController);
    const maxPrecision = useMaxPrecision(stateController);
    const showingSidebar = useShowingSidebar(stateController);
    const showingAnnotations = useShowingAnnotations(stateController);
    const theme = useTheme(stateController);

    return (
        <div className="options-bar">
            {
                sidebarEnabled &&
                <RangeSelectionButtonBase
                    selected={showingSidebar}
                    onClick={() => stateController.toggleShowingSidebar()}
                    description="Show sidebar"
                >
                    <div className="icon-container icon-container-square">
                        <svg focusable="false" viewBox="0 0 512 512">
                            <path fill="currentColor"
                                  d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64V160h160v256zm224 0H288V160h160v256z"/>
                        </svg>
                    </div>
                </RangeSelectionButtonBase>
            }

            <RangeSelectionButtonBase
                selected={theme === 'export'}
                onClick={() => stateController.toggleExportMode()}
                description="Export mode"
            >
                <div className="icon-container icon-container-square">
                    <svg focusable="false" viewBox="0 0 512 512">
                        <path fill="currentColor"
                              d="M167.02 309.34c-40.12 2.58-76.53 17.86-97.19 72.3-2.35 6.21-8 9.98-14.59 9.98-11.11 0-45.46-27.67-55.25-34.35C0 439.62 37.93 512 128 512c75.86 0 128-43.77 128-120.19 0-3.11-.65-6.08-.97-9.13l-88.01-73.34zM457.89 0c-15.16 0-29.37 6.71-40.21 16.45C213.27 199.05 192 203.34 192 257.09c0 13.7 3.25 26.76 8.73 38.7l63.82 53.18c7.21 1.8 14.64 3.03 22.39 3.03 62.11 0 98.11-45.47 211.16-256.46 7.38-14.35 13.9-29.85 13.9-45.99C512 20.64 486 0 457.89 0z" />
                    </svg>
                </div>
            </RangeSelectionButtonBase>

            <RangeSelectionButtonBase
                selected={showingAnnotations}
                onClick={() => stateController.toggleShowingAnnotations()}
                description="Show annotations"
            >
                <div className="icon-container icon-container-448">
                    <svg focusable="false" viewBox="0 0 448 512">
                        <path fill="currentColor" d="M432 416h-23.41L277.88 53.69A32 32 0 0 0 247.58 32h-47.16a32 32 0 0 0-30.3 21.69L39.41 416H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-19.58l23.3-64h152.56l23.3 64H304a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM176.85 272L224 142.51 271.15 272z" />
                    </svg>
                </div>
            </RangeSelectionButtonBase>

            <PercentileButton stateController={stateController} />

            <RangeSelectionButtonBase
                selected={maxPrecision}
                onClick={() => stateController.toggleMaxPrecision()}
                description="Max precision"
            >
                <div className="icon-container icon-container-square">
                    <svg focusable="false" viewBox="0 0 512 512">
                        <path fill="currentColor" d="M478.21 334.093L336 256l142.21-78.093c11.795-6.477 15.961-21.384 9.232-33.037l-19.48-33.741c-6.728-11.653-21.72-15.499-33.227-8.523L296 186.718l3.475-162.204C299.763 11.061 288.937 0 275.48 0h-38.96c-13.456 0-24.283 11.061-23.994 24.514L216 186.718 77.265 102.607c-11.506-6.976-26.499-3.13-33.227 8.523l-19.48 33.741c-6.728 11.653-2.562 26.56 9.233 33.037L176 256 33.79 334.093c-11.795 6.477-15.961 21.384-9.232 33.037l19.48 33.741c6.728 11.653 21.721 15.499 33.227 8.523L216 325.282l-3.475 162.204C212.237 500.939 223.064 512 236.52 512h38.961c13.456 0 24.283-11.061 23.995-24.514L296 325.282l138.735 84.111c11.506 6.976 26.499 3.13 33.227-8.523l19.48-33.741c6.728-11.653 2.563-26.559-9.232-33.036z" />
                    </svg>
                </div>
            </RangeSelectionButtonBase>

            <RangeSelectionButtonBase
                selected={autoscaleY}
                onClick={() => stateController.toggleYAutoscaling()}
                description="Autoscale y axis"
            >
                <div className="icon-container">
                    <svg focusable="false" viewBox="0 0 256 512">
                        <path fill="currentColor" d="M168 416c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h88v-64h-88c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h88v-64h-88c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h88v-64h-88c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h88V32c0-17.67-14.33-32-32-32H32C14.33 0 0 14.33 0 32v448c0 17.67 14.33 32 32 32h192c17.67 0 32-14.33 32-32v-64h-88z"/>
                    </svg>
                </div>
            </RangeSelectionButtonBase>

            <RangeSelectionButtonBase
                selected={showIndividualPoints}
                onClick={() => stateController.toggleIndividualPoints()}
                description="Show individual points"
            >
                <div className="icon-container icon-container-narrow">
                    <svg focusable="false" viewBox="0 0 192 512">
                        <path fill="currentColor" d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z" />
                    </svg>
                </div>
            </RangeSelectionButtonBase>
        </div>
    );
}

Options.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    sidebarEnabled: PropTypes.bool
};
