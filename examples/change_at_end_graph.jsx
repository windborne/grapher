import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];
const count = 4000;
for (let i = 0; i < count; i++) {
    //snowflake reference
    data.push([i, 0 + Math.sin((i * i) % (10 ** 9 + 7)) * 0.01]);
}

for (let j = 0; j < 20; j++) {
    data.push([count + j, 1 + Math.sin((j * j) % (10 ** 9 + 7)) * 0.01]);
}

const series = [
    {
       data
    }
];

renderPage(
    <ExamplePage page="change_at_end_graph">
        <Grapher
            series={series}
            showSeriesKey={false}
            defaultShowIndividualPoints={true}
            width={count / 4}
        />
    </ExamplePage>
);
