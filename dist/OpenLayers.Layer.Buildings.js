<<<<<<< HEAD
/**
 * Copyright (C) 2012 OSM Buildings, Jan Marsch
 * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.
 * @osmbuildings, http://osmbuildings.org
 */
//****** file: prefix.js ******

/*jshint bitwise:false */

(function (global) {
    'use strict';


//****** file: shortcuts.js ******

    // object access shortcuts
    var
        Int32Array = Int32Array || Array,
        Uint8Array = Uint8Array || Array,
        exp = Math.exp,
        log = Math.log,
        tan = Math.tan,
        atan = Math.atan,
        min = Math.min,
        max = Math.max,
        doc = global.document
    ;


//****** file: Color.js ******

/*jshint white:false */

var Color = (function () {

    function hsla2rgb(hsla) {
        var r, g, b;

        if (hsla.s === 0) {
            r = g = b = hsla.l; // achromatic
        } else {
            var
                q = hsla.l < 0.5 ? hsla.l * (1 + hsla.s) : hsla.l + hsla.s - hsla.l * hsla.s,
                p = 2 * hsla.l - q
            ;
            r = hue2rgb(p, q, hsla.h + 1 / 3);
            g = hue2rgb(p, q, hsla.h);
            b = hue2rgb(p, q, hsla.h - 1 / 3);
        }
        return new Color(
            r * 255 << 0,
            g * 255 << 0,
            b * 255 << 0,
            hsla.a
        );
    }

    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    function C(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

    var proto = C.prototype;

    proto.toString = function () {
        return 'rgba(' + [this.r << 0, this.g << 0, this.b << 0, this.a.toFixed(2)].join(',') + ')';
    };

    proto.adjustLightness = function (l) {
        var hsla = Color.toHSLA(this);
        hsla.l *= l;
        hsla.l = Math.min(1, Math.max(0, hsla.l));
        return hsla2rgb(hsla);
    };

    proto.adjustAlpha = function (a) {
        return new Color(this.r, this.g, this.b, this.a * a);
    };

    C.parse = function (str) {
        var m;
        str += '';
        if (~str.indexOf('#')) {
            m = str.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);
            return new Color(
                parseInt(m[1], 16),
                parseInt(m[2], 16),
                parseInt(m[3], 16),
                m[4] ? parseInt(m[4], 16) / 255 : 1
            );
        }

        m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/);
        if (m) {
             return new Color(
                parseInt(m[1], 10),
                parseInt(m[2], 10),
                parseInt(m[3], 10),
                m[4] ? parseFloat(m[5], 10) : 1
            );
        }
    };

    C.toHSLA = function (rgba) {
        var
            r = rgba.r / 255,
            g = rgba.g / 255,
            b = rgba.b / 255,
            max = Math.max(r, g, b), min = Math.min(r, g, b),
            h, s, l = (max + min) / 2,
            d
        ;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h, s: s, l: l, a: rgba.a };
    };

    return C;

}());

/*jshint white:true */

//****** file: constants.js ******

    // constants, shared to all instances
    var
        VERSION = '0.1.7a',
        ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

        PI = Math.PI,
        HALF_PI = PI / 2,
        QUARTER_PI = PI / 4,
        RAD = 180 / PI,

        TILE_SIZE = 256,
        MIN_ZOOM = 14, // for buildings data only, GeoJSON should not be affected

        LAT = 'latitude', LON = 'longitude',
        HEIGHT = 0, MIN_HEIGHT = 1, FOOTPRINT = 2, COLOR = 3, CENTER = 4, IS_NEW = 5, RENDER_COLOR = 6
    ;


//****** file: geometry.js ******

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
    }

    function center(points) {
        var len,
            x = 0, y = 0
        ;
        for (var i = 0, il = points.length - 3; i < il; i += 2) {
            x += points[i];
            y += points[i + 1];
        }
        len = (points.length - 2) * 2;
        return [x / len << 0, y / len << 0];
    }

    function getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
        var dx = p2x - p1x,
            dy = p2y - p1y,
            t;
        if (dx !== 0 || dy !== 0) {
            t = ((px - p1x) * dx + (py - p1y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                p1x = p2x;
                p1y = p2y;
            } else if (t > 0) {
                p1x += dx * t;
                p1y += dy * t;
            }
        }
        dx = px - p1x;
        dy = py - p1y;
        return dx * dx + dy * dy;
    }

    function simplify(points) {
        var sqTolerance = 2,
            len = points.length / 2,
            markers = new Uint8Array(len),

            first = 0,
            last  = len - 1,

            i,
            maxSqDist,
            sqDist,
            index,

            firstStack = [],
            lastStack  = [],

            newPoints  = []
        ;

        markers[first] = markers[last] = 1;

        while (last) {
            maxSqDist = 0;

            for (i = first + 1; i < last; i++) {
                sqDist = getSquareSegmentDistance(
                    points[i     * 2], points[i     * 2 + 1],
                    points[first * 2], points[first * 2 + 1],
                    points[last  * 2], points[last  * 2 + 1]
                );
                if (sqDist > maxSqDist) {
                    index = i;
                    maxSqDist = sqDist;
                }
            }

            if (maxSqDist > sqTolerance) {
                markers[index] = 1;

                firstStack.push(first);
                lastStack.push(index);

                firstStack.push(index);
                lastStack.push(last);
            }

            first = firstStack.pop();
            last = lastStack.pop();
        }

        for (i = 0; i < len; i++) {
            if (markers[i]) {
                newPoints.push(points[i * 2], points[i * 2 + 1]);
            }
        }

        return newPoints;
    }


