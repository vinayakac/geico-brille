/**
 * A component to calculate Pearson correlation.
 * 
 * @param {Array} x - The array of x
 * @param {Array} y - The array of y
 * @returns {string} A value of Pearson correlation
 */
export default function PearsonCorrelation(x, y) {
    // reference: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    const minLength = x.length = y.length = Math.min(x.length, y.length),
    reduce = (xi, idx) => {
        const yi = y[idx];
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
        sumY2 += yi * yi;
    };

    x.forEach(reduce);

    let num = (minLength * sumXY - sumX * sumY);
    let den = Math.sqrt(Math.abs(minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));

    if (den == 0) {return 0;}

    return num / den;
}