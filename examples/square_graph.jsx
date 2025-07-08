/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [Date.now() - 5000, 0],
            [Date.now() - 3000, 0.5],
            [Date.now() - 1000, 1.0],
            [Date.now(), 0.5]
        ],
        square: true,
        ignoreDiscontinuities: true,
        width: 2
    },
    {
        data: Kefir.stream((emitter) => {
            for (let i = 10; i >= 0; i--) {
                emitter.emit([[new Date(Date.now() - 1000*i), Math.random()]]);
            }

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    emitter.emit([[new Date(Date.now()), Math.random()]]);
                }, 1000*(i+1));
            }
        }),
        square: true,
        width: 2
    }
];

renderPage(
    <ExamplePage page="square_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
