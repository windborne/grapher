/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: Kefir.stream((emitter) => {
            emitter.emit([[new Date(Date.now() - 1000), Math.random()]]);
            emitter.emit([[new Date(Date.now()), Math.random()]]);

            setInterval(() => {
                emitter.emit([[new Date(Date.now()), Math.random()]]);
            }, 1000);
        })
    }
];

renderPage(
    <ExamplePage page="slow_observable_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
