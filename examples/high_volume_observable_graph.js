/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

let stateController;
const exportStateController = (controller) => {
    stateController = controller;
};

const series = [
    {
        data: Kefir.stream((emitter) => {
            let i = 0;
            let y = 0;
            let velocity = 0;
            let start;
            // let initialPoints = 0;
            let lastDebugged = 0;

            emitter.emit([[i++, 0]]);
            emitter.emit([[i++, y]]);

            const generatePoint = () => {
                const points = [];
                const pointsPerIteration = 10;
                for (let j = 0; j < pointsPerIteration; j++) {
                    velocity += (Math.random() - 0.5 - 0.1 * velocity) * 0.1;

                    velocity = Math.max(velocity, -1);
                    velocity = Math.min(velocity, 1);

                    y += velocity;
                    points.push([i++, y]);
                }
                emitter.emit(points);

                if (start && (performance.now() - lastDebugged) > 2000) {
                    lastDebugged = performance.now();
                    console.log(stateController.averageLoopTime);
                    // console.log(`${i} items: ${((i - 1 - initialPoints)/(performance.now() - start)*1000).toFixed(1)} per second`);
                }
            };

            for (let i = 0; i < 100000; i++) {
                generatePoint();
            }

            start = performance.now();
            // initialPoints = i;
            window.pointInterval = setInterval(generatePoint, 20);
        })
    }
];

renderPage(
    <ExamplePage page="high_volume_observable_graph">
        <Grapher
            series={series}
            animationDisabled={true}
            webgl={true}
            exportStateController={exportStateController}
            timingFrameCount={120}
        />
    </ExamplePage>
);
