
function vec2(x,y) {
    return { x:x, y:y }
}

const main = (highlighted, pointAmount, ctx, ctx2, width, height) => {
    ctx.clearRect(0,0,width,height);
    ctx2.clearRect(0,0,width,height);
    height = height - height*0.05;
    width = width - width*0.05;
    let pointsPerSection = pointAmount;
    let dots = generate(pointAmount, Math.random(), width, height, pointsPerSection, functions);
    // drawLines(dots, ctx);
    drawCurves(dots, ctx2);
    // drawCircles(dots, highlighted, ctx);
    drawCircles(dots, highlighted, ctx2);
};

const generate = (pointsAmount, seed, width, height, pointsPerSection, functions) => {
    let startPoint = vec2(width / 2, height);
    let sections = Math.floor(pointsAmount / pointsPerSection);
    let remaining = pointsAmount % pointsPerSection;
    let drawPoints = [];
    let drawHeight = height/(sections+1) || height;
    for (let i = 1; i <= sections; i++) {
        let pickedFunction = Math.floor(Math.random()*functions.length);
        seed = Math.random();
        let tempPoints = functions[pickedFunction](pointsPerSection, seed, width, drawHeight, startPoint);
        startPoint = tempPoints[tempPoints.length-1];
        drawPoints = drawPoints.concat(tempPoints);
        //drawPoints = tempPoints;
    }
    if (remaining >= 0) {
        let pickedFunction = Math.floor(Math.random()*functions.length);
        drawPoints = drawPoints.concat(functions[pickedFunction](remaining-1, seed, width, drawHeight, startPoint));
    }
    drawPoints.push(vec2(width/2, 0));
    return drawPoints;
    // noise.seed(seed);
    // points = [];
    // for (let x = 0; x < width; x++) {
    //   for (let y = 0; y < height; y++) {
    //     // All noise functions return values in the range of -1 to 1.
    //     // noise.simplex2 and noise.perlin2 for 2d noise
    //     var value = noise.simplex2(x, y);
    //     if (value >= 0.997889 && points.length < pointsAmount) {
    //       points.push(vec2(y, x));
    //     }
    //   }
    // }
    // return points;
};


//Radius should go from .01 to 1
const drawSpiral = (pointsAmount, radius, width, height, startPoint) => {
    width = height;
    return createSpiralDots(pointsAmount, startPoint, width, height);
};


//Radius should go from .04 to 1
const drawVerticalSine = (pointsAmount, radius, width, height, startPoint) => {
    let points = [];
    let minimumSineRadius = 0.4;
    let currentPoint = startPoint;
    let maxSineRadius = 0.8;
    if (radius < minimumSineRadius) radius += minimumSineRadius;
    if (radius > maxSineRadius) radius = maxSineRadius;
    for (let i = pointsAmount-1; i >= 0; i --) {
        let increaseY = currentPoint.y - height/pointsAmount;
        let newX = Math.sin(height/pointsAmount*i)*radius*width/2+width/2;
        currentPoint = vec2(newX, increaseY);
        points.push(currentPoint);
    }
    return points;
};

const drawHorizontalCosine = (pointsAmount, radius, width, height, startPoint) => {
    let points = [];
    let minimumCosineRadius = 0.4;
    let currentPoint = startPoint;
    let direction = 1;
    if (startPoint.x > width/2)
        direction = -1;
    if (radius < minimumCosineRadius) radius += minimumCosineRadius;
    for (let i = pointsAmount-1; i >= 1; i --) {
        let increaseX = currentPoint.x + width/2/pointsAmount*direction;
        let newY = startPoint.y-Math.cos(increaseX)*radius*height/2-height/2;
        currentPoint = vec2(increaseX, newY);
        points.push(currentPoint);
    }
    let increaseX = currentPoint.x + width/2/pointsAmount*direction;
    points.push(vec2(increaseX, startPoint.y-height));
    return points;
};

