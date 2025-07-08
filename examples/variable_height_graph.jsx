import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        name: 'W1 - sensors.gps.altitude',
        data: [0, 1, 4, 10, 0]
    }
];

class VariableHeightGraphs extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            height: 100
        };
    }

    componentDidMount() {
        setInterval(() => {
            this.setState({
                height: 100 + Math.floor(Math.random() * 600)
            });
        }, 1000);
    }

    render() {
        const fixedSizes = [];
        for (let i = 1; i <= 10; i++) {
            fixedSizes.push(i*10);
        }

        return (
            <div>
                <div>
                    <Grapher
                        series={series}
                        bodyHeight={this.state.height}
                    />
                </div>
            </div>
        );
    }
}

renderPage(
    <ExamplePage page="variable_height_graph">
        <VariableHeightGraphs />
    </ExamplePage>
);