//****** file: prefix.class.js ******

    global.OSMBuildings = function (u) {


//****** file: variables.js ******

        // private variables, specific to an instance
        var
            width = 0, height = 0,
            halfWidth = 0, halfHeight = 0,
            originX = 0, originY = 0,
            zoom, size,

            req,

            canvas, context,

            url,

            wallColor = new Color(200, 190, 180),
            altColor = wallColor.adjustLightness(0.8),
            roofColor = wallColor.adjustLightness(1.2),

            wallColorAlpha = wallColor + '',
            altColorAlpha  = altColor + '',
            roofColorAlpha = roofColor + '',

            rawData,
            meta, data,

            fadeFactor = 1, fadeTimer,
            zoomAlpha = 1,

            minZoom = MIN_ZOOM,
            maxZoom = 20,
            maxHeight,

            camX, camY, camZ,

            isZooming
        ;


//****** file: functions.js ******

        function createCanvas(parentNode) {
            canvas = doc.createElement('canvas');
            canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
            canvas.style.imageRendering = 'optimizeSpeed';
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = 0;
            canvas.style.top = 0;
            parentNode.appendChild(canvas);

            context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 1;

            try {
                context.mozImageSmoothingEnabled = false;
            } catch (err) {
            }

            return canvas;
        }

        function destroyCanvas() {
            canvas.parentNode.removeChild(canvas);
        }

        function pixelToGeo(x, y) {
            var res = {};
            x /= size;
            y /= size;
            res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
            res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
            return res;
        }

        function geoToPixel(lat, lon) {
            var
                latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
                longitude = lon / 360 + 0.5
            ;
            return {
                x: longitude * size << 0,
                y: latitude  * size << 0
            };
        }

        function template(str, data) {
            return str.replace(/\{ *([\w_]+) *\}/g, function (x, key) {
                return data[key];
            });
        }


//****** file: data.js ******

        function xhr(url, callback) {
            var x = new XMLHttpRequest();
            x.onreadystatechange = function () {
                if (x.readyState !== 4) {
                    return;
                }
                if (!x.status || x.status < 200 || x.status > 299) {
                    return;
                }
                if (x.responseText) {
                    callback(JSON.parse(x.responseText));
                }
            };
            x.open('GET', url);
            x.send(null);
            return x;
        }

        function loadData() {
            if (!url || zoom < MIN_ZOOM) {
                return;
            }
            var
                // create bounding box of double viewport size
                nw = pixelToGeo(originX         - halfWidth, originY          - halfHeight),
                se = pixelToGeo(originX + width + halfWidth, originY + height + halfHeight)
            ;
            if (req) {
                req.abort();
            }
            req = xhr(template(url, {
                w: nw[LON],
                n: nw[LAT],
                e: se[LON],
                s: se[LAT],
                z: zoom
            }), onDataLoaded);
        }

        function onDataLoaded(res) {
            var
                i, il,
                resData, resMeta,
                keyList = [], k,
                offX = 0, offY = 0,
                item,
                footprint
            ;

            minZoom = MIN_ZOOM;
            setZoom(zoom); // recalculating all zoom related variables
            req = null;

            // no response or response not matching current zoom (too old response)
            if (!res || res.meta.z !== zoom) {
                return;
            }

            resMeta = res.meta;
            resData = res.data;

            // offset between old and new data set
            if (meta && data && meta.z === resMeta.z) {
                offX = meta.x - resMeta.x;
                offY = meta.y - resMeta.y;

                // identify already present buildings to fade in new ones
                for (i = 0, il = data.length; i < il; i++) {
                    // id key: x,y of first point - good enough
                    keyList[i] = (data[i][FOOTPRINT][0] + offX) + ',' + (data[i][FOOTPRINT][1] + offY);
                }
            }

            meta = resMeta;
            data = [];

            // var polyCountBefore = 0, polyCountAfter = 0, start = Date.now();

            for (i = 0, il = resData.length; i < il; i++) {
                item = [];

                if (resData[i][MIN_HEIGHT] > maxHeight) {
                    continue;
                }

                // polyCountBefore += resData[i][FOOTPRINT].length;

                footprint = simplify(resData[i][FOOTPRINT]);

                // polyCountAfter += footprint.length;

                if (footprint.length < 8) { // 3 points & end = start (x2)
                    continue;
                }

                item[FOOTPRINT] = footprint;
                item[CENTER] = center(footprint);

                item[HEIGHT] = min(resData[i][HEIGHT], maxHeight);
                item[MIN_HEIGHT] = resData[i][MIN_HEIGHT];

                k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
                item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

                item[COLOR] = [];
                item[RENDER_COLOR] = [];

                data.push(item);
            }

            // console.log(polyCountBefore, polyCountAfter, Date.now() - start);

            resMeta = resData = keyList = null; // gc
            fadeIn();
        }

        // detect polygon winding direction: clockwise or counter clockwise
        function getPolygonWinding(points) {
            var
                x1, y1, x2, y2,
                a = 0,
                i, il
            ;
            for (i = 0, il = points.length - 3; i < il; i += 2) {
                x1 = points[i];
                y1 = points[i + 1];
                x2 = points[i + 2];
                y2 = points[i + 3];
                a += x1 * y2 - x2 * y1;
            }
            return (a / 2) > 0 ? 'CW' : 'CCW';
        }

        // make polygon winding clockwise. This is needed for proper backface culling on client side.
        function makeClockwiseWinding(points) {
            var winding = getPolygonWinding(points);
            if (winding === 'CW') {
                return points;
            }
            var revPoints = [];
            for (var i = points.length - 2; i >= 0; i -= 2) {
                revPoints.push(points[i], points[i + 1]);
            }
            return revPoints;
        }

        function scaleData(data, isNew) {
            var
                res = [],
                i, il, j, jl,
                oldItem, item,
                coords, p,
				minHeight,
                footprint,
                z = maxZoom - zoom
            ;

            for (i = 0, il = data.length; i < il; i++) {
                oldItem = data[i];

                // TODO: later on, keep continued' objects in order not to loose them on zoom back in

				minHeight = oldItem[MIN_HEIGHT] >> z;
                if (minHeight > maxHeight) {
                    continue;
                }

                coords = oldItem[FOOTPRINT];
                footprint = new Int32Array(coords.length);
                for (j = 0, jl = coords.length - 1; j < jl; j += 2) {
                    p = geoToPixel(coords[j], coords[j + 1]);
                    footprint[j]     = p.x;
                    footprint[j + 1] = p.y;
                }

                footprint = simplify(footprint);
                if (footprint.length < 8) { // 3 points & end = start (x2)
                    continue;
                }

                item = [];
                item[FOOTPRINT]   = footprint;
                item[CENTER]      = center(footprint);
                item[HEIGHT]      = min(oldItem[HEIGHT] >> z, maxHeight);
                item[MIN_HEIGHT]  = minHeight;
                item[IS_NEW]      = isNew;
                item[COLOR]       = oldItem[COLOR];
                item[RENDER_COLOR] = [];

                for (j = 0; j < 3; j++) {
                    if (item[COLOR][j]) {
                        item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
                    }
                }

                res.push(item);
            }

            return res;
        }

        function geoJSON(url, isLatLon) {
            if (typeof url === 'object') {
                setData(url, !isLatLon);
                return;
            }
            var
                el = doc.documentElement,
                callback = 'jsonpCallback',
                script = doc.createElement('script')
            ;
            global[callback] = function (res) {
                delete global[callback];
                el.removeChild(script);
                setData(res, !isLatLon);
            };
            el.insertBefore(script, el.lastChild).src = url.replace(/\{callback\}/, callback);
        }

        function parseGeoJSON(json, isLonLat, res) {
            if (res === undefined) {
                res = [];
            }

            var
                i, il,
                j, jl,
                features = json[0] ? json : json.features,
                geometry, polygons, coords, properties,
                footprint, heightSum,
                propHeight, propWallColor, propRoofColor,
                lat = isLonLat ? 1 : 0,
                lon = isLonLat ? 0 : 1,
                alt = 2,
                item
            ;

            if (features) {
                for (i = 0, il = features.length; i < il; i++) {
                    parseGeoJSON(features[i], isLonLat, res);
                }
                return res;
            }

            if (json.type === 'Feature') {
                geometry = json.geometry;
                properties = json.properties;
            }
        //      else geometry = json

            if (geometry.type === 'Polygon') {
                polygons = [geometry.coordinates];
            }
            if (geometry.type === 'MultiPolygon') {
                polygons = geometry.coordinates;
            }

            if (polygons) {
                propHeight = properties.height;
                if (properties.color || properties.wallColor) {
                    propWallColor = Color.parse(properties.color || properties.wallColor);
                }
                if (properties.roofColor) {
                    propRoofColor = Color.parse(properties.roofColor);
                }

                for (i = 0, il = polygons.length; i < il; i++) {
                    coords = polygons[i][0];
                    footprint = [];
                    heightSum = 0;
                    for (j = 0, jl = coords.length; j < jl; j++) {
                        footprint.push(coords[j][lat], coords[j][lon]);
                        heightSum += propHeight || coords[j][alt] || 0;
                    }

                    if (heightSum) {
                        item = [];
                        item[FOOTPRINT] = makeClockwiseWinding(footprint);
                        item[HEIGHT]    = heightSum / coords.length << 0;
                        item[COLOR] = [
                            propWallColor || null,
                            propWallColor ? propWallColor.adjustLightness(0.8) : null,
                            propRoofColor ? propRoofColor : propWallColor ? propWallColor.adjustLightness(1.2) : roofColor
                        ];
                        res.push(item);
                    }
                }
            }
            return res;
        }

        function setData(json, isLonLat) {
            if (!json) {
                rawData = null;
                render(); // effectively clears
                return;
            }

            rawData = parseGeoJSON(json, isLonLat);
            minZoom = 0;
            setZoom(zoom); // recalculating all zoom related variables

            meta = {
                n: 90,
                w: -180,
                s: -90,
                e: 180,
                x: 0,
                y: 0,
                z: zoom
            };
            data = scaleData(rawData, true);

            fadeIn();
        }

//****** file: properties.js ******

        function setSize(w, h) {
            width  = w;
            height = h;
            halfWidth  = width / 2 << 0;
            halfHeight = height / 2 << 0;
            camX = halfWidth;
            camY = height;
            camZ = width / tan(90 / 2) << 0; // adapting cam pos to field of view (90°)
            canvas.width = width;
            canvas.height = height;
            // TODO: change of maxHeight needs to adjust building heights!
            maxHeight = camZ - 50;
        }

        function setOrigin(x, y) {
            originX = x;
            originY = y;
        }

        function setZoom(z) {
            var i, il, j,
                item
            ;

            zoom = z;
            size = TILE_SIZE << zoom;

            zoomAlpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);

            wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';
            altColorAlpha  = altColor.adjustAlpha(zoomAlpha) + '';
            roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';

wallColorAlpha = wallColor + '';
altColorAlpha  = altColor + '';
roofColorAlpha = roofColor + '';

            if (data) {
                for (i = 0, il = data.length; i < il; i++) {
                    item = data[i];
                    item[RENDER_COLOR] = [];
                    for (j = 0; j < 3; j++) {
                        if (item[COLOR][j]) {
                            item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
                        }
                    }
                }
            }
        }

        function setCam(x, y) {
            camX = x;
            camY = y;
        }

        function setStyle(style) {
            style = style || {};
            if (style.color || style.wallColor) {
                wallColor = Color.parse(style.color || style.wallColor);
                wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';

                altColor = wallColor.adjustLightness(0.8);
                altColorAlpha = altColor.adjustAlpha(zoomAlpha) + '';

                roofColor = wallColor.adjustLightness(1.2);
                roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
            }

            if (style.roofColor) {
                roofColor = Color.parse(style.roofColor);
                roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
            }

            render();
        }


