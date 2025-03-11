import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series1 = {
    data: [5, 1, 4, 10, 0]
};

const series2 = {
    data: [-5, -1, -4, -10, 0]
};

class ToggledSeriesGraph extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            series: [series1, series2]
        };

        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState(({ series }) => {
            if (series.length === 1) {
                return {
                    series: [series1, series2]
                };
            } else {
                return {
                    series: [series1]
                };
            }
        });
    }

    componentDidMount() {
        setInterval(() => {
            this.toggle();
        }, 1000);
    }

    render() {
        return (
            <div onClick={this.toggle}>
                <Grapher
                    series={this.state.series}
                />
            </div>
        );
    }

}

renderPage(
    <ExamplePage page="toggled_series_graph">
        <ToggledSeriesGraph />
    </ExamplePage>
);
