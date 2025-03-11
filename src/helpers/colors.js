export const LINE_COLORS = [
    '#F1C232',
    '#1259f8',
    '#cb4b4b',
    '#4da74d',
    '#9440ed',
    '#61e0ed',
    '#ed6d2c',
    '#ed13c6',
    '#bbed59'
];

export default function getColor(seriesColor, i, multigrapherSeriesIndex) {
    if (typeof seriesColor === 'string') {
        return seriesColor;
    }

    if (typeof seriesColor === 'number') {
        return LINE_COLORS[seriesColor % LINE_COLORS.length];
    }

    if (multigrapherSeriesIndex !== undefined) {
        return LINE_COLORS[multigrapherSeriesIndex % LINE_COLORS.length];
    }

    return LINE_COLORS[i % LINE_COLORS.length];
}
