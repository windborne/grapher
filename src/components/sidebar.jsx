import React from 'react';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller';
import {useSeries} from '../state/hooks';
import CustomPropTypes from '../helpers/custom_prop_types';
import getColor from '../helpers/colors';

class SeriesToggle extends React.PureComponent {

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    // NOTE: event listeners here do not follow React best practices, because when handled through React
    // there were ~500ms of latency when toggling the checkbox. It's unclear why
    onChange(event) {
        setTimeout(() => {
            this.props.stateController.setShowing(this.props.singleSeries, event.target.checked);
        });
    }

    render() {
        const { singleSeries } = this.props;
        const color = getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex);

        let name = singleSeries.name || singleSeries.yKey;

        if (!name) {
            name = singleSeries.index;
        }

        return (
            <div className="series-toggle">
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={!singleSeries.hidden}
                        ref={(el) => el && el.addEventListener('change', this.onChange)}
                    />
                    <span className="checkmark" style={{ background: color, borderColor: color }} />

                    {name}
                </label>
            </div>
        );
    }
}

SeriesToggle.propTypes = {
    singleSeries: CustomPropTypes.SingleSeries.isRequired,
    stateController: PropTypes.instanceOf(StateController).isRequired
};

export default function Sidebar({ stateController }) {
    const series = useSeries(stateController);

    return (
        <div className="grapher-sidebar">
            {
                series.map((singleSeries, i) =>
                    <SeriesToggle
                        key={i}
                        singleSeries={singleSeries}
                        stateController={stateController}
                    />
                )
            }
        </div>
    );
}

Sidebar.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired
};
