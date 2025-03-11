import React from 'react';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller';

export default class SeriesKeyAxisContainer extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            showingLabelInput: false
        };

        this.toggleLabelInputShowing = this.toggleLabelInputShowing.bind(this);
    }

    toggleLabelInputShowing() {
        this.setState(({ showingLabelInput }) => {
            return {
                showingLabelInput: !showingLabelInput
            };
        });
    }

    render() {
        const {children, stateController, axisIndex, scale, label, grapherID} = this.props;

        const { showingLabelInput } = this.state;

        return (
            <div
                className={`series-key-axis-container${showingLabelInput ? ' series-key-axis-container-showing-label' : ''}`}
                data-axis-index={axisIndex}
                data-grapher-id={grapherID}
            >
                <div className="scale-label" onClick={() => stateController.toggleScale({axisIndex})}>
                    {scale.slice(0, showingLabelInput ? 6 : 3)}
                </div>

                <div className="series-key-axis-container-body">
                    <div>
                        {children}

                        <svg className="label-input-toggler" viewBox="0 0 512 512" onClick={this.toggleLabelInputShowing}>
                            <path
                                d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z"/>
                        </svg>
                    </div>

                    <div className="series-key-axis-label-container">
                        <input
                            onChange={(event) => stateController.setLabel({axisIndex, label: event.target.value})}
                            placeholder="Enter label"
                            value={label || ''}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

SeriesKeyAxisContainer.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    children: PropTypes.node.isRequired,
    axisIndex: PropTypes.number.isRequired,
    scale: PropTypes.string.isRequired,
    label: PropTypes.string,
    grapherID: PropTypes.string
};
