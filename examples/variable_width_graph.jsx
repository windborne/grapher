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

class VariableWidthGraphs extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            width: 30
        };
    }

    componentDidMount() {
        setInterval(() => {
            this.setState({
                width: 10 + Math.floor(Math.random() * 90)
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
                {
                    fixedSizes.map((width) => {
                        return (
                            <div style={{width: `${width}%`}} key={width}>
                                <Grapher
                                    series={series}
                                />
                            </div>
                        );
                    })
                }

                <div style={{width: `${this.state.width}%`}}>
                    <Grapher
                        series={series}
                    />
                </div>
            </div>
        );
    }
}

renderPage(
    <ExamplePage page="variable_width_graph">
        <VariableWidthGraphs />
    </ExamplePage>
);
