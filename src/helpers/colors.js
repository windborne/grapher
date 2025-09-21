export const LINE_COLORS = [
  "#F1C232",
  "#1259f8",
  "#cb4b4b",
  "#4da74d",
  "#9440ed",
  "#61e0ed",
  "#ed6d2c",
  "#ed13c6",
  "#bbed59",
];

export default function getColor(seriesColor, i, multigrapherSeriesIndex) {
  if (typeof seriesColor === "string") {
    return seriesColor;
  }

  if (typeof seriesColor === "number") {
    return LINE_COLORS[seriesColor % LINE_COLORS.length];
  }

  if (multigrapherSeriesIndex !== undefined) {
    return LINE_COLORS[multigrapherSeriesIndex % LINE_COLORS.length];
  }

  return LINE_COLORS[i % LINE_COLORS.length];
}

/**
 * Applies reduced opacity to a color
 * @param {string} color 
 * @param {number} opacityFactor 
 * @returns {string}
 */
export function applyReducedOpacity(color, opacityFactor) {
  if (!color) return color;

  if (color.startsWith("rgba(")) {
    const matches = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (matches) {
      const [, r, g, b, a] = matches;
      const newAlpha = parseFloat(a) * opacityFactor;
      return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
    }
  }

  if (color.startsWith("rgb(")) {
    const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (matches) {
      const [, r, g, b] = matches;
      return `rgba(${r}, ${g}, ${b}, ${opacityFactor})`;
    }
  }

  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacityFactor})`;
  }

  return color;
}

/**
 * Applies reduced opacity to a gradient
 * @param {Array<[number, string]>} gradient 
 * @param {number} opacityFactor 
 * @returns {Array<[number, string]>}
 */
export function applyReducedOpacityToGradient(gradient, opacityFactor) {
  if (!gradient || !Array.isArray(gradient)) {
    return gradient;
  }

  return gradient.map((stop) => {
    if (Array.isArray(stop) && stop.length === 2) {
      const [position, color] = stop;
      const translucentColor = applyReducedOpacity(color, opacityFactor);
      return [position, translucentColor];
    } else if (typeof stop === "string") {
      return applyReducedOpacity(stop, opacityFactor);
    }
    return stop;
  });
}
