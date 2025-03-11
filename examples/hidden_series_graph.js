import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const generateRandomData = () => {
    const data = [];

    for (let i = 0; i < 10; i++) {
        data.push(Math.random());
    }

    return data;
};

const options = {
    series: [
        {
            'name': 'sim.h',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': false
        },
        {
            'name': 'state.effort',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'total_vent',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'total_bal',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'state.v',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'state.fused_v',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'state.dvdl',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'sim.v',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        },
        {
            'name': 'sim.l',
            data: generateRandomData(),
            'axis': 'left-0',
            'hidden': true
        }
    ],
    boundsSelectors: []
};

renderPage(
    <ExamplePage page="hidden_series_graph">
        <Grapher
            {...options}
        />
    </ExamplePage>
);
