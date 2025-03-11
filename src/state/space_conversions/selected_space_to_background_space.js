export function selectedSpaceToBackgroundSpace({ data, background, minX, maxX }) {
    if (!background) {
        return null;
    }

    const conditions = [];
    for (let [key, color] of Object.entries(background)) {
        if (typeof color === 'object') {
            if (typeof color.evaluator !== 'function') {
                throw new Error('Invalid background declaration: ' + key + ' (evaluator must be a function)');
            }

            conditions.push(Object.assign({
                key,
                comparator: 'custom',
                comparedAgainst: null
            }, color));
            continue;
        }

        if (key === 'null') {
            conditions.push({
                evaluator: (y) => y === null && color,
                color,
                key,
                comparator: '=',
                comparedAgainst: null
            });
            continue;
        }

        const [comparator, value] = key.split(' ');
        if (!comparator || !value || isNaN(parseFloat(value))) {
            throw new Error('Invalid background declaration: ' + key);
        }

        const parsedValue = parseFloat(value);

        let evaluator;
        if (comparator === '=') {
            evaluator = (y) => typeof y === 'number' && y === parsedValue && color;
        } else if (comparator === '<') {
            evaluator = (y) => typeof y === 'number' && y < parsedValue && color;
        } else if (comparator === '>') {
            evaluator = (y) => typeof y === 'number' && y > parsedValue && color;
        } else if (comparator === '<=') {
            evaluator = (y) => typeof y === 'number' && y <= parsedValue && color;
        } else if (comparator === '>=') {
            evaluator = (y) => typeof y === 'number' && y >= parsedValue && color;
        } else {
            throw new Error('Invalid background declaration: ' + key);
        }

        conditions.push({
            evaluator,
            color,
            key,
            comparator,
            comparedAgainst: parsedValue
        });
    }

    const inBackgroundSpace = [];
    let currentSection = null;

    for (let i = 0; i < data.length; i++) {
        let [x, y] = data[i];
        if (x instanceof Date) {
            x = x.valueOf();
        }

        for (let condition of currentSection ? [currentSection.condition, ...conditions] : conditions) {
            const color = condition.evaluator(y);

            if (currentSection) {
                if (currentSection.color === color) {
                    break;
                }

                let interpolatedMaxX = x;
                if (i > 0) {
                    let [prevX, prevY] = data[i - 1];
                    if (prevX instanceof Date) {
                        prevX = prevX.valueOf();
                    }

                    if (currentSection.condition.comparedAgainst === null) {
                        interpolatedMaxX = x;
                    } else if (y === null) {
                        interpolatedMaxX = prevX;
                    } else {
                        interpolatedMaxX = prevX + (condition.comparedAgainst - prevY)/(y - prevY)*(x - prevX);
                    }
                }

                inBackgroundSpace.push({
                    ...currentSection,
                    maxX: interpolatedMaxX,
                    maxXt: (interpolatedMaxX - minX)/(maxX - minX)
                });
                currentSection = null;
            }

            if (color) {
                let interpolatedMinX = x;
                if (i > 0) {
                    let [prevX, prevY] = data[i - 1];
                    if (prevX instanceof Date) {
                        prevX = prevX.valueOf();
                    }

                    if (condition.comparedAgainst === null) {
                        interpolatedMinX = prevX;
                    } else if (prevY === null) {
                        interpolatedMinX = x;
                    } else {
                        interpolatedMinX = prevX + (condition.comparedAgainst - prevY)/(y - prevY)*(x - prevX);
                    }
                }

                currentSection = {
                    minX: interpolatedMinX,
                    minXt: (interpolatedMinX - minX)/(maxX - minX),
                    color,
                    condition
                };

                break;
            }
        }
    }

    if (currentSection) {
        inBackgroundSpace.push({
            ...currentSection,
            maxX: data[data.length - 1][0],
            maxXt: (data[data.length - 1][0] - minX)/(maxX - minX)
        });
    }

    return {
        data: inBackgroundSpace
    };
}