//****** file: events.js ******

        function onResize(e) {
            setSize(e.width, e.height);
            render();
            loadData();
        }

        function onMove(e) {
            setOrigin(e.x, e.y);
            render();
        }

        function onMoveEnd(e) {
            var
                nw = pixelToGeo(originX,         originY),
                se = pixelToGeo(originX + width, originY + height)
            ;
            render();
            // check, whether viewport is still within loaded data bounding box
            if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
                loadData();
            }
        }

        function onZoomStart(e) {
            isZooming = true;
            render(); // effectively clears because of isZooming flag
        }

        function onZoomEnd(e) {
            isZooming = false;
            setZoom(e.zoom);

            if (rawData) {
                data = scaleData(rawData);
                render();
            } else {
                render();
                loadData();
            }
        }


//****** file: render.js ******

        function fadeIn() {
            fadeFactor = 0;
            clearInterval(fadeTimer);
            fadeTimer = setInterval(function () {
                fadeFactor += 0.5 * 0.2; // amount * easing
                if (fadeFactor > 1) {
                    clearInterval(fadeTimer);
                    fadeFactor = 1;
                    // unset 'already present' marker
                    for (var i = 0, il = data.length; i < il; i++) {
                        data[i][IS_NEW] = 0;
                    }
                }
                render();
            }, 33);
        }


        function render() {
            context.clearRect(0, 0, width, height);
//context.fillStyle = 'rgba(240,235,230,0.75)';
//context.fillRect(0, 0, width, height);

            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint,
                isVisible
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] * 0.5 - distance(a[CENTER], sortCam) / a[HEIGHT] * 0.5 ;
            });

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

                isVisible = false;
                f = item[FOOTPRINT];
                footprint = []; // typed array would be created each pass and is way too slow
                for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                    footprint[j]     = x = (f[j]     - offX);
                    footprint[j + 1] = y = (f[j + 1] - offY);

                    // checking footprint is sufficient for visibility
                    if (!isVisible) {
                        isVisible = (x > 0 && x < width && y > 0 && y < height);
                    }
                }

                if (!isVisible) {
                    continue;
                }


