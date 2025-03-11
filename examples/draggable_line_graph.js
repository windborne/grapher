import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

class DraggableLineGraph extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            data: [
                {
                    x: 0,
                    y: 0
                },
                {
                    x: 1,
                    y: 1
                },
                {
                    x: 2,
                    y: 0
                },
                {
                    x: 3,
                    y: 3
                },
                {
                    x: 4,
                    y: 0
                },
                {
                    x: 5,
                    y: 5
                },
                {
                    x: 6,
                    y: 0
                }
            ]
        };

        this.onPointDrag = this.onPointDrag.bind(this);
    }

    onPointDrag({ index, x, y, point }) {
        console.log('Drag of', point, { x, y });
        this.setState(({ data }) => {
            data = [...data];
            data[index] = { x, y };

            return {
                data
            };
        });
    }

    render() {
        const { data } = this.state;

        return (
            <Grapher
                series={[{
                    data,
                    xKey: 'x',
                    yKey: 'y'
                }]}
                draggablePoints={data}
                onPointDrag={this.onPointDrag}
            />
        );
    }

}

renderPage(
    <ExamplePage page="draggable_line_graph">
        <DraggableLineGraph />
    </ExamplePage>
);
