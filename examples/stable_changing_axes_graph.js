import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';


class RecreatedGraph extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            series: this.generateNewSeries(true)
        };
    }

    generateNewSeries(all=false) {
        const allSeries = [
            {
                data: [
                    [0, 1],
                    [5, 10],
                    [6, 1]
                ]
            },
            {
                data: [
                    [0, 1],
                    [1, 10],
                    [6, 4]
                ]
            }
        ];

        if (all) {
            return allSeries;
        }

        return allSeries.slice(0, 1 + Math.floor(Math.random() * allSeries.length));
    }

    componentDidMount() {
        window.changeInterval = setInterval(() => {
            this.setState({
                series: this.generateNewSeries()
            });
        }, 2000);
    }

    render() {
        return (
            <Grapher
                series={this.state.series}
            />
        );
    }
}

renderPage(
    <ExamplePage page="stable_changing_axes_graph">
        <RecreatedGraph />
    </ExamplePage>
);
