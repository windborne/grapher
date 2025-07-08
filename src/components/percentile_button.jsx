import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RangeSelectionButtonBase from './range_selection_button_base.jsx';
import StateController from '../state/state_controller';
import {usePercentile, usePercentileAsymmetry} from '../state/hooks';

export default React.memo(PercentileButton);

function PercentileButton({ stateController }) {
    const percentile = usePercentile(stateController);
    const percentileAsymmetry = usePercentileAsymmetry(stateController);
    const [showing, setShowing] = useState(false);

    return ([
        showing ? <RangeSelectionButtonBase
            key="asymmetry button"
            className="percentile-button"
            selected={true}
            description="Percentile asymmetry"
        >
            <input
                onClick={(e) => e.stopPropagation()}
                value={percentileAsymmetry}
                onChange={(e) => stateController.percentileAsymmetry = e.target.value}
                onKeyUp={(e) => e.keyCode === 13 && setShowing(false)}
                type="number"
                min={-50}
                max={50}
            />

            <div className="icon-container icon-container-square">
                <svg focusable="false" viewBox="0 0 512 512">
                    <path fill="currentColor" d="M240 96h64a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16h-64a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm0 128h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm256 192H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h256a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm-256-64h192a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zM16 160h48v304a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16V160h48c14.21 0 21.39-17.24 11.31-27.31l-80-96a16 16 0 0 0-22.62 0l-80 96C-5.35 142.74 1.78 160 16 160z" />
                </svg>
            </div>
        </RangeSelectionButtonBase>: null,

        <RangeSelectionButtonBase
            key="main-button"
            className="percentile-button"
            selected={showing || parseFloat(percentile) !== 100}
            onClick={() => setShowing(!showing)}
            description="Edit percentile"
        >
            {
                showing &&
                <div>
                    <input
                        onClick={(e) => e.stopPropagation()}
                        autoFocus={true}
                        value={percentile}
                        onChange={(e) => stateController.percentile = e.target.value}
                        onKeyUp={(e) => e.keyCode === 13 && setShowing(false)}
                        type="number"
                        min={0}
                        max={100}
                    />
                </div>
            }

            <div className="icon-container icon-container-narrow">
                <svg focusable="false" viewBox="0 0 448 512">
                    <path fill="currentColor" d="M112 224c61.9 0 112-50.1 112-112S173.9 0 112 0 0 50.1 0 112s50.1 112 112 112zm0-160c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm224 224c-61.9 0-112 50.1-112 112s50.1 112 112 112 112-50.1 112-112-50.1-112-112-112zm0 160c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zM392.3.2l31.6-.1c19.4-.1 30.9 21.8 19.7 37.8L77.4 501.6a23.95 23.95 0 0 1-19.6 10.2l-33.4.1c-19.5 0-30.9-21.9-19.7-37.8l368-463.7C377.2 4 384.5.2 392.3.2z" />
                </svg>
            </div>
        </RangeSelectionButtonBase>
    ]);
}

PercentileButton.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired
};
