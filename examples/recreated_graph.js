import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 0]
    }
];

const ONCE = false;

class RecreatedGraph extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            showing: true
        };
    }

    componentDidMount() {
        if (ONCE) {
            setTimeout(() => {
                this.setState({
                    showing: false
                });
            }, 1000);

            setTimeout(() => {
                this.setState({
                    showing: true
                });
            }, 2000);
        } else {
            setInterval(() => {
                this.setState(({showing}) => {
                    return {
                        showing: !showing
                    };
                });
            }, 1000);
        }
    }

    render() {
        if (!this.state.showing) {
            return (
                <div>
                    Graph gone
                </div>
            );
        }

        return (
            <Grapher
                series={series}
            />
        );
    }
}

renderPage(
    <ExamplePage page="recreated_graph">
        <RecreatedGraph />
    </ExamplePage>
);