if(item[HEIGHT] > 7) {
                camX += 10;
                wallColorAlpha = new Color((wallColor.g * 0.7 + wallColor.b * 0.3 ), 128, 128, wallColor.a / 2) + '';
                altColorAlpha  = new Color((altColor.g  * 0.7 + altColor.b  * 0.3 ), 128, 128, altColor.a  / 2) + '';
                roofColorAlpha = new Color((roofColor.g * 0.7 + roofColor.b * 0.3 ), 128, 128, roofColor.a / 2) + '';
                drawBuilding(item, footprint);

                camX -= 20;
                wallColorAlpha = new Color(128, (wallColor.g) , (wallColor.b) , wallColor.a / 2) + '';
                altColorAlpha  = new Color(128, (altColor.g ) , (altColor.b ) ,  altColor.a / 2) + '';
                roofColorAlpha = new Color(128, (roofColor.g) , (roofColor.b) , roofColor.a / 2) + '';
                drawBuilding(item, footprint);

                camX += 10;

                wallColorAlpha = wallColor + '';
                altColorAlpha  = altColor  + '';
                roofColorAlpha = roofColor + '';
                //drawBuilding(item, footprint);
} else {
                drawBuilding(item, footprint);
}
            }
        }

        function drawBuilding(item, footprint) {
//if(item[HEIGHT] > 7) console.log(wallColorAlpha, altColorAlpha, roofColorAlpha);
            var
                j, jl,
                h, m,
                roof, walls,
                ax, ay, bx, by, _a, _b
            ;

            // when fading in, use a dynamic height
            h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

            // precalculating projection height scale
            m = CAM_Z / (CAM_Z - h);

            roof = []; // typed array would be created each pass and is way too slow
            walls = [];

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                bx = footprint[j + 2];
                by = footprint[j + 3];

                // project 3d to 2d on extruded footprint
                _a = project(ax, ay, m);
                _b = project(bx, by, m);

                // backface culling check
                if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                    walls = [
                        bx + 0.5, by + 0.5,
                        ax + 0.5, ay + 0.5,
                        _a.x, _a.y,
                        _b.x, _b.y
                    ];

                    // depending on direction, set wall shading
                    if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                        context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                    } else {
                        context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                    }
                    drawShape(walls);
                }

                roof[j]     = _a.x;
                roof[j + 1] = _a.y;
            }

            // fill roof and optionally stroke it
            context.fillStyle   = item[RENDERCOLOR][2] || roofColorAlpha;
            context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
            drawShape(roof, false);
        }







        function renderPass() {
            context.clearRect(0, 0, width, height);
context.fillStyle = 'rgba(241, 237, 233, 0.25)';
context.fillRect(0, 0, width, height);

            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f, h, m,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by, _a, _b
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] * 0.5 - distance(a[CENTER], sortCam) / a[HEIGHT] * 0.5 ;
            });

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

                isVisible = false;
                f = item[FOOTPRINT];
                footprint = []; // typed array would be created each pass and is way too slow
                for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                    footprint[j]     = x = (f[j]     - offX);
                    footprint[j + 1] = y = (f[j + 1] - offY);

                    // checking footprint is sufficient for visibility
                    if (!isVisible) {
                        isVisible = (x > 0 && x < width && y > 0 && y < height);
                    }
                }

                if (!isVisible) {
                    continue;
                }

                // when fading in, use a dynamic height
                h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

                // precalculating projection height scale
                m = CAM_Z / (CAM_Z - h);

                roof = []; // typed array would be created each pass and is way too slow
                walls = [];

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    // project 3d to 2d on extruded footprint
                    _a = project(ax, ay, m);
                    _b = project(bx, by, m);

                    // backface culling check
                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // fill roof and optionally stroke it
                context.fillStyle   = item[RENDERCOLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
                drawShape(roof, false);
            }
        }

        function render() {
            context.clearRect(0, 0, width, height);

            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f, h, m, n,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by,
                a, b, _a, _b
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
            });

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

                isVisible = false;
                f = item[FOOTPRINT];
                footprint = []; // typed array would be created each pass and is way too slow
                for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                    footprint[j]     = x = (f[j]     - offX);
                    footprint[j + 1] = y = (f[j + 1] - offY);

                    // checking footprint is sufficient for visibility
                    if (!isVisible) {
                        isVisible = (x > 0 && x < width && y > 0 && y < height);
                    }
                }

                if (!isVisible) {
                    continue;
                }

                // when fading in, use a dynamic height
                h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
                // precalculating projection height scale
                m = camZ / (camZ - h);

                // prepare same calculations for min_height if applicable
                if (item[MIN_HEIGHT]) {
                    h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
                    n = camZ / (camZ - h);
                }

                roof = []; // typed array would be created each pass and is way too slow
                walls = [];

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    // project 3d to 2d on extruded footprint
                    _a = project(ax, ay, m);
                    _b = project(bx, by, m);

                    if (item[MIN_HEIGHT]) {
                        a = project(ax, ay, n);
                        b = project(bx, by, n);
                        ax = a.x;
                        ay = a.y;
                        bx = b.x;
                        by = b.y;
                    }

                    // backface culling check
                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // fill roof and optionally stroke it
                context.fillStyle = item[RENDER_COLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;
                drawShape(roof, true);
            }
        }

        function renderX() {
            var algo = 'optimized-anaglyphs';

            camX -= 10;
            renderPass();
            var canvasData1 = context.getImageData(0, 0, width, height);

            camX += 20;
            renderPass();
            var canvasData2 = context.getImageData(0, 0, width, height);

            camX -= 10;

            var
                data1 = canvasData1.data,
                data2 = canvasData2.data,
                R, G, B
            ;

            for (var i = 0, il = data1.length; i < il; i+= 4) {
                R = i;
                G = i + 1;
                B = i + 2;
                switch (algo) {
                    case 'true-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[B] = 0.299 * data2[R] + 0.587 * data2[G] + 0.114 * data2[B];
                        break;
                    case 'optimized-anaglyphs':
                        data1[R] = 0.7 * data1[G] + 0.3 * data1[B];
                        data1[G] = data2[G];
                        data1[B] = data2[B];
                        break;
                    case 'gray-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[G] = data1[B] = 0.299 * data2[R] + 0.587 * data2[G] + 0.114 * data2[B];
                        break;
                    case 'color-anaglyphs':
                        data1[R] = data1[R];
                        data1[G] = data2[R];
                        data1[B] = data2[B];
                        break;
                    case 'half-color-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[G] = data2[R];
                        data1[B] = data2[B];
                        break;
                }
            }

            context.clearRect(0, 0, width, height);
            context.putImageData(canvasData1, 0, 0);
        }

        function debugMarker(x, y, color, size) {
            context.fillStyle = color || '#ffcc00';
            context.beginPath();
            context.arc(x, y, size || 3, 0, PI * 2, true);
            context.closePath();
            context.fill();
        }

        function drawShape(points, stroke) {
            if (!points.length) {
                return;
            }

            context.beginPath();
            context.moveTo(points[0], points[1]);
            for (var i = 2, il = points.length; i < il; i += 2) {
                context.lineTo(points[i], points[i + 1]);
            }
            context.closePath();
            if (stroke) {
                context.stroke();
            }
            context.fill();
        }

        function project(x, y, m) {
            return {
                x: ((x - camX) * m + camX << 0) + 0.5, // + 0.5: disabling(!) anti alias
                y: ((y - camY) * m + camY << 0) + 0.5  // + 0.5: disabling(!) anti alias
            };
        }


