const BOUND_CALCULATORS = {
    all: () => {},
    lastMinute: (globalBounds) => {
        if (!globalBounds.dates) {
            return;
        }

        return {
            minX: Math.max(new Date(globalBounds.maxX).valueOf() - 60*1000, globalBounds.minX)
        };
    },
    last10Minutes: (globalBounds) => {
        if (!globalBounds.dates) {
            return;
        }

        return {
            minX: Math.max(new Date(globalBounds.maxX).valueOf() - 10*60*1000, globalBounds.minX)
        };
    },
    lastHour: (globalBounds) => {
        if (!globalBounds.dates) {
            return;
        }

        return {
            minX: Math.max(new Date(globalBounds.maxX).valueOf() - 60*60*1000, globalBounds.minX)
        };
    },
    lastDay: (globalBounds) => {
        if (!globalBounds.dates) {
            return;
        }

        return {
            minX: Math.max(new Date(globalBounds.maxX).valueOf() - 24*60*60*1000, globalBounds.minX)
        };
    }
};

export default BOUND_CALCULATORS;
