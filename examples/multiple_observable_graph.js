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
    },
    {
        data: Kefir.stream((emitter) => {
            for (let i = 500; i >= 0; i--) {
                emitter.emit([[new Date(Date.now() - 150*i), -50 + Math.random()]]);
            }

            setInterval(() => {
                emitter.emit([[new Date(Date.now()), -50 + Math.random()]]);
            }, 50);
        }),
        axis: 'right'
    }
];

renderPage(
    <ExamplePage page="multiple_observable_graph">
        <Grapher
            series={series}
            timingFrameCount={120}
            webgl={true}
        />
    </ExamplePage>
);
