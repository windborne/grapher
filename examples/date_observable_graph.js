/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: Kefir.stream((emitter) => {
            for (let i = 500; i >= 0; i--) {
                emitter.emit([[new Date(Date.now() - 150*i), Math.cos((Date.now() - 150*i) / 500)]]);
            }

            setInterval(() => {
                emitter.emit([[new Date(Date.now()), Math.cos(Date.now()/500)]]);
            }, 50);
        })
    }
];

renderPage(
    <ExamplePage page="date_observable_graph">
        <Grapher
            series={series}
            defaultBoundsCalculator="lastMinute"
        />
    </ExamplePage>
);