//****** file: public.js ******

        this.setStyle = function (style) {
            setStyle(style);
            return this;
        };

        this.geoJSON = function (url, isLatLon) {
            geoJSON(url, isLatLon);
            return this;
        };

        this.setCamOffset = function (x, y) {
            camX = halfWidth + x;
            camY = height    + y;
        };

        this.setMaxZoom = function (z) {
            maxZoom = z;
        };

        this.createCanvas  = createCanvas;
        this.destroyCanvas = destroyCanvas;
        this.loadData      = loadData;
        this.onMoveEnd     = onMoveEnd;
        this.onZoomEnd     = onZoomEnd;
        this.onZoomStart   = onZoomStart;
        this.render        = render;
        this.setOrigin     = setOrigin;
        this.setSize       = setSize;
        this.setZoom       = setZoom;


//****** file: suffix.class.js ******

        url = u;
    };

    global.OSMBuildings.VERSION = VERSION;
    global.OSMBuildings.ATTRIBUTION = ATTRIBUTION;


//****** file: suffix.js ******

}(this));

/*jshint bitwise:true */

//****** file: OpenLayers.js ******

/**
 * basing on a pull request from Jérémy Judéaux (https://github.com/Volune)
 */

OpenLayers.Layer.Buildings = OpenLayers.Class(OpenLayers.Layer, {

    CLASS_NAME: 'OpenLayers.Layer.Buildings',

    name: 'OSM Buildings',
    attribution: OSMBuildings.ATTRIBUTION,

    isBaseLayer: false,
    alwaysInRange: true,

    dxSum: 0, // for cumulative cam offset during moveBy
    dySum: 0, // for cumulative cam offset during moveBy

    initialize: function (options) {
        options = options || {};
        options.projection = 'EPSG:900913';
        OpenLayers.Layer.prototype.initialize(this.name, options);
    },

    setOrigin: function () {
        var
            origin = this.map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
            res = this.map.resolution,
            ext = this.maxExtent,
            x = Math.round((origin.lon - ext.left) / res),
            y = Math.round((ext.top - origin.lat) / res)
        ;
        this.osmb.setOrigin(x, y);
    },

    setMap: function (map) {
        if (!this.map) {
            OpenLayers.Layer.prototype.setMap(map);
            this.osmb = new OSMBuildings(this.options.url);
            this.osmb.createCanvas(this.div);
            this.osmb.setSize(this.map.size.w, this.map.size.h);
            this.osmb.setZoom(this.map.zoom);
            this.setOrigin();
            this.osmb.loadData();
        }
    },

    removeMap: function (map) {
        this.osmb.destroyCanvas();
        this.osmb = null;
        OpenLayers.Layer.prototype.removeMap(map);
    },

    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize();
        this.osmb.onResize({ width: this.map.size.w, height: this.map.size.h });
    },

    moveTo: function (bounds, zoomChanged, dragging) {
        var result = OpenLayers.Layer.prototype.moveTo(bounds, zoomChanged, dragging);
        if (!dragging) {
            var
                offsetLeft = parseInt(this.map.layerContainerDiv.style.left, 10),
                offsetTop  = parseInt(this.map.layerContainerDiv.style.top, 10)
            ;
            this.div.style.left = -offsetLeft + 'px';
            this.div.style.top  = -offsetTop  + 'px';
        }

        this.setOrigin();
        this.dxSum = 0;
        this.dySum = 0;
        this.osmb.setCamOffset(this.dxSum, this.dySum);

        if (zoomChanged) {
            this.osmb.onZoomEnd({ zoom: this.map.zoom });
        } else {
            this.osmb.onMoveEnd();
        }

        return result;
    },

    moveByPx: function (dx, dy) {
        this.dxSum += dx;
        this.dySum += dy;
        var result = OpenLayers.Layer.prototype.moveByPx(dx, dy);
        this.osmb.setCamOffset(this.dxSum, this.dySum);
        this.osmb.render();
        return result;
    },

    geoJSON: function (url, isLatLon) {
        return this.osmb.geoJSON(url, isLatLon);
    },

    setStyle: function (style)  {
        return this.osmb.setStyle(style);
    }
});


