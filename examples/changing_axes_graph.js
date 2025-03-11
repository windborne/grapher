import React from 'react';
import Grapher from '../src/grapher';
import Kefir from 'kefir';
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
        const keys = ['a', 'b', 'c', 'd'];

        const observable = Kefir.stream((emitter) => {
            let pointNumber = 0;

            const interval = setInterval(() => {
                if (window.paused) {
                    return;
                }

                const point = {
                    timestamp: new Date()
                };

                for (let i = 0; i < keys.length; i++) {
                    point[keys[i]] = (i+1)*pointNumber;
                }

                emitter.emit(point);
                pointNumber++;
            });

            return () => {
                clearInterval(interval);
            };
        });

        const allSeries = keys.map((key) => {
            return {
                xKey: 'timestamp',
                yKey: key,
                data: observable
            };
        });

        if (all) {
            return allSeries;
        }

        return allSeries.slice(0, 1 + Math.floor(Math.random() * keys.length));
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
    <ExamplePage page="changing_axes_graph">
        <RecreatedGraph />
    </ExamplePage>
);
