
//the formula taken from the web needed to colculate the distance betwen to geo dots on the map
//we return it in KM
const Mlen = (point1 , point2) => {
    const R = 6371e3; // metres
    const φ1 = point1[1] * Math.PI/180; // φ, λ in radians
    const φ2 = point2[1] * Math.PI/180;
    const Δφ = (point2[1]-point1[1]) * Math.PI/180;
    const Δλ = (point2[0]-point1[0]) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) *Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // in metres
    return d/1000; // in KM
}

//returns a len betwen 2 dots
const vlen = (vector) => {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

//returns the neg(mirrored) vector
const vnegate = (v) => {
    return [-v[0], -v[1]];
}

//sum to vetctors
const vadd = (v1, v2) => {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}
//sub to vetctors
const vsub = (v1, v2) => {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

//scale a vector
const vscale = (vector, factor) => {
    return [vector[0] * factor, vector[1] * factor];
}

//returns a norm of a vector
const vnorm = (v) => {
    return [-v[1], v[0]];
}

//we draw a normal from our user to a vector we build , from poin a to b when they meet we mesure this normal
//we go like this with all the points we got on our polygon , we save the shortest distance and send it back 
// note :this way is not the best but was the fastes i could implement
// note2: re wright this section so it will fit all the possibal situations 
const closestPointOnPolygon = (point, poly) => {
    let shortestDist = Number.MAX_VALUE;
    let closestPointOnPoly = poly[0];

    poly.forEach( (point1, i) => {
        let prev = (i === 0 ? poly.length : i) - 1;
        let point2 = poly[prev];
        let line = vsub(point2, point1);

        if (vlen(line) === 0) return vlen(vsub(point, point1));

        let norm = vnorm(line);
        let x1 = point[0];
        let x2 = norm[0];
        let x3 = point1[0];
        let x4 = line[0];
        let y1 = point[1];
        let y2 = norm[1];
        let y3 = point1[1];
        let y4 = line[1];
        let j = (x3 - x1 - (x2 * y3) / y2 + (x2 * y1) / y2) / ((x2 * y4) / y2 - x4);

        let currentDistanceToPoly
        let currentPointToPoly
        if (j < 0 || j > 1) {
            const a = vsub(point, point1);
            const aLen = vlen(a);
            const b = vsub(point, point2);
            const bLen = vlen(b);
            if (a < b) {
                currentPointToPoly = vnegate(a);
                currentDistanceToPoly = aLen;
            } else {
                currentPointToPoly = vnegate(b);
                currentDistanceToPoly = bLen;
            }
        } else {
            const i = (y3 + j * y4 - y1) / y2;

            currentPointToPoly = vscale(norm, i);
            currentDistanceToPoly = vlen(currentPointToPoly);
        }

        if (currentDistanceToPoly < shortestDist) {
            closestPointOnPoly = vadd(point, currentPointToPoly);
            shortestDist = currentDistanceToPoly;
        }
    });

    return [closestPointOnPoly, Mlen(point , closestPointOnPoly)]
}
export default closestPointOnPolygon;