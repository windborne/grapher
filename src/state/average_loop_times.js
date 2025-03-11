export function averageLoopTimes(loopTimes) {
    const result = {};

    for (let loopTime of loopTimes) {
        for (let [key, value] of Object.entries(loopTime)) {
            result[key] = (result[key] || 0) + value;
        }
    }

    for (let [key, value] of Object.entries(result)) {
        result[key] = value/loopTimes.length;
    }

    return result;
}
