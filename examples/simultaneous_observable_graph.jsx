/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: Kefir.stream((emitter) => {
            let i = 0;
            let y = 0;
            let velocity = 0;

            emitter.emit([[i++, 0]]);
            emitter.emit([[i++, y]]);

            const generatePoint = () => {
                const points = [];
                const pointsPerIteration = 1;
                for (let j = 0; j < pointsPerIteration; j++) {
                    velocity += (Math.random() - 0.5 - 0.1 * velocity) * 0.1;

                    velocity = Math.max(velocity, -1);
                    velocity = Math.min(velocity, 1);

                    y += velocity;
                    points.push([i++, y]);
                }
                emitter.emit(points);
            };

            for (let i = 0; i < 10; i++) {
                generatePoint();
            }

            window.pointInterval = setInterval(generatePoint, 1000);
        })
    },
    {
        data: Kefir.stream((emitter) => {
            let i = 0;
            let y = 0;
            let velocity = 0;

            emitter.emit([[i++, 0]]);
            emitter.emit([[i++, y]]);

            const generatePoint = () => {
                const points = [];
                const pointsPerIteration = 1;
                for (let j = 0; j < pointsPerIteration; j++) {
                    velocity += (Math.random() - 0.5 - 0.1 * velocity) * 0.1;

                    velocity = Math.max(velocity, -1);
                    velocity = Math.min(velocity, 1);

                    y += velocity;
                    points.push([i++/2, y]);
                }
                emitter.emit(points);
            };

            for (let i = 0; i < 10; i++) {
                generatePoint();
            }

            window.pointInterval2 = setInterval(generatePoint, 500);
        })
    }
];

renderPage(
    <ExamplePage page="simultaneous_observable_graph">
        <Grapher
            series={series}
            animationDisabled={true}
            webgl={true}
            timingFrameCount={120}
        />
    </ExamplePage>
);