=======
(function(o){function M(n,p){var v=n[0]-p[0],e=n[1]-p[1];return v*v+e*e}function R(n){for(var p=0,v=0,e=0,h=n.length-3;e<h;e+=2){p+=n[e];v+=n[e+1]}n=(n.length-2)*2;return[p/n<<0,v/n<<0]}function xa(n){var p=n.length/2,v=new La(p),e=0,h=p-1,j,t,q,D,J=[],N=[],K=[];for(v[e]=v[h]=1;h;){t=0;for(j=e+1;j<h;j++){q=n[j*2];var $=n[j*2+1],O=n[e*2],U=n[e*2+1],aa=n[h*2],G=n[h*2+1],u=aa-O,z=G-U,E=void 0;if(u!==0||z!==0){E=((q-O)*u+($-U)*z)/(u*u+z*z);if(E>1){O=aa;U=G}else if(E>0){O+=u*E;U+=z*E}}u=q-O;z=$-U;q=u*
u+z*z;if(q>t){D=j;t=q}}if(t>2){v[D]=1;J.push(e);N.push(D);J.push(D);N.push(h)}e=J.pop();h=N.pop()}for(j=0;j<p;j++)v[j]&&K.push(n[j*2],n[j*2+1]);return K}var Ma=Ma||Array,La=La||Array,ca=Math,Pa=ca.exp,Qa=ca.log,Ra=ca.sin,Sa=ca.cos,Ea=ca.tan,Ta=ca.atan,ka=ca.min,Fa=ca.max,ya=o.document,V=function(){function n(e,h,j){if(j<0)j+=1;if(j>1)j-=1;if(j<1/6)return e+(h-e)*6*j;if(j<0.5)return h;if(j<2/3)return e+(h-e)*(2/3-j)*6;return e}function p(e,h,j,t){this.r=e;this.g=h;this.b=j;this.a=arguments.length<
4?1:t}var v=p.prototype;v.toString=function(){return"rgba("+[this.r<<0,this.g<<0,this.b<<0,this.a.toFixed(2)].join(",")+")"};v.adjustLightness=function(e){var h=V.toHSLA(this);h.l*=e;h.l=Math.min(1,Math.max(0,h.l));var j,t;if(h.s===0)e=j=t=h.l;else{t=h.l<0.5?h.l*(1+h.s):h.l+h.s-h.l*h.s;var q=2*h.l-t;e=n(q,t,h.h+1/3);j=n(q,t,h.h);t=n(q,t,h.h-1/3)}return new V(e*255<<0,j*255<<0,t*255<<0,h.a)};v.adjustAlpha=function(e){return new V(this.r,this.g,this.b,this.a*e)};p.parse=function(e){e+="";if(~e.indexOf("#")){e=
e.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new V(parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16),e[4]?parseInt(e[4],16)/255:1)}if(e=e.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new V(parseInt(e[1],10),parseInt(e[2],10),parseInt(e[3],10),e[4]?parseFloat(e[5],10):1)};p.toHSLA=function(e){var h=e.r/255,j=e.g/255,t=e.b/255,q=Math.max(h,j,t),D=Math.min(h,j,t),J,N=(q+D)/2,K;if(q===D)J=D=0;else{K=q-D;D=N>0.5?K/(2-q-D):K/(q+D);switch(q){case h:J=(j-t)/K+(j<t?6:0);break;case j:J=
(t-h)/K+2;break;case t:J=(h-j)/K+4;break}J/=6}return{h:J,s:D,l:N,a:e.a}};return p}(),Ua=function(){var n=Math,p=n.sin,v=n.cos,e=n.tan,h=n.asin,j=n.atan2,t=n.PI,q=180/t,D=357.5291/q,J=0.98560028/q,N=1.9148/q,K=0.02/q,$=3.0E-4/q,O=102.9372/q,U=23.45/q,aa=280.16/q,G=360.9856235/q;return function(u,z,E){E=-E/q;z=z/q;u=u.valueOf()/864E5-0.5+2440588;var F=D+J*(u-2451545),H=N*p(F)+K*p(2*F)+$*p(3*F);H=F+O+H+t;F=h(p(H)*p(U));H=j(p(H)*v(U),v(H));E=aa+G*(u-2451545)-E-H;return{altitude:h(p(z)*p(F)+v(z)*v(F)*
v(E)),azimuth:j(p(E),v(E)*p(z)-e(F)*v(z))-t/2}}}(),la=Math.PI,Na=la/2,Va=la/4,Wa=180/la,Xa=256,Ga=14,ma="latitude",na="longitude",S=0,P=1,T=2,da=3,za=4,ga=5,ba=6;o.OSMBuildings=function(n){function p(a,c){var d={};a/=oa;c/=oa;d[ma]=c<=0?90:c>=1?-90:Wa*(2*Ta(Pa(la*(1-2*c)))-Na);d[na]=(a===1?1:(a%1+1)%1)*360-180;return d}function v(a,c){return a.replace(/\{ *([\w_]+) *\}/g,function(d,b){return c[b]})}function e(a,c){var d=new XMLHttpRequest;d.onreadystatechange=function(){if(d.readyState===4)!d.status||
d.status<200||d.status>299||d.responseText&&c(JSON.parse(d.responseText))};d.open("GET",a);d.send(null);return d}function h(){if(!(!Ha||Q<Ga)){var a=p(F-z,H-E),c=p(F+G+z,H+u+E);Aa&&Aa.abort();Aa=e(v(Ha,{w:a[na],n:a[ma],e:c[na],s:c[ma],z:Q}),j)}}function j(a){var c,d,b,f=[],g,i=g=0;ia=Ga;N(Q);Aa=null;if(!(!a||a.meta.z!==Q)){b=a.meta;d=a.data;if(C&&x&&C.z===b.z){g=C.x-b.x;i=C.y-b.y;a=0;for(c=x.length;a<c;a++)f[a]=x[a][T][0]+g+","+(x[a][T][1]+i)}C=b;x=[];a=0;for(c=d.length;a<c;a++){b=[];if(!(d[a][P]>
pa)){g=xa(d[a][T]);if(!(g.length<8)){b[T]=g;b[za]=R(g);b[S]=ka(d[a][S],pa);b[P]=d[a][P];g=b[T][0]+","+b[T][1];b[ga]=!(f&&~f.indexOf(g));b[da]=[];b[ba]=[];x.push(b)}}}K()}}function t(a,c){var d=[],b,f,g,i,k,m,l,A,w,I=Ia-Q;b=0;for(f=a.length;b<f;b++){k=a[b];A=k[P]>>I;if(!(A>pa)){m=k[T];w=new Ma(m.length);g=0;for(i=m.length-1;g<i;g+=2){l=m[g+1];var y=ka(1,Fa(0,0.5-Qa(Ea(Va+Na*m[g]/180))/la/2));l={x:(l/360+0.5)*oa<<0,y:y*oa<<0};w[g]=l.x;w[g+1]=l.y}w=xa(w);if(!(w.length<8)){i=[];i[T]=w;i[za]=R(w);i[S]=
ka(k[S]>>I,pa);i[P]=A;i[ga]=c;i[da]=k[da];i[ba]=[];for(g=0;g<3;g++)if(i[da][g])i[ba][g]=i[da][g].adjustAlpha(X)+"";d.push(i)}}}return d}function q(a,c){if(typeof a==="object")J(a,!c);else{var d=ya.documentElement,b=ya.createElement("script");o.jsonpCallback=function(f){delete o.jsonpCallback;d.removeChild(b);J(f,!c)};d.insertBefore(b,d.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function D(a,c,d){if(d===undefined)d=[];var b,f,g,i=a[0]?a:a.features,k,m,l,A,w,I=c?1:0,y=c?0:1;if(i){b=0;
for(a=i.length;b<a;b++)D(i[b],c,d);return d}if(a.type==="Feature"){k=a.geometry;b=a.properties}if(k.type==="Polygon")m=[k.coordinates];if(k.type==="MultiPolygon")m=k.coordinates;if(m){c=b.height;if(b.color||b.wallColor)A=V.parse(b.color||b.wallColor);if(b.roofColor)w=V.parse(b.roofColor);b=0;for(a=m.length;b<a;b++){i=m[b][0];l=[];f=k=0;for(g=i.length;f<g;f++){l.push(i[f][I],i[f][y]);k+=c||i[f][2]||0}if(k){f=[];g=T;var r=void 0,s=void 0,B=void 0,L=void 0,Y=0,Z=void 0,qa=void 0;Z=0;for(qa=l.length-
3;Z<qa;Z+=2){r=l[Z];s=l[Z+1];B=l[Z+2];L=l[Z+3];Y+=r*L-B*s}if((Y/2>0?"CW":"CCW")==="CW")l=l;else{r=[];for(s=l.length-2;s>=0;s-=2)r.push(l[s],l[s+1]);l=r}f[g]=l;f[S]=k/i.length<<0;f[da]=[A||null,A?A.adjustLightness(0.8):null,w?w:A?A.adjustLightness(1.2):ha];d.push(f)}}}return d}function J(a,c){if(a){ra=D(a,c);ia=0;N(Q);C={n:90,w:-180,s:-90,e:180,x:0,y:0,z:Q};x=t(ra,true);K()}else{ra=null;O()}}function N(a){var c,d,b;Q=a;oa=Xa<<Q;a=Q;c=ia;d=Ia;a=ka(Fa(a,c),d);X=1-ka(Fa(0+(a-c)/(d-c)*0.4,0),0.4);Ja=ea.adjustAlpha(X)+
"";sa=Ba.adjustAlpha(X)+"";ta=ha.adjustAlpha(X)+"";if(x){a=0;for(c=x.length;a<c;a++){b=x[a];b[ba]=[];for(d=0;d<3;d++)if(b[da][d])b[ba][d]=b[da][d].adjustAlpha(X)+""}}}function K(){clearInterval(Ka);fa=0;Ca.render();Ka=setInterval(function(){fa+=0.1;if(fa>1){clearInterval(Ka);fa=1;for(var a=0,c=x.length;a<c;a++)x[a][ga]=0}Da.render();O()},33)}function $(){Da.render();Ca.render();O()}function O(){W.clearRect(0,0,G,u);if(!(!C||!x||Q<ia||ua)){var a,c,d,b,f,g,i,k,m,l=F-C.x,A=H-C.y,w=Ca.getMaxHeight(),
I=[va+l,wa+A],y,r,s,B,L,Y;x.sort(function(Z,qa){return M(qa[za],I)/qa[S]-M(Z[za],I)/Z[S]});a=0;for(c=x.length;a<c;a++){f=x[a];if(!(f[S]<=w)){r=false;g=f[T];y=[];d=0;for(b=g.length-1;d<b;d+=2){y[d]=k=g[d]-l;y[d+1]=m=g[d+1]-A;r||(r=k>0&&k<G&&m>0&&m<u)}if(r){d=f[ga]?f[S]*fa:f[S];g=ja/(ja-d);if(f[P]){d=f[ga]?f[P]*fa:f[P];i=ja/(ja-d)}k=[];d=0;for(b=y.length-3;d<b;d+=2){m=y[d];s=y[d+1];r=y[d+2];B=y[d+3];L=aa(m,s,g);Y=aa(r,B,g);if(f[P]){s=aa(m,s,i);B=aa(r,B,i);m=s.x;s=s.y;r=B.x;B=B.y}if((r-m)*(L.y-s)>(L.x-
m)*(B-s)){W.fillStyle=m<r&&s<B||m>r&&s>B?f[ba][1]||sa:f[ba][0]||Ja;U([r,B,m,s,L.x,L.y,Y.x,Y.y])}k[d]=L.x;k[d+1]=L.y}W.fillStyle=f[ba][2]||ta;W.strokeStyle=f[ba][1]||sa;U(k,true)}}}}}function U(a,c){if(a.length){W.beginPath();W.moveTo(a[0],a[1]);for(var d=2,b=a.length;d<b;d+=2)W.lineTo(a[d],a[d+1]);W.closePath();c&&W.stroke();W.fill()}}function aa(a,c,d){return{x:(a-va)*d+va<<0,y:(c-wa)*d+wa<<0}}var G=0,u=0,z=0,E=0,F=0,H=0,Q,oa,Aa,W,Ha,ea=new V(200,190,180),Ba=ea.adjustLightness(0.8),ha=ea.adjustLightness(1.2),
Ja=ea+"",sa=Ba+"",ta=ha+"",ra,C,x,fa=1,Ka,X=1,ia=Ga,Ia=20,pa,va,wa,ja,ua,Oa={container:null,items:[],init:function(a){var c=this.container=ya.createElement("DIV");c.style.pointerEvents="none";c.style.position="absolute";c.style.left=0;c.style.top=0;Da.init(this.add());Ca.init(this.add());W=this.add();a.appendChild(c);return c},add:function(){var a=ya.createElement("CANVAS");a.style.webkitTransform="translate3d(0,0,0)";a.style.imageRendering="optimizeSpeed";a.style.position="absolute";a.style.left=
0;a.style.top=0;var c=a.getContext("2d");c.lineCap="round";c.lineJoin="round";c.lineWidth=1;try{c.mozImageSmoothingEnabled=false}catch(d){}this.items.push(a);this.container.appendChild(a);return c},setSize:function(a,c){for(var d=this.items,b=0,f=d.length;b<f;b++){d[b].width=a;d[b].height=c}}},Da={context:null,color:new V(0,0,0),colorStr:this.color+"",date:null,alpha:1,length:0,directionX:0,directionY:0,init:function(a){this.context=a;this.setDate((new Date).setHours(10))},render:function(){var a=
this.context,c,d,b,f;a.clearRect(0,0,G,u);if(!(!C||!x||Q<ia||ua)){c=p(F+z,H+E);c=Ua(this.date,c.latitude,c.longitude);if(!(c.altitude<=0)){d=1/Ea(c.altitude);b=0.4/d;this.directionX=Sa(c.azimuth)*d;this.directionY=Ra(c.azimuth)*d;this.color.a=b;f=this.color+"";var g,i,k,m,l,A=F-C.x,w=H-C.y,I,y,r,s,B,L,Y=[];a.beginPath();c=0;for(d=x.length;c<d;c++){i=x[c];y=false;k=i[T];I=[];b=0;for(g=k.length-1;b<g;b+=2){I[b]=m=k[b]-A;I[b+1]=l=k[b+1]-w;y||(y=m>0&&m<G&&l>0&&l<u)}if(y){k=i[ga]?i[S]*fa:i[S];if(i[P])k=
i[ga]?i[P]*fa:i[P];m=null;b=0;for(g=I.length-3;b<g;b+=2){l=I[b];r=I[b+1];y=I[b+2];s=I[b+3];B=this.project(l,r,k);L=this.project(y,s,k);if(i[P]){r=this.project(l,r,k);s=this.project(y,s,k);l=r.x;r=r.y;y=s.x;s=s.y}if((y-l)*(B.y-r)>(B.x-l)*(s-r)){m===1&&a.lineTo(l,r);m=0;b||a.moveTo(l,r);a.lineTo(y,s)}else{m===0&&a.lineTo(B.x,B.y);m=1;b||a.moveTo(B.x,B.y);a.lineTo(L.x,L.y)}}a.closePath();Y.push(I)}}a.fillStyle=f;a.fill();a.globalCompositeOperation="destination-out";a.beginPath();c=0;for(d=Y.length;c<
d;c++){f=Y[c];a.moveTo(f[0],f[1]);b=2;for(g=f.length;b<g;b+=2)a.lineTo(f[b],f[b+1]);a.lineTo(f[0],f[1]);a.closePath()}a.fillStyle="#00ff00";a.fill();a.globalCompositeOperation="source-over"}}},project:function(a,c,d){return{x:a+this.directionX*d,y:c+this.directionY*d}},setDate:function(a){this.date=a;this.render()}},Ca={context:null,maxHeight:8,init:function(a){this.context=a},render:function(){var a=this.context;a.clearRect(0,0,G,u);if(!(!C||!x||Q<ia||ua)){var c,d,b,f,g,i,k,m=F-C.x,l=H-C.y,A,w;a.beginPath();
c=0;for(d=x.length;c<d;c++){b=x[c];w=false;g=b[T];A=[];b=0;for(f=g.length-1;b<f;b+=2){A[b]=i=g[b]-m;A[b+1]=k=g[b+1]-l;w||(w=i>0&&i<G&&k>0&&k<u)}if(w){b=0;for(f=A.length-3;b<f;b+=2){w=A[b];g=A[b+1];b?a.lineTo(w,g):a.moveTo(w,g)}a.closePath()}}a.fillStyle=ta;a.strokeStyle=sa;a.stroke();a.fill()}},getMaxHeight:function(){return this.maxHeight}};this.setStyle=function(a){a=(a=a)||{};if(a.color||a.wallColor){ea=V.parse(a.color||a.wallColor);Ja=ea.adjustAlpha(X)+"";Ba=ea.adjustLightness(0.8);sa=Ba.adjustAlpha(X)+
"";ha=ea.adjustLightness(1.2);ta=ha.adjustAlpha(X)+""}if(a.roofColor){ha=V.parse(a.roofColor);ta=ha.adjustAlpha(X)+""}$();return this};this.geoJSON=function(a,c){q(a,c);return this};this.setCamOffset=function(a,c){va=z+a;wa=u+c};this.setMaxZoom=function(a){Ia=a};this.setDate=function(a){Da.setDate(a);return this};this.appendTo=function(a){return Oa.init(a)};this.loadData=h;this.onMoveEnd=function(){var a=p(F,H),c=p(F+G,H+u);$();if(C&&(a[ma]>C.n||a[na]<C.w||c[ma]<C.s||c[na]>C.e))h()};this.onZoomEnd=
function(a){ua=false;N(a.zoom);if(ra){x=t(ra);$()}else{O();h()}};this.onZoomStart=function(){ua=true;$()};this.setOrigin=function(a,c){F=a;H=c};this.setSize=function(a,c){G=a;u=c;z=G/2<<0;E=u/2<<0;va=z;wa=u;ja=G/1.5/Ea(45)<<0;Oa.setSize(G,u);pa=ja-50};this.setZoom=N;this.render=O;Ha=n};o.OSMBuildings.VERSION="0.1.8a";o.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
OpenLayers.Layer.Buildings=OpenLayers.Class(OpenLayers.Layer,{CLASS_NAME:"OpenLayers.Layer.Buildings",name:"OSM Buildings",attribution:OSMBuildings.ATTRIBUTION,isBaseLayer:false,alwaysInRange:true,dxSum:0,dySum:0,initialize:function(o){o=o||{};o.projection="EPSG:900913";OpenLayers.Layer.prototype.initialize(this.name,o)},setOrigin:function(){var o=this.map.getLonLatFromPixel(new OpenLayers.Pixel(0,0)),M=this.map.resolution,R=this.maxExtent;this.osmb.setOrigin(Math.round((o.lon-R.left)/M),Math.round((R.top-
o.lat)/M))},setMap:function(o){this.map||OpenLayers.Layer.prototype.setMap(o);if(!this.osmb){this.osmb=new OSMBuildings(this.options.url);this.container=this.osmb.appendTo(this.div)}this.osmb.setSize(this.map.size.w,this.map.size.h);this.osmb.setZoom(this.map.zoom);this.setOrigin();this.osmb.loadData()},removeMap:function(o){this.container.parentNode.removeChild(this.container);OpenLayers.Layer.prototype.removeMap(o)},onMapResize:function(){OpenLayers.Layer.prototype.onMapResize();this.osmb.onResize({width:this.map.size.w,
height:this.map.size.h})},moveTo:function(o,M,R){o=OpenLayers.Layer.prototype.moveTo(o,M,R);if(!R){R=parseInt(this.map.layerContainerDiv.style.left,10);var xa=parseInt(this.map.layerContainerDiv.style.top,10);this.div.style.left=-R+"px";this.div.style.top=-xa+"px"}this.setOrigin();this.dySum=this.dxSum=0;this.osmb.setCamOffset(this.dxSum,this.dySum);M?this.osmb.onZoomEnd({zoom:this.map.zoom}):this.osmb.onMoveEnd();return o},moveByPx:function(o,M){this.dxSum+=o;this.dySum+=M;var R=OpenLayers.Layer.prototype.moveByPx(o,
M);this.osmb.setCamOffset(this.dxSum,this.dySum);this.osmb.render();return R},geoJSON:function(o,M){return this.osmb.geoJSON(o,M)},setStyle:function(o){return this.osmb.setStyle(o)},setDate:function(o){return this.osmb.setDate(o)}});
>>>>>>> master
