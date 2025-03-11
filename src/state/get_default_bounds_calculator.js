import BOUND_CALCULATORS from './bound_calculators';

export default function getDefaultBoundsCalculator(givenLabel, customCalculators) {
    if (BOUND_CALCULATORS[givenLabel]) {
        return BOUND_CALCULATORS[givenLabel];
    }

    for (let { label, calculator } of customCalculators) {
        if (givenLabel === label) {
            return calculator;
        }
    }

    return BOUND_CALCULATORS.all;
}
