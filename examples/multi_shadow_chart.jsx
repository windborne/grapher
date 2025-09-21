import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page.js';
import ExamplePage from './example_page.jsx';

const generateData = (amplitude, phase, noiseAmount, length = 72) => {
    const data = [];
    for (let i = 0; i < length; i++) {
        const x = (i / length) * Math.PI * 4; 
        const baseValue = 70 + amplitude * Math.sin(x + phase);
        const noise = (Math.random() - 0.5) * noiseAmount;
        data.push(baseValue + noise);
    }
    return data;
};

const series = [
    {
        data: generateData(5, 0, 0.5),
        rendering: 'shadow',
        color: 'rgba(0, 160, 128, 1)',
        width: 2,
        gradient: [
            [0.0, 'rgba(0, 160, 128, 0.3)'],  
            [0.3, 'rgba(0, 160, 128, 0.1)'],   
            [0.6, 'rgba(0, 0, 0, 0)']          
        ],
    },
    {
        data: generateData(5, Math.PI/6, 0.7), 
        rendering: 'shadow', 
        color: 'rgb(0, 99, 160)',
        width: 2,
        gradient: [
            [0.0, 'rgba(0, 99, 160, 0.3)'],  
            [0.3, 'rgba(0, 99, 160, 0.1)'],   
            [0.6, 'rgba(0, 0, 0, 0)']          
        ],
    },
    {
        data: generateData(6, Math.PI/4, 0.6),
        rendering: 'shadow',
        color: 'rgb(160, 144, 0)',
        width: 2,
        gradient: [
            [0.0, 'rgba(160, 144, 0, 0.3)'],  
            [0.3, 'rgba(160, 144, 0, 0.1)'],   
            [0.6, 'rgba(0, 0, 0, 0)']          
        ],
    },
    {
        data: generateData(7, Math.PI/3, 0.8),
        rendering: 'shadow',
        color: 'rgb(185, 99, 168)',
        width: 2,
        gradient: [
            [0.0, 'rgba(185, 99, 168, 0.3)'], 
            [0.3, 'rgba(185, 99, 168, 0.1)'],  
            [0.6, 'rgba(0, 0, 0, 0)']          
        ],
    }
];

renderPage(
    <ExamplePage page="multi_shadow_chart">
        <style>
        {`
            .grapher .axis-item path {
                stroke: rgba(30, 30, 30, 0.5) !important;
            }
            .grapher .axis-line {
                stroke: rgba(60, 60, 60, 0.5) !important;
            }
        `}
        </style>
        <Grapher
            series={series}
            showGrid={true}
            webgl={true}
        />
    </ExamplePage>
);