const drawCircles = (dots, highlighted, context) => {
    let counter = 0;
    let color = 'blue';
    console.log(dots);
    dots.map((dot) => {
        counter++;
        if (counter > highlighted)
            color = 'green';

        drawCircle(dot, color, context);
    })
    console.log(counter);
};

const drawCircle = ({x, y}, color, context) => {
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
};

const drawCurves = (points, ctx) => {

    if (points && points.length > 0) {
        ctx.moveTo((points[0].x), points[0].y);
        let pts = [];
        points.map(point => {
            pts.push(point.x);
            pts.push(point.y);
        });
        curve(ctx, pts);
        ctx.stroke();
        ctx.beginPath();
        // ctx.fill();

    }
};

const drawLines = (dots, context) => {

    context.beginPath();
    context.moveTo(dots[0].x,dots[0].y);
    for (let i = 1; i < dots.length; i++) {
        context.lineTo(dots[i].x, dots[i].y);
        context.stroke();
    }
};


/**
 * Draws a cardinal spline through given point array. Points must be arranged
 * as: [x1, y1, x2, y2, ..., xn, yn]. It adds the points to the current path.
 *
 * There must be a minimum of two points in the input array but the function
 * is only useful where there are three points or more.
 *
 * The method continues previous path of the context. If you don't want that
 * then you need to use moveTo() with the first point from the input array.
 *
 * The points for the cardinal spline are returned as a new array.
 *
 * @param {CanvasRenderingContext2D} ctx - context to use
 * @param {Array} points - point array
 * @param {Number} [tension=0.5] - tension. Typically between [0.0, 1.0] but can be exceeded
 * @param {Number} [numOfSeg=25] - number of segments between two points (line resolution)
 * @param {Boolean} [close=false] - Close the ends making the line continuous
 * @returns {Float32Array} New array with the calculated points that was added to the path
 */
function curve(ctx, points, tension, numOfSeg, close) {

    'use strict';

    if (typeof points === "undefined" || points.length < 2) return new Float32Array(0);

    // options or defaults
    tension = typeof tension === "number" ? tension : 0.5;
    numOfSeg = typeof numOfSeg === "number" ? numOfSeg : 25;

    let pts,															// for cloning point array
        i = 1,
        l = points.length,
        rPos = 0,
        rLen = (l-2) * numOfSeg + 2 + (close ? 2 * numOfSeg: 0),
        res = new Float32Array(rLen),
        cache = new Float32Array((numOfSeg + 2) << 2),
        cachePtr = 4;

    pts = points.slice(0);

    if (close) {
        pts.unshift(points[l - 1]);										// insert end point as first point
        pts.unshift(points[l - 2]);
        pts.push(points[0], points[1]); 								// first point as last point
    }
    else {
        pts.unshift(points[1]);											// copy 1. point and insert at beginning
        pts.unshift(points[0]);
        pts.push(points[l - 2], points[l - 1]);							// duplicate end-points
    }

    // cache inner-loop calculations as they are based on t alone
    cache[0] = 1;														// 1,0,0,0

    for (; i < numOfSeg; i++) {

        let st = i / numOfSeg,
            st2 = st * st,
            st3 = st2 * st,
            st23 = st3 * 2,
            st32 = st2 * 3;

        cache[cachePtr++] =	st23 - st32 + 1;							// c1
        cache[cachePtr++] =	st32 - st23;								// c2
        cache[cachePtr++] =	st3 - 2 * st2 + st;							// c3
        cache[cachePtr++] =	st3 - st2;									// c4
    }

    cache[++cachePtr] = 1;												// 0,1,0,0

    // calc. points
    parse(pts, cache, l, tension);

    if (close) {
        pts = [];
        pts.push(points[l - 4], points[l - 3],
            points[l - 2], points[l - 1], 							// second last and last
            points[0], points[1],
            points[2], points[3]); 								// first and second
        parse(pts, cache, 4, tension);
    }

    function parse(pts, cache, l, tension) {

        for (let i = 2, t; i < l; i += 2) {

            let pt1 = pts[i],
                pt2 = pts[i+1],
                pt3 = pts[i+2],
                pt4 = pts[i+3],

                t1x = (pt3 - pts[i-2]) * tension,
                t1y = (pt4 - pts[i-1]) * tension,
                t2x = (pts[i+4] - pt1) * tension,
                t2y = (pts[i+5] - pt2) * tension,
                c = 0, c1, c2, c3, c4;

            for (t = 0; t < numOfSeg; t++) {

                c1 = cache[c++];
                c2 = cache[c++];
                c3 = cache[c++];
                c4 = cache[c++];

                res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
                res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
            }
        }
    }

    // add last point
    l = close ? 0 : points.length - 2;
    res[rPos++] = points[l++];
    res[rPos] = points[l];
    // add lines to path
    for(i = 0, l = res.length; i < l; i += 2)
        ctx.lineTo(res[i], res[i+1]);

    return res
}

