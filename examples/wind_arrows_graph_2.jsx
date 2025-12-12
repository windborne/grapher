import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const makeWindPoint = (timestamp, speed, dir) => ({
    timestamp: new Date(timestamp),
    wind_x: speed * Math.cos(dir),
    wind_y: speed * Math.sin(dir)
});

function ThickArrow({ windX, windY, speedPercentile }) {
    const angle = (-Math.atan2(windY, windX) + Math.PI / 2) * 180 / Math.PI;
    const scale = 0.75 + speedPercentile * 0.5;
    
    return (
        <g transform={`rotate(${angle}) scale(${scale})`}>
            <line
                x1={0}
                y1={-6}
                x2={0}
                y2={6}
                stroke="red"
                strokeWidth={3}
            />
            <path
                d="M-5,2 L0,8 L5,2"
                fill="none"
                stroke="red"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
}

const series = [
    {
        data: Array.from({ length: 250 }).map((_, i) => makeWindPoint(Date.now() + i * 1000000, 2 + Math.random(), 2 * Math.random() * Math.PI)),
        windXKey: 'wind_x',
        windYKey: 'wind_y',
        xKey: 'timestamp',
        windComp: ThickArrow,
        defaultAlwaysTooltipped: true,
        followingMouseTooltip: true,
        color: '#ff0000',
        rendering: 'shadow',
        gradient: [
            [0, 'rgba(255, 0, 0, 0.5)'],
            [1, 'rgba(255, 0, 0, 0)']
        ]
    }
];

renderPage(
    <ExamplePage page="wind_arrows_graph_2">
        <Grapher
            series={series}
            webgl={true}
        />
    </ExamplePage>
);