if (typeof exports !== "undefined") exports.curve = curve;


/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
//
// (function(global){
//   var module = global.noise = {};
//
//   function Grad(x, y, z) {
//     this.x = x; this.y = y; this.z = z;
//   }
//
//   Grad.prototype.dot2 = function(x, y) {
//     return this.x*x + this.y*y;
//   };
//
//   Grad.prototype.dot3 = function(x, y, z) {
//     return this.x*x + this.y*y + this.z*z;
//   };
//
//   var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
//     new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
//     new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
//
//   var p = [151,160,137,91,90,15,
//     131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
//     190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
//     88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
//     77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
//     102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
//     135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
//     5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
//     223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
//     129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
//     251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
//     49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
//     138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
//   // To remove the need for index wrapping, double the permutation table length
//   var perm = new Array(512);
//   var gradP = new Array(512);
//
//   // This isn't a very good seeding function, but it works ok. It supports 2^16
//   // different seed values. Write something better if you need more seeds.
//   module.seed = function(seed) {
//     if(seed > 0 && seed < 1) {
//       // Scale the seed out
//       seed *= 65536;
//     }
//
//     seed = Math.floor(seed);
//     if(seed < 256) {
//       seed |= seed << 8;
//     }
//
//     for(var i = 0; i < 256; i++) {
//       var v;
//       if (i & 1) {
//         v = p[i] ^ (seed & 255);
//       } else {
//         v = p[i] ^ ((seed>>8) & 255);
//       }
//
//       perm[i] = perm[i + 256] = v;
//       gradP[i] = gradP[i + 256] = grad3[v % 12];
//     }
//   };
//
//   module.seed(0);
//
//   /*
//   for(var i=0; i<256; i++) {
//     perm[i] = perm[i + 256] = p[i];
//     gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
//   }*/
//
//   // Skewing and unskewing factors for 2, 3, and 4 dimensions
//   var F2 = 0.5*(Math.sqrt(3)-1);
//   var G2 = (3-Math.sqrt(3))/6;
//
//   var F3 = 1/3;
//   var G3 = 1/6;
//
//   // 2D simplex noise
//   module.simplex2 = function(xin, yin) {
//     var n0, n1, n2; // Noise contributions from the three corners
//     // Skew the input space to determine which simplex cell we're in
//     var s = (xin+yin)*F2; // Hairy factor for 2D
//     var i = Math.floor(xin+s);
//     var j = Math.floor(yin+s);
//     var t = (i+j)*G2;
//     var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
//     var y0 = yin-j+t;
//     // For the 2D case, the simplex shape is an equilateral triangle.
//     // Determine which simplex we are in.
//     var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
//     if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
//       i1=1; j1=0;
//     } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
//       i1=0; j1=1;
//     }
//     // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
//     // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
//     // c = (3-sqrt(3))/6
//     var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
//     var y1 = y0 - j1 + G2;
//     var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
//     var y2 = y0 - 1 + 2 * G2;
//     // Work out the hashed gradient indices of the three simplex corners
//     i &= 255;
//     j &= 255;
//     var gi0 = gradP[i+perm[j]];
//     var gi1 = gradP[i+i1+perm[j+j1]];
//     var gi2 = gradP[i+1+perm[j+1]];
//     // Calculate the contribution from the three corners
//     var t0 = 0.5 - x0*x0-y0*y0;
//     if(t0<0) {
//       n0 = 0;
//     } else {
//       t0 *= t0;
//       n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
//     }
//     var t1 = 0.5 - x1*x1-y1*y1;
//     if(t1<0) {
//       n1 = 0;
//     } else {
//       t1 *= t1;
//       n1 = t1 * t1 * gi1.dot2(x1, y1);
//     }
//     var t2 = 0.5 - x2*x2-y2*y2;
//     if(t2<0) {
//       n2 = 0;
//     } else {
//       t2 *= t2;
//       n2 = t2 * t2 * gi2.dot2(x2, y2);
//     }
//     // Add contributions from each corner to get the final noise value.
//     // The result is scaled to return values in the interval [-1,1].
//     return 70 * (n0 + n1 + n2);
//   };
//
//   // 3D simplex noise
//   module.simplex3 = function(xin, yin, zin) {
//     var n0, n1, n2, n3; // Noise contributions from the four corners
//
//     // Skew the input space to determine which simplex cell we're in
//     var s = (xin+yin+zin)*F3; // Hairy factor for 2D
//     var i = Math.floor(xin+s);
//     var j = Math.floor(yin+s);
//     var k = Math.floor(zin+s);
//
//     var t = (i+j+k)*G3;
//     var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
//     var y0 = yin-j+t;
//     var z0 = zin-k+t;
//
//     // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
//     // Determine which simplex we are in.
//     var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
//     var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
//     if(x0 >= y0) {
//       if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
//       else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
//       else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
//     } else {
//       if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
//       else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
//       else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
//     }
//     // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
//     // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
//     // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
//     // c = 1/6.
//     var x1 = x0 - i1 + G3; // Offsets for second corner
//     var y1 = y0 - j1 + G3;
//     var z1 = z0 - k1 + G3;
//
//     var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
//     var y2 = y0 - j2 + 2 * G3;
//     var z2 = z0 - k2 + 2 * G3;
//
//     var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
//     var y3 = y0 - 1 + 3 * G3;
//     var z3 = z0 - 1 + 3 * G3;
//
//     // Work out the hashed gradient indices of the four simplex corners
//     i &= 255;
//     j &= 255;
//     k &= 255;
//     var gi0 = gradP[i+   perm[j+   perm[k   ]]];
//     var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
//     var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
//     var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];
//
//     // Calculate the contribution from the four corners
//     var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
//     if(t0<0) {
//       n0 = 0;
//     } else {
//       t0 *= t0;
//       n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
//     }
//     var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
//     if(t1<0) {
//       n1 = 0;
//     } else {
//       t1 *= t1;
//       n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
//     }
//     var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
//     if(t2<0) {
//       n2 = 0;
//     } else {
//       t2 *= t2;
//       n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
//     }
//     var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
//     if(t3<0) {
//       n3 = 0;
//     } else {
//       t3 *= t3;
//       n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
//     }
//     // Add contributions from each corner to get the final noise value.
//     // The result is scaled to return values in the interval [-1,1].
//     return 32 * (n0 + n1 + n2 + n3);
//
//   };
//
//   // ##### Perlin noise stuff
//
//   function fade(t) {
//     return t*t*t*(t*(t*6-15)+10);
//   }
//
//   function lerp(a, b, t) {
//     return (1-t)*a + t*b;
//   }
//
//   // 2D Perlin Noise
//   module.perlin2 = function(x, y) {
//     // Find unit grid cell containing point
//     var X = Math.floor(x), Y = Math.floor(y);
//     // Get relative xy coordinates of point within that cell
//     x = x - X; y = y - Y;
//     // Wrap the integer cells at 255 (smaller integer period can be introduced here)
//     X = X & 255; Y = Y & 255;
//
//     // Calculate noise contributions from each of the four corners
//     var n00 = gradP[X+perm[Y]].dot2(x, y);
//     var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
//     var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
//     var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);
//
//     // Compute the fade curve value for x
//     var u = fade(x);
//
//     // Interpolate the four results
//     return lerp(
//       lerp(n00, n10, u),
//       lerp(n01, n11, u),
//       fade(y));
//   };
//
//   // 3D Perlin Noise
//   module.perlin3 = function(x, y, z) {
//     // Find unit grid cell containing point
//     var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
//     // Get relative xyz coordinates of point within that cell
//     x = x - X; y = y - Y; z = z - Z;
//     // Wrap the integer cells at 255 (smaller integer period can be introduced here)
//     X = X & 255; Y = Y & 255; Z = Z & 255;
//
//     // Calculate noise contributions from each of the eight corners
//     var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
//     var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
//     var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
//     var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
//     var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
//     var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
//     var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
//     var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);
//
//     // Compute the fade curve value for x, y, z
//     var u = fade(x);
//     var v = fade(y);
//     var w = fade(z);
//
//     // Interpolate
//     return lerp(
//       lerp(
//         lerp(n000, n100, u),
//         lerp(n001, n101, u), w),
//       lerp(
//         lerp(n010, n110, u),
//         lerp(n011, n111, u), w),
//       v);
//   };
//
// })(this);


let points = 0;
const functions = [];
// functions.push(drawVerticalSine);
// functions.push(drawHorizontalCosine);
functions.push(drawSpiral);
let c=document.getElementById("canvas1");
let c2=document.getElementById("canvas2");
let ctx=c.getContext("2d");
let ctx2=c2.getContext("2d");
let canvasWidth = c.clientWidth;
let canvasHeight = c.clientHeight;

let drawDots = (ctx, dotsAmount, width, height) => {
    ctx.clearRect(0,0, width, height);
    let dots = createSpiralDots(dotsAmount/2, vec2(80,200), width/4, height/4);
     dots = dots.concat(createSpiralDots(dotsAmount/2, vec2(80,100), width/4, height/4));
    drawCurves(dots, ctx);
    drawCircles(dots, 1,ctx);
};

let createSpiralDots = (dotsAmount, startPoint, width, height) => {
    dots = [];
    let radius = 1;
    let decrease = Math.PI*2;
    for (i = 0; i <  dotsAmount - 1 ; i++) {
        radius -= 0.06;
        if (radius <= 0)
            radius = 0;
        dots.push(addDot(startPoint, width, height, radius, decrease, false));
        decrease -= 16/dotsAmount;
        //decrease--;
    }
    dots.push(vec2(width/2, startPoint.y - height));
    // radius = 0;
    // for (i = 0; i < dotsAmount/2 ; i++) {
    //     radius += 0.05;
    //     if (radius >= 1)
    //         radius = 1;
    //     dots.push(addDot(startPoint, 300, 300, radius, increase, true));
    //     increase++;
    // }
    return dots;
};

let addDot = (origin, width, height, radius, increase, flipVertical) => {
    let verticalMultiplier = 1;
    if (flipVertical)
        verticalMultiplier = -1;
    width /= 2;
    height /= 2;
    let x = Math.sin(increase) * width * radius + origin.x;
    let y = verticalMultiplier * Math.cos(increase) * height * radius + origin.y;
    return(vec2(x,y));
};

drawDots(ctx, canvasWidth, canvasHeight);
window.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
        // drawDots(ctx, ++points, canvasWidth, canvasHeight)
        main(15, ++points,ctx, ctx2, canvasWidth, canvasHeight);

    } else {
        if (points > 0);
            // drawDots(ctx, --points, canvasWidth, canvasHeight)
            main(15, --points,ctx, ctx2, canvasWidth, canvasHeight);
    }
});
