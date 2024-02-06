/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ 420: /***/ (
      __unused_webpack_module,
      __unused_webpack___webpack_exports__,
      __webpack_require__
    ) => {
      "use strict"; // CONCATENATED MODULE: ./node_modules/animejs/lib/anime.es.js

      /*
       * anime.js v3.2.1
       * (c) 2020 Julian Garnier
       * Released under the MIT license
       * animejs.com
       */

      // Defaults

      var defaultInstanceSettings = {
        update: null,
        begin: null,
        loopBegin: null,
        changeBegin: null,
        change: null,
        changeComplete: null,
        loopComplete: null,
        complete: null,
        loop: 1,
        direction: "normal",
        autoplay: true,
        timelineOffset: 0,
      };

      var defaultTweenSettings = {
        duration: 1000,
        delay: 0,
        endDelay: 0,
        easing: "easeOutElastic(1, .5)",
        round: 0,
      };

      var validTransforms = [
        "translateX",
        "translateY",
        "translateZ",
        "rotate",
        "rotateX",
        "rotateY",
        "rotateZ",
        "scale",
        "scaleX",
        "scaleY",
        "scaleZ",
        "skew",
        "skewX",
        "skewY",
        "perspective",
        "matrix",
        "matrix3d",
      ];

      // Caching

      var cache = {
        CSS: {},
        springs: {},
      };

      // Utils

      function minMax(val, min, max) {
        return Math.min(Math.max(val, min), max);
      }

      function stringContains(str, text) {
        return str.indexOf(text) > -1;
      }

      function applyArguments(func, args) {
        return func.apply(null, args);
      }

      var is = {
        arr: function (a) {
          return Array.isArray(a);
        },
        obj: function (a) {
          return stringContains(Object.prototype.toString.call(a), "Object");
        },
        pth: function (a) {
          return is.obj(a) && a.hasOwnProperty("totalLength");
        },
        svg: function (a) {
          return a instanceof SVGElement;
        },
        inp: function (a) {
          return a instanceof HTMLInputElement;
        },
        dom: function (a) {
          return a.nodeType || is.svg(a);
        },
        str: function (a) {
          return typeof a === "string";
        },
        fnc: function (a) {
          return typeof a === "function";
        },
        und: function (a) {
          return typeof a === "undefined";
        },
        nil: function (a) {
          return is.und(a) || a === null;
        },
        hex: function (a) {
          return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a);
        },
        rgb: function (a) {
          return /^rgb/.test(a);
        },
        hsl: function (a) {
          return /^hsl/.test(a);
        },
        col: function (a) {
          return is.hex(a) || is.rgb(a) || is.hsl(a);
        },
        key: function (a) {
          return (
            !defaultInstanceSettings.hasOwnProperty(a) &&
            !defaultTweenSettings.hasOwnProperty(a) &&
            a !== "targets" &&
            a !== "keyframes"
          );
        },
      };

      // Easings

      function parseEasingParameters(string) {
        var match = /\(([^)]+)\)/.exec(string);
        return match
          ? match[1].split(",").map(function (p) {
              return parseFloat(p);
            })
          : [];
      }

      // Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

      function spring(string, duration) {
        var params = parseEasingParameters(string);
        var mass = minMax(is.und(params[0]) ? 1 : params[0], 0.1, 100);
        var stiffness = minMax(is.und(params[1]) ? 100 : params[1], 0.1, 100);
        var damping = minMax(is.und(params[2]) ? 10 : params[2], 0.1, 100);
        var velocity = minMax(is.und(params[3]) ? 0 : params[3], 0.1, 100);
        var w0 = Math.sqrt(stiffness / mass);
        var zeta = damping / (2 * Math.sqrt(stiffness * mass));
        var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
        var a = 1;
        var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

        function solver(t) {
          var progress = duration ? (duration * t) / 1000 : t;
          if (zeta < 1) {
            progress =
              Math.exp(-progress * zeta * w0) *
              (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
          } else {
            progress = (a + b * progress) * Math.exp(-progress * w0);
          }
          if (t === 0 || t === 1) {
            return t;
          }
          return 1 - progress;
        }

        function getDuration() {
          var cached = cache.springs[string];
          if (cached) {
            return cached;
          }
          var frame = 1 / 6;
          var elapsed = 0;
          var rest = 0;
          while (true) {
            elapsed += frame;
            if (solver(elapsed) === 1) {
              rest++;
              if (rest >= 16) {
                break;
              }
            } else {
              rest = 0;
            }
          }
          var duration = elapsed * frame * 1000;
          cache.springs[string] = duration;
          return duration;
        }

        return duration ? solver : getDuration;
      }

      // Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

      function steps(steps) {
        if (steps === void 0) steps = 10;

        return function (t) {
          return Math.ceil(minMax(t, 0.000001, 1) * steps) * (1 / steps);
        };
      }

      // BezierEasing https://github.com/gre/bezier-easing

      var bezier = (function () {
        var kSplineTableSize = 11;
        var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

        function A(aA1, aA2) {
          return 1.0 - 3.0 * aA2 + 3.0 * aA1;
        }
        function B(aA1, aA2) {
          return 3.0 * aA2 - 6.0 * aA1;
        }
        function C(aA1) {
          return 3.0 * aA1;
        }

        function calcBezier(aT, aA1, aA2) {
          return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
        }
        function getSlope(aT, aA1, aA2) {
          return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function binarySubdivide(aX, aA, aB, mX1, mX2) {
          var currentX,
            currentT,
            i = 0;
          do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
              aB = currentT;
            } else {
              aA = currentT;
            }
          } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
          return currentT;
        }

        function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
          for (var i = 0; i < 4; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) {
              return aGuessT;
            }
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
          }
          return aGuessT;
        }

        function bezier(mX1, mY1, mX2, mY2) {
          if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
            return;
          }
          var sampleValues = new Float32Array(kSplineTableSize);

          if (mX1 !== mY1 || mX2 !== mY2) {
            for (var i = 0; i < kSplineTableSize; ++i) {
              sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
          }

          function getTForX(aX) {
            var intervalStart = 0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (
              ;
              currentSample !== lastSample && sampleValues[currentSample] <= aX;
              ++currentSample
            ) {
              intervalStart += kSampleStepSize;
            }

            --currentSample;

            var dist =
              (aX - sampleValues[currentSample]) /
              (sampleValues[currentSample + 1] - sampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;
            var initialSlope = getSlope(guessForT, mX1, mX2);

            if (initialSlope >= 0.001) {
              return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            } else if (initialSlope === 0.0) {
              return guessForT;
            } else {
              return binarySubdivide(
                aX,
                intervalStart,
                intervalStart + kSampleStepSize,
                mX1,
                mX2
              );
            }
          }

          return function (x) {
            if (mX1 === mY1 && mX2 === mY2) {
              return x;
            }
            if (x === 0 || x === 1) {
              return x;
            }
            return calcBezier(getTForX(x), mY1, mY2);
          };
        }

        return bezier;
      })();

      var penner = (function () {
        // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

        var eases = {
          linear: function () {
            return function (t) {
              return t;
            };
          },
        };

        var functionEasings = {
          Sine: function () {
            return function (t) {
              return 1 - Math.cos((t * Math.PI) / 2);
            };
          },
          Circ: function () {
            return function (t) {
              return 1 - Math.sqrt(1 - t * t);
            };
          },
          Back: function () {
            return function (t) {
              return t * t * (3 * t - 2);
            };
          },
          Bounce: function () {
            return function (t) {
              var pow2,
                b = 4;
              while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) {}
              return (
                1 / Math.pow(4, 3 - b) -
                7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2)
              );
            };
          },
          Elastic: function (amplitude, period) {
            if (amplitude === void 0) amplitude = 1;
            if (period === void 0) period = 0.5;

            var a = minMax(amplitude, 1, 10);
            var p = minMax(period, 0.1, 2);
            return function (t) {
              return t === 0 || t === 1
                ? t
                : -a *
                    Math.pow(2, 10 * (t - 1)) *
                    Math.sin(
                      ((t - 1 - (p / (Math.PI * 2)) * Math.asin(1 / a)) *
                        (Math.PI * 2)) /
                        p
                    );
            };
          },
        };

        var baseEasings = ["Quad", "Cubic", "Quart", "Quint", "Expo"];

        baseEasings.forEach(function (name, i) {
          functionEasings[name] = function () {
            return function (t) {
              return Math.pow(t, i + 2);
            };
          };
        });

        Object.keys(functionEasings).forEach(function (name) {
          var easeIn = functionEasings[name];
          eases["easeIn" + name] = easeIn;
          eases["easeOut" + name] = function (a, b) {
            return function (t) {
              return 1 - easeIn(a, b)(1 - t);
            };
          };
          eases["easeInOut" + name] = function (a, b) {
            return function (t) {
              return t < 0.5
                ? easeIn(a, b)(t * 2) / 2
                : 1 - easeIn(a, b)(t * -2 + 2) / 2;
            };
          };
          eases["easeOutIn" + name] = function (a, b) {
            return function (t) {
              return t < 0.5
                ? (1 - easeIn(a, b)(1 - t * 2)) / 2
                : (easeIn(a, b)(t * 2 - 1) + 1) / 2;
            };
          };
        });

        return eases;
      })();

      function parseEasings(easing, duration) {
        if (is.fnc(easing)) {
          return easing;
        }
        var name = easing.split("(")[0];
        var ease = penner[name];
        var args = parseEasingParameters(easing);
        switch (name) {
          case "spring":
            return spring(easing, duration);
          case "cubicBezier":
            return applyArguments(bezier, args);
          case "steps":
            return applyArguments(steps, args);
          default:
            return applyArguments(ease, args);
        }
      }

      // Strings

      function selectString(str) {
        try {
          var nodes = document.querySelectorAll(str);
          return nodes;
        } catch (e) {
          return;
        }
      }

      // Arrays

      function filterArray(arr, callback) {
        var len = arr.length;
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        var result = [];
        for (var i = 0; i < len; i++) {
          if (i in arr) {
            var val = arr[i];
            if (callback.call(thisArg, val, i, arr)) {
              result.push(val);
            }
          }
        }
        return result;
      }

      function flattenArray(arr) {
        return arr.reduce(function (a, b) {
          return a.concat(is.arr(b) ? flattenArray(b) : b);
        }, []);
      }

      function toArray(o) {
        if (is.arr(o)) {
          return o;
        }
        if (is.str(o)) {
          o = selectString(o) || o;
        }
        if (o instanceof NodeList || o instanceof HTMLCollection) {
          return [].slice.call(o);
        }
        return [o];
      }

      function arrayContains(arr, val) {
        return arr.some(function (a) {
          return a === val;
        });
      }

      // Objects

      function cloneObject(o) {
        var clone = {};
        for (var p in o) {
          clone[p] = o[p];
        }
        return clone;
      }

      function replaceObjectProps(o1, o2) {
        var o = cloneObject(o1);
        for (var p in o1) {
          o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
        }
        return o;
      }

      function mergeObjects(o1, o2) {
        var o = cloneObject(o1);
        for (var p in o2) {
          o[p] = is.und(o1[p]) ? o2[p] : o1[p];
        }
        return o;
      }

      // Colors

      function rgbToRgba(rgbValue) {
        var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
        return rgb ? "rgba(" + rgb[1] + ",1)" : rgbValue;
      }

      function hexToRgba(hexValue) {
        var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        var hex = hexValue.replace(rgx, function (m, r, g, b) {
          return r + r + g + g + b + b;
        });
        var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        var r = parseInt(rgb[1], 16);
        var g = parseInt(rgb[2], 16);
        var b = parseInt(rgb[3], 16);
        return "rgba(" + r + "," + g + "," + b + ",1)";
      }

      function hslToRgba(hslValue) {
        var hsl =
          /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) ||
          /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
        var h = parseInt(hsl[1], 10) / 360;
        var s = parseInt(hsl[2], 10) / 100;
        var l = parseInt(hsl[3], 10) / 100;
        var a = hsl[4] || 1;
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
        var r, g, b;
        if (s == 0) {
          r = g = b = l;
        } else {
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }
        return (
          "rgba(" + r * 255 + "," + g * 255 + "," + b * 255 + "," + a + ")"
        );
      }

      function colorToRgb(val) {
        if (is.rgb(val)) {
          return rgbToRgba(val);
        }
        if (is.hex(val)) {
          return hexToRgba(val);
        }
        if (is.hsl(val)) {
          return hslToRgba(val);
        }
      }

      // Units

      function getUnit(val) {
        var split =
          /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(
            val
          );
        if (split) {
          return split[1];
        }
      }

      function getTransformUnit(propName) {
        if (
          stringContains(propName, "translate") ||
          propName === "perspective"
        ) {
          return "px";
        }
        if (
          stringContains(propName, "rotate") ||
          stringContains(propName, "skew")
        ) {
          return "deg";
        }
      }

      // Values

      function getFunctionValue(val, animatable) {
        if (!is.fnc(val)) {
          return val;
        }
        return val(animatable.target, animatable.id, animatable.total);
      }

      function getAttribute(el, prop) {
        return el.getAttribute(prop);
      }

      function convertPxToUnit(el, value, unit) {
        var valueUnit = getUnit(value);
        if (arrayContains([unit, "deg", "rad", "turn"], valueUnit)) {
          return value;
        }
        var cached = cache.CSS[value + unit];
        if (!is.und(cached)) {
          return cached;
        }
        var baseline = 100;
        var tempEl = document.createElement(el.tagName);
        var parentEl =
          el.parentNode && el.parentNode !== document
            ? el.parentNode
            : document.body;
        parentEl.appendChild(tempEl);
        tempEl.style.position = "absolute";
        tempEl.style.width = baseline + unit;
        var factor = baseline / tempEl.offsetWidth;
        parentEl.removeChild(tempEl);
        var convertedUnit = factor * parseFloat(value);
        cache.CSS[value + unit] = convertedUnit;
        return convertedUnit;
      }

      function getCSSValue(el, prop, unit) {
        if (prop in el.style) {
          var uppercasePropName = prop
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase();
          var value =
            el.style[prop] ||
            getComputedStyle(el).getPropertyValue(uppercasePropName) ||
            "0";
          return unit ? convertPxToUnit(el, value, unit) : value;
        }
      }

      function getAnimationType(el, prop) {
        if (
          is.dom(el) &&
          !is.inp(el) &&
          (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))
        ) {
          return "attribute";
        }
        if (is.dom(el) && arrayContains(validTransforms, prop)) {
          return "transform";
        }
        if (is.dom(el) && prop !== "transform" && getCSSValue(el, prop)) {
          return "css";
        }
        if (el[prop] != null) {
          return "object";
        }
      }

      function getElementTransforms(el) {
        if (!is.dom(el)) {
          return;
        }
        var str = el.style.transform || "";
        var reg = /(\w+)\(([^)]*)\)/g;
        var transforms = new Map();
        var m;
        while ((m = reg.exec(str))) {
          transforms.set(m[1], m[2]);
        }
        return transforms;
      }

      function getTransformValue(el, propName, animatable, unit) {
        var defaultVal = stringContains(propName, "scale")
          ? 1
          : 0 + getTransformUnit(propName);
        var value = getElementTransforms(el).get(propName) || defaultVal;
        if (animatable) {
          animatable.transforms.list.set(propName, value);
          animatable.transforms["last"] = propName;
        }
        return unit ? convertPxToUnit(el, value, unit) : value;
      }

      function getOriginalTargetValue(target, propName, unit, animatable) {
        switch (getAnimationType(target, propName)) {
          case "transform":
            return getTransformValue(target, propName, animatable, unit);
          case "css":
            return getCSSValue(target, propName, unit);
          case "attribute":
            return getAttribute(target, propName);
          default:
            return target[propName] || 0;
        }
      }

      function getRelativeValue(to, from) {
        var operator = /^(\*=|\+=|-=)/.exec(to);
        if (!operator) {
          return to;
        }
        var u = getUnit(to) || 0;
        var x = parseFloat(from);
        var y = parseFloat(to.replace(operator[0], ""));
        switch (operator[0][0]) {
          case "+":
            return x + y + u;
          case "-":
            return x - y + u;
          case "*":
            return x * y + u;
        }
      }

      function validateValue(val, unit) {
        if (is.col(val)) {
          return colorToRgb(val);
        }
        if (/\s/g.test(val)) {
          return val;
        }
        var originalUnit = getUnit(val);
        var unitLess = originalUnit
          ? val.substr(0, val.length - originalUnit.length)
          : val;
        if (unit) {
          return unitLess + unit;
        }
        return unitLess;
      }

      // getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
      // adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

      function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }

      function getCircleLength(el) {
        return Math.PI * 2 * getAttribute(el, "r");
      }

      function getRectLength(el) {
        return getAttribute(el, "width") * 2 + getAttribute(el, "height") * 2;
      }

      function getLineLength(el) {
        return getDistance(
          { x: getAttribute(el, "x1"), y: getAttribute(el, "y1") },
          { x: getAttribute(el, "x2"), y: getAttribute(el, "y2") }
        );
      }

      function getPolylineLength(el) {
        var points = el.points;
        var totalLength = 0;
        var previousPos;
        for (var i = 0; i < points.numberOfItems; i++) {
          var currentPos = points.getItem(i);
          if (i > 0) {
            totalLength += getDistance(previousPos, currentPos);
          }
          previousPos = currentPos;
        }
        return totalLength;
      }

      function getPolygonLength(el) {
        var points = el.points;
        return (
          getPolylineLength(el) +
          getDistance(
            points.getItem(points.numberOfItems - 1),
            points.getItem(0)
          )
        );
      }

      // Path animation

      function getTotalLength(el) {
        if (el.getTotalLength) {
          return el.getTotalLength();
        }
        switch (el.tagName.toLowerCase()) {
          case "circle":
            return getCircleLength(el);
          case "rect":
            return getRectLength(el);
          case "line":
            return getLineLength(el);
          case "polyline":
            return getPolylineLength(el);
          case "polygon":
            return getPolygonLength(el);
        }
      }

      function setDashoffset(el) {
        var pathLength = getTotalLength(el);
        el.setAttribute("stroke-dasharray", pathLength);
        return pathLength;
      }

      // Motion path

      function getParentSvgEl(el) {
        var parentEl = el.parentNode;
        while (is.svg(parentEl)) {
          if (!is.svg(parentEl.parentNode)) {
            break;
          }
          parentEl = parentEl.parentNode;
        }
        return parentEl;
      }

      function getParentSvg(pathEl, svgData) {
        var svg = svgData || {};
        var parentSvgEl = svg.el || getParentSvgEl(pathEl);
        var rect = parentSvgEl.getBoundingClientRect();
        var viewBoxAttr = getAttribute(parentSvgEl, "viewBox");
        var width = rect.width;
        var height = rect.height;
        var viewBox =
          svg.viewBox ||
          (viewBoxAttr ? viewBoxAttr.split(" ") : [0, 0, width, height]);
        return {
          el: parentSvgEl,
          viewBox: viewBox,
          x: viewBox[0] / 1,
          y: viewBox[1] / 1,
          w: width,
          h: height,
          vW: viewBox[2],
          vH: viewBox[3],
        };
      }

      function getPath(path, percent) {
        var pathEl = is.str(path) ? selectString(path)[0] : path;
        var p = percent || 100;
        return function (property) {
          return {
            property: property,
            el: pathEl,
            svg: getParentSvg(pathEl),
            totalLength: getTotalLength(pathEl) * (p / 100),
          };
        };
      }

      function getPathProgress(path, progress, isPathTargetInsideSVG) {
        function point(offset) {
          if (offset === void 0) offset = 0;

          var l = progress + offset >= 1 ? progress + offset : 0;
          return path.el.getPointAtLength(l);
        }
        var svg = getParentSvg(path.el, path.svg);
        var p = point();
        var p0 = point(-1);
        var p1 = point(+1);
        var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
        var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
        switch (path.property) {
          case "x":
            return (p.x - svg.x) * scaleX;
          case "y":
            return (p.y - svg.y) * scaleY;
          case "angle":
            return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
        }
      }

      // Decompose value

      function decomposeValue(val, unit) {
        // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
        // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
        var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
        var value =
          validateValue(is.pth(val) ? val.totalLength : val, unit) + "";
        return {
          original: value,
          numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
          strings: is.str(val) || unit ? value.split(rgx) : [],
        };
      }

      // Animatables

      function parseTargets(targets) {
        var targetsArray = targets
          ? flattenArray(
              is.arr(targets) ? targets.map(toArray) : toArray(targets)
            )
          : [];
        return filterArray(targetsArray, function (item, pos, self) {
          return self.indexOf(item) === pos;
        });
      }

      function getAnimatables(targets) {
        var parsed = parseTargets(targets);
        return parsed.map(function (t, i) {
          return {
            target: t,
            id: i,
            total: parsed.length,
            transforms: { list: getElementTransforms(t) },
          };
        });
      }

      // Properties

      function normalizePropertyTweens(prop, tweenSettings) {
        var settings = cloneObject(tweenSettings);
        // Override duration if easing is a spring
        if (/^spring/.test(settings.easing)) {
          settings.duration = spring(settings.easing);
        }
        if (is.arr(prop)) {
          var l = prop.length;
          var isFromTo = l === 2 && !is.obj(prop[0]);
          if (!isFromTo) {
            // Duration divided by the number of tweens
            if (!is.fnc(tweenSettings.duration)) {
              settings.duration = tweenSettings.duration / l;
            }
          } else {
            // Transform [from, to] values shorthand to a valid tween value
            prop = { value: prop };
          }
        }
        var propArray = is.arr(prop) ? prop : [prop];
        return propArray
          .map(function (v, i) {
            var obj = is.obj(v) && !is.pth(v) ? v : { value: v };
            // Default delay value should only be applied to the first tween
            if (is.und(obj.delay)) {
              obj.delay = !i ? tweenSettings.delay : 0;
            }
            // Default endDelay value should only be applied to the last tween
            if (is.und(obj.endDelay)) {
              obj.endDelay =
                i === propArray.length - 1 ? tweenSettings.endDelay : 0;
            }
            return obj;
          })
          .map(function (k) {
            return mergeObjects(k, settings);
          });
      }

      function flattenKeyframes(keyframes) {
        var propertyNames = filterArray(
          flattenArray(
            keyframes.map(function (key) {
              return Object.keys(key);
            })
          ),
          function (p) {
            return is.key(p);
          }
        ).reduce(function (a, b) {
          if (a.indexOf(b) < 0) {
            a.push(b);
          }
          return a;
        }, []);
        var properties = {};
        var loop = function (i) {
          var propName = propertyNames[i];
          properties[propName] = keyframes.map(function (key) {
            var newKey = {};
            for (var p in key) {
              if (is.key(p)) {
                if (p == propName) {
                  newKey.value = key[p];
                }
              } else {
                newKey[p] = key[p];
              }
            }
            return newKey;
          });
        };

        for (var i = 0; i < propertyNames.length; i++) loop(i);
        return properties;
      }

      function getProperties(tweenSettings, params) {
        var properties = [];
        var keyframes = params.keyframes;
        if (keyframes) {
          params = mergeObjects(flattenKeyframes(keyframes), params);
        }
        for (var p in params) {
          if (is.key(p)) {
            properties.push({
              name: p,
              tweens: normalizePropertyTweens(params[p], tweenSettings),
            });
          }
        }
        return properties;
      }

      // Tweens

      function normalizeTweenValues(tween, animatable) {
        var t = {};
        for (var p in tween) {
          var value = getFunctionValue(tween[p], animatable);
          if (is.arr(value)) {
            value = value.map(function (v) {
              return getFunctionValue(v, animatable);
            });
            if (value.length === 1) {
              value = value[0];
            }
          }
          t[p] = value;
        }
        t.duration = parseFloat(t.duration);
        t.delay = parseFloat(t.delay);
        return t;
      }

      function normalizeTweens(prop, animatable) {
        var previousTween;
        return prop.tweens.map(function (t) {
          var tween = normalizeTweenValues(t, animatable);
          var tweenValue = tween.value;
          var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
          var toUnit = getUnit(to);
          var originalValue = getOriginalTargetValue(
            animatable.target,
            prop.name,
            toUnit,
            animatable
          );
          var previousValue = previousTween
            ? previousTween.to.original
            : originalValue;
          var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
          var fromUnit = getUnit(from) || getUnit(originalValue);
          var unit = toUnit || fromUnit;
          if (is.und(to)) {
            to = previousValue;
          }
          tween.from = decomposeValue(from, unit);
          tween.to = decomposeValue(getRelativeValue(to, from), unit);
          tween.start = previousTween ? previousTween.end : 0;
          tween.end =
            tween.start + tween.delay + tween.duration + tween.endDelay;
          tween.easing = parseEasings(tween.easing, tween.duration);
          tween.isPath = is.pth(tweenValue);
          tween.isPathTargetInsideSVG =
            tween.isPath && is.svg(animatable.target);
          tween.isColor = is.col(tween.from.original);
          if (tween.isColor) {
            tween.round = 1;
          }
          previousTween = tween;
          return tween;
        });
      }

      // Tween progress

      var setProgressValue = {
        css: function (t, p, v) {
          return (t.style[p] = v);
        },
        attribute: function (t, p, v) {
          return t.setAttribute(p, v);
        },
        object: function (t, p, v) {
          return (t[p] = v);
        },
        transform: function (t, p, v, transforms, manual) {
          transforms.list.set(p, v);
          if (p === transforms.last || manual) {
            var str = "";
            transforms.list.forEach(function (value, prop) {
              str += prop + "(" + value + ") ";
            });
            t.style.transform = str;
          }
        },
      };

      // Set Value helper

      function setTargetsValue(targets, properties) {
        var animatables = getAnimatables(targets);
        animatables.forEach(function (animatable) {
          for (var property in properties) {
            var value = getFunctionValue(properties[property], animatable);
            var target = animatable.target;
            var valueUnit = getUnit(value);
            var originalValue = getOriginalTargetValue(
              target,
              property,
              valueUnit,
              animatable
            );
            var unit = valueUnit || getUnit(originalValue);
            var to = getRelativeValue(
              validateValue(value, unit),
              originalValue
            );
            var animType = getAnimationType(target, property);
            setProgressValue[animType](
              target,
              property,
              to,
              animatable.transforms,
              true
            );
          }
        });
      }

      // Animations

      function createAnimation(animatable, prop) {
        var animType = getAnimationType(animatable.target, prop.name);
        if (animType) {
          var tweens = normalizeTweens(prop, animatable);
          var lastTween = tweens[tweens.length - 1];
          return {
            type: animType,
            property: prop.name,
            animatable: animatable,
            tweens: tweens,
            duration: lastTween.end,
            delay: tweens[0].delay,
            endDelay: lastTween.endDelay,
          };
        }
      }

      function getAnimations(animatables, properties) {
        return filterArray(
          flattenArray(
            animatables.map(function (animatable) {
              return properties.map(function (prop) {
                return createAnimation(animatable, prop);
              });
            })
          ),
          function (a) {
            return !is.und(a);
          }
        );
      }

      // Create Instance

      function getInstanceTimings(animations, tweenSettings) {
        var animLength = animations.length;
        var getTlOffset = function (anim) {
          return anim.timelineOffset ? anim.timelineOffset : 0;
        };
        var timings = {};
        timings.duration = animLength
          ? Math.max.apply(
              Math,
              animations.map(function (anim) {
                return getTlOffset(anim) + anim.duration;
              })
            )
          : tweenSettings.duration;
        timings.delay = animLength
          ? Math.min.apply(
              Math,
              animations.map(function (anim) {
                return getTlOffset(anim) + anim.delay;
              })
            )
          : tweenSettings.delay;
        timings.endDelay = animLength
          ? timings.duration -
            Math.max.apply(
              Math,
              animations.map(function (anim) {
                return getTlOffset(anim) + anim.duration - anim.endDelay;
              })
            )
          : tweenSettings.endDelay;
        return timings;
      }

      var instanceID = 0;

      function createNewInstance(params) {
        var instanceSettings = replaceObjectProps(
          defaultInstanceSettings,
          params
        );
        var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
        var properties = getProperties(tweenSettings, params);
        var animatables = getAnimatables(params.targets);
        var animations = getAnimations(animatables, properties);
        var timings = getInstanceTimings(animations, tweenSettings);
        var id = instanceID;
        instanceID++;
        return mergeObjects(instanceSettings, {
          id: id,
          children: [],
          animatables: animatables,
          animations: animations,
          duration: timings.duration,
          delay: timings.delay,
          endDelay: timings.endDelay,
        });
      }

      // Core

      var activeInstances = [];

      var engine = (function () {
        var raf;

        function play() {
          if (
            !raf &&
            (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) &&
            activeInstances.length > 0
          ) {
            raf = requestAnimationFrame(step);
          }
        }
        function step(t) {
          // memo on algorithm issue:
          // dangerous iteration over mutable `activeInstances`
          // (that collection may be updated from within callbacks of `tick`-ed animation instances)
          var activeInstancesLength = activeInstances.length;
          var i = 0;
          while (i < activeInstancesLength) {
            var activeInstance = activeInstances[i];
            if (!activeInstance.paused) {
              activeInstance.tick(t);
              i++;
            } else {
              activeInstances.splice(i, 1);
              activeInstancesLength--;
            }
          }
          raf = i > 0 ? requestAnimationFrame(step) : undefined;
        }

        function handleVisibilityChange() {
          if (!anime.suspendWhenDocumentHidden) {
            return;
          }

          if (isDocumentHidden()) {
            // suspend ticks
            raf = cancelAnimationFrame(raf);
          } else {
            // is back to active tab
            // first adjust animations to consider the time that ticks were suspended
            activeInstances.forEach(function (instance) {
              return instance._onDocumentVisibility();
            });
            engine();
          }
        }
        if (typeof document !== "undefined") {
          document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return play;
      })();

      function isDocumentHidden() {
        return !!document && document.hidden;
      }

      // Public Instance

      function anime(params) {
        if (params === void 0) params = {};

        var startTime = 0,
          lastTime = 0,
          now = 0;
        var children,
          childrenLength = 0;
        var resolve = null;

        function makePromise(instance) {
          var promise =
            window.Promise &&
            new Promise(function (_resolve) {
              return (resolve = _resolve);
            });
          instance.finished = promise;
          return promise;
        }

        var instance = createNewInstance(params);
        var promise = makePromise(instance);

        function toggleInstanceDirection() {
          var direction = instance.direction;
          if (direction !== "alternate") {
            instance.direction = direction !== "normal" ? "normal" : "reverse";
          }
          instance.reversed = !instance.reversed;
          children.forEach(function (child) {
            return (child.reversed = instance.reversed);
          });
        }

        function adjustTime(time) {
          return instance.reversed ? instance.duration - time : time;
        }

        function resetTime() {
          startTime = 0;
          lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
        }

        function seekChild(time, child) {
          if (child) {
            child.seek(time - child.timelineOffset);
          }
        }

        function syncInstanceChildren(time) {
          if (!instance.reversePlayback) {
            for (var i = 0; i < childrenLength; i++) {
              seekChild(time, children[i]);
            }
          } else {
            for (var i$1 = childrenLength; i$1--; ) {
              seekChild(time, children[i$1]);
            }
          }
        }

        function setAnimationsProgress(insTime) {
          var i = 0;
          var animations = instance.animations;
          var animationsLength = animations.length;
          while (i < animationsLength) {
            var anim = animations[i];
            var animatable = anim.animatable;
            var tweens = anim.tweens;
            var tweenLength = tweens.length - 1;
            var tween = tweens[tweenLength];
            // Only check for keyframes if there is more than one tween
            if (tweenLength) {
              tween =
                filterArray(tweens, function (t) {
                  return insTime < t.end;
                })[0] || tween;
            }
            var elapsed =
              minMax(insTime - tween.start - tween.delay, 0, tween.duration) /
              tween.duration;
            var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
            var strings = tween.to.strings;
            var round = tween.round;
            var numbers = [];
            var toNumbersLength = tween.to.numbers.length;
            var progress = void 0;
            for (var n = 0; n < toNumbersLength; n++) {
              var value = void 0;
              var toNumber = tween.to.numbers[n];
              var fromNumber = tween.from.numbers[n] || 0;
              if (!tween.isPath) {
                value = fromNumber + eased * (toNumber - fromNumber);
              } else {
                value = getPathProgress(
                  tween.value,
                  eased * toNumber,
                  tween.isPathTargetInsideSVG
                );
              }
              if (round) {
                if (!(tween.isColor && n > 2)) {
                  value = Math.round(value * round) / round;
                }
              }
              numbers.push(value);
            }
            // Manual Array.reduce for better performances
            var stringsLength = strings.length;
            if (!stringsLength) {
              progress = numbers[0];
            } else {
              progress = strings[0];
              for (var s = 0; s < stringsLength; s++) {
                var a = strings[s];
                var b = strings[s + 1];
                var n$1 = numbers[s];
                if (!isNaN(n$1)) {
                  if (!b) {
                    progress += n$1 + " ";
                  } else {
                    progress += n$1 + b;
                  }
                }
              }
            }
            setProgressValue[anim.type](
              animatable.target,
              anim.property,
              progress,
              animatable.transforms
            );
            anim.currentValue = progress;
            i++;
          }
        }

        function setCallback(cb) {
          if (instance[cb] && !instance.passThrough) {
            instance[cb](instance);
          }
        }

        function countIteration() {
          if (instance.remaining && instance.remaining !== true) {
            instance.remaining--;
          }
        }

        function setInstanceProgress(engineTime) {
          var insDuration = instance.duration;
          var insDelay = instance.delay;
          var insEndDelay = insDuration - instance.endDelay;
          var insTime = adjustTime(engineTime);
          instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
          instance.reversePlayback = insTime < instance.currentTime;
          if (children) {
            syncInstanceChildren(insTime);
          }
          if (!instance.began && instance.currentTime > 0) {
            instance.began = true;
            setCallback("begin");
          }
          if (!instance.loopBegan && instance.currentTime > 0) {
            instance.loopBegan = true;
            setCallback("loopBegin");
          }
          if (insTime <= insDelay && instance.currentTime !== 0) {
            setAnimationsProgress(0);
          }
          if (
            (insTime >= insEndDelay && instance.currentTime !== insDuration) ||
            !insDuration
          ) {
            setAnimationsProgress(insDuration);
          }
          if (insTime > insDelay && insTime < insEndDelay) {
            if (!instance.changeBegan) {
              instance.changeBegan = true;
              instance.changeCompleted = false;
              setCallback("changeBegin");
            }
            setCallback("change");
            setAnimationsProgress(insTime);
          } else {
            if (instance.changeBegan) {
              instance.changeCompleted = true;
              instance.changeBegan = false;
              setCallback("changeComplete");
            }
          }
          instance.currentTime = minMax(insTime, 0, insDuration);
          if (instance.began) {
            setCallback("update");
          }
          if (engineTime >= insDuration) {
            lastTime = 0;
            countIteration();
            if (!instance.remaining) {
              instance.paused = true;
              if (!instance.completed) {
                instance.completed = true;
                setCallback("loopComplete");
                setCallback("complete");
                if (!instance.passThrough && "Promise" in window) {
                  resolve();
                  promise = makePromise(instance);
                }
              }
            } else {
              startTime = now;
              setCallback("loopComplete");
              instance.loopBegan = false;
              if (instance.direction === "alternate") {
                toggleInstanceDirection();
              }
            }
          }
        }

        instance.reset = function () {
          var direction = instance.direction;
          instance.passThrough = false;
          instance.currentTime = 0;
          instance.progress = 0;
          instance.paused = true;
          instance.began = false;
          instance.loopBegan = false;
          instance.changeBegan = false;
          instance.completed = false;
          instance.changeCompleted = false;
          instance.reversePlayback = false;
          instance.reversed = direction === "reverse";
          instance.remaining = instance.loop;
          children = instance.children;
          childrenLength = children.length;
          for (var i = childrenLength; i--; ) {
            instance.children[i].reset();
          }
          if (
            (instance.reversed && instance.loop !== true) ||
            (direction === "alternate" && instance.loop === 1)
          ) {
            instance.remaining++;
          }
          setAnimationsProgress(instance.reversed ? instance.duration : 0);
        };

        // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
        instance._onDocumentVisibility = resetTime;

        // Set Value helper

        instance.set = function (targets, properties) {
          setTargetsValue(targets, properties);
          return instance;
        };

        instance.tick = function (t) {
          now = t;
          if (!startTime) {
            startTime = now;
          }
          setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
        };

        instance.seek = function (time) {
          setInstanceProgress(adjustTime(time));
        };

        instance.pause = function () {
          instance.paused = true;
          resetTime();
        };

        instance.play = function () {
          if (!instance.paused) {
            return;
          }
          if (instance.completed) {
            instance.reset();
          }
          instance.paused = false;
          activeInstances.push(instance);
          resetTime();
          engine();
        };

        instance.reverse = function () {
          toggleInstanceDirection();
          instance.completed = instance.reversed ? false : true;
          resetTime();
        };

        instance.restart = function () {
          instance.reset();
          instance.play();
        };

        instance.remove = function (targets) {
          var targetsArray = parseTargets(targets);
          removeTargetsFromInstance(targetsArray, instance);
        };

        instance.reset();

        if (instance.autoplay) {
          instance.play();
        }

        return instance;
      }

      // Remove targets from animation

      function removeTargetsFromAnimations(targetsArray, animations) {
        for (var a = animations.length; a--; ) {
          if (arrayContains(targetsArray, animations[a].animatable.target)) {
            animations.splice(a, 1);
          }
        }
      }

      function removeTargetsFromInstance(targetsArray, instance) {
        var animations = instance.animations;
        var children = instance.children;
        removeTargetsFromAnimations(targetsArray, animations);
        for (var c = children.length; c--; ) {
          var child = children[c];
          var childAnimations = child.animations;
          removeTargetsFromAnimations(targetsArray, childAnimations);
          if (!childAnimations.length && !child.children.length) {
            children.splice(c, 1);
          }
        }
        if (!animations.length && !children.length) {
          instance.pause();
        }
      }

      function removeTargetsFromActiveInstances(targets) {
        var targetsArray = parseTargets(targets);
        for (var i = activeInstances.length; i--; ) {
          var instance = activeInstances[i];
          removeTargetsFromInstance(targetsArray, instance);
        }
      }

      // Stagger helpers

      function stagger(val, params) {
        if (params === void 0) params = {};

        var direction = params.direction || "normal";
        var easing = params.easing ? parseEasings(params.easing) : null;
        var grid = params.grid;
        var axis = params.axis;
        var fromIndex = params.from || 0;
        var fromFirst = fromIndex === "first";
        var fromCenter = fromIndex === "center";
        var fromLast = fromIndex === "last";
        var isRange = is.arr(val);
        var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
        var val2 = isRange ? parseFloat(val[1]) : 0;
        var unit = getUnit(isRange ? val[1] : val) || 0;
        var start = params.start || 0 + (isRange ? val1 : 0);
        var values = [];
        var maxValue = 0;
        return function (el, i, t) {
          if (fromFirst) {
            fromIndex = 0;
          }
          if (fromCenter) {
            fromIndex = (t - 1) / 2;
          }
          if (fromLast) {
            fromIndex = t - 1;
          }
          if (!values.length) {
            for (var index = 0; index < t; index++) {
              if (!grid) {
                values.push(Math.abs(fromIndex - index));
              } else {
                var fromX = !fromCenter
                  ? fromIndex % grid[0]
                  : (grid[0] - 1) / 2;
                var fromY = !fromCenter
                  ? Math.floor(fromIndex / grid[0])
                  : (grid[1] - 1) / 2;
                var toX = index % grid[0];
                var toY = Math.floor(index / grid[0]);
                var distanceX = fromX - toX;
                var distanceY = fromY - toY;
                var value = Math.sqrt(
                  distanceX * distanceX + distanceY * distanceY
                );
                if (axis === "x") {
                  value = -distanceX;
                }
                if (axis === "y") {
                  value = -distanceY;
                }
                values.push(value);
              }
              maxValue = Math.max.apply(Math, values);
            }
            if (easing) {
              values = values.map(function (val) {
                return easing(val / maxValue) * maxValue;
              });
            }
            if (direction === "reverse") {
              values = values.map(function (val) {
                return axis
                  ? val < 0
                    ? val * -1
                    : -val
                  : Math.abs(maxValue - val);
              });
            }
          }
          var spacing = isRange ? (val2 - val1) / maxValue : val1;
          return start + spacing * (Math.round(values[i] * 100) / 100) + unit;
        };
      }

      // Timeline

      function timeline(params) {
        if (params === void 0) params = {};

        var tl = anime(params);
        tl.duration = 0;
        tl.add = function (instanceParams, timelineOffset) {
          var tlIndex = activeInstances.indexOf(tl);
          var children = tl.children;
          if (tlIndex > -1) {
            activeInstances.splice(tlIndex, 1);
          }
          function passThrough(ins) {
            ins.passThrough = true;
          }
          for (var i = 0; i < children.length; i++) {
            passThrough(children[i]);
          }
          var insParams = mergeObjects(
            instanceParams,
            replaceObjectProps(defaultTweenSettings, params)
          );
          insParams.targets = insParams.targets || params.targets;
          var tlDuration = tl.duration;
          insParams.autoplay = false;
          insParams.direction = tl.direction;
          insParams.timelineOffset = is.und(timelineOffset)
            ? tlDuration
            : getRelativeValue(timelineOffset, tlDuration);
          passThrough(tl);
          tl.seek(insParams.timelineOffset);
          var ins = anime(insParams);
          passThrough(ins);
          children.push(ins);
          var timings = getInstanceTimings(children, params);
          tl.delay = timings.delay;
          tl.endDelay = timings.endDelay;
          tl.duration = timings.duration;
          tl.seek(0);
          tl.reset();
          if (tl.autoplay) {
            tl.play();
          }
          return tl;
        };
        return tl;
      }

      anime.version = "3.2.1";
      anime.speed = 1;
      // TODO:#review: naming, documentation
      anime.suspendWhenDocumentHidden = true;
      anime.running = activeInstances;
      anime.remove = removeTargetsFromActiveInstances;
      anime.get = getOriginalTargetValue;
      anime.set = setTargetsValue;
      anime.convertPx = convertPxToUnit;
      anime.path = getPath;
      anime.setDashoffset = setDashoffset;
      anime.stagger = stagger;
      anime.timeline = timeline;
      anime.easing = parseEasings;
      anime.penner = penner;
      anime.random = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      /* harmony default export */ const anime_es = anime; // CONCATENATED MODULE: ./app/js/utility/language.json

      const language_namespaceObject = JSON.parse(
        '{"m":[{"label":"italiano","name":"italian","code":"it","widget_video_form_caption":"Compila il form ⬇","button_text":"Clicca su un pulsante ⬇","user_input_text":"PREMI LA FRECCIA O INVIO","file_text":"Clicca qui","card_text":"Scorri per vedere tutte le schede","form_compiled":"Fatto!","swipe_caption":"Scorri verso sinistra o destra per rispondere.","browser_alert":"Per una maggiore compatibilità, ti consigliamo di utilizzare le versioni aggiornate dei seguenti browser : Chrome, Firefox, Edge, Safari"},{"label":"inglese","name":"english","code":"en","widget_video_form_caption":"Fill form ⬇","button_text":"Choose an option ⬇","user_input_text":"PRESS ENTER TO SEND","file_text":"Click here","card_text":"Swipe to change card","form_compiled":"Done!","swipe_caption":"You can swipe left or right to answer.","browser_alert":"For greater compatibility, we recommend that you use updated versions of the following browsers : Chrome, Firefox, Edge, Safari"},{"label":"francese","name":"french","code":"fr","button_text":"Choisir une option ⬇","user_input_text":"APPUYEZ SUR ENTRÉE POUR ENVOYER","file_text":"Cliquez ici","form_compiled":"C\'est fait !","swipe_caption":"You can swipe left or right to answer.","browser_alert":"Pour une meilleure compatibilité, nous recommandons d\'utiliser les versions actualisées des navigateurs suivants : Chrome, Firefox, Edge, Safari."},{"label":"tedesco","name":"german","code":"de","button_text":"Wählen sie eine option ⬇","user_input_text":"DRÜCKEN SIE DIE EINGABETASTE, UM ZU SENDEN","file_text":"Klicken Sie hier","form_compiled":"Erledigt!","swipe_caption":"You can swipe left or right to answer.","browser_alert":"Für eine bessere Kompatibilität empfehlen wir die Verwendung aktueller Versionen der folgenden Browser: Chrome, Firefox, Edge, Safari"},{"label":"giapponese","name":"japanese","code":"ja","button_text":"選択してください ⬇","user_input_text":"Enterキーを押して送信します","file_text":"ここをクリック","form_compiled":"終わった！","swipe_caption":"You can swipe left or right to answer.","browser_alert":"より高い互換性のために、以下のブラウザの最新バージョンを使用することをお勧めします：Chrome、Firefox、Edge、Safari"},{"label":"spagnolo","name":"spanish","code":"es","button_text":"Pulsa sobre un botón ⬇","user_input_text":"Pulsa sobre la flecha o presiona enter para reenviar el mensaje","file_text":"Clica aquí","card_text":"¡Desliza para ver todas las pestañas!","form_compiled":"Está Hecho!","swipe_caption":"You can swipe left or right to answer.","browser_alert":"Para una mayor compatibilidad, recomendamos utilizar versiones actualizadas de los siguientes navegadores: Chrome, Firefox, Edge, Safari"},{"label":"olandese","name":"dutch","code":"nl","button_text":"Klik op een knop ⬇","user_input_text":"DRUK OP DE PIJL OF ENTER","file_text":"Klik hier","card_text":"Scroll om alle tabbladen te zien!","form_compiled":"Klaar!","swipe_caption":"You can swipe left or right to answer.","browser_alert":"Voor meer compatibiliteit raden we aan bijgewerkte versies van de volgende browsers te gebruiken: Chrome, Firefox, Edge, Safari"}]}'
      ); // CONCATENATED MODULE: ./app/js/utility/http.js
      /**
       * EasyHTTP Library
       * Library for making HTTP requests
       *
       * @version 2.0.0
       * @author  Brad Traversy
       * @license MIT
       *
       **/
      class EasyHTTP {
        // Make an HTTP GET Request
        get(url) {
          return new Promise((resolve, reject) => {
            fetch(url)
              .then((res) => res.json())
              .then((data) => resolve(data))
              .catch((err) => reject(err));
          });
        } // Make an HTTP POST Request

        post(url, data) {
          return new Promise((resolve, reject) => {
            fetch(url, {
              method: "POST",
              headers: {
                "Content-type": "application/json",
              },
              body: JSON.stringify(data),
            })
              .then((res) => {
                const contentType = res.headers.get("content-type");

                if (!res.ok) {
                  if (
                    contentType &&
                    contentType.indexOf("application/json") !== -1
                  ) {
                    return res.json().then((data) => {
                      return Promise.reject(data);
                    });
                  } else {
                    return res.text().then((data) => {
                      return Promise.reject(data);
                    });
                  }
                } else {
                  if (
                    contentType &&
                    contentType.indexOf("application/json") !== -1
                  ) {
                    return res.json();
                  } else {
                    return res.text();
                  }
                }
              })
              .then((data) => resolve(data))
              .catch((err) => reject(err));
          });
        }
      }

      const http_http = new EasyHTTP(); // CONCATENATED MODULE: ./app/js/utility/common.js
      const CommonHandler = (function () {
        let firstInteraction = false;
        let timerId;
        let customData = [];
        let customEvents = [];
        let configuration = {};

        let setFirstInteraction = (value) => {
          firstInteraction = value;
        };

        let getFirstInteraction = () => {
          return firstInteraction;
        };

        let openUrl = (DOMReference, id, url, target) => {
          if (typeof id == "string") {
            var click_area = DOMReference.document.getElementById(id);
          } else {
            click_area = id;
          }

          click_area.addEventListener("click", function () {
            if (typeof Adform !== "undefined") {
              if (window.dhtml !== undefined) {
                var landingPageTarget =
                  target || Adform.getVar("landingPageTarget") || "_blank";
                var clickURL = Adform.getClickURL("clickTAG") || url;
                window.open(clickURL, landingPageTarget);
              } else {
                if (window.mraid !== undefined) mraid.open(url);
              }
            } else {
              window.open(url, "blank");
            }
          });
        };
        /**
         * Returns the text from a HTML string
         *
         * @param {html} String The html string
         */

        let stripHtml = (html) => {
          // Create a new div element
          var temporalDivElement = document.createElement("div"); // Set the HTML content with the providen

          temporalDivElement.innerHTML = html; // Retrieve the text property of the element (cross-browser support)

          return (
            temporalDivElement.textContent || temporalDivElement.innerText || ""
          );
        }; // Conversione da esadecimale a rgba per l'opacità delle bubble di testo

        let hexToRgbA = (hex, opacity) => {
          if (opacity == null || opacity == undefined || opacity == "")
            opacity = 0.8;
          let rgba = "none";
          var c;

          if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split("");

            if (c.length == 3) {
              c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }

            c = "0x" + c.join("");
            rgba =
              "rgba(" +
              [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
              "," +
              opacity +
              ")";
          } else {
            if (/^#([A-Fa-f0-9]*)$/.test(hex)) {
              c = hex.substring(0, 7);
              c = c.substring(1).split("");
              c = "0x" + c.join("");
              rgba =
                "rgba(" +
                [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
                ",0.8)";
            }
          }

          return rgba;
        };

        let getRandomString = (length) => {
          var randomChars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          var result = "";

          for (var i = 0; i < length; i++) {
            result += randomChars.charAt(
              Math.floor(Math.random() * randomChars.length)
            );
          }

          return result;
        }; // cambia css dell'elemento

        let changeCssProperty = (element, cssproperty, value) => {
          if (element) element.style[cssproperty] = value;
        }; // rimozione elemento dal DOM

        let removeElement = (element) => {
          if (element) {
            element.parentNode.removeChild(element);
          }
        }; // funzione per la trasformazione della chiave pubblica per la sottoscrizione notifiche

        let urlBase64ToUint8Array = (base64String) => {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);

          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }

          return outputArray;
        };

        let checkStorageExpiration = () => {
          let user = JSON.parse(localStorage.getItem("hej_user"));
          if (!user || !user.expiration || !user.hasOwnProperty("expiration"))
            return false;
          const expirationDuration = 1000 * 60 * 60 * 24 * 3; // 3 days

          const currentTime = new Date().getTime();
          const user_expiration = new Date(user.expiration).getTime();

          if (currentTime - user_expiration > expirationDuration) {
            return false;
          }

          return true;
        };

        let getMimeType = (contentBuffer) => {
          //console.log(contentBuffer);
          let type;
          let arr = new Uint8Array(contentBuffer).subarray(0, 4);
          let header = "";

          for (var i = 0; i < arr.length; i++) {
            header += arr[i].toString(16);
          }

          switch (header) {
            case "25504446":
            case "255044462D":
              type = "application/pdf";
              break;

            case "89504e47":
              type = "image/png";
              break;

            case "47494638":
              type = "image/gif";
              break;

            case "ffd8ffe0":
            case "ffd8ffe1":
            case "ffd8ffe2":
            case "ffd8ffe3":
            case "ffd8ffe8":
              type = "image/jpeg";
              break;

            case "1a45dFa3":
              type = "video/webm";
              break;

            case "000000186674797069736F6D":
              type = "video/mp4";
              break;

            case "4F676753":
              type = "application/ogg";
              break;

            default:
              type = "unknown"; // Or you can use the blob.type as fallback

              break;
          }

          return type;
        };

        const readFileAsync = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = () => resolve(reader.result);

            reader.onerror = (error) => reject(error);
          });

        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result);

            reader.onerror = (error) => reject(error);
          });

        const get_local_storage_status = () => {
          let test = "test";

          try {
            // try setting an item
            localStorage.setItem("test", test);
            localStorage.removeItem("test");
          } catch (e) {
            // browser specific checks if local storage was exceeded
            if (
              e.name === "QUATA_EXCEEDED_ERR" || // Chrome
              e.name === "NS_ERROR_DOM_QUATA_REACHED" //Firefox/Safari
            ) {
              // local storage is full
              return "full";
            } else {
              try {
                if (localStorage.remainingSpace === 0) {
                  // IE
                  // local storage is full
                  return "full";
                }
              } catch (e) {
                // localStorage.remainingSpace doesn't exist
              } // local storage might not be available

              return "unavailable";
            }
          }

          return "available";
        };

        const sendAlertError = function (webProjectId, opts) {
          return new Promise((resolve, reject) => {
            let request_url = "";

            if (window.location.hostname == "localhost") {
              request_url = window.location.origin;
            } else {
              request_url = "https://www.hejagency.com";
            }

            let user = undefined;

            if (get_local_storage_status() == "available") {
              user = JSON.parse(localStorage.getItem("hej_user"));
            } else {
              user = session_user;
            }

            var ref = "";
            var urlParams = new URLSearchParams(window.location.search);

            if (urlParams.has("ref")) {
              ref = urlParams.get("ref");
            } // var request_url = window.location.origin;

            return Promise.all([
              http_http.post(`${request_url}/api/v1/generic/send_alert`, {
                data: opts.data,
                page_id: opts.configuration.page_id,
                browser: navigator.userAgent,
                platform: opts.configuration.type,
                url: window.location.href,
                ref: ref,
                web_project_id: webProjectId,
                label: opts.message_error
                  ? opts.message_error
                  : "Errore non identificato",
                content: opts.content
                  ? opts.content
                  : "Nessun info sul messaggio",
                error: opts.error
                  ? typeof opts.error === "object" && opts.error !== null
                    ? JSON.stringify(
                        opts.error.message ? opts.error.message : opts.error
                      )
                    : opts.error
                  : "Nessun messaggio di errore disponibile",
                user: user ? user._id : "Nessun utente",
              }),
              http_http.post(`${request_url}/api/v1/error`, {
                audience: user ? user._id : undefined,
                page_id: opts.configuration.page_id,
                priority: "Medium",
                ignore: false,
                label: opts.message_error
                  ? opts.message_error
                  : "Errore non identificato",
                details: {
                  browser: navigator.userAgent,
                  platform: opts.configuration.type,
                  message: opts.error
                    ? typeof opts.error === "object" && opts.error !== null
                      ? JSON.stringify(
                          opts.error.message ? opts.error.message : opts.error
                        )
                      : opts.error
                    : "Nessun messaggio di errore disponibile",
                  status: 500,
                  stack:
                    opts.error && opts.error.stack
                      ? opts.error.stack
                      : "stack non disponibile",
                },
              }),
            ])
              .then((data) => {
                console.log("data send alert", data);
                resolve(data);
              })
              .catch((err) => {
                console.log("err send alert", err); // chiamata api per log degli errori!, delivery non mandato

                return http_http
                  .post(`${request_url}/api/v1/error`, {
                    audience: user ? user._id : undefined,
                    page_id: opts.configuration.page_id,
                    priority: "Medium",
                    ignore: false,
                    label:
                      "Errore Invio Alert Slack (formattazione o messaggio troppo lungo)",
                    details: {
                      browser: navigator.userAgent,
                      platform: opts.configuration.type,
                      message: err.message
                        ? err.message
                        : "Errore in Common.sendAlertError",
                      status: err.status ? err.status : 500,
                      stack: err.stack ? err.stack : "stack non disponibile",
                    },
                  })
                  .then((data) => {
                    resolve(data);
                  })
                  .catch((err) => {
                    resolve(err);
                  });
              });
          });
        }; // Debounce function: Input as function which needs to be debounced and delay is the debounced time in milliseconds

        const debounceFunction = function (func, delay) {
          // Cancels the setTimeout method execution
          clearTimeout(timerId); // Executes the func after delay time.

          timerId = setTimeout(func, delay);
        };

        const setCustomObject = (obj) => {
          customData.push(obj);
          console.log("custom object", customData);
        };

        const setElementCustomObject = (obj, index) => {
          customData[index] = obj;
          console.log("custom object", customData);
        };

        const getCustomObject = () => {
          return customData;
        };

        const clearCustomObject = () => {
          customData = [];
        };

        const setFormObject = (data) => {
          data.groups.forEach((group) => {
            group.elements.map((element) => {
              if (element.type == "input") {
                if (
                  element.subtype == "checkbox" ||
                  element.subtype == "radio"
                ) {
                  element.info = {
                    checked: false,
                  };
                } else {
                  element.info = {
                    text: "",
                  };
                }
              } else if (element.type == "select") {
                element.info = {
                  selected: null,
                };
              }

              element.save_field = {
                profile: {
                  key: element.mapping.profile.key,
                  value: element.mapping.profile.value,
                },
                form: {
                  key: element.mapping.form.key,
                  value: element.mapping.form.value,
                },
              };
              return element;
            });
          });
          customData = data;
        };

        let checkViewportSize = () => {
          let win = window,
            doc = document,
            docElem = doc.documentElement,
            body = doc.getElementsByTagName("body")[0],
            x = win.innerWidth || docElem.clientWidth || body.clientWidth,
            y = win.innerHeight || docElem.clientHeight || body.clientHeight;

          if (x <= 360) {
            return "small";
          } else if (x <= 768) {
            return "medium";
          } else if (x <= 1024) {
            return "large";
          } else if (x <= 1440 || x > 1440) {
            return "extralarge";
          } else {
            return "original";
          }
        }; // funzione per aggiungere un event all'array di eventi custom;

        let addEvent = (evt, name) => {
          customEvents.push({
            name: name,
            dispatched: false,
            content: evt,
          });
        };

        let getEvents = () => {
          return customEvents;
        };

        let getEvent = (name) => {
          let evt = customEvents.find((e) => e.name == name);
          return evt;
        };

        let dispachEvent = (element, eventName) => {
          let evtObj = getEvent(eventName);
          let elem = element ? element : document.body;

          if (evtObj && !evtObj.dispatched) {
            elem.dispatchEvent(evtObj.content); // setEventProperty(eventName, "dispatched", true);
          }
        };

        let setEventProperty = (name, property, value) => {
          let index = customEvents.findIndex((e) => e.name == name);
          customEvents[index][property] = value;
        };

        const debounce = (fn, delay = 200) => {
          let timeoutId;
          return (...args) => {
            // cancel the previous timer
            if (timeoutId) {
              clearTimeout(timeoutId);
            } // setup a new timer

            timeoutId = setTimeout(() => {
              fn.apply(null, args);
            }, delay);
          };
        };

        const parseTextSymbol = (str) => {
          let occurence = str.match(/\[\[(.*?)]]/);

          if (occurence != undefined) {
            let arrayString = occurence[1].split(":");

            if (arrayString.length > 1) {
              let span = `<span class="hej_form_readonly_link">${arrayString[1]}</span>`;
              let new_text =
                str.substring(0, occurence.index) +
                span +
                str.substring(occurence.index + occurence[0].length);
              return {
                target: arrayString[0],
                text: new_text,
              };
            }
          }

          return {
            target: "standard",
            text: str,
          }; // console.log(
          //     "This is [[MODAL:clicca qui l'aperollo]] simple text".match(/[[(.*?)]]/)
          //     );
        };

        const setProperty = (key, value = undefined) => {
          configuration[key] = value;
        };

        const getProperty = (key) => {
          return configuration[key];
        };

        const clearProperty = (key) => {
          delete configuration[key];
        };

        const removeAllChildNodes = (parent) => {
          while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
          }
        };

        const setInteractionObject = (data) => {
          if (data.groups[0].interactions[0].info) {
            data.groups[0].interactions[0].info.save_field = {
              profile: {
                key: undefined,
                value: undefined,
              },
              form: {
                key: undefined,
                value: undefined,
              },
            };
          }

          customData = data;
        };

        const inIframe = () => {
          try {
            return window.self !== window.top;
          } catch (e) {
            return true;
          }
        };

        return {
          get_local_storage_status,
          sendAlertError,
          openUrl,
          stripHtml,
          hexToRgbA,
          getRandomString,
          changeCssProperty,
          removeElement,
          urlBase64ToUint8Array,
          checkStorageExpiration,
          setFirstInteraction,
          getFirstInteraction,
          getMimeType,
          readFileAsync,
          toBase64,
          debounceFunction,
          setCustomObject,
          setElementCustomObject,
          getCustomObject,
          clearCustomObject,
          checkViewportSize,
          addEvent,
          getEvents,
          getEvent,
          dispachEvent,
          setEventProperty,
          debounce,
          setFormObject,
          parseTextSymbol,
          setProperty,
          getProperty,
          clearProperty,
          removeAllChildNodes,
          setInteractionObject,
          inIframe,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/validator.js
      const Validator = (function () {
        const isRequired = (value) => (value === "" ? false : true);

        const isBetween = (length, min, max) =>
          length < min || length > max ? false : true;

        const isEmailValid = (email) => {
          const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(email);
        };

        const isPasswordSecure = (password) => {
          const re = new RegExp(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
          );
          return re.test(password);
        };

        const isRegexValid = (value, regex) => {
          try {
            const re = new RegExp(regex, "gi");
            return re.test(value);
          } catch (error) {
            console.log("regex non valida", error);
            return false;
          }
        };

        return {
          isRequired,
          isBetween,
          isEmailValid,
          isPasswordSecure,
          isRegexValid,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/form.utils.js
      const setCaretPosition = (elemId, caretPos) => {
        var elem = document.getElementById(elemId);

        if (elem != null) {
          if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.move("character", caretPos);
            range.select();
          } else {
            if (elem.selectionStart) {
              elem.focus();
              elem.setSelectionRange(caretPos, caretPos);
            } else elem.focus();
          }
        }
      };
      const containsNumbers = (str) => {
        return /[0-9]/.test(str);
      };
      const eventKeydownCustomDate = (evt, element) => {
        evt.preventDefault();

        if (evt.key == "Backspace") {
          console.log(evt);
          console.log("pos:", evt.target.selectionStart);
          console.log("pos:", evt.target.selectionEnd);
          let startCaret = evt.target.selectionStart;
          let endCaret = evt.target.selectionEnd;

          if (startCaret == endCaret && (startCaret == 6 || startCaret == 3)) {
            setCaretPosition(element.id, evt.target.selectionStart - 1);
            return;
          } else {
            let stringBeforeTrunk = "";
            let stringAfterTrunk = "";

            if (evt.target.selectionStart == evt.target.selectionEnd) {
              stringBeforeTrunk = evt.target.value.substring(
                0,
                evt.target.selectionStart - 1
              );
              stringAfterTrunk = evt.target.value.substring(
                evt.target.selectionStart
              );
            } else {
              if (startCaret == 0 && endCaret == 10) {
                evt.target.value = "";
                return;
              }

              stringBeforeTrunk = evt.target.value.substring(
                0,
                evt.target.selectionStart
              );
              stringAfterTrunk = evt.target.value.substring(
                evt.target.selectionEnd
              );
            }

            console.log("stringBeforeTrunk " + stringBeforeTrunk);
            console.log("stringAfterTrunk " + stringAfterTrunk);
            let newString = stringBeforeTrunk + stringAfterTrunk;
            console.log("newString " + newString);

            if (!containsNumbers(newString)) {
              evt.target.value = "";
              return;
            } // remove /

            let search = "\\/";
            const searchRegExp = new RegExp(search, "gi"); // Throws SyntaxError

            const replaceWith = "";
            newString = newString.replace(searchRegExp, replaceWith);
            console.log("newString " + newString);

            if (startCaret != endCaret) {
              for (let i = newString.length; i < 10; i++) {
                newString += "_";
              }
            } // add / with right position

            newString =
              newString.substring(0, 2) + "/" + newString.substring(2);
            console.log("newString " + newString);
            newString =
              newString.substring(0, 5) + "/" + newString.substring(5);
            console.log("newString " + newString);

            if (startCaret == endCaret) {
              for (let i = newString.length; i < 10; i++) {
                newString += "_";
              }
            }

            newString = newString.substring(0, 10);
            console.log("newString " + newString);
            console.log("newString " + newString);
            evt.target.value = newString; // move caret based on first position when event is triggered

            if (startCaret == endCaret) {
              if (startCaret - 1 == 3 || startCaret - 1 == 6) {
                setCaretPosition(element.id, startCaret - 2);
              } else {
                setCaretPosition(element.id, startCaret - 1);
              }
            } else {
              if (startCaret == 3 || startCaret == 6) {
                setCaretPosition(element.id, startCaret - 1);
              } else {
                setCaretPosition(element.id, startCaret);
              }
            }
          }

          let bool = testRegex(undefined, evt.target.value);
          DisableInputButton(bool);
        } else {
          if (!containsNumbers(evt.key)) return;
          console.log(evt);
          console.log("start caret position", evt.target.selectionStart);
          console.log("end caret position", evt.target.selectionEnd); // if we are adding number after position 10 GG/MM/AAAA

          if (evt.target.selectionStart >= 10) {
            evt.preventDefault();
            return;
          } // store caret position

          let startCaret = evt.target.selectionStart;
          let endCaret = evt.target.selectionEnd;

          if (evt.key == "Enter") {
            evt.preventDefault();
            return;
          } // if input value is empty

          if (evt.target.value == "") {
            evt.target.value = evt.key.concat("_/__/____");
            setCaretPosition(element.id, 1);
          } else {
            // split input value at position of caret
            let stringBeforeTrunk = evt.target.value.substring(
              0,
              evt.target.selectionStart
            );
            let stringAfterTrunk = evt.target.value.substring(
              evt.target.selectionStart
            );
            console.log("stringBeforeTrunk " + stringBeforeTrunk);
            console.log("stringAfterTrunk " + stringAfterTrunk); // add new character

            let newString = stringBeforeTrunk + evt.key + stringAfterTrunk;
            console.log("newString " + newString); // remove /

            let search = "\\/";
            const searchRegExp = new RegExp(search, "gi"); // Throws SyntaxError

            const replaceWith = "";
            newString = newString.replace(searchRegExp, replaceWith);
            console.log("newString " + newString); // add / with right position

            newString =
              newString.substring(0, 2) + "/" + newString.substring(2);
            console.log("newString " + newString);
            newString =
              newString.substring(0, 5) + "/" + newString.substring(5);
            console.log("newString " + newString);
            newString = newString.substring(0, 10);
            console.log("newString " + newString);
            evt.target.value = newString; // move caret based on first position when event is triggered

            if (
              startCaret + 1 == 2 ||
              startCaret + 1 == 5 ||
              startCaret + 1 == 3 ||
              startCaret + 1 == 6
            ) {
              setCaretPosition(element.id, startCaret + 2);
            } else {
              setCaretPosition(element.id, startCaret + 1);
            }
          }

          evt.preventDefault();
          let bool = testRegex(undefined, evt.target.value);
          DisableInputButton(bool);
          return;
        }
      };
      const eventKeyUpCustomDate = (evt, element) => {
        evt.preventDefault();
        evt.target.value = evt.target.value.replace(
          /([a-zA-Z\/.)(,;*#)]+)/g,
          ""
        );
        return;
      };
      const testRegex = (reg = undefined, str) => {
        if (reg == undefined) {
          reg =
            /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
        }

        const regex = new RegExp(reg);
        console.log(regex.test(str));
        return regex.test(str);
      };
      const DisableInputButton = (enabled) => {
        let button = document.getElementById("user_message_button");
        enabled == false
          ? button.setAttribute("disabled", true)
          : button.removeAttribute("disabled");
      }; // CONCATENATED MODULE: ./node_modules/just-validate/dist/just-validate.es.js
      var __defProp = Object.defineProperty;
      var __defNormalProp = (obj, key, value) =>
        key in obj
          ? __defProp(obj, key, {
              enumerable: true,
              configurable: true,
              writable: true,
              value,
            })
          : (obj[key] = value);
      var __publicField = (obj, key, value) => {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
      };
      const EMAIL_REGEXP =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const NUMBER_REGEXP = /^[0-9]+$/;
      const PASSWORD_REGEXP = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      const STRONG_PASSWORD_REGEXP =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      const isEmpty = (value) => {
        let newVal = value;
        if (typeof value === "string") {
          newVal = value.trim();
        }
        return !newVal;
      };
      const isEmail = (value) => {
        return EMAIL_REGEXP.test(value);
      };
      const isLengthMoreThanMax = (value, len) => {
        return value.length > len;
      };
      const isLengthLessThanMin = (value, len) => {
        return value.length < len;
      };
      const isNumber = (value) => {
        return NUMBER_REGEXP.test(value);
      };
      const isPassword = (value) => {
        return PASSWORD_REGEXP.test(value);
      };
      const isStrongPassword = (value) => {
        return STRONG_PASSWORD_REGEXP.test(value);
      };
      const isNumberMoreThanMax = (value, len) => {
        return value > len;
      };
      const isNumberLessThanMin = (value, len) => {
        return value < len;
      };
      var Rules = /* @__PURE__ */ ((Rules2) => {
        Rules2["Required"] = "required";
        Rules2["Email"] = "email";
        Rules2["MinLength"] = "minLength";
        Rules2["MaxLength"] = "maxLength";
        Rules2["Password"] = "password";
        Rules2["Number"] = "number";
        Rules2["MaxNumber"] = "maxNumber";
        Rules2["MinNumber"] = "minNumber";
        Rules2["StrongPassword"] = "strongPassword";
        Rules2["CustomRegexp"] = "customRegexp";
        Rules2["MinFilesCount"] = "minFilesCount";
        Rules2["MaxFilesCount"] = "maxFilesCount";
        Rules2["Files"] = "files";
        return Rules2;
      })(Rules || {});
      var GroupRules = /* @__PURE__ */ ((GroupRules2) => {
        GroupRules2["Required"] = "required";
        return GroupRules2;
      })(GroupRules || {});
      var CustomStyleTagIds = /* @__PURE__ */ ((CustomStyleTagIds2) => {
        CustomStyleTagIds2["Label"] = "label";
        CustomStyleTagIds2["LabelArrow"] = "labelArrow";
        return CustomStyleTagIds2;
      })(CustomStyleTagIds || {});
      const defaultDictionary = [
        {
          key: Rules.Required,
          dict: {
            en: "The field is required",
          },
        },
        {
          key: Rules.Email,
          dict: {
            en: "Email has invalid format",
          },
        },
        {
          key: Rules.MaxLength,
          dict: {
            en: "The field must contain a maximum of :value characters",
          },
        },
        {
          key: Rules.MinLength,
          dict: {
            en: "The field must contain a minimum of :value characters",
          },
        },
        {
          key: Rules.Password,
          dict: {
            en: "Password must contain minimum eight characters, at least one letter and one number",
          },
        },
        {
          key: Rules.StrongPassword,
          dict: {
            en: "Password should contain minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character",
          },
        },
        {
          key: Rules.Number,
          dict: {
            en: "Value should be a number",
          },
        },
        {
          key: Rules.MaxNumber,
          dict: {
            en: "Number should be less or equal than :value",
          },
        },
        {
          key: Rules.MinNumber,
          dict: {
            en: "Number should be more or equal than :value",
          },
        },
        {
          key: Rules.MinFilesCount,
          dict: {
            en: "Files count should be more or equal than :value",
          },
        },
        {
          key: Rules.MaxFilesCount,
          dict: {
            en: "Files count should be less or equal than :value",
          },
        },
        {
          key: Rules.Files,
          dict: {
            en: "Uploaded files have one or several invalid properties (extension/size/type etc).",
          },
        },
      ];
      const DEFAULT_ERROR_FIELD_MESSAGE = "Value is incorrect";
      const isPromise = (val) =>
        typeof val === "object" &&
        val !== null &&
        "then" in val &&
        typeof val.then === "function";
      const getNodeParents = (el) => {
        let elem = el;
        const els = [];
        while (elem) {
          els.unshift(elem);
          elem = elem.parentNode;
        }
        return els;
      };
      const getClosestParent = (groups, parents) => {
        const reversedParents = [...parents].reverse();
        for (let i = 0, len = reversedParents.length; i < len; ++i) {
          const parent = reversedParents[i];
          for (const key in groups) {
            const group = groups[key];
            if (group.groupElem === parent) {
              return [key, group];
            }
          }
        }
        return null;
      };
      const getClassList = (classList) => {
        if (Array.isArray(classList)) {
          return classList.filter((cls) => cls.length > 0);
        }
        if (typeof classList === "string" && classList.trim()) {
          return [...classList.split(" ").filter((cls) => cls.length > 0)];
        }
        return [];
      };
      const isElement = (element) => {
        return element instanceof Element || element instanceof HTMLDocument;
      };
      const errorLabelCss = `.just-validate-error-label[data-tooltip=true]{position:fixed;padding:4px 8px;background:#423f3f;color:#fff;white-space:nowrap;z-index:10;border-radius:4px;transform:translateY(-5px)}.just-validate-error-label[data-tooltip=true]:before{content:'';width:0;height:0;border-left:solid 5px transparent;border-right:solid 5px transparent;border-bottom:solid 5px #423f3f;position:absolute;z-index:3;display:block;bottom:-5px;transform:rotate(180deg);left:calc(50% - 5px)}.just-validate-error-label[data-tooltip=true][data-direction=left]{transform:translateX(-5px)}.just-validate-error-label[data-tooltip=true][data-direction=left]:before{right:-7px;bottom:auto;left:auto;top:calc(50% - 2px);transform:rotate(90deg)}.just-validate-error-label[data-tooltip=true][data-direction=right]{transform:translateX(5px)}.just-validate-error-label[data-tooltip=true][data-direction=right]:before{right:auto;bottom:auto;left:-7px;top:calc(50% - 2px);transform:rotate(-90deg)}.just-validate-error-label[data-tooltip=true][data-direction=bottom]{transform:translateY(5px)}.just-validate-error-label[data-tooltip=true][data-direction=bottom]:before{right:auto;bottom:auto;left:calc(50% - 5px);top:-5px;transform:rotate(0)}`;
      const TOOLTIP_ARROW_HEIGHT = 5;
      const defaultGlobalConfig = {
        errorFieldStyle: {
          color: "#b81111",
          border: "1px solid #B81111",
        },
        errorFieldCssClass: "just-validate-error-field",
        successFieldCssClass: "just-validate-success-field",
        errorLabelStyle: {
          color: "#b81111",
        },
        errorLabelCssClass: "just-validate-error-label",
        successLabelCssClass: "just-validate-success-label",
        focusInvalidField: true,
        lockForm: true,
        testingMode: false,
        validateBeforeSubmitting: false,
      };
      class JustValidate {
        constructor(form, globalConfig, dictLocale) {
          __publicField(this, "form", null);
          __publicField(this, "fields", {});
          __publicField(this, "groupFields", {});
          __publicField(this, "errors", {});
          __publicField(this, "isValid", false);
          __publicField(this, "isSubmitted", false);
          __publicField(this, "globalConfig", defaultGlobalConfig);
          __publicField(this, "errorLabels", {});
          __publicField(this, "successLabels", {});
          __publicField(this, "eventListeners", []);
          __publicField(this, "dictLocale", defaultDictionary);
          __publicField(this, "currentLocale", "en");
          __publicField(this, "customStyleTags", {});
          __publicField(this, "onSuccessCallback");
          __publicField(this, "onFailCallback");
          __publicField(this, "tooltips", []);
          __publicField(this, "lastScrollPosition");
          __publicField(this, "isScrollTick");
          __publicField(this, "fieldIds", /* @__PURE__ */ new Map());
          __publicField(this, "getKeyByFieldSelector", (field) => {
            return this.fieldIds.get(field);
          });
          __publicField(this, "getFieldSelectorByKey", (key) => {
            for (const [fieldSelector, k] of this.fieldIds) {
              if (key === k) {
                return fieldSelector;
              }
            }
            return void 0;
          });
          __publicField(this, "setKeyByFieldSelector", (field) => {
            if (this.fieldIds.has(field)) {
              return this.fieldIds.get(field);
            }
            const key = String(this.fieldIds.size + 1);
            this.fieldIds.set(field, key);
            return key;
          });
          __publicField(this, "refreshAllTooltips", () => {
            this.tooltips.forEach((item) => {
              item.refresh();
            });
          });
          __publicField(this, "handleDocumentScroll", () => {
            this.lastScrollPosition = window.scrollY;
            if (!this.isScrollTick) {
              window.requestAnimationFrame(() => {
                this.refreshAllTooltips();
                this.isScrollTick = false;
              });
              this.isScrollTick = true;
            }
          });
          __publicField(this, "formSubmitHandler", (ev) => {
            ev.preventDefault();
            this.isSubmitted = true;
            this.validateHandler(ev);
          });
          __publicField(this, "handleFieldChange", (target) => {
            let foundKey;
            for (const key in this.fields) {
              const field = this.fields[key];
              if (field.elem === target) {
                foundKey = key;
                break;
              }
            }
            if (!foundKey) {
              return;
            }
            this.validateField(foundKey, true);
          });
          __publicField(this, "handleGroupChange", (target) => {
            let currentGroup;
            let foundKey;
            for (const key in this.groupFields) {
              const group = this.groupFields[key];
              if (group.elems.find((elem) => elem === target)) {
                currentGroup = group;
                foundKey = key;
                break;
              }
            }
            if (!currentGroup || !foundKey) {
              return;
            }
            this.validateGroup(foundKey, currentGroup);
          });
          __publicField(this, "handlerChange", (ev) => {
            if (!ev.target) {
              return;
            }
            this.handleFieldChange(ev.target);
            this.handleGroupChange(ev.target);
            this.renderErrors();
          });
          this.initialize(form, globalConfig, dictLocale);
        }
        initialize(form, globalConfig, dictLocale) {
          this.form = null;
          this.errors = {};
          this.isValid = false;
          this.isSubmitted = false;
          this.globalConfig = defaultGlobalConfig;
          this.errorLabels = {};
          this.successLabels = {};
          this.eventListeners = [];
          this.customStyleTags = {};
          this.tooltips = [];
          this.currentLocale = "en";
          if (typeof form === "string") {
            const elem = document.querySelector(form);
            if (!elem) {
              throw Error(
                `Form with ${form} selector not found! Please check the form selector`
              );
            }
            this.setForm(elem);
          } else if (form instanceof HTMLFormElement) {
            this.setForm(form);
          } else {
            throw Error(
              `Form selector is not valid. Please specify a string selector or a DOM element.`
            );
          }
          this.globalConfig = { ...defaultGlobalConfig, ...globalConfig };
          if (dictLocale) {
            this.dictLocale = [...dictLocale, ...defaultDictionary];
          }
          if (this.isTooltip()) {
            const styleTag = document.createElement("style");
            styleTag.textContent = errorLabelCss;
            this.customStyleTags[CustomStyleTagIds.Label] =
              document.head.appendChild(styleTag);
            this.addListener("scroll", document, this.handleDocumentScroll);
          }
        }
        getLocalisedString(rule, ruleValue, customMsg) {
          var _a;
          const search = customMsg != null ? customMsg : rule;
          let localisedStr =
            (_a = this.dictLocale.find((item) => item.key === search)) == null
              ? void 0
              : _a.dict[this.currentLocale];
          if (!localisedStr) {
            if (customMsg) {
              localisedStr = customMsg;
            }
          }
          if (localisedStr && ruleValue !== void 0) {
            switch (rule) {
              case Rules.MaxLength:
              case Rules.MinLength:
              case Rules.MaxNumber:
              case Rules.MinNumber:
              case Rules.MinFilesCount:
              case Rules.MaxFilesCount:
                localisedStr = localisedStr.replace(
                  ":value",
                  String(ruleValue)
                );
            }
          }
          return localisedStr || customMsg || DEFAULT_ERROR_FIELD_MESSAGE;
        }
        getFieldErrorMessage(fieldRule, elem) {
          const msg =
            typeof fieldRule.errorMessage === "function"
              ? fieldRule.errorMessage(this.getElemValue(elem), this.fields)
              : fieldRule.errorMessage;
          return this.getLocalisedString(fieldRule.rule, fieldRule.value, msg);
        }
        getFieldSuccessMessage(successMessage, elem) {
          const msg =
            typeof successMessage === "function"
              ? successMessage(this.getElemValue(elem), this.fields)
              : successMessage;
          return this.getLocalisedString(void 0, void 0, msg);
        }
        getGroupErrorMessage(groupRule) {
          return this.getLocalisedString(
            groupRule.rule,
            void 0,
            groupRule.errorMessage
          );
        }
        getGroupSuccessMessage(groupRule) {
          if (!groupRule.successMessage) {
            return void 0;
          }
          return this.getLocalisedString(
            void 0,
            void 0,
            groupRule.successMessage
          );
        }
        setFieldInvalid(key, fieldRule) {
          this.fields[key].isValid = false;
          this.fields[key].errorMessage = this.getFieldErrorMessage(
            fieldRule,
            this.fields[key].elem
          );
        }
        setFieldValid(key, successMessage) {
          this.fields[key].isValid = true;
          if (successMessage !== void 0) {
            this.fields[key].successMessage = this.getFieldSuccessMessage(
              successMessage,
              this.fields[key].elem
            );
          }
        }
        setGroupInvalid(key, groupRule) {
          this.groupFields[key].isValid = false;
          this.groupFields[key].errorMessage =
            this.getGroupErrorMessage(groupRule);
        }
        setGroupValid(key, groupRule) {
          this.groupFields[key].isValid = true;
          this.groupFields[key].successMessage =
            this.getGroupSuccessMessage(groupRule);
        }
        getElemValue(elem) {
          switch (elem.type) {
            case "checkbox":
              return elem.checked;
            case "file":
              return elem.files;
            default:
              return elem.value;
          }
        }
        validateGroupRule(key, elems, groupRule) {
          switch (groupRule.rule) {
            case GroupRules.Required: {
              if (elems.every((elem) => !elem.checked)) {
                this.setGroupInvalid(key, groupRule);
              } else {
                this.setGroupValid(key, groupRule);
              }
            }
          }
        }
        validateFieldRule(key, elem, fieldRule, afterInputChanged = false) {
          const ruleValue = fieldRule.value;
          const elemValue = this.getElemValue(elem);
          if (fieldRule.plugin) {
            const result = fieldRule.plugin(elemValue, this.fields);
            if (!result) {
              this.setFieldInvalid(key, fieldRule);
            }
            return;
          }
          switch (fieldRule.rule) {
            case Rules.Required: {
              if (isEmpty(elemValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.Email: {
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (!isEmail(elemValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.MaxLength: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              if (isLengthMoreThanMax(elemValue, ruleValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.MinLength: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              if (isLengthLessThanMin(elemValue, ruleValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.Password: {
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              if (!isPassword(elemValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.StrongPassword: {
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              if (!isStrongPassword(elemValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.Number: {
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              if (!isNumber(elemValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.MaxNumber: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              const num = +elemValue;
              if (Number.isNaN(num) || isNumberMoreThanMax(num, ruleValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.MinNumber: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof elemValue !== "string") {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (elemValue === "") {
                break;
              }
              const num = +elemValue;
              if (Number.isNaN(num) || isNumberLessThanMin(num, ruleValue)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.CustomRegexp: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                return;
              }
              let regexp;
              try {
                regexp = new RegExp(ruleValue);
              } catch (e) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] should be a valid regexp. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              const str = String(elemValue);
              if (str !== "" && !regexp.test(str)) {
                this.setFieldInvalid(key, fieldRule);
              }
              break;
            }
            case Rules.MinFilesCount: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (
                Number.isFinite(
                  elemValue == null ? void 0 : elemValue.length
                ) &&
                elemValue.length < ruleValue
              ) {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              break;
            }
            case Rules.MaxFilesCount: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (typeof ruleValue !== "number") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be a number. The field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              if (
                Number.isFinite(
                  elemValue == null ? void 0 : elemValue.length
                ) &&
                elemValue.length > ruleValue
              ) {
                this.setFieldInvalid(key, fieldRule);
                break;
              }
              break;
            }
            case Rules.Files: {
              if (ruleValue === void 0) {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field is not defined. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                return;
              }
              if (typeof ruleValue !== "object") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be an object. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                return;
              }
              const filesConfig = ruleValue.files;
              if (typeof filesConfig !== "object") {
                console.error(
                  `Value for ${fieldRule.rule} rule for [${key}] field should be an object with files array. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                return;
              }
              const isFilePropsInvalid = (file, fileConfig) => {
                const minSizeInvalid =
                  Number.isFinite(fileConfig.minSize) &&
                  file.size < fileConfig.minSize;
                const maxSizeInvalid =
                  Number.isFinite(fileConfig.maxSize) &&
                  file.size > fileConfig.maxSize;
                const nameInvalid =
                  Array.isArray(fileConfig.names) &&
                  !fileConfig.names.includes(file.name);
                const extInvalid =
                  Array.isArray(fileConfig.extensions) &&
                  !fileConfig.extensions.includes(
                    file.name.split(".")[file.name.split(".").length - 1]
                  );
                const typeInvalid =
                  Array.isArray(fileConfig.types) &&
                  !fileConfig.types.includes(file.type);
                return (
                  minSizeInvalid ||
                  maxSizeInvalid ||
                  nameInvalid ||
                  extInvalid ||
                  typeInvalid
                );
              };
              if (typeof elemValue === "object" && elemValue !== null) {
                for (
                  let fileIdx = 0, len = elemValue.length;
                  fileIdx < len;
                  ++fileIdx
                ) {
                  const file = elemValue.item(fileIdx);
                  if (!file) {
                    this.setFieldInvalid(key, fieldRule);
                    break;
                  }
                  const filesInvalid = isFilePropsInvalid(file, filesConfig);
                  if (filesInvalid) {
                    this.setFieldInvalid(key, fieldRule);
                    break;
                  }
                }
              }
              break;
            }
            default: {
              if (typeof fieldRule.validator !== "function") {
                console.error(
                  `Validator for custom rule for [${key}] field should be a function. This field will be always invalid.`
                );
                this.setFieldInvalid(key, fieldRule);
                return;
              }
              const result = fieldRule.validator(elemValue, this.fields);
              if (typeof result !== "boolean" && typeof result !== "function") {
                console.error(
                  `Validator return value for [${key}] field should be boolean or function. It will be cast to boolean.`
                );
              }
              if (typeof result === "function") {
                if (afterInputChanged) {
                  this.fields[key].asyncCheckPending = true;
                } else {
                  this.fields[key].asyncCheckPending = false;
                  const promise = result();
                  if (!isPromise(promise)) {
                    console.error(
                      `Validator function for custom rule for [${key}] field should return a Promise. This field will be always invalid.`
                    );
                    this.setFieldInvalid(key, fieldRule);
                    return;
                  }
                  return promise
                    .then((resp) => {
                      if (!resp) {
                        this.setFieldInvalid(key, fieldRule);
                      }
                    })
                    .catch(() => {
                      this.setFieldInvalid(key, fieldRule);
                    });
                }
              }
              if (!result) {
                this.setFieldInvalid(key, fieldRule);
              }
            }
          }
        }
        validateField(key, afterInputChanged = false) {
          var _a;
          const field = this.fields[key];
          field.isValid = true;
          const promises = [];
          [...field.rules].reverse().forEach((rule) => {
            const res = this.validateFieldRule(
              key,
              field.elem,
              rule,
              afterInputChanged
            );
            if (isPromise(res)) {
              promises.push(res);
            }
          });
          if (field.isValid) {
            this.setFieldValid(
              key,
              (_a = field.config) == null ? void 0 : _a.successMessage
            );
          }
          return Promise.allSettled(promises);
        }
        revalidateField(fieldSelector) {
          if (typeof fieldSelector !== "string" && !isElement(fieldSelector)) {
            throw Error(
              `Field selector is not valid. Please specify a string selector or a valid DOM element.`
            );
          }
          const key = this.getKeyByFieldSelector(fieldSelector);
          if (!key || !this.fields[key]) {
            console.error(`Field not found. Check the field selector.`);
            return Promise.reject();
          }
          return new Promise((resolve) => {
            this.validateField(key, true).finally(() => {
              this.clearFieldStyle(key);
              this.clearFieldLabel(key);
              this.renderFieldError(key);
              resolve(!!this.fields[key].isValid);
            });
          });
        }
        validateGroup(key, group) {
          const promises = [];
          [...group.rules].reverse().forEach((rule) => {
            const res = this.validateGroupRule(key, group.elems, rule);
            if (isPromise(res)) {
              promises.push(res);
            }
          });
          return Promise.allSettled(promises);
        }
        focusInvalidField() {
          for (const key in this.fields) {
            const field = this.fields[key];
            if (!field.isValid) {
              setTimeout(() => field.elem.focus(), 0);
              break;
            }
          }
        }
        afterSubmitValidation(forceRevalidation = false) {
          this.renderErrors(forceRevalidation);
          if (this.globalConfig.focusInvalidField) {
            this.focusInvalidField();
          }
        }
        validate(forceRevalidation = false) {
          return new Promise((resolve) => {
            const promises = [];
            Object.keys(this.fields).forEach((key) => {
              const promise = this.validateField(key);
              if (isPromise(promise)) {
                promises.push(promise);
              }
            });
            Object.keys(this.groupFields).forEach((key) => {
              const group = this.groupFields[key];
              const promise = this.validateGroup(key, group);
              if (isPromise(promise)) {
                promises.push(promise);
              }
            });
            if (promises.length) {
              Promise.allSettled(promises).then(() => {
                this.afterSubmitValidation(forceRevalidation);
                resolve(true);
              });
            } else {
              this.afterSubmitValidation(forceRevalidation);
              resolve(false);
            }
          });
        }
        revalidate() {
          return new Promise((resolve) => {
            this.validateHandler(void 0, true).finally(() => {
              if (this.globalConfig.focusInvalidField) {
                this.focusInvalidField();
              }
              resolve(this.isValid);
            });
          });
        }
        validateHandler(ev, forceRevalidation = false) {
          if (this.globalConfig.lockForm) {
            this.lockForm();
          }
          return this.validate(forceRevalidation).finally(() => {
            var _a, _b;
            if (this.globalConfig.lockForm) {
              this.unlockForm();
            }
            if (this.isValid) {
              (_a = this.onSuccessCallback) == null
                ? void 0
                : _a.call(this, ev);
            } else {
              (_b = this.onFailCallback) == null
                ? void 0
                : _b.call(this, this.fields, this.groupFields);
            }
          });
        }
        setForm(form) {
          this.form = form;
          this.form.setAttribute("novalidate", "novalidate");
          this.removeListener("submit", this.form, this.formSubmitHandler);
          this.addListener("submit", this.form, this.formSubmitHandler);
        }
        addListener(type, elem, handler) {
          elem.addEventListener(type, handler);
          this.eventListeners.push({ type, elem, func: handler });
        }
        removeListener(type, elem, handler) {
          elem.removeEventListener(type, handler);
          this.eventListeners = this.eventListeners.filter(
            (item) => item.type !== type || item.elem !== elem
          );
        }
        addField(fieldSelector, rules, config) {
          if (typeof fieldSelector !== "string" && !isElement(fieldSelector)) {
            throw Error(
              `Field selector is not valid. Please specify a string selector or a valid DOM element.`
            );
          }
          let elem;
          if (typeof fieldSelector === "string") {
            elem = this.form.querySelector(fieldSelector);
          } else {
            elem = fieldSelector;
          }
          if (!elem) {
            throw Error(
              `Field doesn't exist in the DOM! Please check the field selector.`
            );
          }
          if (!Array.isArray(rules) || !rules.length) {
            throw Error(
              `Rules argument should be an array and should contain at least 1 element.`
            );
          }
          rules.forEach((item) => {
            if (!("rule" in item || "validator" in item || "plugin" in item)) {
              throw Error(
                `Rules argument must contain at least one rule or validator property.`
              );
            }
            if (
              !item.validator &&
              !item.plugin &&
              (!item.rule || !Object.values(Rules).includes(item.rule))
            ) {
              throw Error(
                `Rule should be one of these types: ${Object.values(Rules).join(
                  ", "
                )}. Provided value: ${item.rule}`
              );
            }
          });
          const key = this.setKeyByFieldSelector(fieldSelector);
          this.fields[key] = {
            elem,
            rules,
            isValid: void 0,
            config,
          };
          this.setListeners(elem);
          if (this.isSubmitted) {
            this.validate();
          }
          return this;
        }
        removeField(fieldSelector) {
          if (typeof fieldSelector !== "string" && !isElement(fieldSelector)) {
            throw Error(
              `Field selector is not valid. Please specify a string selector or a valid DOM element.`
            );
          }
          const key = this.getKeyByFieldSelector(fieldSelector);
          if (!key || !this.fields[key]) {
            console.error(`Field not found. Check the field selector.`);
            return this;
          }
          const type = this.getListenerType(this.fields[key].elem.type);
          this.removeListener(type, this.fields[key].elem, this.handlerChange);
          this.clearErrors();
          delete this.fields[key];
          return this;
        }
        removeGroup(group) {
          if (typeof group !== "string") {
            throw Error(
              `Group selector is not valid. Please specify a string selector.`
            );
          }
          const key = this.getKeyByFieldSelector(group);
          if (!key || !this.groupFields[key]) {
            console.error(`Group not found. Check the group selector.`);
            return this;
          }
          this.groupFields[key].elems.forEach((elem) => {
            const type = this.getListenerType(elem.type);
            this.removeListener(type, elem, this.handlerChange);
          });
          this.clearErrors();
          delete this.groupFields[key];
          return this;
        }
        addRequiredGroup(groupField, errorMessage, config, successMessage) {
          if (typeof groupField !== "string") {
            throw Error(
              `Group selector is not valid. Please specify a string selector.`
            );
          }
          const elem = this.form.querySelector(groupField);
          if (!elem) {
            throw Error(
              `Group with ${groupField} selector not found! Please check the group selector.`
            );
          }
          const inputs = elem.querySelectorAll("input");
          const childrenInputs = Array.from(inputs).filter((input) => {
            const parent = getClosestParent(
              this.groupFields,
              getNodeParents(input)
            );
            if (!parent) {
              return true;
            }
            return parent[1].elems.find((elem2) => elem2 !== input);
          });
          const key = this.setKeyByFieldSelector(groupField);
          this.groupFields[key] = {
            rules: [
              {
                rule: GroupRules.Required,
                errorMessage,
                successMessage,
              },
            ],
            groupElem: elem,
            elems: childrenInputs,
            isDirty: false,
            isValid: void 0,
            config,
          };
          inputs.forEach((input) => {
            this.setListeners(input);
          });
          return this;
        }
        getListenerType(type) {
          switch (type) {
            case "checkbox":
            case "select-one":
            case "file":
            case "radio": {
              return "change";
            }
            default: {
              return "input";
            }
          }
        }
        setListeners(elem) {
          const type = this.getListenerType(elem.type);
          this.removeListener(type, elem, this.handlerChange);
          this.addListener(type, elem, this.handlerChange);
        }
        clearFieldLabel(key) {
          var _a, _b;
          (_a = this.errorLabels[key]) == null ? void 0 : _a.remove();
          (_b = this.successLabels[key]) == null ? void 0 : _b.remove();
        }
        clearFieldStyle(key) {
          var _a, _b, _c, _d;
          const field = this.fields[key];
          const errorStyle =
            ((_a = field.config) == null ? void 0 : _a.errorFieldStyle) ||
            this.globalConfig.errorFieldStyle;
          Object.keys(errorStyle).forEach((key2) => {
            field.elem.style[key2] = "";
          });
          const successStyle =
            ((_b = field.config) == null ? void 0 : _b.successFieldStyle) ||
            this.globalConfig.successFieldStyle ||
            {};
          Object.keys(successStyle).forEach((key2) => {
            field.elem.style[key2] = "";
          });
          field.elem.classList.remove(
            ...getClassList(
              ((_c = field.config) == null ? void 0 : _c.errorFieldCssClass) ||
                this.globalConfig.errorFieldCssClass
            ),
            ...getClassList(
              ((_d = field.config) == null
                ? void 0
                : _d.successFieldCssClass) ||
                this.globalConfig.successFieldCssClass
            )
          );
        }
        clearErrors() {
          var _a, _b;
          Object.keys(this.errorLabels).forEach((key) =>
            this.errorLabels[key].remove()
          );
          Object.keys(this.successLabels).forEach((key) =>
            this.successLabels[key].remove()
          );
          for (const key in this.fields) {
            this.clearFieldStyle(key);
          }
          for (const key in this.groupFields) {
            const group = this.groupFields[key];
            const errorStyle =
              ((_a = group.config) == null ? void 0 : _a.errorFieldStyle) ||
              this.globalConfig.errorFieldStyle;
            Object.keys(errorStyle).forEach((key2) => {
              group.elems.forEach((elem) => {
                var _a2;
                elem.style[key2] = "";
                elem.classList.remove(
                  ...getClassList(
                    ((_a2 = group.config) == null
                      ? void 0
                      : _a2.errorFieldCssClass) ||
                      this.globalConfig.errorFieldCssClass
                  )
                );
              });
            });
            const successStyle =
              ((_b = group.config) == null ? void 0 : _b.successFieldStyle) ||
              this.globalConfig.successFieldStyle ||
              {};
            Object.keys(successStyle).forEach((key2) => {
              group.elems.forEach((elem) => {
                var _a2;
                elem.style[key2] = "";
                elem.classList.remove(
                  ...getClassList(
                    ((_a2 = group.config) == null
                      ? void 0
                      : _a2.successFieldCssClass) ||
                      this.globalConfig.successFieldCssClass
                  )
                );
              });
            });
          }
          this.tooltips = [];
        }
        isTooltip() {
          return !!this.globalConfig.tooltip;
        }
        lockForm() {
          const elems = this.form.querySelectorAll(
            "input, textarea, button, select"
          );
          for (let i = 0, len = elems.length; i < len; ++i) {
            elems[i].setAttribute(
              "data-just-validate-fallback-disabled",
              elems[i].disabled ? "true" : "false"
            );
            elems[i].setAttribute("disabled", "disabled");
            elems[i].style.pointerEvents = "none";
            elems[i].style.webkitFilter = "grayscale(100%)";
            elems[i].style.filter = "grayscale(100%)";
          }
        }
        unlockForm() {
          const elems = this.form.querySelectorAll(
            "input, textarea, button, select"
          );
          for (let i = 0, len = elems.length; i < len; ++i) {
            if (
              elems[i].getAttribute("data-just-validate-fallback-disabled") !==
              "true"
            ) {
              elems[i].removeAttribute("disabled");
            }
            elems[i].style.pointerEvents = "";
            elems[i].style.webkitFilter = "";
            elems[i].style.filter = "";
          }
        }
        renderTooltip(elem, errorLabel, position) {
          var _a;
          const { top, left, width, height } = elem.getBoundingClientRect();
          const errorLabelRect = errorLabel.getBoundingClientRect();
          const pos =
            position ||
            ((_a = this.globalConfig.tooltip) == null ? void 0 : _a.position);
          switch (pos) {
            case "left": {
              errorLabel.style.top = `${
                top + height / 2 - errorLabelRect.height / 2
              }px`;
              errorLabel.style.left = `${
                left - errorLabelRect.width - TOOLTIP_ARROW_HEIGHT
              }px`;
              break;
            }
            case "top": {
              errorLabel.style.top = `${
                top - errorLabelRect.height - TOOLTIP_ARROW_HEIGHT
              }px`;
              errorLabel.style.left = `${
                left + width / 2 - errorLabelRect.width / 2
              }px`;
              break;
            }
            case "right": {
              errorLabel.style.top = `${
                top + height / 2 - errorLabelRect.height / 2
              }px`;
              errorLabel.style.left = `${
                left + width + TOOLTIP_ARROW_HEIGHT
              }px`;
              break;
            }
            case "bottom": {
              errorLabel.style.top = `${top + height + TOOLTIP_ARROW_HEIGHT}px`;
              errorLabel.style.left = `${
                left + width / 2 - errorLabelRect.width / 2
              }px`;
              break;
            }
          }
          errorLabel.dataset.direction = pos;
          const refresh = () => {
            this.renderTooltip(elem, errorLabel, position);
          };
          return {
            refresh,
          };
        }
        createErrorLabelElem(key, errorMessage, config) {
          const errorLabel = document.createElement("div");
          errorLabel.innerHTML = errorMessage;
          const customErrorLabelStyle = this.isTooltip()
            ? config == null
              ? void 0
              : config.errorLabelStyle
            : (config == null ? void 0 : config.errorLabelStyle) ||
              this.globalConfig.errorLabelStyle;
          Object.assign(errorLabel.style, customErrorLabelStyle);
          errorLabel.classList.add(
            ...getClassList(
              (config == null ? void 0 : config.errorLabelCssClass) ||
                this.globalConfig.errorLabelCssClass
            ),
            "just-validate-error-label"
          );
          if (this.isTooltip()) {
            errorLabel.dataset.tooltip = "true";
          }
          if (this.globalConfig.testingMode) {
            errorLabel.dataset.testId = `error-label-${key}`;
          }
          this.errorLabels[key] = errorLabel;
          return errorLabel;
        }
        createSuccessLabelElem(key, successMessage, config) {
          if (successMessage === void 0) {
            return null;
          }
          const successLabel = document.createElement("div");
          successLabel.innerHTML = successMessage;
          const customSuccessLabelStyle =
            (config == null ? void 0 : config.successLabelStyle) ||
            this.globalConfig.successLabelStyle;
          Object.assign(successLabel.style, customSuccessLabelStyle);
          successLabel.classList.add(
            ...getClassList(
              (config == null ? void 0 : config.successLabelCssClass) ||
                this.globalConfig.successLabelCssClass
            ),
            "just-validate-success-label"
          );
          if (this.globalConfig.testingMode) {
            successLabel.dataset.testId = `success-label-${key}`;
          }
          this.successLabels[key] = successLabel;
          return successLabel;
        }
        renderErrorsContainer(label, errorsContainer) {
          const container =
            errorsContainer || this.globalConfig.errorsContainer;
          if (typeof container === "string") {
            const elem = this.form.querySelector(container);
            if (elem) {
              elem.appendChild(label);
              return true;
            } else {
              console.error(
                `Error container with ${container} selector not found. Errors will be rendered as usual`
              );
            }
          }
          if (container instanceof Element) {
            container.appendChild(label);
            return true;
          }
          if (container !== void 0) {
            console.error(
              `Error container not found. It should be a string or existing Element. Errors will be rendered as usual`
            );
          }
          return false;
        }
        renderGroupLabel(elem, label, errorsContainer, isSuccess) {
          if (!isSuccess) {
            const renderedInErrorsContainer = this.renderErrorsContainer(
              label,
              errorsContainer
            );
            if (renderedInErrorsContainer) {
              return;
            }
          }
          elem.appendChild(label);
        }
        renderFieldLabel(elem, label, errorsContainer, isSuccess) {
          var _a, _b, _c, _d, _e, _f, _g;
          if (!isSuccess) {
            const renderedInErrorsContainer = this.renderErrorsContainer(
              label,
              errorsContainer
            );
            if (renderedInErrorsContainer) {
              return;
            }
          }
          if (elem.type === "checkbox" || elem.type === "radio") {
            const labelElem = document.querySelector(
              `label[for="${elem.getAttribute("id")}"]`
            );
            if (
              ((_b = (_a = elem.parentElement) == null ? void 0 : _a.tagName) ==
              null
                ? void 0
                : _b.toLowerCase()) === "label"
            ) {
              (_d =
                (_c = elem.parentElement) == null
                  ? void 0
                  : _c.parentElement) == null
                ? void 0
                : _d.appendChild(label);
            } else if (labelElem) {
              (_e = labelElem.parentElement) == null
                ? void 0
                : _e.appendChild(label);
            } else {
              (_f = elem.parentElement) == null
                ? void 0
                : _f.appendChild(label);
            }
          } else {
            (_g = elem.parentElement) == null ? void 0 : _g.appendChild(label);
          }
        }
        showLabels(fields, isError) {
          Object.keys(fields).forEach((fieldName, i) => {
            const error = fields[fieldName];
            const key = this.getKeyByFieldSelector(fieldName);
            if (!key || !this.fields[key]) {
              console.error(`Field not found. Check the field selector.`);
              return;
            }
            const field = this.fields[key];
            field.isValid = !isError;
            this.clearFieldStyle(key);
            this.clearFieldLabel(key);
            this.renderFieldError(key, error);
            if (i === 0 && this.globalConfig.focusInvalidField) {
              setTimeout(() => field.elem.focus(), 0);
            }
          });
        }
        showErrors(fields) {
          if (typeof fields !== "object") {
            throw Error(
              "[showErrors]: Errors should be an object with key: value format"
            );
          }
          this.showLabels(fields, true);
        }
        showSuccessLabels(fields) {
          if (typeof fields !== "object") {
            throw Error(
              "[showSuccessLabels]: Labels should be an object with key: value format"
            );
          }
          this.showLabels(fields, false);
        }
        renderFieldError(key, message) {
          var _a, _b, _c, _d, _e, _f;
          const field = this.fields[key];
          if (field.isValid === void 0) {
            return;
          }
          if (field.isValid) {
            if (!field.asyncCheckPending) {
              const successLabel = this.createSuccessLabelElem(
                key,
                message !== void 0 ? message : field.successMessage,
                field.config
              );
              if (successLabel) {
                this.renderFieldLabel(
                  field.elem,
                  successLabel,
                  (_a = field.config) == null ? void 0 : _a.errorsContainer,
                  true
                );
              }
              field.elem.classList.add(
                ...getClassList(
                  ((_b = field.config) == null
                    ? void 0
                    : _b.successFieldCssClass) ||
                    this.globalConfig.successFieldCssClass
                )
              );
            }
            return;
          }
          this.isValid = false;
          field.elem.classList.add(
            ...getClassList(
              ((_c = field.config) == null ? void 0 : _c.errorFieldCssClass) ||
                this.globalConfig.errorFieldCssClass
            )
          );
          const errorLabel = this.createErrorLabelElem(
            key,
            message !== void 0 ? message : field.errorMessage,
            field.config
          );
          this.renderFieldLabel(
            field.elem,
            errorLabel,
            (_d = field.config) == null ? void 0 : _d.errorsContainer
          );
          if (this.isTooltip()) {
            this.tooltips.push(
              this.renderTooltip(
                field.elem,
                errorLabel,
                (_f = (_e = field.config) == null ? void 0 : _e.tooltip) == null
                  ? void 0
                  : _f.position
              )
            );
          }
        }
        renderGroupError(key) {
          var _a, _b, _c, _d;
          const group = this.groupFields[key];
          if (group.isValid === void 0) {
            return;
          }
          if (group.isValid) {
            group.elems.forEach((elem) => {
              var _a2, _b2;
              Object.assign(
                elem.style,
                ((_a2 = group.config) == null
                  ? void 0
                  : _a2.successFieldStyle) ||
                  this.globalConfig.successFieldStyle
              );
              elem.classList.add(
                ...getClassList(
                  ((_b2 = group.config) == null
                    ? void 0
                    : _b2.successFieldCssClass) ||
                    this.globalConfig.successFieldCssClass
                )
              );
            });
            const successLabel = this.createSuccessLabelElem(
              key,
              group.successMessage,
              group.config
            );
            if (successLabel) {
              this.renderGroupLabel(
                group.groupElem,
                successLabel,
                (_a = group.config) == null ? void 0 : _a.errorsContainer,
                true
              );
            }
            return;
          }
          this.isValid = false;
          group.elems.forEach((elem) => {
            var _a2, _b2;
            Object.assign(
              elem.style,
              ((_a2 = group.config) == null ? void 0 : _a2.errorFieldStyle) ||
                this.globalConfig.errorFieldStyle
            );
            elem.classList.add(
              ...getClassList(
                ((_b2 = group.config) == null
                  ? void 0
                  : _b2.errorFieldCssClass) ||
                  this.globalConfig.errorFieldCssClass
              )
            );
          });
          const errorLabel = this.createErrorLabelElem(
            key,
            group.errorMessage,
            group.config
          );
          this.renderGroupLabel(
            group.groupElem,
            errorLabel,
            (_b = group.config) == null ? void 0 : _b.errorsContainer
          );
          if (this.isTooltip()) {
            this.tooltips.push(
              this.renderTooltip(
                group.groupElem,
                errorLabel,
                (_d = (_c = group.config) == null ? void 0 : _c.tooltip) == null
                  ? void 0
                  : _d.position
              )
            );
          }
        }
        renderErrors(forceRevalidation = false) {
          if (
            !this.isSubmitted &&
            !forceRevalidation &&
            !this.globalConfig.validateBeforeSubmitting
          ) {
            return;
          }
          this.clearErrors();
          this.isValid = true;
          for (const key in this.groupFields) {
            this.renderGroupError(key);
          }
          for (const key in this.fields) {
            this.renderFieldError(key);
          }
        }
        destroy() {
          this.eventListeners.forEach((event) => {
            this.removeListener(event.type, event.elem, event.func);
          });
          Object.keys(this.customStyleTags).forEach((key) => {
            this.customStyleTags[key].remove();
          });
          this.clearErrors();
          if (this.globalConfig.lockForm) {
            this.unlockForm();
          }
        }
        refresh() {
          this.destroy();
          if (!this.form) {
            console.error("Cannot initialize the library! Form is not defined");
          } else {
            this.initialize(this.form, this.globalConfig);
            Object.keys(this.fields).forEach((key) => {
              const fieldSelector = this.getFieldSelectorByKey(key);
              if (fieldSelector) {
                this.addField(
                  fieldSelector,
                  [...this.fields[key].rules],
                  this.fields[key].config
                );
              }
            });
          }
        }
        setCurrentLocale(locale) {
          if (typeof locale !== "string" && locale !== void 0) {
            console.error("Current locale should be a string");
            return;
          }
          this.currentLocale = locale;
          if (this.isSubmitted) {
            this.validate();
          }
        }
        onSuccess(callback) {
          this.onSuccessCallback = callback;
          return this;
        }
        onFail(callback) {
          this.onFailCallback = callback;
          return this;
        }
      } // CONCATENATED MODULE: ./node_modules/just-validate-plugin-date/dist/just-validate-plugin-date.es.js

      var formatDistanceLocale = {
        lessThanXSeconds: {
          one: "less than a second",
          other: "less than {{count}} seconds",
        },
        xSeconds: {
          one: "1 second",
          other: "{{count}} seconds",
        },
        halfAMinute: "half a minute",
        lessThanXMinutes: {
          one: "less than a minute",
          other: "less than {{count}} minutes",
        },
        xMinutes: {
          one: "1 minute",
          other: "{{count}} minutes",
        },
        aboutXHours: {
          one: "about 1 hour",
          other: "about {{count}} hours",
        },
        xHours: {
          one: "1 hour",
          other: "{{count}} hours",
        },
        xDays: {
          one: "1 day",
          other: "{{count}} days",
        },
        aboutXWeeks: {
          one: "about 1 week",
          other: "about {{count}} weeks",
        },
        xWeeks: {
          one: "1 week",
          other: "{{count}} weeks",
        },
        aboutXMonths: {
          one: "about 1 month",
          other: "about {{count}} months",
        },
        xMonths: {
          one: "1 month",
          other: "{{count}} months",
        },
        aboutXYears: {
          one: "about 1 year",
          other: "about {{count}} years",
        },
        xYears: {
          one: "1 year",
          other: "{{count}} years",
        },
        overXYears: {
          one: "over 1 year",
          other: "over {{count}} years",
        },
        almostXYears: {
          one: "almost 1 year",
          other: "almost {{count}} years",
        },
      };
      var formatDistance = function (token, count, options) {
        var result;
        var tokenValue = formatDistanceLocale[token];
        if (typeof tokenValue === "string") {
          result = tokenValue;
        } else if (count === 1) {
          result = tokenValue.one;
        } else {
          result = tokenValue.other.replace("{{count}}", count.toString());
        }
        if (options !== null && options !== void 0 && options.addSuffix) {
          if (options.comparison && options.comparison > 0) {
            return "in " + result;
          } else {
            return result + " ago";
          }
        }
        return result;
      };
      var formatDistance$1 = formatDistance;
      function buildFormatLongFn(args) {
        return function () {
          var options =
            arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          var width = options.width ? String(options.width) : args.defaultWidth;
          var format = args.formats[width] || args.formats[args.defaultWidth];
          return format;
        };
      }
      var dateFormats = {
        full: "EEEE, MMMM do, y",
        long: "MMMM do, y",
        medium: "MMM d, y",
        short: "MM/dd/yyyy",
      };
      var timeFormats = {
        full: "h:mm:ss a zzzz",
        long: "h:mm:ss a z",
        medium: "h:mm:ss a",
        short: "h:mm a",
      };
      var dateTimeFormats = {
        full: "{{date}} 'at' {{time}}",
        long: "{{date}} 'at' {{time}}",
        medium: "{{date}}, {{time}}",
        short: "{{date}}, {{time}}",
      };
      var formatLong = {
        date: buildFormatLongFn({
          formats: dateFormats,
          defaultWidth: "full",
        }),
        time: buildFormatLongFn({
          formats: timeFormats,
          defaultWidth: "full",
        }),
        dateTime: buildFormatLongFn({
          formats: dateTimeFormats,
          defaultWidth: "full",
        }),
      };
      var formatLong$1 = formatLong;
      var formatRelativeLocale = {
        lastWeek: "'last' eeee 'at' p",
        yesterday: "'yesterday at' p",
        today: "'today at' p",
        tomorrow: "'tomorrow at' p",
        nextWeek: "eeee 'at' p",
        other: "P",
      };
      var formatRelative = function (token, _date, _baseDate, _options) {
        return formatRelativeLocale[token];
      };
      var formatRelative$1 = formatRelative;
      function buildLocalizeFn(args) {
        return function (dirtyIndex, dirtyOptions) {
          var options = dirtyOptions || {};
          var context = options.context
            ? String(options.context)
            : "standalone";
          var valuesArray;
          if (context === "formatting" && args.formattingValues) {
            var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
            var width = options.width ? String(options.width) : defaultWidth;
            valuesArray =
              args.formattingValues[width] ||
              args.formattingValues[defaultWidth];
          } else {
            var _defaultWidth = args.defaultWidth;
            var _width = options.width
              ? String(options.width)
              : args.defaultWidth;
            valuesArray = args.values[_width] || args.values[_defaultWidth];
          }
          var index = args.argumentCallback
            ? args.argumentCallback(dirtyIndex)
            : dirtyIndex;
          return valuesArray[index];
        };
      }
      var eraValues = {
        narrow: ["B", "A"],
        abbreviated: ["BC", "AD"],
        wide: ["Before Christ", "Anno Domini"],
      };
      var quarterValues = {
        narrow: ["1", "2", "3", "4"],
        abbreviated: ["Q1", "Q2", "Q3", "Q4"],
        wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
      };
      var monthValues = {
        narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
        abbreviated: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        wide: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
      };
      var dayValues = {
        narrow: ["S", "M", "T", "W", "T", "F", "S"],
        short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        wide: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      };
      var dayPeriodValues = {
        narrow: {
          am: "a",
          pm: "p",
          midnight: "mi",
          noon: "n",
          morning: "morning",
          afternoon: "afternoon",
          evening: "evening",
          night: "night",
        },
        abbreviated: {
          am: "AM",
          pm: "PM",
          midnight: "midnight",
          noon: "noon",
          morning: "morning",
          afternoon: "afternoon",
          evening: "evening",
          night: "night",
        },
        wide: {
          am: "a.m.",
          pm: "p.m.",
          midnight: "midnight",
          noon: "noon",
          morning: "morning",
          afternoon: "afternoon",
          evening: "evening",
          night: "night",
        },
      };
      var formattingDayPeriodValues = {
        narrow: {
          am: "a",
          pm: "p",
          midnight: "mi",
          noon: "n",
          morning: "in the morning",
          afternoon: "in the afternoon",
          evening: "in the evening",
          night: "at night",
        },
        abbreviated: {
          am: "AM",
          pm: "PM",
          midnight: "midnight",
          noon: "noon",
          morning: "in the morning",
          afternoon: "in the afternoon",
          evening: "in the evening",
          night: "at night",
        },
        wide: {
          am: "a.m.",
          pm: "p.m.",
          midnight: "midnight",
          noon: "noon",
          morning: "in the morning",
          afternoon: "in the afternoon",
          evening: "in the evening",
          night: "at night",
        },
      };
      var ordinalNumber = function (dirtyNumber, _options) {
        var number = Number(dirtyNumber);
        var rem100 = number % 100;
        if (rem100 > 20 || rem100 < 10) {
          switch (rem100 % 10) {
            case 1:
              return number + "st";
            case 2:
              return number + "nd";
            case 3:
              return number + "rd";
          }
        }
        return number + "th";
      };
      var localize = {
        ordinalNumber,
        era: buildLocalizeFn({
          values: eraValues,
          defaultWidth: "wide",
        }),
        quarter: buildLocalizeFn({
          values: quarterValues,
          defaultWidth: "wide",
          argumentCallback: function (quarter) {
            return quarter - 1;
          },
        }),
        month: buildLocalizeFn({
          values: monthValues,
          defaultWidth: "wide",
        }),
        day: buildLocalizeFn({
          values: dayValues,
          defaultWidth: "wide",
        }),
        dayPeriod: buildLocalizeFn({
          values: dayPeriodValues,
          defaultWidth: "wide",
          formattingValues: formattingDayPeriodValues,
          defaultFormattingWidth: "wide",
        }),
      };
      var localize$1 = localize;
      function buildMatchFn(args) {
        return function (string) {
          var options =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          var width = options.width;
          var matchPattern =
            (width && args.matchPatterns[width]) ||
            args.matchPatterns[args.defaultMatchWidth];
          var matchResult = string.match(matchPattern);
          if (!matchResult) {
            return null;
          }
          var matchedString = matchResult[0];
          var parsePatterns =
            (width && args.parsePatterns[width]) ||
            args.parsePatterns[args.defaultParseWidth];
          var key = Array.isArray(parsePatterns)
            ? findIndex(parsePatterns, function (pattern) {
                return pattern.test(matchedString);
              })
            : findKey(parsePatterns, function (pattern) {
                return pattern.test(matchedString);
              });
          var value;
          value = args.valueCallback ? args.valueCallback(key) : key;
          value = options.valueCallback ? options.valueCallback(value) : value;
          var rest = string.slice(matchedString.length);
          return {
            value,
            rest,
          };
        };
      }
      function findKey(object, predicate) {
        for (var key in object) {
          if (object.hasOwnProperty(key) && predicate(object[key])) {
            return key;
          }
        }
        return void 0;
      }
      function findIndex(array, predicate) {
        for (var key = 0; key < array.length; key++) {
          if (predicate(array[key])) {
            return key;
          }
        }
        return void 0;
      }
      function buildMatchPatternFn(args) {
        return function (string) {
          var options =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          var matchResult = string.match(args.matchPattern);
          if (!matchResult) return null;
          var matchedString = matchResult[0];
          var parseResult = string.match(args.parsePattern);
          if (!parseResult) return null;
          var value = args.valueCallback
            ? args.valueCallback(parseResult[0])
            : parseResult[0];
          value = options.valueCallback ? options.valueCallback(value) : value;
          var rest = string.slice(matchedString.length);
          return {
            value,
            rest,
          };
        };
      }
      var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
      var parseOrdinalNumberPattern = /\d+/i;
      var matchEraPatterns = {
        narrow: /^(b|a)/i,
        abbreviated:
          /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
        wide: /^(before christ|before common era|anno domini|common era)/i,
      };
      var parseEraPatterns = {
        any: [/^b/i, /^(a|c)/i],
      };
      var matchQuarterPatterns = {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](th|st|nd|rd)? quarter/i,
      };
      var parseQuarterPatterns = {
        any: [/1/i, /2/i, /3/i, /4/i],
      };
      var matchMonthPatterns = {
        narrow: /^[jfmasond]/i,
        abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
        wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      };
      var parseMonthPatterns = {
        narrow: [
          /^j/i,
          /^f/i,
          /^m/i,
          /^a/i,
          /^m/i,
          /^j/i,
          /^j/i,
          /^a/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
        any: [
          /^ja/i,
          /^f/i,
          /^mar/i,
          /^ap/i,
          /^may/i,
          /^jun/i,
          /^jul/i,
          /^au/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
      };
      var matchDayPatterns = {
        narrow: /^[smtwf]/i,
        short: /^(su|mo|tu|we|th|fr|sa)/i,
        abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
        wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
      };
      var parseDayPatterns = {
        narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
        any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
      };
      var matchDayPeriodPatterns = {
        narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
        any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
      };
      var parseDayPeriodPatterns = {
        any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^mi/i,
          noon: /^no/i,
          morning: /morning/i,
          afternoon: /afternoon/i,
          evening: /evening/i,
          night: /night/i,
        },
      };
      var match = {
        ordinalNumber: buildMatchPatternFn({
          matchPattern: matchOrdinalNumberPattern,
          parsePattern: parseOrdinalNumberPattern,
          valueCallback: function (value) {
            return parseInt(value, 10);
          },
        }),
        era: buildMatchFn({
          matchPatterns: matchEraPatterns,
          defaultMatchWidth: "wide",
          parsePatterns: parseEraPatterns,
          defaultParseWidth: "any",
        }),
        quarter: buildMatchFn({
          matchPatterns: matchQuarterPatterns,
          defaultMatchWidth: "wide",
          parsePatterns: parseQuarterPatterns,
          defaultParseWidth: "any",
          valueCallback: function (index) {
            return index + 1;
          },
        }),
        month: buildMatchFn({
          matchPatterns: matchMonthPatterns,
          defaultMatchWidth: "wide",
          parsePatterns: parseMonthPatterns,
          defaultParseWidth: "any",
        }),
        day: buildMatchFn({
          matchPatterns: matchDayPatterns,
          defaultMatchWidth: "wide",
          parsePatterns: parseDayPatterns,
          defaultParseWidth: "any",
        }),
        dayPeriod: buildMatchFn({
          matchPatterns: matchDayPeriodPatterns,
          defaultMatchWidth: "any",
          parsePatterns: parseDayPeriodPatterns,
          defaultParseWidth: "any",
        }),
      };
      var match$1 = match;
      var locale = {
        code: "en-US",
        formatDistance: formatDistance$1,
        formatLong: formatLong$1,
        formatRelative: formatRelative$1,
        localize: localize$1,
        match: match$1,
        options: {
          weekStartsOn: 0,
          firstWeekContainsDate: 1,
        },
      };
      var defaultLocale = /* unused pure expression or super */ null && locale;
      function toInteger(dirtyNumber) {
        if (
          dirtyNumber === null ||
          dirtyNumber === true ||
          dirtyNumber === false
        ) {
          return NaN;
        }
        var number = Number(dirtyNumber);
        if (isNaN(number)) {
          return number;
        }
        return number < 0 ? Math.ceil(number) : Math.floor(number);
      }
      function requiredArgs(required, args) {
        if (args.length < required) {
          throw new TypeError(
            required +
              " argument" +
              (required > 1 ? "s" : "") +
              " required, but only " +
              args.length +
              " present"
          );
        }
      }
      function toDate(argument) {
        requiredArgs(1, arguments);
        var argStr = Object.prototype.toString.call(argument);
        if (
          argument instanceof Date ||
          (typeof argument === "object" && argStr === "[object Date]")
        ) {
          return new Date(argument.getTime());
        } else if (
          typeof argument === "number" ||
          argStr === "[object Number]"
        ) {
          return new Date(argument);
        } else {
          if (
            (typeof argument === "string" || argStr === "[object String]") &&
            typeof console !== "undefined"
          ) {
            console.warn(
              "Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"
            );
            console.warn(new Error().stack);
          }
          return new Date(NaN);
        }
      }
      function addMilliseconds(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var timestamp = toDate(dirtyDate).getTime();
        var amount = toInteger(dirtyAmount);
        return new Date(timestamp + amount);
      }
      function subMilliseconds(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        return addMilliseconds(dirtyDate, -amount);
      }
      function just_validate_plugin_date_es_assign(target, dirtyObject) {
        if (target == null) {
          throw new TypeError(
            "assign requires that input parameter not be null or undefined"
          );
        }
        dirtyObject = dirtyObject || {};
        for (var property in dirtyObject) {
          if (Object.prototype.hasOwnProperty.call(dirtyObject, property)) {
            target[property] = dirtyObject[property];
          }
        }
        return target;
      }
      function dateLongFormatter(pattern, formatLong2) {
        switch (pattern) {
          case "P":
            return formatLong2.date({
              width: "short",
            });
          case "PP":
            return formatLong2.date({
              width: "medium",
            });
          case "PPP":
            return formatLong2.date({
              width: "long",
            });
          case "PPPP":
          default:
            return formatLong2.date({
              width: "full",
            });
        }
      }
      function timeLongFormatter(pattern, formatLong2) {
        switch (pattern) {
          case "p":
            return formatLong2.time({
              width: "short",
            });
          case "pp":
            return formatLong2.time({
              width: "medium",
            });
          case "ppp":
            return formatLong2.time({
              width: "long",
            });
          case "pppp":
          default:
            return formatLong2.time({
              width: "full",
            });
        }
      }
      function dateTimeLongFormatter(pattern, formatLong2) {
        var matchResult = pattern.match(/(P+)(p+)?/) || [];
        var datePattern = matchResult[1];
        var timePattern = matchResult[2];
        if (!timePattern) {
          return dateLongFormatter(pattern, formatLong2);
        }
        var dateTimeFormat;
        switch (datePattern) {
          case "P":
            dateTimeFormat = formatLong2.dateTime({
              width: "short",
            });
            break;
          case "PP":
            dateTimeFormat = formatLong2.dateTime({
              width: "medium",
            });
            break;
          case "PPP":
            dateTimeFormat = formatLong2.dateTime({
              width: "long",
            });
            break;
          case "PPPP":
          default:
            dateTimeFormat = formatLong2.dateTime({
              width: "full",
            });
            break;
        }
        return dateTimeFormat
          .replace("{{date}}", dateLongFormatter(datePattern, formatLong2))
          .replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
      }
      var longFormatters = {
        p: timeLongFormatter,
        P: dateTimeLongFormatter,
      };
      var longFormatters$1 =
        /* unused pure expression or super */ null && longFormatters;
      function getTimezoneOffsetInMilliseconds(date) {
        var utcDate = new Date(
          Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
          )
        );
        utcDate.setUTCFullYear(date.getFullYear());
        return date.getTime() - utcDate.getTime();
      }
      var protectedDayOfYearTokens =
        /* unused pure expression or super */ null && ["D", "DD"];
      var protectedWeekYearTokens =
        /* unused pure expression or super */ null && ["YY", "YYYY"];
      function isProtectedDayOfYearToken(token) {
        return protectedDayOfYearTokens.indexOf(token) !== -1;
      }
      function isProtectedWeekYearToken(token) {
        return protectedWeekYearTokens.indexOf(token) !== -1;
      }
      function throwProtectedError(token, format, input) {
        if (token === "YYYY") {
          throw new RangeError(
            "Use `yyyy` instead of `YYYY` (in `"
              .concat(format, "`) for formatting years to the input `")
              .concat(input, "`; see: https://git.io/fxCyr")
          );
        } else if (token === "YY") {
          throw new RangeError(
            "Use `yy` instead of `YY` (in `"
              .concat(format, "`) for formatting years to the input `")
              .concat(input, "`; see: https://git.io/fxCyr")
          );
        } else if (token === "D") {
          throw new RangeError(
            "Use `d` instead of `D` (in `"
              .concat(
                format,
                "`) for formatting days of the month to the input `"
              )
              .concat(input, "`; see: https://git.io/fxCyr")
          );
        } else if (token === "DD") {
          throw new RangeError(
            "Use `dd` instead of `DD` (in `"
              .concat(
                format,
                "`) for formatting days of the month to the input `"
              )
              .concat(input, "`; see: https://git.io/fxCyr")
          );
        }
      }
      function startOfUTCWeek(dirtyDate, dirtyOptions) {
        requiredArgs(1, arguments);
        var options = dirtyOptions || {};
        var locale2 = options.locale;
        var localeWeekStartsOn =
          locale2 && locale2.options && locale2.options.weekStartsOn;
        var defaultWeekStartsOn =
          localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
        var weekStartsOn =
          options.weekStartsOn == null
            ? defaultWeekStartsOn
            : toInteger(options.weekStartsOn);
        if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
          throw new RangeError(
            "weekStartsOn must be between 0 and 6 inclusively"
          );
        }
        var date = toDate(dirtyDate);
        var day = date.getUTCDay();
        var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
        date.setUTCDate(date.getUTCDate() - diff);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
      function getUTCWeekYear(dirtyDate, dirtyOptions) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        var year = date.getUTCFullYear();
        var options = dirtyOptions || {};
        var locale2 = options.locale;
        var localeFirstWeekContainsDate =
          locale2 && locale2.options && locale2.options.firstWeekContainsDate;
        var defaultFirstWeekContainsDate =
          localeFirstWeekContainsDate == null
            ? 1
            : toInteger(localeFirstWeekContainsDate);
        var firstWeekContainsDate =
          options.firstWeekContainsDate == null
            ? defaultFirstWeekContainsDate
            : toInteger(options.firstWeekContainsDate);
        if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
          throw new RangeError(
            "firstWeekContainsDate must be between 1 and 7 inclusively"
          );
        }
        var firstWeekOfNextYear = new Date(0);
        firstWeekOfNextYear.setUTCFullYear(year + 1, 0, firstWeekContainsDate);
        firstWeekOfNextYear.setUTCHours(0, 0, 0, 0);
        var startOfNextYear = startOfUTCWeek(firstWeekOfNextYear, dirtyOptions);
        var firstWeekOfThisYear = new Date(0);
        firstWeekOfThisYear.setUTCFullYear(year, 0, firstWeekContainsDate);
        firstWeekOfThisYear.setUTCHours(0, 0, 0, 0);
        var startOfThisYear = startOfUTCWeek(firstWeekOfThisYear, dirtyOptions);
        if (date.getTime() >= startOfNextYear.getTime()) {
          return year + 1;
        } else if (date.getTime() >= startOfThisYear.getTime()) {
          return year;
        } else {
          return year - 1;
        }
      }
      function setUTCDay(dirtyDate, dirtyDay, dirtyOptions) {
        requiredArgs(2, arguments);
        var options = dirtyOptions || {};
        var locale2 = options.locale;
        var localeWeekStartsOn =
          locale2 && locale2.options && locale2.options.weekStartsOn;
        var defaultWeekStartsOn =
          localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
        var weekStartsOn =
          options.weekStartsOn == null
            ? defaultWeekStartsOn
            : toInteger(options.weekStartsOn);
        if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
          throw new RangeError(
            "weekStartsOn must be between 0 and 6 inclusively"
          );
        }
        var date = toDate(dirtyDate);
        var day = toInteger(dirtyDay);
        var currentDay = date.getUTCDay();
        var remainder = day % 7;
        var dayIndex = (remainder + 7) % 7;
        var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
        date.setUTCDate(date.getUTCDate() + diff);
        return date;
      }
      function setUTCISODay(dirtyDate, dirtyDay) {
        requiredArgs(2, arguments);
        var day = toInteger(dirtyDay);
        if (day % 7 === 0) {
          day = day - 7;
        }
        var weekStartsOn = 1;
        var date = toDate(dirtyDate);
        var currentDay = date.getUTCDay();
        var remainder = day % 7;
        var dayIndex = (remainder + 7) % 7;
        var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
        date.setUTCDate(date.getUTCDate() + diff);
        return date;
      }
      function startOfUTCISOWeek(dirtyDate) {
        requiredArgs(1, arguments);
        var weekStartsOn = 1;
        var date = toDate(dirtyDate);
        var day = date.getUTCDay();
        var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
        date.setUTCDate(date.getUTCDate() - diff);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
      function getUTCISOWeekYear(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        var year = date.getUTCFullYear();
        var fourthOfJanuaryOfNextYear = new Date(0);
        fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
        fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
        var startOfNextYear = startOfUTCISOWeek(fourthOfJanuaryOfNextYear);
        var fourthOfJanuaryOfThisYear = new Date(0);
        fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
        fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
        var startOfThisYear = startOfUTCISOWeek(fourthOfJanuaryOfThisYear);
        if (date.getTime() >= startOfNextYear.getTime()) {
          return year + 1;
        } else if (date.getTime() >= startOfThisYear.getTime()) {
          return year;
        } else {
          return year - 1;
        }
      }
      function startOfUTCISOWeekYear(dirtyDate) {
        requiredArgs(1, arguments);
        var year = getUTCISOWeekYear(dirtyDate);
        var fourthOfJanuary = new Date(0);
        fourthOfJanuary.setUTCFullYear(year, 0, 4);
        fourthOfJanuary.setUTCHours(0, 0, 0, 0);
        var date = startOfUTCISOWeek(fourthOfJanuary);
        return date;
      }
      var MILLISECONDS_IN_WEEK$1 = 6048e5;
      function getUTCISOWeek(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        var diff =
          startOfUTCISOWeek(date).getTime() -
          startOfUTCISOWeekYear(date).getTime();
        return Math.round(diff / MILLISECONDS_IN_WEEK$1) + 1;
      }
      function setUTCISOWeek(dirtyDate, dirtyISOWeek) {
        requiredArgs(2, arguments);
        var date = toDate(dirtyDate);
        var isoWeek = toInteger(dirtyISOWeek);
        var diff = getUTCISOWeek(date) - isoWeek;
        date.setUTCDate(date.getUTCDate() - diff * 7);
        return date;
      }
      function startOfUTCWeekYear(dirtyDate, dirtyOptions) {
        requiredArgs(1, arguments);
        var options = dirtyOptions || {};
        var locale2 = options.locale;
        var localeFirstWeekContainsDate =
          locale2 && locale2.options && locale2.options.firstWeekContainsDate;
        var defaultFirstWeekContainsDate =
          localeFirstWeekContainsDate == null
            ? 1
            : toInteger(localeFirstWeekContainsDate);
        var firstWeekContainsDate =
          options.firstWeekContainsDate == null
            ? defaultFirstWeekContainsDate
            : toInteger(options.firstWeekContainsDate);
        var year = getUTCWeekYear(dirtyDate, dirtyOptions);
        var firstWeek = new Date(0);
        firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
        firstWeek.setUTCHours(0, 0, 0, 0);
        var date = startOfUTCWeek(firstWeek, dirtyOptions);
        return date;
      }
      var MILLISECONDS_IN_WEEK = 6048e5;
      function getUTCWeek(dirtyDate, options) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        var diff =
          startOfUTCWeek(date, options).getTime() -
          startOfUTCWeekYear(date, options).getTime();
        return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
      }
      function setUTCWeek(dirtyDate, dirtyWeek, options) {
        requiredArgs(2, arguments);
        var date = toDate(dirtyDate);
        var week = toInteger(dirtyWeek);
        var diff = getUTCWeek(date, options) - week;
        date.setUTCDate(date.getUTCDate() - diff * 7);
        return date;
      }
      var MILLISECONDS_IN_HOUR = 36e5;
      var MILLISECONDS_IN_MINUTE = 6e4;
      var MILLISECONDS_IN_SECOND = 1e3;
      var numericPatterns = {
        month: /^(1[0-2]|0?\d)/,
        date: /^(3[0-1]|[0-2]?\d)/,
        dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
        week: /^(5[0-3]|[0-4]?\d)/,
        hour23h: /^(2[0-3]|[0-1]?\d)/,
        hour24h: /^(2[0-4]|[0-1]?\d)/,
        hour11h: /^(1[0-1]|0?\d)/,
        hour12h: /^(1[0-2]|0?\d)/,
        minute: /^[0-5]?\d/,
        second: /^[0-5]?\d/,
        singleDigit: /^\d/,
        twoDigits: /^\d{1,2}/,
        threeDigits: /^\d{1,3}/,
        fourDigits: /^\d{1,4}/,
        anyDigitsSigned: /^-?\d+/,
        singleDigitSigned: /^-?\d/,
        twoDigitsSigned: /^-?\d{1,2}/,
        threeDigitsSigned: /^-?\d{1,3}/,
        fourDigitsSigned: /^-?\d{1,4}/,
      };
      var timezonePatterns = {
        basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
        basic: /^([+-])(\d{2})(\d{2})|Z/,
        basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
        extended: /^([+-])(\d{2}):(\d{2})|Z/,
        extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/,
      };
      function parseNumericPattern(pattern, string, valueCallback) {
        var matchResult = string.match(pattern);
        if (!matchResult) {
          return null;
        }
        var value = parseInt(matchResult[0], 10);
        return {
          value: valueCallback ? valueCallback(value) : value,
          rest: string.slice(matchResult[0].length),
        };
      }
      function parseTimezonePattern(pattern, string) {
        var matchResult = string.match(pattern);
        if (!matchResult) {
          return null;
        }
        if (matchResult[0] === "Z") {
          return {
            value: 0,
            rest: string.slice(1),
          };
        }
        var sign = matchResult[1] === "+" ? 1 : -1;
        var hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
        var minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
        var seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
        return {
          value:
            sign *
            (hours * MILLISECONDS_IN_HOUR +
              minutes * MILLISECONDS_IN_MINUTE +
              seconds * MILLISECONDS_IN_SECOND),
          rest: string.slice(matchResult[0].length),
        };
      }
      function parseAnyDigitsSigned(string, valueCallback) {
        return parseNumericPattern(
          numericPatterns.anyDigitsSigned,
          string,
          valueCallback
        );
      }
      function parseNDigits(n, string, valueCallback) {
        switch (n) {
          case 1:
            return parseNumericPattern(
              numericPatterns.singleDigit,
              string,
              valueCallback
            );
          case 2:
            return parseNumericPattern(
              numericPatterns.twoDigits,
              string,
              valueCallback
            );
          case 3:
            return parseNumericPattern(
              numericPatterns.threeDigits,
              string,
              valueCallback
            );
          case 4:
            return parseNumericPattern(
              numericPatterns.fourDigits,
              string,
              valueCallback
            );
          default:
            return parseNumericPattern(
              new RegExp("^\\d{1," + n + "}"),
              string,
              valueCallback
            );
        }
      }
      function parseNDigitsSigned(n, string, valueCallback) {
        switch (n) {
          case 1:
            return parseNumericPattern(
              numericPatterns.singleDigitSigned,
              string,
              valueCallback
            );
          case 2:
            return parseNumericPattern(
              numericPatterns.twoDigitsSigned,
              string,
              valueCallback
            );
          case 3:
            return parseNumericPattern(
              numericPatterns.threeDigitsSigned,
              string,
              valueCallback
            );
          case 4:
            return parseNumericPattern(
              numericPatterns.fourDigitsSigned,
              string,
              valueCallback
            );
          default:
            return parseNumericPattern(
              new RegExp("^-?\\d{1," + n + "}"),
              string,
              valueCallback
            );
        }
      }
      function dayPeriodEnumToHours(enumValue) {
        switch (enumValue) {
          case "morning":
            return 4;
          case "evening":
            return 17;
          case "pm":
          case "noon":
          case "afternoon":
            return 12;
          case "am":
          case "midnight":
          case "night":
          default:
            return 0;
        }
      }
      function normalizeTwoDigitYear(twoDigitYear, currentYear) {
        var isCommonEra = currentYear > 0;
        var absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
        var result;
        if (absCurrentYear <= 50) {
          result = twoDigitYear || 100;
        } else {
          var rangeEnd = absCurrentYear + 50;
          var rangeEndCentury = Math.floor(rangeEnd / 100) * 100;
          var isPreviousCentury = twoDigitYear >= rangeEnd % 100;
          result =
            twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
        }
        return isCommonEra ? result : 1 - result;
      }
      var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var DAYS_IN_MONTH_LEAP_YEAR = [
        31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
      ];
      function isLeapYearIndex(year) {
        return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
      }
      var parsers = {
        G: {
          priority: 140,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "G":
              case "GG":
              case "GGG":
                return (
                  match2.era(string, {
                    width: "abbreviated",
                  }) ||
                  match2.era(string, {
                    width: "narrow",
                  })
                );
              case "GGGGG":
                return match2.era(string, {
                  width: "narrow",
                });
              case "GGGG":
              default:
                return (
                  match2.era(string, {
                    width: "wide",
                  }) ||
                  match2.era(string, {
                    width: "abbreviated",
                  }) ||
                  match2.era(string, {
                    width: "narrow",
                  })
                );
            }
          },
          set: function (date, flags, value, _options) {
            flags.era = value;
            date.setUTCFullYear(value, 0, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["R", "u", "t", "T"],
        },
        y: {
          priority: 130,
          parse: function (string, token, match2, _options) {
            var valueCallback = function (year) {
              return {
                year,
                isTwoDigitYear: token === "yy",
              };
            };
            switch (token) {
              case "y":
                return parseNDigits(4, string, valueCallback);
              case "yo":
                return match2.ordinalNumber(string, {
                  unit: "year",
                  valueCallback,
                });
              default:
                return parseNDigits(token.length, string, valueCallback);
            }
          },
          validate: function (_date, value, _options) {
            return value.isTwoDigitYear || value.year > 0;
          },
          set: function (date, flags, value, _options) {
            var currentYear = date.getUTCFullYear();
            if (value.isTwoDigitYear) {
              var normalizedTwoDigitYear = normalizeTwoDigitYear(
                value.year,
                currentYear
              );
              date.setUTCFullYear(normalizedTwoDigitYear, 0, 1);
              date.setUTCHours(0, 0, 0, 0);
              return date;
            }
            var year =
              !("era" in flags) || flags.era === 1
                ? value.year
                : 1 - value.year;
            date.setUTCFullYear(year, 0, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "u",
            "w",
            "I",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        Y: {
          priority: 130,
          parse: function (string, token, match2, _options) {
            var valueCallback = function (year) {
              return {
                year,
                isTwoDigitYear: token === "YY",
              };
            };
            switch (token) {
              case "Y":
                return parseNDigits(4, string, valueCallback);
              case "Yo":
                return match2.ordinalNumber(string, {
                  unit: "year",
                  valueCallback,
                });
              default:
                return parseNDigits(token.length, string, valueCallback);
            }
          },
          validate: function (_date, value, _options) {
            return value.isTwoDigitYear || value.year > 0;
          },
          set: function (date, flags, value, options) {
            var currentYear = getUTCWeekYear(date, options);
            if (value.isTwoDigitYear) {
              var normalizedTwoDigitYear = normalizeTwoDigitYear(
                value.year,
                currentYear
              );
              date.setUTCFullYear(
                normalizedTwoDigitYear,
                0,
                options.firstWeekContainsDate
              );
              date.setUTCHours(0, 0, 0, 0);
              return startOfUTCWeek(date, options);
            }
            var year =
              !("era" in flags) || flags.era === 1
                ? value.year
                : 1 - value.year;
            date.setUTCFullYear(year, 0, options.firstWeekContainsDate);
            date.setUTCHours(0, 0, 0, 0);
            return startOfUTCWeek(date, options);
          },
          incompatibleTokens: [
            "y",
            "R",
            "u",
            "Q",
            "q",
            "M",
            "L",
            "I",
            "d",
            "D",
            "i",
            "t",
            "T",
          ],
        },
        R: {
          priority: 130,
          parse: function (string, token, _match, _options) {
            if (token === "R") {
              return parseNDigitsSigned(4, string);
            }
            return parseNDigitsSigned(token.length, string);
          },
          set: function (_date, _flags, value, _options) {
            var firstWeekOfYear = new Date(0);
            firstWeekOfYear.setUTCFullYear(value, 0, 4);
            firstWeekOfYear.setUTCHours(0, 0, 0, 0);
            return startOfUTCISOWeek(firstWeekOfYear);
          },
          incompatibleTokens: [
            "G",
            "y",
            "Y",
            "u",
            "Q",
            "q",
            "M",
            "L",
            "w",
            "d",
            "D",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        u: {
          priority: 130,
          parse: function (string, token, _match, _options) {
            if (token === "u") {
              return parseNDigitsSigned(4, string);
            }
            return parseNDigitsSigned(token.length, string);
          },
          set: function (date, _flags, value, _options) {
            date.setUTCFullYear(value, 0, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "G",
            "y",
            "Y",
            "R",
            "w",
            "I",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        Q: {
          priority: 120,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "Q":
              case "QQ":
                return parseNDigits(token.length, string);
              case "Qo":
                return match2.ordinalNumber(string, {
                  unit: "quarter",
                });
              case "QQQ":
                return (
                  match2.quarter(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.quarter(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "QQQQQ":
                return match2.quarter(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "QQQQ":
              default:
                return (
                  match2.quarter(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.quarter(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.quarter(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 4;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMonth((value - 1) * 3, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "q",
            "M",
            "L",
            "w",
            "I",
            "d",
            "D",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        q: {
          priority: 120,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "q":
              case "qq":
                return parseNDigits(token.length, string);
              case "qo":
                return match2.ordinalNumber(string, {
                  unit: "quarter",
                });
              case "qqq":
                return (
                  match2.quarter(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.quarter(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
              case "qqqqq":
                return match2.quarter(string, {
                  width: "narrow",
                  context: "standalone",
                });
              case "qqqq":
              default:
                return (
                  match2.quarter(string, {
                    width: "wide",
                    context: "standalone",
                  }) ||
                  match2.quarter(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.quarter(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 4;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMonth((value - 1) * 3, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "Q",
            "M",
            "L",
            "w",
            "I",
            "d",
            "D",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        M: {
          priority: 110,
          parse: function (string, token, match2, _options) {
            var valueCallback = function (value) {
              return value - 1;
            };
            switch (token) {
              case "M":
                return parseNumericPattern(
                  numericPatterns.month,
                  string,
                  valueCallback
                );
              case "MM":
                return parseNDigits(2, string, valueCallback);
              case "Mo":
                return match2.ordinalNumber(string, {
                  unit: "month",
                  valueCallback,
                });
              case "MMM":
                return (
                  match2.month(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.month(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "MMMMM":
                return match2.month(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "MMMM":
              default:
                return (
                  match2.month(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.month(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.month(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 11;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMonth(value, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "q",
            "Q",
            "L",
            "w",
            "I",
            "D",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        L: {
          priority: 110,
          parse: function (string, token, match2, _options) {
            var valueCallback = function (value) {
              return value - 1;
            };
            switch (token) {
              case "L":
                return parseNumericPattern(
                  numericPatterns.month,
                  string,
                  valueCallback
                );
              case "LL":
                return parseNDigits(2, string, valueCallback);
              case "Lo":
                return match2.ordinalNumber(string, {
                  unit: "month",
                  valueCallback,
                });
              case "LLL":
                return (
                  match2.month(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.month(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
              case "LLLLL":
                return match2.month(string, {
                  width: "narrow",
                  context: "standalone",
                });
              case "LLLL":
              default:
                return (
                  match2.month(string, {
                    width: "wide",
                    context: "standalone",
                  }) ||
                  match2.month(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.month(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 11;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMonth(value, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "q",
            "Q",
            "M",
            "w",
            "I",
            "D",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        w: {
          priority: 100,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "w":
                return parseNumericPattern(numericPatterns.week, string);
              case "wo":
                return match2.ordinalNumber(string, {
                  unit: "week",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 53;
          },
          set: function (date, _flags, value, options) {
            return startOfUTCWeek(setUTCWeek(date, value, options), options);
          },
          incompatibleTokens: [
            "y",
            "R",
            "u",
            "q",
            "Q",
            "M",
            "L",
            "I",
            "d",
            "D",
            "i",
            "t",
            "T",
          ],
        },
        I: {
          priority: 100,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "I":
                return parseNumericPattern(numericPatterns.week, string);
              case "Io":
                return match2.ordinalNumber(string, {
                  unit: "week",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 53;
          },
          set: function (date, _flags, value, options) {
            return startOfUTCISOWeek(
              setUTCISOWeek(date, value, options),
              options
            );
          },
          incompatibleTokens: [
            "y",
            "Y",
            "u",
            "q",
            "Q",
            "M",
            "L",
            "w",
            "d",
            "D",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        d: {
          priority: 90,
          subPriority: 1,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "d":
                return parseNumericPattern(numericPatterns.date, string);
              case "do":
                return match2.ordinalNumber(string, {
                  unit: "date",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (date, value, _options) {
            var year = date.getUTCFullYear();
            var isLeapYear = isLeapYearIndex(year);
            var month = date.getUTCMonth();
            if (isLeapYear) {
              return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
            } else {
              return value >= 1 && value <= DAYS_IN_MONTH[month];
            }
          },
          set: function (date, _flags, value, _options) {
            date.setUTCDate(value);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "q",
            "Q",
            "w",
            "I",
            "D",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        D: {
          priority: 90,
          subPriority: 1,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "D":
              case "DD":
                return parseNumericPattern(numericPatterns.dayOfYear, string);
              case "Do":
                return match2.ordinalNumber(string, {
                  unit: "date",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (date, value, _options) {
            var year = date.getUTCFullYear();
            var isLeapYear = isLeapYearIndex(year);
            if (isLeapYear) {
              return value >= 1 && value <= 366;
            } else {
              return value >= 1 && value <= 365;
            }
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMonth(0, value);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "Y",
            "R",
            "q",
            "Q",
            "M",
            "L",
            "w",
            "I",
            "d",
            "E",
            "i",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        E: {
          priority: 90,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "E":
              case "EE":
              case "EEE":
                return (
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "EEEEE":
                return match2.day(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "EEEEEE":
                return (
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "EEEE":
              default:
                return (
                  match2.day(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 6;
          },
          set: function (date, _flags, value, options) {
            date = setUTCDay(date, value, options);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["D", "i", "e", "c", "t", "T"],
        },
        e: {
          priority: 90,
          parse: function (string, token, match2, options) {
            var valueCallback = function (value) {
              var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
              return ((value + options.weekStartsOn + 6) % 7) + wholeWeekDays;
            };
            switch (token) {
              case "e":
              case "ee":
                return parseNDigits(token.length, string, valueCallback);
              case "eo":
                return match2.ordinalNumber(string, {
                  unit: "day",
                  valueCallback,
                });
              case "eee":
                return (
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "eeeee":
                return match2.day(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "eeeeee":
                return (
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "eeee":
              default:
                return (
                  match2.day(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 6;
          },
          set: function (date, _flags, value, options) {
            date = setUTCDay(date, value, options);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "y",
            "R",
            "u",
            "q",
            "Q",
            "M",
            "L",
            "I",
            "d",
            "D",
            "E",
            "i",
            "c",
            "t",
            "T",
          ],
        },
        c: {
          priority: 90,
          parse: function (string, token, match2, options) {
            var valueCallback = function (value) {
              var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
              return ((value + options.weekStartsOn + 6) % 7) + wholeWeekDays;
            };
            switch (token) {
              case "c":
              case "cc":
                return parseNDigits(token.length, string, valueCallback);
              case "co":
                return match2.ordinalNumber(string, {
                  unit: "day",
                  valueCallback,
                });
              case "ccc":
                return (
                  match2.day(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
              case "ccccc":
                return match2.day(string, {
                  width: "narrow",
                  context: "standalone",
                });
              case "cccccc":
                return (
                  match2.day(string, {
                    width: "short",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
              case "cccc":
              default:
                return (
                  match2.day(string, {
                    width: "wide",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "standalone",
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "standalone",
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 6;
          },
          set: function (date, _flags, value, options) {
            date = setUTCDay(date, value, options);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "y",
            "R",
            "u",
            "q",
            "Q",
            "M",
            "L",
            "I",
            "d",
            "D",
            "E",
            "i",
            "e",
            "t",
            "T",
          ],
        },
        i: {
          priority: 90,
          parse: function (string, token, match2, _options) {
            var valueCallback = function (value) {
              if (value === 0) {
                return 7;
              }
              return value;
            };
            switch (token) {
              case "i":
              case "ii":
                return parseNDigits(token.length, string);
              case "io":
                return match2.ordinalNumber(string, {
                  unit: "day",
                });
              case "iii":
                return (
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                    valueCallback,
                  })
                );
              case "iiiii":
                return match2.day(string, {
                  width: "narrow",
                  context: "formatting",
                  valueCallback,
                });
              case "iiiiii":
                return (
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                    valueCallback,
                  })
                );
              case "iiii":
              default:
                return (
                  match2.day(string, {
                    width: "wide",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "abbreviated",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "short",
                    context: "formatting",
                    valueCallback,
                  }) ||
                  match2.day(string, {
                    width: "narrow",
                    context: "formatting",
                    valueCallback,
                  })
                );
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 7;
          },
          set: function (date, _flags, value, options) {
            date = setUTCISODay(date, value, options);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          },
          incompatibleTokens: [
            "y",
            "Y",
            "u",
            "q",
            "Q",
            "M",
            "L",
            "w",
            "d",
            "D",
            "E",
            "e",
            "c",
            "t",
            "T",
          ],
        },
        a: {
          priority: 80,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "a":
              case "aa":
              case "aaa":
                return (
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "aaaaa":
                return match2.dayPeriod(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "aaaa":
              default:
                return (
                  match2.dayPeriod(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          set: function (date, _flags, value, _options) {
            date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["b", "B", "H", "k", "t", "T"],
        },
        b: {
          priority: 80,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "b":
              case "bb":
              case "bbb":
                return (
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "bbbbb":
                return match2.dayPeriod(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "bbbb":
              default:
                return (
                  match2.dayPeriod(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          set: function (date, _flags, value, _options) {
            date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["a", "B", "H", "k", "t", "T"],
        },
        B: {
          priority: 80,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "B":
              case "BB":
              case "BBB":
                return (
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
              case "BBBBB":
                return match2.dayPeriod(string, {
                  width: "narrow",
                  context: "formatting",
                });
              case "BBBB":
              default:
                return (
                  match2.dayPeriod(string, {
                    width: "wide",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  match2.dayPeriod(string, {
                    width: "narrow",
                    context: "formatting",
                  })
                );
            }
          },
          set: function (date, _flags, value, _options) {
            date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["a", "b", "t", "T"],
        },
        h: {
          priority: 70,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "h":
                return parseNumericPattern(numericPatterns.hour12h, string);
              case "ho":
                return match2.ordinalNumber(string, {
                  unit: "hour",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 12;
          },
          set: function (date, _flags, value, _options) {
            var isPM = date.getUTCHours() >= 12;
            if (isPM && value < 12) {
              date.setUTCHours(value + 12, 0, 0, 0);
            } else if (!isPM && value === 12) {
              date.setUTCHours(0, 0, 0, 0);
            } else {
              date.setUTCHours(value, 0, 0, 0);
            }
            return date;
          },
          incompatibleTokens: ["H", "K", "k", "t", "T"],
        },
        H: {
          priority: 70,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "H":
                return parseNumericPattern(numericPatterns.hour23h, string);
              case "Ho":
                return match2.ordinalNumber(string, {
                  unit: "hour",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 23;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCHours(value, 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["a", "b", "h", "K", "k", "t", "T"],
        },
        K: {
          priority: 70,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "K":
                return parseNumericPattern(numericPatterns.hour11h, string);
              case "Ko":
                return match2.ordinalNumber(string, {
                  unit: "hour",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 11;
          },
          set: function (date, _flags, value, _options) {
            var isPM = date.getUTCHours() >= 12;
            if (isPM && value < 12) {
              date.setUTCHours(value + 12, 0, 0, 0);
            } else {
              date.setUTCHours(value, 0, 0, 0);
            }
            return date;
          },
          incompatibleTokens: ["h", "H", "k", "t", "T"],
        },
        k: {
          priority: 70,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "k":
                return parseNumericPattern(numericPatterns.hour24h, string);
              case "ko":
                return match2.ordinalNumber(string, {
                  unit: "hour",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 1 && value <= 24;
          },
          set: function (date, _flags, value, _options) {
            var hours = value <= 24 ? value % 24 : value;
            date.setUTCHours(hours, 0, 0, 0);
            return date;
          },
          incompatibleTokens: ["a", "b", "h", "H", "K", "t", "T"],
        },
        m: {
          priority: 60,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "m":
                return parseNumericPattern(numericPatterns.minute, string);
              case "mo":
                return match2.ordinalNumber(string, {
                  unit: "minute",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 59;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMinutes(value, 0, 0);
            return date;
          },
          incompatibleTokens: ["t", "T"],
        },
        s: {
          priority: 50,
          parse: function (string, token, match2, _options) {
            switch (token) {
              case "s":
                return parseNumericPattern(numericPatterns.second, string);
              case "so":
                return match2.ordinalNumber(string, {
                  unit: "second",
                });
              default:
                return parseNDigits(token.length, string);
            }
          },
          validate: function (_date, value, _options) {
            return value >= 0 && value <= 59;
          },
          set: function (date, _flags, value, _options) {
            date.setUTCSeconds(value, 0);
            return date;
          },
          incompatibleTokens: ["t", "T"],
        },
        S: {
          priority: 30,
          parse: function (string, token, _match, _options) {
            var valueCallback = function (value) {
              return Math.floor(value * Math.pow(10, -token.length + 3));
            };
            return parseNDigits(token.length, string, valueCallback);
          },
          set: function (date, _flags, value, _options) {
            date.setUTCMilliseconds(value);
            return date;
          },
          incompatibleTokens: ["t", "T"],
        },
        X: {
          priority: 10,
          parse: function (string, token, _match, _options) {
            switch (token) {
              case "X":
                return parseTimezonePattern(
                  timezonePatterns.basicOptionalMinutes,
                  string
                );
              case "XX":
                return parseTimezonePattern(timezonePatterns.basic, string);
              case "XXXX":
                return parseTimezonePattern(
                  timezonePatterns.basicOptionalSeconds,
                  string
                );
              case "XXXXX":
                return parseTimezonePattern(
                  timezonePatterns.extendedOptionalSeconds,
                  string
                );
              case "XXX":
              default:
                return parseTimezonePattern(timezonePatterns.extended, string);
            }
          },
          set: function (date, flags, value, _options) {
            if (flags.timestampIsSet) {
              return date;
            }
            return new Date(date.getTime() - value);
          },
          incompatibleTokens: ["t", "T", "x"],
        },
        x: {
          priority: 10,
          parse: function (string, token, _match, _options) {
            switch (token) {
              case "x":
                return parseTimezonePattern(
                  timezonePatterns.basicOptionalMinutes,
                  string
                );
              case "xx":
                return parseTimezonePattern(timezonePatterns.basic, string);
              case "xxxx":
                return parseTimezonePattern(
                  timezonePatterns.basicOptionalSeconds,
                  string
                );
              case "xxxxx":
                return parseTimezonePattern(
                  timezonePatterns.extendedOptionalSeconds,
                  string
                );
              case "xxx":
              default:
                return parseTimezonePattern(timezonePatterns.extended, string);
            }
          },
          set: function (date, flags, value, _options) {
            if (flags.timestampIsSet) {
              return date;
            }
            return new Date(date.getTime() - value);
          },
          incompatibleTokens: ["t", "T", "X"],
        },
        t: {
          priority: 40,
          parse: function (string, _token, _match, _options) {
            return parseAnyDigitsSigned(string);
          },
          set: function (_date, _flags, value, _options) {
            return [
              new Date(value * 1e3),
              {
                timestampIsSet: true,
              },
            ];
          },
          incompatibleTokens: "*",
        },
        T: {
          priority: 20,
          parse: function (string, _token, _match, _options) {
            return parseAnyDigitsSigned(string);
          },
          set: function (_date, _flags, value, _options) {
            return [
              new Date(value),
              {
                timestampIsSet: true,
              },
            ];
          },
          incompatibleTokens: "*",
        },
      };
      var parsers$1 = /* unused pure expression or super */ null && parsers;
      var TIMEZONE_UNIT_PRIORITY = 10;
      var formattingTokensRegExp =
        /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
      var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
      var escapedStringRegExp = /^'([^]*?)'?$/;
      var doubleQuoteRegExp = /''/g;
      var notWhitespaceRegExp = /\S/;
      var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
      function parse(
        dirtyDateString,
        dirtyFormatString,
        dirtyReferenceDate,
        dirtyOptions
      ) {
        requiredArgs(3, arguments);
        var dateString = String(dirtyDateString);
        var formatString = String(dirtyFormatString);
        var options = dirtyOptions || {};
        var locale2 = options.locale || defaultLocale;
        if (!locale2.match) {
          throw new RangeError("locale must contain match property");
        }
        var localeFirstWeekContainsDate =
          locale2.options && locale2.options.firstWeekContainsDate;
        var defaultFirstWeekContainsDate =
          localeFirstWeekContainsDate == null
            ? 1
            : toInteger(localeFirstWeekContainsDate);
        var firstWeekContainsDate =
          options.firstWeekContainsDate == null
            ? defaultFirstWeekContainsDate
            : toInteger(options.firstWeekContainsDate);
        if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
          throw new RangeError(
            "firstWeekContainsDate must be between 1 and 7 inclusively"
          );
        }
        var localeWeekStartsOn =
          locale2.options && locale2.options.weekStartsOn;
        var defaultWeekStartsOn =
          localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
        var weekStartsOn =
          options.weekStartsOn == null
            ? defaultWeekStartsOn
            : toInteger(options.weekStartsOn);
        if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
          throw new RangeError(
            "weekStartsOn must be between 0 and 6 inclusively"
          );
        }
        if (formatString === "") {
          if (dateString === "") {
            return toDate(dirtyReferenceDate);
          } else {
            return new Date(NaN);
          }
        }
        var subFnOptions = {
          firstWeekContainsDate,
          weekStartsOn,
          locale: locale2,
        };
        var setters = [
          {
            priority: TIMEZONE_UNIT_PRIORITY,
            subPriority: -1,
            set: dateToSystemTimezone,
            index: 0,
          },
        ];
        var i;
        var tokens = formatString
          .match(longFormattingTokensRegExp)
          .map(function (substring) {
            var firstCharacter2 = substring[0];
            if (firstCharacter2 === "p" || firstCharacter2 === "P") {
              var longFormatter = longFormatters$1[firstCharacter2];
              return longFormatter(substring, locale2.formatLong, subFnOptions);
            }
            return substring;
          })
          .join("")
          .match(formattingTokensRegExp);
        var usedTokens = [];
        for (i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          if (
            !options.useAdditionalWeekYearTokens &&
            isProtectedWeekYearToken(token)
          ) {
            throwProtectedError(token, formatString, dirtyDateString);
          }
          if (
            !options.useAdditionalDayOfYearTokens &&
            isProtectedDayOfYearToken(token)
          ) {
            throwProtectedError(token, formatString, dirtyDateString);
          }
          var firstCharacter = token[0];
          var parser = parsers$1[firstCharacter];
          if (parser) {
            var incompatibleTokens = parser.incompatibleTokens;
            if (Array.isArray(incompatibleTokens)) {
              var incompatibleToken = void 0;
              for (var _i = 0; _i < usedTokens.length; _i++) {
                var usedToken = usedTokens[_i].token;
                if (
                  incompatibleTokens.indexOf(usedToken) !== -1 ||
                  usedToken === firstCharacter
                ) {
                  incompatibleToken = usedTokens[_i];
                  break;
                }
              }
              if (incompatibleToken) {
                throw new RangeError(
                  "The format string mustn't contain `"
                    .concat(incompatibleToken.fullToken, "` and `")
                    .concat(token, "` at the same time")
                );
              }
            } else if (parser.incompatibleTokens === "*" && usedTokens.length) {
              throw new RangeError(
                "The format string mustn't contain `".concat(
                  token,
                  "` and any other token at the same time"
                )
              );
            }
            usedTokens.push({
              token: firstCharacter,
              fullToken: token,
            });
            var parseResult = parser.parse(
              dateString,
              token,
              locale2.match,
              subFnOptions
            );
            if (!parseResult) {
              return new Date(NaN);
            }
            setters.push({
              priority: parser.priority,
              subPriority: parser.subPriority || 0,
              set: parser.set,
              validate: parser.validate,
              value: parseResult.value,
              index: setters.length,
            });
            dateString = parseResult.rest;
          } else {
            if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
              throw new RangeError(
                "Format string contains an unescaped latin alphabet character `" +
                  firstCharacter +
                  "`"
              );
            }
            if (token === "''") {
              token = "'";
            } else if (firstCharacter === "'") {
              token = cleanEscapedString(token);
            }
            if (dateString.indexOf(token) === 0) {
              dateString = dateString.slice(token.length);
            } else {
              return new Date(NaN);
            }
          }
        }
        if (dateString.length > 0 && notWhitespaceRegExp.test(dateString)) {
          return new Date(NaN);
        }
        var uniquePrioritySetters = setters
          .map(function (setter2) {
            return setter2.priority;
          })
          .sort(function (a, b) {
            return b - a;
          })
          .filter(function (priority, index, array) {
            return array.indexOf(priority) === index;
          })
          .map(function (priority) {
            return setters
              .filter(function (setter2) {
                return setter2.priority === priority;
              })
              .sort(function (a, b) {
                return b.subPriority - a.subPriority;
              });
          })
          .map(function (setterArray) {
            return setterArray[0];
          });
        var date = toDate(dirtyReferenceDate);
        if (isNaN(date)) {
          return new Date(NaN);
        }
        var utcDate = subMilliseconds(
          date,
          getTimezoneOffsetInMilliseconds(date)
        );
        var flags = {};
        for (i = 0; i < uniquePrioritySetters.length; i++) {
          var setter = uniquePrioritySetters[i];
          if (
            setter.validate &&
            !setter.validate(utcDate, setter.value, subFnOptions)
          ) {
            return new Date(NaN);
          }
          var result = setter.set(utcDate, flags, setter.value, subFnOptions);
          if (result[0]) {
            utcDate = result[0];
            just_validate_plugin_date_es_assign(flags, result[1]);
          } else {
            utcDate = result;
          }
        }
        return utcDate;
      }
      function dateToSystemTimezone(date, flags) {
        if (flags.timestampIsSet) {
          return date;
        }
        var convertedDate = new Date(0);
        convertedDate.setFullYear(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate()
        );
        convertedDate.setHours(
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds(),
          date.getUTCMilliseconds()
        );
        return convertedDate;
      }
      function cleanEscapedString(input) {
        return input
          .match(escapedStringRegExp)[1]
          .replace(doubleQuoteRegExp, "'");
      }
      function isDate(value) {
        requiredArgs(1, arguments);
        return (
          value instanceof Date ||
          (typeof value === "object" &&
            Object.prototype.toString.call(value) === "[object Date]")
        );
      }
      function isValid(dirtyDate) {
        requiredArgs(1, arguments);
        if (!isDate(dirtyDate) && typeof dirtyDate !== "number") {
          return false;
        }
        var date = toDate(dirtyDate);
        return !isNaN(Number(date));
      }
      function isMatch(dateString, formatString, options) {
        requiredArgs(2, arguments);
        return isValid(parse(dateString, formatString, new Date(), options));
      }
      function isAfter(dirtyDate, dirtyDateToCompare) {
        requiredArgs(2, arguments);
        var date = toDate(dirtyDate);
        var dateToCompare = toDate(dirtyDateToCompare);
        return date.getTime() > dateToCompare.getTime();
      }
      function isEqual(dirtyLeftDate, dirtyRightDate) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyLeftDate);
        var dateRight = toDate(dirtyRightDate);
        return dateLeft.getTime() === dateRight.getTime();
      }
      const getParsedDate = (value, format) => {
        return format ? parse(value, format, new Date()) : new Date(value);
      };
      const getComparedDate = (sourceDate, configValue, format) => {
        let comparedDate;
        if (isDate(configValue)) {
          comparedDate = configValue;
        } else if (typeof configValue === "string") {
          comparedDate = getParsedDate(configValue, format);
        }
        if (!isValid(comparedDate)) {
          return null;
        }
        if (!isValid(sourceDate)) {
          return null;
        }
        return comparedDate;
      };
      const checkIsEqual = (configValue, sourceDate, format) => {
        const comparedDate = getComparedDate(sourceDate, configValue, format);
        if (comparedDate === null) {
          return false;
        }
        return isEqual(comparedDate, sourceDate);
      };
      const checkIsBefore = (configValue, sourceDate, format) => {
        const comparedDate = getComparedDate(sourceDate, configValue, format);
        if (comparedDate === null) {
          return false;
        }
        return isAfter(comparedDate, sourceDate);
      };
      const checkIsBeforeOrEqual = (configValue, sourceDate, format) => {
        const comparedDate = getComparedDate(sourceDate, configValue, format);
        if (comparedDate === null) {
          return false;
        }
        return (
          isEqual(comparedDate, sourceDate) || isAfter(comparedDate, sourceDate)
        );
      };
      const checkIsAfter = (configValue, sourceDate, format) => {
        const comparedDate = getComparedDate(sourceDate, configValue, format);
        if (comparedDate === null) {
          return false;
        }
        return isAfter(sourceDate, comparedDate);
      };
      const checkIsAfterOrEqual = (configValue, sourceDate, format) => {
        const comparedDate = getComparedDate(sourceDate, configValue, format);
        if (comparedDate === null) {
          return false;
        }
        return (
          isEqual(comparedDate, sourceDate) || isAfter(sourceDate, comparedDate)
        );
      };
      const pluginDate = (func) => (value, fields) => {
        const config = func(fields);
        const valid = {
          format: true,
          isAfter: true,
          isBefore: true,
          required: true,
          isBeforeOrEqual: true,
          isAfterOrEqual: true,
          isEqual: true,
        };
        if (typeof value !== "string") {
          console.error(
            "Value should be a string! The result will be always invalid"
          );
          return false;
        }
        if (!config.required && value === "") {
          return true;
        }
        if (config.format !== void 0) {
          if (typeof config.format !== "string") {
            console.error(
              "Format field should be a string! The result will be always invalid"
            );
            valid.format = false;
          } else {
            valid.format = isMatch(value, config.format);
          }
        }
        const sourceDate = getParsedDate(value, config.format);
        if (config.isBefore !== void 0) {
          valid.isBefore = checkIsBefore(
            config.isBefore,
            sourceDate,
            config.format
          );
        }
        if (config.isBeforeOrEqual !== void 0) {
          valid.isBeforeOrEqual = checkIsBeforeOrEqual(
            config.isBeforeOrEqual,
            sourceDate,
            config.format
          );
        }
        if (config.isAfter !== void 0) {
          valid.isAfter = checkIsAfter(
            config.isAfter,
            sourceDate,
            config.format
          );
        }
        if (config.isAfterOrEqual !== void 0) {
          valid.isAfter = checkIsAfterOrEqual(
            config.isAfterOrEqual,
            sourceDate,
            config.format
          );
        }
        if (config.isEqual !== void 0) {
          valid.isEqual = checkIsEqual(
            config.isEqual,
            sourceDate,
            config.format
          );
        }
        return Object.values(valid).every((item) => item);
      }; // CONCATENATED MODULE: ./app/js/utility/formLanguage.js

      /* harmony default export */ const formLanguage = [
        {
          key: "Il campo è obbligatorio.",
          dict: {
            en: "Field is required.",
            es: "El campo es obligatorio.",
            fr: "Le champ est requis.",
            nl: "Het veld is verplicht.",
            de: "Das Feld ist obligatorisch.",
          },
        },
        {
          key: "Il campo non è valido.",
          dict: {
            en: "Field is invalid.",
            es: "Campo inválido.",
            fr: "Le champ est invalide.",
            nl: "Ongeldig veld.",
            de: "Das Feld ist ungültig.",
          },
        },
        {
          key: "Il campo non accetta numeri.",
          dict: {
            en: "Numbers are not allowed.",
            es: "El campo no acepta números.",
            fr: "Le champ n'accepte pas les nombres.",
            nl: "Het veld accepteert geen getallen.",
            de: "Das Feld akzeptiert keine Zahlen.",
          },
        },
        {
          key: "È necessario selezionare almeno un'opzione",
          dict: {
            en: "You should select at least one option",
            es: "Debe seleccionar al menos una opción",
            fr: "Vous devriez sélectionner au moins une option",
            nl: "Er moet ten minste één optie worden geselecteerd",
            de: "mindestens eine Option muss ausgewählt werden.",
          },
        },
        {
          key: "Il formato della data è il seguente dd/MM/yyyy (e.g. 20/12/2021)",
          dict: {
            en: "Date should be in dd/MM/yyyy format (e.g. 20/12/2021)",
            es: "Date should be in dd/MM/yyyy format (e.g. 20/12/2021)",
            fr: "Date should be in dd/MM/yyyy format (e.g. 20/12/2021)",
            fr: "Date should be in dd/MM/yyyy format (e.g. 20/12/2021)",
            de: "Das Datumsformat ist wie folgt: tt/MM/jjjj (z. B. 20/12/2021)",
          },
        },
        {
          key: "Formato non valido.",
          dict: {
            en: "Invalid format.",
            es: "Formato no válido.",
            fr: "Format non valide.",
            nl: "Ongeldig formaat.",
            de: "Ungültiges Format.",
          },
        },
        {
          key: "Deve contenere solo caratteri alfabetici. Non sono ammessi caratteri speciali o numerici.",
          dict: {
            en: "Must contain only alphabetical characters. Special characters or numbers are not allowed.",
            es: "Debe contener sólo caracteres alfabéticos. No se permiten caracteres especiales ni números.",
            fr: "Doit contenir uniquement des caractères alphabétiques. Les caractères spéciaux et les chiffres ne sont pas autorisés.",
            nl: "Moet alleen alfabetische tekens bevatten. Speciale tekens of nummers zijn niet toegestaan.",
            de: "Darf nur alphabetische Zeichen enthalten. Sonderzeichen oder Zahlen sind nicht erlaubt.",
          },
        },
        {
          key: "Deve contenere solo caratteri numerici. Non sono ammessi caratteri speciali o lettere",
          dict: {
            en: "It must contain only numeric characters. Special characters or letters are not allowed",
            es: "Sólo debe contener caracteres numéricos. No se admiten caracteres especiales ni letras",
            fr: "Il ne doit contenir que des caractères numériques. Les caractères spéciaux ou les lettres ne sont pas autorisés",
            nl: "Het mag alleen numerieke tekens bevatten. Speciale tekens of letters zijn niet toegestaan",
            de: "Er darf nur numerische Zeichen enthalten. Sonderzeichen oder Buchstaben sind nicht erlaubt.",
          },
        },
        {
          key: "Formato non valido (ex mario.rossi@gmail.com).",
          dict: {
            en: "Invalid format (ex mario.rossi@gmail.com).",
            es: "Formato no válido (ex mario.rossi@gmail.com).",
            fr: "Format non valide (ex mario.rossi@gmail.com).",
            nl: "Ongeldig formaat (ex mario.rossi@gmail.com).",
            de: "Ungültiges Format (z.B. mario.rossi@gmail.com).",
          },
        },
        {
          key: "Formato non valido. Deve contenere max 11 caratteri numerici.",
          dict: {
            en: "Invalid format. Must contain a maximum of 11 numeric characters.",
            es: "Formato no válido. Debe contener un máximo de 11 caracteres numéricos.",
            fr: "Format non valide. Doit contenir un maximum de 11 caractères numériques.",
            nl: "Ongeldig formaat. Moet maximaal 11 numerieke tekens bevatten.",
            de: "Ungültiges Format. Darf maximal 11 numerische Zeichen enthalten.",
          },
        },
        {
          key: "Formato non valido. Deve contenere max 5 caratteri numerici.",
          dict: {
            en: "Invalid format. Must contain max. 5 numeric characters.",
            es: "Formato no válido. Debe contener un máximo de 5 caracteres numéricos.",
            fr: "Format non valide. Doit contenir au maximum 5 caractères numériques.",
            nl: "Ongeldig formaat. Moet maximaal 5 numerieke tekens bevatten.",
            de: "Ungültiges Format. Darf maximal 5 numerische Zeichen enthalten.",
          },
        },
      ]; // CONCATENATED MODULE: ./app/js/utility/fieldsRegexList.js
      /* harmony default export */ const fieldsRegexList = {
        empty: {
          regex: /.*/gi,
          error_key: "Formato non valido.",
        },
        text: {
          regex: /^[A-Za-zÀ-ÖØ-öø-ÿ-]{1,250}$/gi,
          error_key:
            "Deve contenere solo caratteri alfabetici. Non sono ammessi caratteri speciali o numerici.",
        },
        number: {
          regex: /^\d{1,100}$/gi,
          error_key:
            "Deve contenere solo caratteri numerici. Non sono ammessi caratteri speciali o lettere",
        },
        first_name: {
          regex: /^([A-Za-zÀ-ÖØ-öø-ÿ-]{3,20}){1,4}?\s*$/gi,
          error_key:
            "Deve contenere solo caratteri alfabetici. Non sono ammessi caratteri speciali o numerici.",
        },
        last_name: {
          regex: /^(([A-Za-zÀ-ÖØ-öø-ÿ'’-]){2,20}){1,4}?\s*$/gi,
          error_key:
            "Deve contenere solo caratteri alfabetici. Non sono ammessi caratteri speciali o numerici.",
        },
        firstname_lastname: {
          regex:
            /^([A-Za-zÀ-ÖØ-öø-ÿ-]{3,20})(\s{1,}(([A-Za-zÀ-ÖØ-öø-ÿ'’-]){2,20})){1,4}?\s*$/gi,
          error_key:
            "Deve contenere solo caratteri alfabetici. Non sono ammessi caratteri speciali o numerici.",
        },
        // 'firstname_lastname':{
        //   regex:  /^([\p{L}]+(?:\s+[\p{L}]+)*)(?:\s+)([\p{L}]+(?:\s+[\p{L}]+)*)$/gi,
        //   error_key: "Formato non valido."
        // },
        email: {
          regex:
            /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])){1,}$/gi,
          error_key: "Formato non valido (ex mario.rossi@gmail.com).",
        },
        phone: {
          regex: /^(?:\+39|0039|039|39)?3\d{9,11}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        phone_es: {
          regex: /^(?:\+34|0034|034|34)?(6|7)\d{8,11}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        phone_nl: {
          regex: /^(?:\+32|0032|032|32)?4[6-9]\d{7,11}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        phone_it: {
          regex: /^(?:\+39|0039|039|39)?3\d{9,11}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        home_phone_it: {
          regex: /^0\d{1,3}[- ]?\d{5,10}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        all_phone_it: {
          regex: /^(?:\+39|0039|039|39)?3\d{9,11}$|^0\d{1,3}[- ]?\d{5,10}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 11 caratteri numerici.",
        },
        simple_zipcode: {
          regex: /^\d{5}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 5 caratteri numerici.",
        },
        postcode: {
          regex: /^\d{5}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 5 caratteri numerici.",
        },
        zipcode: {
          regex: /^\d{5}$/gi,
          error_key:
            "Formato non valido. Deve contenere max 5 caratteri numerici.",
        },
        google_address: {
          regex: /.*/gi,
          error_key: "Formato non valido.",
        },
        //   address:{
        //   regex:  /^(?i)(Via|Viale|Piazza|Piazzale|Corso|Largo|Vicolo|Borgo|Strada|Contrada|Rampa|Ponte|Passaggio|Salita|Discesa|Scalette|Traversa|Cavalcavia|Rotonda|Passeggiata)\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)$/gi,
        //   error_key: "Formato non valido."
        // },
        calendar: {
          regex: /^\d{2,4}[\/|\-]\d{2,4}[\/|\-]\d{2,4}$/gi,
          error_key: "Formato non valido.",
        },
        date: {
          regex: /^(0[1-9]|[12][0-9]|3[01])[-,\/](0[1-9]|1[0-2])[-,\/]\d{4}$/gi,
          error_key: "Formato non valido.",
        },
      }; // CONCATENATED MODULE: ./app/js/utility/form.js
      const FORM_INPUT_VALIDATION_TEL_TYPE = [
        "phone",
        "phone_es",
        "phone_nl",
        "phone_it",
        "home_phone_it",
        "all_phone_it",
        "simple_zipcode",
        "postcode",
        "zipcode",
      ];
      const FormHandler = (function () {
        let functionEventHandlers = [];
        let validation = null;
        let FormSubmitEvent = null;
        let formFailSubmitEvent = null;
        let currentFormId = null;
        let retryCount = 0;

        let init = (language = "it", form_id, failRetryCount = 3) => {
          currentFormId = "hej_form_" + form_id;
          retryCount = failRetryCount;
          validation = new JustValidate(
            "#" + currentFormId,
            {
              validateBeforeSubmitting: true,
            },
            formLanguage
          );
          validation.onSuccess(submitForm); // validation.onFail(onFailSubmit);

          FormSubmitEvent = new CustomEvent("formsubmit", {
            bubbles: true,
            detail: {
              text: () => "submit del form",
            },
          });
          formFailSubmitEvent = new CustomEvent("formFailSubmit", {
            bubbles: true,
            detail: {
              text: () => "submit del form with fail",
            },
          });
          validation.setCurrentLocale(language);
        };

        let addValidationFields = (elements) => {
          let validationElements = createIdToBind(elements);
          validationElements.forEach((element) => {
            if (!element) return;

            if (element.type == "group") {
              validation.addRequiredGroup(
                element.id,
                "You should select at least one option" // {
                //   errorsContainer: element.id_container,
                // }
              );
            } else if (element.type != "readonly") {
              validation.addField(element.id, element.rules, {
                errorsContainer: element.id_container,
              });
            }

            console.log("validation " + validation);
          });
        };

        let addValidationField = (element) => {
          validation.addField(
            `#${element.type}_${element.subtype}_${element._id}`,
            [
              {
                rule: "required",
                errorMessage: "Il campo è obbligatorio.",
              },
            ],
            {
              errorsContainer: `#${element.type}_${element.subtype}_${element._id}_error_container`,
            }
          );
        };

        let createIdToBind = (elements) => {
          let validationObject = null;
          let validationElements = elements.map((element) => {
            if (element.type == "readonly") return;
            validationObject = {
              id:
                element.subtype == "radio" ||
                (element.subtype == "checkbox" && element.attributes.multiple)
                  ? `#div_${element.subtype}_group_${element.group_id}`
                  : `#${element.type}_${element.subtype}_${element._id}`,
              id_container: `#${element.type}_${element.subtype}_${element._id}_error_container`,
              type:
                element.subtype == "radio" ||
                (element.subtype == "checkbox" && element.attributes.multiple)
                  ? "group"
                  : "single",
              rules: [],
            };

            if (fieldsRegexList[element.validation.type]) {
              validationObject.rules.push({
                rule: "customRegexp",
                value: fieldsRegexList[element.validation.type].regex,
                errorMessage:
                  fieldsRegexList[element.validation.type].error_key,
              });
            } else {
              validationObject.rules.push({
                rule: "customRegexp",
                value: new RegExp(element.validation.value, "gi"),
                errorMessage: "Il campo non è valido.",
              });
            } // else if (element.validation.type == "email") {
            //   validationObject.rules.push({
            //     rule: "email",
            //     errorMessage: "Il campo non è valido.",
            //   });
            // }

            if (element.attributes.required) {
              validationObject.rules.push({
                rule: "required",
                errorMessage: "Il campo è obbligatorio.",
              });

              if (
                FORM_INPUT_VALIDATION_TEL_TYPE.includes(
                  element.validation.type
                ) ||
                element.validation.type == "number"
              ) {
                validationObject.rules.push({
                  rule: "number",
                  errorMessage: "Il campo non è valido.",
                });
              }

              if (element.validation.type == "email") {
                validationObject.rules.push({
                  rule: "email",
                  errorMessage: "Il campo non è valido.",
                });
              } // else if(element.subtype == "date_custom"){
              //   validationObject.rules.push({
              //     plugin: JustValidatePluginDate(() => ({
              //       format: 'dd/MM/yyyy',
              //     })),
              //     errorMessage: 'Date should be in dd/MM/yyyy format (e.g. 20/12/2021)',
              //   });
              // }
            } else {
              validationObject.rules.push({
                rule: "customRegexp",
                value: /^$|/gi,
                errorMessage: "Il campo non è valido.",
              });
            }

            if (
              element.error &&
              element.error.flag &&
              element.error.regex.length > 0
            ) {
              element.error.regex.forEach((reg, index) => {
                validationObject.rules.push({
                  rule: "customRegexp",
                  value: new RegExp(reg.regex, "gi"),
                  errorMessage: reg.error_text,
                });
              });
            }

            return validationObject;
          });
          console.log("validationElements ", validationElements);
          let resArray = [];
          validationElements = validationElements.filter((el) => el != null);
          validationElements.filter(function (item) {
            let i = resArray.findIndex((x) => x.id == item.id);

            if (i <= -1) {
              resArray.push(item);
            }

            return;
          });
          console.log("validationElements ", resArray);
          return resArray;
        };

        let setupCustomEventListener = (obj) => {
          if (obj.type == "date_custom") {
            DisableInputButton(true); // obj.content.addEventListener("keypress", functionEventHandlers[0] = (e) => eventKeyPressCustomDate(e, obj.content));

            obj.content.addEventListener(
              "keydown",
              (functionEventHandlers[0] = (e) =>
                eventKeydownCustomDate(e, obj.content))
            ); // obj.content.addEventListener("keyup",  functionEventHandlers[1] = (e) => eventKeyUpCustomDate(e, obj.content));
          }
        };

        let removeCustomEventListener = (obj) => {
          if (obj.type == "date_custom") {
            // obj.content.removeEventListener("keypress", functionEventHandlers[0]);
            obj.content.removeEventListener(
              "keydown",
              functionEventHandlers[0]
            ); // obj.content.removeEventListener("keyup",functionEventHandlers[1]);
          }
        };

        let submitForm = () => {
          console.log("form submitted");
          let form = document.getElementById(currentFormId);
          let formHtmlElements = [...form.elements];
          formHtmlElements = formHtmlElements.filter(
            (elem) => elem.type != "fieldset"
          );
          console.log("form html elements ", form.elements);
          console.log("form html elements filtered ", formHtmlElements);
          let formJsonElements = CommonHandler.getCustomObject();
          console.log("form json elements ", formJsonElements);
          getFormFieldValue(formHtmlElements);
          form.dispatchEvent(FormSubmitEvent);
        };

        let onFailSubmit = () => {
          console.log("on fail submit");
          let form = document.getElementById(currentFormId);
          retryCount--;

          if (retryCount == 0) {
            form.dispatchEvent(formFailSubmitEvent);
          }
        };

        let getFormFieldValue = (formHtmlElements) => {
          let formJsonElements = CommonHandler.getCustomObject();
          console.log("form json elements ", formJsonElements);

          for (var i = 0; i < formHtmlElements.length; i++) {
            let groupIndex = formJsonElements.groups.findIndex(
              (elem) => elem._id == formHtmlElements[i].dataset.groupid
            );

            if (groupIndex > -1) {
              let elementIndex = formJsonElements.groups[
                groupIndex
              ].elements.findIndex(
                (elem) => elem._id == formHtmlElements[i].dataset.elementid
              );

              if (elementIndex > -1) {
                switch (formHtmlElements[i].type) {
                  case "checkbox":
                  case "radio":
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].info.checked = formHtmlElements[i].checked;

                    if (formHtmlElements[i].checked) {
                      formJsonElements.groups[groupIndex].elements[
                        elementIndex
                      ].save_field.profile.value =
                        formJsonElements.groups[groupIndex].elements[
                          elementIndex
                        ].mapping.profile.value;
                      formJsonElements.groups[groupIndex].elements[
                        elementIndex
                      ].save_field.form.value =
                        formJsonElements.groups[groupIndex].elements[
                          elementIndex
                        ].mapping.form.value;
                    } else {
                      // formJsonElements.groups[groupIndex].elements[elementIndex].save_field.profile.value = formJsonElements.groups[groupIndex].elements[elementIndex].mapping.profile.value_default;
                      // formJsonElements.groups[groupIndex].elements[elementIndex].save_field.form.value = formJsonElements.groups[groupIndex].elements[elementIndex].mapping.form.value_default;
                      formJsonElements.groups[groupIndex].elements[
                        elementIndex
                      ].save_field.profile.value = "";
                      formJsonElements.groups[groupIndex].elements[
                        elementIndex
                      ].save_field.form.value = "";
                    }

                    break;

                  case "select-one":
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].info.selected_text =
                      formHtmlElements[i].options[
                        formHtmlElements[i].selectedIndex
                      ].text;
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].info.selected_index = formHtmlElements[i].selectedIndex;
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].save_field.profile.value = formHtmlElements[i].value;
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].save_field.form.value = formHtmlElements[i].value;
                    break;

                  default:
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].save_field.profile.value = formHtmlElements[i].value;
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].save_field.form.value = formHtmlElements[i].value;
                    formJsonElements.groups[groupIndex].elements[
                      elementIndex
                    ].info.text = formHtmlElements[i].value;
                    break;
                }
              }
            }
          }
        };

        let destroy = () => {
          //remove all just-validate event listeners/errors/messages/styles/classes.
          validation.destroy();
        };

        let disableForm = (value) => {
          let form = document.getElementById(currentFormId);

          for (const element of form.elements) {
            console.log(element);
            element.setAttribute("disabled", value);
          }

          let submit_buttons = document.querySelectorAll(
            "button[type='submit']"
          );
          submit_buttons.forEach((button) => {
            button.disabled = true;
            button.style.display = "none";
          });
        };

        let setErrors = () => {
          // loop over elements and fill field
          validation.revalidate();
        };

        return {
          init,
          addValidationFields,
          addValidationField,
          removeCustomEventListener,
          setupCustomEventListener,
          destroy,
          disableForm,
          setErrors,
        };
      })(); // CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/native.js
      const randomUUID =
        typeof crypto !== "undefined" &&
        crypto.randomUUID &&
        crypto.randomUUID.bind(crypto);
      /* harmony default export */ const esm_browser_native = {
        randomUUID,
      }; // CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/rng.js
      // Unique ID creation requires a high quality random # generator. In the browser we therefore
      // require the crypto API and do not support built-in fallback to lower quality random number
      // generators (like Math.random()).
      let getRandomValues;
      const rnds8 = new Uint8Array(16);
      function rng() {
        // lazy load so that environments that need to polyfill have a chance to do so
        if (!getRandomValues) {
          // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
          getRandomValues =
            typeof crypto !== "undefined" &&
            crypto.getRandomValues &&
            crypto.getRandomValues.bind(crypto);

          if (!getRandomValues) {
            throw new Error(
              "crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported"
            );
          }
        }

        return getRandomValues(rnds8);
      } // CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/stringify.js
      /**
       * Convert array of 16 byte values to UUID string format of the form:
       * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
       */

      const byteToHex = [];

      for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).slice(1));
      }

      function unsafeStringify(arr, offset = 0) {
        // Note: Be careful editing this code!  It's been tuned for performance
        // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
        return (
          byteToHex[arr[offset + 0]] +
          byteToHex[arr[offset + 1]] +
          byteToHex[arr[offset + 2]] +
          byteToHex[arr[offset + 3]] +
          "-" +
          byteToHex[arr[offset + 4]] +
          byteToHex[arr[offset + 5]] +
          "-" +
          byteToHex[arr[offset + 6]] +
          byteToHex[arr[offset + 7]] +
          "-" +
          byteToHex[arr[offset + 8]] +
          byteToHex[arr[offset + 9]] +
          "-" +
          byteToHex[arr[offset + 10]] +
          byteToHex[arr[offset + 11]] +
          byteToHex[arr[offset + 12]] +
          byteToHex[arr[offset + 13]] +
          byteToHex[arr[offset + 14]] +
          byteToHex[arr[offset + 15]]
        ).toLowerCase();
      }

      function stringify(arr, offset = 0) {
        const uuid = unsafeStringify(arr, offset); // Consistency check for valid UUID.  If this throws, it's likely due to one
        // of the following:
        // - One or more input array values don't map to a hex octet (leading to
        // "undefined" in the uuid)
        // - Invalid input values for the RFC `version` or `variant` fields

        if (!validate(uuid)) {
          throw TypeError("Stringified UUID is invalid");
        }

        return uuid;
      }

      /* harmony default export */ const esm_browser_stringify =
        /* unused pure expression or super */ null && stringify; // CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/v4.js
      function v4(options, buf, offset) {
        if (esm_browser_native.randomUUID && !buf && !options) {
          return esm_browser_native.randomUUID();
        }

        options = options || {};
        const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80; // Copy bytes to buffer, if provided

        if (buf) {
          offset = offset || 0;

          for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
          }

          return buf;
        }

        return unsafeStringify(rnds);
      }

      /* harmony default export */ const esm_browser_v4 = v4; // CONCATENATED MODULE: ./app/js/utility/swipe.js
      const SwipeController = (function () {
        let animating = false; // let cardsCounter = 1;
        // let numOfCards = 6;

        let decisionVal = 80;
        let pullDeltaX = 0;
        let deg = 0;
        let cards, card, cardReject, cardLike;
        let startX;
        let evt;
        let finalDirection = null;
        let medium = "widget";

        let init = (element, opts) => {
          if (opts && opts.medium) {
            medium = opts.medium;
          } // create event for swipe finish

          evt = new Event("swipeCompleted", {
            bubbles: true,
          });
          CommonHandler.addEvent(evt, "swipeCompleted");
          element.addEventListener("touchstart", touchStart);
          element.addEventListener("touchmove", touchMove);
          element.addEventListener("touchend", touchEnd);
        };

        function pullChange() {
          animating = true; // console.log("pullDeltaX" , pullDeltaX);

          deg = pullDeltaX / 10;
          card.style.transform =
            "translateX(" + pullDeltaX + "px) rotate(" + deg + "deg)";
          let opacity = pullDeltaX / 100;
          let rejectOpacity = opacity >= 0 ? 0 : Math.abs(opacity);
          let likeOpacity = opacity <= 0 ? 0 : opacity;
          cardReject.style.opacity = rejectOpacity;
          cardLike.style.opacity = likeOpacity;
        }

        let controlledRelease = (elem, direction) => {
          finalDirection = direction;
          setTimeout(function () {
            elem.style = "";
            let choices = elem.querySelectorAll(".swipe__card__choice");
            choices.forEach((choice) => (choice.style = ""));
            elem.classList.add(
              `${direction == "left_swipe" ? "leftWin" : "rightWin"}`
            );
            elem.removeEventListener("touchmove", touchMove);
            elem.removeEventListener("touchend", touchEnd);
          }, 300);
          setTimeout(function () {
            finishSwipe();
          }, 500);
        };

        function release() {
          if (pullDeltaX >= decisionVal) {
            card.classList.add("to-right");
            finalDirection = "right_swipe";
          } else if (pullDeltaX <= -decisionVal) {
            card.classList.add("to-left");
            finalDirection = "left_swipe";
          }

          if (Math.abs(pullDeltaX) >= decisionVal) {
            card.classList.add("inactive");
            setTimeout(function () {
              // card.classList.add("below");
              card.removeEventListener("touchmove", touchMove);
              card.removeEventListener("touchend", touchEnd);
              card.classList.remove("inactive", "to-left", "to-right");
              card.classList.add(
                `${pullDeltaX >= decisionVal ? "rightWin" : "leftWin"}`
              );
              let swipe_button_choice = document.querySelector(
                ".swipe_button_choice:last-of-type"
              );
              swipe_button_choice.style.pointerEvents = "none";

              if (medium == "widget") {
                swipe_button_choice.style.visibility = "hidden";
              } else {
                swipe_button_choice.style.display = "none";
              }
            }, 200);
            setTimeout(function () {
              finishSwipe();
            }, 500);
          }

          if (Math.abs(pullDeltaX) < decisionVal) {
            card.classList.add("reset");
          }

          setTimeout(function () {
            card.style = "";
            card.classList.remove("reset");
            let choices = card.querySelectorAll(".swipe__card__choice");
            choices.forEach((choice) => (choice.style = ""));
            pullDeltaX = 0;
            animating = false;
          }, 300);
        }

        function touchStart(e) {
          if (animating) return;
          card = e.currentTarget;
          cardReject = card.querySelector(".swipe__card__choice.m--reject");
          cardLike = card.querySelector(".swipe__card__choice.m--like");
          startX = e.pageX || e.touches[0].pageX;
        }

        function touchMove(e) {
          let x = e.pageX || e.touches[0].pageX;
          pullDeltaX = x - startX;
          if (!pullDeltaX) return;
          pullChange();
        }

        function touchEnd(e) {
          // e.currentTarget.removeEventListener("touchmove", touchMove );
          // e.currentTarget.removeEventListener("touchend",touchEnd );
          if (!pullDeltaX) return;
          release();
        }

        let finishSwipe = () => {
          console.log("finish swipe");
          console.log("Collect data");
          console.log("Dispatch event");
          let infoObject = CommonHandler.getCustomObject();
          console.log("info swipe Object ", infoObject);
          let correctMapping =
            infoObject.groups[0].interactions[0].info &&
            infoObject.groups[0].interactions[0].info.mapping
              ? infoObject.groups[0].interactions[0].info.mapping.find(
                  (obj) => obj.label == finalDirection
                )
              : undefined;

          if (infoObject.groups[0].interactions[0].info) {
            infoObject.groups[0].interactions[0].info.save_field =
              correctMapping;
          } // delete infoObject.save_field.label;

          CommonHandler.dispachEvent(undefined, "swipeCompleted");
        };

        return {
          init,
          finishSwipe,
          controlledRelease,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/render.js
      var FileSaver = __webpack_require__(162);

      const render_FORM_INPUT_VALIDATION_TEL_TYPE = [
        "phone",
        "phone_es",
        "phone_nl",
        "phone_it",
        "home_phone_it",
        "all_phone_it",
        "simple_zipcode",
        "postcode",
        "zipcode",
      ];
      const Render = (function () {
        // Crea animazione typing dot
        let createTypingLoader = (DOMreference) => {
          let span_avatar = DOMreference.document.createElement("span");
          span_avatar.classList.add("bot_avatar");
          let span_text = DOMreference.document.createElement("span");
          span_text.classList.add("chatbot__message__text");
          let div_loading = DOMreference.document.createElement("div");
          div_loading.classList.add("typing");
          div_loading.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
          span_text.appendChild(div_loading);
          return {
            bot_avatar: span_avatar,
            loading_message: span_text,
          };
        }; // creo contenuto testuale

        let createTextContent = (message_owner, message, DOMreference) => {
          if (message_owner == "bot") {
            //check if message contain script
            const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;
            let found = message.content.match(regex);

            if (found) {
              let scriptContent = CommonHandler.stripHtml(found);
              message.content = message.content.replace(
                /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
                ""
              );
              let scriptElement = document.createElement("script");
              scriptElement.type = "text/javascript";
              scriptElement.textContent = scriptContent;
              document
                .getElementsByTagName("body")[0]
                .appendChild(scriptElement);
            }
          }

          let span_text = DOMreference.document.createElement("span");
          span_text.classList.add("chatbot__message__text");

          if (message_owner == "bot") {
            span_text.classList.add("is-loading");
            span_text.classList.add("is-hidden");
          }

          if (message_owner == "user" && message.img) {
            let img = DOMreference.document.createElement("img");
            img.src = message.img;
            span_text.appendChild(img);
          }

          let text_content = DOMreference.document.createElement("span");
          text_content.innerHTML = message.content;
          span_text.appendChild(text_content);
          return {
            content_message: span_text,
            text_content: text_content,
            message_type: message.type,
            speech: message.speech,
            delay: message.delay,
          };
        }; // creo contenuto immagine

        let createImageContent = (message, DOMreference) => {
          let span_image = DOMreference.document.createElement("span");
          span_image.style.width = "100%";
          span_image.classList.add("chatbot__message__text");
          span_image.classList.add("is-loading");
          span_image.classList.add("is-hidden");
          let img = DOMreference.document.createElement("img");
          img.classList.add("chatbot__message__img");
          img.src = message.content;
          img.alt = "media immagine";
          span_image.appendChild(img);
          return {
            content_message: span_image,
            text_content: img,
            message_type: "image",
            delay: message.delay,
          };
        }; // creo contenuto video

        let createVideoContent = (message, DOMreference) => {
          let span_video = DOMreference.document.createElement("span");
          span_video.style.width = "100%";
          span_video.classList.add("chatbot__message__text");
          span_video.classList.add("is-loading");
          span_video.classList.add("is-hidden");
          let video = DOMreference.document.createElement("video");
          video.classList.add("chatbot__message__video");
          video.controls = true;
          video.setAttribute("playsinline", "playsinline");
          video.setAttribute("webkit-playsinline", "webkit-playsinline");
          let sourceMP4 = document.createElement("source");
          sourceMP4.type = "video/mp4";
          sourceMP4.src = message.content;

          if (message.muted) {
            video.muted = true;
          }

          video.appendChild(sourceMP4);
          span_video.appendChild(video);
          return {
            content_message: span_video,
            text_content: video,
            message_type: "video",
            delay: message.delay,
          };
        }; // creo contenuto audio

        let createAudioContent = (message, DOMreference) => {
          let span_audio = DOMreference.document.createElement("span");
          span_audio.style.width = "100%";
          span_audio.classList.add("chatbot__message__text");
          span_audio.classList.add("is-loading");
          span_audio.classList.add("is-hidden");
          let audio = DOMreference.document.createElement("audio");
          audio.classList.add("chatbot__message__audio");
          audio.controls = true;
          audio.autoplay = false;
          let sourceAudio = document.createElement("source");
          sourceAudio.type = "audio/mpeg";
          sourceAudio.src = message.content;
          audio.appendChild(sourceAudio);
          span_audio.appendChild(audio);
          return {
            content_message: span_audio,
            text_content: audio,
            message_type: "audio",
            delay: message.delay,
          };
        }; // creo contenuto file

        let createFileContent = (message, DOMreference, language) => {
          let span_file = DOMreference.document.createElement("span");
          span_file.style.width = "100%";
          span_file.classList.add("chatbot__message__text");
          span_file.classList.add("is-loading");
          span_file.classList.add("is-hidden");
          span_file.classList.add("download");

          if (message.payload.customClassDownload) {
            span_file.classList.add(message.payload.customClassDownload);
          }

          span_file.classList.add("file_content");
          let file = null;
          let filename = null;
          let extension = null;
          let fileNameArray = null;

          if (message.payload && message.payload.allowDirectDownload) {
            file = DOMreference.document.createElement("span");

            if (message.payload.bubbleTextDownload) {
              file.innerHTML = message.payload.bubbleTextDownload;
            } else {
              file.textContent = "Click to download file";
            }

            filename = message.payload.filenameDownload || Date.now();
            fileNameArray = message.content.split(".");
            extension = "." + fileNameArray[fileNameArray.length - 1];
            file.addEventListener("click", function () {
              // FileSaver.saveAs(message.content, filename + (extension || ".pdf"));
              FileSaver.saveAs(
                "https://media-hej.s3.eu-west-1.amazonaws.com/Aida+Dev/image/1570459409808.png",
                filename + (extension || ".pdf")
              ); // FileSaver.saveAs("https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf", Date.now() +  ".pdf");
            });
          } else {
            file = DOMreference.document.createElement("a");
            file.href = message.content;
            file.target = "_blank";
            file.setAttribute("download", "");

            if (message.payload.bubbleTextDownload) {
              file.innerHTML = message.payload.bubbleTextDownload;
            } else {
              let currentIdiom = language_namespaceObject.m.find(
                (element) => element.code == language
              );
              file.textContent = currentIdiom.file_text;
            }
          }

          span_file.appendChild(file);
          return {
            content_message: span_file,
            text_content: file,
            message_type: "file",
            delay: message.delay,
          };
        }; // creo contenuto bottone

        let createButtonContent = (message, DOMreference, language, type) => {
          let div_choice = DOMreference.document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");
          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = DOMreference.document.createElement("span");
          choice_info.classList.add("hejchatbot_info"); // choice_info.textContent = "Clicca su un pulsante ⬇";

          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent =
            currentIdiom && currentIdiom.button_text
              ? currentIdiom.button_text
              : currentIdiom && currentIdiom.card_text
              ? currentIdiom.card_text
              : "Clicca su un pulsante ⬇";
          let div_choice_buttons = DOMreference.document.createElement("div");
          div_choice_buttons.classList.add("chatbot__message__choice__buttons");
          message.content.forEach((buttonElement) => {
            if (
              buttonElement.type == "postback" &&
              buttonElement.payload == "DEFAULT_FALLBACK_INTENT" &&
              type != "widget"
            ) {
              return;
            }

            if (
              buttonElement.type == "postback" ||
              buttonElement.type == "web_url" ||
              buttonElement.type == "video_chat"
            ) {
              let button = DOMreference.document.createElement("button");
              button.dataset.type =
                buttonElement.type == "postback"
                  ? "message_action"
                  : buttonElement.type == "web_url"
                  ? "link_action"
                  : "video_action";
              button.dataset.button_type =
                buttonElement.type == "postback"
                  ? "postback"
                  : buttonElement.type == "web_url"
                  ? "web_url"
                  : "video_chat";
              button.dataset.content =
                buttonElement.type == "postback"
                  ? buttonElement.payload
                  : buttonElement.type == "web_url"
                  ? buttonElement.url
                  : buttonElement.session
                  ? buttonElement.session.id
                  : CommonHandler.getRandomString(16);
              button.dataset.text = buttonElement.title;

              if (buttonElement.image_url) {
                let img = DOMreference.document.createElement("img");
                img.src = buttonElement.image_url;
                button.dataset.img = buttonElement.image_url;
                button.appendChild(img);
              }

              console.log("buttonElement", buttonElement);

              if (buttonElement.title) {
                let span = DOMreference.document.createElement("span");

                if (!!!buttonElement.image_url) {
                  span.innerHTML = buttonElement.title;
                } else {
                  span.textContent = buttonElement.title;
                }

                button.appendChild(span);
              }

              if (buttonElement.image_url && buttonElement.title) {
                button.classList.add("img_text");
              } //button.innerHTML = buttonElement.title;

              button.dataset.target = buttonElement.open_in_page;
              if (buttonElement.enable_push)
                button.dataset.type = "push_action";

              if (
                buttonElement.custom_code &&
                buttonElement.custom_code != ""
              ) {
                if (buttonElement.custom_code.includes("fbq")) {
                  button.addEventListener("click", function () {
                    let f = new Function(buttonElement.custom_code)();
                    return f;
                  });
                } else {
                  button.dataset.event = buttonElement.custom_code;
                }
              } // else {
              //   button.dataset.event = "Yeah.process('changeBackground', {target:'hejchatbot', color:'red'})";
              // }

              if (buttonElement.custom_class) {
                button.classList.add(buttonElement.custom_class);
              }

              if (
                buttonElement.background &&
                buttonElement.background.overrideStandard
              ) {
                if (buttonElement.background.type == "color") {
                  button.style.background = buttonElement.background.color[0];
                  button.style.border = `2px solid ${buttonElement.background.color[0]}`;
                } else if (
                  buttonElement.background.type == "gradient" &&
                  buttonElement.background.color.length > 0
                ) {
                  let gradient = "linear-gradient(to bottom,";
                  buttonElement.background.color.forEach(function (
                    element,
                    index,
                    array
                  ) {
                    if (index == array.length - 1) {
                      return (gradient += `${element})`);
                    }

                    gradient += `${element},`;
                  });
                  button.style.background = gradient;
                  button.style.border = `none`;
                } else if (buttonElement.background.type == "image") {
                  button.style.background = `url(${buttonElement.background.image_url})`;

                  if (
                    buttonElement.background.media_id &&
                    buttonElement.background.media_id.media &&
                    buttonElement.background.media_id.media.original
                  ) {
                    button.style.background = `url(${
                      buttonElement.background.media_id &&
                      buttonElement.background.media_id.media &&
                      buttonElement.background.media_id.media.small
                        ? buttonElement.background.media_id.media.small.url
                        : buttonElement.background.media_id.media.original.url
                    })`;
                  }

                  button.style.backgroundSize = "cover";
                  button.style.backgroundPosition = "50%";
                  button.style.backgroundRepeat = "no-repeat";
                }
              }

              div_choice_buttons.appendChild(button);
            }
          });
          div_choice.appendChild(choice_info);
          div_choice.appendChild(div_choice_buttons);
          return {
            content_message: div_choice,
            message_type: "button",
            speech: message.speech,
            delay: message.delay,
          };
        }; // creo contenuto quick

        let createQuickContent = (message, DOMreference, language, type) => {
          let div_choice = DOMreference.document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");
          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = DOMreference.document.createElement("span");
          choice_info.classList.add("hejchatbot_info");
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent = currentIdiom.button_text;
          let div_choice_quicks = DOMreference.document.createElement("div");
          div_choice_quicks.classList.add("chatbot__message__choice__quicks");
          message.content.forEach((quickElement) => {
            if (
              quickElement.content_type == "text" ||
              quickElement.content_type == "video_chat"
            ) {
              if (
                quickElement.content_type == "text" &&
                quickElement.payload == "DEFAULT_FALLBACK_INTENT" &&
                type != "widget"
              ) {
                return;
              }

              let button = DOMreference.document.createElement("button");
              button.dataset.type =
                quickElement.content_type == "text"
                  ? "message_action"
                  : "video_action";
              button.dataset.button_type = "quick_reply";
              button.dataset.content =
                quickElement.content_type == "text"
                  ? quickElement.payload || quickElement.title
                  : quickElement.session
                  ? quickElement.session.id
                  : CommonHandler.getRandomString(16);
              button.dataset.text = quickElement.title;

              if (quickElement.image_url) {
                let img = DOMreference.document.createElement("img");
                img.src = quickElement.image_url;
                button.dataset.img = quickElement.image_url;
                button.appendChild(img);
              }

              if (quickElement.title) {
                let span = DOMreference.document.createElement("span");

                if (!!!quickElement.image_url) {
                  span.innerHTML = quickElement.title;
                } else {
                  span.textContent = quickElement.title;
                }

                button.appendChild(span);
              }

              if (quickElement.image_url && quickElement.title) {
                button.classList.add("img_text");
              } //button.innerHTML = quickElement.title;

              if (quickElement.enable_push) button.dataset.type = "push_action";

              if (quickElement.custom_code && quickElement.custom_code != "") {
                if (quickElement.custom_code.includes("fbq")) {
                  button.addEventListener("click", function () {
                    let f = new Function(quickElement.custom_code)();
                    return f;
                  });
                } else {
                  button.dataset.event = buttonElement.custom_code;
                }
              }

              if (quickElement.custom_class) {
                button.classList.add(quickElement.custom_class);
              }

              if (
                quickElement.background &&
                quickElement.background.overrideStandard
              ) {
                if (quickElement.background.type == "color") {
                  button.style.background = quickElement.background.color[0];
                  button.style.border = `2px solid ${quickElement.background.color[0]}`;
                } else if (
                  quickElement.background.type == "gradient" &&
                  quickElement.background.color.length > 0
                ) {
                  let gradient = "linear-gradient(to bottom,";
                  quickElement.background.color.forEach(function (
                    element,
                    index,
                    array
                  ) {
                    if (index == array.length - 1) {
                      return (gradient += `${element})`);
                    }

                    gradient += `${element},`;
                  });
                  button.style.background = gradient;
                  button.style.border = `none`;
                } else if (quickElement.background.type == "image") {
                  button.style.background = `url(${quickElement.background.image_url})`;

                  if (
                    quickElement.background.media_id &&
                    quickElement.background.media_id.media &&
                    quickElement.background.media_id.media.original
                  ) {
                    button.style.background = `url(${
                      quickElement.background.media_id &&
                      quickElement.background.media_id.media &&
                      quickElement.background.media_id.media.small
                        ? quickElement.background.media_id.media.small.url
                        : quickElement.background.media_id.media.original.url
                    })`;
                  }

                  button.style.backgroundSize = "cover";
                  button.style.backgroundPosition = "50%";
                  button.style.backgroundRepeat = "no-repeat";
                }
              }

              div_choice_quicks.appendChild(button);
            }
          });
          div_choice.appendChild(choice_info);
          div_choice.appendChild(div_choice_quicks);
          return {
            content_message: div_choice,
            message_type: "quick_reply",
          };
        }; // creo contenuto card

        let createCardContent = (message, DOMreference, language, type) => {
          if (typeof Glider === "undefined") {
            // Create new script element
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/glider-js@1/glider.min.js"; // Append to the `head` element

            document.head.appendChild(script);
          }

          if (
            message.layout &&
            message.layout == "full_image_clickable" &&
            message.height &&
            message.height != 200
          ) {
            DOMreference.document.documentElement.style.setProperty(
              "--card-height",
              message.height
            );
          }

          let card_id = CommonHandler.getRandomString(16);
          let div_choice = DOMreference.document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");

          if (type == "widget") {
            div_choice.classList.add("cards_container");
          }

          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = DOMreference.document.createElement("span");
          choice_info.classList.add("hejchatbot_info");
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent =
            currentIdiom && currentIdiom.card_text
              ? currentIdiom.card_text
              : "Clicca su un pulsante ⬇";
          let div_choice_cards = DOMreference.document.createElement("div");
          div_choice_cards.classList.add("chatbot__message__choice__cards");
          div_choice_cards.classList.add("glider_" + card_id);

          if (message.layout && message.layout == "full_image_clickable") {
            div_choice_cards.classList.add("full_image_clickable");
          }

          if (message.layout && message.layout == "compact") {
            div_choice_cards.classList.add("compact");
          }

          message.content.forEach((cardElement) => {
            let card = DOMreference.document.createElement("div"),
              img_container,
              img,
              title = DOMreference.document.createElement("h1"),
              subtitle = DOMreference.document.createElement("h2");
            card.classList.add("chatbot__message__choice__cards__card");

            if (
              cardElement.image_url != "" &&
              cardElement.image_url != undefined
            ) {
              img_container = DOMreference.document.createElement("div");
              img_container.classList.add("img_container");
              img = DOMreference.document.createElement("img");
              img.alt = "photo card";
              img.src = cardElement.image_url;
              img_container.appendChild(img);

              if (
                message.layout &&
                message.layout == "full_image_clickable" &&
                message.height &&
                message.height != 200
              ) {
                img_container.style.setProperty(
                  "height",
                  message.height + "px",
                  "important"
                );
              }

              card.appendChild(img_container);
            }

            title.innerHTML = cardElement.title;
            subtitle.innerHTML = cardElement.subtitle;

            if (message.layout && message.layout == "full_image_clickable") {
              let title_container = DOMreference.document.createElement("div");
              title_container.classList.add("title_container");
              title_container.appendChild(title);
              title_container.appendChild(subtitle);
              card.appendChild(title_container);
            } else if (message.layout && message.layout == "compact") {
              let title_container = DOMreference.document.createElement("div");
              title_container.classList.add("title_container");
              let img_top_container =
                DOMreference.document.createElement("img");
              img_top_container.alt = "logo image";
              title_container.appendChild(img_top_container);
              title_container.appendChild(title); // title_container.appendChild(subtitle);

              card.insertBefore(img_container, title_container);
              let bottom_container = DOMreference.document.createElement("div");
              bottom_container.classList.add("bottom_container");
              bottom_container.appendChild(subtitle);
              card.appendChild(bottom_container);
            } else {
              card.appendChild(title);
              card.appendChild(subtitle);
            }

            if (
              cardElement.hasOwnProperty("buttons") &&
              cardElement.buttons.length > 0
            ) {
              let button_container = DOMreference.document.createElement("ul");
              cardElement.buttons.forEach((buttonElement) => {
                if (
                  buttonElement.type == "postback" ||
                  buttonElement.type == "web_url" ||
                  buttonElement.type == "video_chat"
                ) {
                  if (
                    buttonElement.type == "postback" &&
                    buttonElement.payload == "DEFAULT_FALLBACK_INTENT" &&
                    type != "widget"
                  ) {
                    return;
                  }

                  let li = DOMreference.document.createElement("li");
                  let button = DOMreference.document.createElement("button");
                  button.dataset.type =
                    buttonElement.type == "postback"
                      ? "message_action"
                      : buttonElement.type == "web_url"
                      ? "link_action"
                      : "video_action";
                  button.dataset.button_type =
                    buttonElement.type == "postback"
                      ? "postback"
                      : buttonElement.type == "web_url"
                      ? "web_url"
                      : "video_chat";
                  button.dataset.content =
                    buttonElement.type == "postback"
                      ? buttonElement.payload
                      : buttonElement.type == "web_url"
                      ? buttonElement.url
                      : CommonHandler.getRandomString(16);
                  button.dataset.text = buttonElement.title;

                  if (buttonElement.image_url) {
                    let img = DOMreference.document.createElement("img");
                    img.src = buttonElement.image_url;
                    button.dataset.img = buttonElement.image_url;
                    button.appendChild(img);
                  }

                  if (buttonElement.title) {
                    let span = DOMreference.document.createElement("span");

                    if (!!!buttonElement.image_url) {
                      span.innerHTML = buttonElement.title;
                    } else {
                      span.textContent = buttonElement.title;
                    }

                    button.appendChild(span);
                  }

                  if (buttonElement.image_url && buttonElement.title) {
                    button.classList.add("img_text");
                  } // button.innerHTML = buttonElement.title;

                  button.dataset.target = buttonElement.open_in_page;
                  if (buttonElement.enable_push)
                    button.dataset.type = "push_action";

                  if (
                    buttonElement.custom_code &&
                    buttonElement.custom_code != ""
                  ) {
                    if (buttonElement.custom_code.includes("fbq")) {
                      button.addEventListener("click", function () {
                        let f = new Function(buttonElement.custom_code)();
                        return f;
                      });
                    } else {
                      button.dataset.event = buttonElement.custom_code;
                    }
                  }

                  if (buttonElement.custom_class) {
                    button.classList.add(buttonElement.custom_class);
                  }

                  if (
                    buttonElement.background &&
                    buttonElement.background.overrideStandard
                  ) {
                    if (buttonElement.background.type == "color") {
                      button.style.background =
                        buttonElement.background.color[0];
                      button.style.border = `2px solid ${buttonElement.background.color[0]}`;
                    } else if (
                      buttonElement.background.type == "gradient" &&
                      buttonElement.background.color.length > 0
                    ) {
                      let gradient = "linear-gradient(to bottom,";
                      buttonElement.background.color.forEach(function (
                        element,
                        index,
                        array
                      ) {
                        if (index == array.length - 1) {
                          return (gradient += `${element})`);
                        }

                        gradient += `${element},`;
                      });
                      button.style.background = gradient;
                      button.style.border = `none`;
                    } else if (buttonElement.background.type == "image") {
                      button.style.background = `url(${buttonElement.background.image_url})`;

                      if (
                        buttonElement.background.media_id &&
                        buttonElement.background.media_id.media &&
                        buttonElement.background.media_id.media.original
                      ) {
                        button.style.background = `url(${
                          buttonElement.background.media_id &&
                          buttonElement.background.media_id.media &&
                          buttonElement.background.media_id.media.small
                            ? buttonElement.background.media_id.media.small.url
                            : buttonElement.background.media_id.media.original
                                .url
                        })`;
                      }

                      button.style.backgroundSize = "cover";
                      button.style.backgroundPosition = "50%";
                      button.style.backgroundRepeat = "no-repeat";
                    }
                  }

                  li.appendChild(button);
                  button_container.appendChild(li);
                }
              });
              card.appendChild(button_container);
            }

            if (
              message.layout &&
              message.layout == "full_image_clickable" &&
              message.height &&
              message.height != 200
            ) {
              card.classList.add("customCardHeight");
            }

            div_choice_cards.appendChild(card);
          });

          if (message.content.length > 1) {
            let button_prev = DOMreference.document.createElement("button");
            button_prev.setAttribute("aria-label", "Previous");
            button_prev.classList.add("glider-prev");
            button_prev.id = "glider-prev_" + card_id;
            button_prev.textContent = "<";
            let button_next = DOMreference.document.createElement("button");
            button_next.setAttribute("aria-label", "Next");
            button_next.classList.add("glider-next");
            button_next.id = "glider-next_" + card_id;
            button_next.textContent = ">";
            let div_dots = DOMreference.document.createElement("div");
            div_dots.setAttribute("role", "tablist");
            div_dots.classList.add("dots_" + card_id);
            div_choice.appendChild(button_prev);
            div_choice.appendChild(button_next);
            div_choice.appendChild(choice_info);
            div_choice.appendChild(div_choice_cards);
            div_choice.appendChild(div_dots);
          } else {
            //div_choice.style.padding="12px 0px";
            if (
              message.content[0].hasOwnProperty("buttons") &&
              message.content[0].buttons.length > 0
            ) {
              choice_info.textContent =
                "Clicca sui bottoni della scheda per proseguire ⬇";
              div_choice.appendChild(choice_info);
            }

            div_choice.appendChild(div_choice_cards);
          }

          return {
            content_message: div_choice,
            content_message_id: card_id,
            message_type: "card",
            elements_qty: message.content.length,
            speech: message.speech,
            delay: message.delay,
          };
        }; // creo template html

        let createTemplateContent = (data, DOMreference, language) => {
          let objHtmlToSend = null;

          if (data.subType == "form") {
            objHtmlToSend = createFormContent(data, DOMreference, language);
          } else if (data.subType == "interaction") {
            objHtmlToSend = createInteractionContent(data, language);
          } else if (data.subType == "swipe") {
            objHtmlToSend = createSwipeContent(data, language);
          }

          return objHtmlToSend;
        }; // Creo un input con lista suggerimenti

        let createListSuggestionsContent = (data = undefined, DOMreference) => {
          let isLongPress = false;
          let preventBlurEvent = false;
          let long_press_timeout = null; // nascondo input normale, icona send normale e info normale

          enableStandardInput(false, DOMreference); // creo elementi html per il funzionamento

          let div = undefined;
          let input = undefined;
          let list = undefined;
          let button = undefined;
          let info = undefined;
          let fragment = undefined;
          let temp_element = undefined;
          let temp_button = undefined;
          let suggestions_container = undefined;
          let elements_selected = [];

          if (data && data.elements && data.elements.length > 0) {
            suggestions_container = document.createElement("div");
            suggestions_container.id = "list_suggestions_container";
            data.elements.forEach((element, index) => {
              list = null;
              input = null;
              div = null;
              button = null;
              info = null;
              info = document.createElement("p");
              info.classList.add("hejchatbot_info");
              info.textContent =
                element && element.info && element.info.label
                  ? element.info.label
                  : "Scegli un'opzione dalla lista";
              button = document.createElement("button");
              button.classList.add("input_suggestions_button");
              button.innerHTML = `<svg width="20px" height="20px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><title>ionicons-v5-f</title><path d="M456.69,421.39,362.6,327.3a173.81,173.81,0,0,0,34.84-104.58C397.44,126.38,319.06,48,222.72,48S48,126.38,48,222.72s78.38,174.72,174.72,174.72A173.81,173.81,0,0,0,327.3,362.6l94.09,94.09a25,25,0,0,0,35.3-35.3ZM97.92,222.72a124.8,124.8,0,1,1,124.8,124.8A124.95,124.95,0,0,1,97.92,222.72Z"/></svg>`;
              input = document.createElement("input");
              input.type =
                element && element.info && element.info.type
                  ? element.info.type
                  : "text";
              input.classList.add("input_suggestions");
              input.dataset.index = index;
              input.dataset.required =
                element && element.trigger && element.trigger.required
                  ? true
                  : false;
              input.dataset.type =
                element && element.data && element.data.disabled
                  ? "simple"
                  : null;
              input.placeholder =
                element && element.info && element.info.placeholder
                  ? element.info.placeholder
                  : "Scrivi qui";
              list = document.createElement("ul");
              list.classList.add("ul_input_suggestions", "hide");

              if (element && element.data && !element.data.disabled) {
                //event listener on input and list
                list.addEventListener("scroll", function (e) {
                  console.log("scroll event");
                  isLongPress = true;
                });
                list.addEventListener("mousedown", function (e) {
                  preventBlurEvent = true;
                  console.log("Mouse down event");
                  long_press_timeout = setTimeout(function () {
                    isLongPress = false;
                    isLongPress = true;
                  }, 500);
                });
                list.addEventListener("touchmove", function (e) {
                  console.log("touch move event");
                  isLongPress = true;
                });
                list.addEventListener("touchstart", function (e) {
                  preventBlurEvent = true;
                  console.log("touch start event");
                  long_press_timeout = setTimeout(function () {
                    isLongPress = false;
                    isLongPress = true;
                  }, 500);
                });
                list.addEventListener("mouseup", async (e) => {
                  console.log("mouse up event");
                  clearTimeout(long_press_timeout);
                  preventBlurEvent = false;

                  if (isLongPress) {
                    isLongPress = false;
                    return;
                  }

                  if (e.target.closest(".ul_input_suggestions")) {
                    let container = e.target.closest(".list_suggestions_div");
                    let context_list = container.querySelector(
                      ".ul_input_suggestions"
                    );
                    let context_input =
                      container.querySelector(".input_suggestions");
                    let idx = parseInt(context_input.dataset.index);
                    let dataToSend = undefined; // context_list.classList.add("hide");

                    context_input.value = e.target.textContent;
                    console.log("value :" + e.target.dataset.value);

                    if (data.elements[idx].save_fields.flag) {
                      dataToSend = {
                        label: {
                          type: data.elements[idx].save_fields.label.type,
                          key: data.elements[idx].save_fields.label.key,
                          value: e.target.textContent,
                        },
                        value: {
                          type: data.elements[idx].save_fields.value.type,
                          key: data.elements[idx].save_fields.value.key,
                          value: e.target.dataset.value,
                        },
                      };
                    } else {
                      dataToSend = undefined; // dataToSend = JSON.parse(e.target.dataset.record);
                    }

                    let array = CommonHandler.getCustomObject();

                    if (array[context_input.dataset.index] !== undefined) {
                      CommonHandler.setElementCustomObject(
                        dataToSend,
                        context_input.dataset.index
                      );
                    } else {
                      CommonHandler.setElementCustomObject(
                        dataToSend,
                        context_input.dataset.index
                      );
                    }

                    context_list.classList.add("hide");

                    if (
                      data.elements[idx].trigger &&
                      data.elements[idx].trigger.required
                    ) {
                      //show/hide second input
                      if (
                        context_input.value != "" &&
                        context_input.value != null
                      ) {
                        var nodes = document.querySelectorAll(
                          ".list_suggestions_div"
                        );
                        var last = nodes[idx + 1];

                        if (
                          !last.className.includes(
                            "list_suggestions_button_container"
                          )
                        ) {
                          last.classList.remove("hide");
                        }
                      }

                      if (
                        data.elements[idx + 1] &&
                        data.elements[idx + 1].data.endpoint != undefined &&
                        data.elements[idx + 1].data.endpoint != null &&
                        data.elements[idx + 1].data.endpoint != ""
                      ) {
                        const source = await fetch(
                          `${
                            data.elements[idx + 1].data.endpoint +
                            e.target.dataset.value
                          }`,
                          {
                            method: "GET",
                            // *GET, POST, PUT, DELETE, etc.
                            headers: {
                              "Content-Type": "application/json",
                            },
                          }
                        );
                        const result = await source.json(); // Returns Fetched data

                        console.log("data", result);
                        var nodes = document.querySelectorAll(
                          ".list_suggestions_div"
                        );
                        var last = nodes[idx + 1];

                        if (
                          !last.className.includes(
                            "list_suggestions_button_container"
                          )
                        ) {
                          let context_list = last.querySelector(
                            ".ul_input_suggestions"
                          );
                          let context_input =
                            last.querySelector(".input_suggestions");
                          context_list.innerHTML = "";
                          let fragment = document.createDocumentFragment();
                          let temp_data = undefined;

                          if (
                            data.elements[idx + 1].data.array &&
                            data.elements[idx + 1].data.array != ""
                          ) {
                            temp_data =
                              result[data.elements[idx + 1].data.array];
                          } else {
                            temp_data = result;
                          }

                          temp_data.forEach((item) => {
                            let temp_element = null;
                            temp_element =
                              DOMreference.document.createElement("li");
                            temp_element.dataset.record = JSON.stringify(item);
                            temp_element.dataset.value =
                              item[data.elements[idx + 1].data.value];
                            temp_element.textContent =
                              item[data.elements[idx + 1].data.key];
                            fragment.appendChild(temp_element);
                          });
                          context_list.appendChild(fragment);
                          context_list.classList.remove("hide");
                          context_input.focus();
                        }
                      } else {
                        let array = CommonHandler.getCustomObject();
                        let input_length =
                          document.querySelectorAll(
                            ".input_suggestions"
                          ).length;

                        if (
                          array.length == input_length &&
                          !array.includes(undefined)
                        ) {
                          let custom_buttons = document.querySelectorAll(
                            ".custom_button_list_suggestions"
                          );
                          custom_buttons.forEach((button) => {
                            button.disabled = false;
                          });
                        }
                      }

                      let inputs =
                        document.querySelectorAll(".input_suggestions"); // Convert buttons NodeList to an array

                      let inputsArray = Array.from(inputs);
                      console.log(inputsArray);
                      let custom_buttons = document.querySelectorAll(
                        ".custom_button_list_suggestions"
                      );

                      if (
                        !inputsArray.some((input, index) => {
                          return (
                            (input.dataset.required === "true" &&
                              (input.value == "" || input.value == null)) ||
                            array[index] == undefined
                          );
                        })
                      ) {
                        custom_buttons.forEach((button) => {
                          button.disabled = false;
                        });
                      } else {
                        console.log("trovato input required vuoto");
                        custom_buttons.forEach((button) => {
                          button.disabled = true;
                        });
                      }
                    } else if (data.elements[idx].trigger.submit) {
                      let array = CommonHandler.getCustomObject();

                      if (!array.includes(undefined)) {
                        let custom_buttons = document.querySelectorAll(
                          ".custom_button_list_suggestions"
                        );
                        custom_buttons.forEach((button) => {
                          button.disabled = false;
                        });
                      }

                      if (DOMreference.hejchatbot__chat) {
                        DOMreference.hejchatbot__chat.scrollTop =
                          DOMreference.hejchatbot__chat.scrollHeight;
                      }
                    }
                  }
                });
                list.addEventListener("touchend", async (e) => {
                  e.preventDefault();
                  console.log("touch end event");
                  clearTimeout(long_press_timeout);
                  preventBlurEvent = false;

                  if (isLongPress) {
                    isLongPress = false;
                    return;
                  }

                  if (e.target.closest(".ul_input_suggestions")) {
                    let container = e.target.closest(".list_suggestions_div");
                    let context_list = container.querySelector(
                      ".ul_input_suggestions"
                    );
                    let context_input =
                      container.querySelector(".input_suggestions");
                    let idx = parseInt(context_input.dataset.index);
                    let dataToSend = undefined; // context_list.classList.add("hide");

                    context_input.value = e.target.textContent;
                    console.log("value :" + e.target.dataset.value);

                    if (data.elements[idx].save_fields.flag) {
                      dataToSend = {
                        label: {
                          type: data.elements[idx].save_fields.label.type,
                          key: data.elements[idx].save_fields.label.key,
                          value: e.target.textContent,
                        },
                        value: {
                          type: data.elements[idx].save_fields.value.type,
                          key: data.elements[idx].save_fields.value.key,
                          value: e.target.dataset.value,
                        },
                      };
                    } else {
                      dataToSend = undefined; // dataToSend = JSON.parse(e.target.dataset.record);
                    }

                    let array = CommonHandler.getCustomObject();

                    if (array[context_input.dataset.index] !== undefined) {
                      CommonHandler.setElementCustomObject(
                        dataToSend,
                        context_input.dataset.index
                      );
                    } else {
                      CommonHandler.setElementCustomObject(
                        dataToSend,
                        context_input.dataset.index
                      );
                    }

                    context_list.classList.add("hide");

                    if (
                      data.elements[idx].trigger &&
                      data.elements[idx].trigger.required
                    ) {
                      //show/hide second input
                      if (
                        context_input.value != "" &&
                        context_input.value != null
                      ) {
                        var nodes = document.querySelectorAll(
                          ".list_suggestions_div"
                        );
                        var last = nodes[idx + 1];

                        if (
                          !last.className.includes(
                            "list_suggestions_button_container"
                          )
                        ) {
                          last.classList.remove("hide");
                        }
                      }

                      if (
                        data.elements[idx + 1] &&
                        data.elements[idx + 1].data.endpoint != undefined &&
                        data.elements[idx + 1].data.endpoint != null &&
                        data.elements[idx + 1].data.endpoint != ""
                      ) {
                        const source = await fetch(
                          `${
                            data.elements[idx + 1].data.endpoint +
                            e.target.dataset.value
                          }`,
                          {
                            method: "GET",
                            // *GET, POST, PUT, DELETE, etc.
                            headers: {
                              "Content-Type": "application/json",
                            },
                          }
                        );
                        const result = await source.json(); // Returns Fetched data

                        console.log("data", result);
                        var nodes = document.querySelectorAll(
                          ".list_suggestions_div"
                        );
                        var last = nodes[index + 1];

                        if (
                          !last.className.includes(
                            "list_suggestions_button_container"
                          )
                        ) {
                          let context_list = last.querySelector(
                            ".ul_input_suggestions"
                          );
                          let context_input =
                            last.querySelector(".input_suggestions");
                          context_list.innerHTML = "";
                          let fragment = document.createDocumentFragment();
                          let temp_data = undefined;

                          if (
                            data.elements[idx + 1] &&
                            data.elements[idx + 1].data.array &&
                            data.elements[idx + 1].data.array != ""
                          ) {
                            temp_data =
                              result[data.elements[idx + 1].data.array];
                          } else {
                            temp_data = result;
                          }

                          temp_data.forEach((item) => {
                            let temp_element = null;
                            temp_element =
                              DOMreference.document.createElement("li");
                            temp_element.dataset.record = JSON.stringify(item);
                            temp_element.dataset.value =
                              item[data.elements[idx + 1].data.value];
                            temp_element.textContent =
                              item[data.elements[idx + 1].data.key];
                            fragment.appendChild(temp_element);
                          });
                          context_list.appendChild(fragment);
                          context_list.classList.remove("hide");
                          context_input.focus();
                        }
                      } else {
                        let array = CommonHandler.getCustomObject();
                        let input_length =
                          document.querySelectorAll(
                            ".input_suggestions"
                          ).length;

                        if (
                          array.length == input_length &&
                          !array.includes(undefined)
                        ) {
                          let custom_buttons = document.querySelectorAll(
                            ".custom_button_list_suggestions"
                          );
                          custom_buttons.forEach((button) => {
                            button.disabled = false;
                          });
                        }
                      }

                      let inputs =
                        document.querySelectorAll(".input_suggestions"); // Convert buttons NodeList to an array

                      let inputsArray = Array.from(inputs);
                      console.log(inputsArray);
                      let custom_buttons = document.querySelectorAll(
                        ".custom_button_list_suggestions"
                      );

                      if (
                        !inputsArray.some((input) => {
                          return (
                            (input.dataset.required === "true" &&
                              (input.value == "" || input.value == null)) ||
                            array[index] == undefined
                          );
                        })
                      ) {
                        custom_buttons.forEach((button) => {
                          button.disabled = false;
                        });
                      } else {
                        console.log("trovato input required vuoto");
                        custom_buttons.forEach((button) => {
                          button.disabled = true;
                        });
                      }
                    } else if (data.elements[idx].trigger.submit) {
                      let array = CommonHandler.getCustomObject();

                      if (!array.includes(undefined)) {
                        let custom_buttons = document.querySelectorAll(
                          ".custom_button_list_suggestions"
                        );
                        custom_buttons.forEach((button) => {
                          button.disabled = false;
                        });
                      }

                      if (DOMreference.hejchatbot__chat) {
                        DOMreference.hejchatbot__chat.scrollTop =
                          DOMreference.hejchatbot__chat.scrollHeight;
                      }
                    }
                  }
                });
              }

              if (
                element &&
                element.data &&
                !element.data.disabled &&
                element.data.startdata &&
                element.data.startdata.length > 0
              ) {
                let startData = JSON.parse(element.data.startdata);
                fragment = document.createDocumentFragment();

                if (typeof startData == "object") {
                  startData.forEach((item) => {
                    temp_element = null;
                    temp_element = DOMreference.document.createElement("li");
                    temp_element.dataset.value = item.value;
                    temp_element.dataset.record = JSON.stringify(item);
                    temp_element.textContent = item.key;

                    if (item.selected == true) {
                      temp_element.dataset.selected = true;
                      elements_selected.push(temp_element);
                    }

                    fragment.appendChild(temp_element);
                  });
                }

                list.appendChild(fragment); // // if (index == 0) {
                //   list.classList.remove("hide");
                // // }
              }

              div = document.createElement("div");
              div.classList.add("list_suggestions_div");
              div.appendChild(list); // div.appendChild(button)

              if (element.data && element.data.disabled) {
                info.style.margin = "0";
                div.style.marginBottom = "10px";
                div.appendChild(info);
                div.appendChild(input);
              } else {
                div.appendChild(input);
                div.appendChild(info);
              }

              suggestions_container.appendChild(div);
              DOMreference.hej_user_input_div.appendChild(
                suggestions_container
              );

              if (DOMreference.hejchatbot__chat) {
                DOMreference.hejchatbot__chat.scrollTop =
                  DOMreference.hejchatbot__chat.scrollHeight;
              }

              if (element.trigger.hidden) {
                div.classList.add("hide");
              }

              if (index == 0) {
                // input.focus();
              }

              input.addEventListener("input", function (e) {
                let custom_buttons = document.querySelectorAll(
                  ".custom_button_list_suggestions"
                );
                let index = parseInt(e.target.dataset.index);

                if (element && element.data && element.data.disabled) {
                  let inputs = document.querySelectorAll(".input_suggestions"); // Convert buttons NodeList to an array

                  let array = CommonHandler.getCustomObject();
                  let inputsArray = Array.from(inputs);
                  console.log(inputsArray);
                  let custom_buttons = document.querySelectorAll(
                    ".custom_button_list_suggestions"
                  );

                  if (
                    !inputsArray.some((input) => {
                      return (
                        (input.dataset.required === "true" &&
                          (input.value == "" || input.value == null)) ||
                        array[index] == undefined
                      );
                    })
                  ) {
                    custom_buttons.forEach((button) => {
                      button.disabled = false;
                    });
                  } else {
                    console.log("trovato input required vuoto");
                    custom_buttons.forEach((button) => {
                      button.disabled = true;
                    });
                  }

                  let dataToSend = undefined;

                  if (element.save_fields.flag) {
                    dataToSend = {
                      label: {
                        type: element.save_fields.label.type,
                        key: element.save_fields.label.key,
                        value: e.target.value,
                      },
                      value: {
                        type: element.save_fields.value.type,
                        key: element.save_fields.value.key,
                        value: e.target.value,
                      },
                    };
                  } else {
                    dataToSend = undefined; // dataToSend = e.target.value;
                  }

                  CommonHandler.setElementCustomObject(
                    dataToSend,
                    e.target.dataset.index
                  );

                  if (
                    data.elements[index].trigger &&
                    data.elements[index].trigger.required
                  ) {
                    if (e.target.value != "" && e.target.value != null) {
                      var nodes = document.querySelectorAll(
                        ".list_suggestions_div"
                      );
                      var last = nodes[index + 1];

                      if (
                        !last.className.includes(
                          "list_suggestions_button_container"
                        )
                      ) {
                        let context_input =
                          last.querySelector(".input_suggestions");
                        context_input.value = "";
                        last.classList.remove("hide");
                      }
                    } else {
                      var nodes = document.querySelectorAll(
                        ".list_suggestions_div"
                      );
                      var last = nodes[index + 1];

                      if (
                        !last.className.includes(
                          "list_suggestions_button_container"
                        )
                      ) {
                        let context_input =
                          last.querySelector(".input_suggestions");
                        context_input.value = "";
                        last.classList.add("hide");
                      }
                    }
                  }
                } else {
                  // var nodes = document.querySelectorAll('.list_suggestions_div');
                  // var last = nodes[index + 1];
                  // if (!last.className.includes("list_suggestions_button_container")) {
                  //   let context_input = last.querySelector(".input_suggestions");
                  //   context_input.value = '';
                  //   last.classList.add("hide");
                  // }
                  custom_buttons.forEach((button) => {
                    button.disabled = true;
                  });
                  CommonHandler.setElementCustomObject(
                    undefined,
                    e.target.dataset.index
                  );
                  let query = e.target.value;

                  if (element.data.on_input_request) {
                    // var nodes = document.querySelectorAll('.list_suggestions_div');
                    // var last = nodes[index + 1];
                    // let context_list = last.querySelector(".ul_input_suggestions");
                    // context_list.innerHTML = '';
                    // last.classList.add("hide");
                    let custom_buttons = document.querySelectorAll(
                      ".custom_button_list_suggestions"
                    );
                    custom_buttons.forEach((button) => {
                      button.disabled = true;
                    }); // Debounces makeAPICall method

                    CommonHandler.debounceFunction(async function () {
                      const source = await fetch(
                        `${element.data.endpoint + query}`,
                        {
                          method: "GET",
                          // *GET, POST, PUT, DELETE, etc.
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      const result = await source.json(); // Returns Fetched data

                      console.log("data", result);
                      let container = e.target.closest(".list_suggestions_div");
                      let context_list = container.querySelector(
                        ".ul_input_suggestions"
                      );
                      context_list.innerHTML = "";
                      let fragment = document.createDocumentFragment();
                      result[element.data.array].forEach((item) => {
                        let temp_element = null; // if(item[element.data.key].toLowerCase().includes(query.toLowerCase())){

                        temp_element =
                          DOMreference.document.createElement("li");
                        temp_element.dataset.record = JSON.stringify(item);
                        temp_element.dataset.value = item[element.data.value];
                        temp_element.textContent = item[element.data.key];
                        fragment.appendChild(temp_element); // }
                      });

                      if (fragment.childElementCount > 0) {
                        context_list.appendChild(fragment);
                        context_list.classList.remove("hide");

                        if (DOMreference.hejchatbot__chat) {
                          DOMreference.hejchatbot__chat.scrollTop =
                            DOMreference.hejchatbot__chat.scrollHeight;
                        }
                      }
                    }, 200);
                  } else {
                    let filter, li, i, txtValue;
                    let container = e.target.closest(".list_suggestions_div");
                    let context_list = container.querySelector(
                      ".ul_input_suggestions"
                    );
                    let context_input =
                      container.querySelector(".input_suggestions");
                    filter = context_input.value.toUpperCase();
                    li = context_list.getElementsByTagName("li");

                    for (i = 0; i < li.length; i++) {
                      txtValue = li[i].textContent || li[i].innerText;

                      if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        li[i].style.display = "";
                      } else {
                        li[i].style.display = "none";
                      }
                    }
                  }
                }
              });

              if (element && element.data && !element.data.disabled) {
                input.addEventListener("blur", function (e) {
                  console.log("blur event", e);
                  console.log("isLongPress", isLongPress);
                  if (preventBlurEvent) return;
                  let container = e.target.closest(".list_suggestions_div");
                  let context_list = container.querySelector(
                    ".ul_input_suggestions"
                  );
                  context_list.classList.add("hide");
                });
                input.addEventListener("focus", function (e) {
                  console.log("focus event");
                  let container = e.target.closest(".list_suggestions_div");
                  let context_list = container.querySelector(
                    ".ul_input_suggestions"
                  );
                  context_list.classList.add("hide");

                  if (DOMreference.hejchatbot__chat) {
                    DOMreference.hejchatbot__chat.scrollTop =
                      DOMreference.hejchatbot__chat.scrollHeight;
                  }
                });
                input.addEventListener("click", function (e) {
                  console.log("click input event");
                  let container = e.target.closest(".list_suggestions_div");
                  let context_list = container.querySelector(
                    ".ul_input_suggestions"
                  );
                  context_list.classList.contains("hide")
                    ? context_list.classList.remove("hide")
                    : context_list.classList.add("hide");
                });
              }
            });
          }

          if (data && data.buttons && data.buttons.length > 0) {
            let div = document.createElement("div");
            div.classList.add("list_suggestions_div");
            div.classList.add("list_suggestions_button_container");
            div.style.flexDirection = "row";
            data.buttons.forEach((button, index) => {
              temp_button = document.createElement("button");
              temp_button.textContent = button.title || "Invia"; // temp_button.id = "custom_submit"

              temp_button.disabled = true;
              temp_button.classList.add("custom_button_list_suggestions");

              if (button.custom_class) {
                temp_button.classList.add(button.custom_class);
              }

              temp_button.dataset.type = "custom_action";
              temp_button.dataset.subtype = "list_suggestions";
              temp_button.dataset.content = button.payload;
              temp_button.dataset.button_type = "list_suggestions";
              temp_button.dataset.text = button.title || button.payload;
              div.appendChild(temp_button);
            });
            suggestions_container.appendChild(div); // DOMreference.hej_user_input_div.appendChild(temp_button)
          }

          if (elements_selected && elements_selected.length > 0) {
            elements_selected.forEach((elem) => {
              presetInputSuggestion(elem, data, DOMreference);
              elem.click();
            });
          }

          return {
            content_message: undefined,
            text_content: undefined,
            message_type: data.subType,
            delay: undefined,
          };
        };

        let presetInputSuggestion = async (element, data, DOMreference) => {
          console.log("preset suggestions method");

          if (element.closest(".ul_input_suggestions")) {
            let container = element.closest(".list_suggestions_div");
            let context_list = container.querySelector(".ul_input_suggestions");
            let context_input = container.querySelector(".input_suggestions");
            let idx = parseInt(context_input.dataset.index);
            let dataToSend = undefined; // context_list.classList.add("hide");

            context_input.value = element.textContent;
            console.log("value :" + element.dataset.value);

            if (data.elements[idx].save_fields.flag) {
              dataToSend = {
                label: {
                  type: data.elements[idx].save_fields.label.type,
                  key: data.elements[idx].save_fields.label.key,
                  value: element.textContent,
                },
                value: {
                  type: data.elements[idx].save_fields.value.type,
                  key: data.elements[idx].save_fields.value.key,
                  value: element.dataset.value,
                },
              };
            } else {
              dataToSend = undefined; // dataToSend = JSON.parse(e.target.dataset.record);
            }

            let array = CommonHandler.getCustomObject();

            if (array[context_input.dataset.index] !== undefined) {
              CommonHandler.setElementCustomObject(
                dataToSend,
                context_input.dataset.index
              );
            } else {
              CommonHandler.setCustomObject(dataToSend);
            }

            context_list.classList.add("hide");

            if (
              data.elements[idx].trigger &&
              data.elements[idx].trigger.required
            ) {
              //show/hide second input
              if (context_input.value != "" && context_input.value != null) {
                var nodes = document.querySelectorAll(".list_suggestions_div");
                var last = nodes[idx + 1];

                if (
                  !last.className.includes("list_suggestions_button_container")
                ) {
                  last.classList.remove("hide");
                }
              }

              if (
                data.elements[idx + 1] &&
                data.elements[idx + 1].data.endpoint != undefined &&
                data.elements[idx + 1].data.endpoint != null &&
                data.elements[idx + 1].data.endpoint != ""
              ) {
                const source = await fetch(
                  `${
                    data.elements[idx + 1].data.endpoint +
                    e.target.dataset.value
                  }`,
                  {
                    method: "GET",
                    // *GET, POST, PUT, DELETE, etc.
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );
                const result = await source.json(); // Returns Fetched data

                console.log("data", result);
                var nodes = document.querySelectorAll(".list_suggestions_div");
                var last = nodes[index + 1];

                if (
                  !last.className.includes("list_suggestions_button_container")
                ) {
                  let context_list = last.querySelector(
                    ".ul_input_suggestions"
                  );
                  context_list.innerHTML = "";
                  let fragment = document.createDocumentFragment();
                  let temp_data = undefined;

                  if (
                    data.elements[idx + 1] &&
                    data.elements[idx + 1].data.array &&
                    data.elements[idx + 1].data.array != ""
                  ) {
                    temp_data = result[data.elements[idx + 1].data.array];
                  } else {
                    temp_data = result;
                  }

                  temp_data.forEach((item) => {
                    let temp_element = null;
                    temp_element = DOMreference.document.createElement("li");
                    temp_element.dataset.record = JSON.stringify(item);
                    temp_element.dataset.value =
                      item[data.elements[idx + 1].data.value];
                    temp_element.textContent =
                      item[data.elements[idx + 1].data.key];
                    fragment.appendChild(temp_element);
                  });
                  context_list.appendChild(fragment);
                  context_list.classList.remove("hide");
                }
              } else {
                let array = CommonHandler.getCustomObject();
                let input_length =
                  document.querySelectorAll(".input_suggestions").length;

                if (
                  array.length == input_length &&
                  !array.includes(undefined)
                ) {
                  let custom_buttons = document.querySelectorAll(
                    ".custom_button_list_suggestions"
                  );
                  custom_buttons.forEach((button) => {
                    button.disabled = false;
                  });
                }
              }

              let inputs = document.querySelectorAll(".input_suggestions"); // Convert buttons NodeList to an array

              let inputsArray = Array.from(inputs);
              console.log(inputsArray);
              let custom_buttons = document.querySelectorAll(
                ".custom_button_list_suggestions"
              );

              if (
                !inputsArray.some((input) => {
                  return (
                    (input.dataset.required === "true" &&
                      (input.value == "" || input.value == null)) ||
                    array[index] == undefined
                  );
                })
              ) {
                custom_buttons.forEach((button) => {
                  button.disabled = false;
                });
              } else {
                console.log("trovato input required vuoto");
                custom_buttons.forEach((button) => {
                  button.disabled = true;
                });
              }
            } else if (data.elements[idx].trigger.submit) {
              let array = CommonHandler.getCustomObject();

              if (!array.includes(undefined)) {
                let custom_buttons = document.querySelectorAll(
                  ".custom_button_list_suggestions"
                );
                custom_buttons.forEach((button) => {
                  button.disabled = false;
                });
              }
            }
          }
        };

        let enableStandardInput = (value, DOMreference) => {
          if (value) {
            DOMreference.hej_user_input_div.style.overflow = "";
            DOMreference.hej_user_input.style.display = "";
            DOMreference.user_message_button.style.display = "";
            DOMreference.infoInput.style.display = "";
          } else {
            DOMreference.hej_user_input_div.style.overflow = "visible";
            DOMreference.hej_user_input.style.display = "none";
            DOMreference.user_message_button.style.display = "none";
            DOMreference.infoInput.style.display = "none";
          }
        };

        let createFormContent = (data = undefined, DOMreference, language) => {
          let obj = createFormContainer(data, DOMreference);
          let div = null,
            div_radio_group = null,
            div_checkbox_group = null,
            span = null,
            form_container = null,
            form_element = null,
            form_inner_container = null;
          let form_id = data.form._id + "_" + esm_browser_v4(); // build html elements

          form_container = document.createElement("div");
          form_container.id = "hej_form_container_" + form_id; // form_container.id = "hej_form_container_" + data.form._id;

          form_container.classList.add("hej_form_container");

          if (data.form.layout.type == "modal") {
            form_container.classList.add("full_height");
            form_container.classList.add("minified");
          } // form_container.addEventListener("click", (e) =>{
          //   // stop propagation on click for element hejchatbot on app.js file
          //   e.stopPropagation();
          //   form_container.classList.remove("minified");
          //   form_container.classList.add("expanded");
          // });

          form_inner_container = document.createElement("div"); // form_inner_container.id = "form_inner_container_" + data.form._id;

          form_inner_container.id = "form_inner_container_" + form_id;
          form_inner_container.classList.add("form_inner_container");
          form_element = document.createElement("form"); // form_element.id = "hej_form_"+ data.form._id;

          form_element.id = "hej_form_" + form_id;
          form_element.classList.add("hej_form");
          form_element.setAttribute("novalidate", "novalidate");
          span = document.createElement("span");
          span.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`; // span.id = "close_form_container_"  + data.form._id;

          span.id = "close_form_container_" + form_id;
          span.classList.add("close_form_container");
          span.addEventListener("click", (e) => {
            // stop propagation on click for element hejchatbot on app.js file
            e.stopPropagation();
            form_container.classList.remove("expanded");
            form_container.classList.add("minified");
          });
          form_container.appendChild(span);
          DOMreference.hejchatbot.appendChild(form_container);

          if (
            data &&
            data.form &&
            data.form.groups &&
            data.form.groups.length > 0
          ) {
            let fieldset = null;
            let title = null;
            let subtitle = null;
            let groupElements = [];
            data.form.groups.forEach((group) => {
              (div_radio_group = null),
                (div_checkbox_group = null),
                (fieldset = null);
              title = null;
              subtitle = null;

              if (
                group.layout &&
                group.layout.show_title &&
                group.layout.title != ""
              ) {
                title = document.createElement("h4");
                title.id = `title_${group._id}`;
                title.textContent = group.layout.title;
                if (title) form_element.appendChild(title); // fieldset = document.createElement("fieldset");
                // fieldset.id=`fieldset_${group._id}`;
                // legend = document.createElement("legend");
                // legend.textContent = group.layout.title;
                // legend.id =`legend_${group._id}`;
                // fieldset.appendChild(legend);
              }

              if (
                group.layout &&
                group.layout.show_subtitle &&
                group.layout.subtitle != ""
              ) {
                subtitle = document.createElement("h5");
                subtitle.id = `subtitle_${group._id}`;
                subtitle.textContent = group.layout.subtitle;

                if (fieldset) {
                  if (subtitle) form_element.appendChild(subtitle);
                }
              }

              if (group && group.elements && group.elements.length > 0) {
                if (!fieldset && subtitle) {
                  form_element.appendChild(subtitle);
                }

                group.elements.forEach((element) => {
                  element.group_id = group._id;

                  if (
                    element.type == "input" &&
                    element.subtype == "checkbox" &&
                    group.multiple
                  ) {
                    if (!div_checkbox_group) {
                      div_checkbox_group = document.createElement("div");
                      div_checkbox_group.id = `div_checkbox_group_${group._id}`;
                      div_checkbox_group.classList.add(
                        "checkbox_group_container"
                      );

                      if (element.label && element.label != "") {
                        let span = document.createElement("h6");

                        if (element.info && element.info.master) {
                          span.textContent = element.label;
                          div_checkbox_group.appendChild(span);
                        }
                      }
                    }
                  }

                  if (element.type == "input" && element.subtype == "radio") {
                    if (!div_radio_group) {
                      div_radio_group = document.createElement("div");
                      div_radio_group.id = `div_radio_group_${group._id}`;
                      div_radio_group.classList.add("radio_group_container");

                      if (element.label && element.label != "") {
                        let span = document.createElement("h6");

                        if (element.info && element.info.master) {
                          span.textContent = element.label;
                          div_radio_group.appendChild(span);
                        }
                      }
                    }
                  }

                  div = document.createElement("div");
                  div.classList.add("form-control");
                  div.classList.add(
                    element.type == "input" ? element.subtype : element.type
                  );
                  div.id = `field_container_${element._id}`;
                  let htmlElement = CreateFormFieldHtmlElement(
                    element,
                    group._id
                  );
                  div.appendChild(htmlElement);

                  if (element.type == "input" && element.subtype == "radio") {
                    div_radio_group.appendChild(div);
                  }

                  if (
                    element.type == "input" &&
                    element.subtype == "checkbox" &&
                    group.multiple
                  ) {
                    div_checkbox_group.appendChild(div);
                  }

                  if (fieldset) {
                    if (element.type == "input" && element.subtype == "radio") {
                      fieldset.appendChild(div_radio_group);
                    } else if (
                      element.type == "input" &&
                      element.subtype == "checkbox" &&
                      group.multiple
                    ) {
                      fieldset.appendChild(div_checkbox_group);
                    } else {
                      fieldset.appendChild(div);
                    }
                  } else {
                    if (element.type == "input" && element.subtype == "radio") {
                      form_element.appendChild(div_radio_group);
                    } else if (
                      element.type == "input" &&
                      element.subtype == "checkbox" &&
                      group.multiple
                    ) {
                      form_element.appendChild(div_checkbox_group);
                    } else {
                      form_element.appendChild(div);
                    }
                  }
                });
                groupElements.push(...group.elements);

                if (fieldset) {
                  form_element.appendChild(fieldset);
                }

                form_inner_container.appendChild(form_element);
                form_container.appendChild(form_inner_container);
              }
            });
            CommonHandler.setFormObject(data.form); // FormHandler.init(language, data.form._id, data.form.max_error);

            FormHandler.init(language, form_id, data.form.max_error);
            FormHandler.addValidationFields(groupElements);

            if (data.form.error && data.form.error && data.form.error.flag) {
              FormHandler.setErrors();
            }
          }

          let button_submit = document.createElement("button");
          button_submit.classList.add("hej_form_submit");
          button_submit.textContent = data.form.layout
            ? data.form.layout.submit_button.title
            : "Invia";

          if (
            data.form &&
            data.form.layout &&
            data.form.layout.submit_button.custom_class
          ) {
            button_submit.classList.add(
              data.form.layout.submit_button.custom_class
            );
          }

          if (
            data.form &&
            data.form.layout &&
            data.form.layout.submit_button &&
            data.form.layout.submit_button.hasOwnProperty("show") &&
            !data.form.layout.submit_button.show
          ) {
            button_submit.style.display = "none";
          } // button_submit.textContent = "Submit";

          button_submit.type = "submit";
          form_element.appendChild(button_submit);

          if (data.form.layout.type == "inBubble") {
            obj.content_message.appendChild(form_container);
          } else if (data.form.layout.type == "modal") {
            document.body.appendChild(form_container);
          }

          if (data.form.layout.direct_opening) {
            setTimeout(() => {
              form_container.classList.remove("minified");
              form_container.classList.add("expanded");
            }, 1);
          }

          return obj;
        };

        let createFormContainer = (data = undefined, DOMreference) => {
          let objToSend = null;

          switch (data.form.layout.type) {
            case "inBubble":
              let span_text = DOMreference.document.createElement("span");
              span_text.classList.add("chatbot__message__text", "form");
              span_text.classList.add("is-loading");
              span_text.classList.add("is-hidden"); // let text_content = DOMreference.document.createElement("span");
              // text_content.innerHTML = message.content;
              // span_text.appendChild(text_content);

              objToSend = {
                content_message: span_text,
                text_content: null,
                message_type: "form_inBubble",
                delay: null,
              };
              break;

            case "modal":
              objToSend = {
                content_message: undefined,
                text_content: undefined,
                message_type: "form_full",
                delay: undefined,
              };
              break;
          }

          return objToSend;
        };

        let CreateFormFieldHtmlElement = (element, group_id) => {
          let fragment = new DocumentFragment();
          let div = document.createElement("div");
          let div_error = document.createElement("div");
          div_error.classList.add("error_container");
          div_error.id = `${element.type}_${element.subtype}_${element._id}_error_container`;

          switch (element.type) {
            case "input":
              if (element.subtype != "checkbox" && element.subtype != "radio") {
                let label = document.createElement("label");
                label.textContent = element.label;
                let input = document.createElement("input");
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.classList.add("input"); //input.type = element.subtype == "text_alphabetic" ? "text" : element.subtype;

                input.type = "text";
                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                ); // fake attribute to prevent autocomplete. Only solution that work till 24/02/2023
                // input.autocomplete = "new-form-field";

                if (!element.attributes.autocomplete) {
                  input.autocomplete = "new-form-field";
                }

                if (element.attributes.placeholder) {
                  input.placeholder = element.attributes.placeholder;
                }

                if (
                  render_FORM_INPUT_VALIDATION_TEL_TYPE.includes(
                    element.validation.type
                  )
                ) {
                  input.type = "tel";
                  input.inputMode = "tel";
                  input.pattern = "[0-9]*";
                } else if (element.validation.type == "email") {
                  input.type = "email";
                  input.inputMode = "email";
                }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id;

                if (element.info && element.info.hasOwnProperty("text")) {
                  input.value = element.info.text;
                }

                if (element.custom_class) {
                  div.classList.add(element.custom_class);
                }

                div.append(label);
                div.append(input);
                fragment.append(div);
                fragment.append(div_error);
              } else if (element.subtype == "checkbox") {
                if (
                  element.label &&
                  element.label != "" &&
                  !element.attributes.multiple
                ) {
                  let h6_label = document.createElement("h6");
                  h6_label.textContent = element.label;
                  div.append(h6_label);
                }

                let inner_div = document.createElement("div");
                inner_div.classList.add("inner_checkbox_div");
                let label = document.createElement("label");
                label.innerHTML = element.text; // label.textContent = element.text;

                label.classList.add("checkbox");
                label.setAttribute(
                  "for",
                  `${element.type}_${element.subtype}_${element._id}`
                );
                let input = document.createElement("input");
                input.type =
                  element && element.subtype ? element.subtype : "text";
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.checked = element.attributes.checked;

                if (element.custom_class) {
                  inner_div.classList.add(element.custom_class);
                }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id;
                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                );

                if (element.info && element.info.hasOwnProperty("checked")) {
                  input.checked = element.info.checked;
                }

                inner_div.append(input);
                inner_div.append(label);
                div.append(inner_div);
                fragment.append(div);

                if (!element.attributes.multiple) {
                  fragment.append(div_error);
                }
              } else if (element.subtype == "radio") {
                // if(element.label){
                //   let span_label = document.createElement("span");
                //   span_label.textContent = element.label;
                //   div.append(span_label);
                // }
                let label = document.createElement("label"); // label.textContent = element.text;

                label.innerHTML = element.text; // label.textContent = "Acconsenti al trattamento dei tuoi Dati personali per le finalità di cui al punto 4, lett. b), ossia al compimento (e successivo utilizzo) di sondaggi e/o ricerche di mercato effettuate nell’interesse dei Contitolari e contattarTi, ai recapiti forniti, al fine di verificare la qualità del servizio reso nei miei confronti ed il tuo grado di soddisfazione anche mediante un’indagine di NPS?";

                label.classList.add("radio");
                label.setAttribute(
                  "for",
                  `${element.type}_${element.subtype}_${element._id}`
                );
                let input = document.createElement("input");
                input.type =
                  element && element.subtype ? element.subtype : "text";
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.name = `radio_${group_id}`;
                input.checked = element.info.master;

                if (element.custom_class) {
                  div.classList.add(element.custom_class);
                }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id; // input.dataset.index = index;

                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                ); // input.dataset.type = element && element.data && element.data.disabled ? 'simple' : null;

                if (element.info && element.info.hasOwnProperty("checked")) {
                  input.checked = element.info.checked;
                }

                div.append(input);
                div.append(label);
                fragment.append(div); // fragment.append(div_error);
              }

              break;

            case "select":
              if (element.label) {
                let label = document.createElement("label");
                label.textContent = element.label;
                div.append(label);
              }

              let select = document.createElement("select");
              select.id = `${element.type}_${element.subtype}_${element._id}`;
              select.classList.add("select", "minimal");
              select.dataset.groupid = group_id;
              select.dataset.elementid = element._id; // create a new option

              let htmlOption = null;
              let selected = false;
              element.children.options.forEach((option, index) => {
                selected = false;
                selected = option.selected;

                if (
                  element.info &&
                  element.info.hasOwnProperty("selected_index") &&
                  index == element.info.selected_index
                ) {
                  selected = true;
                }

                htmlOption = null;
                htmlOption = new Option(
                  option.label,
                  option.value ? option.value : "",
                  selected,
                  selected
                );
                htmlOption.disabled = option.disabled;
                select.add(htmlOption, undefined);
              });

              if (element.custom_class) {
                div.classList.add(element.custom_class);
              }

              div.append(select);
              fragment.append(div);
              fragment.append(div_error);
              break;

            case "textarea":
              if (element.label) {
                let label = document.createElement("label");
                label.textContent = element.label;
                div.append(label);
              }

              break;

            case "iframe":
              if (!element.info.url || element.info.url == "") {
                console.log("iframe url error");
                break;
              }

              let iframe = document.createElement("iframe");
              iframe.src = element.info.url;

              iframe.onload = function () {
                console.log("iframe caricato");
              };

              div.append(iframe);
              fragment.append(div); // fragment.append(div_error);

              break;

            case "readonly":
              let short_text = null;
              let long_text = null;

              if (
                element.info &&
                element.info.readonly &&
                element.info.readonly.short_text &&
                element.info.readonly.short_text != ""
              ) {
                short_text = document.createElement("p");
                short_text.innerHTML = element.info.readonly.short_text;

                if (element.custom_class) {
                  short_text.classList.add(element.custom_class);
                } // if(element.info.readonly.long_text_opening =="modal" && element.info.readonly.long_text && element.info.readonly.long_text != ""){
                //   short_text.style = "cursor:pointer;";
                //   short_text.addEventListener("click", function(){
                //     console.log("open modal");
                //   });
                // }

                fragment.append(short_text);
              }

              if (
                element.info &&
                element.info.readonly &&
                element.info.readonly.long_text &&
                element.info.readonly.long_text != ""
              ) {
                if (element.info.readonly.long_text_opening == "modal") {
                  let modal_background = document.createElement("div");
                  modal_background.classList.add("hej_form_modal");
                  let modal_content = document.createElement("div");
                  modal_content.classList.add("hej_form_modal_content");
                  let close_modal = document.createElement("span");
                  close_modal.classList.add("hej_form_modal_close");
                  close_modal.innerHTML = "&times;";
                  close_modal.addEventListener("click", function () {
                    modal_background.classList.toggle("active");
                  });
                  let modal_header = document.createElement("div");
                  modal_header.classList.add("hej_form_modal_header");
                  modal_header.append(close_modal);
                  let modal_body = document.createElement("div");
                  modal_body.classList.add("hej_form_modal_body");
                  modal_body.innerHTML = element.info.readonly.long_text;
                  modal_content.append(modal_header);
                  modal_content.append(modal_body);
                  modal_background.appendChild(modal_content);
                  let resultParse = CommonHandler.parseTextSymbol(
                    element.info.readonly.short_text
                  );

                  if (resultParse.target == "MODAL") {
                    short_text.innerHTML = resultParse.text;
                    let span_link = short_text.querySelector(
                      ".hej_form_readonly_link"
                    );
                    span_link.addEventListener("click", function () {
                      modal_background.classList.toggle("active");
                    });
                  } else {
                    short_text.style = "cursor:pointer;";
                    short_text.addEventListener("click", function () {
                      modal_background.classList.toggle("active");
                    });
                  }

                  document.body.append(modal_background);
                } else {
                  long_text = document.createElement("textarea");
                  long_text.textContent = element.info.readonly.long_text;
                  long_text.style.height = element.info.readonly
                    .long_text_height
                    ? element.info.readonly.long_text_height + "px"
                    : "";
                  long_text.disabled = true;

                  if (element.custom_class) {
                    long_text.classList.add(element.custom_class);
                  }

                  fragment.append(long_text);
                }
              }

              break;
          }

          return fragment;
        };

        let createInteractionContent = (data = undefined, language = "it") => {
          let currentGroup, currentInteraction;

          if (!data.interaction && !data.interaction.groups) {
            let objToSend = {
              content_message: undefined,
              text_content: undefined,
              message_type: "swipe",
              delay: undefined,
            };
            return objToSend;
          }

          currentGroup = data.interaction.groups[0];

          if (
            currentGroup &&
            currentGroup.interactions &&
            currentGroup.interactions[0]
          ) {
            currentInteraction = currentGroup.interactions[0];

            if (currentInteraction.type == "swipe") {
              return createSwipeContent(data, language);
            }
          }
        };

        let createSwipeContent = (data = undefined, language = "it") => {
          let image = null;

          if (
            data.interaction &&
            data.interaction.groups &&
            data.interaction.groups[0].interactions &&
            data.interaction.groups[0].interactions[0].elements &&
            data.interaction.groups[0].interactions[0].elements[0].media_id &&
            data.interaction.groups[0].interactions[0].elements[0].media_id
              .media
          ) {
            image = data.interaction.groups[0].interactions[0].elements[0]
              .media_id.media.small
              ? data.interaction.groups[0].interactions[0].elements[0].media_id
                  .media.small.url
              : data.interaction.groups[0].interactions[0].elements[0].media_id
                  .media.original.url; // document.documentElement.style.setProperty('--interaction_swipe_image', `url('${image}')`);
          }

          let div_swipe = document.createElement("div");
          div_swipe.classList.add("swipe__card"); // div_swipe.classList.add("shaking-infinite");

          div_swipe.classList.add("shaking");
          let div_img = document.createElement("img");
          div_img.classList.add("swipe__card__img");
          div_img.src = image;
          let div_swipe_left = document.createElement("div");
          div_swipe_left.classList.add("swipe__card__choice", "m--reject"); // div_swipe_left.innerHTML = "<span>👎</span>";

          div_swipe_left.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0] &&
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping[0].title
              ? data.interaction.groups[0].interactions[0].info.mapping[0].title
              : "👎"
          }</span>`;
          let div_swipe_right = document.createElement("div");
          div_swipe_right.classList.add("swipe__card__choice", "m--like");
          div_swipe_right.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0] &&
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping[1].title
              ? data.interaction.groups[0].interactions[0].info.mapping[1].title
              : "👍"
          }</span>`;
          div_swipe.appendChild(div_img);
          div_swipe.appendChild(div_swipe_right);
          div_swipe.appendChild(div_swipe_left);
          let div_choice = document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");
          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = document.createElement("span");
          choice_info.classList.add("hejchatbot_info");
          choice_info.textContent = "You can swipe right or left to answer.";
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent = currentIdiom.swipe_caption;
          div_choice.appendChild(choice_info);
          div_choice.appendChild(div_swipe);
          let div_button = document.createElement("div");
          div_button.classList.add("swipe_button_choice");
          let button_left = document.createElement("button");

          if (
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0]
              .custom_class
          ) {
            button_left.classList.add(
              data.interaction.groups[0].interactions[0].info.mapping[0]
                .custom_class
            );
          } // button_left.innerHTML = "<span>👎</span>";

          button_left.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0].title
              ? data.interaction.groups[0].interactions[0].info.mapping[0].title
              : "👎"
          }</span>`;
          button_left.dataset.label =
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0].label
              ? data.interaction.groups[0].interactions[0].info.mapping[0].label
              : undefined;
          let button_right = document.createElement("button"); // button_right.innerHTML = "<span>👍</span>";

          button_right.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1].title
              ? data.interaction.groups[0].interactions[0].info.mapping[1].title
              : "👍"
          }</span>`;

          if (
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1]
              .custom_class
          ) {
            button_right.classList.add(
              data.interaction.groups[0].interactions[0].info.mapping[1]
                .custom_class
            );
          }

          button_right.dataset.label =
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1].label
              ? data.interaction.groups[0].interactions[0].info.mapping[1].label
              : undefined;
          button_left.addEventListener("click", function () {
            console.log("clicked left choice");
            div_swipe.classList.add("controlled");
            div_swipe.style.transform =
              "translateX(" + -300 + "px) rotate(" + -30 + "deg)";
            div_swipe_left.classList.add("controlled");
            div_swipe_left.style.opacity = 1;
            SwipeController.controlledRelease(div_swipe, "left_swipe"); // CommonHandler.dispachEvent(undefined, "swipeCompleted");

            div_button.style.pointerEvents = "none";
            div_button.style.display = "none";
            choice_info.style.display = "none";
          });
          button_right.addEventListener("click", function () {
            console.log("clicked right choice");
            div_swipe.classList.add("controlled");
            div_swipe.style.transform =
              "translateX(" + 300 + "px) rotate(" + 30 + "deg)";
            div_swipe_right.classList.add("controlled");
            div_swipe_right.style.opacity = 1;
            SwipeController.controlledRelease(div_swipe, "right_swipe"); // CommonHandler.dispachEvent(undefined, "swipeCompleted");

            div_button.style.pointerEvents = "none";
            div_button.style.display = "none";
            choice_info.style.display = "none";
          }); // CommonHandler.setInteractionObject(data.interaction.groups[0].interactions[0]);

          CommonHandler.setInteractionObject(data.interaction);
          div_button.appendChild(button_left);
          div_button.appendChild(button_right);
          div_choice.appendChild(div_button);
          SwipeController.init(div_swipe, {
            medium: "landing",
          });
          let objToSend = {
            content_message: div_choice,
            text_content: undefined,
            message_type: "swipe",
            delay: undefined,
          };
          return objToSend;
        };

        return {
          createTypingLoader,
          createTextContent,
          createImageContent,
          createVideoContent,
          createAudioContent,
          createFileContent,
          createButtonContent,
          createQuickContent,
          createCardContent,
          createTemplateContent,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/dom.js
      const DOMHandler = (function () {
        let hejchatbot = null;
        let hejchatbot__chat = null;
        let hejchatbot_header = null;
        let hej_send_to_messenger = null;
        let sendMessageContent = null;
        let hej_user_input_div = null;
        let hej_user_input_standard = null;
        let hej_user_input = null;
        let user_message_button = null;
        let hej_user_input_voice_info = null;
        let user_message_voice = null;
        let user_message_voice_talking = null;
        let hejchatbot_footer = null;
        let hejchatbot_footer_cookie = null;
        let hej_widget_footer = null;
        let infoInput = null;
        let hej_widget_main_content = null;
        let configuration = null; // get DOM element reference

        let setDOMReference = () => {
          //get global variable from jade
          configuration = web_project_configuration;
          let project_id = web_project_id;

          switch (configuration.type) {
            case "landing":
              hejchatbot = document.getElementById("hejchatbot");
              hejchatbot__chat = document.getElementById("hejchatbot__chat"); // hej_send_to_messenger = document.getElementById("hej_send_to_messenger");

              hejchatbot_header = document.getElementById("hejchatbot_header");
              hej_user_input_div =
                document.getElementById("hej_user_input_div");
              hej_user_input_standard = document.getElementById(
                "hej_user_input_standard_div"
              );
              hej_user_input = document.getElementById("hej_user_input");
              user_message_button = document.getElementById(
                "user_message_button"
              );
              user_message_voice =
                document.getElementById("user_message_voice");
              user_message_voice_talking = document.getElementById(
                "hej_user_input_voice_talking"
              );
              hej_user_input_voice_info =
                document.getElementById("info_input_voice");
              hejchatbot_footer = document.getElementById("hejchatbot_footer");
              hejchatbot_footer_cookie = document.getElementById(
                "hejchatbot_footer_a_iubenda"
              );
              infoInput = document.getElementById("info_input");
              break;

            case "banner":
              let currentTopDocument = window.document;

              if (configuration.chat_overlay) {
                hejchatbot = currentTopDocument.getElementById(
                  "hejchatbot_" + project_id
                );
                hejchatbot__chat = currentTopDocument.getElementById(
                  "hejchatbot__chat_" + project_id
                );
                hejchatbot_header = currentTopDocument.getElementById(
                  "hejchatbot_header_" + project_id
                ); // hej_send_to_messenger = currentTopDocument.getElementById("hej_send_to_messenger_" + project_id);

                sendMessageContent = document.getElementById(
                  "fb-send-to-messenger_" + project_id
                );
                hej_user_input_div = currentTopDocument.getElementById(
                  "hej_user_input_div_" + project_id
                );
                hej_user_input_standard = currentTopDocument.getElementById(
                  "hej_user_input_standard_div_" + project_id
                );
                hej_user_input = currentTopDocument.getElementById(
                  "hej_user_input_" + project_id
                );
                user_message_button = currentTopDocument.getElementById(
                  "user_message_button_" + project_id
                );
                user_message_voice = currentTopDocument.getElementById(
                  "user_message_voice_" + project_id
                );
                user_message_voice_talking = document.getElementById(
                  "hej_user_input_voice_talking_" + project_id
                );
                hej_user_input_voice_info = currentTopDocument.getElementById(
                  "info_input_voice_" + project_id
                );
                hejchatbot_footer = document.getElementById(
                  "hejchatbot_footer_" + project_id
                );
                infoInput = currentTopDocument.getElementById(
                  "info_input_" + project_id
                );
              } else {
                hejchatbot = currentTopDocument.getElementById("hejchatbot");
                hejchatbot__chat =
                  currentTopDocument.getElementById("hejchatbot__chat");
                hejchatbot_header =
                  currentTopDocument.getElementById("hejchatbot_header"); // hej_send_to_messenger = currentTopDocument.getElementById("hej_send_to_messenger");

                sendMessageContent = document.getElementById(
                  "fb-send-to-messenger"
                );
                hej_user_input_div =
                  currentTopDocument.getElementById("hej_user_input_div");
                hej_user_input_standard = currentTopDocument.getElementById(
                  "hej_user_input_standard_div"
                );
                hej_user_input =
                  currentTopDocument.getElementById("hej_user_input");
                user_message_button = currentTopDocument.getElementById(
                  "user_message_button"
                );
                user_message_voice =
                  currentTopDocument.getElementById("user_message_voice");
                user_message_voice_talking = document.getElementById(
                  "hej_user_input_voice_talking"
                );
                hej_user_input_voice_info =
                  currentTopDocument.getElementById("info_input_voice");
                hejchatbot_footer =
                  document.getElementById("hejchatbot_footer");
                infoInput = currentTopDocument.getElementById("info_input");
              }

              break;

            case "widget":
              hejchatbot = document.getElementById("hej_widget_main_content");
              hejchatbot__chat = document.getElementById("hejchatbot__chat"); // hej_send_to_messenger = document.getElementById("hej_send_to_messenger");

              hejchatbot_header = document.getElementById("hejchatbot_header");
              hej_user_input_div =
                document.getElementById("hej_user_input_div");
              hej_user_input = document.getElementById("hej_user_input");
              user_message_button = document.getElementById(
                "user_message_button"
              );
              user_message_voice =
                document.getElementById("user_message_voice");
              hej_widget_footer = document.getElementById("hej_widget_footer");

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video"
              ) {
                hej_widget_main_content = document.getElementById(
                  "hej_widget_main_content"
                );
                hejchatbot__chat = document.getElementById("hej_widget_footer");
                hejchatbot = document.getElementById("hej_widget_footer");
              }

              break;
          }
        };

        let getDOMReference = () => {
          return {
            hejchatbot,
            hejchatbot__chat,
            hejchatbot_header,
            //  hej_send_to_messenger,
            sendMessageContent,
            hej_user_input_div,
            hej_user_input_standard,
            hej_user_input,
            user_message_button,
            user_message_voice,
            user_message_voice_talking,
            hej_user_input_voice_info,
            hejchatbot_footer,
            hejchatbot_footer_cookie,
            hej_widget_footer,
            infoInput,
            hej_widget_main_content,
            window:
              configuration && configuration.chat_overlay ? window.top : window,
            document:
              configuration && configuration.chat_overlay
                ? window.top.document
                : window.document,
          };
        };

        return {
          setDOMReference,
          getDOMReference,
        };
      })();
      // EXTERNAL MODULE: ./node_modules/web-animations-js/web-animations.min.js
      var web_animations_min = __webpack_require__(124); // CONCATENATED MODULE: ./app/js/utility/http2.js
      /**
       * EasyHTTP Library
       * Library for making HTTP requests
       *
       * @version 3.0.0
       * @author  Brad Traversy
       * @license MIT
       *
       **/

      class http2_EasyHTTP {
        constructor() {
          this.options = {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            timeout: 15000,
            body: "",
          };
          this.urlIndex = 0;
          this.urls = [];
          this.configuration = undefined;
          this.webProjectId = undefined;
        }

        init() {
          this.configuration = web_project_configuration;
          this.webProjectId = web_project_id;
          let request_url = this.configuration.ws_url;

          if (
            window.location.hostname == "staging.hejagency.com" ||
            window.location.hostname == "www.testing-bot.it"
          ) {
            request_url = this.configuration.ws_url.replace(
              /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
              "https://bot.hejagency.com/STAGING/web_project"
            );
          } else {
            if (this.configuration.group_bot) {
              request_url = this.configuration.ws_url.replace(
                /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
                "https://bot.hejagency.com/" +
                  this.configuration.group_bot +
                  "/web_project"
              );
            } else {
              request_url = this.configuration.ws_url.replace(
                /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
                "https://bot.hejagency.com/web_project"
              );
            }
          }

          this.urls.push(request_url);
          this.urls.push("https://bot.hejagency.com/web_project"); // if (window.location.hostname == "staging.hejagency.com" || this.configuration.staging_mode) {
          //     this.urls.push("https://bot.hejagency.com/web_project");
          // } else {
          //     this.urls.push("https://www.hejagency.com/web_project/5678/web_project/webhook");
          // }
        } // Make an HTTP Request

        async post(url, data = undefined, options = undefined) {
          try {
            if (data && typeof data == "object") {
              this.options.body = JSON.stringify(data);
            }

            if (options && typeof options == "object") {
              Object.assign(this.options, options); // console.log("options: ", this.options);
            }

            const res = await fetchWithTimeout(url, this.options);
            const contentType = res.headers.get("content-type");

            if (!res.ok) {
              if (
                contentType &&
                contentType.indexOf("application/json") !== -1
              ) {
                const resData = await res.json();
                throw resData;
              } else {
                const resData = await res.text();
                throw resData;
              }
            } else {
              if (
                contentType &&
                contentType.indexOf("application/json") !== -1
              ) {
                const resData = await res.json();
                return resData;
              } else {
                const resData = await res.text();
                return resData;
              }
            }
          } catch (error) {
            // catches errors both in fetch and response.json
            console.log(error); // Timeouts if the request takes
            // longer than 6 seconds

            console.log("error name: " + error.name);
            throw error;
          }
        }

        async recursiveCall(data = undefined, options = undefined) {
          try {
            if (options && options.type) {
              this.setupHttpData(options.type);
            }

            if (data && typeof data == "object") {
              data.hej_cookie_policy = false;
              console.log("_iub HTTPS Request", window._iub);
              let iubendaObject = null;
              iubendaObject = CommonHandler.getProperty("iubenda");

              if (iubendaObject && iubendaObject.top == undefined) {
                if (window._iub && window._iub.cs && window._iub.cs.api) {
                  let consentGiven = window._iub.cs.api.isConsentGiven();

                  iubendaObject.top = consentGiven;
                }

                CommonHandler.setProperty("iubenda", iubendaObject);
              }

              if (iubendaObject && iubendaObject.top != undefined) {
                console.log(
                  "IUBENDA ATTIVO - check isConsentGiven",
                  iubendaObject.top
                );
                data.hej_cookie_policy = iubendaObject.top;
              } // if (
              //   parent &&
              //   parent.window &&
              //   parent.window._iub
              // ) {
              //   if (
              //     parent.window._iub.cs &&
              //     parent.window._iub.cs.api
              //   ) {
              //     console.log("IUBENDA ATTIVO - check isConsentGiven");
              //     console.log(
              //       "parent.window._iub.cs.api.isConsentGiven()",
              //       parent.window._iub.cs.api.isConsentGiven()
              //     );
              //     data.hej_cookie_policy = parent.window._iub.cs.api.isConsentGiven();
              //   }
              // } else {
              //   if (_iub && _iub.cs && _iub.cs.api) {
              //     console.log("IUBENDA ATTIVO - check isConsentGiven");
              //     console.log(
              //       "_iub.cs.api.isConsentGiven()",
              //       _iub.cs.api.isConsentGiven()
              //     );
              //     data.hej_cookie_policy = _iub.cs.api.isConsentGiven();
              //   }
              // }

              this.options.body = JSON.stringify(data);
            }

            if (options && typeof options == "object") {
              Object.assign(this.options, options); // console.log("options: ", this.options);
            }

            let response = await this.post(this.urls[this.urlIndex]);
            return response;
          } catch (error) {
            console.log(
              "Errore chiamata " + options.type + " , tentativo url successivo"
            );
            let params = {}; // chiamata ad api di errore

            if (options.type == "restart") {
              params.data = data;
              params.error_message = "Primo messaggio non ricevuto";
            } else if (options.type == "delivery") {
              params.data = undefined;
              params.error_message = "Problemi con il delivery del messaggio";
            } else if (options.type == "read") {
              params.data = undefined;
              params.error_message = "Problemi con il read del messaggio";
            } else if (options.type == "talk") {
              params.data = undefined;
              params.content =
                data && data.content_id
                  ? data.content_id
                  : options && options.input
                  ? options.input
                  : undefined;
              params.error_message = "Problemi con ricezione messaggio";
            }

            this.sendAlertError(error, params);
            this.urlIndex++;

            if (this.urlIndex >= this.urls.length) {
              this.urlIndex = 0;
              throw error;
            }

            return this.recursiveCall(data, options);
          }
        }

        setupHttpData(type) {
          var request_url = this.configuration.ws_url;
          this.urls = [];

          if (
            window.location.hostname == "staging.hejagency.com" ||
            window.location.hostname == "www.testing-bot.it"
          ) {
            request_url = this.configuration.ws_url.replace(
              /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
              "https://bot.hejagency.com/STAGING/web_project"
            );
          } else {
            if (this.configuration.group_bot) {
              request_url = this.configuration.ws_url.replace(
                /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
                "https://bot.hejagency.com/" +
                  this.configuration.group_bot +
                  "/web_project"
              );
            } else {
              request_url = this.configuration.ws_url.replace(
                /https:\/\/www\.hejagency\.com\/banner-bot\/\d{4}\/banner/gi,
                "https://bot.hejagency.com/web_project"
              );
            }
          }

          if (type == "restart" || type == "talk") {
            this.urls.push(request_url);
            this.urls.push("https://bot.hejagency.com/web_project/webhook");
          } else {
            let regex = /webhook/gi;
            request_url = request_url.replace(regex, "delivery");
            this.urls.push(request_url);
            this.urls.push("https://bot.hejagency.com/web_project/delivery");
          }
        }

        sendAlertError(error, options) {
          let request_url = "";

          if (window.location.hostname == "localhost") {
            request_url = window.location.origin;
          } else {
            request_url = "https://www.hejagency.com";
          }

          let user = undefined;

          if (CommonHandler.get_local_storage_status() == "available") {
            user = JSON.parse(localStorage.getItem("hej_user"));
          } else {
            //session user non esiste in questa classe
            user = session_user || undefined;
          }

          let ref = "";
          let urlParams = new URLSearchParams(window.location.search);

          if (urlParams.has("ref")) {
            ref = urlParams.get("ref");
          }

          let param = {
            data:
              options && options.data
                ? JSON.stringify(options.data)
                : undefined,
            content: options && options.content ? options.content : undefined,
            configuration: this.configuration,
            message_error:
              options && options.error_message
                ? options.error_message
                : undefined,
            error: error,
          };
          Promise.all([
            this.post(`${request_url}/api/v1/generic/send_alert`, {
              data: param.data,
              page_id: param.configuration.page_id,
              browser: navigator.userAgent,
              platform: param.configuration.type,
              url: window.location.href,
              ref: ref,
              channel_id:
                param.configuration.type == "widget" &&
                param.configuration.widget.type == "video"
                  ? "C03NQU8GJ3H"
                  : undefined,
              web_project_id: this.webProjectId,
              label: param.message_error
                ? param.message_error
                : "Errore non identificato",
              content: param.content
                ? param.content
                : "Nessun info sul messaggio",
              error: param.error
                ? typeof param.error === "object" && param.error !== null
                  ? JSON.stringify(
                      param.error.message ? param.error.message : param.error
                    )
                  : param.error
                : "Nessun messaggio di errore disponibile",
              user: user ? user._id : "Nessun utente",
            }), // this.post(`${request_url}/api/v1/error`, {
            //     audience: user ? user._id : undefined,
            //     page_id: param.configuration.page_id,
            //     priority: "Medium",
            //     ignore: false,
            //     label: param.message_error ? param.message_error : "Errore non identificato",
            //     details: {
            //         browser: navigator.userAgent,
            //         platform: param.configuration.type,
            //         message: param.error ? ((typeof param.error === 'object' && param.error !== null) ? JSON.stringify(param.error.message ? param.error.message : param.error) : param.error) : "Nessun messaggio di errore disponibile",
            //         status: 500,
            //         stack: param.error && param.error.stack ? param.error.stack : 'stack non disponibile'
            //     }
            // })
          ])
            .then((data) => {
              console.log("response send alert", data);
            })
            .catch((err) => {
              console.log("error send alert", err);
            });
        }
      }

      async function fetchWithTimeout(url, options = {}) {
        const { timeout = 15000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      }

      const http2 = new http2_EasyHTTP(); // CONCATENATED MODULE: ./app/js/core/chatbot.js
      const ChatController = (function () {
        let configuration = null;
        let webProjectId = null;
        let optimizationTest = null;
        let session_user = null; // riferimento a utente attivo quando non è disponibile il local storage

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration;
          webProjectId = web_project_id;
          optimizationTest = optimization_test;
          http2.init();
        }; // Avvio chat con messaggio default o con session message

        let startConversation = (query_message = undefined, startUp = true) => {
          if (CommonHandler.getFirstInteraction()) return;
          let user = undefined;
          let current_form = undefined;
          let current_profile = undefined;
          let external_ref = undefined;

          if (CommonHandler.get_local_storage_status() == "available") {
            if (CommonHandler.checkStorageExpiration()) {
              user = JSON.parse(localStorage.getItem("hej_user"));
            } else {
              localStorage.removeItem("hej_user");
            }

            current_form = localStorage.getItem("hej_form_fields");

            if (current_form) {
              current_form = JSON.parse(current_form);
            }

            current_profile = localStorage.getItem("hej_profile_fields");

            if (current_profile) {
              current_profile = JSON.parse(current_profile);
            }

            external_ref = localStorage.getItem("hej_ref");

            if (external_ref) {
              external_ref = JSON.parse(external_ref);
            }
          } else {
            user = session_user;
          }

          var auid = undefined;
          var fmid = undefined;
          var root_domain = undefined;
          var ref = undefined;
          var preview_mode = undefined;
          var fbp_cookie = document.cookie.replace(
            /(?:(?:^|.*;\s*)_fbp\s*\=\s*([^;]*).*$)|^.*$/,
            "$1"
          );
          var urlParams = new URLSearchParams(window.location.search); // console.log("urlParams", urlParams)

          if (urlParams.has("ref")) {
            ref = urlParams.get("ref");
          }

          if (urlParams.has("url")) {
            root_domain = urlParams.get("url");
            CommonHandler.setProperty("root_domain", root_domain);
          }

          if (!root_domain) {
            root_domain = CommonHandler.getProperty("root_domain");
          }

          if (!ref) {
            ref = CommonHandler.getProperty("ref");
          }

          if (urlParams.has("auid")) {
            auid = urlParams.get("auid");
            let userObj = {
              _id: auid,
              expiration: new Date(),
            };

            if (CommonHandler.get_local_storage_status() == "available") {
              localStorage.setItem("hej_user", JSON.stringify(userObj));
            } else {
              session_user = userObj;
            }

            user = userObj;
          }

          if (urlParams.has("fmid")) {
            fmid = urlParams.get("fmid");
          }

          if (urlParams.has("preview_mode")) {
            preview_mode = urlParams.get("preview_mode");
          } // console.log("ref", ref)
          // console.log("preview_mode", preview_mode)
          // if (configuration.type == "landing") {
          //     var urlParams = new URLSearchParams(window.location.search);
          //     if (urlParams.has('ref')) {
          //         ref = urlParams.get('ref');
          //     }
          // }

          let tz = {
            region: undefined,
            offset: undefined,
          };
          let today = new Date();
          tz.offset = today.getTimezoneOffset();
          tz.region = Intl.DateTimeFormat().resolvedOptions().timeZone; //prima chiamata ad api per prelevare l'id utente

          let httpData = {
            group_bot: configuration.group_bot
              ? configuration.group_bot
              : undefined,
            user_id: user ? user._id : undefined,
            track_utm: configuration.track_utm
              ? configuration.track_utm
              : undefined,
            preview_mode: preview_mode == "true" ? preview_mode : false,
            current_form: current_form ? current_form : undefined,
            current_profile: current_profile ? current_profile : undefined,
            external_ref: external_ref ? external_ref : undefined,
            web_project_id: webProjectId,
            agent: configuration.type,
            origin_url: window.location.href,
            query: query_message ? query_message : "000restart_web_project000",
            lang: configuration.language ? configuration.language.code : "it",
            id: configuration.ws_app_id,
            page_id: configuration.page_id,
            page: configuration.ws_page_id,
            welcome_id: configuration.welcome_message,
            text: query_message ? query_message : "000restart_web_project000",
            ref: ref,
            optimization_test: optimizationTest,
            fbp_cookie: fbp_cookie,
            timezone: tz,
            preno_id: hej_preno_id,
            root_domain: root_domain,
            auid: auid,
            fmid: fmid, // browser_info: {
            //     language: window.navigator.language,
            //     user_agent: window.navigator.userAgent,
            //     connection: {
            //         downlink: window.navigator.connection.downlink,
            //         effectiveType: window.navigator.connection.effectiveType,
            //         rtt: window.navigator.connection.rtt,
            //     }
            // }
          };
          http2
            .recursiveCall(httpData, {
              timeout: "15000",
              type: "restart",
            }) // http2.post(request_url, httpData, {timeout:"15000"})
            .then((data) => {
              CommonHandler.setFirstInteraction(true);
              CommonHandler.setProperty("prevRef", ref);
              CommonHandler.clearProperty("ref"); //sending adform event

              if (configuration.type == "banner" && configuration.banner) {
                if (configuration.banner.type != "interstitial") {
                  if (typeof dhtml !== "undefined") {
                    dhtml.sendEvent("2", "Bot Write To User");
                  }
                } else {
                  if (typeof Adform !== "undefined") {
                    Adform.sendEvent(
                      Adform.EVENT_CUSTOM_2,
                      "Bot Write To User"
                    );
                  }
                }
              } // se ho informazioni utente setto il localStorage

              if (data.user && !urlParams.has("auid")) {
                if (user && user._id && data.user != user._id) {
                  data.user.expiration = new Date();

                  if (CommonHandler.get_local_storage_status() == "available") {
                    localStorage.setItem("hej_user", JSON.stringify(data.user));
                  } else {
                    session_user = data.user;
                  }
                }

                if (CommonHandler.get_local_storage_status() == "available") {
                  if (!CommonHandler.checkStorageExpiration()) {
                    data.user.expiration = new Date();
                    localStorage.setItem("hej_user", JSON.stringify(data.user));
                  }
                } else {
                  data.user.expiration = new Date();
                }

                user = data.user;
                session_user = data.user;
              }

              sendMetrics(data.content_id, "flow", "delivery", "15000"); // se non ho messaggi dal bot visualizzo i messaggi default del configuratore

              let messages = "";
              messages = configuration.initial_messages;

              if (
                data.hasOwnProperty("messages") ||
                (data.messages && data.messages.length > 0)
              ) {
                messages = data;
              } else {
                //messaggi non presenti nella riposta 200
                http2.sendAlertError(undefined, {
                  error_message:
                    "Messaggio non trovato o con problemi con la sua formattazione",
                });
              }

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video"
              ) {
                UIController.processVideo(data, startUp);
              } else {
                let messageFormatted = formatMessage(messages, httpData);
                UIController.addMessages("bot", messageFormatted);
              }
            })
            .catch((err) => {
              console.log("error " + err);
              console.log("error message " + err.message);
              console.log("error stack " + err.stack);

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video"
              ) {
                UIController.processVideo(
                  {
                    messages: [
                      {
                        text: "scusa si è verificato un problema",
                      },
                    ],
                  },
                  false
                );
              } else {
                let dataParsed = formatMessage(undefined, httpData);
                UIController.addMessages("bot", dataParsed);
              }
            });
        }; // chiamata API a server per risposta chatbot

        let talk = (input, message_type, opts = undefined) => {
          let current_form = undefined;
          let current_profile = undefined;
          let external_ref = undefined;
          let user = undefined;

          if (CommonHandler.get_local_storage_status() == "available") {
            console.log("CommonHandler.get_local_storage_status available");
            current_form = localStorage.getItem("hej_form_fields");

            if (current_form) {
              current_form = JSON.parse(current_form);
            }

            current_profile = localStorage.getItem("hej_profile_fields");

            if (current_profile) {
              current_profile = JSON.parse(current_profile);
            }

            external_ref = localStorage.getItem("hej_ref");

            if (external_ref) {
              external_ref = JSON.parse(external_ref);
            }

            if (!localStorage.getItem("hej_user")) {
              if (session_user) {
                user = session_user;
                localStorage.setItem("hej_user", JSON.stringify(user));
              }
            } else {
              if (CommonHandler.checkStorageExpiration()) {
                user = JSON.parse(localStorage.getItem("hej_user"));
              } else {
                localStorage.removeItem("hej_user");
              }
            }
          } else {
            user = session_user;
          }

          var fbp_cookie = document.cookie.replace(
            /(?:(?:^|.*;\s*)_fbp\s*\=\s*([^;]*).*$)|^.*$/,
            "$1"
          );
          var preview_mode = undefined;
          var urlParams = new URLSearchParams(window.location.search);

          if (urlParams.has("preview_mode")) {
            preview_mode = urlParams.get("preview_mode");
          }

          let tz = {
            region: undefined,
            offset: undefined,
          };
          let today = new Date();
          tz.offset = today.getTimezoneOffset();
          tz.region = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let data = {
            group_bot: configuration.group_bot
              ? configuration.group_bot
              : undefined,
            user_id: user ? user._id : null,
            track_utm: configuration.track_utm
              ? configuration.track_utm
              : undefined,
            preview_mode: preview_mode == "true" ? preview_mode : false,
            current_form: current_form ? current_form : undefined,
            current_profile: current_profile ? current_profile : undefined,
            external_ref: external_ref ? external_ref : undefined,
            agent: configuration.type,
            web_project_id: webProjectId,
            origin_url: window.location.href,
            query: input,
            lang: configuration.language ? configuration.language.code : "it",
            id: configuration.ws_app_id,
            page_id: configuration.page_id,
            page: configuration.ws_page_id,
            welcome_id: configuration.welcome_message,
            optimization_test: optimizationTest,
            fbp_cookie: fbp_cookie,
            timezone: tz,
            preno_id: hej_preno_id,
            root_domain: CommonHandler.getProperty("root_domain"), // browser_info: {
            //     language: window.navigator.language,
            //     user_agent: window.navigator.userAgent,
            //     connection: {
            //         downlink: window.navigator.connection.downlink,
            //         effectiveType: window.navigator.connection.effectiveType,
            //         rtt: window.navigator.connection.rtt,
            //     }
            // }
          };

          if (message_type == "text") {
            //handle file upload
            if (
              typeof input == "object" &&
              input.hasOwnProperty("attachment")
            ) {
              data.query = undefined;
              data.attachment = input;
            } else {
              data.text = input;
            }
          } else if (message_type == "quick_reply") {
            data.quick_reply = {
              payload: input,
            };
          } else if (message_type == "postback") {
            data.postback = {
              payload: input,
            };
          } else if (message_type == "list_suggestions") {
            data.postback = {
              payload: input,
              data: JSON.stringify(opts),
            };
          } else if (message_type == "form_submit") {
            data.form = {
              payload: input,
              data: JSON.stringify(opts),
            };
          } else if (message_type == "swipe_complete") {
            data.interaction = {
              payload: input,
              data: JSON.stringify(opts),
            };
          } else if (message_type == "address") {
            data.location = {
              google_maps: {
                coords: [opts[0].lat, opts[0].lng],
                formatted_address: opts[0].formatted_address,
                name: opts[0].name,
              },
              text: input,
            };
          }

          if (
            configuration.type == "banner" &&
            configuration.banner &&
            configuration.banner.type == "interstitial" &&
            configuration.timer_close_chat &&
            configuration.timer_close_chat.flag
          ) {
            // event dispatched to dismiss interstitial countdown
            let evt = CommonHandler.getEvent("stopCountdown");

            if (evt && !evt.dispatched) {
              document
                .getElementById("hejchatbot__chat")
                .dispatchEvent(evt.content);
              CommonHandler.setEventProperty(
                "stopCountDown",
                "dispatched",
                true
              );
            }
          }

          http2
            .recursiveCall(data, {
              type: "talk",
              input: input,
            }) // http2.post(request_url, data)
            .then((response) => {
              //clear custom data for input address
              CommonHandler.clearCustomObject();
              sendMetrics(response.content_id, "flow", "delivery"); //sending adform event

              if (configuration.type == "banner" && configuration.banner) {
                if (
                  configuration.banner &&
                  configuration.banner.type != "interstitial"
                ) {
                  if (typeof dhtml !== "undefined") {
                    dhtml.sendEvent("2", "Bot Write To User");
                  }
                } else {
                  if (typeof Adform !== "undefined") {
                    Adform.sendEvent(
                      Adform.EVENT_CUSTOM_2,
                      "Bot Write To User"
                    );
                  }
                }
              }

              if (
                configuration.progress_bar &&
                configuration.progress_bar.flag &&
                response.label_info &&
                response.label_info.id
              ) {
                UIController.nextStep(response.label_info.id);
              }

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video"
              ) {
                UIController.processVideo(response, false);
              } else {
                let dataParsed = null;
                dataParsed = formatMessage(response, data);
                UIController.addMessages("bot", dataParsed);
              }
            })
            .catch((err) => {
              console.log("error " + err);
              console.log("error message " + err.message);
              console.log("error stack " + err.stack);

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video"
              ) {
                UIController.processVideo(
                  {
                    messages: [
                      {
                        text: "scusa si è verificato un problema",
                      },
                    ],
                  },
                  false
                );
              } else {
                let dataParsed = formatMessage(undefined, data);
                UIController.addMessages("bot", dataParsed);
              }
            });
        };

        let sendMetrics = (
          content_id,
          type_metric = "flow",
          type_event = "read",
          timeout = 15000,
          opts
        ) => {
          if (
            content_id == null ||
            content_id == undefined ||
            content_id == "" ||
            content_id == "undefined"
          ) {
            return;
          }

          let user = undefined;

          if (CommonHandler.get_local_storage_status() == "available") {
            user = JSON.parse(localStorage.getItem("hej_user"));
          } else {
            user = session_user;
          }

          var ref = undefined;
          var preview_mode = undefined;
          var urlParams = new URLSearchParams(window.location.search);

          if (urlParams.has("preview_mode")) {
            preview_mode = urlParams.get("preview_mode");
          }

          if (urlParams.has("ref")) {
            ref = urlParams.get("ref");
          } // console.log("configuration", configuration);

          let tz = {
            region: undefined,
            offset: undefined,
          };
          let today = new Date();
          tz.offset = today.getTimezoneOffset();
          tz.region = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let httpData = {
            group_bot: configuration.group_bot
              ? configuration.group_bot
              : undefined,
            type_metric: type_metric,
            type_event: type_event,
            user_id: user ? user._id : undefined,
            content_id: content_id,
            media_id: opts ? opts.mediaId : undefined,
            univocal_code_bot: configuration.univocal_code_bot,
            track_utm: configuration.track_utm
              ? configuration.track_utm
              : undefined,
            ref: ref,
            page_id: configuration.page_id,
            bot_id: configuration.bot_id,
            agent: configuration.type,
            timezone: tz,
            // browser_info: {
            //     language: window.navigator.language,
            //     user_agent: window.navigator.userAgent,
            //     connection: {
            //         downlink: window.navigator.connection.downlink,
            //         effectiveType: window.navigator.connection.effectiveType,
            //         rtt: window.navigator.connection.rtt,
            //     }
            // },
            origin_url: window.location.href,
            optimization_test: optimizationTest,
            preview_mode: preview_mode == "true" ? preview_mode : false,
            web_project_id: webProjectId,
            preno_id: hej_preno_id,
            root_domain: CommonHandler.getProperty("root_domain"),
          };
          http2
            .recursiveCall(httpData, {
              timeout,
              type: type_event,
            }) // http.post(deliveryUrl, httpData)
            .then((data) => {
              //console.log(data);
              //sending adform event
              if (configuration.type == "banner" && configuration.banner) {
                if (configuration.banner.type != "interstitial") {
                  if (typeof dhtml !== "undefined") {
                    dhtml.sendEvent("3", "Delivery Message Bot");
                  }
                } else if (configuration.banner.type == "interstitial") {
                  if (typeof Adform !== "undefined") {
                    Adform.sendEvent(Adform.EVENT_CUSTOM_3);
                  }
                }
              }
            })
            .catch((err) => {
              console.log("error " + err);
              console.log("error message " + err.message);
              console.log("error stack " + err.stack);
              console.log("error http api call to " + type_event);
            });
        }; // parse della risposta ricevuto dal server

        let formatMessage = (response, data) => {
          // console.log("response", response);
          var parsedResponse = {
            content_id:
              response && response.hasOwnProperty("content_id")
                ? response.content_id
                : undefined,
            messages: [],
          };

          if (response) {
            if (response.hasOwnProperty("messages")) {
              if (
                configuration.type == "landing" &&
                response.messages.length == 1 &&
                response.messages[0].attachment &&
                response.messages[0].attachment.payload.template_type == "form"
              ) {
                let elements = document.querySelectorAll(
                  "div.chatbot__message--left:not(.fake)"
                );
                if (elements)
                  CommonHandler.removeElement(elements[elements.length - 1]);
              }

              response.messages.forEach((element) => {
                // parse del messaggio normale
                if (element.hasOwnProperty("text")) {
                  parsedResponse.messages.push({
                    content: element.text,
                    speech: element.text_to_speech,
                    delay: element.delay,
                    type: "text",
                  }); // parsedResponse.messages.push({
                  //     speech: element.text_to_speech,
                  //     delay: element.delay ? element.delay : undefined,
                  //     type: "custom_template",
                  //     subType: 'swipe'
                  // });
                } // parse del messaggio button o card
                else if (element.hasOwnProperty("attachment")) {
                  if (element.attachment.hasOwnProperty("type")) {
                    if (
                      element.attachment.type != "template" &&
                      element.attachment.type != "template_video"
                    ) {
                      parsedResponse.messages.push({
                        content: element.attachment.payload.url,
                        payload: element.attachment.payload,
                        muted:
                          element.attachment.type == "video" &&
                          element.attachment.payload.muted
                            ? element.attachment.payload.muted
                            : false,
                        speech: element.attachment.payload.text_to_speech,
                        delay: element.delay,
                        type: element.attachment.type,
                      });
                    } else {
                      if (element.attachment.hasOwnProperty("payload")) {
                        // parse del messaggio template button
                        if (
                          element.attachment.payload.template_type == "button"
                        ) {
                          parsedResponse.messages.push({
                            content: element.attachment.payload.text,
                            speech: element.attachment.payload.text_to_speech,
                            delay: element.delay ? element.delay : undefined,
                            type: "text",
                          });

                          if (
                            element.attachment.payload.hasOwnProperty("buttons")
                          ) {
                            if (element.attachment.payload.buttons.length > 0) {
                              parsedResponse.messages.push({
                                content: element.attachment.payload.buttons,
                                speech:
                                  element.attachment.payload.text_to_speech,
                                delay: element.delay
                                  ? element.delay
                                  : undefined,
                                type: "button",
                              });
                            }
                          }
                        } else if (
                          element.attachment.payload.template_type == "generic"
                        ) {
                          if (
                            element.attachment.payload.hasOwnProperty(
                              "elements"
                            )
                          ) {
                            if (
                              element.attachment.payload.elements.length > 0
                            ) {
                              parsedResponse.messages.push({
                                content: element.attachment.payload.elements,
                                speech:
                                  element.attachment.payload.text_to_speech,
                                delay: element.delay
                                  ? element.delay
                                  : undefined,
                                layout:
                                  element.attachment.payload.card_layout ||
                                  undefined,
                                height:
                                  element.attachment.payload.card_height ||
                                  undefined,
                                type: "card",
                              });
                            }
                          }
                        } else if (
                          element.attachment.payload.template_type ==
                          "list_suggestions"
                        ) {
                          parsedResponse.messages.push({
                            content: [
                              {
                                title: element.attachment.payload.text,
                                type: "custom_template",
                              },
                            ],
                            speech: element.attachment.payload.text_to_speech,
                            delay: element.delay ? element.delay : undefined,
                            elements: element.attachment.payload.elements,
                            buttons: element.attachment.payload.buttons,
                            type: "custom_template",
                            subType: "list_suggestions",
                          });
                        } else if (
                          element.attachment.payload.template_type == "form"
                        ) {
                          parsedResponse.messages.push({
                            content: [
                              {
                                title: element.attachment.payload.text,
                                type: "custom_template",
                              },
                            ],
                            speech: element.attachment.payload.text_to_speech,
                            delay: element.delay ? element.delay : undefined,
                            form: element.attachment.payload.form,
                            buttons: element.attachment.payload.buttons || [],
                            type: "custom_template",
                            subType: "form",
                          });
                        } else if (
                          element.attachment.payload.template_type ==
                          "interaction"
                        ) {
                          parsedResponse.messages.push({
                            content: [
                              {
                                title: element.attachment.payload.text,
                                type: "custom_template",
                              },
                            ],
                            speech: element.attachment.payload.text_to_speech,
                            delay: element.delay ? element.delay : undefined,
                            interaction: element.attachment.payload.interaction,
                            buttons: element.attachment.payload.buttons || [],
                            type: "custom_template",
                            subType: "interaction",
                          });
                        }
                      }
                    }
                  }
                } // parse delle quick reply

                if (element.hasOwnProperty("quick_replies")) {
                  let quick_array = [];
                  element.quick_replies.forEach((quick) => {
                    if (
                      quick.content_type == "text" ||
                      quick.content_type == "video_chat"
                    ) {
                      quick_array.push(quick);
                    }
                  });

                  if (quick_array.length > 0) {
                    parsedResponse.messages.push({
                      content: quick_array,
                      type: "quick",
                    });
                  }
                }
              });
            } else {
              parsedResponse.messages.push({
                content: configuration.hasOwnProperty("fallback_messages")
                  ? configuration.fallback_messages[0]
                  : configuration.error_messages[0],
                type: "text",
              });

              if (
                configuration.hasOwnProperty("click_url") &&
                configuration.click_url.title != "" &&
                (configuration.click_url.link_id ||
                  configuration.click_url.url != "")
              ) {
                parsedResponse.messages.push({
                  content: [
                    {
                      title: configuration.click_url.title,
                      type: "web_url",
                      url: configuration.click_url.link_id
                        ? configuration.click_url.link_id.standard_url
                        : configuration.click_url.url,
                    },
                  ],
                  type: "button",
                });
              }
            }

            if (response.hasOwnProperty("info")) {
              parsedResponse.info = response.info;
            }

            return parsedResponse;
          } else {
            let user = undefined;

            if (CommonHandler.get_local_storage_status() == "available") {
              if (CommonHandler.checkStorageExpiration()) {
                user = JSON.parse(localStorage.getItem("hej_user"));
              } else {
                localStorage.removeItem("hej_user");
              }
            } else {
              user = session_user;
            }

            parsedResponse.messages.push({
              content: configuration.hasOwnProperty("fallback_messages")
                ? configuration.fallback_messages[0]
                : configuration.error_messages[0],
              type: "text",
            });

            if (
              configuration.hasOwnProperty("click_url") &&
              configuration.click_url.title != "" &&
              (configuration.click_url.link_id ||
                configuration.click_url.url != "")
            ) {
              parsedResponse.messages.push({
                content: [
                  {
                    title: configuration.click_url.title,
                    type: "web_url",
                    url: configuration.click_url.link_id
                      ? configuration.click_url.link_id.standard_url
                      : configuration.click_url.url,
                  },
                ],
                type: "button",
              });
            }

            return parsedResponse;
          }
        };

        return {
          init,
          startConversation,
          sendMetrics,
          formatMessage,
          talk,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/video.js
      const VideoHandler = (function () {
        let first_interaction = false,
          progress_bar_container,
          progress_bar,
          progress,
          video,
          image,
          isFinished,
          isDrag,
          timeElapsed,
          play,
          duration,
          restart,
          subtitles,
          changeSpeed,
          fit,
          playbackRate = [1, 1.5, 2.0],
          options,
          currentVideoIndex = 0,
          available_urls = [],
          shortVideo = false,
          check_2_seconds = true,
          check_50_percent = true,
          check_75_percent = true,
          check_100_percent = true,
          visibility_timeout = false,
          timeout_seconds = 0; // var x = location.pathname;

        let init = () => {
          progress_bar_container = document.querySelector(
            ".progress_container"
          );
          progress_bar = document.getElementById("progress_bar");
          progress = document.getElementById("progress");
          video = document.querySelector("video");
          image = document.querySelector(".hej_widget_image");
          play = document.getElementById("hej_widget_video_play");
          initEventListeners(); //timeElapsed = document.getElementById('time-elapsed');
          //duration = document.getElementById('duration');
          //restart = document.getElementById("hej_video_restart");
          //subtitles = document.getElementById("hej_video_subtitles");
          //changeSpeed = document.getElementById("hej_video_playback_speed");
          //fit = document.getElementById("hej_video_fit");
          //restart.addEventListener("click", restartVideo);
          //subtitles.addEventListener("click", toggleSubtitles);
          //fit.addEventListener("click", fitVideo);
          //changeSpeed.addEventListener("click", changePlayBackSpeed);
        };

        let initEventListeners = () => {
          video.addEventListener("loadeddata", loadVideo, false);
          video.addEventListener("error", logVideoError, false);
          video.addEventListener(
            "ended",
            function () {
              isFinished = true;
            },
            false
          );
          document
            .getElementById("hej_widget")
            .addEventListener("click", handleClick); // progress.addEventListener('mousemove', updatePlayBackPosition);
          // progress.addEventListener('mousedown', enableVideoDrag);
          // progress.addEventListener('mouseup', disableVideoDrag);
          // progress.addEventListener('click', skipAhead);
          // video.addEventListener('loadedmetadata', initializeVideo);
          // //video.addEventListener('timeupdate', updateTimeElapsed);
          // video.addEventListener('timeupdate', updateProgress);
          // play.addEventListener(
          //     "animationend",
          //     function (event) {
          //         if (event.animationName == "play_hide") {
          //             play.classList.add("is-hidden");
          //         }
          //     },
          //     false
          // );
          // play.addEventListener(
          //     "animationend",
          //     function (event) {
          //         if (event.animationName == "play_show") {
          //             play.classList.remove("is-hidden");
          //         }
          //     },
          //     false
          // );
        };

        let playWhithoutPreview = () => {
          // let prev_video_container = document.querySelector(".hej_widget_video_container");
          video.currentTime = 0;
          progress.value = video.currentTime;
          progress_bar.style.width =
            Math.floor((video.currentTime / video.duration) * 100) + "%"; //  video.muted = false;
          //  video.loop = false;
          //  video.removeAttribute("muted");
          //  video.removeAttribute("loop");

          if (options && options.subtype == "landing" && options.startUp) {
            video.src = options.url;

            video.oncanplay = function () {
              progress_bar_container.classList.remove("hidden");
            };
          } else {
            progress_bar_container.classList.remove("hidden");
          }

          var play_anim_off = play.animate(
            [
              {
                opacity: 1,
                transform: " translate(-50%, -50%) scale(1)",
              },
              {
                opacity: 0,
                transform: "translate(-50%, -50%) scale(1.3)",
              },
            ],
            {
              duration: 500,
            }
          );

          play_anim_off.onfinish = function () {
            play.classList.add("is-hidden");
          };
        };

        let handleClick = () => {
          if (
            window.iubendaPlayAfterConsent &&
            window.iubendaPlayAfterConsent != null
          ) {
            clearInterval(window.iubendaPlayAfterConsent);
            window.iubendaPlayAfterConsent = null;
          }

          if (!first_interaction) {
            ChatController.sendMetrics(
              video.dataset.contentId,
              "video",
              "first_interaction",
              undefined,
              {
                mediaId: video.dataset.mediaId,
              }
            );
            first_interaction = true;
          }

          if (video) {
            let overlay = document.getElementById(
              "hej_widget_video_call_action"
            );

            if (overlay && !overlay.classList.contains("is-hidden")) {
              var play_anim_off = overlay.animate(
                [
                  {
                    opacity: 1,
                  },
                  {
                    opacity: 0,
                  },
                ],
                {
                  duration: 300,
                }
              );

              play_anim_off.onfinish = function () {
                let hej_widget_header =
                  document.getElementById("hej_widget_header");
                hej_widget_header.classList.remove("is-hidden");
                let buttons = document.querySelectorAll(
                  "#hej_widget_mobile_controls button"
                );

                if (buttons) {
                  let marquee = document.querySelector(
                    "#tik_talk_music_info span"
                  );

                  if (marquee) {
                    marquee.style.display = "inline-block";
                  }

                  buttons.forEach((button) => {
                    if (
                      button.id != "hej_widget_home" &&
                      button.id != "hej_widget_back"
                    ) {
                      button.classList.add("show");
                    }
                  });
                }

                overlay.classList.add("is-hidden");
              };
            }

            if (video.paused || isFinished) {
              if (video.muted && video.loop) {
                // let prev_video_container = document.querySelector(".hej_widget_video_container");
                video.currentTime = 0;
                progress.value = video.currentTime;
                progress_bar.style.width =
                  Math.floor((video.currentTime / video.duration) * 100) + "%";
                video.muted = false;
                video.loop = false;
                video.removeAttribute("muted");
                video.removeAttribute("loop");

                if (
                  options &&
                  options.subtype == "landing" &&
                  options.startUp
                ) {
                  video.src = options.url; // video.load();

                  video.oncanplay = function () {
                    progress_bar_container.classList.remove("hidden");
                  };
                } else {
                  progress_bar_container.classList.remove("hidden");
                }

                var play_anim_off = play.animate(
                  [
                    {
                      opacity: 1,
                      transform: " translate(-50%, -50%) scale(1)",
                    },
                    {
                      opacity: 0,
                      transform: "translate(-50%, -50%) scale(1.3)",
                    },
                  ],
                  {
                    duration: 500,
                  }
                );

                play_anim_off.onfinish = function () {
                  let hej_widget_header =
                    document.getElementById("hej_widget_header");
                  hej_widget_header.classList.remove("is-hidden");
                  play.classList.add("is-hidden");
                  let buttons = document.querySelectorAll(
                    "#hej_widget_mobile_controls button"
                  );

                  if (buttons) {
                    let marquee = document.querySelector(
                      "#tik_talk_music_info span"
                    );

                    if (marquee) {
                      marquee.style.display = "inline-block";
                    }

                    buttons.forEach((button) => {
                      if (
                        button.id != "hej_widget_home" &&
                        button.id != "hej_widget_back"
                      ) {
                        button.classList.add("show");
                      }
                    });
                  }
                };
              }

              if (isFinished) video.currentTime = 0;
              video.play(); // play.classList.remove("show");
              // play.classList.add("hide");

              var play_anim_off = play.animate(
                [
                  {
                    opacity: 1,
                    transform: " translate(-50%, -50%) scale(1)",
                  },
                  {
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(1.3)",
                  },
                ],
                {
                  duration: 500,
                }
              );

              play_anim_off.onfinish = function () {
                play.classList.add("is-hidden");
              };

              isFinished = false;
            } else {
              if (video.muted && video.loop) {
                // let prev_video_container = document.querySelector(".hej_widget_video_container");
                video.currentTime = 0;
                progress.value = video.currentTime;
                progress_bar.style.width =
                  Math.floor((video.currentTime / video.duration) * 100) + "%";
                video.muted = false;
                video.loop = false;
                video.removeAttribute("muted");
                video.removeAttribute("loop");

                if (
                  options &&
                  options.subtype == "landing" &&
                  options.startUp
                ) {
                  video.src = options.url;

                  video.oncanplay = function () {
                    progress_bar_container.classList.remove("hidden");
                  };
                } else {
                  progress_bar_container.classList.remove("hidden");
                }

                var play_anim_off = play.animate(
                  [
                    {
                      opacity: 1,
                      transform: " translate(-50%, -50%) scale(1)",
                    },
                    {
                      opacity: 0,
                      transform: "translate(-50%, -50%) scale(1.3)",
                    },
                  ],
                  {
                    duration: 500,
                  }
                );

                play_anim_off.onfinish = function () {
                  let hej_widget_header =
                    document.getElementById("hej_widget_header");
                  hej_widget_header.classList.remove("is-hidden");
                  play.classList.add("is-hidden");
                  let buttons = document.querySelectorAll(
                    "#hej_widget_mobile_controls button"
                  );

                  if (buttons) {
                    let marquee = document.querySelector(
                      "#tik_talk_music_info span"
                    );

                    if (marquee) {
                      marquee.style.display = "inline-block";
                    }

                    buttons.forEach((button) => {
                      if (
                        button.id != "hej_widget_home" &&
                        button.id != "hej_widget_back"
                      ) {
                        button.classList.add("show");
                      }
                    });
                  }
                };
              } else {
                video.pause();
                play.classList.remove("is-hidden"); // play.classList.remove("hide");
                // play.classList.add("show");

                play.animate(
                  [
                    {
                      opacity: 0,
                      transform: " translate(-50%, -50%) scale(1.3)",
                    },
                    {
                      opacity: 1,
                      transform: "translate(-50%, -50%) scale(1)",
                    },
                  ],
                  {
                    duration: 500,
                  }
                );
              }
            }
          }
        };

        let removeEventListener = () => {
          document
            .getElementById("hej_widget")
            .removeEventListener("click", handleClick);
        };

        let removeVideoReference = () => {
          video = null;
        }; // initializeVideo sets the video duration, and maximum value of the progressBar

        let initializeVideo = () => {
          console.log("loaded meta data");
          const videoDuration = Math.round(video.duration);
          progress.setAttribute("max", video.duration);
          const time = formatTime(videoDuration); // duration.innerText = `${time.minutes}:${time.seconds}`;
          // duration.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`)
        }; // updateTimeElapsed indicates how far through the video
        // the current playback is by updating the timeElapsed element
        // let updateTimeElapsed = () => {
        //     const time = formatTime(Math.round(video.currentTime));
        //     timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
        //     timeElapsed.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`)
        // }
        // updateProgress indicates how far through the video
        // the current playback is by updating the progress bar

        let updateProgress = () => {
          // console.log("total time", video.duration);
          // console.log("video.currentTime", video.currentTime);
          // console.log("current time", Math.floor(video.currentTime.toFixed(1)));
          // console.log("time left " + (video.duration - video.currentTime));
          // console.log("check_2_seconds", check_2_seconds);
          if (!video.muted && !video.loop) {
            if (
              check_2_seconds &&
              Math.floor(video.currentTime.toFixed(1)) == 2
            ) {
              console.log("event video_displayed");
              check_2_seconds = false;
              ChatController.sendMetrics(
                video.dataset.contentId,
                "video",
                "video_displayed",
                undefined,
                {
                  mediaId: video.dataset.mediaId,
                }
              );
            }

            if (
              visibility_timeout == true &&
              timeout_seconds != 0 &&
              video.currentTime > timeout_seconds
            ) {
              let footer = document.getElementById("hej_widget_footer");

              if (footer && footer.classList.contains("is-hidden")) {
                footer.classList.remove("is-hidden");
              }
            }

            if (video.duration - video.currentTime < 3) {
              let footer = document.getElementById("hej_widget_footer");

              if (footer && footer.classList.contains("is-hidden")) {
                footer.classList.remove("is-hidden");
              }
            }
          }

          progress.value = video.currentTime;
          var percent = Math.floor((video.currentTime / video.duration) * 100);
          progress_bar.style.width = percent + "%";

          if (!video.muted && !video.loop) {
            if (check_50_percent && percent == 50) {
              console.log("event 50_percent");
              check_50_percent = false;
              ChatController.sendMetrics(
                video.dataset.contentId,
                "video",
                "50_percent",
                undefined,
                {
                  mediaId: video.dataset.mediaId,
                }
              );
            } else if (check_75_percent && percent == 75) {
              console.log("event 75_percent");
              check_75_percent = false;
              ChatController.sendMetrics(
                video.dataset.contentId,
                "video",
                "75_percent",
                undefined,
                {
                  mediaId: video.dataset.mediaId,
                }
              );
            } else if (check_100_percent && percent == 100) {
              console.log("event video_completed");
              check_100_percent = false;
              ChatController.sendMetrics(
                video.dataset.contentId,
                "video",
                "video_completed",
                undefined,
                {
                  mediaId: video.dataset.mediaId,
                }
              );
            }
          } //progressBar.value = Math.floor(video.currentTime);
        }; // let enableVideoDrag = () => {
        //   isDrag = true;
        //   video.pause();
        // }
        // let disableVideoDrag = () => {
        //   isDrag = false;
        // }
        // skipAhead jumps to a different point in the video when the progress bar is clicked
        // let skipAhead = (e) => {
        //   var pos = (e.layerX - (e.currentTarget.offsetLeft + e.currentTarget.offsetParent.offsetLeft)) / e.currentTarget.offsetWidth;
        //   video.currentTime = pos * video.duration;
        // }
        // updateSeekTooltip uses the position of the mouse on the progress bar to
        // roughly work out what point in the video the user will skip to if
        // the progress bar is clicked at that point
        // let updatePlayBackPosition = (e) => {
        //   if (isDrag) {
        //     //console.log("progress bar position", event.layerX);
        //     var pos = (e.layerX - (e.currentTarget.offsetLeft + e.currentTarget.offsetParent.offsetLeft)) / e.currentTarget.offsetWidth;
        //     video.currentTime = pos * video.duration;
        //   }
        // }

        let resetVideoListeners = () => {
          video.removeEventListener("loadedmetadata", initializeVideo);
          video.removeEventListener("timeupdate", updateProgress);
          document
            .getElementById("hej_widget")
            .removeEventListener("click", handleClick);
        };

        let changeVideo = (urls, startUp, type, opts = undefined) => {
          (visibility_timeout = false), (timeout_seconds = 0); // available_urls = ["https://example.com/bogusvideo.mp4" , "http://techslides.com/demos/sample-videos/small.webm"];

          available_urls = urls;
          video.src = available_urls[0]; // video.load();

          if (opts) {
            options = opts;
            shortVideo = opts.shortVideo || false;
            (visibility_timeout = opts.visibility_timeout || false),
              (timeout_seconds = opts.timeout_seconds || 2);
          } // video.setAttribute('playsinline', 'playsinline');
          // video.setAttribute('preload', 'none');

          if (startUp && type != "landing") {
            video.removeAttribute("muted");
            video.removeAttribute("loop");
            video.muted = false;
            video.loop = false;
          }
        };

        let stopVideo = () => {
          video.pause();
          play.classList.remove("is-hidden"); // play.classList.remove("hide");
          // play.classList.add("show");

          play.animate(
            [
              {
                opacity: 0,
                transform: " translate(-50%, -50%) scale(1.3)",
              },
              {
                opacity: 1,
                transform: "translate(-50%, -50%) scale(1)",
              },
            ],
            {
              duration: 500,
            }
          );
        };

        let playVideo = () => {
          video.muted = false;
          video.play(); // play.classList.remove("show");
          // play.classList.add("hide");

          var play_anim_off = play.animate(
            [
              {
                opacity: 1,
                transform: " translate(-50%, -50%) scale(1)",
              },
              {
                opacity: 0,
                transform: "translate(-50%, -50%) scale(1.3)",
              },
            ],
            {
              duration: 500,
            }
          );

          play_anim_off.onfinish = function () {
            play.classList.add("is-hidden");
          };

          isFinished = false;
        }; // let resetVideoOptions = () => {
        //     playBackIndex = 0;
        //     video.pause();
        //     //let div = hej_video_playback_speed.querySelector("div");
        //     //div.textContent = "1x";
        //     video.style.objectFit = "cover";
        // }
        // formatTime takes a time length in seconds and returns the time in
        // minutes and seconds

        let formatTime = (timeInSeconds) => {
          const result = new Date(timeInSeconds * 1000)
            .toISOString()
            .substr(11, 8);
          return {
            minutes: result.substr(3, 2),
            seconds: result.substr(6, 2),
          };
        }; // let restartVideo = (e) => {
        //     e.stopPropagation();
        //     video.currentTime = 0;
        //     fit.innerHTML = `<svg fill="none" height="22" width="28">
        //     <path clip-rule="evenodd" d="M0 4a4 4 0 014-4h16a4 4 0 014 4v14a4 4 0 01-4 4H4a4 4 0 01-4-4V4zm4-2h16a2 2 0 012 2v2H2V4a2 2 0 012-2zM2 16v2a2 2 0 002 2h16a2 2 0 002-2v-2H2z" fill="#fff" fill-rule="evenodd"></path>
        //     </svg>`;
        //     video.style.objectFit = "cover";
        // }
        // let toggleSubtitles = (e) => {
        //     e.stopPropagation();
        //     let subtitle_container = document.getElementById("hej_widget_video_subtitles_wrapper");
        //     if(subtitles.classList.contains("active")){
        //         subtitles.classList.remove("active")
        //         if(subtitle_container){
        //             subtitle_container.style.display = "none";
        //         }
        //     }else{
        //         subtitles.classList.add("active");
        //         if(subtitle_container){
        //             subtitle_container.style.display = "flex";
        //         }
        //     }
        // }
        // let changePlayBackSpeed = (e) => {
        //     e.stopPropagation();
        //     playBackIndex == 2 ? playBackIndex = 0 : playBackIndex++;
        //     let div = hej_video_playback_speed.querySelector("div");
        //     div.textContent = playbackRate[playBackIndex] + "x";
        //     video.playbackRate = playbackRate[playBackIndex];
        // }
        // let fitVideo = (e) => {
        //     e.stopPropagation();
        //     let objectFitProperty = video.style.objectFit;
        //     if(objectFitProperty == '' || objectFitProperty == 'cover'){
        //         fit.innerHTML = `<svg fill="none" height="22" width="28">
        //         <rect fill="#fff" height="22" rx="4" width="28"></rect>
        //         </svg>`;
        //         video.style.objectFit = "contain";
        //     }else {
        //         fit.innerHTML = `<svg fill="none" height="22" width="28">
        //         <path clip-rule="evenodd" d="M0 4a4 4 0 014-4h20a4 4 0 014 4v14a4 4 0 01-4 4H4a4 4 0 01-4-4V4zm4-2h20a2 2 0 012 2v1H2V4a2 2 0 012-2zM2 17v1a2 2 0 002 2h20a2 2 0 002-2v-1H2z" fill="#fff" fill-rule="evenodd"></path>
        //         </svg>`;
        //         video.style.objectFit = "cover";
        //     }
        // }

        let loadVideo = () => {
          check_2_seconds = true;
          check_50_percent = true;
          check_75_percent = true;
          check_100_percent = true;
          console.log("video loaded");
          console.log("Video Source: " + video.src);
          console.log("Video Duration: " + video.duration);
          console.log("video currentTime", +video.currentTime);
          video.addEventListener("loadedmetadata", initializeVideo);
          video.addEventListener("timeupdate", updateProgress);

          if (shortVideo != undefined) {
            if (shortVideo) {
              video.setAttribute("muted", "muted");
              video.setAttribute("loop", "loop");
              video.loop = true;
              video.muted = true;
              play.classList.add("is-hidden");
              progress_bar_container.classList.add("hidden");
              let footer = document.getElementById("hej_widget_footer");

              if (footer && footer.classList.contains("is-hidden")) {
                footer.classList.remove("is-hidden");
              }
            } else {
              if (!first_interaction) {
                document
                  .getElementById("hej_widget")
                  .addEventListener("click", handleClick);
              } else {
                video.loop = false;
                video.muted = false;
                video.removeAttribute("muted");
                video.removeAttribute("loop");
                progress_bar_container.classList.remove("hidden");
                playVideo();
                document
                  .getElementById("hej_widget")
                  .addEventListener("click", handleClick);
              }
            }
          } else {
            document
              .getElementById("hej_widget")
              .addEventListener("click", handleClick);
          }

          document
            .getElementById("hej_widget_video_loader")
            .classList.remove("transparent");
          ChatController.sendMetrics(
            video.dataset.contentId,
            "video",
            "video_loaded",
            undefined,
            {
              mediaId: video.dataset.mediaId,
            }
          );
        };

        let logVideoError = () => {
          console.log(
            "Error " + video.error.code + "; details: " + video.error.message
          );

          if (currentVideoIndex == 0) {
            ChatController.sendMetrics(
              video.dataset.contentId,
              "video",
              "error_video_loaded",
              undefined,
              {
                mediaId: video.dataset.mediaId,
              }
            );

            if (window.location.href.includes("crawler")) {
              var err_1 =
                "Error crawler video " +
                video.error.code +
                "; details: " +
                video.error.message +
                "on video : " +
                video.src +
                "\nSite: " +
                window.location.href;
            } else {
              var err_1 =
                "Error video " +
                video.error.code +
                "; details: " +
                video.error.message +
                "on video : " +
                video.src +
                "\nSite: " +
                window.location.href;
            }

            http2.sendAlertError(undefined, {
              error_message: err_1,
            });
          } else if (currentVideoIndex > 0) {
            ChatController.sendMetrics(
              video.dataset.contentId,
              "video",
              "error_video_loaded_alternative",
              undefined,
              {
                mediaId: video.dataset.mediaId,
              }
            );

            if (window.location.href.includes("crawler")) {
              var err_1 =
                "Error crawler video alternative " +
                video.error.code +
                "; details: " +
                video.error.message +
                "on video : " +
                video.src +
                "\nSite: " +
                window.location.href;
            } else {
              var err_1 =
                "Error video alternative " +
                video.error.code +
                "; details: " +
                video.error.message +
                "on video : " +
                video.src +
                "\nSite: " +
                window.location.href;
            }

            http2.sendAlertError(undefined, {
              error_message: err_1,
            });
          }

          currentVideoIndex++;

          if (currentVideoIndex < available_urls.length) {
            video.src = available_urls[currentVideoIndex];
          }
        }; // funzione di log per l'oggetto

        let log = () => console.log("Video handler log");

        let setFirstInteraction = () => (first_interaction = true);

        let getFirstInteraction = () => first_interaction;

        return {
          init,
          changeVideo,
          playWhithoutPreview,
          playVideo,
          stopVideo,
          removeEventListener,
          log,
          removeVideoReference,
          resetVideoListeners,
          setFirstInteraction,
          getFirstInteraction,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/widgetUI.js
      const WidgetUI = (function () {
        let configuration = null;
        let button_letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L"];

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration;
        };

        let processVideo = (data, startUp) => {
          console.log("Data", data);
          let video_container = document.querySelector(
            ".hej_widget_video_container"
          );
          let video = document.querySelector(".hej_widget_video");
          let videos_container = document.getElementById(
            "hej_widget_main_content"
          );
          let interaction_container =
            document.getElementById("hej_widget_footer");
          let video_controls = document.getElementById("video-controls-slim");
          let video_header = document.getElementById("hej_widget_header");
          let h1 = null;
          VideoHandler.resetVideoListeners();
          video.dataset.contentId = data.content_id;
          data = data.messages[0];

          if (data.attachment) {
            if (data.attachment.payload) {
              if (data.attachment.payload.media_id) {
                video.dataset.mediaId = data.attachment.payload.media_id
                  ? data.attachment.payload.media_id._id
                  : undefined;
              }

              let preview_image = undefined;
              preview_image = data.attachment.payload.url
                ? data.attachment.payload.url.split("/mp4")[0] +
                  "/thumbnail.jpg"
                : undefined;

              if (
                data.attachment.payload.media_id &&
                data.attachment.payload.media_id.media &&
                data.attachment.payload.media_id.media.original &&
                data.attachment.payload.media_id.media.original
                  .preview_image_url
              ) {
                preview_image =
                  data.attachment.payload.media_id.media.original
                    .preview_image_url;
              }

              document.documentElement.style.setProperty(
                "--widget-video-preview",
                `url('${preview_image}')`
              );
            } // VideoHandler.resetVideoListeners();

            CommonHandler.removeElement(
              document.querySelector(".chatbot__message__choice")
            );
            CommonHandler.removeElement(
              document.getElementById("answer_container")
            );
            CommonHandler.removeElement(
              document.getElementById("answers_playground")
            );
            CommonHandler.removeElement(
              document.getElementById("text_overlay_container")
            );
            CommonHandler.removeElement(
              document.getElementById("hej_widget_video_subtitles_wrapper")
            );
            let header_inner_content = document.getElementById(
              "header_inner_content"
            );

            if (header_inner_content) {
              CommonHandler.removeElement(header_inner_content);
            }

            let footer = interaction_container.querySelector("footer");

            if (footer) {
              CommonHandler.removeElement(footer);
            }

            interaction_container.style.height = "";

            if (
              data.attachment &&
              data.attachment.payload &&
              data.attachment.payload.text
            ) {
              let message = data.attachment.payload.text; //check if message contain script

              const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;
              let found = message.match(regex);

              if (found) {
                if (found[0].includes("fbq")) {
                  // eseguire script solo se contiene fbq
                  console.log("found", found);
                  let scriptContent = CommonHandler.stripHtml(found);
                  message = message.replace(
                    /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
                    ""
                  );
                  let scriptElement = document.createElement("script");
                  scriptElement.type = "text/javascript";
                  scriptElement.textContent = scriptContent;
                  document
                    .getElementsByTagName("body")[0]
                    .appendChild(scriptElement);
                }
              }

              let hej_widget_header =
                document.getElementById("hej_widget_header");
              let fragment = new DocumentFragment();
              let div_header = document.createElement("div");
              div_header.id = "header_inner_content";
              div_header.innerHTML = message;
              fragment.append(div_header);
              hej_widget_header.append(fragment);
            }

            if (
              data.attachment &&
              data.attachment.payload &&
              data.attachment.payload.footer
            ) {
              let footer = document.createElement("footer");
              footer.innerHTML = data.attachment.payload.footer;
              interaction_container.append(footer);
            }

            ChatController.sendMetrics(
              video.dataset.contentId,
              "flow",
              "read",
              undefined,
              {
                mediaId: data.attachment.payload.media_id
                  ? data.attachment.payload.media_id._id
                  : undefined,
              }
            ); //start up video

            if (startUp) {
              video_container.addEventListener(
                "animationend",
                function (event) {
                  if (event.animationName == "slideLeft") {
                    document
                      .getElementById("hej_widget_video_loader")
                      .classList.add("transparent");
                    video.classList.remove("slideLeft"); // setTimeout(function () {
                    //     interaction_container.style.display = "";
                    // }, 500);

                    if (video_header) {
                      video_header.classList.remove("is-hidden");
                    }

                    if (h1) {
                      h1.classList.remove("is-hidden");
                    } // video_container.classList.remove("fade");

                    let header = document.getElementById(
                      "header_inner_content"
                    );

                    if (header) {
                      header.classList.remove("is-hidden");
                    }
                  }
                },
                false
              ); // video_container.addEventListener(
              //   "animationend",
              //   function (event) {
              //       if (event.animationName == "fade-out") {
              //         video_container.classList.remove("fade-out");
              //       }
              //   },
              //   false
              // );
              // let url = configuration.widget.subtype == "landing" ? (configuration.widget.video_preview_url || "https://s3-eu-west-1.amazonaws.com/media-hej/HJ%20DEV/video/1591960755678.mp4") : data.attachment.payload.url;
              //setup video

              let url = data.attachment.payload.url;
              let url2 = data.attachment.payload.url;

              if (data.attachment.payload.media_id) {
                console.log("video_container " + video_container.offsetWidth);
                let dimension = checkViewportSize(video_container); // url = url2 = data.attachment.payload.media_id.media[dimension] ? data.attachment.payload.media_id.media[dimension].url : data.attachment.payload.media_id.media.original.url;

                url = url2 =
                  data.attachment.payload.media_id.media.extralarge &&
                  data.attachment.payload.media_id.media.extralarge.url
                    ? data.attachment.payload.media_id.media.extralarge.url
                    : data.attachment.payload.url; // url = url2= data.attachment.payload.media_id.media.original && data.attachment.payload.media_id.media.original.url ? data.attachment.payload.media_id.media.original.url : data.attachment.payload.url;
                // if(data.attachment.payload.media_id.media.extralarge && data.attachment.payload.media_id.media.extralarge.url){
                //   url = data.attachment.payload.media_id.media.extralarge.url
                // } else if(data.attachment.payload.media_id.media.large && data.attachment.payload.media_id.media.large.url){
                //   url = data.attachment.payload.media_id.media.large.url
                // } else if(data.attachment.payload.media_id.media.medium && data.attachment.payload.media_id.media.medium.url){
                //   url = data.attachment.payload.media_id.media.medium.url
                // } else if(data.attachment.payload.media_id.media.small && data.attachment.payload.media_id.media.small.url){
                //   url = data.attachment.payload.media_id.media.small.url
                // }
                //url = url2 =  data.attachment.payload.media_id.media.extralarge ? data.attachment.payload.media_id.media.extralarge.url : (data.attachment.payload.media_id.media.large ? data.attachment.payload.media_id.media.large.url : data.attachment.payload.media_id.media.original.url);

                if (
                  data.attachment.payload.media_id.media.external_services &&
                  data.attachment.payload.media_id.media.external_services[0]
                ) {
                  url2 =
                    data.attachment.payload.media_id.media.external_services[0]
                      .url;
                }
              } // if(configuration.widget.subtype == "landing"){
              //   url = configuration.widget.video_preview_url || "https://s3-eu-west-1.amazonaws.com/media-hej/HJ%20DEV/video/1591960755678.mp4";
              // }

              if (configuration.widget.subtype == "landing") {
                VideoHandler.changeVideo(
                  [url, url2],
                  false,
                  configuration.widget.subtype,
                  {
                    shortVideo: data.attachment.payload.short_video || false,
                    visibility_timeout: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.flag
                      : false,
                    timeout_seconds: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.seconds
                      : 2,
                  }
                );
              } else {
                VideoHandler.changeVideo(
                  [url, url2],
                  startUp,
                  configuration.widget.subtype,
                  {
                    startUp,
                    subtype: configuration.widget.subtype,
                    url: url2,
                    shortVideo: data.attachment.payload.short_video || false,
                    visibility_timeout: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.flag
                      : false,
                    timeout_seconds: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.seconds
                      : 2,
                  }
                );
              } //if there are buttons

              if (
                data.attachment &&
                data.attachment.payload &&
                data.attachment.payload.buttons
              ) {
                processVideoButton(data.attachment.payload);
              } //fake initial loader

              setTimeout(function () {
                document.getElementById(
                  "hej_widget_video_loader"
                ).style.display = "none";
                let call_action_div = document.getElementById(
                  "hej_widget_video_call_action"
                );

                if (call_action_div) {
                  call_action_div.classList.add("show");
                }

                if (configuration.widget.video_play_button.type == "image") {
                  let image_play_button = call_action_div.querySelector("img");

                  if (image_play_button) {
                    image_play_button.classList.add("active");
                  }
                } // setTimeout(function () {
                //    // interaction_container.classList.remove("is-hidden");
                // }, 2000);
                //video_controls.classList.remove("is-hidden");

                let header = document.getElementById("header_inner_content");

                if (header) {
                  header.classList.remove("is-hidden");
                }

                if (configuration.widget.subtype != "landing") {
                  //VideoHandler.playWhithoutPreview();
                  VideoHandler.playVideo();
                }
              }, 500);
            } else {
              //if not startup
              interaction_container.classList.add("is-hidden"); // interaction_container.style.display = "none";
              // DISABLE THIS PART BEACAUSE IOS 15 HAS PROBLEM WITH AUTOPLAY
              // let video_next = document.createElement("video");
              // video_next.classList.add("hej_widget_video");
              // video_next.classList.add("active");
              // let next_video_container = document.createElement("div");
              // next_video_container.classList.add("hej_widget_video_container");
              // next_video_container.appendChild(video_next);
              // videos_container.appendChild(next_video_container);

              let url = data.attachment.payload.url;
              let url2 = data.attachment.payload.url;

              if (data.attachment.payload.media_id) {
                console.log(
                  "next_video_container " + video_container.offsetWidth
                );
                let dimension = checkViewportSize(video_container);
                url = url2 =
                  data.attachment.payload.media_id.media.extralarge &&
                  data.attachment.payload.media_id.media.extralarge.url
                    ? data.attachment.payload.media_id.media.extralarge.url
                    : data.attachment.payload.url; // url = url2= data.attachment.payload.media_id.media.original && data.attachment.payload.media_id.media.original.url ? data.attachment.payload.media_id.media.original.url : data.attachment.payload.url;
                // if(data.attachment.payload.media_id.media.extralarge && data.attachment.payload.media_id.media.extralarge.url){
                //   url = data.attachment.payload.media_id.media.extralarge.url
                // } else if(data.attachment.payload.media_id.media.large && data.attachment.payload.media_id.media.large.url){
                //   url = data.attachment.payload.media_id.media.large.url
                // } else if(data.attachment.payload.media_id.media.medium && data.attachment.payload.media_id.media.medium.url){
                //   url = data.attachment.payload.media_id.media.medium.url
                // } else if(data.attachment.payload.media_id.media.small && data.attachment.payload.media_id.media.small.url){
                //   url = data.attachment.payload.media_id.media.small.url
                // }

                if (
                  data.attachment.payload.media_id.media.external_services &&
                  data.attachment.payload.media_id.media.external_services[0]
                ) {
                  url2 =
                    data.attachment.payload.media_id.media.external_services[0]
                      .url;
                }
              } //

              console.log(
                "next_video_container " + video_container.offsetWidth
              ); //if there are buttons, process them

              if (
                data.attachment &&
                data.attachment.payload &&
                data.attachment.payload.buttons
              ) {
                processVideoButton(data.attachment.payload);
              } // SUBTITLES CODE
              // if (false) {
              //     let track_wrapper = document.createElement("div");
              //     track_wrapper.id = "hej_widget_video_subtitles_wrapper"
              //     let track_subtitles = document.createElement("span");
              //     track_wrapper.appendChild(track_subtitles);
              //     let track = document.createElement("track");
              //     track.label = "Italian";
              //     track.kind = "subtitles";
              //     track.srclang = "it";
              //     track.src = "http://localhost:3333/public/data/test.vtt";
              //     track.setAttribute('default', true);
              //     track.addEventListener("cuechange", function () {
              //         track.track.mode = "hidden";
              //         let cues = this.track.activeCues;
              //         if (cues.length > 0) {
              //             //console.log(cues[0].text)
              //             track_subtitles.textContent = cues[0].text;
              //         }
              //     });
              //     video_next.appendChild(track);
              //     let answer_container = document.getElementById("answer_container");
              //     answer_container.appendChild(track_wrapper);
              // }
              //play  change video animation

              video.classList.add("slideLeft"); // trick: delay for fine-tuned animation
              // setTimeout(function () {
              // }, 500)

              setTimeout(function () {
                document.getElementById(
                  "hej_widget_video_loader"
                ).style.display = "none";
                VideoHandler.changeVideo(
                  [url, url2],
                  startUp,
                  configuration.widget.subtype,
                  {
                    shortVideo: data.attachment.payload.short_video || false,
                    visibility_timeout: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.flag
                      : false,
                    timeout_seconds: data.attachment.payload.timeout_video
                      ? data.attachment.payload.timeout_video.seconds
                      : 2,
                  }
                ); //video_container.classList.add("fade-out");
                //VideoHandler.playVideo();
              }, 300);
            }
          } else {
            handleVideoError(data);
          }
        };

        let processVideoButton = (data) => {
          let interaction_container =
            document.getElementById("hej_widget_footer");
          let obj = null; // data.template_type = "swipe";

          if (
            data.template_type == "button" &&
            data.buttons &&
            data.buttons.length > 0
          ) {
            obj = createSimpleButtonContent(data);
            interaction_container.appendChild(obj.content_message);
            obj.content_message.classList.remove("is-hidden");
            obj.content_message.classList.remove("is-loading");
          } else if (
            data.template_type == "generic" &&
            data.elements &&
            data.elements.length > 0
          ) {
            obj = createSimpleCardContent(data);
            interaction_container.style.height = "45%";
            interaction_container.appendChild(obj.content_message);
            obj.content_message.classList.remove("is-hidden");
            obj.content_message.classList.remove("is-loading");
            setTimeout(function () {
              enableSlideshow(obj);
            }, 800);
          } else if (data.template_type == "form") {
            let form_id = data.form._id + "_" + esm_browser_v4();
            obj = createFormContent(data, form_id);
            interaction_container.style.height = `${
              data.form.layout && data.form.layout.container_height
                ? data.form.layout.container_height
                : "auto"
            }`; // interaction_container.style.height = "90%";

            interaction_container.appendChild(obj.content_message);
            CommonHandler.setFormObject(data.form);
            FormHandler.init(obj.language, form_id, data.form.max_error);
            FormHandler.addValidationFields(obj.elements);

            if (data.form.error && data.form.error && data.form.error.flag) {
              FormHandler.setErrors();
            }

            obj.content_message.classList.remove("is-hidden");
            obj.content_message.classList.remove("is-loading");
          } else if (data.template_type == "interaction") {
            obj = createSwipeContent(data);
            interaction_container.style.height = "90%";
            interaction_container.appendChild(obj.content_message);
            obj.content_message.classList.remove("is-hidden");
            obj.content_message.classList.remove("is-loading");
          } // process open button answer
          // else if (data.template_type == "open") {
          //   let open_button_div = document.createElement("div");
          //   open_button_div.id = "answer_container"
          //   open_button_div.innerHTML = `<span class="open_button_info">Come vorresti ripondere?</span><div><button aria-label="video" data-type="video" class="square-button video"><svg fill="none" height="24" width="27"><rect height="16" rx="3" width="18" y="4"></rect><path clip-rule="evenodd" d="M20 10.425a1 1 0 01.563-.899l5-2.432a1 1 0 011.437.9v8.012a1 1 0 01-1.413.91l-5-2.264a1 1 0 01-.587-.91v-3.317z"></path></svg>video</button><button aria-label="audio" data-type="audio" class="square-button"><svg height="24" width="27"><path clip-rule="evenodd" d="M14 0a4 4 0 00-4 4v8a4 4 0 008 0V4a4 4 0 00-4-4zM6 8.846a.847.847 0 011.696 0v3.33c0 3.476 2.822 6.293 6.304 6.293s6.304-2.817 6.304-6.293v-3.33a.847.847 0 011.696 0v3.33a7.991 7.991 0 01-7.152 7.93v2.2h2.657a.847.847 0 110 1.694h-7.01a.847.847 0 110-1.693h2.657v-2.201A7.991 7.991 0 016 12.176v-3.33z" fill-rule="evenodd"></path></svg>audio</button><button aria-label="testo" data-type="text" class="square-button"><svg height="24" width="27"><path clip-rule="evenodd" d="M6 3a2 2 0 00-2 2v15a2 2 0 002 2h15a2 2 0 002-2V5a2 2 0 00-2-2H6zm6.252 12.993h-1.264V18h5.224v-2.007h-1.288V8.837h1.682v1.436h2.64V6.896h-11.1v3.377h2.625V8.837h1.48v7.156z" fill-rule="evenodd"></path></svg>testo</button></div>`;
          //   interaction_container.appendChild(open_button_div);
          //   let text_answer_button = document.querySelector("button[data-type='text']");
          //   let audio_answer_button = document.querySelector("button[data-type='audio']");
          //   text_answer_button.addEventListener("click", function (e) {
          //     addVideoAnswerListener(e, "text")
          //   });
          //   audio_answer_button.addEventListener("click", function (e) {
          //     addVideoAnswerListener(e, "audio")
          //   });
          // }
        };

        let enableSlideshow = (obj) => {
          if (obj.elements_qty > 1) {
            new Glider(
              document.querySelector(".glider_" + obj.content_message_id),
              {
                slidesToShow: 1.5,
                slidesToScroll: 1,
                draggable: true,
                dots: ".dots_" + obj.content_message_id,
                arrows: {
                  prev: "#glider-prev_" + obj.content_message_id,
                  next: "#glider-next_" + obj.content_message_id,
                },
                responsive: [
                  {
                    // screens greater than >= 775px
                    breakpoint: 768,
                    settings: {
                      // Set to `auto` and provide item width to adjust to viewport
                      slidesToShow: 2.5,
                      slidesToScroll: 2,
                    },
                  },
                  {
                    // screens greater than >= 1024px
                    breakpoint: 1024,
                    settings: {
                      slidesToShow: 2.5,
                      slidesToScroll: 2,
                    },
                  },
                ],
              }
            );
          }
        };

        let addVideoAnswerListener = (evt, type) => {
          evt.stopPropagation();
          VideoHandler.stopVideo();
          let interaction_container =
            document.getElementById("hej_widget_footer");
          let open_button_div = document.getElementById("answer_container");
          let answers_playground = document.createElement("div");
          answers_playground.id = "answers_playground";
          answers_playground.classList.add(type);

          if (type == "text") {
            answers_playground.innerHTML = `<textarea aria-label="Risposta in testo qui" name="text_answer" placeholder="Scrivi qui..."  class="hej_widget_video_text_answer"></textarea><div><button aria-label="Spedire" disabled="" type="button" id="answer_process" data-type="answer_process"><svg height="24" width="30"><path d="M28.45 10.322L18.856.731a2.348 2.348 0 10-3.321 3.318l5.67 5.662H2.348a2.348 2.348 0 000 4.696h18.805l-5.617 5.627a2.348 2.348 0 003.321 3.318l9.592-9.591a2.33 2.33 0 00.688-1.72 2.351 2.351 0 00-.688-1.72z"></path></svg></button><button aria-label="Indietro" type="button" id="answer_cancel"><svg height="12" width="12"><path  fill="#fff" clip-rule="evenodd" d="M1.707.293A1 1 0 00.293 1.707L4.536 5.95.293 10.192a1 1 0 101.414 1.415L5.95 7.364l4.242 4.243a1 1 0 001.415-1.415L7.364 5.95l4.243-4.243A1 1 0 0010.193.293L5.95 4.536 1.707.293z" fill-rule="evenodd"></path></svg></button></div>`;
          } else {
            answers_playground.innerHTML = `<textarea aria-label="Risposta in testo qui" name="text_answer" placeholder="Scrivi qui..."  class="hej_widget_video_text_answer"></textarea><div><button id="user_message_voice" class="user_message_voice"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -6 23 40" ><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"></path></svg></button><button aria-label="Spedire" disabled="" type="button" id="answer_process" data-type="answer_process"><svg height="24" width="30"><path d="M28.45 10.322L18.856.731a2.348 2.348 0 10-3.321 3.318l5.67 5.662H2.348a2.348 2.348 0 000 4.696h18.805l-5.617 5.627a2.348 2.348 0 003.321 3.318l9.592-9.591a2.33 2.33 0 00.688-1.72 2.351 2.351 0 00-.688-1.72z"></path></svg></button><button aria-label="Indietro" type="button" id="answer_cancel"><svg height="12" width="12"><path  fill="#fff" clip-rule="evenodd" d="M1.707.293A1 1 0 00.293 1.707L4.536 5.95.293 10.192a1 1 0 101.414 1.415L5.95 7.364l4.242 4.243a1 1 0 001.415-1.415L7.364 5.95l4.243-4.243A1 1 0 0010.193.293L5.95 4.536 1.707.293z" fill-rule="evenodd"></path></svg></button></div>`;
          } // answers_playground.addEventListener("click", function(e){e.stopPropagation()});

          interaction_container.appendChild(answers_playground);
          interaction_container.style.height = "100%";
          open_button_div.style.display = "none";
          let cancel_button = document.getElementById("answer_cancel");
          let process_button = document.getElementById("answer_process");
          cancel_button.addEventListener("click", function (e) {
            e.stopPropagation();
            interaction_container.style.height = "";
            open_button_div.style.display = "";
            CommonHandler.removeElement(
              document.getElementById("answers_playground")
            );
          });
          let hej_user_input = document.querySelector(
            "textarea[name='text_answer']"
          );
          hej_user_input.focus();
          hej_user_input.addEventListener("keyup", function (e) {
            if (e.target.value != "") {
              process_button.disabled = false;
            } else {
              process_button.disabled = true;
            }
          });

          if (type == "audio") {
            let user_message_voice =
              document.getElementById("user_message_voice");
            user_message_voice.addEventListener("click", () => {
              recognition.start();
              user_message_voice
                .getElementsByTagName("svg")[0]
                .classList.add("rec");
            });
            SpeechRecognition =
              window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
              recognition = new SpeechRecognition();
              recognition.lang = "it-IT";
              recognition.interimResults = false;
              recognition.addEventListener("result", (e) => {
                let last = e.results.length - 1;
                let text = e.results[last][0].transcript;
                console.log("Confidence: " + e.results[0][0].confidence);
                console.log("Voice Text: " + text);
                user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
                let hej_user_input = document.querySelector(
                  "textarea[name='text_answer']"
                );
                hej_user_input.value = text;

                if (text != "") {
                  process_button.disabled = false;
                } else {
                  process_button.disabled = true;
                } //process_button.click();
              });
              recognition.addEventListener("end", function () {
                user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
              });
            } else {
              console.log("Speech Recognition non è supportata");
            }
          }
        };

        let handleVideoError = (data) => {
          //VideoHandler.removeEventListener();
          let interaction_container =
            document.getElementById("hej_widget_footer");
          let open_button_div = document.getElementById("answer_container");
          let play_button = document.getElementById("hej_widget_video_play");
          let hej_widget = document.getElementById("hej_widget");
          let hej_widget_header = document.getElementById("hej_widget_header"); //CommonHandler.removeElement(document.querySelector(".hej_widget_video_container"));

          CommonHandler.removeElement(
            document.querySelector(".hej_widget_video")
          );
          CommonHandler.removeElement(
            document.querySelector(".chatbot__message__choice")
          );
          CommonHandler.removeElement(
            document.getElementById("answer_container")
          );
          CommonHandler.removeElement(
            document.getElementById("answers_playground")
          );
          CommonHandler.removeElement(
            document.getElementById("text_overlay_container")
          );
          CommonHandler.removeElement(
            document.getElementById("hej_widget_video_subtitles_wrapper")
          );
          CommonHandler.removeElement(
            document.getElementById("answers_playground")
          );
          CommonHandler.removeElement(
            document.getElementById("text_overlay_container")
          );
          VideoHandler.removeVideoReference();
          play_button.classList.add("is-hidden");
          interaction_container.style.height = "";
          let div = document.createElement("div");
          div.id = "text_overlay_container";
          div.classList.add("error");
          let h1 = null;
          h1 = document.createElement("h1");
          h1.textContent = data.text;
          h1.classList.add("is-hidden");
          div.appendChild(h1);
          hej_widget_header.classList.add("is-hidden");
          hej_widget.insertBefore(div, hej_widget_header);
          h1.classList.remove("is-hidden");
        }; // creo contenuto bottone

        let createSimpleButtonContent = (data) => {
          let elements = data.buttons;
          let div_choice = document.createElement("div");
          div_choice.id = "answer_container";
          div_choice.classList.add("buttons");
          let choice_info = document.createElement("span");
          choice_info.classList.add("open_button_info");
          let language = configuration.language
            ? configuration.language.code
            : "it"; //choice_info.textContent = "Clicca su un pulsante ⬇";

          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          ); // choice_info.textContent = currentIdiom.button_text;

          choice_info.textContent = data.caption
            ? data.caption
            : currentIdiom && currentIdiom.button_text
            ? currentIdiom.button_text
            : "Clicca su un pulsante ⬇";
          let div_choice_buttons = document.createElement("div");
          elements.forEach((buttonElement, index) => {
            if (
              buttonElement.type == "postback" ||
              buttonElement.type == "web_url" ||
              buttonElement.type == "video_chat"
            ) {
              let button = document.createElement("button");
              button.dataset.type =
                buttonElement.type == "postback"
                  ? "message_action"
                  : buttonElement.type == "web_url"
                  ? "link_action"
                  : "video_action";
              button.dataset.button_type =
                buttonElement.type == "postback"
                  ? "postback"
                  : buttonElement.type == "web_url"
                  ? "web_url"
                  : "video_chat";
              button.dataset.content =
                buttonElement.type == "postback"
                  ? buttonElement.payload
                  : buttonElement.type == "web_url"
                  ? buttonElement.url
                  : buttonElement.session
                  ? buttonElement.session.id
                  : CommonHandler.getRandomString(16);
              button.dataset.text = buttonElement.title;

              if (buttonElement.custom_class) {
                button.classList.add(buttonElement.custom_class);
              }

              button.innerHTML = `<span class="button_letters">${button_letters[index]}</span><span>${buttonElement.title}</span>`;
              button.dataset.target = buttonElement.open_in_page;
              button.addEventListener("animationend", (e) => {
                e.target.classList.remove("selected");
              });
              button.addEventListener("click", function (e) {
                e.currentTarget.classList.add("selected");

                if (data.short_video && !VideoHandler.getFirstInteraction()) {
                  VideoHandler.setFirstInteraction();
                  let video = document.querySelector(".hej_widget_video");
                  ChatController.sendMetrics(
                    video.dataset.contentId,
                    "video",
                    "first_interaction",
                    undefined,
                    {
                      mediaId: video.dataset.mediaId,
                    }
                  );
                }
              });
              if (buttonElement.enable_push)
                button.dataset.type = "push_action";

              if (
                buttonElement.custom_code &&
                buttonElement.custom_code != ""
              ) {
                if (buttonElement.custom_code.includes("fbq")) {
                  button.addEventListener("click", function () {
                    let f = new Function(buttonElement.custom_code)();
                    return f;
                  });
                } else {
                  button.dataset.event = buttonElement.custom_code;
                }
              }

              div_choice_buttons.appendChild(button);
            }
          });
          div_choice.appendChild(choice_info);
          div_choice.appendChild(div_choice_buttons);
          return {
            content_message: div_choice,
            message_type: "button",
          };
        }; // creo carousel risposta

        let createSimpleCardContent = (data) => {
          let elements = data.elements;
          let card_id = CommonHandler.getRandomString(16);
          let div_choice = document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");
          div_choice.classList.add("cards_container"); //div_choice.classList.add("no_margin");

          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = document.createElement("span");
          choice_info.classList.add("open_button_info");
          choice_info.style.textAlign = "center";
          choice_info.style.maxWidth = "100vw";
          choice_info.style.width = "100%";
          choice_info.style.marginBottom = "5px"; // choice_info.textContent = "Clicca su un pulsante ⬇";

          let language = configuration.language
            ? configuration.language.code
            : "it";
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent = data.caption
            ? data.caption
            : currentIdiom && currentIdiom.card_text
            ? currentIdiom.card_text
            : "Clicca su un pulsante ⬇"; //choice_info.style.marginLeft = "4%";

          let div_choice_cards = document.createElement("div");
          div_choice_cards.classList.add("chatbot__message__choice__cards");
          div_choice_cards.classList.add("glider_" + card_id);
          elements.forEach((cardElement) => {
            let card = document.createElement("div"),
              img_container,
              overlay_gradient_div,
              img,
              card_bottom_container,
              title = document.createElement("h1"),
              subtitle = document.createElement("h2");
            card.classList.add("chatbot__message__choice__cards__card");
            card.style.position = "relative";

            if (
              cardElement.image_url != "" &&
              cardElement.image_url != undefined
            ) {
              img_container = document.createElement("div");
              img_container.classList.add("img_container");
              img_container.style.height = "100%";
              img = document.createElement("img");
              img.alt = "photo card";
              img.src = cardElement.image_url;
              img_container.appendChild(img);
              card.appendChild(img_container);
              overlay_gradient_div = document.createElement("div");
              overlay_gradient_div.classList.add("overlay_gradient_div");
              card.appendChild(overlay_gradient_div); //card.style.backgroundImage = `url(${cardElement.image_url})`;
            }

            card_bottom_container = document.createElement("div");
            card_bottom_container.classList.add("card_bottom_container");
            title.innerHTML = cardElement.title; //subtitle.innerHTML = cardElement.subtitle;
            //card.appendChild(title);
            //card.appendChild(subtitle);

            card_bottom_container.appendChild(title);

            if (
              cardElement.hasOwnProperty("buttons") &&
              cardElement.buttons.length > 0
            ) {
              let button_container = document.createElement("ul");
              cardElement.buttons.forEach((buttonElement) => {
                if (
                  buttonElement.type == "postback" ||
                  buttonElement.type == "web_url" ||
                  buttonElement.type == "video_chat"
                ) {
                  let li = document.createElement("li");
                  let button = document.createElement("button");
                  button.dataset.type =
                    buttonElement.type == "postback"
                      ? "message_action"
                      : buttonElement.type == "web_url"
                      ? "link_action"
                      : "video_action";
                  button.dataset.button_type =
                    buttonElement.type == "postback"
                      ? "postback"
                      : buttonElement.type == "web_url"
                      ? "web_url"
                      : "video_chat";
                  button.dataset.content =
                    buttonElement.type == "postback"
                      ? buttonElement.payload
                      : buttonElement.type == "web_url"
                      ? buttonElement.url
                      : CommonHandler.getRandomString(16);
                  button.dataset.text = buttonElement.title;
                  button.innerHTML = buttonElement.title;
                  button.dataset.target = buttonElement.open_in_page;
                  if (buttonElement.enable_push)
                    button.dataset.type = "push_action";

                  if (
                    buttonElement.custom_code &&
                    buttonElement.custom_code != ""
                  ) {
                    if (buttonElement.custom_code.includes("fbq")) {
                      button.addEventListener("click", function () {
                        let f = new Function(buttonElement.custom_code)();
                        return f;
                      });
                    } else {
                      button.dataset.event = buttonElement.custom_code;
                    }
                  } // else {
                  //   button.dataset.event = "process('alert', 'ciao')";
                  // }

                  li.appendChild(button);
                  button_container.appendChild(li);
                }
              });
              card_bottom_container.appendChild(button_container);

              if (elements.length == 1) {
                card.style.margin = "0 auto";
              }
            }

            card.appendChild(card_bottom_container);
            div_choice_cards.appendChild(card);
          });

          if (elements.length > 1) {
            let button_prev = document.createElement("button");
            button_prev.setAttribute("aria-label", "Previous");
            button_prev.classList.add("glider-prev");
            button_prev.id = "glider-prev_" + card_id;
            button_prev.textContent = "<";
            let button_next = document.createElement("button");
            button_next.setAttribute("aria-label", "Next");
            button_next.classList.add("glider-next");
            button_next.id = "glider-next_" + card_id;
            button_next.textContent = ">";
            let div_dots = document.createElement("div");
            div_dots.setAttribute("role", "tablist");
            div_dots.classList.add("dots_" + card_id);
            div_choice.appendChild(button_prev);
            div_choice.appendChild(button_next);
            div_choice.appendChild(choice_info);
            div_choice.appendChild(div_choice_cards);
            div_choice.appendChild(div_dots);
          } else {
            //div_choice.style.padding="12px 0px";
            if (
              elements[0].hasOwnProperty("buttons") &&
              elements[0].buttons.length > 0
            ) {
              choice_info.textContent =
                "Clicca sui bottoni della scheda per proseguire ⬇";
              div_choice.appendChild(choice_info);
            }

            div_choice.appendChild(div_choice_cards);
          }

          return {
            content_message: div_choice,
            content_message_id: card_id,
            message_type: "card",
            elements_qty: elements.length,
          };
        };

        let createFormContent = (data = undefined, form_id) => {
          // data.form = makeFakeData();
          let div_choice = document.createElement("div");
          div_choice.id = "answer_container";
          div_choice.classList.add("form");

          if (data.form.layout.type == "modal") {
            div_choice.classList.add("full_height");
          }

          let choice_info = document.createElement("span");
          let groupElements = [];
          choice_info.classList.add("open_button_info");
          let language = configuration.language
            ? configuration.language.code
            : "it";
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent = data.caption
            ? data.caption
            : currentIdiom && currentIdiom.widget_video_form_caption
            ? currentIdiom.widget_video_form_caption
            : "Compila il form ⬇";
          let div = null,
            div_radio_group = null,
            div_checkbox_group = null,
            span = null,
            form_container = null,
            form_element = null,
            form_inner_container = null; // build html elements

          form_container = document.createElement("div");
          form_container.id = "hej_form_container_" + form_id;
          form_container.classList.add(data.form.layout.type);

          if (data.form.layout.type == "modal") {
            form_container.classList.add("full");
          } // if(data.form.layout.type == "modal") {
          //   form_container.classList.add("minified");
          // }
          // form_container.addEventListener("click", (e) =>{
          //   // stop propagation on click for element hejchatbot on app.js file
          //   e.stopPropagation();
          //   form_container.classList.remove("minified");
          //   form_container.classList.add("expanded");
          // });

          form_inner_container = document.createElement("div");
          form_inner_container.id = "form_inner_container_" + form_id;
          form_inner_container.classList.add("form_inner_container");
          form_element = document.createElement("form");
          form_element.id = "hej_form_" + form_id;
          form_element.classList.add("hej_form"); // form_element.autocomplete = "off";

          form_element.setAttribute("novalidate", "novalidate"); // span = document.createElement("span");
          // span.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`;
          // span.id = "close_form_container";
          // span.addEventListener("click", (e)=> {
          //    // stop propagation on click for element hejchatbot on app.js file
          //   e.stopPropagation()
          //   form_container.classList.remove("expanded");
          //   form_container.classList.add("minified");
          // })
          // form_container.appendChild(span);

          if (
            data &&
            data.form &&
            data.form.groups &&
            data.form.groups.length > 0
          ) {
            let fieldset = null;
            let legend = null;
            let title = null;
            let subtitle = null;
            data.form.groups.forEach((group) => {
              (div_radio_group = null),
                (div_checkbox_group = null),
                (title = null);
              subtitle = null;

              if (
                group.layout &&
                group.layout.show_title &&
                group.layout.title != ""
              ) {
                title = document.createElement("h4");
                title.id = `title_${group._id}`;
                title.textContent = group.layout.title;
                if (title) form_element.appendChild(title);
              }

              if (
                group.layout &&
                group.layout.show_subtitle &&
                group.layout.subtitle != ""
              ) {
                subtitle = document.createElement("h5");
                subtitle.id = `subtitle_${group._id}`;
                subtitle.textContent = group.layout.subtitle;

                if (fieldset) {
                  if (subtitle) fieldset.appendChild(subtitle);
                }
              }

              if (group && group.elements && group.elements.length > 0) {
                if (!fieldset && subtitle) {
                  form_element.appendChild(subtitle);
                }

                group.elements.forEach((element) => {
                  element.group_id = group._id;

                  if (
                    element.type == "input" &&
                    element.subtype == "checkbox" &&
                    group.multiple
                  ) {
                    if (!div_checkbox_group) {
                      div_checkbox_group = document.createElement("div");
                      div_checkbox_group.id = `div_checkbox_group_${group._id}`;
                      div_checkbox_group.classList.add(
                        "checkbox_group_container"
                      );

                      if (element.label && element.label != "") {
                        let span = document.createElement("h6");

                        if (element.info && element.info.master) {
                          span.textContent = element.label;
                          div_checkbox_group.appendChild(span);
                        }
                      }
                    }
                  }

                  if (element.type == "input" && element.subtype == "radio") {
                    if (!div_radio_group) {
                      div_radio_group = document.createElement("div");
                      div_radio_group.id = `div_radio_group_${group._id}`;
                      div_radio_group.classList.add("radio_group_container");

                      if (element.label && element.label != "") {
                        let span = document.createElement("h6");

                        if (element.info && element.info.master) {
                          span.textContent = element.label;
                          div_radio_group.appendChild(span);
                        }
                      }
                    }
                  }

                  div = document.createElement("div");
                  div.classList.add("form-control");
                  div.classList.add(
                    element.type == "input" ? element.subtype : element.type
                  );
                  div.id = `field_container_${element._id}`;
                  let htmlElement = CreateFormFieldHtmlElement(
                    element,
                    group._id
                  );
                  div.appendChild(htmlElement);

                  if (element.type == "input" && element.subtype == "radio") {
                    div_radio_group.appendChild(div);
                  }

                  if (
                    element.type == "input" &&
                    element.subtype == "checkbox" &&
                    group.multiple
                  ) {
                    div_checkbox_group.appendChild(div);
                  }

                  if (fieldset) {
                    if (element.type == "input" && element.subtype == "radio") {
                      fieldset.appendChild(div_radio_group);
                    } else if (
                      element.type == "input" &&
                      element.subtype == "checkbox" &&
                      group.multiple
                    ) {
                      fieldset.appendChild(div_checkbox_group);
                    } else {
                      fieldset.appendChild(div);
                    }
                  } else {
                    if (element.type == "input" && element.subtype == "radio") {
                      form_element.appendChild(div_radio_group);
                    } else if (
                      element.type == "input" &&
                      element.subtype == "checkbox" &&
                      group.multiple
                    ) {
                      form_element.appendChild(div_checkbox_group);
                    } else {
                      form_element.appendChild(div);
                    }
                  }
                });
                groupElements.push(...group.elements);

                if (fieldset) {
                  form_element.appendChild(fieldset);
                }

                form_inner_container.appendChild(form_element);
                form_container.appendChild(form_inner_container);
              }
            }); // CommonHandler.setFormObject(data.form);
            // FormHandler.init(language);
            // FormHandler.addValidationFields(groupElements);
          }

          let button_submit = document.createElement("button");
          button_submit.classList.add("hej_form_submit");
          button_submit.textContent = data.form.layout
            ? data.form.layout.submit_button.title
            : "Invia";

          if (
            data.form &&
            data.form.layout &&
            data.form.layout.submit_button.custom_class
          ) {
            button_submit.classList.add(
              data.form.layout.submit_button.custom_class
            );
          }

          if (
            data.form &&
            data.form.layout &&
            data.form.layout.submit_button &&
            data.form.layout.submit_button.hasOwnProperty("show") &&
            !data.form.layout.submit_button.show
          ) {
            button_submit.style.display = "none";
          }

          button_submit.type = "submit";
          button_submit.setAttribute("form", "hej_form_" + form_id);
          div_choice.appendChild(choice_info);
          div_choice.appendChild(form_element);
          div_choice.appendChild(button_submit); // if(data.form.layout.type == "inBubble"){
          //   obj.content_message.appendChild(form_container);
          // }else if(data.form.layout.type == "modal"){
          //   document.body.appendChild(form_container);
          // }

          return {
            content_message: div_choice,
            elements: groupElements,
            language: language,
            message_type: "form",
          };
        };

        let CreateFormFieldHtmlElement = (element, group_id) => {
          let fragment = new DocumentFragment();
          let div = document.createElement("div");
          let div_error = document.createElement("div");
          div_error.classList.add("error_container");
          div_error.id = `${element.type}_${element.subtype}_${element._id}_error_container`;

          switch (element.type) {
            case "input":
              if (element.subtype != "checkbox" && element.subtype != "radio") {
                let label = document.createElement("label");
                label.textContent = element.label;
                let input = document.createElement("input");
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.classList.add("input");
                input.type = element.subtype;
                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                ); // fake attribute to prevent autocomplete. Only solution that work till 24/02/2023
                // input.autocomplete = "new-form-field";

                if (!element.attributes.autocomplete) {
                  input.autocomplete = "new-form-field";
                }

                if (element.attributes.placeholder) {
                  input.placeholder = element.attributes.placeholder;
                }

                if (element.subtype == "tel") {
                  input.type = "tel";
                  input.inputMode = "tel";
                  input.pattern = "[0-9]*";
                } else if (
                  element.subtype == "zipcode" ||
                  element.subtype == "number"
                ) {
                  input.type = "tel";
                  input.inputMode = "numeric";
                  input.pattern = "[0-9]*";
                } else if (element.subtype == "email") {
                  input.inputMode = "email";
                } // else if(element.subtype == "date"){
                //   input.dataset.type = "date";
                //   input.value = new Date();
                //   input.valueAsDate = new Date();
                // }
                else if (element.subtype == "date_custom") {
                  input.placeholder = "GG/MM/AAAA";
                  input.dataset.type = "date_custom";
                  input.type = "tel";
                  FormHandler.setupCustomEventListener({
                    type: "date_custom",
                    content: input,
                  });
                }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id;

                if (element.error && element.error.flag) {
                  input.value = element.info.text;
                }

                if (element.custom_class) {
                  div.classList.add(element.custom_class);
                }

                div.append(label);
                div.append(input);
                fragment.append(div);
                fragment.append(div_error);
              } else if (element.subtype == "checkbox") {
                if (
                  element.label &&
                  element.label != "" &&
                  !element.attributes.multiple
                ) {
                  let h6_label = document.createElement("h6");
                  h6_label.textContent = element.label;
                  div.append(h6_label);
                }

                let inner_div = document.createElement("div");
                inner_div.classList.add("inner_checkbox_div");

                if (element.custom_class) {
                  inner_div.classList.add(element.custom_class);
                }

                let label = document.createElement("label");
                label.innerHTML = element.text; // label.textContent = element.text;
                // label.textContent = "Acconsenti al trattamento dei tuoi Dati personali per le finalità di cui al punto 4, lett. b), ossia al compimento (e successivo utilizzo) di sondaggi e/o ricerche di mercato effettuate nell’interesse dei Contitolari e contattarTi, ai recapiti forniti, al fine di verificare la qualità del servizio reso nei miei confronti ed il tuo grado di soddisfazione anche mediante un’indagine di NPS?";

                label.classList.add("checkbox");
                label.setAttribute("for", `checkbox_${element._id}`);
                let input = document.createElement("input");
                input.type =
                  element && element.subtype ? element.subtype : "text";
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.checked = element.attributes.checked; // if(element.custom_class){
                //   input.classList.add(element.custom_class);
                // }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id;
                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                );

                if (element.error && element.error.flag) {
                  input.checked = element.info.checked;
                }

                inner_div.append(input);
                inner_div.append(label);
                div.append(inner_div);
                fragment.append(div);

                if (!element.attributes.multiple) {
                  fragment.append(div_error);
                }
              } else if (element.subtype == "radio") {
                // if(element.label){
                //   let span_label = document.createElement("span");
                //   span_label.textContent = element.label;
                //   div.append(span_label);
                // }
                let label = document.createElement("label");
                label.innerHTML = element.text; // label.textContent = element.text;
                // label.textContent = "Acconsenti al trattamento dei tuoi Dati personali per le finalità di cui al punto 4, lett. b), ossia al compimento (e successivo utilizzo) di sondaggi e/o ricerche di mercato effettuate nell’interesse dei Contitolari e contattarTi, ai recapiti forniti, al fine di verificare la qualità del servizio reso nei miei confronti ed il tuo grado di soddisfazione anche mediante un’indagine di NPS?";

                label.classList.add("radio");
                label.setAttribute("for", `radio_${element._id}`);
                let input = document.createElement("input");
                input.type =
                  element && element.subtype ? element.subtype : "text";
                input.id = `${element.type}_${element.subtype}_${element._id}`;
                input.name = `radio_${group_id}`;
                input.checked = element.info.master;

                if (element.custom_class) {
                  div.classList.add(element.custom_class);
                }

                input.dataset.groupid = group_id;
                input.dataset.elementid = element._id; // input.dataset.index = index;

                input.setAttribute(
                  "required",
                  element && element.attributes && element.attributes.required
                    ? element.attributes.required
                    : false
                ); // input.dataset.type = element && element.data && element.data.disabled ? 'simple' : null;

                if (element.error && element.error.flag) {
                  input.checked = element.info.checked;
                }

                div.append(input);
                div.append(label);
                fragment.append(div); // fragment.append(div_error);
              }

              break;

            case "select":
              if (element.label) {
                let label = document.createElement("label");
                label.textContent = element.label;
                div.append(label);
              }

              let select = document.createElement("select");
              select.id = `${element.type}_${element.subtype}_${element._id}`;
              select.classList.add("select", "minimal");
              select.dataset.groupid = group_id;
              select.dataset.elementid = element._id; // create a new option

              let htmlOption = null;
              let selected = false;
              element.children.options.forEach((option) => {
                selected = false;
                selected = option.selected;

                if (
                  element.error &&
                  element.error.flag &&
                  index == element.info.selected_index
                ) {
                  selected = true;
                }

                htmlOption = null;
                htmlOption = new Option(
                  option.label,
                  option.value ? option.value : "",
                  option.selected,
                  option.selected
                );
                htmlOption.disabled = option.disabled;
                select.add(htmlOption, undefined);
              });

              if (element.custom_class) {
                div.classList.add(element.custom_class);
              }

              div.append(select);
              fragment.append(div);
              fragment.append(div_error);
              break;

            case "textarea":
              if (element.label) {
                let label = document.createElement("label");
                label.textContent = element.label;
                div.append(label);
              }

              break;

            case "readonly":
              let short_text = null;
              let long_text = null;

              if (
                element.info &&
                element.info.readonly &&
                element.info.readonly.short_text &&
                element.info.readonly.short_text != ""
              ) {
                short_text = document.createElement("p");
                short_text.innerHTML = element.info.readonly.short_text;

                if (element.custom_class) {
                  short_text.classList.add(element.custom_class);
                } // if(element.info.readonly.long_text_opening =="modal" && element.info.readonly.long_text && element.info.readonly.long_text != ""){
                //   short_text.style = "cursor:pointer;";
                //   short_text.addEventListener("click", function(){
                //     console.log("open modal");
                //   });
                // }

                fragment.append(short_text);
              }

              if (
                element.info &&
                element.info.readonly &&
                element.info.readonly.long_text &&
                element.info.readonly.long_text != ""
              ) {
                if (element.info.readonly.long_text_opening == "modal") {
                  let modal_background = document.createElement("div");
                  modal_background.classList.add("hej_form_modal");
                  let modal_content = document.createElement("div");
                  modal_content.classList.add("hej_form_modal_content");
                  let close_modal = document.createElement("span");
                  close_modal.classList.add("hej_form_modal_close");
                  close_modal.innerHTML = "&times;";
                  close_modal.addEventListener("click", function () {
                    modal_background.classList.toggle("active");
                  });
                  let modal_header = document.createElement("div");
                  modal_header.classList.add("hej_form_modal_header");
                  modal_header.append(close_modal);
                  let modal_body = document.createElement("div");
                  modal_body.classList.add("hej_form_modal_body");
                  modal_body.innerHTML = element.info.readonly.long_text;
                  modal_content.append(modal_header);
                  modal_content.append(modal_body);
                  modal_background.appendChild(modal_content);
                  let resultParse = CommonHandler.parseTextSymbol(
                    element.info.readonly.short_text
                  );

                  if (resultParse.target == "MODAL") {
                    short_text.innerHTML = resultParse.text;
                    let span_link = short_text.querySelector(
                      ".hej_form_readonly_link"
                    );
                    span_link.addEventListener("click", function () {
                      modal_background.classList.toggle("active");
                    });
                  } else {
                    short_text.style = "cursor:pointer;";
                    short_text.addEventListener("click", function () {
                      modal_background.classList.toggle("active");
                    });
                  }

                  document.body.append(modal_background);
                } else {
                  long_text = document.createElement("textarea");
                  long_text.textContent = element.info.readonly.long_text;
                  long_text.style.height = element.info.readonly
                    .long_text_height
                    ? element.info.readonly.long_text_height + "px"
                    : "";
                  long_text.disabled = true;

                  if (element.custom_class) {
                    long_text.classList.add(element.custom_class);
                  }

                  fragment.append(long_text);
                }
              }

              break;
          }

          return fragment;
        };

        let createSwipeContent = (data = undefined, DOMreference) => {
          let image = null;

          if (
            data.interaction &&
            data.interaction.groups &&
            data.interaction.groups[0].interactions &&
            data.interaction.groups[0].interactions[0].elements &&
            data.interaction.groups[0].interactions[0].elements[0].media_id &&
            data.interaction.groups[0].interactions[0].elements[0].media_id
              .media
          ) {
            image = data.interaction.groups[0].interactions[0].elements[0]
              .media_id.media.small
              ? data.interaction.groups[0].interactions[0].elements[0].media_id
                  .media.small.url
              : data.interaction.groups[0].interactions[0].elements[0].media_id
                  .media.original.url; // document.documentElement.style.setProperty('--interaction_swipe_image', `url('${image}')`);
          }

          let div_swipe = document.createElement("div");
          div_swipe.classList.add("swipe__card"); // div_swipe.classList.add("shaking-infinite");

          div_swipe.classList.add("shaking");
          let div_img = document.createElement("img");
          div_img.classList.add("swipe__card__img");
          div_img.src = image;
          let div_swipe_left = document.createElement("div");
          div_swipe_left.classList.add("swipe__card__choice", "m--reject"); // div_swipe_left.innerHTML = "<span>👎</span>";

          div_swipe_left.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0] &&
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping[0].title
              ? data.interaction.groups[0].interactions[0].info.mapping[0].title
              : "👎"
          }</span>`;
          let div_swipe_right = document.createElement("div");
          div_swipe_right.classList.add("swipe__card__choice", "m--like"); // div_swipe_right.innerHTML = "<span>👍</span>";

          div_swipe_right.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0] &&
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping[1].title
              ? data.interaction.groups[0].interactions[0].info.mapping[1].title
              : "👍"
          }</span>`;
          div_swipe.appendChild(div_img);
          div_swipe.appendChild(div_swipe_right);
          div_swipe.appendChild(div_swipe_left);
          let div_choice = document.createElement("div");
          div_choice.classList.add("chatbot__message__choice");
          div_choice.classList.add("is-loading");
          div_choice.classList.add("is-hidden");
          let choice_info = document.createElement("span");
          choice_info.classList.add("hejchatbot_info");
          choice_info.textContent = "You can swipe right or left to answer.";
          let language = configuration.language
            ? configuration.language.code
            : "it";
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          choice_info.textContent = currentIdiom.swipe_caption;
          div_choice.appendChild(choice_info);
          div_choice.appendChild(div_swipe);
          let div_button = document.createElement("div");
          div_button.classList.add("swipe_button_choice");
          let button_left = document.createElement("button");

          if (
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0]
              .custom_class
          ) {
            button_left.classList.add(
              data.interaction.groups[0].interactions[0].info.mapping[0]
                .custom_class
            );
          } // button_left.innerHTML = "<span>👎</span>";

          button_left.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0].title
              ? data.interaction.groups[0].interactions[0].info.mapping[0].title
              : "👎"
          }</span>`;
          button_left.dataset.label =
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[0] &&
            data.interaction.groups[0].interactions[0].info.mapping[0].label
              ? data.interaction.groups[0].interactions[0].info.mapping[0].label
              : undefined;
          let button_right = document.createElement("button");

          if (
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1]
              .custom_class
          ) {
            button_right.classList.add(
              data.interaction.groups[0].interactions[0].info.mapping[1]
                .custom_class
            );
          } // button_right.innerHTML = "<span>👍</span>";

          button_right.innerHTML = `<span>${
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1].title
              ? data.interaction.groups[0].interactions[0].info.mapping[1].title
              : "👍"
          }</span>`;
          button_right.dataset.label =
            data.interaction.groups[0].interactions[0].info &&
            data.interaction.groups[0].interactions[0].info.mapping &&
            data.interaction.groups[0].interactions[0].info.mapping.length >
              0 &&
            data.interaction.groups[0].interactions[0].info.mapping[1] &&
            data.interaction.groups[0].interactions[0].info.mapping[1].label
              ? data.interaction.groups[0].interactions[0].info.mapping[1].label
              : undefined;
          button_left.addEventListener("click", function () {
            console.log("clicked left choice");
            div_swipe.classList.add("controlled");
            div_swipe.style.transform =
              "translateX(" + -300 + "px) rotate(" + -30 + "deg)";
            div_swipe_left.classList.add("controlled");
            div_swipe_left.style.opacity = 1;
            SwipeController.controlledRelease(div_swipe, "left_swipe");
            div_button.style.pointerEvents = "none";
            div_button.style.visibility = "hidden"; // setTimeout(function(){
            //   CommonHandler.dispachEvent(undefined, "swipeCompleted");
            // }, 500);
          });
          button_right.addEventListener("click", function () {
            console.log("clicked right choice");
            div_swipe.classList.add("controlled");
            div_swipe.style.transform =
              "translateX(" + 300 + "px) rotate(" + 30 + "deg)";
            div_swipe_right.classList.add("controlled");
            div_swipe_right.style.opacity = 1;
            SwipeController.controlledRelease(div_swipe, "right_swipe");
            div_button.style.pointerEvents = "none";
            div_button.style.visibility = "hidden"; // setTimeout(function(){
            //   CommonHandler.dispachEvent(undefined, "swipeCompleted");
            // }, 500);
          });
          CommonHandler.setInteractionObject(data.interaction);
          div_button.appendChild(button_left);
          div_button.appendChild(button_right);
          div_choice.appendChild(div_button);
          SwipeController.init(div_swipe, {
            medium: "widget",
          });
          let objToSend = {
            content_message: div_choice,
            message_type: "swipe",
          };
          return objToSend;
        };

        let checkViewportSize = (element) => {
          let x = element.offsetWidth;

          if (x <= 360) {
            return "small";
          } else if (x <= 768) {
            return "medium";
          } else if (x <= 1024) {
            return "large";
          } else if (x <= 1440 || x > 1440) {
            return "extralarge";
          } else {
            return "original";
          }
        };

        return {
          init,
          processVideo,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/landingUI.js
      const LandingUI = (function () {
        let configuration = null;

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration;
          handleDynamicContent();
        };

        let handleDynamicContent = () => {
          if (
            configuration.progress_bar &&
            configuration.progress_bar.flag &&
            configuration.progress_bar.steps.length > 0
          ) {
            let step_ul = document.getElementById("step-list");
            let temp_li = null;
            let temp_li_span = null;
            configuration.progress_bar.steps.forEach((element, index) => {
              temp_li = document.createElement("li");
              temp_li_span = document.createElement("span");
              temp_li.innerHTML =
                "<span></span><i class='fa fa-check' aria-hidden='true'></i>";
              temp_li_span.textContent = element.title;
              temp_li.dataset.label = element.label_id;
              temp_li.dataset.step = index + 1;
              temp_li.dataset.currentStep = 1;
              temp_li.classList.add("step");

              if (index == 0) {
                temp_li.classList.add("active");
              }

              temp_li.appendChild(temp_li_span);
              step_ul.appendChild(temp_li);
            });
          }

          if (
            configuration.type == "landing" &&
            document.getElementById("browser_alert")
          ) {
            document.getElementById("browser_alert").classList.add("active");
          }

          if (
            configuration.menu &&
            configuration.menu.show &&
            configuration.menu.items &&
            configuration.menu.items.length > 0
          ) {
            let hejchatbot_menu_container = document.getElementById(
              "hejchatbot_menu_container"
            );
            let hejchatbot_menu = document.querySelector(".hamburger");
            hejchatbot_menu.addEventListener("click", () => {
              hejchatbot_menu.classList.contains("is-active")
                ? hejchatbot_menu.classList.remove("is-active")
                : hejchatbot_menu.classList.add("is-active");
              hejchatbot_menu_container.classList.contains("open")
                ? hejchatbot_menu_container.classList.remove("open")
                : hejchatbot_menu_container.classList.add("open");
            });
            let menu_fragment = document.createDocumentFragment();
            let ul_menu = document.createElement("ul");
            let link = undefined;
            let li = undefined;

            for (let i = 0; i < configuration.menu.items.length; i++) {
              li = document.createElement("li");
              link = document.createElement("a");
              link.href = configuration.menu.items[i].link_id
                ? configuration.menu.items[i].link_id.standard_url
                : configuration.menu.items[i].url;
              link.textContent = configuration.menu.items[i].title;
              link.target = "_blank";
              li.appendChild(link);
              ul_menu.appendChild(li);
            }

            menu_fragment.appendChild(ul_menu);
            hejchatbot_menu_container.appendChild(menu_fragment);
            let rgbaBorderTop = CommonHandler.hexToRgbA(
              configuration.topbar.title.text_color,
              0.2
            );
            document.documentElement.style.setProperty(
              "--border-top-menu-items-color",
              rgbaBorderTop
            );
          }

          if (
            configuration.footer &&
            configuration.footer.hasOwnProperty("show_cookie_policy") &&
            configuration.footer.show_cookie_policy
          ) {
            var hejchatbot_footer_cookie = document.getElementById(
              "hejchatbot_footer_iubenda"
            );
            var a_footer_iubenda = document.getElementById(
              "hejchatbot_footer_a_iubenda"
            );
            var info_hej_agency_1 =
              document.getElementById("info_hej_agency_1");
            var info_hej_agency_2 =
              document.getElementById("info_hej_agency_2");

            if (
              configuration.footer.hasOwnProperty(
                "cookie_policy_background_color"
              ) &&
              configuration.footer.cookie_policy_background_color
            ) {
              hejchatbot_footer_cookie.style["background-color"] =
                configuration.footer.cookie_policy_background_color;

              if (info_hej_agency_1) {
                info_hej_agency_1.style["color"] =
                  configuration.footer.cookie_policy_text_color;
              }

              if (info_hej_agency_2) {
                info_hej_agency_2.style["color"] =
                  configuration.footer.cookie_policy_text_color;
              }
            } else {
              if (configuration.topbar && configuration.topbar.background) {
                hejchatbot_footer_cookie.style["background-color"] =
                  configuration.topbar.background;
              } else {
                hejchatbot_footer_cookie.style["background-color"] = "#fff";
              }
            }

            if (
              configuration.footer.hasOwnProperty("cookie_policy_text_color") &&
              configuration.footer.cookie_policy_text_color
            ) {
              a_footer_iubenda.style["color"] =
                configuration.footer.cookie_policy_text_color;
            } else {
              if (
                configuration.topbar &&
                configuration.topbar.title &&
                configuration.topbar.title.text_color
              ) {
                a_footer_iubenda.style["color"] =
                  configuration.topbar.title.text_color;
              } else {
                a_footer_iubenda.style["color"] = "#2c2c2c";
              }
            }
          }

          if (
            configuration.topbar &&
            configuration.topbar.show &&
            configuration.topbar.sharing &&
            configuration.topbar.sharing.show &&
            configuration.topbar.sharing.channels.length > 0
          ) {
            let hejchatbot_social_container_mobile = document.getElementById(
              "hejchatbot_social_container_mobile"
            );
            let hejchatbot_social_container = document.getElementById(
              "hejchatbot_social_container"
            );
            let sharing_open = document.getElementById("sharing_open");
            sharing_open.addEventListener("click", () => {
              if (sharing_open.classList.contains("fa-share")) {
                sharing_open.classList.remove("fa-share");
                sharing_open.classList.add("fa-times");
              } else {
                sharing_open.classList.add("fa-share");
                sharing_open.classList.remove("fa-times");
              }

              hejchatbot_social_container_mobile.classList.contains("open")
                ? hejchatbot_social_container_mobile.classList.remove("open")
                : hejchatbot_social_container_mobile.classList.add("open");
            });
            let menu_fragment = document.createDocumentFragment();
            let ul_menu = document.createElement("ul");
            let link = undefined;
            let li = undefined;

            for (
              let i = 0;
              i < configuration.topbar.sharing.channels.length;
              i++
            ) {
              li = document.createElement("li");
              link = document.createElement("a");

              if (configuration.topbar.sharing.channels[i] == "facebook") {
                link.classList.add("share-button", "fab", "fa-facebook-f");
                link.href =
                  "https://www.facebook.com/sharer/sharer.php?u=" +
                  window.location.href;
                link.addEventListener("click", () => {
                  window.open(
                    this.href,
                    "",
                    "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600"
                  );
                  return false;
                });
              } else if (
                configuration.topbar.sharing.channels[i] == "messenger"
              ) {
                link.classList.add(
                  "share-button",
                  "fab",
                  "fa-facebook-messenger"
                ); // device detection

                if (
                  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                    navigator.userAgent
                  ) ||
                  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    navigator.userAgent.substr(0, 4)
                  )
                ) {
                  link.href =
                    "fb-messenger://share/?link=" +
                    window.location.href +
                    "&app_id=" +
                    configuration.ws_app_id;
                } else {
                  link.href =
                    "http://www.facebook.com/dialog/send?app_id=" +
                    configuration.ws_app_id +
                    " &display=popup&link=" +
                    window.location.href +
                    "&redirect_uri=" +
                    window.location.href;
                }

                link.addEventListener("click", () => {
                  window.open(
                    this.href,
                    "",
                    "menubar=no,toolbar=no,resizable=yes,scrollbars=yes"
                  );
                  return false;
                });
              } else if (
                configuration.topbar.sharing.channels[i] == "whatsapp"
              ) {
                link.classList.add("share-button", "fab", "fa-whatsapp"); // device detection

                if (
                  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                    navigator.userAgent
                  ) ||
                  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    navigator.userAgent.substr(0, 4)
                  )
                ) {
                  link.href = "whatsapp://send?text=" + window.location.href;
                } else {
                  link.href =
                    "https://web.whatsapp.com/send?text=" +
                    window.location.href;
                }

                link.addEventListener("click", () => {
                  window.open(
                    this.href,
                    "",
                    "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600"
                  );
                  return false;
                });
              } else if (
                configuration.topbar.sharing.channels[i] == "twitter"
              ) {
                link.classList.add("share-button", "fab", "fa-twitter");
                link.href =
                  "https://twitter.com/share?url=" + window.location.href;
                link.addEventListener("click", () => {
                  window.open(
                    this.href,
                    "",
                    "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600"
                  );
                  return false;
                });
              }

              link.target = "_blank";
              link.title = "";
              li.appendChild(link);
              ul_menu.appendChild(li);
            }

            let ul_menu2 = ul_menu.cloneNode(true);
            menu_fragment.appendChild(ul_menu);
            hejchatbot_social_container_mobile.appendChild(menu_fragment);
            hejchatbot_social_container.appendChild(ul_menu2);
          }
        };

        return {
          init,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/bannerUI.js
      const BannerUI = (function () {
        let DOMReference = null;
        let configuration = null;
        let project_id = null;
        let scheduledActivities = [];
        let language = "it";
        let currentIdiom = null;

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration;
          project_id = web_project_id;
          language = configuration.language
            ? configuration.language.code
            : "it";
          currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          console.log("currentIdiom", currentIdiom); // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference();
          handleDynamicContent();
          setStyles();
        };

        let setStyles = () => {
          if (configuration.chat_overlay && window.top != window.self) {
            if (
              configuration.hasOwnProperty("media_id") &&
              configuration.media_id.hasOwnProperty("desktop") &&
              configuration.media_id.hasOwnProperty("mobile")
            ) {
              document.documentElement.style.setProperty(
                "--background-image",
                `url('${
                  configuration.media_id.desktop.media.extralarge
                    ? configuration.media_id.desktop.media.extralarge.url
                    : configuration.media_id.desktop.media.large
                    ? configuration.media_id.desktop.media.large.url
                    : configuration.media_id.desktop.media.original.url
                }')`
              );
              document.documentElement.style.setProperty(
                "--background-image-mobile",
                `url('${
                  configuration.media_id.mobile.media.extralarge
                    ? configuration.media_id.mobile.media.extralarge.url
                    : configuration.media_id.mobile.media.large
                    ? configuration.media_id.mobile.media.large.url
                    : configuration.media_id.mobile.media.original.url
                }')`
              );
            } else {
              document.documentElement.style.setProperty(
                "--background-image",
                `url('${configuration.background.image_url.desktop}')`
              );
              document.documentElement.style.setProperty(
                "--background-image-mobile",
                `url('${configuration.background.image_url.mobile}')`
              );
            }

            if (
              configuration.hasOwnProperty("avatar") &&
              configuration.avatar.background &&
              configuration.avatar.background.type == "media" &&
              configuration.avatar.background.media_id &&
              configuration.avatar.background.media_id.media &&
              typeof configuration.avatar.background.media_id.media == "object"
            ) {
              let image = configuration.avatar.background.media_id.media.small
                ? configuration.avatar.background.media_id.media.small.url
                : configuration.avatar.background.media_id.media.original.url;
              document.documentElement.style.setProperty(
                "--avatar-image",
                `url('${image}')`
              );
            } else {
              document.documentElement.style.setProperty(
                "--avatar-image",
                `url('${configuration.avatar_image}')`
              );
            }
          }
        };

        let handleDynamicContent = () => {
          if (configuration.banner) {
            if (configuration.banner.type == "masthead") {
              DOMReference.hejchatbot.style.width = "400px";
            } else if (configuration.banner.type == "expandable_box") {
              DOMReference.hejchatbot.style.width = "100%";
              DOMReference.hejchatbot.style.height = "97%";
              DOMReference.hejchatbot.style.padding = "0";
            } else if (
              configuration.banner.type == "interstitial" ||
              configuration.banner.type == "halfpage"
            ) {
              if (configuration.banner.custom_settings) {
                DOMReference.hejchatbot__chat.style.marginTop =
                  configuration.banner.custom_settings.chat_margin_top;
                DOMReference.hejchatbot__chat.style.maxHeight =
                  configuration.banner.custom_settings.chat_max_height;
              }
            }
          }

          if (!configuration.chat_overlay) {
            if (
              configuration.banner &&
              configuration.banner.type == "halfpage" &&
              configuration.banner.subtype == "full_chat"
            ) {
              DOMReference.hejchatbot.appendChild(
                DOMReference.hej_user_input_div
              );
              DOMReference.hejchatbot.style.justifyContent = "flex-end";
              DOMReference.hej_user_input_div.classList.add("fixed");
              DOMReference.hej_user_input_div.classList.add("active");
              DOMReference.hejchatbot__chat.classList.add("bottom");
            }

            if (
              configuration.banner &&
              configuration.banner.type == "halfpage" &&
              configuration.banner.subtype == "standard"
            ) {
              var url = configuration.click_url.link_id
                ? configuration.click_url.link_id.standard_url
                : configuration.click_url.url;
              CommonHandler.openUrl(DOMReference, "hejchatbot", url);
            }

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "interstitial"
            ) {
              // DOMReference.hejchatbot.addEventListener("click", function () {
              //   console.log("event click out hejchatbot")
              //   if (window.mraid && typeof Adform !== 'undefined') {
              //     console.log("window.mraid && typeof Adform !== 'undefined'")
              //     if (configuration.banner.delivery_platform == "google") {
              //       mraid.open(window.clickTag);
              //     } else {
              //       console.log("window.mraid")
              //       mraid.open(Adform.getClickURL("clickTAG"));
              //     }
              //   } else {
              //     console.log("NO window.mraid && typeof Adform !== 'undefined'")
              //     console.log("window open clicktag 11");
              //     window.open(configuration.click_url.link_id ? configuration.click_url.link_id.standard_url : configuration.click_url.url, "_blank");
              //   }
              // }, false);
              if (window.mraid && typeof Adform !== "undefined") {
                console.log("clicktag adform");
              } else {
                let clickArea = document.getElementById("hejchatbot_header");
                clickArea.addEventListener(
                  "click",
                  function (e) {
                    console.log("window open clicktag hejchatbot_header");
                    window.open(
                      configuration.click_url.link_id
                        ? configuration.click_url.link_id.standard_url
                        : configuration.click_url.url,
                      "_blank"
                    );
                  },
                  false
                );
              }
            }

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "halfpage" &&
              configuration.banner.subtype == "interactive"
            ) {
              var url = configuration.click_url.link_id
                ? configuration.click_url.link_id.standard_url
                : configuration.click_url.url;
              CommonHandler.openUrl(DOMReference, "hejchatbot_header", url);
              addInteractivity();
            }

            if (
              configuration.banner &&
              configuration.banner.type == "interstitial" &&
              configuration.banner.custom_settings.topbar_custom
            ) {
              if (
                configuration.banner.custom_settings.hasOwnProperty("topbar") &&
                configuration.banner.custom_settings.topbar.image &&
                configuration.banner.custom_settings.topbar.image.type ==
                  "media" &&
                configuration.banner.custom_settings.topbar.image.media_id
              ) {
                let image = configuration.banner.custom_settings.topbar.image
                  .media_id.media.medium
                  ? configuration.banner.custom_settings.topbar.image.media_id
                      .media.medium.url
                  : configuration.banner.custom_settings.topbar.image.media_id
                      .media.small
                  ? configuration.banner.custom_settings.topbar.image.media_id
                      .media.small.url
                  : configuration.banner.custom_settings.topbar.image.media_id
                      .media.original.url;
                DOMReference.hejchatbot_header.style.background = `url('${image}')`;
              } else {
                DOMReference.hejchatbot_header.style.background = `url('${configuration.banner.custom_settings.topbar_background}')`;
              }

              DOMReference.hejchatbot_header.style.backgroundPosition = "50%";
              DOMReference.hejchatbot_header.style.backgroundRepeat =
                "no-repeat";
              DOMReference.hejchatbot_header.style.backgroundSize = "contain";
              DOMReference.hejchatbot_header.style.backgroundColor =
                configuration.topbar.background;
              DOMReference.hejchatbot_header.style.minHeight =
                configuration.banner.custom_settings.topbar_height;
              let header_left = DOMReference.document.getElementById(
                "hejchatbot_header__left_content"
              );
              let header_right = DOMReference.document.getElementById(
                "hejchatbot_header__right_content"
              );
              header_left.style.display = "none";
              header_right.style.display = "none";
            }

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "interstitial"
            ) {
              let close_button =
                DOMReference.document.getElementById("hejclose");
              close_button.style.color =
                configuration.banner.custom_settings.close_button_color;
            }

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "preroll"
            ) {
              // let hejchatbot_header_left= DOMReference.document.getElementById("hejchatbot_header__left_content");
              let hejchatbot_header_right =
                DOMReference.document.getElementById(
                  "hejchatbot_header__right_content"
                );
              DOMReference.hejchatbot.style.width =
                configuration.banner.custom_settings.chat_width + "%";
              DOMReference.hejchatbot_header.style.display = "flex";
              DOMReference.hejchatbot_header.style.width =
                100 - configuration.banner.custom_settings.chat_width + "%";

              if (
                configuration.banner.custom_settings
                  .preroll_bottom_image_height &&
                configuration.banner.custom_settings
                  .preroll_bottom_image_height != 0
              ) {
                hejchatbot_header_right.style.height =
                  configuration.banner.custom_settings
                    .preroll_bottom_image_height + "px";
              }

              DOMReference.hejchatbot_header.style.background =
                configuration.banner.custom_settings.preroll_background_color_header; //TODO: da eliminare
              // let video = DOMReference.document.createElement("video");
              // video.controls = true;
              // video.autoplay = true;
              // let sourceMP4 = document.createElement("source");
              // sourceMP4.type = "video/mp4";
              // sourceMP4.src = "https://s3-eu-west-1.amazonaws.com/media-hej/HJ%20DEV/video/1595414457703.mp4";
              // // sourceMP4.src = "https://s3-eu-west-1.amazonaws.com/media-hej/Aida%20Dev/video/1595412362061.mp4";
              // video.appendChild(sourceMP4);
              // hejchatbot_header_left.appendChild(video);

              let img = DOMReference.document.createElement("img");

              if (
                configuration.banner.custom_settings.preroll &&
                configuration.banner.custom_settings.preroll.image &&
                configuration.banner.custom_settings.preroll.image.type ==
                  "media" &&
                configuration.banner.custom_settings.preroll.image.media_id
              ) {
                let image = configuration.banner.custom_settings.preroll.image
                  .media_id.media.large
                  ? configuration.banner.custom_settings.preroll.image.media_id
                      .media.large.url
                  : configuration.banner.custom_settings.preroll.image.media_id
                      .media.medium
                  ? configuration.banner.custom_settings.preroll.image.media_id
                      .media.medium.url
                  : configuration.banner.custom_settings.preroll.image.media_id
                      .media.original.url;
                img.src = image;
              } else {
                img.src =
                  configuration.banner.custom_settings.preroll_bottom_image;
              } // img.src = "https://cdn.hypertvx.com/image/image_gallery?uuid=1d199a4b-40cb-48cd-baea-4437b4b3b1f4&groupId=68671&t=1580980021138";

              img.alt = "media immagine";
              hejchatbot_header_right.appendChild(img);
              var clickArea = document.getElementById("adf-click-area");

              if (clickArea && typeof dhtml !== "undefined") {
                console.log("window open clicktag preroll 1");
                let clickTAGvalue = dhtml.getVar(
                  "clickTAG",
                  configuration.click_url.link_id
                    ? configuration.click_url.link_id.standard_url
                    : configuration.click_url.url
                );
                let landingpagetarget = dhtml.getVar(
                  "landingPageTarget",
                  "_blank"
                );
                clickArea.addEventListener("click", function () {
                  window.open(clickTAGvalue, landingpagetarget);
                });
              } else {
                var clickArea = document.getElementById("hejchatbot_header");
                clickArea.addEventListener("click", function (e) {
                  console.log("window open clicktag preroll 2");
                  window.open(
                    configuration.click_url.link_id
                      ? configuration.click_url.link_id.standard_url
                      : configuration.click_url.url,
                    "_blank"
                  );
                });
              }
            }
          } else {
            if (configuration.banner.type == "expandable_box") {
              addInteractivity();
            }

            let mobile_overlay = DOMReference.document.createElement("div");
            mobile_overlay.id = "hejmobile_overlay_" + project_id;
            mobile_overlay.classList.add("hejmobile_overlay");
            mobile_overlay.style.position = "fixed"; // mobile_overlay.style.position = "absolute";

            mobile_overlay.style.top = "0";
            mobile_overlay.style.left = "0";
            mobile_overlay.style.display = "none";
            mobile_overlay.style.zIndex = "99999999999999999999";
            mobile_overlay.style.width = "100%";
            mobile_overlay.style.height = "100%";
            mobile_overlay.style.fontFamily =
              "'Nunito',Roboto, Arial, Helvetica, sans-serif";
            mobile_overlay.style.overflow = "scroll"; // mobile_overlay.style.height = "calc(var(--vh, 1vh) * 100)";

            mobile_overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            mobile_overlay.style.flexDirection = "column";
            mobile_overlay.style.alignItems = "center";
            let anchor_image_container = undefined;

            if (
              configuration.anchor_mobile_image != "" &&
              configuration.anchor_mobile_image != null &&
              configuration.anchor_mobile_image != undefined
            ) {
              anchor_image_container =
                DOMReference.document.createElement("div");
              anchor_image_container.id = "hejanchor_mobile_" + project_id;
              anchor_image_container.style.position = "fixed";
              anchor_image_container.style.bottom = "0";
              anchor_image_container.style.right = "0";
              anchor_image_container.style.zIndex = "99999999999999999999";
              anchor_image_container.style.width = "250px";
              anchor_image_container.style.height = "185px";
              anchor_image_container.style.backgroundImage = `url('${configuration.anchor_mobile_image}')`;
              anchor_image_container.style.backgroundSize = "contain";
              anchor_image_container.style.backgroundPosition = "right";
              anchor_image_container.style.backgroundRepeat = "no-repeat";
              anchor_image_container.style.cursor = "pointer";
            }

            let header = DOMReference.document.createElement("div"); // header.style.position = "absolute";
            //header.style.position = "fixed";
            // header.style.top = "0";
            // header.style.left = "0";

            header.id = "hejmobile_header_" + project_id;
            header.style.display = "flex";
            header.style.alignItems = "center";
            header.style.width = "100%";
            header.style.height = "45px";
            header.style.zIndex = "9999";
            header.style.cursor = "pointer";
            header.style.backgroundColor = "white";
            header.style.zIndex = "99999999999999999999";
            header.style.borderBottom =
              "1px solid" +
              (configuration.topbar
                ? configuration.topbar.border_bottom_color
                : "transparent");
            let close_overlay = DOMReference.document.createElement("span");
            close_overlay.id = "hejclose_overlay_" + project_id;
            close_overlay.style.position = "absolute";
            close_overlay.style.right = "0px";
            close_overlay.style.width = "35px";
            close_overlay.style.height = "35px";
            close_overlay.style.textAlign = "center";
            close_overlay.style.display = "flex";
            close_overlay.style.alignItems = "center";
            close_overlay.style.justifyContent = "center";
            close_overlay.style.fontSize = "1.3em";
            close_overlay.style.color =
              configuration.banner.custom_settings.close_button_color ||
              "$#000";
            close_overlay.innerHTML = "&#10006;";
            let logo_mobile_header =
              DOMReference.document.createElement("span");
            logo_mobile_header.id = "hejmobile_logo_" + project_id;

            if (
              configuration.topbar.hasOwnProperty("image") &&
              configuration.topbar.image.type == "media" &&
              configuration.topbar.image.media_id
            ) {
              let image = configuration.topbar.image.media_id.media.medium
                ? configuration.topbar.image.media_id.media.medium.url
                : configuration.topbar.image.media_id.media.original.url;
              logo_mobile_header.style.backgroundImage = `url('${image}')`;
            } else {
              logo_mobile_header.style.backgroundImage = `url('${
                configuration.topbar.hasOwnProperty("logo") &&
                configuration.topbar.logo != ""
                  ? configuration.topbar.logo
                  : ""
              }')`;
            }

            logo_mobile_header.style.zIndex = "9999";
            logo_mobile_header.style.width = "100%";
            logo_mobile_header.style.maxWidth = "60px";
            logo_mobile_header.style.height = "100%";
            logo_mobile_header.style.maxHeight = "30px";
            logo_mobile_header.style.backgroundSize = "contain";
            logo_mobile_header.style.backgroundPosition = "left";
            logo_mobile_header.style.backgroundRepeat = "no-repeat";
            logo_mobile_header.style.display = "inline-block";
            logo_mobile_header.style.marginLeft = "15px";
            header.appendChild(logo_mobile_header);
            header.appendChild(close_overlay);
            mobile_overlay.appendChild(header);
            mobile_overlay.appendChild(DOMReference.hejchatbot);
            var url = configuration.click_url.link_id
              ? configuration.click_url.link_id.standard_url
              : configuration.click_url.url;
            CommonHandler.openUrl(DOMReference, header, url);
            let hej_footer = undefined;

            if (
              configuration.footer &&
              ((configuration.footer.hasOwnProperty("text") &&
                configuration.footer.text != "") ||
                (configuration.footer.hasOwnProperty("background") &&
                  configuration.footer.background != "") ||
                (configuration.footer.hasOwnProperty("image") &&
                  configuration.footer.image != "" &&
                  configuration.footer.image.media_id))
            ) {
              hej_footer = DOMReference.document.createElement("footer");
              hej_footer.id = "hejchatbot_footer_" + project_id;
              hej_footer.classList.add("hejchatbot_footer");

              if (
                configuration.footer.hasOwnProperty("text") &&
                configuration.footer.text != ""
              ) {
                hej_footer.style.color =
                  configuration.footer &&
                  configuration.footer.hasOwnProperty("text_color")
                    ? configuration.footer.text_color
                    : "#c5c5c5";
                hej_footer.innerHTML = configuration.footer.text;
              } else if (
                (configuration.footer.hasOwnProperty("background") &&
                  configuration.footer.background != "") ||
                (configuration.footer.hasOwnProperty("image") &&
                  configuration.footer.image != "" &&
                  configuration.footer.image.media_id)
              ) {
                let figure_img = DOMReference.document.createElement("figure");
                let footer_img = DOMReference.document.createElement("img");

                if (
                  configuration.footer.hasOwnProperty("image") &&
                  configuration.footer.image.type == "media"
                ) {
                  let image = configuration.footer.image.media_id.media.medium
                    ? configuration.footer.image.media_id.media.medium.url
                    : configuration.footer.image.media_id.media.original.url;
                  footer_img.src = image;
                } else {
                  footer_img.src = configuration.footer.background;
                }

                footer_img.alt = "footer immagine";
                figure_img.appendChild(footer_img);
                hej_footer.appendChild(figure_img);
              }

              hej_footer.style.minHeight = "45px";
              mobile_overlay.appendChild(hej_footer);
              var url = configuration.click_url.link_id
                ? configuration.click_url.link_id.standard_url
                : configuration.click_url.url;
              CommonHandler.openUrl(DOMReference, hej_footer, url);
            }

            if (
              configuration.anchor_mobile_image != "" &&
              configuration.anchor_mobile_image != null &&
              configuration.anchor_mobile_image != undefined
            ) {
              DOMReference.document.body.appendChild(anchor_image_container);
            }

            if (
              configuration.banner &&
              configuration.banner.type == "expandable_box" &&
              configuration.banner.custom_settings.topbar_custom
            ) {
              if (
                configuration.banner.custom_settings.topbar &&
                configuration.banner.custom_settings.topbar.image &&
                configuration.banner.custom_settings.topbar.image.type ==
                  "media" &&
                configuration.banner.custom_settings.topbar.image.media_id
              ) {
                let image = configuration.banner.custom_settings.topbar.image
                  .media_id.media.medium
                  ? configuration.banner.custom_settings.topbar.image.media_id
                      .media.medium.url
                  : configuration.banner.custom_settings.topbar.image.media_id
                      .media.original.url;
                header.style.background = `url('${image}')`;
              } else {
                header.style.background = `url('${configuration.banner.custom_settings.topbar_background}')`;
              }

              header.style.backgroundPosition = "50%";
              header.style.backgroundRepeat = "no-repeat";
              header.style.backgroundSize = "contain";
              header.style.backgroundColor = configuration.topbar.background;
              header.style.height =
                configuration.banner.custom_settings.topbar_height;
              logo_mobile_header.style.display = "none";
              close_overlay.style.top = "0px";
              DOMReference.hejchatbot.style.margin = "0px";
              DOMReference.hejchatbot__chat.style.padding = "10px 0 0";
              mobile_overlay.style.backgroundColor =
                configuration.banner.custom_settings &&
                configuration.banner.custom_settings.chat_overlay_background
                  ? configuration.banner.custom_settings.chat_overlay_background
                      .color
                  : configuration.topbar.background;
            }

            DOMReference.document.body.appendChild(mobile_overlay);
          }
        };

        let clearActivities = () => {
          clearInterval(scheduledActivities[0].func);
        };

        let startActivities = () => {
          scheduledActivities[0].func = setInterval(() => {
            anime_es({
              targets: ".starter",
              scale: [
                {
                  value: 0.9,
                  duration: 300,
                  easing: "easeOutCubic",
                },
                {
                  value: [0.9, 1.1],
                  duration: 300,
                  easing: "easeInOutExpo",
                },
                {
                  value: 1,
                  duration: 300,
                  delay: 550,
                  easing: "easeOutExpo",
                },
              ],
              rotateZ: [
                {
                  value: -3,
                  duration: 90,
                  easing: "easeInExpo",
                },
                {
                  value: 3,
                  duration: 95,
                  delay: 200,
                  easing: "easeInExpo",
                },
                {
                  value: -2,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: 3,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: -2,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: 3,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: -2,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: 3,
                  duration: 95,
                  easing: "easeInExpo",
                },
                {
                  value: 0,
                  duration: 95,
                  easing: "easeInExpo",
                },
              ],
            });
          }, 5000);
        };

        let addInteractivity = () => {
          let clickTagDiv = document.createElement("div");
          clickTagDiv.id = "clickTagDiv";
          let openChatDiv = document.createElement("div");
          openChatDiv.id = "openChatDiv";
          var url = configuration.click_url.link_id
            ? configuration.click_url.link_id.standard_url
            : configuration.click_url.url;
          CommonHandler.openUrl(DOMReference, clickTagDiv, url);

          if (
            configuration.banner &&
            configuration.banner.subtype == "interactive" &&
            (configuration.banner.type == "halfpage" ||
              configuration.banner.type == "expandable_box") &&
            configuration.banner.custom_settings
          ) {
            let hejchatbot_fake = document.createElement("div");
            hejchatbot_fake.id = "hejchatbot_fake";
            let hejchatbot__chat_fake = document.createElement("div");
            hejchatbot__chat_fake.id = "hejchatbot__chat_fake";
            hejchatbot_fake.appendChild(hejchatbot__chat_fake);
            clickTagDiv.appendChild(hejchatbot_fake);
            let input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute(
              "placeholder",
              configuration.banner.custom_settings.fake_chat_input_text
            );
            input.setAttribute("readonly", true);
            input.classList = "starter";
            document.documentElement.style.setProperty(
              "--fake-chat-input-color",
              configuration.banner.custom_settings.fake_chat_input_text_color
            );
            let rgbaFakeInput = CommonHandler.hexToRgbA(
              configuration.banner.custom_settings
                .fake_chat_input_background_color,
              configuration.banner.custom_settings
                .fake_chat_input_background_opacity
            );
            input.style.backgroundColor = rgbaFakeInput;
            input.style.border =
              "1px solid " +
              configuration.banner.custom_settings.fake_chat_input_border_color;
            input.style.boxShadow =
              "0px 0px 8px 1px" +
              configuration.banner.custom_settings.fake_chat_input_border_color;
            let user_message_button =
              DOMReference.document.createElement("button");
            user_message_button.setAttribute("disabled", true);
            let sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 -6 23 40"><path fill="" d="M1.1 21.757l22.7-9.73L1.1 2.3l.012 7.912 13.623 1.816-13.623 1.817-.01 7.912z"></path></svg>`;
            document.documentElement.style.setProperty(
              "--fake-input-color",
              configuration.banner.custom_settings.fake_chat_input_border_color
            );
            user_message_button.innerHTML = sendSvg;
            openChatDiv.appendChild(input);
            openChatDiv.appendChild(user_message_button);
            scheduledActivities.push({
              name: "expandable_box_interaction",
              func: undefined,
            });
            scheduledActivities[0].func = setInterval(() => {
              anime_es({
                targets: openChatDiv,
                scale: [
                  {
                    value: 0.9,
                    duration: 300,
                    easing: "easeOutCubic",
                  },
                  {
                    value: [0.9, 1.1],
                    duration: 300,
                    easing: "easeInOutExpo",
                  },
                  {
                    value: 1,
                    duration: 300,
                    delay: 550,
                    easing: "easeOutExpo",
                  },
                ],
                rotateZ: [
                  {
                    value: -3,
                    duration: 90,
                    easing: "easeInExpo",
                  },
                  {
                    value: 3,
                    duration: 95,
                    delay: 200,
                    easing: "easeInExpo",
                  },
                  {
                    value: -2,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: 3,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: -2,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: 3,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: -2,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: 3,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                  {
                    value: 0,
                    duration: 95,
                    easing: "easeInExpo",
                  },
                ],
              });
            }, 5000);
          }

          document
            .getElementById("hejchatbot_container")
            .appendChild(clickTagDiv);
          document
            .getElementById("hejchatbot_container")
            .appendChild(openChatDiv);
          let rgbaBot = CommonHandler.hexToRgbA(
            configuration.banner.custom_settings.fake_chat_bot_background_color,
            configuration.banner.custom_settings
              .fake_chat_bot_background_opacity
          );
          document.documentElement.style.setProperty(
            "--fake-chat-bot-background-color",
            rgbaBot
          );
          document.documentElement.style.setProperty(
            "--fake-chat-bot-text-color",
            configuration.banner.custom_settings.fake_chat_bot_text_color
          );
          document.documentElement.style.setProperty(
            "--fake-chat-bot-border-color",
            configuration.banner.custom_settings.fake_chat_bot_border_color
          );
        };

        let addFakeMessages = () => {
          let fakeMessageIndex = 0;
          let hejchatbot__chat_fake = document.getElementById(
            "hejchatbot__chat_fake"
          );

          if (!configuration.banner.custom_settings.fake_messages) {
            configuration.banner.custom_settings.fake_messages = [];
          }

          if (!configuration.banner.custom_settings.fake_buttons) {
            configuration.banner.custom_settings.fake_buttons = [];
          }

          var arrayLength = configuration.banner
            ? configuration.banner.custom_settings.fake_messages.length
            : 0;
          var buttonArrayLength = configuration.banner
            ? configuration.banner.custom_settings.fake_buttons.length
            : 0;
          let messageDOM = [];
          let fragment = document.createDocumentFragment();

          if (
            configuration.banner.type == "interstitial" ||
            configuration.banner.type == "preroll"
          ) {
            if (arrayLength > 0) {
              for (var i = 0; i < arrayLength; i++) {
                messageDOM[i] = document.createElement("div");
                messageDOM[i].classList =
                  "chatbot__message chatbot__message--left is-hidden is-loading fake";
                messageDOM[
                  i
                ].innerHTML = `<span class="bot_avatar"></span><span class="chatbot__message__text"><div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><span class="is-loading is-hidden">${configuration.banner.custom_settings.fake_messages[i]}</span></span>`;
                fragment.appendChild(messageDOM[i]);
              }
            } // } else {
            //   messageDOM[0] = document.createElement("div");
            //   messageDOM[0].classList = "chatbot__message chatbot__message--left is-hidden is-loading";
            //   messageDOM[0].innerHTML = `<span class="bot_avatar"></span><span class="chatbot__message__text"><div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><span class="is-loading is-hidden">Ciao!</span></span>`;
            //   fragment.appendChild(messageDOM[0]);
            // }

            var title_button =
              currentIdiom && currentIdiom.button_text
                ? currentIdiom.button_text
                : "Clicca su un pulsante ⬇";

            if (buttonArrayLength > 0) {
              if (configuration.voice && !configuration.voice.flag) {
                messageDOM[0] = document.createElement("div");
                messageDOM[0].classList =
                  "chatbot__message chatbot__message--left is-hidden is-loading";
                messageDOM[0].innerHTML =
                  '<div class="chatbot__message__choice" ><span class="hejchatbot_info">' +
                  title_button +
                  '</span><div class="chatbot__message__choice__buttons"></div></div>';

                for (var i = 0; i < buttonArrayLength; i++) {
                  messageDOM[0].querySelector(
                    ".chatbot__message__choice__buttons"
                  ).innerHTML += `<button data-type="start_chat_action" data-button_type="custom" data-content="" data-text="${configuration.banner.custom_settings.fake_buttons[i]}">${configuration.banner.custom_settings.fake_buttons[i]}</button>`;
                }

                fragment.appendChild(messageDOM[0]);
              }
            } else {
              if (configuration.voice && !configuration.voice.flag) {
                messageDOM[0] = document.createElement("div");
                messageDOM[0].classList =
                  "chatbot__message chatbot__message--left is-hidden is-loading";
                messageDOM[0].innerHTML =
                  '<div class="chatbot__message__choice" ><span class="hejchatbot_info">' +
                  title_button +
                  '</span><div class="chatbot__message__choice__buttons"></div></div>';
                messageDOM[0].querySelector(
                  ".chatbot__message__choice__buttons"
                ).innerHTML = `<button data-type="start_chat_action" data-button_type="custom" data-content="" data-text="Inizia chat">Inizia chat</button>`;
                fragment.appendChild(messageDOM[0]);
              }
            } // if (DOMReference.hej_send_to_messenger) {
            //   DOMReference.hejchatbot__chat.insertBefore(fragment, DOMReference.hej_send_to_messenger);
            // } else

            if (DOMReference.hej_user_input_div) {
              DOMReference.hejchatbot__chat.appendChild(fragment);
            }

            let fake_messages =
              DOMReference.hejchatbot__chat.querySelectorAll(
                ".chatbot__message"
              );

            if (fake_messages.length > 0) {
              addFakeMessage(
                DOMReference.hejchatbot__chat,
                fake_messages,
                fakeMessageIndex
              );
            }
          } else {
            if (arrayLength > 0) {
              for (var i = 0; i < arrayLength; i++) {
                messageDOM[i] = document.createElement("div");
                messageDOM[i].classList =
                  "chatbot__message chatbot__message--left is-hidden is-loading fake";
                messageDOM[
                  i
                ].innerHTML = `<span class="bot_avatar"></span><span class="chatbot__message__text"><div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><span class="is-loading is-hidden">${configuration.banner.custom_settings.fake_messages[i]}</span></span>`;
                fragment.appendChild(messageDOM[i]);
              }

              hejchatbot__chat_fake.appendChild(fragment);
            }

            let fake_messages =
              hejchatbot__chat_fake.querySelectorAll(".chatbot__message");

            if (fake_messages.length > 0) {
              addFakeMessage(
                hejchatbot__chat_fake,
                fake_messages,
                fakeMessageIndex
              );
            }
          }
        };

        let addFakeMessage = (container, DOMessages, fakeMessageIndex) => {
          if (fakeMessageIndex == 2) {
            DOMessages[1].querySelector(".bot_avatar").style.opacity = 0;
            DOMessages[1]
              .querySelector(".chatbot__message__text")
              .classList.add("no-after");
          }

          let fake_message = {
            bubble: DOMessages[fakeMessageIndex],
            content: DOMessages[fakeMessageIndex].querySelector(
              ".chatbot__message__text"
            ),
            text_content: DOMessages[fakeMessageIndex].querySelector(
              ".chatbot__message__text > span"
            ),
            avatar: DOMessages[fakeMessageIndex].querySelector(".bot_avatar"),
            loading: DOMessages[fakeMessageIndex].querySelector(".typing"),
            dots: DOMessages[fakeMessageIndex].querySelectorAll(".typing .dot"),
          }; // scroll della chat

          fake_message.bubble.classList.remove("is-loading");
          fake_message.bubble.classList.remove("is-hidden");
          let bubbleOffset =
            fake_message.bubble.offsetTop + fake_message.bubble.offsetHeight;

          if (bubbleOffset > container.offsetHeight) {
            anime_es({
              targets: container,
              scrollTop: bubbleOffset,
              duration: 100,
            });
          } // animazione entrata bubble da sinistra + opacità

          anime_es({
            targets: fake_message.bubble,
            opacity: {
              value: [0, 1],
              duration: 400,
            },
            translateX: {
              value: [-55, 0],
              duration: 200,
            },
            easing: "easeInOutQuad",
          }); //animazione del typing dot

          anime_es({
            targets: fake_message.dots,
            translateY: [
              {
                value: -7,
              },
              {
                value: 0,
              },
            ],
            scale: [
              {
                value: 1.2,
              },
              {
                value: 1,
              },
            ],
            duration: 800,
            loop: true,
            easing: "easeInOutQuad",
            delay: function (el, i, l) {
              return i * 200 + 100;
            },
          }); // imposto timer per stoppare animazione tiping dot e visualizzare il contenuto del messaggio

          setTimeout(function () {
            let finalWidth = undefined;
            let finalHeight = undefined;
            let startHeight = undefined;
            let startWidth = undefined;

            if (fake_message.loading != null) {
              //workaround per una corretta animazione delle bubble di testo
              startHeight = fake_message.loading.getBoundingClientRect().height;
              startWidth = fake_message.loading.getBoundingClientRect().width;
              CommonHandler.removeElement(fake_message.loading);
              fake_message.text_content.classList.remove("is-loading");
              fake_message.text_content.classList.remove("is-hidden");
              let paddingLeft = window
                .getComputedStyle(fake_message.content, null)
                .getPropertyValue("padding-left");
              let paddingTop = window
                .getComputedStyle(fake_message.content, null)
                .getPropertyValue("padding-top");
              let text_dimensions =
                fake_message.content.getBoundingClientRect();
              fake_message.text_content.style.display = "none";
              startHeight = startHeight - parseInt(paddingTop) * 2;
              startWidth = startWidth - parseInt(paddingLeft) * 2;
              finalWidth = text_dimensions.width - parseInt(paddingLeft) * 2;
              finalHeight = text_dimensions.height - parseInt(paddingTop) * 2; // se bubble ha contenuto testuale
              // animazione della bubble di testo, opacity width and height

              anime_es({
                targets: fake_message.content,
                width: [startWidth, finalWidth],
                height: [startHeight, finalHeight],
                duration: 150,
                easing: "easeInOutQuad",
                complete: function (anim) {
                  fake_message.text_content.style.display = "inline-block";
                  fake_message.content.style.width = "auto";
                  fake_message.content.style.height = "auto";
                },
              });
              anime_es({
                targets: fake_message.text_content,
                opacity: [0, 1],
                duration: 150,
                delay: 150,
                easing: "easeInOutQuad",
                complete: function (anim) {
                  if (fakeMessageIndex != DOMessages.length - 1) {
                    if (
                      fakeMessageIndex == 1 &&
                      configuration.banner.type != "interstitial" &&
                      configuration.banner.type != "preroll"
                    ) {
                      ++fakeMessageIndex;
                      setTimeout(function () {
                        addFakeMessage(container, DOMessages, fakeMessageIndex);
                      }, 4000);
                    } else {
                      if (
                        configuration.banner.type != "interstitial" &&
                        configuration.banner.type != "preroll"
                      ) {
                        fake_message.avatar.style.opacity = 0;
                        fake_message.content.classList.add("no-after");
                      }

                      ++fakeMessageIndex;
                      addFakeMessage(container, DOMessages, fakeMessageIndex);
                    }
                  }
                },
              });
            } //scroll della chat

            let bubbleOffset =
              fake_message.bubble.offsetTop + fake_message.bubble.offsetHeight;

            if (bubbleOffset > container.offsetHeight) {
              anime_es({
                targets: container,
                scrollTop: bubbleOffset,
                duration: 100,
                delay: 100,
              });
            }
          }, anime_es.random(1000, 1100)); // durata dell'animazione del typing dot
        };

        return {
          init,
          clearActivities,
          startActivities,
          addFakeMessages,
        };
      })(); // CONCATENATED MODULE: ./app/js/core/ui.js
      const UIController = (function () {
        let DOMReference = null;
        let SpeechRecognition = null;
        let recognition = null;
        let currentMessageIndex = 0; // indice del messaggio corrente

        let htmlContent = null; // contenuto html dei messaggi,

        let language = "it";
        let configuration = null; // let project_id = null

        let first_time = true;
        let autocompleteLibrary = null;
        let autocompleteListener = null;
        let parsed_response = null;
        let isLast = null;
        let validation = null;
        let input_validation_callback;
        const timing = {
          DOT_DURATION: 0,
          MESSAGE_INTERVAL: 0,
          MESSAGE_OPACITY: 0,
          MESSAGE_ENTRANCE_DURATION: 0,
          MESSAGE_TEXT_CONTENT_EXPAND: 0,
          MESSAGE_TEXT_CONTENT_OPACITY: 0,
          MESSAGE_NON_TEXT_VISIBILITY: 0,
          MESSAGE_ENTRANCE_EASING: "easeInOutQuad",
          MESSAGE_ENTRANCE_DIRECTION: "left",
        };
        var map = {
          // "123456789": ["https://s3-eu-west-1.amazonaws.com/media-hej/troc/audio/1637071658243.mp3"],
          123456789: [
            "https://s3-eu-west-1.amazonaws.com/media-hej/hej/audio/empty_sound-1668685283785-tumblr.mpeg",
          ],
        };

        function startPlayback(id) {
          var audio_test = document.querySelector("#hej_voice_speaker"); // var src = map[id];
          // audio_test.src = src;

          return audio_test.play();
        }

        let init = () => {
          input_validation_callback =
            CommonHandler.debounce(checkInputValidity); //get global variable from jade

          configuration = web_project_configuration; // project_id = web_project_id;
          // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference();
          language = configuration.language
            ? configuration.language.code
            : "it";
          timing.DOT_DURATION =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing.dot_velocity
              ? configuration.conversation.animation.timing.dot_velocity
              : 800;
          timing.MESSAGE_INTERVAL =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing.message_interval
              ? configuration.conversation.animation.timing.message_interval
              : 600;
          timing.MESSAGE_OPACITY =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing.bubble_opacity
              ? configuration.conversation.animation.timing.bubble_opacity
              : 400;
          timing.MESSAGE_ENTRANCE_DURATION =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing.bubble_entrance_duration
              ? configuration.conversation.animation.timing
                  .bubble_entrance_duration
              : 200;
          timing.MESSAGE_TEXT_CONTENT_EXPAND =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing
              .bubble_text_content_expand
              ? configuration.conversation.animation.timing
                  .bubble_text_content_expand
              : 100;
          timing.MESSAGE_TEXT_CONTENT_OPACITY =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing
              .bubble_text_content_opacity
              ? configuration.conversation.animation.timing
                  .bubble_text_content_opacity
              : 150;
          timing.MESSAGE_NON_TEXT_VISIBILITY =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing
              .bubble_content_visibility
              ? configuration.conversation.animation.timing
                  .bubble_content_visibility
              : 250;
          timing.MESSAGE_ENTRANCE_EASING =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing.bubble_entrance_easing
              ? configuration.conversation.animation.timing
                  .bubble_entrance_easing
              : "easeInOutQuad";
          timing.MESSAGE_ENTRANCE_DIRECTION =
            configuration.conversation &&
            configuration.conversation.animation &&
            configuration.conversation.animation.timing &&
            configuration.conversation.animation.timing
              .bubble_entrance_direction
              ? configuration.conversation.animation.timing
                  .bubble_entrance_direction
              : "left";
          setCssProperty();
          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );

          if (DOMReference.infoInput) {
            DOMReference.infoInput.textContent = currentIdiom.user_input_text;
          }

          if (configuration.type == "landing") {
            LandingUI.init();
          } else if (configuration.type == "banner") {
            BannerUI.init();
          } else if (configuration.type == "widget") {
            WidgetUI.init();
          }

          initListener();

          if (
            configuration.type == "landing" &&
            !configuration.conversation.disableTyping &&
            !configuration.conversation.disableFirstTyping
          ) {
            initTyping();
          }
        };

        let initTyping = () => {
          // crea contenitore messaggi uguale per tutti
          let messageContainer = DOMReference.document.createElement("div");
          messageContainer.classList.add("chatbot__message");
          messageContainer.classList.add(`chatbot__message--left`);
          let loaderObject = Render.createTypingLoader(DOMReference);
          messageContainer.appendChild(loaderObject.bot_avatar);
          messageContainer.appendChild(loaderObject.loading_message); // aggiungo messaggio

          DOMReference.hejchatbot__chat.appendChild(messageContainer);
          let scaleValue = 1.5;
          let translateValue = -10;
          let animation = {
            targets: messageContainer,
            opacity: {
              value: [0, 1],
              duration: timing.MESSAGE_OPACITY,
            },
            easing: timing.MESSAGE_ENTRANCE_EASING,
          };

          if (timing.MESSAGE_ENTRANCE_DIRECTION == "left") {
            animation["translateX"] = {
              value: [-55, 0],
              duration: timing.MESSAGE_ENTRANCE_DURATION,
            };
          } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "right") {
            animation["translateX"] = {
              value: [55, 0],
              duration: timing.MESSAGE_ENTRANCE_DURATION,
            };
          } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "top") {
            animation["translateY"] = {
              value: [-55, 0],
              duration: timing.MESSAGE_ENTRANCE_DURATION,
            };
          } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "bottom") {
            animation["translateY"] = {
              value: [55, 0],
              duration: timing.MESSAGE_ENTRANCE_DURATION,
            };
          } else {
            animation["translateX"] = {
              value: [-55, 0],
              duration: timing.MESSAGE_ENTRANCE_DURATION,
            };
          }

          anime_es(animation);

          if (loaderObject.loading_message) {
            anime_es({
              targets: loaderObject.loading_message.querySelectorAll(".dot"),
              translateY: [
                {
                  value: translateValue,
                },
                {
                  value: 0,
                },
              ],
              scale: [
                {
                  value: scaleValue,
                },
                {
                  value: 1,
                },
              ],
              duration: timing.DOT_DURATION,
              loop: true,
              easing: "easeInOutQuad",
              delay: function (el, i, l) {
                return i * 200 + 100;
              },
            });
          }
        };

        let initListener = () => {
          if (configuration.voice && configuration.voice.flag) {
            const animations = document.querySelectorAll(
              "[data-animation-wave]"
            );

            if (animations) {
              animations.forEach((animation) => {
                animation.onanimationend = (event) => {
                  // console.log(event)
                  animation.style.height = "";
                };
              });
            }

            let audio = document.getElementById("hej_voice_speaker");
            audio.addEventListener("ended", nextMessage);
            DOMReference.hejchatbot__chat.classList.add("voice");
            DOMReference.hejchatbot.classList.add("voice");
            DOMReference.hej_user_input_div.style.margin = "0";
            DOMReference.hej_user_input_div.style.padding = "0";
            DOMReference.hej_user_input_div.classList.add("active");
            DOMReference.hej_user_input_div.classList.add("voice");
            DOMReference.hejchatbot.style.margin = "0";
            if (configuration.voice.show_chat == false)
              DOMReference.hejchatbot__chat.style.display = "none";
            SpeechRecognition =
              window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
              recognition = new SpeechRecognition();
              recognition.lang = "it-IT";
              recognition.continuous = false;
              recognition.interimResults = false;
              recognition.addEventListener("result", (e) => {
                console.log("recognition API result event", e);
                let audio = document.getElementById("hej_voice_speaker");

                if (!audio.paused) {
                  console.log("audio currently playing, discard result");
                  return;
                }

                DOMReference.user_message_voice.style.display = "none";
                DOMReference.hej_user_input_voice_info.style.display = "none";
                let last = e.results.length - 1;
                let text = e.results[last][0].transcript; // console.log('Confidence: ' + e.results[0][0].confidence);
                // console.log('Voice Text: ' + text);

                DOMReference.hej_user_input_voice_info.textContent =
                  "Processando la registrazione";
                DOMReference.user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
                DOMReference.hej_user_input.value = text;
                DOMReference.user_message_button.click();
              });
              recognition.addEventListener("speechend", function (e) {
                recognition.stop();
                console.log("recognition API end event", e);
                DOMReference.hej_user_input_voice_info.textContent =
                  "Registrazione terminata";
                DOMReference.user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
                setTimeout(() => {
                  DOMReference.hej_user_input_voice_info.textContent =
                    "PREMI SUL MICROFONO PER PARLARE";
                }, 500);
              });
              recognition.addEventListener("nomatch", () => {
                console.error("NoMatch event: Speech not recognized");
                DOMReference.hej_user_input_voice_info.textContent =
                  "Processando la registrazione";
                DOMReference.user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
                DOMReference.user_message_voice_talking.style.height = "0";
                DOMReference.user_message_voice.style.display = "flex";
                DOMReference.hej_user_input_voice_info.style = "";
              });
              recognition.addEventListener("error", function (event) {
                console.log(
                  `Speech recognition error detected: ${event.error}`
                );
                console.log(`Additional information: ${event.message}`);
                DOMReference.hej_user_input_voice_info.textContent =
                  "Processando la registrazione";
                DOMReference.user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
                DOMReference.user_message_voice_talking.style.height = "0";
                DOMReference.user_message_voice.style.display = "flex";
                DOMReference.hej_user_input_voice_info.style = "";
              });
              recognition.addEventListener("audiostart", (event) => {
                console.log("recognition API audioStart event", event);
              });
              recognition.addEventListener("speechstart", (event) => {
                console.log("recognition API speechstart event", event);
              });
              recognition.addEventListener("soundstart", (event) => {
                console.log("recognition API soundstart event", event);
              });
              recognition.addEventListener("soundend", (event) => {
                console.log("recognition API soundend event", event);
              });
              recognition.addEventListener("speechend", (event) => {
                console.log("recognition API speechend event", event);
              });
              recognition.addEventListener("audioend", (event) => {
                console.log("recognition API audioend event", event);
              });
            } else {
              console.log("Speech Recognition non è supportata");
            }

            if (SpeechRecognition) {
              DOMReference.user_message_voice.addEventListener("click", () => {
                if (first_time) {
                  startPlayback("123456789")
                    .then(function () {
                      console.log("The play() Promise fulfilled! Rock on!");
                    })
                    .catch(function (error) {
                      console.log("The play() Promise rejected!");
                      console.log("Use the Play button instead.");
                      console.log(error);
                    });
                  DOMReference.user_message_voice.style.display = "none";
                  DOMReference.hej_user_input_voice_info.style.display = "none";
                  let svg =
                    DOMReference.user_message_voice.querySelector("svg");
                  svg.style.width = "40px";
                  svg.style.height = "40px";
                  DOMReference.hej_user_input_voice_info.style.fontSize =
                    "12px";
                  first_time = false;
                  return;
                }

                if (DOMReference.hejchatbot__chat.childElementCount > 0) {
                  recognition.start();
                  setTimeout(function () {
                    recognition.stop();
                  }, 6000);
                  DOMReference.hej_user_input_voice_info.style.fontSize =
                    "12px";
                  DOMReference.hej_user_input_voice_info.textContent =
                    "Sto ascoltando...";
                  DOMReference.user_message_voice
                    .getElementsByTagName("svg")[0]
                    .classList.add("rec");
                }
              });
            }
          }
        }; // setta le proprietà della chat che possono essere cambiate da configuratore

        let setCssProperty = () => {
          if (
            configuration.hasOwnProperty("avatar") &&
            configuration.avatar.background &&
            configuration.avatar.background.type == "media" &&
            configuration.avatar.background.media_id &&
            configuration.avatar.background.media_id.media &&
            typeof configuration.avatar.background.media_id.media == "object"
          ) {
            let image = configuration.avatar.background.media_id.media.small
              ? configuration.avatar.background.media_id.media.small.url
              : configuration.avatar.background.media_id.media.original.url;
            DOMReference.document.documentElement.style.setProperty(
              "--avatar-image",
              `url('${image}')`
            );
          } else {
            DOMReference.document.documentElement.style.setProperty(
              "--avatar-image",
              `url('${configuration.avatar_image}')`
            );
          }

          if (configuration.hasOwnProperty("background")) {
            if (configuration.background.type == "color") {
              DOMReference.document.documentElement.style.setProperty(
                "--background-color",
                configuration.background.color[0]
              );
            } else if (configuration.background.type == "gradient") {
              let gradient = "linear-gradient(to top,";

              if (
                configuration.background.color &&
                configuration.background.color.length > 0
              ) {
                configuration.background.color.forEach(function (
                  element,
                  index,
                  array
                ) {
                  if (index == array.length - 1) {
                    return (gradient += `${element})`);
                  }

                  gradient += `${element},`;
                });
              }

              DOMReference.document.documentElement.style.setProperty(
                "--background-image",
                gradient
              );
            } else if (configuration.background.type == "image") {
              configuration.background.image_url.desktop =
                configuration.background_image ||
                configuration.background.image_url.desktop;
              configuration.background.image_url.mobile =
                configuration.background_image_mobile
                  ? configuration.background_image_mobile
                  : configuration.background &&
                    configuration.background.image_url &&
                    configuration.background.image_url.mobile &&
                    configuration.background.image_url.mobile != ""
                  ? configuration.background.image_url.mobile
                  : configuration.background.image_url.desktop;
              DOMReference.document.documentElement.style.setProperty(
                "--background-image",
                `url('${configuration.background.image_url.desktop}')`
              );
              DOMReference.document.documentElement.style.setProperty(
                "--background-image-mobile",
                `url('${configuration.background.image_url.mobile}')`
              );

              if (configuration.background.hide_background) {
                DOMReference.document.documentElement.style.setProperty(
                  "--background-color",
                  configuration.background.hide_background_color ||
                    configuration.background.color[0]
                );
              }
            } else if (configuration.background.type == "media") {
              //let dimension = CommonHandler.checkViewportSize();
              if (
                configuration.hasOwnProperty("media_id") &&
                configuration.media_id.hasOwnProperty("desktop") &&
                configuration.media_id.hasOwnProperty("mobile") &&
                configuration.media_id.desktop &&
                configuration.media_id.mobile &&
                configuration.media_id.desktop.media &&
                configuration.media_id.mobile.media
              ) {
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image",
                  `url('${
                    configuration.media_id.desktop.media.extralarge
                      ? configuration.media_id.desktop.media.extralarge.url
                      : configuration.media_id.desktop.media.large
                      ? configuration.media_id.desktop.media.large.url
                      : configuration.media_id.desktop.media.original.url
                  }')`
                );
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image-mobile",
                  `url('${
                    configuration.media_id.mobile.media.extralarge
                      ? configuration.media_id.mobile.media.extralarge.url
                      : configuration.media_id.mobile.media.large
                      ? configuration.media_id.mobile.media.large.url
                      : configuration.media_id.mobile.media.original.url
                  }')`
                ); // DOMReference.document.documentElement.style.setProperty('--background-image', `url('${configuration.media_id.desktop.media[dimension] ? configuration.media_id.desktop.media[dimension].url : configuration.media_id.desktop.media.original.url}')`);
                // DOMReference.document.documentElement.style.setProperty('--background-image-mobile', `url('${configuration.media_id.mobile.media.small ? configuration.media_id.mobile.media.small.url : configuration.media_id.mobile.media.original.url}')`);
              } else {
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image",
                  `url('${configuration.background.image_url.desktop}')`
                );
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image-mobile",
                  `url('${configuration.background.image_url.mobile}')`
                );
              }

              if (configuration.background.hide_background) {
                DOMReference.document.documentElement.style.setProperty(
                  "--background-color",
                  configuration.background.hide_background_color ||
                    configuration.background.color[0]
                );
              }
            }

            if (
              configuration.background.scroll &&
              configuration.background.scroll.flag
            ) {
              if (mobileCheck()) {
                // console.log("mobile version");
                let img = document.getElementById("img_parallax");

                if (img) {
                  if (configuration.background.type == "image") {
                    img.src = configuration.background_image_mobile
                      ? configuration.background_image_mobile
                      : configuration.background &&
                        configuration.background.image_url &&
                        configuration.background.image_url.mobile &&
                        configuration.background.image_url.mobile != ""
                      ? configuration.background.image_url.mobile
                      : configuration.background.image_url.desktop;
                  } else {
                    img.src = configuration.media_id.mobile.media.extralarge
                      ? configuration.media_id.mobile.media.extralarge.url
                      : configuration.media_id.mobile.media.large
                      ? configuration.media_id.mobile.media.large.url
                      : configuration.media_id.mobile.media.original.url;
                  }
                }
              }
            }

            if (configuration.progress_bar && configuration.progress_bar.flag) {
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-empty",
                configuration.progress_bar.bar_empty_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-filled",
                configuration.progress_bar.bar_fill_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-empty",
                configuration.progress_bar.circle_empty_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-filled",
                configuration.progress_bar.circle_fill_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-active",
                configuration.progress_bar.circle_active_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-passed",
                configuration.progress_bar.circle_passed_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-passed-icon",
                configuration.progress_bar.circle_passed_icon_color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--step-progress-bar-step-label",
                configuration.progress_bar.text_color
              );
            }
          }

          if (configuration.hasOwnProperty("topbar")) {
            if (
              configuration.topbar.hasOwnProperty("color") &&
              configuration.topbar.color != ""
            ) {
              DOMReference.document.documentElement.style.setProperty(
                "--title-text-color",
                configuration.topbar.color
              );
              DOMReference.document.documentElement.style.setProperty(
                "--subtitle-text-color",
                configuration.topbar.color
              );
            }

            if (
              configuration.topbar.hasOwnProperty("title") &&
              configuration.topbar.title
            ) {
              DOMReference.document.documentElement.style.setProperty(
                "--title-text-color",
                configuration.topbar.title.text_color
              );
            }

            if (
              configuration.topbar.hasOwnProperty("subtitle") &&
              configuration.topbar.subtitle
            ) {
              DOMReference.document.documentElement.style.setProperty(
                "--subtitle-text-color",
                configuration.topbar.subtitle.text_color
              );
            }

            if (
              configuration.topbar.hasOwnProperty("logo") &&
              configuration.topbar.logo != ""
            ) {
              DOMReference.document.documentElement.style.setProperty(
                "--logo-image",
                `url('${configuration.topbar.logo}')`
              );
            }

            if (configuration.topbar.hasOwnProperty("background")) {
              let rgbaTopbar = CommonHandler.hexToRgbA(
                configuration.topbar.background,
                configuration.topbar.opacity || 1
              );
              DOMReference.document.documentElement.style.setProperty(
                "--top-bar-color",
                rgbaTopbar
              );
            }

            if (
              configuration.topbar.hasOwnProperty("border_bottom_color") &&
              configuration.topbar.border_bottom_color != ""
            ) {
              DOMReference.document.documentElement.style.setProperty(
                "--topbar-border-bottom-color",
                "1px solid " + configuration.topbar.border_bottom_color
              );
            }

            if (
              configuration.topbar.hasOwnProperty("image") &&
              configuration.topbar.image.type == "media" &&
              configuration.topbar.image.media_id &&
              configuration.topbar.image.media_id.media
            ) {
              let image = configuration.topbar.image.media_id.media.small
                ? configuration.topbar.image.media_id.media.small.url
                : configuration.topbar.image.media_id.media.original.url;
              DOMReference.document.documentElement.style.setProperty(
                "--logo-image",
                `url('${image}')`
              );
            }
          }

          if (configuration.conversation && configuration.conversation.user) {
            configuration.conversation.user.background_color =
              configuration.user_message_background_color ||
              configuration.conversation.user.background_color;
            configuration.conversation.user.text_color =
              configuration.user_message_text_color ||
              configuration.conversation.user.text_color;
            let rgbaUser = CommonHandler.hexToRgbA(
              configuration.conversation.user.background_color,
              configuration.conversation.user.opacity || 1
            );
            DOMReference.document.documentElement.style.setProperty(
              "--user-background-color",
              rgbaUser
            );
            DOMReference.document.documentElement.style.setProperty(
              "--user-text-color",
              configuration.conversation.user.text_color
            ); // DOMReference.document.documentElement.style.setProperty('--user-border-color', "2px solid" + configuration.conversation.user.border_color);

            DOMReference.document.documentElement.style.setProperty(
              "--user-border-color",
              configuration.conversation.user.border_color
            );
          } else {
            DOMReference.document.documentElement.style.setProperty(
              "--user-background-color",
              configuration.user_message_background_color
            );
            DOMReference.document.documentElement.style.setProperty(
              "--user-text-color",
              configuration.user_message_text_color
            );
          }

          if (configuration.conversation && configuration.conversation.bot) {
            configuration.conversation.bot.background_color =
              configuration.bot_message_background_color ||
              configuration.conversation.bot.background_color;
            configuration.conversation.bot.text_color =
              configuration.bot_message_text_color ||
              configuration.conversation.bot.text_color;
            let rgbaBot = CommonHandler.hexToRgbA(
              configuration.conversation.bot.background_color,
              configuration.conversation.bot.opacity || 1
            );
            DOMReference.document.documentElement.style.setProperty(
              "--bot-background-color",
              rgbaBot
            );
            DOMReference.document.documentElement.style.setProperty(
              "--bot-text-color",
              configuration.conversation.bot.text_color
            ); // DOMReference.document.documentElement.style.setProperty('--bot-border-color', "2px solid "  + configuration.conversation.bot.border_color);

            DOMReference.document.documentElement.style.setProperty(
              "--bot-border-color",
              configuration.conversation.bot.border_color
            );
          } else {
            DOMReference.document.documentElement.style.setProperty(
              "--bot-background-color",
              configuration.bot_message_background_color
            );
            DOMReference.document.documentElement.style.setProperty(
              "--bot-text-color",
              configuration.bot_message_text_color
            );
          }

          if (
            configuration.conversation &&
            configuration.conversation.font_size
          ) {
            DOMReference.document.documentElement.style.setProperty(
              "--font-size-text",
              configuration.conversation.font_size + "px"
            );
          }

          if (
            configuration.conversation &&
            configuration.conversation.font_weight
          ) {
            DOMReference.document.documentElement.style.setProperty(
              "--font-weight-text",
              configuration.conversation.font_weight
            );
          }

          if (
            configuration.conversation &&
            configuration.conversation.bubble_border_rounded
          ) {
            DOMReference.document.documentElement.style.setProperty(
              "--bubble-border-radius",
              "30px"
            );
            DOMReference.document.documentElement.style.setProperty(
              "--text-before-content",
              "none"
            );
            DOMReference.document.documentElement.style.setProperty(
              "--swipe-img-radius",
              "20px"
            );
          }

          if (
            configuration.conversation &&
            configuration.conversation.info_text_color
          ) {
            DOMReference.document.documentElement.style.setProperty(
              "--info-text-color",
              configuration.conversation.info_text_color
            );
          }

          if (
            configuration.type == "widget" &&
            configuration.widget.type == "video"
          ) {
            document.documentElement.style.setProperty(
              "--widget-main-color",
              configuration.widget.main_color
            );
            document.documentElement.style.setProperty(
              "--widget-secondary-color",
              configuration.widget.secondary_color
            );
            document.documentElement.style.setProperty(
              "--widget-background-color",
              configuration.widget.background_color
            );
            document.documentElement.style.setProperty(
              "--widget-voice-color",
              "2px solid " + configuration.widget.main_color
            ); // document.documentElement.style.setProperty('--widget-loader-color', configuration.widget.main_color + " transparent transparent transparent");

            document.documentElement.style.setProperty(
              "--widget-loader-color",
              configuration.widget.main_color
            );
            let rgbaValue = CommonHandler.hexToRgbA(
              configuration.widget.main_color,
              0.4
            );
            document.documentElement.style.setProperty(
              "--wdiget-button-selected",
              rgbaValue
            );
            rgbaValue = CommonHandler.hexToRgbA(
              configuration.widget.main_color,
              1
            );
            document.documentElement.style.setProperty(
              "--wdiget-button-shadow-hover",
              rgbaValue + " 0px 0px 0px 1px"
            );
          }

          if (
            configuration.type != "widget" &&
            configuration.footer &&
            configuration.footer.hasOwnProperty("show") &&
            configuration.footer.show == false
          ) {
            CommonHandler.changeCssProperty(
              DOMReference.hejchatbot_footer,
              "display",
              "none"
            );
          } // cambio laout topbar

          if (
            configuration.hasOwnProperty("topbar") &&
            (configuration.type != "widget" ||
              (configuration.type == "banner" &&
                configuration.banner &&
                configuration.banner.type != "expandable_box" &&
                configuration.banner.type != "masthead"))
          ) {
            if (
              configuration.topbar.hasOwnProperty("show") &&
              configuration.topbar.show == false
            ) {
              CommonHandler.changeCssProperty(
                DOMReference.hejchatbot_header,
                "display",
                "none"
              );
            } else {
              if (
                configuration.topbar.hasOwnProperty("title") &&
                configuration.topbar.title.text != "" &&
                configuration.type == "landing"
              ) {
                document.getElementById("hejchatbot_header_title").textContent =
                  configuration.topbar.title.text;
              } else {
                CommonHandler.changeCssProperty(
                  document.getElementById("hejchatbot_header_title"),
                  "display",
                  "none"
                );
              }

              if (
                configuration.topbar.hasOwnProperty("subtitle") &&
                configuration.topbar.subtitle.text != "" &&
                configuration.type == "landing"
              ) {
                document.getElementById(
                  "hejchatbot_header_subtitle"
                ).textContent = configuration.topbar.subtitle.text;
              } else {
                CommonHandler.changeCssProperty(
                  document.getElementById("hejchatbot_header_subtitle"),
                  "display",
                  "none"
                );
              }
            }
          }
        }; // aggiunta dei messaggi della chat

        let addMessages = (message_owner, res) => {
          toggleInteraction(true, true);

          if (configuration.voice && configuration.voice.flag) {
            let audio = document.getElementById("hej_voice_speaker");
            audio.removeEventListener("ended", nextMessage);
            audio.addEventListener("ended", nextMessage);
          }

          parsed_response = res; //creo tutto il contenuto html dei messaggi

          currentMessageIndex = 0;
          htmlContent = undefined;
          htmlContent = createHtml(message_owner, parsed_response.messages); // aggiungo messaggio

          addMessage(message_owner, parsed_response);
        };

        let createHtml = (message_owner, messages) => {
          let elements = [];
          let element = null;
          let loaderObject = null;
          messages.forEach((message, index) => {
            loaderObject = null;

            if (message_owner == "user") {
              if (message.type == "text") {
                element = Render.createTextContent(
                  message_owner,
                  message,
                  DOMReference
                );
              }
            } else if (message_owner == "bot") {
              if (message.type == "text") {
                element = Render.createTextContent(
                  message_owner,
                  message,
                  DOMReference
                );
              } else if (message.type == "button") {
                element = Render.createButtonContent(
                  message,
                  DOMReference,
                  language,
                  configuration.type
                );
              } else if (message.type == "card") {
                element = Render.createCardContent(
                  message,
                  DOMReference,
                  language,
                  configuration.type
                );
              } else if (message.type == "quick") {
                element = Render.createQuickContent(
                  message,
                  DOMReference,
                  language,
                  configuration.type
                );
              } else if (message.type == "image") {
                element = Render.createImageContent(message, DOMReference);
              } else if (message.type == "video") {
                element = Render.createVideoContent(message, DOMReference);
              } else if (message.type == "file") {
                element = Render.createFileContent(
                  message,
                  DOMReference,
                  language
                );
              } else if (message.type == "audio") {
                element = Render.createAudioContent(message, DOMReference);
              } else if (message.type == "custom_template") {
                if (message.subType == "form") {
                  DOMReference.document.removeEventListener(
                    "formsubmit",
                    formSubmit
                  );
                  DOMReference.document.addEventListener(
                    "formsubmit",
                    formSubmit
                  );
                  DOMReference.document.removeEventListener(
                    "formFailSubmit",
                    formFailSubmit
                  );
                  DOMReference.document.addEventListener(
                    "formFailSubmit",
                    formFailSubmit
                  );
                } else if (message.subType == "interaction") {
                  DOMReference.document.removeEventListener(
                    "swipeCompleted",
                    swipeCompleted
                  );
                  DOMReference.document.addEventListener(
                    "swipeCompleted",
                    swipeCompleted
                  );
                }

                element = Render.createTemplateContent(
                  message,
                  DOMReference,
                  language
                );
              }
            }

            let messageContainer = null;
            let nodes = null;

            if (index == 0 && message_owner == "bot") {
              nodes = DOMReference.document.querySelectorAll(
                "div.chatbot__message:not(.fake)"
              );

              if (
                nodes.length > 0 &&
                nodes[nodes.length - 1].classList.contains(
                  "chatbot__message--left"
                )
              ) {
                messageContainer = nodes[nodes.length - 1];
              } else {
                messageContainer = DOMReference.document.createElement("div");
                messageContainer.classList.add("chatbot__message");
                messageContainer.classList.add(
                  `${
                    message_owner == "bot"
                      ? "chatbot__message--left"
                      : "chatbot__message--right"
                  }`
                );
              } // if(!messageContainer){
              //   messageContainer = DOMReference.document.createElement("div");
              //   messageContainer.classList.add("chatbot__message");
              //   messageContainer.classList.add(`${message_owner == 'bot' ? 'chatbot__message--left' : 'chatbot__message--right'}`);
              // }
            } else {
              messageContainer = DOMReference.document.createElement("div");
              messageContainer.classList.add("chatbot__message");
              messageContainer.classList.add(
                `${
                  message_owner == "bot"
                    ? "chatbot__message--left"
                    : "chatbot__message--right"
                }`
              );
            }

            if (
              message_owner == "bot" &&
              element.message_type != "button" &&
              element.message_type != "quick_reply" &&
              element.message_type != "list_suggestions" &&
              element.message_type != "form_full" &&
              element.message_type != "swipe"
            ) {
              if (index != 0) {
                loaderObject = Render.createTypingLoader(DOMReference);
                messageContainer.appendChild(loaderObject.bot_avatar);
                messageContainer.appendChild(loaderObject.loading_message);
              } else {
                if (messageContainer) {
                  let bot_avatar =
                    messageContainer.querySelector(".bot_avatar");
                  let loading_message = messageContainer.querySelector(
                    ".chatbot__message__text"
                  );

                  if (bot_avatar && loading_message) {
                    loaderObject = {
                      bot_avatar,
                      loading_message,
                    };
                  } else {
                    loaderObject = Render.createTypingLoader(DOMReference);
                    messageContainer.appendChild(loaderObject.bot_avatar);
                    messageContainer.appendChild(loaderObject.loading_message);
                  }
                }
              }

              if (configuration.conversation.disableTyping) {
                messageContainer.removeChild(loaderObject.loading_message);
                loaderObject.loading_message = undefined;
              }

              let disabled =
                DOMReference.hejchatbot__chat.childElementCount == 0 &&
                index == 0;

              if (
                configuration.type == "banner" &&
                configuration.banner &&
                configuration.banner.custom_settings &&
                ((configuration.banner.subtype == "standard" &&
                  (configuration.banner.type == "interstitial" ||
                    configuration.banner.type == "preroll")) ||
                  (configuration.banner.subtype == "interactive" &&
                    (configuration.banner.type == "halfpage" ||
                      (configuration.banner.type == "expandable_box" &&
                        configuration.chat_overlay))))
              ) {
                let elements = DOMReference.hejchatbot__chat.querySelectorAll(
                  "div.chatbot__message--left:not(.fake)"
                );
                if (elements.length == 0 && index == 0) disabled = true;
              }

              if (configuration.conversation.disableFirstTyping && disabled) {
                messageContainer.removeChild(loaderObject.loading_message);
                loaderObject.loading_message = undefined;
              }
            }

            if (
              element.message_type != "list_suggestions" &&
              element.message_type != "form_full"
            ) {
              messageContainer.appendChild(element.content_message);
            }

            elements.push({
              bubble: messageContainer,
              avatar: loaderObject ? loaderObject.bot_avatar : undefined,
              content: element.content_message,
              content_id: element.content_message_id,
              loading: loaderObject ? loaderObject.loading_message : undefined,
              text_content: element.text_content || undefined,
              message_type: element.message_type,
              elements_qty: element.elements_qty || undefined,
              speech: element.speech || undefined, // delay: element.delay && element.delay.schedule ? element.delay.schedule.seconds * 1000 : anime.random(100, 5000)
            });
          });
          return elements;
        }; // aggiunta del singolo messaggio

        let addMessage = (message_owner, parsed_response) => {
          if (configuration.voice && configuration.voice.flag) {
            let audio = document.getElementById("hej_voice_speaker");
            audio.src = htmlContent[currentMessageIndex].speech; // audio.src = parsed_response.messages[currentMessageIndex].audio;
          }

          isLast = htmlContent.length - 1 == currentMessageIndex; // imposto la durata dell'animazione typing dot in base a valore preso dal server oppure default
          // let dotDuration = isLast ? 1200 : (htmlContent[currentMessageIndex].delay ? htmlContent[currentMessageIndex].delay : 1200);

          let dotDuration = timing.MESSAGE_INTERVAL;

          if (
            htmlContent[currentMessageIndex].message_type == "button" ||
            htmlContent[currentMessageIndex].message_type == "quick_reply"
          ) {
            dotDuration = 200;
          }

          if (configuration.voice && configuration.voice.flag) {
            dotDuration = 400;
          }

          if (configuration.conversation.disableTyping) {
            dotDuration = 300;
          }

          let disabled =
            DOMReference.hejchatbot__chat.childElementCount == 0 &&
            currentMessageIndex == 0;

          if (
            configuration.type == "banner" &&
            configuration.banner &&
            configuration.banner.custom_settings &&
            ((configuration.banner.subtype == "standard" &&
              (configuration.banner.type == "interstitial" ||
                configuration.banner.type == "preroll")) ||
              (configuration.banner.subtype == "interactive" &&
                (configuration.banner.type == "halfpage" ||
                  (configuration.banner.type == "expandable_box" &&
                    configuration.chat_overlay))))
          ) {
            let elements = DOMReference.hejchatbot__chat.querySelectorAll(
              "div.chatbot__message--left:not(.fake)"
            );
            if (elements.length == 0 && currentMessageIndex == 0)
              disabled = true;
          }

          if (configuration.conversation.disableFirstTyping && disabled) {
            dotDuration = 300;
          } // if (DOMReference.hej_send_to_messenger) {
          //   DOMReference.hejchatbot__chat.insertBefore(htmlContent[currentMessageIndex].bubble, DOMReference.hej_send_to_messenger);
          // }
          // if(currentMessageIndex == 0 &&  configuration.type == "banner" && configuration.banner && configuration.banner.type == "interstitial" && (configuration.conversation.disableFirstTyping ||configuration.conversation.disableTyping ) ) {
          //   showFirst = false;
          // }

          DOMReference.hejchatbot__chat.appendChild(
            htmlContent[currentMessageIndex].bubble
          );

          if (isLast) {
            // se mi trovo nell'ultimo messaggio visualizzato invio un evento custom per il delivery
            // DOMReference.hejchatbot__chat.setAttribute('data-content_id', parsed_response.content_id);
            // let event  = CommonHandler.getEvent("delivery");
            // DOMReference.hejchatbot__chat.dispatchEvent(event.content);
            ChatController.sendMetrics(
              parsed_response.content_id,
              "flow",
              "read"
            );

            if (
              htmlContent[currentMessageIndex].message_type ==
              "list_suggestions"
            ) {
              let elem = document.getElementById("list_suggestions_container");
              elem.classList.add("active");
              return;
            }

            if (htmlContent[currentMessageIndex].message_type == "form_full") {
              return;
            } // if (htmlContent[currentMessageIndex].message_type == "form") {
            //   let elem = document.getElementById("form_container");
            //   elem.classList.add("minified");
            //   return;
            // }
            //cambio l'input utente in base a quello che mi arriva dal server

            if (
              parsed_response.hasOwnProperty("info") &&
              ((!parsed_response.info.hasOwnProperty("input_isVisible") &&
                htmlContent[currentMessageIndex].message_type == "text") ||
                parsed_response.info.input_isVisible)
            ) {
              DOMReference.hej_user_input.removeAttribute("inputmode");
              DOMReference.hej_user_input.removeAttribute("pattern"); // se ho proprietà info e ultimo messaggio è di testo

              if (DOMReference.hej_user_input_div) {
                DOMReference.hej_user_input_div.classList.remove("invalid");
              }

              if (DOMReference.hej_user_input) {
                delete DOMReference.hej_user_input.dataset.type;
                DOMReference.hej_user_input.setAttribute("type", "text");
                DOMReference.hej_user_input.setAttribute(
                  "autocomplete",
                  "name"
                );
                DOMReference.hej_user_input.setAttribute(
                  "placeholder",
                  parsed_response.info.input_placeholder
                );
              } // se input type è specificato

              if (parsed_response.info.input_type !== "") {
                if (DOMReference.hej_user_input) {
                  DOMReference.hej_user_input.setAttribute(
                    "type",
                    parsed_response.info.input_type
                  );
                  DOMReference.hej_user_input.setAttribute(
                    "placeholder",
                    parsed_response.info.input_placeholder
                  );

                  if (parsed_response.info.input_type == "zipcode") {
                    DOMReference.hej_user_input.setAttribute("type", "tel");
                    DOMReference.hej_user_input.setAttribute(
                      "inputmode",
                      "numeric"
                    );
                    DOMReference.hej_user_input.pattern = "[0-9]*";
                    DOMReference.hej_user_input.removeAttribute("autocomplete");
                  }

                  if (parsed_response.info.input_type == "number") {
                    DOMReference.hej_user_input.setAttribute("type", "tel");
                    DOMReference.hej_user_input.setAttribute(
                      "inputmode",
                      "numeric"
                    );
                    DOMReference.hej_user_input.pattern = "[0-9]*";
                    DOMReference.hej_user_input.removeAttribute("autocomplete");
                  }

                  if (
                    parsed_response.info.input_type == "file_document" ||
                    parsed_response.info.input_type == "file_image" ||
                    parsed_response.info.input_type == "file_video" ||
                    parsed_response.info.input_type == "file_audio"
                  ) {
                    DOMReference.hej_user_input.setAttribute("type", "file");

                    if (parsed_response.info.input_type == "file_video") {
                      DOMReference.hej_user_input.setAttribute(
                        "accept",
                        "video/mp4, video/webm, video/ogg"
                      );
                    } else if (
                      parsed_response.info.input_type == "file_image"
                    ) {
                      DOMReference.hej_user_input.setAttribute(
                        "accept",
                        "image/png, image/jpeg, image/gif"
                      );
                    } else if (
                      parsed_response.info.input_type == "file_audio"
                    ) {
                      DOMReference.hej_user_input.setAttribute(
                        "accept",
                        "audio/mpeg, audio/ogg, audio/wav, audio/webm"
                      );
                    } else if (
                      parsed_response.info.input_type == "file_document"
                    ) {
                      DOMReference.hej_user_input.setAttribute(
                        "accept",
                        "application/pdf"
                      );
                    }
                  } else if (
                    parsed_response.info.input_type == "address" &&
                    configuration.type != "widget"
                  ) {
                    DOMReference.hej_user_input.setAttribute("type", "text");
                    DOMReference.hej_user_input.removeAttribute("autocomplete");
                    DOMReference.hej_user_input.dataset.type = "address";
                    DOMReference.hej_user_input_standard.classList.add(
                      "address"
                    );
                    const options = {
                      fields: ["formatted_address", "geometry", "name"],
                      strictBounds: false,
                      types: ["address"],
                    }; // check if script exist

                    if (
                      typeof google === "object" &&
                      typeof google.maps === "object"
                    ) {
                      autocompleteLibrary = new google.maps.places.Autocomplete(
                        DOMReference.hej_user_input,
                        options
                      );
                      autocompleteLibrary.setComponentRestrictions({
                        country: ["it"],
                      }); //codici lingua progetto non congruenti con i codici richiesti da google autocomplete

                      if (
                        configuration.language &&
                        configuration.language.code
                      ) {
                        let language = configuration.language.code;

                        if (configuration.language.code == "ja") {
                          language = "jp";
                        } else if (configuration.language.code == "en") {
                          language = "gb";
                        }

                        autocompleteLibrary.setComponentRestrictions({
                          country: [language],
                        });
                      }

                      DOMReference.hej_user_input.removeEventListener(
                        "keypress",
                        UIController.processInput
                      );
                      setTimeout(function () {
                        let pac = document.querySelector(".pac-container");
                        let container =
                          DOMReference.hej_user_input_standard.querySelector(
                            "div"
                          );
                        let pac_container_div = document.createElement("div");
                        pac_container_div.id = "pac_container_div";
                        DOMReference.hej_user_input_standard.insertBefore(
                          pac_container_div,
                          container
                        );
                        pac_container_div.appendChild(pac);
                      }, 200);
                      autocompleteListener = autocompleteLibrary.addListener(
                        "place_changed",
                        () => {
                          const place = autocompleteLibrary.getPlace(); // console.log("place", place);

                          if (!place.formatted_address) {
                            return;
                          }

                          let dataToSend = {
                            ...place,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                          };
                          CommonHandler.setCustomObject(dataToSend);
                          DOMReference.hej_user_input.addEventListener(
                            "keypress",
                            UIController.processInput
                          );
                          DOMReference.hej_user_input.focus();
                        }
                      ); // autocomplete.unbindAll();
                      // google.maps.event.removeListener(autLtr);
                      // google.maps.event.clearInstanceListeners(DOMReference.hej_user_input);

                      setTimeout(function () {
                        DOMReference.hej_user_input.setAttribute(
                          "autocomplete",
                          "off"
                        );
                      }, 500);
                    } else {
                      // Create new script element
                      const script = document.createElement("script");
                      script.src =
                        "https://maps.googleapis.com/maps/api/js?key=AIzaSyDMLfLBtJ1vR9YudwrGWm3uAQIa1a379S4&libraries=places&v=weekly"; // Append to the `head` element

                      document.head.appendChild(script);
                      script.addEventListener("load", function () {
                        // The script is loaded completely
                        // Do something
                        autocompleteLibrary =
                          new google.maps.places.Autocomplete(
                            DOMReference.hej_user_input,
                            options
                          );
                        autocompleteLibrary.setComponentRestrictions({
                          country: ["it"],
                        }); //codici lingua progetto non congruenti con i codici richiesti da google autocomplete

                        if (
                          configuration.language &&
                          configuration.language.code
                        ) {
                          let language = configuration.language.code;

                          if (configuration.language.code == "ja") {
                            language = "jp";
                          } else if (configuration.language.code == "en") {
                            language = "gb";
                          }

                          autocompleteLibrary.setComponentRestrictions({
                            country: [language],
                          });
                        }

                        DOMReference.hej_user_input.removeEventListener(
                          "keypress",
                          UIController.processInput
                        );
                        setTimeout(function () {
                          let pac = document.querySelector(".pac-container");
                          let container =
                            DOMReference.hej_user_input_standard.querySelector(
                              "div"
                            );
                          let pac_container_div = document.createElement("div");
                          pac_container_div.id = "pac_container_div";
                          DOMReference.hej_user_input_standard.insertBefore(
                            pac_container_div,
                            container
                          );
                          pac_container_div.appendChild(pac);
                        }, 200);
                        autocompleteListener = autocompleteLibrary.addListener(
                          "place_changed",
                          () => {
                            const place = autocompleteLibrary.getPlace(); // console.log("place", place);

                            if (!place.formatted_address) {
                              return;
                            }

                            let dataToSend = {
                              ...place,
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng(),
                            };
                            CommonHandler.setCustomObject(dataToSend);
                            DOMReference.hej_user_input.addEventListener(
                              "keypress",
                              UIController.processInput
                            );
                            DOMReference.hej_user_input.focus();
                          }
                        ); // autocomplete.unbindAll();
                        // google.maps.event.removeListener(autLtr);
                        // google.maps.event.clearInstanceListeners(DOMReference.hej_user_input);

                        setTimeout(function () {
                          DOMReference.hej_user_input.setAttribute(
                            "autocomplete",
                            "off"
                          );
                        }, 500);
                      });
                    }
                  } else if (parsed_response.info.input_type == "date") {
                    DOMReference.hej_user_input.dataset.type = "date";
                    DOMReference.hej_user_input.value = "2017-06-01";
                    DOMReference.hej_user_input.valueAsDate = new Date();
                    DOMReference.hej_user_input.removeAttribute("placeholder");
                    DOMReference.hej_user_input.removeAttribute("autocomplete");
                  } else if (parsed_response.info.input_type == "date_custom") {
                    DOMReference.hej_user_input.setAttribute(
                      "placeholder",
                      "GG/MM/AAAA"
                    );
                    DOMReference.hej_user_input.setAttribute(
                      "autocomplete",
                      "off"
                    );
                    DOMReference.hej_user_input.dataset.type = "date_custom";
                    DOMReference.hej_user_input.setAttribute("type", "tel");
                    FormHandler.setupCustomEventListener({
                      type: "date_custom",
                      content: DOMReference.hej_user_input,
                    });
                  } else if (parsed_response.info.input_type == "none_text") {
                    DOMReference.hej_user_input.setAttribute(
                      "autocomplete",
                      "off"
                    );
                  }

                  DOMReference.hej_user_input.removeEventListener(
                    "input",
                    input_validation_callback
                  );

                  if (
                    parsed_response.info.validation &&
                    configuration.type != "widget"
                  ) {
                    validation = parsed_response.info.validation || null;

                    if (parsed_response.info.validation.info) {
                      DOMReference.hej_user_input.setAttribute(
                        "placeholder",
                        parsed_response.info.validation.info
                      );
                    }

                    DOMReference.hej_user_input.removeEventListener(
                      "input",
                      input_validation_callback
                    );

                    if (
                      validation.validator &&
                      validation.validator.length > 0
                    ) {
                      DOMReference.hej_user_input.addEventListener(
                        "input",
                        input_validation_callback
                      );
                    }
                  }

                  if (
                    parsed_response.info.input_type == "email" ||
                    parsed_response.info.input_type == "tel"
                  ) {
                    DOMReference.hej_user_input.setAttribute(
                      "autocomplete",
                      parsed_response.info.input_type
                    );
                  }

                  if (parsed_response.info.input_type == "zipcode") {
                    DOMReference.hej_user_input.setAttribute(
                      "autocomplete",
                      "off"
                    );
                  }

                  if (parsed_response.info.input_type == "number") {
                    DOMReference.hej_user_input.setAttribute(
                      "autocomplete",
                      "off"
                    );
                  }
                }
              } else {
                //fallback se non esiste proprietà info nel message
                if (DOMReference.hej_user_input) {
                  DOMReference.hej_user_input.setAttribute("type", "text");
                  DOMReference.hej_user_input.setAttribute(
                    "autocomplete",
                    "name"
                  );
                  DOMReference.hej_user_input.setAttribute(
                    "placeholder",
                    "Scrivi qui..."
                  );
                }
              }
            }
          } // scroll della chat

          let bubbleOffset =
            htmlContent[currentMessageIndex].bubble.offsetTop +
            htmlContent[currentMessageIndex].bubble.offsetHeight;

          if (bubbleOffset > DOMReference.hejchatbot__chat.offsetHeight) {
            anime_es({
              targets: DOMReference.hejchatbot__chat,
              scrollTop: bubbleOffset,
              duration: 100,
            });
          } // se messaggi del bot

          if (message_owner == "bot") {
            if (SpeechRecognition) {
              // DOMReference.user_message_voice_talking.style.display = "flex"
              // const animations = document.querySelectorAll('[data-animation-wave]');
              // animations.forEach(animation => {
              //   animation.classList.remove("silent");
              //   animation.style.height = '';
              //   // const running = animation.style.animationPlayState || 'running';
              //   animation.classList.add("no-anim");
              //   console.log("height " + animation.offsetHeight)
              // });
              // setTimeout(function(){
              //   animations.forEach(animation => {
              //     // const running = animation.style.animationPlayState || 'running';
              //     animation.style.height = animation.offsetHeight + "px";
              //     animation.classList.add("silent");
              //     animation.classList.remove("no-anim");
              //   });
              // }, 200)
              DOMReference.user_message_voice_talking.style.height = "65px";
              DOMReference.user_message_voice.style.display = "none";
              DOMReference.hej_user_input_voice_info.style.display = "none";
            }

            if (message_owner == "bot" && currentMessageIndex != 0) {
              let animation = {
                targets: htmlContent[currentMessageIndex].bubble,
                opacity: {
                  value: [0, 1],
                  duration: timing.MESSAGE_OPACITY,
                },
                easing: timing.MESSAGE_ENTRANCE_EASING,
              };

              if (timing.MESSAGE_ENTRANCE_DIRECTION == "left") {
                animation["translateX"] = {
                  value: [-55, 0],
                  duration: timing.MESSAGE_ENTRANCE_DURATION,
                };
              } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "right") {
                animation["translateX"] = {
                  value: [55, 0],
                  duration: timing.MESSAGE_ENTRANCE_DURATION,
                };
              } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "top") {
                animation["translateY"] = {
                  value: [-55, 0],
                  duration: timing.MESSAGE_ENTRANCE_DURATION,
                };
              } else if (timing.MESSAGE_ENTRANCE_DIRECTION == "bottom") {
                animation["translateY"] = {
                  value: [55, 0],
                  duration: timing.MESSAGE_ENTRANCE_DURATION,
                };
              } else {
                animation["translateX"] = {
                  value: [-55, 0],
                  duration: timing.MESSAGE_ENTRANCE_DURATION,
                };
              }

              anime_es(animation);
            }

            if (
              htmlContent[currentMessageIndex].message_type != "quick_reply" &&
              htmlContent[currentMessageIndex].message_type != "button"
            ) {
              //animazione del typing dot
              let scaleValue = 1.5;
              let translateValue = -10;

              if (configuration.banner.type == "preroll") {
                scaleValue = 1.2;
                translateValue = -7;
              }

              if (
                htmlContent[currentMessageIndex].loading &&
                currentMessageIndex != 0
              ) {
                anime_es({
                  targets:
                    htmlContent[currentMessageIndex].loading.querySelectorAll(
                      ".dot"
                    ),
                  translateY: [
                    {
                      value: translateValue,
                    },
                    {
                      value: 0,
                    },
                  ],
                  scale: [
                    {
                      value: scaleValue,
                    },
                    {
                      value: 1,
                    },
                  ],
                  duration: timing.DOT_DURATION,
                  loop: true,
                  easing: "easeInOutQuad",
                  delay: function (el, i, l) {
                    return i * 200 + 100;
                  },
                });
              }
            } // imposto timer per stoppare animazione tiping dot e visualizzare il contenuto del messaggio

            setTimeout(function () {
              let finalWidth = undefined;
              let finalHeight = undefined;
              let startHeight = undefined;
              let startWidth = undefined;
              let bubbleOffset = undefined;

              if (
                htmlContent[currentMessageIndex].message_type != "button" &&
                htmlContent[currentMessageIndex].message_type != "quick_reply"
              ) {
                //workaround per una corretta animazione delle bubble di testo
                if (htmlContent[currentMessageIndex].loading) {
                  startHeight =
                    htmlContent[
                      currentMessageIndex
                    ].loading.getBoundingClientRect().height;
                  startWidth =
                    htmlContent[
                      currentMessageIndex
                    ].loading.getBoundingClientRect().width;
                } else {
                  startHeight = 0;
                  startWidth = 0;
                }

                if (htmlContent[currentMessageIndex].loading) {
                  CommonHandler.removeElement(
                    htmlContent[currentMessageIndex].loading
                  );
                }
              }

              htmlContent[currentMessageIndex].content.classList.remove(
                "is-loading"
              );
              htmlContent[currentMessageIndex].content.classList.remove(
                "is-hidden"
              );
              let paddingLeft = window
                .getComputedStyle(
                  htmlContent[currentMessageIndex].content,
                  null
                )
                .getPropertyValue("padding-left");
              let paddingTop = window
                .getComputedStyle(
                  htmlContent[currentMessageIndex].content,
                  null
                )
                .getPropertyValue("padding-top");
              let text_dimensions =
                htmlContent[
                  currentMessageIndex
                ].content.getBoundingClientRect();

              if (htmlContent[currentMessageIndex].text_content) {
                htmlContent[currentMessageIndex].text_content.style.display =
                  "none";
                startHeight = startHeight - parseInt(paddingTop) * 2;
                startWidth = startWidth - parseInt(paddingLeft) * 2;
                finalWidth = text_dimensions.width - parseInt(paddingLeft) * 2;
                finalHeight = text_dimensions.height - parseInt(paddingTop) * 2;
              } // se bubble ha contenuto testuale

              if (htmlContent[currentMessageIndex].text_content) {
                // animazione della bubble di testo, opacity width and height
                anime_es({
                  targets: htmlContent[currentMessageIndex].content,
                  width: [startWidth, finalWidth],
                  height: [startHeight, finalHeight],
                  duration: timing.MESSAGE_TEXT_CONTENT_EXPAND,
                  easing: "easeInOutQuad",
                  complete: function (anim) {
                    if (htmlContent[currentMessageIndex].text_content)
                      htmlContent[
                        currentMessageIndex
                      ].text_content.style.display = "inline-block";
                    htmlContent[currentMessageIndex].content.style.width =
                      "auto";
                    htmlContent[currentMessageIndex].content.style.height =
                      "auto";
                    bubbleOffset =
                      htmlContent[currentMessageIndex].bubble.offsetTop +
                      htmlContent[currentMessageIndex].bubble.offsetHeight;
                    anime_es({
                      targets: DOMReference.hejchatbot__chat,
                      scrollTop: bubbleOffset,
                      duration: 200,
                    }); // htmlContent[currentMessageIndex].avatar.style.opacity = 0;

                    htmlContent[currentMessageIndex].content.classList.add(
                      "no-after"
                    );

                    if (isLast) {
                      if (
                        parsed_response.hasOwnProperty("info") &&
                        ((!parsed_response.info.hasOwnProperty(
                          "input_isVisible"
                        ) &&
                          htmlContent[currentMessageIndex].message_type ==
                            "text") ||
                          parsed_response.info.input_isVisible)
                      ) {
                        setTimeout(toggleInteraction(false, false), 200);
                      } else {
                        toggleInteraction(false, true);
                      } // scroll della chat
                      // bubbleOffset = htmlContent[currentMessageIndex].bubble.offsetTop + htmlContent[currentMessageIndex].bubble.offsetHeight;
                      // anime({
                      //   targets: DOMReference.hejchatbot__chat,
                      //   scrollTop: bubbleOffset,
                      //   duration: 200,
                      //   complete: function (anim) {
                      //   }
                      // });

                      if (
                        parsed_response.hasOwnProperty("info") &&
                        ((!parsed_response.info.hasOwnProperty(
                          "input_isVisible"
                        ) &&
                          htmlContent[currentMessageIndex].message_type ==
                            "text") ||
                          parsed_response.info.input_isVisible)
                      ) {
                        setTimeout(toggleInteraction(false, false), 200);
                      } else {
                        toggleInteraction(false, true);
                      }
                    } else {
                      // htmlContent[currentMessageIndex].avatar.style.opacity = 0;
                      htmlContent[currentMessageIndex].content.classList.add(
                        "no-after"
                      );
                    }
                  },
                });
                anime_es({
                  targets: htmlContent[currentMessageIndex].text_content,
                  opacity: [0, 1],
                  duration: timing.MESSAGE_TEXT_CONTENT_OPACITY,
                  delay: timing.MESSAGE_TEXT_CONTENT_EXPAND + 50,
                  easing: "easeOutElastic",
                  complete: function (anim) {
                    if (
                      htmlContent[currentMessageIndex].message_type ==
                        "audio" ||
                      htmlContent[currentMessageIndex].message_type == "video"
                    ) {
                      htmlContent[currentMessageIndex].text_content.play();
                    } // if (SpeechRecognition) {

                    if (configuration.voice && configuration.voice.flag) {
                      // DOMReference.user_message_voice_talking.style.display = "flex"
                      // DOMReference.user_message_voice.style.display = "none";
                      // DOMReference.hej_user_input_voice_info.style.display = "none";
                      // const synth = window.speechSynthesis;
                      // const utterance = new SpeechSynthesisUtterance();
                      // utterance.text = htmlContent[currentMessageIndex].text_content.textContent;
                      // synth.speak(utterance);
                      // utterance.onend = function (event) {
                      //   if (isLast) {
                      //     DOMReference.user_message_voice_talking.style.display = ""
                      //     DOMReference.user_message_voice.style.display = "flex";
                      //     DOMReference.hej_user_input_voice_info.style = "";
                      //     // TODO: se si vuole togliere l'ascolto della voce quando finisce di parlare il bot commentare questo click
                      //     // let user_message_voice = configuration.type == "banner" && configuration.banner && configuration.chat_overlay ? DOMReference.document.getElementById("user_message_voice_" + project_id) : DOMReference.document.getElementById("user_message_voice");
                      //     DOMReference.user_message_voice.click();
                      //   }
                      // }
                      if (!!htmlContent[currentMessageIndex].speech) {
                        let audio =
                          document.getElementById("hej_voice_speaker"); // let play_buttton = document.getElementById("user_message_voice");

                        audio.removeEventListener("ended", muteSpeaker);
                        audio.addEventListener("ended", muteSpeaker);

                        if (!first_time) {
                          var audio_promise = audio.play();

                          if (audio_promise !== undefined) {
                            audio_promise
                              .then((res) => {
                                console.log(
                                  "play audio from voice web project",
                                  res
                                ); // Auto-play started
                                // audio.muted = false;
                                // audio.setAttribute('muted', false);
                              })
                              .catch((error) => {
                                console.log("error audio promise :", error);
                                console.log(
                                  "error on play audio from voice web project"
                                ); // Auto-play was prevented
                                // Show a UI element to let the user manually start playback
                              });
                          }
                        }

                        const animations = document.querySelectorAll(
                          "[data-animation-wave]"
                        );
                        animations.forEach((animation) => {
                          animation.style.height = ""; //const running = animation.style.animationPlayState || 'running';

                          animation.classList.remove("no-anim");
                          animation.classList.remove("silent");
                        });
                      }
                    } // if (configuration.voice && configuration.voice.flag && currentMessageIndex != htmlContent.length - 1 && htmlContent[currentMessageIndex + 1].text_content) {
                    //   htmlContent[currentMessageIndex].avatar.style.opacity = 0;
                    //   htmlContent[currentMessageIndex].content.classList.add("no-after");
                    // }

                    if (isLast) {
                      // if(configuration.voice && !configuration.voice.flag){
                      //   //toggleInteraction(false, false);
                      // }
                      // if (parsed_response.hasOwnProperty("info") && parsed_response.info.send_to_messenger && parsed_response.info.send_to_messenger.flag) {
                      //   enableFacebookPlugin();
                      // }
                      if (
                        parsed_response.hasOwnProperty("info") &&
                        ((!parsed_response.info.hasOwnProperty(
                          "input_isVisible"
                        ) &&
                          htmlContent[currentMessageIndex].message_type ==
                            "text") ||
                          parsed_response.info.input_isVisible)
                      ) {
                        toggleInteraction(false, false);
                      } else {
                        toggleInteraction(false, true);
                      }

                      if (
                        configuration.voice &&
                        configuration.voice.flag &&
                        !htmlContent[currentMessageIndex].speech
                      ) {
                        nextMessage();
                      }

                      currentMessageIndex = 0;
                    } else {
                      if (configuration.voice && !configuration.voice.flag) {
                        ++currentMessageIndex;
                        addMessage(message_owner, parsed_response);
                      } else if (
                        configuration.voice &&
                        configuration.voice.flag &&
                        !htmlContent[currentMessageIndex].speech
                      ) {
                        nextMessage();
                      }
                    }
                  },
                });
              } else {
                if (htmlContent[currentMessageIndex].message_type == "card") {
                  htmlContent[currentMessageIndex].avatar.style.opacity = 0;
                  htmlContent[currentMessageIndex].avatar.style.display =
                    "none";
                  htmlContent[currentMessageIndex].content.classList.add(
                    "no-after"
                  );

                  if (htmlContent[currentMessageIndex].elements_qty > 1) {
                    new Glider(
                      document.querySelector(
                        ".glider_" + htmlContent[currentMessageIndex].content_id
                      ),
                      {
                        slidesToShow: 1.5,
                        slidesToScroll: 1,
                        draggable: true,
                        dots:
                          ".dots_" +
                          htmlContent[currentMessageIndex].content_id,
                        arrows: {
                          prev:
                            "#glider-prev_" +
                            htmlContent[currentMessageIndex].content_id,
                          next:
                            "#glider-next_" +
                            htmlContent[currentMessageIndex].content_id,
                        },
                        responsive: [
                          {
                            // screens greater than >= 775px
                            breakpoint: 768,
                            settings: {
                              // Set to `auto` and provide item width to adjust to viewport
                              slidesToShow: 2.5,
                              slidesToScroll: 2,
                            },
                          },
                          {
                            // screens greater than >= 1024px
                            breakpoint: 1024,
                            settings: {
                              slidesToShow: 2.5,
                              slidesToScroll: 2,
                            },
                          },
                        ],
                      }
                    );
                  }
                } //animazione delle altre bubble, non testuali, es. bottoni, quick e card

                anime_es({
                  targets: htmlContent[currentMessageIndex].content,
                  opacity: [0, 1],
                  translateY: [45, 0],
                  duration: timing.MESSAGE_NON_TEXT_VISIBILITY,
                  easing: "easeInOutQuad",
                  complete: function (anim) {
                    bubbleOffset =
                      htmlContent[currentMessageIndex].bubble.offsetTop +
                      htmlContent[currentMessageIndex].bubble.offsetHeight;
                    anime_es({
                      targets: DOMReference.hejchatbot__chat,
                      scrollTop: bubbleOffset,
                      duration: 200,
                    }); //se ultimo messaggio abilito input utente e resetto index dei messaggi

                    if (isLast) {
                      //toggleInteraction(false, false);
                      // if (parsed_response.hasOwnProperty("info") && parsed_response.info.send_to_messenger && parsed_response.info.send_to_messenger.flag) {
                      //   enableFacebookPlugin();
                      // }
                      if (
                        parsed_response.hasOwnProperty("info") &&
                        ((!parsed_response.info.hasOwnProperty(
                          "input_isVisible"
                        ) &&
                          htmlContent[currentMessageIndex].message_type ==
                            "text") ||
                          parsed_response.info.input_isVisible)
                      ) {
                        toggleInteraction(false, false);
                      } else {
                        toggleInteraction(false, true);
                      }

                      currentMessageIndex = 0;
                    } else {
                      // se non è ultimo messaggio, aumento index e richiamo questa funzione
                      ++currentMessageIndex;
                      addMessage(message_owner, parsed_response);
                    }
                  },
                });
              } //scroll della chat
              // bubbleOffset = htmlContent[currentMessageIndex].bubble.offsetTop + htmlContent[currentMessageIndex].bubble.offsetHeight;
              // anime({
              //   targets: DOMReference.hejchatbot__chat,
              //   scrollTop: bubbleOffset,
              //   duration: 200,
              //   delay: 100,
              // });
            }, anime_es.random(dotDuration, dotDuration)); // durata dell'animazione del typing dot
          }
        };

        function muteSpeaker() {
          // DOMReference.user_message_voice_talking.style.display = "flex"
          const animations = document.querySelectorAll("[data-animation-wave]");
          animations.forEach((animation) => {
            animation.classList.remove("silent");
            animation.style.height = ""; // const running = animation.style.animationPlayState || 'running';

            animation.classList.add("no-anim"); // console.log("height " + animation.offsetHeight)
          });
          setTimeout(function () {
            animations.forEach((animation) => {
              // const running = animation.style.animationPlayState || 'running';
              animation.style.height = animation.offsetHeight + "px";
              animation.classList.add("silent");
              animation.classList.remove("no-anim");
            });
          }, 200);
        }

        function nextMessage() {
          if (isLast) {
            // recognition.start();
            let audio = document.getElementById("hej_voice_speaker");
            audio.removeEventListener("ended", nextMessage); // DOMReference.user_message_voice_talking.style.display = ""

            DOMReference.user_message_voice_talking.style.height = "0";
            DOMReference.user_message_voice.style.display = "flex";
            DOMReference.hej_user_input_voice_info.style = ""; // TODO: se si vuole togliere l'ascolto della voce quando finisce di parlare il bot commentare questo click
            // let user_message_voice = configuration.type == "banner" && configuration.banner && configuration.chat_overlay ? DOMReference.document.getElementById("user_message_voice_" + project_id) : DOMReference.document.getElementById("user_message_voice");

            if (
              parsed_response.hasOwnProperty("info") &&
              parsed_response.info.hasOwnProperty("voice")
            ) {
              if (parsed_response.info.voice.disabled) {
                DOMReference.user_message_voice.style.display = "none";
                DOMReference.hej_user_input_voice_info.style.display = "none";
                DOMReference.user_message_voice
                  .getElementsByTagName("svg")[0]
                  .classList.remove("rec");
              } else {
                if (!parsed_response.info.voice.push_to_talk) {
                  DOMReference.user_message_voice.click();
                }
              }
            } else {
              DOMReference.user_message_voice.click();
            }

            return;
          }

          if (
            currentMessageIndex != htmlContent.length - 1 &&
            htmlContent[currentMessageIndex + 1].text_content
          ) {
            htmlContent[currentMessageIndex].avatar.style.opacity = 0;
            htmlContent[currentMessageIndex].content.classList.add("no-after");
          }

          ++currentMessageIndex;
          addMessage("bot", parsed_response);
        }

        let processVideo = (data, startUp) => {
          // DOMReference.hej_widget_main_content.setAttribute('data-content_id', data.content_id);
          // let event = CommonHandler.getEvent("delivery");
          // DOMReference.hej_widget_main_content.dispatchEvent(event.content);
          DOMReference.document.removeEventListener("formsubmit", formSubmit);
          DOMReference.document.addEventListener("formsubmit", formSubmit);
          DOMReference.document.removeEventListener(
            "swipeCompleted",
            swipeCompleted
          );
          DOMReference.document.addEventListener(
            "swipeCompleted",
            swipeCompleted
          );
          WidgetUI.processVideo(data, startUp);
        };

        let enableFacebookPlugin = () => {
          if (DOMReference.hej_send_to_messenger) {
            DOMReference.hej_send_to_messenger.classList.remove("is-hidden");
            DOMReference.hej_send_to_messenger
              .querySelector(".fb-send-to-messenger")
              .classList.remove("is-hidden");
          }
        }; // enable/disable user interaction

        let toggleInteraction = (disableInteraction, disableInput) => {
          if (
            configuration.type == "banner" &&
            configuration.banner &&
            configuration.banner.type == "halfpage" &&
            configuration.banner.subtype == "full_chat"
          )
            return;

          if (disableInput) {
            // disable user input
            if (DOMReference.hej_user_input_div) {
              DOMReference.hej_user_input.disabled = disableInput;
              DOMReference.hej_user_input.value = "";

              if (
                !configuration.voice ||
                (configuration.voice && !configuration.voice.flag)
              ) {
                DOMReference.hej_user_input_div.classList.remove("active");
                DOMReference.hej_user_input_standard.classList.remove("active");
              }
            } //disable widget user input

            if (configuration.type == "widget") {
              if (configuration.widget.type != "video") {
                DOMReference.hej_user_input.disabled = disableInput;
                DOMReference.hej_user_input.value = "";
              }
            }
          } else {
            // enable user input
            if (DOMReference.hej_user_input_div) {
              DOMReference.hej_user_input_div.classList.add("active");
              DOMReference.hej_user_input_standard.classList.add("active");
              DOMReference.hej_user_input.disabled = false;
              DOMReference.hej_user_input.value = "";

              if (DOMReference.hej_user_input.dataset.type == "date") {
                // DOMReference.hej_user_input.value = '2017-06-01';
                DOMReference.hej_user_input.valueAsDate = new Date();
              }

              DOMReference.hej_user_input.focus();
            } //enable widget user input

            if (configuration.type == "widget") {
              DOMReference.hej_user_input.disabled = false;
              DOMReference.hej_user_input.value = "";

              if (DOMReference.hej_user_input.dataset.type == "date") {
                // DOMReference.hej_user_input.value = '2017-06-01';
                DOMReference.hej_user_input.valueAsDate = new Date();
              }

              DOMReference.hej_user_input.focus();
            } // scroll chat when enable input
            // if (DOMReference.hej_user_input_div) {
            //   let bubbleOffset = DOMReference.hej_user_input_div.offsetTop + DOMReference.hej_user_input_div.offsetHeight;
            //   anime({
            //     targets: DOMReference.hejchatbot__chat,
            //     // targets: configuration.type == "banner" && configuration.banner && configuration.chat_overlay ? DOMReference.document.getElementById("hejchatbot__chat_" + project_id) : DOMReference.document.getElementById("hejchatbot__chat"),
            //     scrollTop: bubbleOffset,
            //     duration: 500,
            //     complete: function () {
            //       DOMReference.hej_user_input.focus();
            //     }
            //   });
            // }
            // enable/disable widget video button

            if (
              configuration.type == "widget" &&
              configuration.widget.type == "video"
            ) {
              let answer_container =
                DOMReference.document.getElementById("answers_playground");

              if (answer_container) {
                let answer_buttons =
                  answer_container.querySelectorAll("button");
                answer_buttons.forEach((button) => {
                  button.disabled = disabled;
                });
              }
            }
          } // disable/enable all button

          let chatContainer = DOMReference.hejchatbot__chat;

          if (
            configuration.type == "widget" &&
            configuration.widget.type == "video"
          ) {
            chatContainer = DOMReference.hej_widget_footer;
          }

          let buttons = chatContainer.querySelectorAll(
            "button:not(.hej_form_submit)"
          );

          if (buttons && buttons.length > 0) {
            buttons.forEach((button) => {
              if (button.classList.contains("custom_button_list_suggestions"))
                return;
              button.disabled = disableInteraction;
            });
          }
        }; // enable standard input

        let enableStandardInput = (value) => {
          if (!DOMReference.hej_user_input_div) return;

          if (value) {
            DOMReference.hej_user_input_div.style.overflow = "";
            DOMReference.hej_user_input.style.display = "";
            DOMReference.user_message_button.style.display = "";
            DOMReference.infoInput.style.display = "";
          } else {
            DOMReference.hej_user_input_div.style.overflow = "visible";
            DOMReference.hej_user_input.style.display = "none";
            DOMReference.user_message_button.style.display = "none";
            DOMReference.infoInput.style.display = "none";
          }
        }; // remove google autocomplete logic

        let removeGoogleHandler = () => {
          DOMReference.hej_user_input_standard.classList.remove("address");
          autocompleteLibrary.unbindAll();
          google.maps.event.removeListener(autocompleteListener);
          google.maps.event.clearInstanceListeners(DOMReference.hej_user_input);
          let input_copy = DOMReference.hej_user_input.cloneNode(true);
          CommonHandler.removeElement(DOMReference.hej_user_input);
          CommonHandler.removeElement(document.querySelector(".pac-container"));
          let pac_container_div = document.getElementById("pac_container_div");
          CommonHandler.removeElement(pac_container_div);
          let div = DOMReference.hej_user_input_standard.querySelector("div");
          div.insertBefore(input_copy, DOMReference.user_message_button);
          DOMReference.hej_user_input =
            document.getElementById("hej_user_input"); // listener per l'invio dei messaggi dell utente

          if (DOMReference.hej_user_input) {
            DOMReference.hej_user_input.addEventListener(
              "keypress",
              processInput
            );
          }
        };

        let clearActivities = () => {
          BannerUI.clearActivities();
        };

        let startActivities = () => {
          BannerUI.startActivities();
        };

        let addFakeMessages = () => {
          BannerUI.addFakeMessages();
        }; // process user input

        let processInput = (evt, value = null) => {
          //disabilito il click sul pulsante invia input utente se input address e customData non è valorizzato
          if (
            DOMReference.hej_user_input &&
            DOMReference.hej_user_input.dataset.type &&
            DOMReference.hej_user_input.dataset.type == "address"
          ) {
            let customData = CommonHandler.getCustomObject();

            if (
              typeof customData != "object" ||
              !customData[0].formatted_address
            ) {
              return;
            }
          }

          if (
            (evt.type == "keypress" && evt.key == "Enter") ||
            evt.type == "click" ||
            evt.type == "message"
          ) {
            // handle input with custom date
            if (DOMReference.hej_user_input.dataset.type == "date_custom") {
              if (!testRegex(undefined, DOMReference.hej_user_input.value)) {
                return;
              }
            }

            let quick_div = null;

            if (
              configuration.type == "landing" ||
              configuration.type == "widget" ||
              (configuration.type == "banner" &&
                configuration.chat_overlay == false)
            ) {
              quick_div = document.querySelector(
                ".chatbot__message__choice__quicks"
              );

              if (quick_div) {
                quick_div.parentNode.parentNode.remove();
              }
            } else if (
              configuration.type == "banner" &&
              configuration.chat_overlay
            ) {
              quick_div = DOMReference.hejchatbot__chat.querySelector(
                ".chatbot__message__choice__quicks"
              );

              if (quick_div) {
                quick_div.parentNode.parentNode.remove();
              }
            }

            let userMessage =
              evt.type == "keypress"
                ? evt.target.value != undefined
                  ? evt.target.value
                  : evt.target.textContent
                : value;

            if (userMessage) {
              toggleInteraction(true, true);

              if (
                DOMReference.hej_user_input &&
                DOMReference.hej_user_input.dataset.type &&
                DOMReference.hej_user_input.dataset.type == "address"
              ) {
                removeGoogleHandler();
              }

              if (
                configuration.hasOwnProperty("background") &&
                configuration.background.hide_background &&
                configuration.background.type == "image" &&
                DOMReference.hejchatbot__chat.querySelectorAll(
                  ".chatbot__message--right"
                ).length == 0
              ) {
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image",
                  `none`
                );
                DOMReference.document.documentElement.style.setProperty(
                  "--background-image-mobile",
                  `none`
                );

                if (
                  configuration.type == "banner" &&
                  configuration.banner.type == "halfpage"
                ) {
                  DOMReference.hejchatbot__chat.style = "";
                }
              }

              if (
                configuration.footer &&
                configuration.footer.remove_first_interaction
              ) {
                if (DOMReference.document.getElementById("hejchatbot_footer")) {
                  CommonHandler.removeElement(DOMReference.hejchatbot_footer);
                }
              } //handle file upload

              if (
                typeof userMessage == "object" &&
                userMessage.hasOwnProperty("attachment")
              ) {
                let name = userMessage.attachment.name;
                delete userMessage.attachment.name;
                sendMessage(userMessage, undefined, name);
              } else {
                if (
                  DOMReference.hej_user_input &&
                  DOMReference.hej_user_input.dataset.type &&
                  DOMReference.hej_user_input.dataset.type == "address"
                ) {
                  let customData = CommonHandler.getCustomObject();
                  sendMessage(
                    userMessage,
                    "address",
                    customData.formattedAddress,
                    customData
                  );
                  delete DOMReference.hej_user_input.dataset.type;
                  return;
                }

                delete DOMReference.hej_user_input.dataset.type;
                FormHandler.removeCustomEventListener({
                  type: "date_custom",
                  content: DOMReference.hej_user_input,
                });
                sendMessage(userMessage);
              }
            }
          }
        }; // send message to bot

        let sendMessage = (
          message,
          message_type = "text",
          textmessage = null,
          opts = undefined
        ) => {
          if (message) {
            if (
              configuration.type != "widget" ||
              (configuration.type == "widget" &&
                configuration.widget.type != "video")
            ) {
              toggleInteraction(true, true);

              if (message_type != "swipe_complete") {
                // aggiungo messaggio dell'utente alla chat
                addMessages("user", {
                  messages: [
                    {
                      content: textmessage
                        ? textmessage
                        : message_type != "postback" &&
                          message_type != "quick_reply"
                        ? message
                        : "",
                      img: opts && opts.img ? opts.img : undefined,
                      type: "text",
                    },
                  ],
                });
              }

              if (configuration.conversation.disable_scroll) {
                removeAllChildNodes(DOMReference.hejchatbot__chat);

                if (
                  !configuration.conversation.disableTyping &&
                  !configuration.conversation.disableFirstTyping
                ) {
                  initTyping();
                }
              } else {
                if (
                  !configuration.conversation.disableTyping &&
                  !configuration.conversation.disableFirstTyping
                ) {
                  initTyping();
                }
              }
            } //sending adform event

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              message_type != "fake"
            ) {
              if (configuration.banner.type != "interstitial") {
                if (typeof dhtml !== "undefined") {
                  dhtml.sendEvent("1", "User Write To Bot");
                }
              } else if (configuration.banner.type == "interstitial") {
                if (typeof Adform !== "undefined") {
                  Adform.sendEvent(Adform.EVENT_CUSTOM_1);
                }
              }
            }

            if (message_type != "fake") {
              if (configuration.conversation.disable_scroll) {
                setTimeout(() => {
                  // chiamata API e parsing della risposta
                  ChatController.talk(message, message_type, opts);
                }, 300);
              } else {
                // chiamata API e parsing della risposta
                ChatController.talk(message, message_type, opts);
              }
            }
          }
        };

        let checkInputValidity = () => {
          let input_value = DOMReference.hej_user_input.value.trim();

          if (validation.operator && validation.operator == "and") {
            if (
              !validation.validator.every(function (elem, index) {
                return Validator.isRegexValid(input_value, elem);
              })
            ) {
              invalidateInput(true);
              return;
            }
          } else {
            if (
              !validation.validator.some(function (elem, index) {
                return Validator.isRegexValid(input_value, elem);
              })
            ) {
              invalidateInput(true);
              return;
            }
          }

          invalidateInput(false);
        };

        let invalidateInput = (value) => {
          if (value) {
            DOMReference.hej_user_input_div.classList.add("invalid");
            DOMReference.infoInput.textContent = "Il campo è richiesto";
            DOMReference.user_message_button.disabled = true;
          } else {
            DOMReference.hej_user_input_div.classList.remove("invalid");
            DOMReference.user_message_button.disabled = false;
            let currentIdiom = language_namespaceObject.m.find(
              (element) => element.code == language
            );

            if (DOMReference.infoInput) {
              DOMReference.infoInput.textContent = currentIdiom.user_input_text;
            }
          }
        };

        let mobileCheck = function () {
          let check = false;

          (function (a) {
            if (
              /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                a
              ) ||
              /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                a.substr(0, 4)
              )
            )
              check = true;
          })(navigator.userAgent || navigator.vendor || window.opera);

          return check;
        };

        function removeAllChildNodes(parent) {
          while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
          }
        }

        let nextStep = (label_id = null) => {
          if (!label_id || label_id == "") return;
          let next_li = null;
          let current_li = document.querySelector(
            `#step-list li.step[data-label="${label_id}"]`
          );
          let all_li = document.querySelectorAll("#step-list li");

          if (current_li) {
            current_li.classList.remove("passed");
            current_li.classList.add("active");
            let current_index = -1; // find index of element

            for (let i = 0; i < all_li.length; i++) {
              if (all_li[i].dataset.label == label_id) {
                current_index = i;
                break;
              }
            } // change step before current

            if (current_index > -1) {
              for (let i = 0; i < current_index; i++) {
                all_li[i].classList.remove("active");
                all_li[i].classList.add("passed");
              }
            } // change step after current

            for (let k = current_index + 1; k < all_li.length; k++) {
              all_li[k].classList.remove("active");
              all_li[k].classList.remove("passed");
            }
          } // let li_elements = document.querySelectorAll("#step-list li");
          // li_elements.forEach(element => {
          //     element.dataset.currentStep += 1;
          // });
          // set progress bar width

          let progress_bar = document.getElementById("step-bar");
          let active_step = current_li.dataset.step;
          progress_bar.style.width =
            ((active_step - 1) / (all_li.length - 1)) * 100 + "%";
        };

        let formSubmit = () => {
          if (
            configuration.type == "widget" &&
            configuration.widget.type == "video"
          ) {
            DOMReference.hej_widget_footer.classList.add("is-hidden");
            document.getElementById("hej_widget_video_loader").style.display =
              "";
          }

          let objectToSend = CommonHandler.getCustomObject();
          FormHandler.destroy();
          FormHandler.disableForm(true); // clear error property for backend bug

          if (objectToSend.groups) {
            objectToSend.groups.forEach((group) => {
              if (group.elements) {
                group.elements.forEach((element) => {
                  delete element.error;
                });
              }
            });
          }

          let currentIdiom = language_namespaceObject.m.find(
            (element) => element.code == language
          );
          sendMessage(
            "form_submit",
            "form_submit",
            currentIdiom.form_compiled,
            objectToSend
          );
          let form_container = document.querySelector(
            ".hej_form_container:last-of-type"
          );

          if (form_container) {
            form_container.classList.remove("expanded");
          } // if(configuration.type == "widget" && configuration.subtype == "video"){
          //   DOMReference.hej_widget_footer.classList.add("is-hidden");
          // }

          enableStandardInput(true);
        };

        let formFailSubmit = () => {
          if (
            configuration.type == "widget" &&
            configuration.widget.type == "video"
          ) {
            DOMReference.hej_widget_footer.classList.add("is-hidden");
            document.getElementById("hej_widget_video_loader").style.display =
              "";
          }

          let objectToSend = CommonHandler.getCustomObject();
          FormHandler.destroy();
          FormHandler.disableForm(true);
          sendMessage(
            objectToSend.falsy.payload,
            "form_fail_submit",
            "skip form",
            objectToSend
          );
          let form_container = document.querySelector(
            ".hej_form_container:last-of-type"
          );

          if (form_container) {
            form_container.classList.remove("expanded");
          } // if(configuration.type == "widget" && configuration.subtype == "video"){
          //   DOMReference.hej_widget_footer.classList.add("is-hidden");
          // }

          enableStandardInput(true);
        };

        let swipeCompleted = () => {
          let nodes = null;
          let messageContainer = null;
          nodes = DOMReference.document.querySelectorAll(
            "div.chatbot__message:not(.fake)"
          );

          if (
            nodes.length > 0 &&
            nodes[nodes.length - 1].classList.contains("chatbot__message--left")
          ) {
            messageContainer = nodes[nodes.length - 1];
            messageContainer.classList.add("chatbot__message--right");
            messageContainer.classList.remove("chatbot__message--left");
          }

          let lastSwipeDiv = document.querySelectorAll(".swipe__card");

          if (lastSwipeDiv && lastSwipeDiv.length > 0) {
            lastSwipeDiv[lastSwipeDiv.length - 1].classList.remove("shaking"); // lastSwipeDiv[lastSwipeDiv.length - 1].classList.remove("shaking-infinite");
          }

          let objectToSend = CommonHandler.getCustomObject();
          console.log("Intercept swipe complete event");
          console.log("objectToSend ", objectToSend);
          let payload = objectToSend.groups[0].interactions[0].payload;
          sendMessage(payload, "swipe_complete", undefined, objectToSend);
        };

        return {
          init,
          addMessages,
          processVideo,
          addFakeMessages,
          setCssProperty,
          clearActivities,
          startActivities,
          enableStandardInput,
          processInput,
          toggleInteraction,
          sendMessage,
          nextStep,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/landingController.js
      const LandingController = (function () {
        let sw = null; //service worker for push notification

        let publicVapidKey = "";
        let configuration = null;
        let DOMReference = null;

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration; // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference();
          publicVapidKey = configuration.publicVapidKey || "";
          initListener();
        };

        let initListener = () => {
          // confirm on closing page
          console.log("window.location.hostname", window.location.hostname);

          if (
            configuration.confirm_closing &&
            !window.location.hostname.includes("localhost") &&
            window.location.hostname.includes("hejagency.com")
          ) {
            window.addEventListener("beforeunload", function (e) {
              // Cancel the event
              e.preventDefault(); // Chrome requires returnValue to be set

              e.returnValue = "";
              window.confirm("");
            });
          } // listener su cambio orientamento da mobile o resize della finestra del browser.

          window.addEventListener("resize", () => {
            DOMReference.hejchatbot__chat.scrollTop =
              DOMReference.hejchatbot__chat.scrollHeight -
              DOMReference.hejchatbot__chat.clientHeight;
          }); // Mobile : serve per gestire l'altezza esatta della viewport senza le barre indirizzo etc.(problematica mobile, su molti device)
          // Se chat è esterna il selettore è la finestra superiore.
          // Se chat è interna il selettore è la finestra corrente
          // First we get the viewport height and we multiple it by 1% to get a value for a vh unit

          let vh = window.innerHeight * 0.01; // Then we set the value in the --vh custom property to the root of the document

          document.documentElement.style.setProperty("--vh", `${vh}px`);
          window.addEventListener("orientationchange", function () {
            // After orientationchange, add a one-time resize event
            var afterOrientationChange = function () {
              let vh = window.innerHeight * 0.01;
              document.documentElement.style.setProperty("--vh", `${vh}px`);
              DOMReference.hejchatbot__chat.scrollTop =
                DOMReference.hejchatbot__chat.scrollHeight; // Remove the resize event listener after it has executed

              window.removeEventListener("resize", afterOrientationChange);
            };

            window.addEventListener("resize", afterOrientationChange);
          }); // if (('serviceWorker' in navigator) && ('PushManager' in window)) {
          //     // Register service worker
          //     registerWorker();
          // } else {
          //     console.log('Push messaging is not supported')
          // }
        }; // check se utente ha abilitato le notifiche

        let getNotificationPermissionState = () => {
          if (navigator.permissions) {
            return navigator.permissions
              .query({
                name: "notifications",
              })
              .then((result) => {
                return result.state;
              });
          }

          return new Promise((resolve) => {
            resolve(Notification.permission);
          });
        }; // registrazione del service worker
        // function registerWorker() {
        //     sw = navigator.serviceWorker.register(window.location.origin + "/public/sw.js")
        //     .then(function (swReg) {
        //         console.log('Service Worker is registered', swReg);
        //         sw = swReg;
        //         if (configuration.ask_notification) {
        //             askNotificationPermission();
        //         }
        //     })
        //     .catch(function (error) {
        //         console.error('Service Worker Error', error);
        //     });
        // }

        let askNotificationPermission = () => {
          // Let's check if the browser supports notifications
          if (!("Notification" in window)) {
            console.log("This browser does not support notifications.");
          } else {
            if (checkNotificationPromise()) {
              Notification.requestPermission().then((permission) => {
                handlePermission(permission);
              });
            } else {
              Notification.requestPermission(function (permission) {
                handlePermission(permission);
              });
            }
          }
        };

        function checkNotificationPromise() {
          try {
            Notification.requestPermission().then();
          } catch (e) {
            return false;
          }

          return true;
        } // function to actually ask the permissions

        function handlePermission(permission) {
          // Whatever the user answers, we make sure Chrome stores the information
          if (!("permission" in Notification)) {
            Notification.permission = permission;
          }

          if (Notification.permission == "denied") {
            console.log("permessi bloccati dall'utente"); // We need the service worker registration to check for a subscription

            sw.pushManager
              .getSubscription()
              .then(function (subscription) {
                unsubscribeUser(subscription);
              })
              .catch(function (err) {
                console.log("Error unsubscribe user", err);
              });
          } else if (Notification.permission == "granted") {
            subscribeUser();
          }
        }

        let unsubscribeUser = (subscription) => {
          if (subscription) {
            subscription
              .unsubscribe()
              .then(function (successful) {
                console.log("Utente disiscritto");

                if (window.location.hostname == "localhost") {
                  var result = window.location.origin;
                } else {
                  var result = window.location.origin;
                }

                let user = undefined;

                if (CommonHandler.get_local_storage_status() == "available") {
                  user = JSON.parse(localStorage.getItem("hej_user"));
                }

                let subscriptionObject = {
                  user_id: user ? user._id : undefined,
                  subscription: undefined,
                  action: "unsubscribe",
                  status: "denied",
                };
                let subscribe_url = `${result}/api/v1/audience/subscribe`;
                http
                  .post(subscribe_url, subscriptionObject)
                  .then((result) => {
                    console.log(result);
                  })
                  .catch((err) => console.log(err));
                return;
              })
              .catch(function (e) {
                console.log("errore disiscrizione utente", e);
              });
          }

          if (window.location.hostname == "localhost") {
            var result = window.location.origin;
          } else {
            var result = window.location.origin;
          }

          let user = undefined;

          if (CommonHandler.get_local_storage_status() == "available") {
            user = JSON.parse(localStorage.getItem("hej_user"));
          }

          let subscriptionObject = {
            user_id: user ? user._id : undefined,
            subscription: undefined,
            action: "unsubscribe",
            status: "denied",
          };
          let subscribe_url = `${result}/api/v1/audience/subscribe`;
          http
            .post(subscribe_url, subscriptionObject)
            .then((result) => {
              console.log(result);
            })
            .catch((err) => console.log(err));
          return;
        }; // sottoscrizione utente alle notifiche

        function subscribeUser() {
          //subscribe user
          sw.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                CommonHandler.urlBase64ToUint8Array(publicVapidKey),
            })
            .then(function (subscription) {
              console.log("User is subscribed.");

              if (window.location.hostname == "localhost") {
                var result = window.location.origin;
              } else {
                var result = window.location.origin;
              }

              let user = undefined;

              if (CommonHandler.get_local_storage_status() == "available") {
                user = JSON.parse(localStorage.getItem("hej_user"));
              }

              let subscriptionObject = {
                user_id: user ? user._id : undefined,
                subscription: subscription,
                action: "subscribe",
                status: "granted",
              };
              let subscribe_url = `${result}/api/v1/audience/subscribe`;
              http
                .post(subscribe_url, subscriptionObject)
                .then(() => {
                  console.log("utente sottoscritto alle push notification");
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        }

        return {
          init,
          getNotificationPermissionState,
          askNotificationPermission,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/bannerController.js
      const BannerController = (function () {
        let configuration = null;
        let project_id = null;
        let DOMReference = null;

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration;
          project_id = web_project_id; // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference();
          initListener(); // if(configuration.banner.type == "interstitial"){
          //     checkScriptLoad();
          // }
        };

        let initListener = () => {
          // listener generali
          if (configuration.chat_overlay) {
            // Not top level. An iframe, popup or something
            if (window.top != window.self) {
              if (!DOMReference.document.getElementById("conversation_style")) {
                //add stylesheet to main page when we are in mobile overlay
                var cssUrl = document.getElementById("conversation_style").href;
                var link = DOMReference.document.createElement("link");
                link.href = cssUrl;
                link.type = "text/css";
                link.rel = "stylesheet";
                link.id = "conversation_style";
                DOMReference.document
                  .getElementsByTagName("head")[0]
                  .appendChild(link);
              }
            }

            let anchor_image = DOMReference.document.getElementById(
              "hejanchor_mobile_" + project_id
            );
            let mobile_overlay = DOMReference.document.getElementById(
              "hejmobile_overlay_" + project_id
            );
            let mobile_close_overlay = DOMReference.document.getElementById(
              "hejclose_overlay_" + project_id
            );

            if (anchor_image) {
              anchor_image.addEventListener("click", (evt) => {
                //sending adform event
                if (configuration.type == "banner" && configuration.banner) {
                  if (configuration.banner.type != "interstitial") {
                    if (typeof dhtml !== "undefined") {
                      dhtml.sendEvent("4", "Chat Opened");
                    }
                  } else if (configuration.banner.type == "interstitial") {
                    if (typeof Adform !== "undefined") {
                      Adform.sendEvent(Adform.EVENT_CUSTOM_4);
                    }
                  }
                }

                evt.target.style.display = "none";
                CommonHandler.changeCssProperty(
                  mobile_overlay,
                  "display",
                  "flex"
                );
                DOMReference.document.documentElement.classList.add(
                  "hej_noscroll"
                );
                DOMReference.document.body.classList.add("hej_noscroll");

                if (
                  DOMReference.hejchatbot__chat.querySelectorAll(
                    ".chatbot__message"
                  ).length == 0
                ) {
                  ChatController.startConversation();
                }
              });
            }

            let openChatDiv =
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "expandable_box"
                ? window.document.getElementById("openChatDiv")
                : window.document.getElementById("hejchatbot_container");
            openChatDiv.addEventListener("click", (evt) => {
              if (
                configuration.banner.type == "banner" &&
                configuration.banner &&
                configuration.banner.subtype == "interactive"
              )
                UIController.clearActivities(); //sending adform event

              if (configuration.type == "banner" && configuration.banner) {
                if (configuration.banner.type != "interstitial") {
                  if (typeof dhtml !== "undefined") {
                    dhtml.sendEvent("4", "Chat Opened");
                  }
                } else if (configuration.banner.type == "interstitial") {
                  if (typeof Adform !== "undefined") {
                    Adform.sendEvent(Adform.EVENT_CUSTOM_4);
                  }
                }
              }

              CommonHandler.changeCssProperty(
                mobile_overlay,
                "display",
                "flex"
              );
              DOMReference.document.documentElement.classList.add(
                "hej_noscroll"
              );
              DOMReference.document.body.classList.add("hej_noscroll");

              if (
                DOMReference.hejchatbot__chat.querySelectorAll(
                  ".chatbot__message"
                ).length == 0
              ) {
                ChatController.startConversation();
              }
            });

            if (
              configuration.type == "banner" &&
              configuration.banner &&
              configuration.banner.type == "expandable_box" &&
              configuration.banner.subtype == "interactive"
            ) {
              let hejchat_fake = window.document.getElementById(
                "hejchatbot__chat_fake"
              );
              hejchat_fake.addEventListener("click", (evt) => {
                evt.stopPropagation();
                if (
                  configuration.banner.type == "banner" &&
                  configuration.banner &&
                  configuration.banner.subtype == "interactive"
                )
                  UIController.clearActivities(); //sending adform event

                if (configuration.type == "banner" && configuration.banner) {
                  if (configuration.banner.type != "interstitial") {
                    if (typeof dhtml !== "undefined") {
                      dhtml.sendEvent("4", "Chat Opened");
                    }
                  } else if (configuration.banner.type == "interstitial") {
                    if (typeof Adform !== "undefined") {
                      Adform.sendEvent(Adform.EVENT_CUSTOM_4);
                    }
                  }
                }

                CommonHandler.changeCssProperty(
                  mobile_overlay,
                  "display",
                  "flex"
                );
                DOMReference.document.documentElement.classList.add(
                  "hej_noscroll"
                );
                DOMReference.document.body.classList.add("hej_noscroll");

                if (
                  DOMReference.hejchatbot__chat.querySelectorAll(
                    ".chatbot__message"
                  ).length == 0
                ) {
                  ChatController.startConversation();
                }
              });
            }

            mobile_close_overlay.addEventListener("click", (evt) => {
              evt.stopPropagation();
              CommonHandler.changeCssProperty(
                mobile_overlay,
                "display",
                "none"
              );
              CommonHandler.changeCssProperty(anchor_image, "display", "block");
              DOMReference.document.documentElement.classList.remove(
                "hej_noscroll"
              );
              DOMReference.document.body.classList.remove("hej_noscroll");
              if (
                configuration.banner.type == "banner" &&
                configuration.banner &&
                configuration.banner.subtype == "interactive"
              )
                UIController.startActivities();
            });
          }

          if (
            configuration.banner &&
            configuration.banner.type == "interstitial" &&
            configuration.timer_close_chat &&
            configuration.timer_close_chat.flag
          ) {
            if (typeof Adf !== "undefined") {
              var countdown = new Adf.Countdown({
                placement: "hejchatbot_container",
                // set countdown placement element
                action: countdownCallback,
                // action or function that gets called after countdown
                actionOnClick: false,
                // if true, action gets invoked on click, counter is then dismissed
                initializeOn: "load",
                // set to 'hover' or 'load' to choose how countdown gets initialized in banner
                counterText: "Chiude in {count} secondi",
                counter: configuration.timer_close_chat.duration || 10, // set countdown time in seconds
              });
              countdown.init(); // create event for countdown stop

              let evt = new Event("stopCountdown", {
                bubbles: true,
              }); //add evento to chatbot

              CommonHandler.addEvent(evt, "stopCountdown"); // listen for stopCountdown event,rised by ChatController

              DOMReference.document.addEventListener("stopCountdown", () => {
                countdown.hide();
                countdown.dismiss();
              });

              function countdownCallback() {
                if (window.mraid) mraid.close();
              }
            }
          }

          if (
            configuration.banner &&
            configuration.banner.type == "halfpage" &&
            configuration.banner.subtype == "interactive"
          ) {
            let openChatDiv = window.document.getElementById("openChatDiv");

            if (openChatDiv) {
              openChatDiv.addEventListener("click", (evt) => {
                UIController.clearActivities();
                CommonHandler.removeElement(openChatDiv);
                CommonHandler.removeElement(
                  window.document.getElementById("clickTagDiv")
                ); //sending adform event

                if (typeof dhtml !== "undefined") {
                  dhtml.sendEvent("4", "Chat Opened");
                }

                if (configuration.background.hide_background) {
                  document.documentElement.style.setProperty(
                    "--background-image",
                    `none`
                  );
                  document.documentElement.style.setProperty(
                    "--background-image-mobile",
                    `none`
                  );
                }

                ChatController.startConversation();
              });
            }

            let hejchat_fake = window.document.getElementById(
              "hejchatbot__chat_fake"
            );

            if (hejchat_fake) {
              hejchat_fake.addEventListener("click", (evt) => {
                evt.stopPropagation();
                UIController.clearActivities();
                CommonHandler.removeElement(openChatDiv);
                CommonHandler.removeElement(
                  window.document.getElementById("clickTagDiv")
                );

                if (typeof dhtml !== "undefined") {
                  dhtml.sendEvent("4", "Chat Opened");
                }

                if (configuration.background.hide_background) {
                  document.documentElement.style.setProperty(
                    "--background-image",
                    `none`
                  );
                  document.documentElement.style.setProperty(
                    "--background-image-mobile",
                    `none`
                  );

                  if (
                    configuration.type == "banner" &&
                    configuration.banner.type == "halfpage"
                  ) {
                    DOMReference.hejchatbot__chat.style = "";
                  }
                }

                ChatController.startConversation();
              });
            }
          }
        };

        function checkScriptLoad() {
          window.scriptCount++;
          let h1 = DOMReference.document.createElement("h1");
          h1.style.color = "black";
          h1.style.zIndex = "99999999999";
          h1.textContent = "Script caricato"; // Get a reference to the parent node

          let parentDiv = DOMReference.hejchatbot_header.parentNode; // Begin test case [ 1 ] : Existing childElement (all works correctly)

          let sp2 = DOMReference.hejchatbot_header;
          parentDiv.insertBefore(h1, sp2);
        }

        return {
          init,
        };
      })(); // CONCATENATED MODULE: ./app/js/controller/widgetController.js
      const WidgetController = (function () {
        let configuration = null;
        let DOMReference = null;

        let init = () => {
          //get global variable from jade
          configuration = web_project_configuration; // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference();
          initListener();
        };

        let initListener = () => {
          if (configuration.widget.type == "video") {
            //listeners per widget video
            VideoHandler.init();
          } //parent to iframe communication
          //allow publisher to send evento to iframe and chat

          window.addEventListener("message", function (e) {
            if (e.data.name == "mobileWidgetChat") {
              let widget_chat = window.document.getElementById("hej_widget");
              if (widget_chat) widget_chat.classList.add("mobile");
            } else if (e.data.name == "widgetVideoLanding") {
              let widget_container = window.document.getElementById(
                "hej_widget_container"
              );
              let widget_chat = window.document.getElementById("hej_widget");
              if (widget_container)
                widget_container.classList.add("widgetVideoLanding");
              if (widget_chat) widget_chat.classList.add("widgetVideoLanding");
            } else if (e.data.name == "widgetLanding") {
              let widget_container = window.document.getElementById(
                "hej_widget_container"
              );
              let widget_chat = window.document.getElementById("hej_widget");
              if (widget_container)
                widget_container.classList.add("widgetLanding");
              if (widget_chat) widget_chat.classList.add("widgetLanding");
            } else if (e.data.name == "triggerChat") {
              UIController.processInput(e, e.data.value);
            } else if (e.data.name == "widgetChatOpen") {
              CommonHandler.setProperty("root_domain", e.data.root_domain);
              let iubendaObject = CommonHandler.getProperty("iubenda");

              if (e.data.iubenda && iubendaObject) {
                // if(iubendaObject.top && iubendaObject.child) return;
                iubendaObject.top = e.data.iubenda;

                if (window._iub && window._iub.cs && window._iub.cs.api) {
                  let consentGiven = window._iub.cs.api.isConsentGiven();

                  iubendaObject.child = consentGiven;
                }

                CommonHandler.setProperty("iubenda", iubendaObject);
                console.log(
                  "IUBENDA ATTIVO - check isConsentGiven",
                  iubendaObject.top
                );

                if (
                  iubendaObject.top &&
                  window._iub &&
                  window._iub.cs &&
                  window._iub.cs.api
                ) {
                  window._iub.cs.api.consentGiven();
                }
              }

              ChatController.sendMetrics("123test123", "widget", "show_popup");

              if (e.data.ref) {
                let prevRef = CommonHandler.getProperty("prevRef");

                if (e.data.ref != prevRef) {
                  CommonHandler.setFirstInteraction(false);
                  CommonHandler.removeAllChildNodes(
                    DOMReference.hejchatbot__chat
                  );
                  CommonHandler.setProperty("ref", e.data.ref);
                }

                ChatController.startConversation();
              } else {
                let prevRef = CommonHandler.getProperty("prevRef");

                if (prevRef) {
                  CommonHandler.setFirstInteraction(false);
                  CommonHandler.removeAllChildNodes(
                    DOMReference.hejchatbot__chat
                  );
                }

                ChatController.startConversation();
              }
            } else if (e.data.name == "widgetVideoOpen") {
              if (CommonHandler.getFirstInteraction()) {
                VideoHandler.playVideo();
                return;
              }

              ChatController.startConversation();
            } else if (e.data.name == "widgetVideoClose") {
              VideoHandler.stopVideo();
            } else if (e.data.name == "widgetVideoHome") {
              CommonHandler.setFirstInteraction(false);
              ChatController.startConversation(
                "000restart_web_project000",
                false
              );
            } else if (e.data.name == "widgetVideoBack") {
              CommonHandler.setFirstInteraction(false);
              ChatController.startConversation("000go_back_message000", false);
            } else if (e.data.name == "widgetClose") {
              ChatController.sendMetrics("123test123", "widget", "hide_popup");
            }
          });
          let close_chat = window.document.getElementById("hej_chat_close");

          if (close_chat) {
            close_chat.addEventListener("click", function () {
              // Make sure you are sending a string, and to stringify JSON
              // iframe to parent(publisher's site) communication
              let msg = "close_chat";
              window.parent.postMessage(msg, "*");
            });
          }

          if (
            configuration.widget.type == "video" &&
            configuration.widget.subtype == "landing"
          ) {
            let widget_container = window.document.getElementById(
              "hej_widget_container"
            );
            let widget_chat = window.document.getElementById("hej_widget");
            if (widget_container)
              widget_container.classList.add("widgetVideoLanding");
            if (widget_chat) widget_chat.classList.add("widgetVideoLanding");
            var div_widget_controls = document.createElement("div");
            div_widget_controls.id = "hej_widget_mobile_controls";
            div_widget_controls.classList.add("active");
            var homeButton = '<i class="fa-solid fa-house"></i>';
            var home_button = document.createElement("button");
            home_button.id = "hej_widget_home";
            home_button.innerHTML = homeButton;
            home_button.addEventListener("click", function () {
              CommonHandler.setFirstInteraction(false);
              ChatController.startConversation(
                "000restart_web_project000",
                false
              );
            });
            var backButton = '<i class="fa-solid fa-arrow-left"></i>';
            var back_button = document.createElement("button");
            back_button.id = "hej_widget_back";
            back_button.innerHTML = backButton;
            back_button.addEventListener("click", function () {
              CommonHandler.setFirstInteraction(false);
              ChatController.startConversation("000go_back_message000", false);
            });

            if (
              configuration.widget.video_button_layout == "tik_tok" ||
              configuration.widget.video_button_layout == "form"
            ) {
              let image_url;

              if (
                configuration.hasOwnProperty("avatar") &&
                configuration.avatar.background &&
                configuration.avatar.background.type == "media" &&
                configuration.avatar.background.media_id &&
                configuration.avatar.background.media_id.media &&
                typeof configuration.avatar.background.media_id.media ==
                  "object"
              ) {
                image_url = configuration.avatar.background.media_id.media.small
                  ? configuration.avatar.background.media_id.media.small.url
                  : configuration.avatar.background.media_id.media.original.url;
              } else {
                image_url = configuration.avatar_image;
              }

              var logoButton = `<img src="${image_url}" alt="tik_tok_logo" />`;
              var logo_button = document.createElement("button");
              logo_button.id = "hej_widget_logo";
              logo_button.innerHTML = logoButton;
              div_widget_controls.appendChild(logo_button); // var music_button = document.createElement("div");
              // music_button.id = "tik_talk_music_info"
              // music_button.style="width:81%";
              // music_button.innerHTML = '<button><img src="https://static.thenounproject.com/png/934821-200.png" style=" filter: invert(1);"></button><div><span>Nome canzone in esecuzione</span></div>';
              // div_widget_controls.appendChild(music_button);
              // var shareButton = '<i class="fa-solid fa-share"></i>';
              // var share_button = document.createElement("button");
              // share_button.id = "hej_widget_share";
              // share_button.innerHTML = shareButton;
              // div_widget_controls.appendChild(share_button);
              // const shareData = {
              //     title: 'Tik Talk',
              //     text: 'Learn web development on MDN!',
              //     url: window.location.href
              //   }
              // share_button.addEventListener("click", async function(){
              //     try {
              //         await navigator.share(shareData)
              //         console.log('tik talk shared successfully');
              //       } catch(err) {
              //         console.log('Error share: ' + err);
              //       }
              // });
            }

            div_widget_controls.appendChild(home_button);
            div_widget_controls.appendChild(back_button);
            let target = DOMReference.document.getElementById(
              "hej_widget_container"
            );
            let target2 = DOMReference.document.getElementById("hej_widget");
            target.insertBefore(div_widget_controls, target2);
            ChatController.startConversation();
          }
        };

        return {
          init,
        };
      })(); // CONCATENATED MODULE: ./app/js/core/app.js
      const AppController = (function () {
        let DOMReference = null;
        let configuration = null;
        let sw = null; //service worker for push notification
        // inizializza progetto chatbot web

        let loadConfiguration = () => {
          //get global variable from jade
          configuration = web_project_configuration; //load custom js

          loadCustomFile(
            configuration.custom_code
              ? configuration.custom_code.js
              : undefined,
            "javascript"
          ); // init DOM node reference

          DOMHandler.setDOMReference(); // store html node reference in a variable

          DOMReference = DOMHandler.getDOMReference(); // // create custom event for delivery notification!
          // let event = new Event("delivery", {
          //     bubbles: true
          // });
          // // add event to custom events array
          // CommonHandler.addEvent(event,  "delivery");
          // //listener for 'delivery' custom event
          // DOMReference.document.addEventListener("delivery", (event) => {
          //     ChatController.sendMetrics(event.target.dataset.content_id);
          // });
          // init Chat controller

          ChatController.init(); // init UI controller

          UIController.init(); // init web project type-based controller

          switch (configuration.type) {
            case "landing":
              LandingController.init();
              break;

            case "banner":
              BannerController.init();
              break;

            case "widget":
              WidgetController.init();
              break;
          }

          let browser_alert = document.querySelector("#browser_alert p");

          if (browser_alert && configuration && configuration.language) {
            let currentIdiom = language_namespaceObject.m.find(
              (element) => element.code == configuration.language.code
            );
            browser_alert.textContent = currentIdiom.browser_alert;
          }

          CommonHandler.setProperty("iubenda", {
            top: undefined,
            child: undefined,
          });

          if (window._iub && window._iub.cs && window._iub.cs.api) {
            let consentGiven = window._iub.cs.api.isConsentGiven();

            CommonHandler.setProperty("iubenda", {
              top: consentGiven,
              child: undefined,
            });
          } // if (CommonHandler.get_local_storage_status() == "available") {
          //     console.log("clean local storage");
          //     var current_form = localStorage.getItem("hej_form_fields");
          //     if (current_form) {
          //         current_form = JSON.parse(current_form);
          //     }
          //     var current_profile = localStorage.getItem("hej_profile_fields");
          //     if (current_profile) {
          //         current_profile = JSON.parse(current_profile);
          //     }
          //     var external_ref = localStorage.getItem("hej_ref");
          //     if (external_ref) {
          //         external_ref = JSON.parse(external_ref);
          //     }
          //     // let current_form = JSON.parse(localStorage.getItem("hej_form_fields"));
          //     // let current_profile = JSON.parse(localStorage.getItem("hej_profile_fields"));
          //     // let external_ref = JSON.parse(localStorage.getItem("hej_ref"));
          //     if (!current_form) {
          //         localStorage.removeItem("hej_form_fields");
          //     }
          //     if (!current_profile) {
          //         localStorage.removeItem("hej_profile_fields");
          //     }
          //     if (!external_ref) {
          //         localStorage.removeItem("hej_ref");
          //     }
          //     localStorage.removeItem("hej_profile_fields");
          //     localStorage.removeItem("hej_ref");
          // }
          // init DOM element listener(button click, input etc)

          initListener(); // start conversation

          if (
            (configuration.type == "landing" ||
              (configuration.type == "banner" &&
                configuration.banner &&
                ((configuration.banner.subtype == "standard" &&
                  configuration.banner.type != "interstitial" &&
                  configuration.banner.type != "preroll") ||
                  configuration.banner.subtype == "full_chat") &&
                !configuration.chat_overlay)) &&
            (!configuration.voice ||
              (configuration.voice && !configuration.voice.flag))
          ) {
            ChatController.startConversation();
          } else if (
            configuration.type == "banner" &&
            configuration.banner &&
            configuration.banner.custom_settings &&
            ((configuration.banner.subtype == "standard" &&
              (configuration.banner.type == "interstitial" ||
                configuration.banner.type == "preroll")) ||
              (configuration.banner.subtype == "interactive" &&
                (configuration.banner.type == "halfpage" ||
                  (configuration.banner.type == "expandable_box" &&
                    configuration.chat_overlay))))
          ) {
            setTimeout(UIController.addFakeMessages, 500);
          }
        };

        let loadCustomFile = (url = undefined, type = undefined) => {
          let file = undefined;

          switch (type) {
            case "javascript":
              file = document.createElement("script");
              file.textContent = url;
              document.body.appendChild(file); // file.addEventListener('load', function() {
              //     console.log("caricato file custom js");
              //     // The script is loaded completely
              //     // Do something
              // });

              break;

            case "css":
              file = document.createElement("style");
              file.innerHTML = url;
              document.getElementsByTagName("head")[0].appendChild(file);
              break;

            default:
              console.log("No type specified");
              break;
          }
        }; // chat button listener e input listener

        let initListener = () => {
          if (
            configuration.background &&
            configuration.background.scroll &&
            configuration.background.scroll.flag &&
            DOMReference.hejchatbot__chat
          ) {
            DOMReference.hejchatbot__chat.addEventListener(
              "scroll",
              function (evt) {
                let scroll = DOMReference.hejchatbot__chat.scrollTop;
                console.log("scroll" + scroll);
                let img = document.getElementById("img_parallax");
                const style = window.getComputedStyle(img);
                const matrix =
                  style.transform ||
                  style.webkitTransform ||
                  style.mozTransform;
                let x, y, z; // No transform property. Simply return 0 values.

                if (matrix === "none" || typeof matrix === "undefined") {
                  (x = 0), (y = 0), (z = 0);
                } else {
                  // Can either be 2d or 3d transform
                  const matrixType = matrix.includes("3d") ? "3d" : "2d";
                  const matrixValues = matrix
                    .match(/matrix.*\((.+)\)/)[1]
                    .split(", "); // 2d matrices have 6 values
                  // Last 2 values are X and Y.
                  // 2d matrices does not have Z value.

                  if (matrixType === "2d") {
                    (x = matrixValues[4]), (y = matrixValues[5]), (z = 0);
                  } // 3d matrices have 16 values
                  // The 13th, 14th, and 15th values are X, Y, and Z

                  if (matrixType === "3d") {
                    (x = matrixValues[12]),
                      (y = matrixValues[13]),
                      (z = matrixValues[14]);
                  }
                }

                if (img) {
                  // img.style.transform = `translateY(${ y + 500}px)`;
                  let amount =
                    scroll *
                    (configuration.background &&
                    configuration.background.scroll &&
                    configuration.background.scroll.speed
                      ? -configuration.background.scroll.speed
                      : -0.2);
                  img.style.transform = `translateY(${amount}px)`;
                }
              }
            );
          } // listener per il click sui bottoni della chat

          if (DOMReference.hejchatbot) {
            DOMReference.hejchatbot.addEventListener("click", function (evt) {
              evt.stopImmediatePropagation();

              if (
                configuration.type == "widget" &&
                configuration.widget.type == "video" &&
                evt.target.id != "hej_widget_footer"
              ) {
                evt.stopPropagation();
              }

              if (configuration.type == "banner") {
                evt.stopPropagation();
              }

              let element = null;
              element =
                evt.target.tagName != "BUTTON"
                  ? evt.target.parentNode.tagName != "BUTTON"
                    ? evt.target.parentNode.parentNode
                    : evt.target.parentNode
                  : evt.target; // if (configuration.type == "landing" && configuration.cookie && configuration.cookie.iubenda.flag && element.tagName == "BUTTON") {
              //     if (typeof _iub !== 'undefined') {
              //         _iub.cs.api.consentGiven('documentClicked');
              //     }
              // }

              if (element.dataset.type == "message_action") {
                if (element.dataset.event) {
                  let f = new Function(element.dataset.event);
                  f();
                }

                UIController.toggleInteraction(true, true);

                if (
                  configuration.hasOwnProperty("background") &&
                  configuration.background.hide_background &&
                  (configuration.background.type == "image" ||
                    configuration.background.type == "media") &&
                  DOMReference.hejchatbot__chat.querySelectorAll(
                    ".chatbot__message--right"
                  ).length == 0
                ) {
                  DOMReference.document.documentElement.style.setProperty(
                    "--background-image",
                    `none`
                  );
                  DOMReference.document.documentElement.style.setProperty(
                    "--background-image-mobile",
                    `none`
                  );

                  if (
                    configuration.type == "banner" &&
                    configuration.banner.type == "halfpage"
                  ) {
                    DOMReference.hejchatbot__chat.style = "";
                  }
                }

                if (
                  configuration.footer &&
                  configuration.footer.remove_first_interaction
                ) {
                  if (
                    DOMReference.document.getElementById("hejchatbot_footer")
                  ) {
                    CommonHandler.removeElement(DOMReference.hejchatbot_footer);
                  }
                }

                let quick_div = DOMReference.hejchatbot__chat.querySelector(
                  ".chatbot__message__choice__quicks"
                );

                if (quick_div) {
                  quick_div.parentNode.parentNode.remove();
                }

                UIController.sendMessage(
                  element.dataset.content,
                  element.dataset.button_type,
                  element.dataset.text,
                  {
                    img: element.dataset.img || undefined,
                  }
                );
              } else if (element.dataset.type == "link_action") {
                if (
                  typeof Adform !== "undefined" &&
                  configuration.type == "banner" &&
                  configuration.banner
                ) {
                  console.log("window.dhtml", window.dhtml);

                  if (window.dhtml !== undefined) {
                    var landingPageTarget =
                      Adform.getVar("landingPageTarget") || "_blank";
                    console.log("landingPageTarget", landingPageTarget);
                    var clickURL =
                      Adform.getClickURL("clickTAG2") ||
                      Adform.getClickURL("clickTAG") ||
                      url;
                    console.log("clickURL", clickURL);
                    window.open(clickURL, landingPageTarget);
                  } else {
                    console.log("mraid");
                    var clickURL =
                      Adform.getClickURL("clickTAG2") ||
                      Adform.getClickURL("clickTAG") ||
                      url;
                    if (window.mraid) mraid.open(clickURL);
                  }
                } else {
                  console.log("simple open click");
                  DOMReference.window.open(
                    element.dataset.content,
                    element.dataset.target == "true" ? "_self" : "_blank"
                  );
                }

                if (
                  configuration.hasOwnProperty("background") &&
                  configuration.background.hide_background &&
                  configuration.background.type == "image" &&
                  DOMReference.hejchatbot__chat.querySelectorAll(
                    ".chatbot__message--right"
                  ).length == 0
                ) {
                  DOMReference.document.documentElement.style.setProperty(
                    "--background-image",
                    `none`
                  );
                  DOMReference.document.documentElement.style.setProperty(
                    "--background-image-mobile",
                    `none`
                  );

                  if (
                    configuration.type == "banner" &&
                    configuration.banner.type == "halfpage"
                  ) {
                    DOMReference.hejchatbot__chat.style = "";
                  }
                }

                if (
                  configuration.footer &&
                  configuration.footer.remove_first_interaction
                ) {
                  if (
                    DOMReference.document.getElementById("hejchatbot_footer")
                  ) {
                    CommonHandler.removeElement(DOMReference.hejchatbot_footer);
                  }
                }
              } else if (
                element.dataset.type == "push_action" &&
                configuration.type == "landing"
              ) {
                if ("serviceWorker" in navigator && "PushManager" in window) {
                  LandingController.getNotificationPermissionState()
                    .then((permission) => {
                      if (permission !== "granted" && permission !== "denied") {
                        // ask for permission
                        LandingController.askNotificationPermission();
                      } else {
                        // get the initial subscription value
                        sw.pushManager
                          .getSubscription()
                          .then(function (subscription) {
                            console.log("subscription", subscription);

                            if (permission == "denied") {
                              console.log("permessi bloccati dall'utente");
                              LandingController.unsubscribeUser(subscription);
                              return;
                            }

                            let isSubscribed = !(subscription === null);

                            if (isSubscribed) {
                              console.log("User IS already subscribed.");
                            } else {
                              LandingController.subscribeUser();
                            }
                          });
                      }
                    })
                    .catch((err) =>
                      console.log("Error on retrieve permission state", err)
                    );
                }
              } else if (
                element.dataset.type == "video_action" &&
                configuration.video &&
                configuration.video.flag
              ) {
                UIController.toggleInteraction(true, true);
                let quick_div = document.querySelector(
                  ".chatbot__message__choice__quicks"
                );

                if (quick_div) {
                  quick_div.parentNode.parentNode.remove();
                }

                let div_conference = document.querySelector(
                  "#hejchatbot_conference"
                );
                div_conference.classList.add("active");
                div_conference.innerHTML =
                  '<iframe src="https://tokbox.com/embed/embed/ot-embed.js?embedId=d91fca79-1b14-40a3-b664-8c054df85c88&room=' +
                  element.dataset.content +
                  '&iframe=true" allow="microphone; camera" scrolling="no"></iframe>';
              } else if (
                element.dataset.type == "start_chat_action" &&
                configuration.type == "banner"
              ) {
                element.parentNode.parentNode.parentNode.remove();
                UIController.sendMessage("fake", "fake", element.dataset.text);
                ChatController.startConversation();
              } else if (
                element.dataset.type == "answer_process" &&
                configuration.type == "widget"
              ) {
                UIController.toggleInteraction(true, true); //evt.stopPropagation();
                //  process response

                let input = document.querySelector(
                  "textarea[name='text_answer']"
                );
                console.log("input.value", input.value);
                UIController.sendMessage(input.value, "text", null);
              } else if (element.dataset.type == "custom_action") {
                if (element.dataset.subtype == "list_suggestions") {
                  let customData = CommonHandler.getCustomObject();
                  UIController.sendMessage(
                    element.dataset.content,
                    element.dataset.button_type,
                    element.dataset.text,
                    customData
                  );
                  let suggestions_container = document.getElementById(
                    "list_suggestions_container"
                  );
                  if (suggestions_container)
                    CommonHandler.removeElement(suggestions_container);
                  UIController.enableStandardInput(true);
                }
              }
            });
          } // listener per voice

          if (configuration.voice && configuration.voice.flag) {
            DOMReference.user_message_voice.addEventListener(
              "click",
              startVoiceConversation
            );
          } // listener per l'invio dei messaggi dell utente

          if (DOMReference.hej_user_input) {
            DOMReference.hej_user_input.addEventListener(
              "keypress",
              UIController.processInput
            );
          } //listener per click sul bottone invia messaggio utente

          if (DOMReference.user_message_button) {
            // DOMReference.user_message_button.addEventListener("focus", (e) => {
            //     if (DOMReference.hejchatbot__chat) {
            //         DOMReference.hejchatbot__chat.scrollTop = DOMReference.hejchatbot__chat.scrollHeight;
            //     }
            // });
            DOMReference.user_message_button.addEventListener(
              "click",
              async (e) => {
                DOMHandler.setDOMReference();
                DOMReference = DOMHandler.getDOMReference(); // handle file upload

                if (DOMReference.hej_user_input.type == "file") {
                  if (DOMReference.hej_user_input.files.length == 0) {
                    return;
                  } else {
                    try {
                      let obj = {
                        attachment: {
                          url: "",
                          type: "",
                          name: "",
                        },
                      };
                      let file_base64 = await CommonHandler.toBase64(
                        DOMReference.hej_user_input.files[0]
                      );
                      let file_buffer = await CommonHandler.readFileAsync(
                        DOMReference.hej_user_input.files[0]
                      );
                      let file_type = CommonHandler.getMimeType(file_buffer);
                      if (file_type == "unknown")
                        file_type = DOMReference.hej_user_input.files[0].type;
                      obj.attachment.url = file_base64;
                      obj.attachment.type = file_type;
                      obj.attachment.name =
                        DOMReference.hej_user_input.files[0].name;
                      UIController.processInput(e, obj);
                    } catch (error) {
                      console.log(error);
                    }
                  }
                } else {
                  UIController.processInput(
                    e,
                    DOMReference.hej_user_input.value
                  );
                }
              }
            );
          }
        }; // start voice conversation

        let startVoiceConversation = (evt) => {
          evt.stopPropagation();

          if (
            configuration.type == "banner" &&
            configuration.banner &&
            configuration.banner.type == "interstitial"
          ) {
            ChatController.startConversation();
            DOMReference.user_message_voice.removeEventListener(
              "click",
              startVoiceConversation
            );
          } else {
            if (
              DOMReference.hejchatbot__chat.querySelectorAll(
                ".chatbot__message"
              ).length == 0
            ) {
              ChatController.startConversation();
              DOMReference.user_message_voice.removeEventListener(
                "click",
                startVoiceConversation
              );
            }
          }
        };

        return {
          loadConfiguration,
        };
      })(); // CONCATENATED MODULE: ./app/js/utility/yeah.js
      // import {
      //     CookieHandler
      // } from './utility/cookie';

      const Yeah = (function () {
        const actions = {
          update_form_field: function (args) {
            let current_form = null;

            if (CommonHandler.get_local_storage_status() == "available") {
              current_form = localStorage.getItem("hej_form_fields");
            }

            console.log("current_form", current_form);

            if (current_form == null) {
              current_form = {};
            } else {
              current_form = JSON.parse(current_form);
            } // var current_form = {};

            console.log("update_form_field args", args); // var current_form = {};

            if (typeof args == "object") {
              Object.keys(args).forEach((key) => {
                console.log("update_form_field key", key);
                current_form[key] = args[key];
              });
            }

            console.log("update_form_field current_form", current_form);

            if (CommonHandler.get_local_storage_status() == "available") {
              localStorage.setItem(
                "hej_form_fields",
                JSON.stringify(current_form)
              );
            }
          },
          update_profile_field: function (args) {
            // let current_profile = CookieHandler.getCookie("hej_form_fields");
            // // var current_profile = sessionStorage.getItem("current_profile");
            // if (current_profile == null) {
            //     current_profile = {};
            // }
            // //else {
            // //     current_profile = JSON.parse(current_profile);
            // // }
            var current_profile = {};

            if (typeof args == "object") {
              Object.keys(args).forEach((key) => {
                current_profile[key] = args[key];
              });
            }

            if (CommonHandler.get_local_storage_status() == "available") {
              localStorage.setItem(
                "hej_profile_fields",
                JSON.stringify(current_profile)
              );
            }
          },
          set_external_ref: function (args) {
            // let current_profile = CookieHandler.getCookie("hej_form_fields");
            // // var current_profile = sessionStorage.getItem("current_profile");
            // if (current_profile == null) {
            //     current_profile = {};
            // }
            // //else {
            // //     current_profile = JSON.parse(current_profile);
            // // }
            var ref = args;

            if (CommonHandler.get_local_storage_status() == "available") {
              localStorage.setItem(
                "hej_ref",
                JSON.stringify({
                  ref,
                })
              );
            }
          },
          alert: function (args) {
            alert(args);
          },
          changeBackground: function (args) {
            console.log(args);

            if (args.target) {
              if (args.target == "body") {
                document.body.style.backgroundColor = args.color;
              } else {
                let element = document.getElementById(args.target);
                element.style.backgroundColor = args.color;
              }
            }
          },
          sendMessage: function (args) {
            console.log(args);
            var type = "text";
            var msg = args;

            if (
              typeof args === "object" &&
              !Array.isArray(args) &&
              args !== null
            ) {
              type = args.type;
              msg = args.payload;
            }

            ChatController.talk(msg, type, UIController.addMessages);
          }, // get_form_fields: function(args){
          //     return current_form;
          // }
        };

        let process = (callback, args) => {
          return actions[callback](args);
        };

        let log = () => {
          console.log("log Yeah controller");
        };

        if (CommonHandler.get_local_storage_status() == "available") {
          console.log("clean local storage");
          var current_form = localStorage.getItem("hej_form_fields");

          if (current_form) {
            current_form = JSON.parse(current_form);
          }

          var current_profile = localStorage.getItem("hej_profile_fields");

          if (current_profile) {
            current_profile = JSON.parse(current_profile);
          }

          var external_ref = localStorage.getItem("hej_ref");

          if (external_ref) {
            external_ref = JSON.parse(external_ref);
          }

          if (current_form) {
            localStorage.removeItem("hej_form_fields");
          }

          if (current_profile) {
            localStorage.removeItem("hej_profile_fields");
          }

          if (external_ref) {
            localStorage.removeItem("hej_ref");
          }
        }

        return {
          process,
          log,
        };
      })();
      // EXTERNAL MODULE: ./node_modules/regenerator-runtime/runtime.js
      var runtime = __webpack_require__(666); // CONCATENATED MODULE: ./app/config/init_landing.js
      /*  configurazione per landing */

      // Inizializzo applicazione al caricamento della pagina

      window.Yeah = Yeah;
      window.document.addEventListener(
        "DOMContentLoaded",
        function () {
          AppController.loadConfiguration();
        },
        false
      );

      /***/
    },

    /***/ 162: /***/ function (module, exports, __webpack_require__) {
      var __WEBPACK_AMD_DEFINE_FACTORY__,
        __WEBPACK_AMD_DEFINE_ARRAY__,
        __WEBPACK_AMD_DEFINE_RESULT__;
      (function (a, b) {
        if (true)
          !((__WEBPACK_AMD_DEFINE_ARRAY__ = []),
          (__WEBPACK_AMD_DEFINE_FACTORY__ = b),
          (__WEBPACK_AMD_DEFINE_RESULT__ =
            typeof __WEBPACK_AMD_DEFINE_FACTORY__ === "function"
              ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(
                  exports,
                  __WEBPACK_AMD_DEFINE_ARRAY__
                )
              : __WEBPACK_AMD_DEFINE_FACTORY__),
          __WEBPACK_AMD_DEFINE_RESULT__ !== undefined &&
            (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        else {
        }
      })(this, function () {
        "use strict";
        function b(a, b) {
          return (
            "undefined" == typeof b
              ? (b = { autoBom: !1 })
              : "object" != typeof b &&
                (console.warn(
                  "Deprecated: Expected third argument to be a object"
                ),
                (b = { autoBom: !b })),
            b.autoBom &&
            /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
              a.type
            )
              ? new Blob(["\uFEFF", a], { type: a.type })
              : a
          );
        }
        function c(a, b, c) {
          var d = new XMLHttpRequest();
          d.open("GET", a),
            (d.responseType = "blob"),
            (d.onload = function () {
              g(d.response, b, c);
            }),
            (d.onerror = function () {
              console.error("could not download file");
            }),
            d.send();
        }
        function d(a) {
          var b = new XMLHttpRequest();
          b.open("HEAD", a, !1);
          try {
            b.send();
          } catch (a) {}
          return 200 <= b.status && 299 >= b.status;
        }
        function e(a) {
          try {
            a.dispatchEvent(new MouseEvent("click"));
          } catch (c) {
            var b = document.createEvent("MouseEvents");
            b.initMouseEvent(
              "click",
              !0,
              !0,
              window,
              0,
              0,
              0,
              80,
              20,
              !1,
              !1,
              !1,
              !1,
              0,
              null
            ),
              a.dispatchEvent(b);
          }
        }
        var f =
            "object" == typeof window && window.window === window
              ? window
              : "object" == typeof self && self.self === self
              ? self
              : "object" == typeof __webpack_require__.g &&
                __webpack_require__.g.global === __webpack_require__.g
              ? __webpack_require__.g
              : void 0,
          a =
            f.navigator &&
            /Macintosh/.test(navigator.userAgent) &&
            /AppleWebKit/.test(navigator.userAgent) &&
            !/Safari/.test(navigator.userAgent),
          g =
            f.saveAs ||
            ("object" != typeof window || window !== f
              ? function () {}
              : "download" in HTMLAnchorElement.prototype && !a
              ? function (b, g, h) {
                  var i = f.URL || f.webkitURL,
                    j = document.createElement("a");
                  (g = g || b.name || "download"),
                    (j.download = g),
                    (j.rel = "noopener"),
                    "string" == typeof b
                      ? ((j.href = b),
                        j.origin === location.origin
                          ? e(j)
                          : d(j.href)
                          ? c(b, g, h)
                          : e(j, (j.target = "_blank")))
                      : ((j.href = i.createObjectURL(b)),
                        setTimeout(function () {
                          i.revokeObjectURL(j.href);
                        }, 4e4),
                        setTimeout(function () {
                          e(j);
                        }, 0));
                }
              : "msSaveOrOpenBlob" in navigator
              ? function (f, g, h) {
                  if (((g = g || f.name || "download"), "string" != typeof f))
                    navigator.msSaveOrOpenBlob(b(f, h), g);
                  else if (d(f)) c(f, g, h);
                  else {
                    var i = document.createElement("a");
                    (i.href = f),
                      (i.target = "_blank"),
                      setTimeout(function () {
                        e(i);
                      });
                  }
                }
              : function (b, d, e, g) {
                  if (
                    ((g = g || open("", "_blank")),
                    g &&
                      (g.document.title = g.document.body.innerText =
                        "downloading..."),
                    "string" == typeof b)
                  )
                    return c(b, d, e);
                  var h = "application/octet-stream" === b.type,
                    i = /constructor/i.test(f.HTMLElement) || f.safari,
                    j = /CriOS\/[\d]+/.test(navigator.userAgent);
                  if (
                    (j || (h && i) || a) &&
                    "undefined" != typeof FileReader
                  ) {
                    var k = new FileReader();
                    (k.onloadend = function () {
                      var a = k.result;
                      (a = j
                        ? a
                        : a.replace(/^data:[^;]*;/, "data:attachment/file;")),
                        g ? (g.location.href = a) : (location = a),
                        (g = null);
                    }),
                      k.readAsDataURL(b);
                  } else {
                    var l = f.URL || f.webkitURL,
                      m = l.createObjectURL(b);
                    g ? (g.location = m) : (location.href = m),
                      (g = null),
                      setTimeout(function () {
                        l.revokeObjectURL(m);
                      }, 4e4);
                  }
                });
        (f.saveAs = g.saveAs = g), true && (module.exports = g);
      });

      //# sourceMappingURL=FileSaver.min.js.map

      /***/
    },

    /***/ 666: /***/ (module) => {
      /**
       * Copyright (c) 2014-present, Facebook, Inc.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */

      var runtime = (function (exports) {
        "use strict";

        var Op = Object.prototype;
        var hasOwn = Op.hasOwnProperty;
        var undefined; // More compressible than void 0.
        var $Symbol = typeof Symbol === "function" ? Symbol : {};
        var iteratorSymbol = $Symbol.iterator || "@@iterator";
        var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
        var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

        function define(obj, key, value) {
          Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
          return obj[key];
        }
        try {
          // IE 8 has a broken Object.defineProperty that only works on DOM objects.
          define({}, "");
        } catch (err) {
          define = function (obj, key, value) {
            return (obj[key] = value);
          };
        }

        function wrap(innerFn, outerFn, self, tryLocsList) {
          // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
          var protoGenerator =
            outerFn && outerFn.prototype instanceof Generator
              ? outerFn
              : Generator;
          var generator = Object.create(protoGenerator.prototype);
          var context = new Context(tryLocsList || []);

          // The ._invoke method unifies the implementations of the .next,
          // .throw, and .return methods.
          generator._invoke = makeInvokeMethod(innerFn, self, context);

          return generator;
        }
        exports.wrap = wrap;

        // Try/catch helper to minimize deoptimizations. Returns a completion
        // record like context.tryEntries[i].completion. This interface could
        // have been (and was previously) designed to take a closure to be
        // invoked without arguments, but in all the cases we care about we
        // already have an existing method we want to call, so there's no need
        // to create a new function object. We can even get away with assuming
        // the method takes exactly one argument, since that happens to be true
        // in every case, so we don't have to touch the arguments object. The
        // only additional allocation required is the completion record, which
        // has a stable shape and so hopefully should be cheap to allocate.
        function tryCatch(fn, obj, arg) {
          try {
            return { type: "normal", arg: fn.call(obj, arg) };
          } catch (err) {
            return { type: "throw", arg: err };
          }
        }

        var GenStateSuspendedStart = "suspendedStart";
        var GenStateSuspendedYield = "suspendedYield";
        var GenStateExecuting = "executing";
        var GenStateCompleted = "completed";

        // Returning this object from the innerFn has the same effect as
        // breaking out of the dispatch switch statement.
        var ContinueSentinel = {};

        // Dummy constructor functions that we use as the .constructor and
        // .constructor.prototype properties for functions that return Generator
        // objects. For full spec compliance, you may wish to configure your
        // minifier not to mangle the names of these two functions.
        function Generator() {}
        function GeneratorFunction() {}
        function GeneratorFunctionPrototype() {}

        // This is a polyfill for %IteratorPrototype% for environments that
        // don't natively support it.
        var IteratorPrototype = {};
        define(IteratorPrototype, iteratorSymbol, function () {
          return this;
        });

        var getProto = Object.getPrototypeOf;
        var NativeIteratorPrototype =
          getProto && getProto(getProto(values([])));
        if (
          NativeIteratorPrototype &&
          NativeIteratorPrototype !== Op &&
          hasOwn.call(NativeIteratorPrototype, iteratorSymbol)
        ) {
          // This environment has a native %IteratorPrototype%; use it instead
          // of the polyfill.
          IteratorPrototype = NativeIteratorPrototype;
        }

        var Gp =
          (GeneratorFunctionPrototype.prototype =
          Generator.prototype =
            Object.create(IteratorPrototype));
        GeneratorFunction.prototype = GeneratorFunctionPrototype;
        define(Gp, "constructor", GeneratorFunctionPrototype);
        define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
        GeneratorFunction.displayName = define(
          GeneratorFunctionPrototype,
          toStringTagSymbol,
          "GeneratorFunction"
        );

        // Helper for defining the .next, .throw, and .return methods of the
        // Iterator interface in terms of a single ._invoke method.
        function defineIteratorMethods(prototype) {
          ["next", "throw", "return"].forEach(function (method) {
            define(prototype, method, function (arg) {
              return this._invoke(method, arg);
            });
          });
        }

        exports.isGeneratorFunction = function (genFun) {
          var ctor = typeof genFun === "function" && genFun.constructor;
          return ctor
            ? ctor === GeneratorFunction ||
                // For the native GeneratorFunction constructor, the best we can
                // do is to check its .name property.
                (ctor.displayName || ctor.name) === "GeneratorFunction"
            : false;
        };

        exports.mark = function (genFun) {
          if (Object.setPrototypeOf) {
            Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
          } else {
            genFun.__proto__ = GeneratorFunctionPrototype;
            define(genFun, toStringTagSymbol, "GeneratorFunction");
          }
          genFun.prototype = Object.create(Gp);
          return genFun;
        };

        // Within the body of any async function, `await x` is transformed to
        // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
        // `hasOwn.call(value, "__await")` to determine if the yielded value is
        // meant to be awaited.
        exports.awrap = function (arg) {
          return { __await: arg };
        };

        function AsyncIterator(generator, PromiseImpl) {
          function invoke(method, arg, resolve, reject) {
            var record = tryCatch(generator[method], generator, arg);
            if (record.type === "throw") {
              reject(record.arg);
            } else {
              var result = record.arg;
              var value = result.value;
              if (
                value &&
                typeof value === "object" &&
                hasOwn.call(value, "__await")
              ) {
                return PromiseImpl.resolve(value.__await).then(
                  function (value) {
                    invoke("next", value, resolve, reject);
                  },
                  function (err) {
                    invoke("throw", err, resolve, reject);
                  }
                );
              }

              return PromiseImpl.resolve(value).then(
                function (unwrapped) {
                  // When a yielded Promise is resolved, its final value becomes
                  // the .value of the Promise<{value,done}> result for the
                  // current iteration.
                  result.value = unwrapped;
                  resolve(result);
                },
                function (error) {
                  // If a rejected Promise was yielded, throw the rejection back
                  // into the async generator function so it can be handled there.
                  return invoke("throw", error, resolve, reject);
                }
              );
            }
          }

          var previousPromise;

          function enqueue(method, arg) {
            function callInvokeWithMethodAndArg() {
              return new PromiseImpl(function (resolve, reject) {
                invoke(method, arg, resolve, reject);
              });
            }

            return (previousPromise =
              // If enqueue has been called before, then we want to wait until
              // all previous Promises have been resolved before calling invoke,
              // so that results are always delivered in the correct order. If
              // enqueue has not been called before, then it is important to
              // call invoke immediately, without waiting on a callback to fire,
              // so that the async generator function has the opportunity to do
              // any necessary setup in a predictable way. This predictability
              // is why the Promise constructor synchronously invokes its
              // executor callback, and why async functions synchronously
              // execute code before the first await. Since we implement simple
              // async functions in terms of async generators, it is especially
              // important to get this right, even though it requires care.
              previousPromise
                ? previousPromise.then(
                    callInvokeWithMethodAndArg,
                    // Avoid propagating failures to Promises returned by later
                    // invocations of the iterator.
                    callInvokeWithMethodAndArg
                  )
                : callInvokeWithMethodAndArg());
          }

          // Define the unified helper method that is used to implement .next,
          // .throw, and .return (see defineIteratorMethods).
          this._invoke = enqueue;
        }

        defineIteratorMethods(AsyncIterator.prototype);
        define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
          return this;
        });
        exports.AsyncIterator = AsyncIterator;

        // Note that simple async functions are implemented on top of
        // AsyncIterator objects; they just return a Promise for the value of
        // the final result produced by the iterator.
        exports.async = function (
          innerFn,
          outerFn,
          self,
          tryLocsList,
          PromiseImpl
        ) {
          if (PromiseImpl === void 0) PromiseImpl = Promise;

          var iter = new AsyncIterator(
            wrap(innerFn, outerFn, self, tryLocsList),
            PromiseImpl
          );

          return exports.isGeneratorFunction(outerFn)
            ? iter // If outerFn is a generator, return the full iterator.
            : iter.next().then(function (result) {
                return result.done ? result.value : iter.next();
              });
        };

        function makeInvokeMethod(innerFn, self, context) {
          var state = GenStateSuspendedStart;

          return function invoke(method, arg) {
            if (state === GenStateExecuting) {
              throw new Error("Generator is already running");
            }

            if (state === GenStateCompleted) {
              if (method === "throw") {
                throw arg;
              }

              // Be forgiving, per 25.3.3.3.3 of the spec:
              // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
              return doneResult();
            }

            context.method = method;
            context.arg = arg;

            while (true) {
              var delegate = context.delegate;
              if (delegate) {
                var delegateResult = maybeInvokeDelegate(delegate, context);
                if (delegateResult) {
                  if (delegateResult === ContinueSentinel) continue;
                  return delegateResult;
                }
              }

              if (context.method === "next") {
                // Setting context._sent for legacy support of Babel's
                // function.sent implementation.
                context.sent = context._sent = context.arg;
              } else if (context.method === "throw") {
                if (state === GenStateSuspendedStart) {
                  state = GenStateCompleted;
                  throw context.arg;
                }

                context.dispatchException(context.arg);
              } else if (context.method === "return") {
                context.abrupt("return", context.arg);
              }

              state = GenStateExecuting;

              var record = tryCatch(innerFn, self, context);
              if (record.type === "normal") {
                // If an exception is thrown from innerFn, we leave state ===
                // GenStateExecuting and loop back for another invocation.
                state = context.done
                  ? GenStateCompleted
                  : GenStateSuspendedYield;

                if (record.arg === ContinueSentinel) {
                  continue;
                }

                return {
                  value: record.arg,
                  done: context.done,
                };
              } else if (record.type === "throw") {
                state = GenStateCompleted;
                // Dispatch the exception by looping back around to the
                // context.dispatchException(context.arg) call above.
                context.method = "throw";
                context.arg = record.arg;
              }
            }
          };
        }

        // Call delegate.iterator[context.method](context.arg) and handle the
        // result, either by returning a { value, done } result from the
        // delegate iterator, or by modifying context.method and context.arg,
        // setting context.delegate to null, and returning the ContinueSentinel.
        function maybeInvokeDelegate(delegate, context) {
          var method = delegate.iterator[context.method];
          if (method === undefined) {
            // A .throw or .return when the delegate iterator has no .throw
            // method always terminates the yield* loop.
            context.delegate = null;

            if (context.method === "throw") {
              // Note: ["return"] must be used for ES3 parsing compatibility.
              if (delegate.iterator["return"]) {
                // If the delegate iterator has a return method, give it a
                // chance to clean up.
                context.method = "return";
                context.arg = undefined;
                maybeInvokeDelegate(delegate, context);

                if (context.method === "throw") {
                  // If maybeInvokeDelegate(context) changed context.method from
                  // "return" to "throw", let that override the TypeError below.
                  return ContinueSentinel;
                }
              }

              context.method = "throw";
              context.arg = new TypeError(
                "The iterator does not provide a 'throw' method"
              );
            }

            return ContinueSentinel;
          }

          var record = tryCatch(method, delegate.iterator, context.arg);

          if (record.type === "throw") {
            context.method = "throw";
            context.arg = record.arg;
            context.delegate = null;
            return ContinueSentinel;
          }

          var info = record.arg;

          if (!info) {
            context.method = "throw";
            context.arg = new TypeError("iterator result is not an object");
            context.delegate = null;
            return ContinueSentinel;
          }

          if (info.done) {
            // Assign the result of the finished delegate to the temporary
            // variable specified by delegate.resultName (see delegateYield).
            context[delegate.resultName] = info.value;

            // Resume execution at the desired location (see delegateYield).
            context.next = delegate.nextLoc;

            // If context.method was "throw" but the delegate handled the
            // exception, let the outer generator proceed normally. If
            // context.method was "next", forget context.arg since it has been
            // "consumed" by the delegate iterator. If context.method was
            // "return", allow the original .return call to continue in the
            // outer generator.
            if (context.method !== "return") {
              context.method = "next";
              context.arg = undefined;
            }
          } else {
            // Re-yield the result returned by the delegate method.
            return info;
          }

          // The delegate iterator is finished, so forget it and continue with
          // the outer generator.
          context.delegate = null;
          return ContinueSentinel;
        }

        // Define Generator.prototype.{next,throw,return} in terms of the
        // unified ._invoke helper method.
        defineIteratorMethods(Gp);

        define(Gp, toStringTagSymbol, "Generator");

        // A Generator should always return itself as the iterator object when the
        // @@iterator function is called on it. Some browsers' implementations of the
        // iterator prototype chain incorrectly implement this, causing the Generator
        // object to not be returned from this call. This ensures that doesn't happen.
        // See https://github.com/facebook/regenerator/issues/274 for more details.
        define(Gp, iteratorSymbol, function () {
          return this;
        });

        define(Gp, "toString", function () {
          return "[object Generator]";
        });

        function pushTryEntry(locs) {
          var entry = { tryLoc: locs[0] };

          if (1 in locs) {
            entry.catchLoc = locs[1];
          }

          if (2 in locs) {
            entry.finallyLoc = locs[2];
            entry.afterLoc = locs[3];
          }

          this.tryEntries.push(entry);
        }

        function resetTryEntry(entry) {
          var record = entry.completion || {};
          record.type = "normal";
          delete record.arg;
          entry.completion = record;
        }

        function Context(tryLocsList) {
          // The root entry object (effectively a try statement without a catch
          // or a finally block) gives us a place to store values thrown from
          // locations where there is no enclosing try statement.
          this.tryEntries = [{ tryLoc: "root" }];
          tryLocsList.forEach(pushTryEntry, this);
          this.reset(true);
        }

        exports.keys = function (object) {
          var keys = [];
          for (var key in object) {
            keys.push(key);
          }
          keys.reverse();

          // Rather than returning an object with a next method, we keep
          // things simple and return the next function itself.
          return function next() {
            while (keys.length) {
              var key = keys.pop();
              if (key in object) {
                next.value = key;
                next.done = false;
                return next;
              }
            }

            // To avoid creating an additional object, we just hang the .value
            // and .done properties off the next function object itself. This
            // also ensures that the minifier will not anonymize the function.
            next.done = true;
            return next;
          };
        };

        function values(iterable) {
          if (iterable) {
            var iteratorMethod = iterable[iteratorSymbol];
            if (iteratorMethod) {
              return iteratorMethod.call(iterable);
            }

            if (typeof iterable.next === "function") {
              return iterable;
            }

            if (!isNaN(iterable.length)) {
              var i = -1,
                next = function next() {
                  while (++i < iterable.length) {
                    if (hasOwn.call(iterable, i)) {
                      next.value = iterable[i];
                      next.done = false;
                      return next;
                    }
                  }

                  next.value = undefined;
                  next.done = true;

                  return next;
                };

              return (next.next = next);
            }
          }

          // Return an iterator with no values.
          return { next: doneResult };
        }
        exports.values = values;

        function doneResult() {
          return { value: undefined, done: true };
        }

        Context.prototype = {
          constructor: Context,

          reset: function (skipTempReset) {
            this.prev = 0;
            this.next = 0;
            // Resetting context._sent for legacy support of Babel's
            // function.sent implementation.
            this.sent = this._sent = undefined;
            this.done = false;
            this.delegate = null;

            this.method = "next";
            this.arg = undefined;

            this.tryEntries.forEach(resetTryEntry);

            if (!skipTempReset) {
              for (var name in this) {
                // Not sure about the optimal order of these conditions:
                if (
                  name.charAt(0) === "t" &&
                  hasOwn.call(this, name) &&
                  !isNaN(+name.slice(1))
                ) {
                  this[name] = undefined;
                }
              }
            }
          },

          stop: function () {
            this.done = true;

            var rootEntry = this.tryEntries[0];
            var rootRecord = rootEntry.completion;
            if (rootRecord.type === "throw") {
              throw rootRecord.arg;
            }

            return this.rval;
          },

          dispatchException: function (exception) {
            if (this.done) {
              throw exception;
            }

            var context = this;
            function handle(loc, caught) {
              record.type = "throw";
              record.arg = exception;
              context.next = loc;

              if (caught) {
                // If the dispatched exception was caught by a catch block,
                // then let that catch block handle the exception normally.
                context.method = "next";
                context.arg = undefined;
              }

              return !!caught;
            }

            for (var i = this.tryEntries.length - 1; i >= 0; --i) {
              var entry = this.tryEntries[i];
              var record = entry.completion;

              if (entry.tryLoc === "root") {
                // Exception thrown outside of any try block that could handle
                // it, so set the completion value of the entire function to
                // throw the exception.
                return handle("end");
              }

              if (entry.tryLoc <= this.prev) {
                var hasCatch = hasOwn.call(entry, "catchLoc");
                var hasFinally = hasOwn.call(entry, "finallyLoc");

                if (hasCatch && hasFinally) {
                  if (this.prev < entry.catchLoc) {
                    return handle(entry.catchLoc, true);
                  } else if (this.prev < entry.finallyLoc) {
                    return handle(entry.finallyLoc);
                  }
                } else if (hasCatch) {
                  if (this.prev < entry.catchLoc) {
                    return handle(entry.catchLoc, true);
                  }
                } else if (hasFinally) {
                  if (this.prev < entry.finallyLoc) {
                    return handle(entry.finallyLoc);
                  }
                } else {
                  throw new Error("try statement without catch or finally");
                }
              }
            }
          },

          abrupt: function (type, arg) {
            for (var i = this.tryEntries.length - 1; i >= 0; --i) {
              var entry = this.tryEntries[i];
              if (
                entry.tryLoc <= this.prev &&
                hasOwn.call(entry, "finallyLoc") &&
                this.prev < entry.finallyLoc
              ) {
                var finallyEntry = entry;
                break;
              }
            }

            if (
              finallyEntry &&
              (type === "break" || type === "continue") &&
              finallyEntry.tryLoc <= arg &&
              arg <= finallyEntry.finallyLoc
            ) {
              // Ignore the finally entry if control is not jumping to a
              // location outside the try/catch block.
              finallyEntry = null;
            }

            var record = finallyEntry ? finallyEntry.completion : {};
            record.type = type;
            record.arg = arg;

            if (finallyEntry) {
              this.method = "next";
              this.next = finallyEntry.finallyLoc;
              return ContinueSentinel;
            }

            return this.complete(record);
          },

          complete: function (record, afterLoc) {
            if (record.type === "throw") {
              throw record.arg;
            }

            if (record.type === "break" || record.type === "continue") {
              this.next = record.arg;
            } else if (record.type === "return") {
              this.rval = this.arg = record.arg;
              this.method = "return";
              this.next = "end";
            } else if (record.type === "normal" && afterLoc) {
              this.next = afterLoc;
            }

            return ContinueSentinel;
          },

          finish: function (finallyLoc) {
            for (var i = this.tryEntries.length - 1; i >= 0; --i) {
              var entry = this.tryEntries[i];
              if (entry.finallyLoc === finallyLoc) {
                this.complete(entry.completion, entry.afterLoc);
                resetTryEntry(entry);
                return ContinueSentinel;
              }
            }
          },

          catch: function (tryLoc) {
            for (var i = this.tryEntries.length - 1; i >= 0; --i) {
              var entry = this.tryEntries[i];
              if (entry.tryLoc === tryLoc) {
                var record = entry.completion;
                if (record.type === "throw") {
                  var thrown = record.arg;
                  resetTryEntry(entry);
                }
                return thrown;
              }
            }

            // The context.catch method must only be called with a location
            // argument that corresponds to a known catch block.
            throw new Error("illegal catch attempt");
          },

          delegateYield: function (iterable, resultName, nextLoc) {
            this.delegate = {
              iterator: values(iterable),
              resultName: resultName,
              nextLoc: nextLoc,
            };

            if (this.method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              this.arg = undefined;
            }

            return ContinueSentinel;
          },
        };

        // Regardless of whether this script is executing as a CommonJS module
        // or not, return the runtime object so that we can declare the variable
        // regeneratorRuntime in the outer scope, which allows this module to be
        // injected easily by `bin/regenerator --include-runtime script.js`.
        return exports;
      })(
        // If this script is executing as a CommonJS module, use module.exports
        // as the regeneratorRuntime namespace. Otherwise create a new empty
        // object. Either way, the resulting object will be used to initialize
        // the regeneratorRuntime variable at the top of this file.
        true ? module.exports : 0
      );

      try {
        regeneratorRuntime = runtime;
      } catch (accidentalStrictMode) {
        // This module should not be running in strict mode, so the above
        // assignment should always work unless something is misconfigured. Just
        // in case runtime.js accidentally runs in strict mode, in modern engines
        // we can explicitly access globalThis. In older engines we can escape
        // strict mode using a global Function call. This could conceivably fail
        // if a Content Security Policy forbids using Function, but in that case
        // the proper solution is to fix the accidental strict mode problem. If
        // you've misconfigured your bundler to force strict mode and applied a
        // CSP to forbid Function, and you're not willing to fix either of those
        // problems, please detail your unique predicament in a GitHub issue.
        if (typeof globalThis === "object") {
          globalThis.regeneratorRuntime = runtime;
        } else {
          Function("r", "regeneratorRuntime = r")(runtime);
        }
      }

      /***/
    },

    /***/ 124: /***/ () => {
      // Copyright 2014 Google Inc. All rights reserved.
      //
      // Licensed under the Apache License, Version 2.0 (the "License");
      // you may not use this file except in compliance with the License.
      //     You may obtain a copy of the License at
      //
      // http://www.apache.org/licenses/LICENSE-2.0
      //
      // Unless required by applicable law or agreed to in writing, software
      // distributed under the License is distributed on an "AS IS" BASIS,
      // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      //     See the License for the specific language governing permissions and
      // limitations under the License.

      !(function () {
        var a = {},
          b = {};
        !(function (a, b) {
          function c(a) {
            if ("number" == typeof a) return a;
            var b = {};
            for (var c in a) b[c] = a[c];
            return b;
          }
          function d() {
            (this._delay = 0),
              (this._endDelay = 0),
              (this._fill = "none"),
              (this._iterationStart = 0),
              (this._iterations = 1),
              (this._duration = 0),
              (this._playbackRate = 1),
              (this._direction = "normal"),
              (this._easing = "linear"),
              (this._easingFunction = x);
          }
          function e() {
            return a.isDeprecated(
              "Invalid timing inputs",
              "2016-03-02",
              "TypeError exceptions will be thrown instead.",
              !0
            );
          }
          function f(b, c, e) {
            var f = new d();
            return (
              c && ((f.fill = "both"), (f.duration = "auto")),
              "number" != typeof b || isNaN(b)
                ? void 0 !== b &&
                  Object.getOwnPropertyNames(b).forEach(function (c) {
                    if ("auto" != b[c]) {
                      if (
                        ("number" == typeof f[c] || "duration" == c) &&
                        ("number" != typeof b[c] || isNaN(b[c]))
                      )
                        return;
                      if ("fill" == c && -1 == v.indexOf(b[c])) return;
                      if ("direction" == c && -1 == w.indexOf(b[c])) return;
                      if (
                        "playbackRate" == c &&
                        1 !== b[c] &&
                        a.isDeprecated(
                          "AnimationEffectTiming.playbackRate",
                          "2014-11-28",
                          "Use Animation.playbackRate instead."
                        )
                      )
                        return;
                      f[c] = b[c];
                    }
                  })
                : (f.duration = b),
              f
            );
          }
          function g(a) {
            return (
              "number" == typeof a &&
                (a = isNaN(a) ? { duration: 0 } : { duration: a }),
              a
            );
          }
          function h(b, c) {
            return (b = a.numericTimingToObject(b)), f(b, c);
          }
          function i(a, b, c, d) {
            return a < 0 || a > 1 || c < 0 || c > 1
              ? x
              : function (e) {
                  function f(a, b, c) {
                    return (
                      3 * a * (1 - c) * (1 - c) * c +
                      3 * b * (1 - c) * c * c +
                      c * c * c
                    );
                  }
                  if (e <= 0) {
                    var g = 0;
                    return (
                      a > 0 ? (g = b / a) : !b && c > 0 && (g = d / c), g * e
                    );
                  }
                  if (e >= 1) {
                    var h = 0;
                    return (
                      c < 1
                        ? (h = (d - 1) / (c - 1))
                        : 1 == c && a < 1 && (h = (b - 1) / (a - 1)),
                      1 + h * (e - 1)
                    );
                  }
                  for (var i = 0, j = 1; i < j; ) {
                    var k = (i + j) / 2,
                      l = f(a, c, k);
                    if (Math.abs(e - l) < 1e-5) return f(b, d, k);
                    l < e ? (i = k) : (j = k);
                  }
                  return f(b, d, k);
                };
          }
          function j(a, b) {
            return function (c) {
              if (c >= 1) return 1;
              var d = 1 / a;
              return (c += b * d) - (c % d);
            };
          }
          function k(a) {
            C || (C = document.createElement("div").style),
              (C.animationTimingFunction = ""),
              (C.animationTimingFunction = a);
            var b = C.animationTimingFunction;
            if ("" == b && e())
              throw new TypeError(a + " is not a valid value for easing");
            return b;
          }
          function l(a) {
            if ("linear" == a) return x;
            var b = E.exec(a);
            if (b) return i.apply(this, b.slice(1).map(Number));
            var c = F.exec(a);
            if (c) return j(Number(c[1]), A);
            var d = G.exec(a);
            return d
              ? j(Number(d[1]), { start: y, middle: z, end: A }[d[2]])
              : B[a] || x;
          }
          function m(a) {
            return Math.abs(n(a) / a.playbackRate);
          }
          function n(a) {
            return 0 === a.duration || 0 === a.iterations
              ? 0
              : a.duration * a.iterations;
          }
          function o(a, b, c) {
            if (null == b) return H;
            var d = c.delay + a + c.endDelay;
            return b < Math.min(c.delay, d)
              ? I
              : b >= Math.min(c.delay + a, d)
              ? J
              : K;
          }
          function p(a, b, c, d, e) {
            switch (d) {
              case I:
                return "backwards" == b || "both" == b ? 0 : null;
              case K:
                return c - e;
              case J:
                return "forwards" == b || "both" == b ? a : null;
              case H:
                return null;
            }
          }
          function q(a, b, c, d, e) {
            var f = e;
            return 0 === a ? b !== I && (f += c) : (f += d / a), f;
          }
          function r(a, b, c, d, e, f) {
            var g = a === 1 / 0 ? b % 1 : a % 1;
            return (
              0 !== g || c !== J || 0 === d || (0 === e && 0 !== f) || (g = 1),
              g
            );
          }
          function s(a, b, c, d) {
            return a === J && b === 1 / 0
              ? 1 / 0
              : 1 === c
              ? Math.floor(d) - 1
              : Math.floor(d);
          }
          function t(a, b, c) {
            var d = a;
            if ("normal" !== a && "reverse" !== a) {
              var e = b;
              "alternate-reverse" === a && (e += 1),
                (d = "normal"),
                e !== 1 / 0 && e % 2 != 0 && (d = "reverse");
            }
            return "normal" === d ? c : 1 - c;
          }
          function u(a, b, c) {
            var d = o(a, b, c),
              e = p(a, c.fill, b, d, c.delay);
            if (null === e) return null;
            var f = q(c.duration, d, c.iterations, e, c.iterationStart),
              g = r(f, c.iterationStart, d, c.iterations, e, c.duration),
              h = s(d, c.iterations, g, f),
              i = t(c.direction, h, g);
            return c._easingFunction(i);
          }
          var v = "backwards|forwards|both|none".split("|"),
            w = "reverse|alternate|alternate-reverse".split("|"),
            x = function (a) {
              return a;
            };
          d.prototype = {
            _setMember: function (b, c) {
              (this["_" + b] = c),
                this._effect &&
                  ((this._effect._timingInput[b] = c),
                  (this._effect._timing = a.normalizeTimingInput(
                    this._effect._timingInput
                  )),
                  (this._effect.activeDuration = a.calculateActiveDuration(
                    this._effect._timing
                  )),
                  this._effect._animation &&
                    this._effect._animation._rebuildUnderlyingAnimation());
            },
            get playbackRate() {
              return this._playbackRate;
            },
            set delay(a) {
              this._setMember("delay", a);
            },
            get delay() {
              return this._delay;
            },
            set endDelay(a) {
              this._setMember("endDelay", a);
            },
            get endDelay() {
              return this._endDelay;
            },
            set fill(a) {
              this._setMember("fill", a);
            },
            get fill() {
              return this._fill;
            },
            set iterationStart(a) {
              if ((isNaN(a) || a < 0) && e())
                throw new TypeError(
                  "iterationStart must be a non-negative number, received: " + a
                );
              this._setMember("iterationStart", a);
            },
            get iterationStart() {
              return this._iterationStart;
            },
            set duration(a) {
              if ("auto" != a && (isNaN(a) || a < 0) && e())
                throw new TypeError(
                  "duration must be non-negative or auto, received: " + a
                );
              this._setMember("duration", a);
            },
            get duration() {
              return this._duration;
            },
            set direction(a) {
              this._setMember("direction", a);
            },
            get direction() {
              return this._direction;
            },
            set easing(a) {
              (this._easingFunction = l(k(a))), this._setMember("easing", a);
            },
            get easing() {
              return this._easing;
            },
            set iterations(a) {
              if ((isNaN(a) || a < 0) && e())
                throw new TypeError(
                  "iterations must be non-negative, received: " + a
                );
              this._setMember("iterations", a);
            },
            get iterations() {
              return this._iterations;
            },
          };
          var y = 1,
            z = 0.5,
            A = 0,
            B = {
              ease: i(0.25, 0.1, 0.25, 1),
              "ease-in": i(0.42, 0, 1, 1),
              "ease-out": i(0, 0, 0.58, 1),
              "ease-in-out": i(0.42, 0, 0.58, 1),
              "step-start": j(1, y),
              "step-middle": j(1, z),
              "step-end": j(1, A),
            },
            C = null,
            D = "\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*",
            E = new RegExp(
              "cubic-bezier\\(" + D + "," + D + "," + D + "," + D + "\\)"
            ),
            F = /steps\(\s*(\d+)\s*\)/,
            G = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/,
            H = 0,
            I = 1,
            J = 2,
            K = 3;
          (a.cloneTimingInput = c),
            (a.makeTiming = f),
            (a.numericTimingToObject = g),
            (a.normalizeTimingInput = h),
            (a.calculateActiveDuration = m),
            (a.calculateIterationProgress = u),
            (a.calculatePhase = o),
            (a.normalizeEasing = k),
            (a.parseEasingFunction = l);
        })(a),
          (function (a, b) {
            function c(a, b) {
              return a in k ? k[a][b] || b : b;
            }
            function d(a) {
              return (
                "display" === a ||
                0 === a.lastIndexOf("animation", 0) ||
                0 === a.lastIndexOf("transition", 0)
              );
            }
            function e(a, b, e) {
              if (!d(a)) {
                var f = h[a];
                if (f) {
                  i.style[a] = b;
                  for (var g in f) {
                    var j = f[g],
                      k = i.style[j];
                    e[j] = c(j, k);
                  }
                } else e[a] = c(a, b);
              }
            }
            function f(a) {
              var b = [];
              for (var c in a)
                if (!(c in ["easing", "offset", "composite"])) {
                  var d = a[c];
                  Array.isArray(d) || (d = [d]);
                  for (var e, f = d.length, g = 0; g < f; g++)
                    (e = {}),
                      (e.offset =
                        "offset" in a ? a.offset : 1 == f ? 1 : g / (f - 1)),
                      "easing" in a && (e.easing = a.easing),
                      "composite" in a && (e.composite = a.composite),
                      (e[c] = d[g]),
                      b.push(e);
                }
              return (
                b.sort(function (a, b) {
                  return a.offset - b.offset;
                }),
                b
              );
            }
            function g(b) {
              function c() {
                var a = d.length;
                null == d[a - 1].offset && (d[a - 1].offset = 1),
                  a > 1 && null == d[0].offset && (d[0].offset = 0);
                for (var b = 0, c = d[0].offset, e = 1; e < a; e++) {
                  var f = d[e].offset;
                  if (null != f) {
                    for (var g = 1; g < e - b; g++)
                      d[b + g].offset = c + ((f - c) * g) / (e - b);
                    (b = e), (c = f);
                  }
                }
              }
              if (null == b) return [];
              window.Symbol &&
                Symbol.iterator &&
                Array.prototype.from &&
                b[Symbol.iterator] &&
                (b = Array.from(b)),
                Array.isArray(b) || (b = f(b));
              for (
                var d = b.map(function (b) {
                    var c = {};
                    for (var d in b) {
                      var f = b[d];
                      if ("offset" == d) {
                        if (null != f) {
                          if (((f = Number(f)), !isFinite(f)))
                            throw new TypeError(
                              "Keyframe offsets must be numbers."
                            );
                          if (f < 0 || f > 1)
                            throw new TypeError(
                              "Keyframe offsets must be between 0 and 1."
                            );
                        }
                      } else if ("composite" == d) {
                        if ("add" == f || "accumulate" == f)
                          throw {
                            type: DOMException.NOT_SUPPORTED_ERR,
                            name: "NotSupportedError",
                            message: "add compositing is not supported",
                          };
                        if ("replace" != f)
                          throw new TypeError(
                            "Invalid composite mode " + f + "."
                          );
                      } else f = "easing" == d ? a.normalizeEasing(f) : "" + f;
                      e(d, f, c);
                    }
                    return (
                      void 0 == c.offset && (c.offset = null),
                      void 0 == c.easing && (c.easing = "linear"),
                      c
                    );
                  }),
                  g = !0,
                  h = -1 / 0,
                  i = 0;
                i < d.length;
                i++
              ) {
                var j = d[i].offset;
                if (null != j) {
                  if (j < h)
                    throw new TypeError(
                      "Keyframes are not loosely sorted by offset. Sort or specify offsets."
                    );
                  h = j;
                } else g = !1;
              }
              return (
                (d = d.filter(function (a) {
                  return a.offset >= 0 && a.offset <= 1;
                })),
                g || c(),
                d
              );
            }
            var h = {
                background: [
                  "backgroundImage",
                  "backgroundPosition",
                  "backgroundSize",
                  "backgroundRepeat",
                  "backgroundAttachment",
                  "backgroundOrigin",
                  "backgroundClip",
                  "backgroundColor",
                ],
                border: [
                  "borderTopColor",
                  "borderTopStyle",
                  "borderTopWidth",
                  "borderRightColor",
                  "borderRightStyle",
                  "borderRightWidth",
                  "borderBottomColor",
                  "borderBottomStyle",
                  "borderBottomWidth",
                  "borderLeftColor",
                  "borderLeftStyle",
                  "borderLeftWidth",
                ],
                borderBottom: [
                  "borderBottomWidth",
                  "borderBottomStyle",
                  "borderBottomColor",
                ],
                borderColor: [
                  "borderTopColor",
                  "borderRightColor",
                  "borderBottomColor",
                  "borderLeftColor",
                ],
                borderLeft: [
                  "borderLeftWidth",
                  "borderLeftStyle",
                  "borderLeftColor",
                ],
                borderRadius: [
                  "borderTopLeftRadius",
                  "borderTopRightRadius",
                  "borderBottomRightRadius",
                  "borderBottomLeftRadius",
                ],
                borderRight: [
                  "borderRightWidth",
                  "borderRightStyle",
                  "borderRightColor",
                ],
                borderTop: [
                  "borderTopWidth",
                  "borderTopStyle",
                  "borderTopColor",
                ],
                borderWidth: [
                  "borderTopWidth",
                  "borderRightWidth",
                  "borderBottomWidth",
                  "borderLeftWidth",
                ],
                flex: ["flexGrow", "flexShrink", "flexBasis"],
                font: [
                  "fontFamily",
                  "fontSize",
                  "fontStyle",
                  "fontVariant",
                  "fontWeight",
                  "lineHeight",
                ],
                margin: [
                  "marginTop",
                  "marginRight",
                  "marginBottom",
                  "marginLeft",
                ],
                outline: ["outlineColor", "outlineStyle", "outlineWidth"],
                padding: [
                  "paddingTop",
                  "paddingRight",
                  "paddingBottom",
                  "paddingLeft",
                ],
              },
              i = document.createElementNS(
                "http://www.w3.org/1999/xhtml",
                "div"
              ),
              j = { thin: "1px", medium: "3px", thick: "5px" },
              k = {
                borderBottomWidth: j,
                borderLeftWidth: j,
                borderRightWidth: j,
                borderTopWidth: j,
                fontSize: {
                  "xx-small": "60%",
                  "x-small": "75%",
                  small: "89%",
                  medium: "100%",
                  large: "120%",
                  "x-large": "150%",
                  "xx-large": "200%",
                },
                fontWeight: { normal: "400", bold: "700" },
                outlineWidth: j,
                textShadow: { none: "0px 0px 0px transparent" },
                boxShadow: { none: "0px 0px 0px 0px transparent" },
              };
            (a.convertToArrayForm = f), (a.normalizeKeyframes = g);
          })(a),
          (function (a) {
            var b = {};
            (a.isDeprecated = function (a, c, d, e) {
              var f = e ? "are" : "is",
                g = new Date(),
                h = new Date(c);
              return (
                h.setMonth(h.getMonth() + 3),
                !(
                  g < h &&
                  (a in b ||
                    console.warn(
                      "Web Animations: " +
                        a +
                        " " +
                        f +
                        " deprecated and will stop working on " +
                        h.toDateString() +
                        ". " +
                        d
                    ),
                  (b[a] = !0),
                  1)
                )
              );
            }),
              (a.deprecated = function (b, c, d, e) {
                var f = e ? "are" : "is";
                if (a.isDeprecated(b, c, d, e))
                  throw new Error(b + " " + f + " no longer supported. " + d);
              });
          })(a),
          (function () {
            if (document.documentElement.animate) {
              var c = document.documentElement.animate([], 0),
                d = !0;
              if (
                (c &&
                  ((d = !1),
                  "play|currentTime|pause|reverse|playbackRate|cancel|finish|startTime|playState"
                    .split("|")
                    .forEach(function (a) {
                      void 0 === c[a] && (d = !0);
                    })),
                !d)
              )
                return;
            }
            !(function (a, b, c) {
              function d(a) {
                for (var b = {}, c = 0; c < a.length; c++)
                  for (var d in a[c])
                    if ("offset" != d && "easing" != d && "composite" != d) {
                      var e = {
                        offset: a[c].offset,
                        easing: a[c].easing,
                        value: a[c][d],
                      };
                      (b[d] = b[d] || []), b[d].push(e);
                    }
                for (var f in b) {
                  var g = b[f];
                  if (0 != g[0].offset || 1 != g[g.length - 1].offset)
                    throw {
                      type: DOMException.NOT_SUPPORTED_ERR,
                      name: "NotSupportedError",
                      message: "Partial keyframes are not supported",
                    };
                }
                return b;
              }
              function e(c) {
                var d = [];
                for (var e in c)
                  for (var f = c[e], g = 0; g < f.length - 1; g++) {
                    var h = g,
                      i = g + 1,
                      j = f[h].offset,
                      k = f[i].offset,
                      l = j,
                      m = k;
                    0 == g && ((l = -1 / 0), 0 == k && (i = h)),
                      g == f.length - 2 && ((m = 1 / 0), 1 == j && (h = i)),
                      d.push({
                        applyFrom: l,
                        applyTo: m,
                        startOffset: f[h].offset,
                        endOffset: f[i].offset,
                        easingFunction: a.parseEasingFunction(f[h].easing),
                        property: e,
                        interpolation: b.propertyInterpolation(
                          e,
                          f[h].value,
                          f[i].value
                        ),
                      });
                  }
                return (
                  d.sort(function (a, b) {
                    return a.startOffset - b.startOffset;
                  }),
                  d
                );
              }
              b.convertEffectInput = function (c) {
                var f = a.normalizeKeyframes(c),
                  g = d(f),
                  h = e(g);
                return function (a, c) {
                  if (null != c)
                    h.filter(function (a) {
                      return c >= a.applyFrom && c < a.applyTo;
                    }).forEach(function (d) {
                      var e = c - d.startOffset,
                        f = d.endOffset - d.startOffset,
                        g = 0 == f ? 0 : d.easingFunction(e / f);
                      b.apply(a, d.property, d.interpolation(g));
                    });
                  else
                    for (var d in g)
                      "offset" != d &&
                        "easing" != d &&
                        "composite" != d &&
                        b.clear(a, d);
                };
              };
            })(a, b),
              (function (a, b, c) {
                function d(a) {
                  return a.replace(/-(.)/g, function (a, b) {
                    return b.toUpperCase();
                  });
                }
                function e(a, b, c) {
                  (h[c] = h[c] || []), h[c].push([a, b]);
                }
                function f(a, b, c) {
                  for (var f = 0; f < c.length; f++) {
                    e(a, b, d(c[f]));
                  }
                }
                function g(c, e, f) {
                  var g = c;
                  /-/.test(c) &&
                    !a.isDeprecated(
                      "Hyphenated property names",
                      "2016-03-22",
                      "Use camelCase instead.",
                      !0
                    ) &&
                    (g = d(c)),
                    ("initial" != e && "initial" != f) ||
                      ("initial" == e && (e = i[g]),
                      "initial" == f && (f = i[g]));
                  for (
                    var j = e == f ? [] : h[g], k = 0;
                    j && k < j.length;
                    k++
                  ) {
                    var l = j[k][0](e),
                      m = j[k][0](f);
                    if (void 0 !== l && void 0 !== m) {
                      var n = j[k][1](l, m);
                      if (n) {
                        var o = b.Interpolation.apply(null, n);
                        return function (a) {
                          return 0 == a ? e : 1 == a ? f : o(a);
                        };
                      }
                    }
                  }
                  return b.Interpolation(!1, !0, function (a) {
                    return a ? f : e;
                  });
                }
                var h = {};
                b.addPropertiesHandler = f;
                var i = {
                  backgroundColor: "transparent",
                  backgroundPosition: "0% 0%",
                  borderBottomColor: "currentColor",
                  borderBottomLeftRadius: "0px",
                  borderBottomRightRadius: "0px",
                  borderBottomWidth: "3px",
                  borderLeftColor: "currentColor",
                  borderLeftWidth: "3px",
                  borderRightColor: "currentColor",
                  borderRightWidth: "3px",
                  borderSpacing: "2px",
                  borderTopColor: "currentColor",
                  borderTopLeftRadius: "0px",
                  borderTopRightRadius: "0px",
                  borderTopWidth: "3px",
                  bottom: "auto",
                  clip: "rect(0px, 0px, 0px, 0px)",
                  color: "black",
                  fontSize: "100%",
                  fontWeight: "400",
                  height: "auto",
                  left: "auto",
                  letterSpacing: "normal",
                  lineHeight: "120%",
                  marginBottom: "0px",
                  marginLeft: "0px",
                  marginRight: "0px",
                  marginTop: "0px",
                  maxHeight: "none",
                  maxWidth: "none",
                  minHeight: "0px",
                  minWidth: "0px",
                  opacity: "1.0",
                  outlineColor: "invert",
                  outlineOffset: "0px",
                  outlineWidth: "3px",
                  paddingBottom: "0px",
                  paddingLeft: "0px",
                  paddingRight: "0px",
                  paddingTop: "0px",
                  right: "auto",
                  strokeDasharray: "none",
                  strokeDashoffset: "0px",
                  textIndent: "0px",
                  textShadow: "0px 0px 0px transparent",
                  top: "auto",
                  transform: "",
                  verticalAlign: "0px",
                  visibility: "visible",
                  width: "auto",
                  wordSpacing: "normal",
                  zIndex: "auto",
                };
                b.propertyInterpolation = g;
              })(a, b),
              (function (a, b, c) {
                function d(b) {
                  var c = a.calculateActiveDuration(b),
                    d = function (d) {
                      return a.calculateIterationProgress(c, d, b);
                    };
                  return (d._totalDuration = b.delay + c + b.endDelay), d;
                }
                b.KeyframeEffect = function (c, e, f, g) {
                  var h,
                    i = d(a.normalizeTimingInput(f)),
                    j = b.convertEffectInput(e),
                    k = function () {
                      j(c, h);
                    };
                  return (
                    (k._update = function (a) {
                      return null !== (h = i(a));
                    }),
                    (k._clear = function () {
                      j(c, null);
                    }),
                    (k._hasSameTarget = function (a) {
                      return c === a;
                    }),
                    (k._target = c),
                    (k._totalDuration = i._totalDuration),
                    (k._id = g),
                    k
                  );
                };
              })(a, b),
              (function (a, b) {
                function c(a, b) {
                  return (
                    !(
                      !b.namespaceURI || -1 == b.namespaceURI.indexOf("/svg")
                    ) &&
                    (g in a ||
                      (a[g] = /Trident|MSIE|IEMobile|Edge|Android 4/i.test(
                        a.navigator.userAgent
                      )),
                    a[g])
                  );
                }
                function d(a, b, c) {
                  (c.enumerable = !0),
                    (c.configurable = !0),
                    Object.defineProperty(a, b, c);
                }
                function e(a) {
                  (this._element = a),
                    (this._surrogateStyle = document.createElementNS(
                      "http://www.w3.org/1999/xhtml",
                      "div"
                    ).style),
                    (this._style = a.style),
                    (this._length = 0),
                    (this._isAnimatedProperty = {}),
                    (this._updateSvgTransformAttr = c(window, a)),
                    (this._savedTransformAttr = null);
                  for (var b = 0; b < this._style.length; b++) {
                    var d = this._style[b];
                    this._surrogateStyle[d] = this._style[d];
                  }
                  this._updateIndices();
                }
                function f(a) {
                  if (!a._webAnimationsPatchedStyle) {
                    var b = new e(a);
                    try {
                      d(a, "style", {
                        get: function () {
                          return b;
                        },
                      });
                    } catch (b) {
                      (a.style._set = function (b, c) {
                        a.style[b] = c;
                      }),
                        (a.style._clear = function (b) {
                          a.style[b] = "";
                        });
                    }
                    a._webAnimationsPatchedStyle = a.style;
                  }
                }
                var g = "_webAnimationsUpdateSvgTransformAttr",
                  h = { cssText: 1, length: 1, parentRule: 1 },
                  i = {
                    getPropertyCSSValue: 1,
                    getPropertyPriority: 1,
                    getPropertyValue: 1,
                    item: 1,
                    removeProperty: 1,
                    setProperty: 1,
                  },
                  j = { removeProperty: 1, setProperty: 1 };
                e.prototype = {
                  get cssText() {
                    return this._surrogateStyle.cssText;
                  },
                  set cssText(a) {
                    for (
                      var b = {}, c = 0;
                      c < this._surrogateStyle.length;
                      c++
                    )
                      b[this._surrogateStyle[c]] = !0;
                    (this._surrogateStyle.cssText = a), this._updateIndices();
                    for (var c = 0; c < this._surrogateStyle.length; c++)
                      b[this._surrogateStyle[c]] = !0;
                    for (var d in b)
                      this._isAnimatedProperty[d] ||
                        this._style.setProperty(
                          d,
                          this._surrogateStyle.getPropertyValue(d)
                        );
                  },
                  get length() {
                    return this._surrogateStyle.length;
                  },
                  get parentRule() {
                    return this._style.parentRule;
                  },
                  _updateIndices: function () {
                    for (; this._length < this._surrogateStyle.length; )
                      Object.defineProperty(this, this._length, {
                        configurable: !0,
                        enumerable: !1,
                        get: (function (a) {
                          return function () {
                            return this._surrogateStyle[a];
                          };
                        })(this._length),
                      }),
                        this._length++;
                    for (; this._length > this._surrogateStyle.length; )
                      this._length--,
                        Object.defineProperty(this, this._length, {
                          configurable: !0,
                          enumerable: !1,
                          value: void 0,
                        });
                  },
                  _set: function (b, c) {
                    (this._style[b] = c),
                      (this._isAnimatedProperty[b] = !0),
                      this._updateSvgTransformAttr &&
                        "transform" == a.unprefixedPropertyName(b) &&
                        (null == this._savedTransformAttr &&
                          (this._savedTransformAttr =
                            this._element.getAttribute("transform")),
                        this._element.setAttribute(
                          "transform",
                          a.transformToSvgMatrix(c)
                        ));
                  },
                  _clear: function (b) {
                    (this._style[b] = this._surrogateStyle[b]),
                      this._updateSvgTransformAttr &&
                        "transform" == a.unprefixedPropertyName(b) &&
                        (this._savedTransformAttr
                          ? this._element.setAttribute(
                              "transform",
                              this._savedTransformAttr
                            )
                          : this._element.removeAttribute("transform"),
                        (this._savedTransformAttr = null)),
                      delete this._isAnimatedProperty[b];
                  },
                };
                for (var k in i)
                  e.prototype[k] = (function (a, b) {
                    return function () {
                      var c = this._surrogateStyle[a].apply(
                        this._surrogateStyle,
                        arguments
                      );
                      return (
                        b &&
                          (this._isAnimatedProperty[arguments[0]] ||
                            this._style[a].apply(this._style, arguments),
                          this._updateIndices()),
                        c
                      );
                    };
                  })(k, k in j);
                for (var l in document.documentElement.style)
                  l in h ||
                    l in i ||
                    (function (a) {
                      d(e.prototype, a, {
                        get: function () {
                          return this._surrogateStyle[a];
                        },
                        set: function (b) {
                          (this._surrogateStyle[a] = b),
                            this._updateIndices(),
                            this._isAnimatedProperty[a] || (this._style[a] = b);
                        },
                      });
                    })(l);
                (a.apply = function (b, c, d) {
                  f(b), b.style._set(a.propertyName(c), d);
                }),
                  (a.clear = function (b, c) {
                    b._webAnimationsPatchedStyle &&
                      b.style._clear(a.propertyName(c));
                  });
              })(b),
              (function (a) {
                window.Element.prototype.animate = function (b, c) {
                  var d = "";
                  return (
                    c && c.id && (d = c.id),
                    a.timeline._play(a.KeyframeEffect(this, b, c, d))
                  );
                };
              })(b),
              (function (a, b) {
                function c(a, b, d) {
                  if ("number" == typeof a && "number" == typeof b)
                    return a * (1 - d) + b * d;
                  if ("boolean" == typeof a && "boolean" == typeof b)
                    return d < 0.5 ? a : b;
                  if (a.length == b.length) {
                    for (var e = [], f = 0; f < a.length; f++)
                      e.push(c(a[f], b[f], d));
                    return e;
                  }
                  throw "Mismatched interpolation arguments " + a + ":" + b;
                }
                a.Interpolation = function (a, b, d) {
                  return function (e) {
                    return d(c(a, b, e));
                  };
                };
              })(b),
              (function (a, b) {
                function c(a, b, c) {
                  return Math.max(Math.min(a, c), b);
                }
                function d(b, d, e) {
                  var f = a.dot(b, d);
                  f = c(f, -1, 1);
                  var g = [];
                  if (1 === f) g = b;
                  else
                    for (
                      var h = Math.acos(f),
                        i = (1 * Math.sin(e * h)) / Math.sqrt(1 - f * f),
                        j = 0;
                      j < 4;
                      j++
                    )
                      g.push(b[j] * (Math.cos(e * h) - f * i) + d[j] * i);
                  return g;
                }
                var e = (function () {
                  function a(a, b) {
                    for (
                      var c = [
                          [0, 0, 0, 0],
                          [0, 0, 0, 0],
                          [0, 0, 0, 0],
                          [0, 0, 0, 0],
                        ],
                        d = 0;
                      d < 4;
                      d++
                    )
                      for (var e = 0; e < 4; e++)
                        for (var f = 0; f < 4; f++)
                          c[d][e] += b[d][f] * a[f][e];
                    return c;
                  }
                  function b(a) {
                    return (
                      0 == a[0][2] &&
                      0 == a[0][3] &&
                      0 == a[1][2] &&
                      0 == a[1][3] &&
                      0 == a[2][0] &&
                      0 == a[2][1] &&
                      1 == a[2][2] &&
                      0 == a[2][3] &&
                      0 == a[3][2] &&
                      1 == a[3][3]
                    );
                  }
                  function c(c, d, e, f, g) {
                    for (
                      var h = [
                          [1, 0, 0, 0],
                          [0, 1, 0, 0],
                          [0, 0, 1, 0],
                          [0, 0, 0, 1],
                        ],
                        i = 0;
                      i < 4;
                      i++
                    )
                      h[i][3] = g[i];
                    for (var i = 0; i < 3; i++)
                      for (var j = 0; j < 3; j++) h[3][i] += c[j] * h[j][i];
                    var k = f[0],
                      l = f[1],
                      m = f[2],
                      n = f[3],
                      o = [
                        [1, 0, 0, 0],
                        [0, 1, 0, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 1],
                      ];
                    (o[0][0] = 1 - 2 * (l * l + m * m)),
                      (o[0][1] = 2 * (k * l - m * n)),
                      (o[0][2] = 2 * (k * m + l * n)),
                      (o[1][0] = 2 * (k * l + m * n)),
                      (o[1][1] = 1 - 2 * (k * k + m * m)),
                      (o[1][2] = 2 * (l * m - k * n)),
                      (o[2][0] = 2 * (k * m - l * n)),
                      (o[2][1] = 2 * (l * m + k * n)),
                      (o[2][2] = 1 - 2 * (k * k + l * l)),
                      (h = a(h, o));
                    var p = [
                      [1, 0, 0, 0],
                      [0, 1, 0, 0],
                      [0, 0, 1, 0],
                      [0, 0, 0, 1],
                    ];
                    e[2] && ((p[2][1] = e[2]), (h = a(h, p))),
                      e[1] && ((p[2][1] = 0), (p[2][0] = e[0]), (h = a(h, p))),
                      e[0] && ((p[2][0] = 0), (p[1][0] = e[0]), (h = a(h, p)));
                    for (var i = 0; i < 3; i++)
                      for (var j = 0; j < 3; j++) h[i][j] *= d[i];
                    return b(h)
                      ? [h[0][0], h[0][1], h[1][0], h[1][1], h[3][0], h[3][1]]
                      : h[0].concat(h[1], h[2], h[3]);
                  }
                  return c;
                })();
                (a.composeMatrix = e), (a.quat = d);
              })(b),
              (function (a, b, c) {
                a.sequenceNumber = 0;
                var d = function (a, b, c) {
                  (this.target = a),
                    (this.currentTime = b),
                    (this.timelineTime = c),
                    (this.type = "finish"),
                    (this.bubbles = !1),
                    (this.cancelable = !1),
                    (this.currentTarget = a),
                    (this.defaultPrevented = !1),
                    (this.eventPhase = Event.AT_TARGET),
                    (this.timeStamp = Date.now());
                };
                (b.Animation = function (b) {
                  (this.id = ""),
                    b && b._id && (this.id = b._id),
                    (this._sequenceNumber = a.sequenceNumber++),
                    (this._currentTime = 0),
                    (this._startTime = null),
                    (this._paused = !1),
                    (this._playbackRate = 1),
                    (this._inTimeline = !0),
                    (this._finishedFlag = !0),
                    (this.onfinish = null),
                    (this._finishHandlers = []),
                    (this._effect = b),
                    (this._inEffect = this._effect._update(0)),
                    (this._idle = !0),
                    (this._currentTimePending = !1);
                }),
                  (b.Animation.prototype = {
                    _ensureAlive: function () {
                      this.playbackRate < 0 && 0 === this.currentTime
                        ? (this._inEffect = this._effect._update(-1))
                        : (this._inEffect = this._effect._update(
                            this.currentTime
                          )),
                        this._inTimeline ||
                          (!this._inEffect && this._finishedFlag) ||
                          ((this._inTimeline = !0),
                          b.timeline._animations.push(this));
                    },
                    _tickCurrentTime: function (a, b) {
                      a != this._currentTime &&
                        ((this._currentTime = a),
                        this._isFinished &&
                          !b &&
                          (this._currentTime =
                            this._playbackRate > 0 ? this._totalDuration : 0),
                        this._ensureAlive());
                    },
                    get currentTime() {
                      return this._idle || this._currentTimePending
                        ? null
                        : this._currentTime;
                    },
                    set currentTime(a) {
                      (a = +a),
                        isNaN(a) ||
                          (b.restart(),
                          this._paused ||
                            null == this._startTime ||
                            (this._startTime =
                              this._timeline.currentTime -
                              a / this._playbackRate),
                          (this._currentTimePending = !1),
                          this._currentTime != a &&
                            (this._idle &&
                              ((this._idle = !1), (this._paused = !0)),
                            this._tickCurrentTime(a, !0),
                            b.applyDirtiedAnimation(this)));
                    },
                    get startTime() {
                      return this._startTime;
                    },
                    set startTime(a) {
                      (a = +a),
                        isNaN(a) ||
                          this._paused ||
                          this._idle ||
                          ((this._startTime = a),
                          this._tickCurrentTime(
                            (this._timeline.currentTime - this._startTime) *
                              this.playbackRate
                          ),
                          b.applyDirtiedAnimation(this));
                    },
                    get playbackRate() {
                      return this._playbackRate;
                    },
                    set playbackRate(a) {
                      if (a != this._playbackRate) {
                        var c = this.currentTime;
                        (this._playbackRate = a),
                          (this._startTime = null),
                          "paused" != this.playState &&
                            "idle" != this.playState &&
                            ((this._finishedFlag = !1),
                            (this._idle = !1),
                            this._ensureAlive(),
                            b.applyDirtiedAnimation(this)),
                          null != c && (this.currentTime = c);
                      }
                    },
                    get _isFinished() {
                      return (
                        !this._idle &&
                        ((this._playbackRate > 0 &&
                          this._currentTime >= this._totalDuration) ||
                          (this._playbackRate < 0 && this._currentTime <= 0))
                      );
                    },
                    get _totalDuration() {
                      return this._effect._totalDuration;
                    },
                    get playState() {
                      return this._idle
                        ? "idle"
                        : (null == this._startTime &&
                            !this._paused &&
                            0 != this.playbackRate) ||
                          this._currentTimePending
                        ? "pending"
                        : this._paused
                        ? "paused"
                        : this._isFinished
                        ? "finished"
                        : "running";
                    },
                    _rewind: function () {
                      if (this._playbackRate >= 0) this._currentTime = 0;
                      else {
                        if (!(this._totalDuration < 1 / 0))
                          throw new DOMException(
                            "Unable to rewind negative playback rate animation with infinite duration",
                            "InvalidStateError"
                          );
                        this._currentTime = this._totalDuration;
                      }
                    },
                    play: function () {
                      (this._paused = !1),
                        (this._isFinished || this._idle) &&
                          (this._rewind(), (this._startTime = null)),
                        (this._finishedFlag = !1),
                        (this._idle = !1),
                        this._ensureAlive(),
                        b.applyDirtiedAnimation(this);
                    },
                    pause: function () {
                      this._isFinished || this._paused || this._idle
                        ? this._idle && (this._rewind(), (this._idle = !1))
                        : (this._currentTimePending = !0),
                        (this._startTime = null),
                        (this._paused = !0);
                    },
                    finish: function () {
                      this._idle ||
                        ((this.currentTime =
                          this._playbackRate > 0 ? this._totalDuration : 0),
                        (this._startTime =
                          this._totalDuration - this.currentTime),
                        (this._currentTimePending = !1),
                        b.applyDirtiedAnimation(this));
                    },
                    cancel: function () {
                      this._inEffect &&
                        ((this._inEffect = !1),
                        (this._idle = !0),
                        (this._paused = !1),
                        (this._finishedFlag = !0),
                        (this._currentTime = 0),
                        (this._startTime = null),
                        this._effect._update(null),
                        b.applyDirtiedAnimation(this));
                    },
                    reverse: function () {
                      (this.playbackRate *= -1), this.play();
                    },
                    addEventListener: function (a, b) {
                      "function" == typeof b &&
                        "finish" == a &&
                        this._finishHandlers.push(b);
                    },
                    removeEventListener: function (a, b) {
                      if ("finish" == a) {
                        var c = this._finishHandlers.indexOf(b);
                        c >= 0 && this._finishHandlers.splice(c, 1);
                      }
                    },
                    _fireEvents: function (a) {
                      if (this._isFinished) {
                        if (!this._finishedFlag) {
                          var b = new d(this, this._currentTime, a),
                            c = this._finishHandlers.concat(
                              this.onfinish ? [this.onfinish] : []
                            );
                          setTimeout(function () {
                            c.forEach(function (a) {
                              a.call(b.target, b);
                            });
                          }, 0),
                            (this._finishedFlag = !0);
                        }
                      } else this._finishedFlag = !1;
                    },
                    _tick: function (a, b) {
                      this._idle ||
                        this._paused ||
                        (null == this._startTime
                          ? b &&
                            (this.startTime =
                              a - this._currentTime / this.playbackRate)
                          : this._isFinished ||
                            this._tickCurrentTime(
                              (a - this._startTime) * this.playbackRate
                            )),
                        b &&
                          ((this._currentTimePending = !1),
                          this._fireEvents(a));
                    },
                    get _needsTick() {
                      return (
                        this.playState in { pending: 1, running: 1 } ||
                        !this._finishedFlag
                      );
                    },
                    _targetAnimations: function () {
                      var a = this._effect._target;
                      return (
                        a._activeAnimations || (a._activeAnimations = []),
                        a._activeAnimations
                      );
                    },
                    _markTarget: function () {
                      var a = this._targetAnimations();
                      -1 === a.indexOf(this) && a.push(this);
                    },
                    _unmarkTarget: function () {
                      var a = this._targetAnimations(),
                        b = a.indexOf(this);
                      -1 !== b && a.splice(b, 1);
                    },
                  });
              })(a, b),
              (function (a, b, c) {
                function d(a) {
                  var b = j;
                  (j = []),
                    a < q.currentTime && (a = q.currentTime),
                    q._animations.sort(e),
                    (q._animations = h(a, !0, q._animations)[0]),
                    b.forEach(function (b) {
                      b[1](a);
                    }),
                    g(),
                    (l = void 0);
                }
                function e(a, b) {
                  return a._sequenceNumber - b._sequenceNumber;
                }
                function f() {
                  (this._animations = []),
                    (this.currentTime =
                      window.performance && performance.now
                        ? performance.now()
                        : 0);
                }
                function g() {
                  o.forEach(function (a) {
                    a();
                  }),
                    (o.length = 0);
                }
                function h(a, c, d) {
                  (p = !0), (n = !1), (b.timeline.currentTime = a), (m = !1);
                  var e = [],
                    f = [],
                    g = [],
                    h = [];
                  return (
                    d.forEach(function (b) {
                      b._tick(a, c),
                        b._inEffect
                          ? (f.push(b._effect), b._markTarget())
                          : (e.push(b._effect), b._unmarkTarget()),
                        b._needsTick && (m = !0);
                      var d = b._inEffect || b._needsTick;
                      (b._inTimeline = d), d ? g.push(b) : h.push(b);
                    }),
                    o.push.apply(o, e),
                    o.push.apply(o, f),
                    m && requestAnimationFrame(function () {}),
                    (p = !1),
                    [g, h]
                  );
                }
                var i = window.requestAnimationFrame,
                  j = [],
                  k = 0;
                (window.requestAnimationFrame = function (a) {
                  var b = k++;
                  return 0 == j.length && i(d), j.push([b, a]), b;
                }),
                  (window.cancelAnimationFrame = function (a) {
                    j.forEach(function (b) {
                      b[0] == a && (b[1] = function () {});
                    });
                  }),
                  (f.prototype = {
                    _play: function (c) {
                      c._timing = a.normalizeTimingInput(c.timing);
                      var d = new b.Animation(c);
                      return (
                        (d._idle = !1),
                        (d._timeline = this),
                        this._animations.push(d),
                        b.restart(),
                        b.applyDirtiedAnimation(d),
                        d
                      );
                    },
                  });
                var l = void 0,
                  m = !1,
                  n = !1;
                (b.restart = function () {
                  return (
                    m ||
                      ((m = !0),
                      requestAnimationFrame(function () {}),
                      (n = !0)),
                    n
                  );
                }),
                  (b.applyDirtiedAnimation = function (a) {
                    if (!p) {
                      a._markTarget();
                      var c = a._targetAnimations();
                      c.sort(e),
                        h(b.timeline.currentTime, !1, c.slice())[1].forEach(
                          function (a) {
                            var b = q._animations.indexOf(a);
                            -1 !== b && q._animations.splice(b, 1);
                          }
                        ),
                        g();
                    }
                  });
                var o = [],
                  p = !1,
                  q = new f();
                b.timeline = q;
              })(a, b),
              (function (a, b) {
                function c(a, b) {
                  for (var c = 0, d = 0; d < a.length; d++) c += a[d] * b[d];
                  return c;
                }
                function d(a, b) {
                  return [
                    a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3],
                    a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3],
                    a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3],
                    a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3],
                    a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7],
                    a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7],
                    a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7],
                    a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7],
                    a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11],
                    a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11],
                    a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11],
                    a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11],
                    a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15],
                    a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15],
                    a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15],
                    a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15],
                  ];
                }
                function e(a) {
                  var b = a.rad || 0;
                  return (
                    ((a.deg || 0) / 360 + (a.grad || 0) / 400 + (a.turn || 0)) *
                      (2 * Math.PI) +
                    b
                  );
                }
                function f(a) {
                  switch (a.t) {
                    case "rotatex":
                      var b = e(a.d[0]);
                      return [
                        1,
                        0,
                        0,
                        0,
                        0,
                        Math.cos(b),
                        Math.sin(b),
                        0,
                        0,
                        -Math.sin(b),
                        Math.cos(b),
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "rotatey":
                      var b = e(a.d[0]);
                      return [
                        Math.cos(b),
                        0,
                        -Math.sin(b),
                        0,
                        0,
                        1,
                        0,
                        0,
                        Math.sin(b),
                        0,
                        Math.cos(b),
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "rotate":
                    case "rotatez":
                      var b = e(a.d[0]);
                      return [
                        Math.cos(b),
                        Math.sin(b),
                        0,
                        0,
                        -Math.sin(b),
                        Math.cos(b),
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "rotate3d":
                      var c = a.d[0],
                        d = a.d[1],
                        f = a.d[2],
                        b = e(a.d[3]),
                        g = c * c + d * d + f * f;
                      if (0 === g) (c = 1), (d = 0), (f = 0);
                      else if (1 !== g) {
                        var h = Math.sqrt(g);
                        (c /= h), (d /= h), (f /= h);
                      }
                      var i = Math.sin(b / 2),
                        j = i * Math.cos(b / 2),
                        k = i * i;
                      return [
                        1 - 2 * (d * d + f * f) * k,
                        2 * (c * d * k + f * j),
                        2 * (c * f * k - d * j),
                        0,
                        2 * (c * d * k - f * j),
                        1 - 2 * (c * c + f * f) * k,
                        2 * (d * f * k + c * j),
                        0,
                        2 * (c * f * k + d * j),
                        2 * (d * f * k - c * j),
                        1 - 2 * (c * c + d * d) * k,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "scale":
                      return [
                        a.d[0],
                        0,
                        0,
                        0,
                        0,
                        a.d[1],
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "scalex":
                      return [
                        a.d[0],
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "scaley":
                      return [
                        1,
                        0,
                        0,
                        0,
                        0,
                        a.d[0],
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "scalez":
                      return [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        a.d[0],
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "scale3d":
                      return [
                        a.d[0],
                        0,
                        0,
                        0,
                        0,
                        a.d[1],
                        0,
                        0,
                        0,
                        0,
                        a.d[2],
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "skew":
                      var l = e(a.d[0]),
                        m = e(a.d[1]);
                      return [
                        1,
                        Math.tan(m),
                        0,
                        0,
                        Math.tan(l),
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "skewx":
                      var b = e(a.d[0]);
                      return [
                        1,
                        0,
                        0,
                        0,
                        Math.tan(b),
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "skewy":
                      var b = e(a.d[0]);
                      return [
                        1,
                        Math.tan(b),
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "translate":
                      var c = a.d[0].px || 0,
                        d = a.d[1].px || 0;
                      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c, d, 0, 1];
                    case "translatex":
                      var c = a.d[0].px || 0;
                      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c, 0, 0, 1];
                    case "translatey":
                      var d = a.d[0].px || 0;
                      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, d, 0, 1];
                    case "translatez":
                      var f = a.d[0].px || 0;
                      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, f, 1];
                    case "translate3d":
                      var c = a.d[0].px || 0,
                        d = a.d[1].px || 0,
                        f = a.d[2].px || 0;
                      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, c, d, f, 1];
                    case "perspective":
                      return [
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0,
                        1,
                        a.d[0].px ? -1 / a.d[0].px : 0,
                        0,
                        0,
                        0,
                        1,
                      ];
                    case "matrix":
                      return [
                        a.d[0],
                        a.d[1],
                        0,
                        0,
                        a.d[2],
                        a.d[3],
                        0,
                        0,
                        0,
                        0,
                        1,
                        0,
                        a.d[4],
                        a.d[5],
                        0,
                        1,
                      ];
                    case "matrix3d":
                      return a.d;
                  }
                }
                function g(a) {
                  return 0 === a.length
                    ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
                    : a.map(f).reduce(d);
                }
                function h(a) {
                  return [i(g(a))];
                }
                var i = (function () {
                  function a(a) {
                    return (
                      a[0][0] * a[1][1] * a[2][2] +
                      a[1][0] * a[2][1] * a[0][2] +
                      a[2][0] * a[0][1] * a[1][2] -
                      a[0][2] * a[1][1] * a[2][0] -
                      a[1][2] * a[2][1] * a[0][0] -
                      a[2][2] * a[0][1] * a[1][0]
                    );
                  }
                  function b(b) {
                    for (
                      var c = 1 / a(b),
                        d = b[0][0],
                        e = b[0][1],
                        f = b[0][2],
                        g = b[1][0],
                        h = b[1][1],
                        i = b[1][2],
                        j = b[2][0],
                        k = b[2][1],
                        l = b[2][2],
                        m = [
                          [
                            (h * l - i * k) * c,
                            (f * k - e * l) * c,
                            (e * i - f * h) * c,
                            0,
                          ],
                          [
                            (i * j - g * l) * c,
                            (d * l - f * j) * c,
                            (f * g - d * i) * c,
                            0,
                          ],
                          [
                            (g * k - h * j) * c,
                            (j * e - d * k) * c,
                            (d * h - e * g) * c,
                            0,
                          ],
                        ],
                        n = [],
                        o = 0;
                      o < 3;
                      o++
                    ) {
                      for (var p = 0, q = 0; q < 3; q++) p += b[3][q] * m[q][o];
                      n.push(p);
                    }
                    return n.push(1), m.push(n), m;
                  }
                  function d(a) {
                    return [
                      [a[0][0], a[1][0], a[2][0], a[3][0]],
                      [a[0][1], a[1][1], a[2][1], a[3][1]],
                      [a[0][2], a[1][2], a[2][2], a[3][2]],
                      [a[0][3], a[1][3], a[2][3], a[3][3]],
                    ];
                  }
                  function e(a, b) {
                    for (var c = [], d = 0; d < 4; d++) {
                      for (var e = 0, f = 0; f < 4; f++) e += a[f] * b[f][d];
                      c.push(e);
                    }
                    return c;
                  }
                  function f(a) {
                    var b = g(a);
                    return [a[0] / b, a[1] / b, a[2] / b];
                  }
                  function g(a) {
                    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
                  }
                  function h(a, b, c, d) {
                    return [
                      c * a[0] + d * b[0],
                      c * a[1] + d * b[1],
                      c * a[2] + d * b[2],
                    ];
                  }
                  function i(a, b) {
                    return [
                      a[1] * b[2] - a[2] * b[1],
                      a[2] * b[0] - a[0] * b[2],
                      a[0] * b[1] - a[1] * b[0],
                    ];
                  }
                  function j(j) {
                    var k = [
                      j.slice(0, 4),
                      j.slice(4, 8),
                      j.slice(8, 12),
                      j.slice(12, 16),
                    ];
                    if (1 !== k[3][3]) return null;
                    for (var l = [], m = 0; m < 4; m++) l.push(k[m].slice());
                    for (var m = 0; m < 3; m++) l[m][3] = 0;
                    if (0 === a(l)) return null;
                    var n,
                      o = [];
                    k[0][3] || k[1][3] || k[2][3]
                      ? (o.push(k[0][3]),
                        o.push(k[1][3]),
                        o.push(k[2][3]),
                        o.push(k[3][3]),
                        (n = e(o, d(b(l)))))
                      : (n = [0, 0, 0, 1]);
                    var p = k[3].slice(0, 3),
                      q = [];
                    q.push(k[0].slice(0, 3));
                    var r = [];
                    r.push(g(q[0])), (q[0] = f(q[0]));
                    var s = [];
                    q.push(k[1].slice(0, 3)),
                      s.push(c(q[0], q[1])),
                      (q[1] = h(q[1], q[0], 1, -s[0])),
                      r.push(g(q[1])),
                      (q[1] = f(q[1])),
                      (s[0] /= r[1]),
                      q.push(k[2].slice(0, 3)),
                      s.push(c(q[0], q[2])),
                      (q[2] = h(q[2], q[0], 1, -s[1])),
                      s.push(c(q[1], q[2])),
                      (q[2] = h(q[2], q[1], 1, -s[2])),
                      r.push(g(q[2])),
                      (q[2] = f(q[2])),
                      (s[1] /= r[2]),
                      (s[2] /= r[2]);
                    var t = i(q[1], q[2]);
                    if (c(q[0], t) < 0)
                      for (var m = 0; m < 3; m++)
                        (r[m] *= -1),
                          (q[m][0] *= -1),
                          (q[m][1] *= -1),
                          (q[m][2] *= -1);
                    var u,
                      v,
                      w = q[0][0] + q[1][1] + q[2][2] + 1;
                    return (
                      w > 1e-4
                        ? ((u = 0.5 / Math.sqrt(w)),
                          (v = [
                            (q[2][1] - q[1][2]) * u,
                            (q[0][2] - q[2][0]) * u,
                            (q[1][0] - q[0][1]) * u,
                            0.25 / u,
                          ]))
                        : q[0][0] > q[1][1] && q[0][0] > q[2][2]
                        ? ((u = 2 * Math.sqrt(1 + q[0][0] - q[1][1] - q[2][2])),
                          (v = [
                            0.25 * u,
                            (q[0][1] + q[1][0]) / u,
                            (q[0][2] + q[2][0]) / u,
                            (q[2][1] - q[1][2]) / u,
                          ]))
                        : q[1][1] > q[2][2]
                        ? ((u = 2 * Math.sqrt(1 + q[1][1] - q[0][0] - q[2][2])),
                          (v = [
                            (q[0][1] + q[1][0]) / u,
                            0.25 * u,
                            (q[1][2] + q[2][1]) / u,
                            (q[0][2] - q[2][0]) / u,
                          ]))
                        : ((u = 2 * Math.sqrt(1 + q[2][2] - q[0][0] - q[1][1])),
                          (v = [
                            (q[0][2] + q[2][0]) / u,
                            (q[1][2] + q[2][1]) / u,
                            0.25 * u,
                            (q[1][0] - q[0][1]) / u,
                          ])),
                      [p, r, s, v, n]
                    );
                  }
                  return j;
                })();
                (a.dot = c),
                  (a.makeMatrixDecomposition = h),
                  (a.transformListToMatrix = g);
              })(b),
              (function (a) {
                function b(a, b) {
                  var c = a.exec(b);
                  if (c)
                    return (
                      (c = a.ignoreCase ? c[0].toLowerCase() : c[0]),
                      [c, b.substr(c.length)]
                    );
                }
                function c(a, b) {
                  b = b.replace(/^\s*/, "");
                  var c = a(b);
                  if (c) return [c[0], c[1].replace(/^\s*/, "")];
                }
                function d(a, d, e) {
                  a = c.bind(null, a);
                  for (var f = []; ; ) {
                    var g = a(e);
                    if (!g) return [f, e];
                    if (
                      (f.push(g[0]), (e = g[1]), !(g = b(d, e)) || "" == g[1])
                    )
                      return [f, e];
                    e = g[1];
                  }
                }
                function e(a, b) {
                  for (
                    var c = 0, d = 0;
                    d < b.length && (!/\s|,/.test(b[d]) || 0 != c);
                    d++
                  )
                    if ("(" == b[d]) c++;
                    else if (")" == b[d] && (c--, 0 == c && d++, c <= 0)) break;
                  var e = a(b.substr(0, d));
                  return void 0 == e ? void 0 : [e, b.substr(d)];
                }
                function f(a, b) {
                  for (var c = a, d = b; c && d; ) c > d ? (c %= d) : (d %= c);
                  return (c = (a * b) / (c + d));
                }
                function g(a) {
                  return function (b) {
                    var c = a(b);
                    return c && (c[0] = void 0), c;
                  };
                }
                function h(a, b) {
                  return function (c) {
                    return a(c) || [b, c];
                  };
                }
                function i(b, c) {
                  for (var d = [], e = 0; e < b.length; e++) {
                    var f = a.consumeTrimmed(b[e], c);
                    if (!f || "" == f[0]) return;
                    void 0 !== f[0] && d.push(f[0]), (c = f[1]);
                  }
                  if ("" == c) return d;
                }
                function j(a, b, c, d, e) {
                  for (
                    var g = [],
                      h = [],
                      i = [],
                      j = f(d.length, e.length),
                      k = 0;
                    k < j;
                    k++
                  ) {
                    var l = b(d[k % d.length], e[k % e.length]);
                    if (!l) return;
                    g.push(l[0]), h.push(l[1]), i.push(l[2]);
                  }
                  return [
                    g,
                    h,
                    function (b) {
                      var d = b
                        .map(function (a, b) {
                          return i[b](a);
                        })
                        .join(c);
                      return a ? a(d) : d;
                    },
                  ];
                }
                function k(a, b, c) {
                  for (
                    var d = [], e = [], f = [], g = 0, h = 0;
                    h < c.length;
                    h++
                  )
                    if ("function" == typeof c[h]) {
                      var i = c[h](a[g], b[g++]);
                      d.push(i[0]), e.push(i[1]), f.push(i[2]);
                    } else
                      !(function (a) {
                        d.push(!1),
                          e.push(!1),
                          f.push(function () {
                            return c[a];
                          });
                      })(h);
                  return [
                    d,
                    e,
                    function (a) {
                      for (var b = "", c = 0; c < a.length; c++)
                        b += f[c](a[c]);
                      return b;
                    },
                  ];
                }
                (a.consumeToken = b),
                  (a.consumeTrimmed = c),
                  (a.consumeRepeated = d),
                  (a.consumeParenthesised = e),
                  (a.ignore = g),
                  (a.optional = h),
                  (a.consumeList = i),
                  (a.mergeNestedRepeated = j.bind(null, null)),
                  (a.mergeWrappedNestedRepeated = j),
                  (a.mergeList = k);
              })(b),
              (function (a) {
                function b(b) {
                  function c(b) {
                    var c = a.consumeToken(/^inset/i, b);
                    return c
                      ? ((d.inset = !0), c)
                      : (c = a.consumeLengthOrPercent(b))
                      ? (d.lengths.push(c[0]), c)
                      : ((c = a.consumeColor(b)),
                        c ? ((d.color = c[0]), c) : void 0);
                  }
                  var d = { inset: !1, lengths: [], color: null },
                    e = a.consumeRepeated(c, /^/, b);
                  if (e && e[0].length) return [d, e[1]];
                }
                function c(c) {
                  var d = a.consumeRepeated(b, /^,/, c);
                  if (d && "" == d[1]) return d[0];
                }
                function d(b, c) {
                  for (
                    ;
                    b.lengths.length <
                    Math.max(b.lengths.length, c.lengths.length);

                  )
                    b.lengths.push({ px: 0 });
                  for (
                    ;
                    c.lengths.length <
                    Math.max(b.lengths.length, c.lengths.length);

                  )
                    c.lengths.push({ px: 0 });
                  if (b.inset == c.inset && !!b.color == !!c.color) {
                    for (
                      var d, e = [], f = [[], 0], g = [[], 0], h = 0;
                      h < b.lengths.length;
                      h++
                    ) {
                      var i = a.mergeDimensions(
                        b.lengths[h],
                        c.lengths[h],
                        2 == h
                      );
                      f[0].push(i[0]), g[0].push(i[1]), e.push(i[2]);
                    }
                    if (b.color && c.color) {
                      var j = a.mergeColors(b.color, c.color);
                      (f[1] = j[0]), (g[1] = j[1]), (d = j[2]);
                    }
                    return [
                      f,
                      g,
                      function (a) {
                        for (
                          var c = b.inset ? "inset " : " ", f = 0;
                          f < e.length;
                          f++
                        )
                          c += e[f](a[0][f]) + " ";
                        return d && (c += d(a[1])), c;
                      },
                    ];
                  }
                }
                function e(b, c, d, e) {
                  function f(a) {
                    return {
                      inset: a,
                      color: [0, 0, 0, 0],
                      lengths: [{ px: 0 }, { px: 0 }, { px: 0 }, { px: 0 }],
                    };
                  }
                  for (
                    var g = [], h = [], i = 0;
                    i < d.length || i < e.length;
                    i++
                  ) {
                    var j = d[i] || f(e[i].inset),
                      k = e[i] || f(d[i].inset);
                    g.push(j), h.push(k);
                  }
                  return a.mergeNestedRepeated(b, c, g, h);
                }
                var f = e.bind(null, d, ", ");
                a.addPropertiesHandler(c, f, ["box-shadow", "text-shadow"]);
              })(b),
              (function (a, b) {
                function c(a) {
                  return a.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
                }
                function d(a, b, c) {
                  return Math.min(b, Math.max(a, c));
                }
                function e(a) {
                  if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(a)) return Number(a);
                }
                function f(a, b) {
                  return [a, b, c];
                }
                function g(a, b) {
                  if (0 != a) return i(0, 1 / 0)(a, b);
                }
                function h(a, b) {
                  return [
                    a,
                    b,
                    function (a) {
                      return Math.round(d(1, 1 / 0, a));
                    },
                  ];
                }
                function i(a, b) {
                  return function (e, f) {
                    return [
                      e,
                      f,
                      function (e) {
                        return c(d(a, b, e));
                      },
                    ];
                  };
                }
                function j(a) {
                  var b = a.trim().split(/\s*[\s,]\s*/);
                  if (0 !== b.length) {
                    for (var c = [], d = 0; d < b.length; d++) {
                      var f = e(b[d]);
                      if (void 0 === f) return;
                      c.push(f);
                    }
                    return c;
                  }
                }
                function k(a, b) {
                  if (a.length == b.length)
                    return [
                      a,
                      b,
                      function (a) {
                        return a.map(c).join(" ");
                      },
                    ];
                }
                function l(a, b) {
                  return [a, b, Math.round];
                }
                (a.clamp = d),
                  a.addPropertiesHandler(j, k, ["stroke-dasharray"]),
                  a.addPropertiesHandler(e, i(0, 1 / 0), [
                    "border-image-width",
                    "line-height",
                  ]),
                  a.addPropertiesHandler(e, i(0, 1), [
                    "opacity",
                    "shape-image-threshold",
                  ]),
                  a.addPropertiesHandler(e, g, ["flex-grow", "flex-shrink"]),
                  a.addPropertiesHandler(e, h, ["orphans", "widows"]),
                  a.addPropertiesHandler(e, l, ["z-index"]),
                  (a.parseNumber = e),
                  (a.parseNumberList = j),
                  (a.mergeNumbers = f),
                  (a.numberToString = c);
              })(b),
              (function (a, b) {
                function c(a, b) {
                  if ("visible" == a || "visible" == b)
                    return [
                      0,
                      1,
                      function (c) {
                        return c <= 0 ? a : c >= 1 ? b : "visible";
                      },
                    ];
                }
                a.addPropertiesHandler(String, c, ["visibility"]);
              })(b),
              (function (a, b) {
                function c(a) {
                  (a = a.trim()), (f.fillStyle = "#000"), (f.fillStyle = a);
                  var b = f.fillStyle;
                  if (
                    ((f.fillStyle = "#fff"),
                    (f.fillStyle = a),
                    b == f.fillStyle)
                  ) {
                    f.fillRect(0, 0, 1, 1);
                    var c = f.getImageData(0, 0, 1, 1).data;
                    f.clearRect(0, 0, 1, 1);
                    var d = c[3] / 255;
                    return [c[0] * d, c[1] * d, c[2] * d, d];
                  }
                }
                function d(b, c) {
                  return [
                    b,
                    c,
                    function (b) {
                      function c(a) {
                        return Math.max(0, Math.min(255, a));
                      }
                      if (b[3])
                        for (var d = 0; d < 3; d++)
                          b[d] = Math.round(c(b[d] / b[3]));
                      return (
                        (b[3] = a.numberToString(a.clamp(0, 1, b[3]))),
                        "rgba(" + b.join(",") + ")"
                      );
                    },
                  ];
                }
                var e = document.createElementNS(
                  "http://www.w3.org/1999/xhtml",
                  "canvas"
                );
                e.width = e.height = 1;
                var f = e.getContext("2d");
                a.addPropertiesHandler(c, d, [
                  "background-color",
                  "border-bottom-color",
                  "border-left-color",
                  "border-right-color",
                  "border-top-color",
                  "color",
                  "fill",
                  "flood-color",
                  "lighting-color",
                  "outline-color",
                  "stop-color",
                  "stroke",
                  "text-decoration-color",
                ]),
                  (a.consumeColor = a.consumeParenthesised.bind(null, c)),
                  (a.mergeColors = d);
              })(b),
              (function (a, b) {
                function c(a) {
                  function b() {
                    var b = h.exec(a);
                    g = b ? b[0] : void 0;
                  }
                  function c() {
                    var a = Number(g);
                    return b(), a;
                  }
                  function d() {
                    if ("(" !== g) return c();
                    b();
                    var a = f();
                    return ")" !== g ? NaN : (b(), a);
                  }
                  function e() {
                    for (var a = d(); "*" === g || "/" === g; ) {
                      var c = g;
                      b();
                      var e = d();
                      "*" === c ? (a *= e) : (a /= e);
                    }
                    return a;
                  }
                  function f() {
                    for (var a = e(); "+" === g || "-" === g; ) {
                      var c = g;
                      b();
                      var d = e();
                      "+" === c ? (a += d) : (a -= d);
                    }
                    return a;
                  }
                  var g,
                    h = /([\+\-\w\.]+|[\(\)\*\/])/g;
                  return b(), f();
                }
                function d(a, b) {
                  if (
                    "0" == (b = b.trim().toLowerCase()) &&
                    "px".search(a) >= 0
                  )
                    return { px: 0 };
                  if (/^[^(]*$|^calc/.test(b)) {
                    b = b.replace(/calc\(/g, "(");
                    var d = {};
                    b = b.replace(a, function (a) {
                      return (d[a] = null), "U" + a;
                    });
                    for (
                      var e = "U(" + a.source + ")",
                        f = b
                          .replace(/[-+]?(\d*\.)?\d+([Ee][-+]?\d+)?/g, "N")
                          .replace(new RegExp("N" + e, "g"), "D")
                          .replace(/\s[+-]\s/g, "O")
                          .replace(/\s/g, ""),
                        g = [
                          /N\*(D)/g,
                          /(N|D)[*\/]N/g,
                          /(N|D)O\1/g,
                          /\((N|D)\)/g,
                        ],
                        h = 0;
                      h < g.length;

                    )
                      g[h].test(f)
                        ? ((f = f.replace(g[h], "$1")), (h = 0))
                        : h++;
                    if ("D" == f) {
                      for (var i in d) {
                        var j = c(
                          b
                            .replace(new RegExp("U" + i, "g"), "")
                            .replace(new RegExp(e, "g"), "*0")
                        );
                        if (!isFinite(j)) return;
                        d[i] = j;
                      }
                      return d;
                    }
                  }
                }
                function e(a, b) {
                  return f(a, b, !0);
                }
                function f(b, c, d) {
                  var e,
                    f = [];
                  for (e in b) f.push(e);
                  for (e in c) f.indexOf(e) < 0 && f.push(e);
                  return (
                    (b = f.map(function (a) {
                      return b[a] || 0;
                    })),
                    (c = f.map(function (a) {
                      return c[a] || 0;
                    })),
                    [
                      b,
                      c,
                      function (b) {
                        var c = b
                          .map(function (c, e) {
                            return (
                              1 == b.length && d && (c = Math.max(c, 0)),
                              a.numberToString(c) + f[e]
                            );
                          })
                          .join(" + ");
                        return b.length > 1 ? "calc(" + c + ")" : c;
                      },
                    ]
                  );
                }
                var g = "px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc",
                  h = d.bind(null, new RegExp(g, "g")),
                  i = d.bind(null, new RegExp(g + "|%", "g")),
                  j = d.bind(null, /deg|rad|grad|turn/g);
                (a.parseLength = h),
                  (a.parseLengthOrPercent = i),
                  (a.consumeLengthOrPercent = a.consumeParenthesised.bind(
                    null,
                    i
                  )),
                  (a.parseAngle = j),
                  (a.mergeDimensions = f);
                var k = a.consumeParenthesised.bind(null, h),
                  l = a.consumeRepeated.bind(void 0, k, /^/),
                  m = a.consumeRepeated.bind(void 0, l, /^,/);
                a.consumeSizePairList = m;
                var n = function (a) {
                    var b = m(a);
                    if (b && "" == b[1]) return b[0];
                  },
                  o = a.mergeNestedRepeated.bind(void 0, e, " "),
                  p = a.mergeNestedRepeated.bind(void 0, o, ",");
                (a.mergeNonNegativeSizePair = o),
                  a.addPropertiesHandler(n, p, ["background-size"]),
                  a.addPropertiesHandler(i, e, [
                    "border-bottom-width",
                    "border-image-width",
                    "border-left-width",
                    "border-right-width",
                    "border-top-width",
                    "flex-basis",
                    "font-size",
                    "height",
                    "line-height",
                    "max-height",
                    "max-width",
                    "outline-width",
                    "width",
                  ]),
                  a.addPropertiesHandler(i, f, [
                    "border-bottom-left-radius",
                    "border-bottom-right-radius",
                    "border-top-left-radius",
                    "border-top-right-radius",
                    "bottom",
                    "left",
                    "letter-spacing",
                    "margin-bottom",
                    "margin-left",
                    "margin-right",
                    "margin-top",
                    "min-height",
                    "min-width",
                    "outline-offset",
                    "padding-bottom",
                    "padding-left",
                    "padding-right",
                    "padding-top",
                    "perspective",
                    "right",
                    "shape-margin",
                    "stroke-dashoffset",
                    "text-indent",
                    "top",
                    "vertical-align",
                    "word-spacing",
                  ]);
              })(b),
              (function (a, b) {
                function c(b) {
                  return (
                    a.consumeLengthOrPercent(b) || a.consumeToken(/^auto/, b)
                  );
                }
                function d(b) {
                  var d = a.consumeList(
                    [
                      a.ignore(a.consumeToken.bind(null, /^rect/)),
                      a.ignore(a.consumeToken.bind(null, /^\(/)),
                      a.consumeRepeated.bind(null, c, /^,/),
                      a.ignore(a.consumeToken.bind(null, /^\)/)),
                    ],
                    b
                  );
                  if (d && 4 == d[0].length) return d[0];
                }
                function e(b, c) {
                  return "auto" == b || "auto" == c
                    ? [
                        !0,
                        !1,
                        function (d) {
                          var e = d ? b : c;
                          if ("auto" == e) return "auto";
                          var f = a.mergeDimensions(e, e);
                          return f[2](f[0]);
                        },
                      ]
                    : a.mergeDimensions(b, c);
                }
                function f(a) {
                  return "rect(" + a + ")";
                }
                var g = a.mergeWrappedNestedRepeated.bind(null, f, e, ", ");
                (a.parseBox = d),
                  (a.mergeBoxes = g),
                  a.addPropertiesHandler(d, g, ["clip"]);
              })(b),
              (function (a, b) {
                function c(a) {
                  return function (b) {
                    var c = 0;
                    return a.map(function (a) {
                      return a === k ? b[c++] : a;
                    });
                  };
                }
                function d(a) {
                  return a;
                }
                function e(b) {
                  if ("none" == (b = b.toLowerCase().trim())) return [];
                  for (
                    var c, d = /\s*(\w+)\(([^)]*)\)/g, e = [], f = 0;
                    (c = d.exec(b));

                  ) {
                    if (c.index != f) return;
                    f = c.index + c[0].length;
                    var g = c[1],
                      h = n[g];
                    if (!h) return;
                    var i = c[2].split(","),
                      j = h[0];
                    if (j.length < i.length) return;
                    for (var k = [], o = 0; o < j.length; o++) {
                      var p,
                        q = i[o],
                        r = j[o];
                      if (
                        void 0 ===
                        (p = q
                          ? {
                              A: function (b) {
                                return "0" == b.trim() ? m : a.parseAngle(b);
                              },
                              N: a.parseNumber,
                              T: a.parseLengthOrPercent,
                              L: a.parseLength,
                            }[r.toUpperCase()](q)
                          : { a: m, n: k[0], t: l }[r])
                      )
                        return;
                      k.push(p);
                    }
                    if ((e.push({ t: g, d: k }), d.lastIndex == b.length))
                      return e;
                  }
                }
                function f(a) {
                  return a.toFixed(6).replace(".000000", "");
                }
                function g(b, c) {
                  if (b.decompositionPair !== c) {
                    b.decompositionPair = c;
                    var d = a.makeMatrixDecomposition(b);
                  }
                  if (c.decompositionPair !== b) {
                    c.decompositionPair = b;
                    var e = a.makeMatrixDecomposition(c);
                  }
                  return null == d[0] || null == e[0]
                    ? [
                        [!1],
                        [!0],
                        function (a) {
                          return a ? c[0].d : b[0].d;
                        },
                      ]
                    : (d[0].push(0),
                      e[0].push(1),
                      [
                        d,
                        e,
                        function (b) {
                          var c = a.quat(d[0][3], e[0][3], b[5]);
                          return a
                            .composeMatrix(b[0], b[1], b[2], c, b[4])
                            .map(f)
                            .join(",");
                        },
                      ]);
                }
                function h(a) {
                  return a.replace(/[xy]/, "");
                }
                function i(a) {
                  return a.replace(/(x|y|z|3d)?$/, "3d");
                }
                function j(b, c) {
                  var d = a.makeMatrixDecomposition && !0,
                    e = !1;
                  if (!b.length || !c.length) {
                    b.length || ((e = !0), (b = c), (c = []));
                    for (var f = 0; f < b.length; f++) {
                      var j = b[f].t,
                        k = b[f].d,
                        l = "scale" == j.substr(0, 5) ? 1 : 0;
                      c.push({
                        t: j,
                        d: k.map(function (a) {
                          if ("number" == typeof a) return l;
                          var b = {};
                          for (var c in a) b[c] = l;
                          return b;
                        }),
                      });
                    }
                  }
                  var m = function (a, b) {
                      return (
                        ("perspective" == a && "perspective" == b) ||
                        (("matrix" == a || "matrix3d" == a) &&
                          ("matrix" == b || "matrix3d" == b))
                      );
                    },
                    o = [],
                    p = [],
                    q = [];
                  if (b.length != c.length) {
                    if (!d) return;
                    var r = g(b, c);
                    (o = [r[0]]), (p = [r[1]]), (q = [["matrix", [r[2]]]]);
                  } else
                    for (var f = 0; f < b.length; f++) {
                      var j,
                        s = b[f].t,
                        t = c[f].t,
                        u = b[f].d,
                        v = c[f].d,
                        w = n[s],
                        x = n[t];
                      if (m(s, t)) {
                        if (!d) return;
                        var r = g([b[f]], [c[f]]);
                        o.push(r[0]), p.push(r[1]), q.push(["matrix", [r[2]]]);
                      } else {
                        if (s == t) j = s;
                        else if (w[2] && x[2] && h(s) == h(t))
                          (j = h(s)), (u = w[2](u)), (v = x[2](v));
                        else {
                          if (!w[1] || !x[1] || i(s) != i(t)) {
                            if (!d) return;
                            var r = g(b, c);
                            (o = [r[0]]),
                              (p = [r[1]]),
                              (q = [["matrix", [r[2]]]]);
                            break;
                          }
                          (j = i(s)), (u = w[1](u)), (v = x[1](v));
                        }
                        for (
                          var y = [], z = [], A = [], B = 0;
                          B < u.length;
                          B++
                        ) {
                          var C =
                              "number" == typeof u[B]
                                ? a.mergeNumbers
                                : a.mergeDimensions,
                            r = C(u[B], v[B]);
                          (y[B] = r[0]), (z[B] = r[1]), A.push(r[2]);
                        }
                        o.push(y), p.push(z), q.push([j, A]);
                      }
                    }
                  if (e) {
                    var D = o;
                    (o = p), (p = D);
                  }
                  return [
                    o,
                    p,
                    function (a) {
                      return a
                        .map(function (a, b) {
                          var c = a
                            .map(function (a, c) {
                              return q[b][1][c](a);
                            })
                            .join(",");
                          return (
                            "matrix" == q[b][0] &&
                              16 == c.split(",").length &&
                              (q[b][0] = "matrix3d"),
                            q[b][0] + "(" + c + ")"
                          );
                        })
                        .join(" ");
                    },
                  ];
                }
                var k = null,
                  l = { px: 0 },
                  m = { deg: 0 },
                  n = {
                    matrix: [
                      "NNNNNN",
                      [k, k, 0, 0, k, k, 0, 0, 0, 0, 1, 0, k, k, 0, 1],
                      d,
                    ],
                    matrix3d: ["NNNNNNNNNNNNNNNN", d],
                    rotate: ["A"],
                    rotatex: ["A"],
                    rotatey: ["A"],
                    rotatez: ["A"],
                    rotate3d: ["NNNA"],
                    perspective: ["L"],
                    scale: ["Nn", c([k, k, 1]), d],
                    scalex: ["N", c([k, 1, 1]), c([k, 1])],
                    scaley: ["N", c([1, k, 1]), c([1, k])],
                    scalez: ["N", c([1, 1, k])],
                    scale3d: ["NNN", d],
                    skew: ["Aa", null, d],
                    skewx: ["A", null, c([k, m])],
                    skewy: ["A", null, c([m, k])],
                    translate: ["Tt", c([k, k, l]), d],
                    translatex: ["T", c([k, l, l]), c([k, l])],
                    translatey: ["T", c([l, k, l]), c([l, k])],
                    translatez: ["L", c([l, l, k])],
                    translate3d: ["TTL", d],
                  };
                a.addPropertiesHandler(e, j, ["transform"]),
                  (a.transformToSvgMatrix = function (b) {
                    var c = a.transformListToMatrix(e(b));
                    return (
                      "matrix(" +
                      f(c[0]) +
                      " " +
                      f(c[1]) +
                      " " +
                      f(c[4]) +
                      " " +
                      f(c[5]) +
                      " " +
                      f(c[12]) +
                      " " +
                      f(c[13]) +
                      ")"
                    );
                  });
              })(b),
              (function (a) {
                function b(a) {
                  var b = Number(a);
                  if (!(isNaN(b) || b < 100 || b > 900 || b % 100 != 0))
                    return b;
                }
                function c(b) {
                  return (
                    (b = 100 * Math.round(b / 100)),
                    (b = a.clamp(100, 900, b)),
                    400 === b ? "normal" : 700 === b ? "bold" : String(b)
                  );
                }
                function d(a, b) {
                  return [a, b, c];
                }
                a.addPropertiesHandler(b, d, ["font-weight"]);
              })(b),
              (function (a) {
                function b(a) {
                  var b = {};
                  for (var c in a) b[c] = -a[c];
                  return b;
                }
                function c(b) {
                  return (
                    a.consumeToken(/^(left|center|right|top|bottom)\b/i, b) ||
                    a.consumeLengthOrPercent(b)
                  );
                }
                function d(b, d) {
                  var e = a.consumeRepeated(c, /^/, d);
                  if (e && "" == e[1]) {
                    var f = e[0];
                    if (
                      ((f[0] = f[0] || "center"),
                      (f[1] = f[1] || "center"),
                      3 == b && (f[2] = f[2] || { px: 0 }),
                      f.length == b)
                    ) {
                      if (/top|bottom/.test(f[0]) || /left|right/.test(f[1])) {
                        var h = f[0];
                        (f[0] = f[1]), (f[1] = h);
                      }
                      if (
                        /left|right|center|Object/.test(f[0]) &&
                        /top|bottom|center|Object/.test(f[1])
                      )
                        return f.map(function (a) {
                          return "object" == typeof a ? a : g[a];
                        });
                    }
                  }
                }
                function e(d) {
                  var e = a.consumeRepeated(c, /^/, d);
                  if (e) {
                    for (
                      var f = e[0],
                        h = [{ "%": 50 }, { "%": 50 }],
                        i = 0,
                        j = !1,
                        k = 0;
                      k < f.length;
                      k++
                    ) {
                      var l = f[k];
                      "string" == typeof l
                        ? ((j = /bottom|right/.test(l)),
                          (i = {
                            left: 0,
                            right: 0,
                            center: i,
                            top: 1,
                            bottom: 1,
                          }[l]),
                          (h[i] = g[l]),
                          "center" == l && i++)
                        : (j && ((l = b(l)), (l["%"] = (l["%"] || 0) + 100)),
                          (h[i] = l),
                          i++,
                          (j = !1));
                    }
                    return [h, e[1]];
                  }
                }
                function f(b) {
                  var c = a.consumeRepeated(e, /^,/, b);
                  if (c && "" == c[1]) return c[0];
                }
                var g = {
                    left: { "%": 0 },
                    center: { "%": 50 },
                    right: { "%": 100 },
                    top: { "%": 0 },
                    bottom: { "%": 100 },
                  },
                  h = a.mergeNestedRepeated.bind(null, a.mergeDimensions, " ");
                a.addPropertiesHandler(d.bind(null, 3), h, [
                  "transform-origin",
                ]),
                  a.addPropertiesHandler(d.bind(null, 2), h, [
                    "perspective-origin",
                  ]),
                  (a.consumePosition = e),
                  (a.mergeOffsetList = h);
                var i = a.mergeNestedRepeated.bind(null, h, ", ");
                a.addPropertiesHandler(f, i, [
                  "background-position",
                  "object-position",
                ]);
              })(b),
              (function (a) {
                function b(b) {
                  var c = a.consumeToken(/^circle/, b);
                  if (c && c[0])
                    return ["circle"].concat(
                      a.consumeList(
                        [
                          a.ignore(a.consumeToken.bind(void 0, /^\(/)),
                          d,
                          a.ignore(a.consumeToken.bind(void 0, /^at/)),
                          a.consumePosition,
                          a.ignore(a.consumeToken.bind(void 0, /^\)/)),
                        ],
                        c[1]
                      )
                    );
                  var f = a.consumeToken(/^ellipse/, b);
                  if (f && f[0])
                    return ["ellipse"].concat(
                      a.consumeList(
                        [
                          a.ignore(a.consumeToken.bind(void 0, /^\(/)),
                          e,
                          a.ignore(a.consumeToken.bind(void 0, /^at/)),
                          a.consumePosition,
                          a.ignore(a.consumeToken.bind(void 0, /^\)/)),
                        ],
                        f[1]
                      )
                    );
                  var g = a.consumeToken(/^polygon/, b);
                  return g && g[0]
                    ? ["polygon"].concat(
                        a.consumeList(
                          [
                            a.ignore(a.consumeToken.bind(void 0, /^\(/)),
                            a.optional(
                              a.consumeToken.bind(
                                void 0,
                                /^nonzero\s*,|^evenodd\s*,/
                              ),
                              "nonzero,"
                            ),
                            a.consumeSizePairList,
                            a.ignore(a.consumeToken.bind(void 0, /^\)/)),
                          ],
                          g[1]
                        )
                      )
                    : void 0;
                }
                function c(b, c) {
                  if (b[0] === c[0])
                    return "circle" == b[0]
                      ? a.mergeList(b.slice(1), c.slice(1), [
                          "circle(",
                          a.mergeDimensions,
                          " at ",
                          a.mergeOffsetList,
                          ")",
                        ])
                      : "ellipse" == b[0]
                      ? a.mergeList(b.slice(1), c.slice(1), [
                          "ellipse(",
                          a.mergeNonNegativeSizePair,
                          " at ",
                          a.mergeOffsetList,
                          ")",
                        ])
                      : "polygon" == b[0] && b[1] == c[1]
                      ? a.mergeList(b.slice(2), c.slice(2), [
                          "polygon(",
                          b[1],
                          g,
                          ")",
                        ])
                      : void 0;
                }
                var d = a.consumeParenthesised.bind(
                    null,
                    a.parseLengthOrPercent
                  ),
                  e = a.consumeRepeated.bind(void 0, d, /^/),
                  f = a.mergeNestedRepeated.bind(
                    void 0,
                    a.mergeDimensions,
                    " "
                  ),
                  g = a.mergeNestedRepeated.bind(void 0, f, ",");
                a.addPropertiesHandler(b, c, ["shape-outside"]);
              })(b),
              (function (a, b) {
                function c(a, b) {
                  b.concat([a]).forEach(function (b) {
                    b in document.documentElement.style && (d[a] = b),
                      (e[b] = a);
                  });
                }
                var d = {},
                  e = {};
                c("transform", ["webkitTransform", "msTransform"]),
                  c("transformOrigin", ["webkitTransformOrigin"]),
                  c("perspective", ["webkitPerspective"]),
                  c("perspectiveOrigin", ["webkitPerspectiveOrigin"]),
                  (a.propertyName = function (a) {
                    return d[a] || a;
                  }),
                  (a.unprefixedPropertyName = function (a) {
                    return e[a] || a;
                  });
              })(b);
          })(),
          (function () {
            if (void 0 === document.createElement("div").animate([]).oncancel) {
              var a;
              if (window.performance && performance.now)
                var a = function () {
                  return performance.now();
                };
              else
                var a = function () {
                  return Date.now();
                };
              var b = function (a, b, c) {
                  (this.target = a),
                    (this.currentTime = b),
                    (this.timelineTime = c),
                    (this.type = "cancel"),
                    (this.bubbles = !1),
                    (this.cancelable = !1),
                    (this.currentTarget = a),
                    (this.defaultPrevented = !1),
                    (this.eventPhase = Event.AT_TARGET),
                    (this.timeStamp = Date.now());
                },
                c = window.Element.prototype.animate;
              window.Element.prototype.animate = function (d, e) {
                var f = c.call(this, d, e);
                (f._cancelHandlers = []), (f.oncancel = null);
                var g = f.cancel;
                f.cancel = function () {
                  g.call(this);
                  var c = new b(this, null, a()),
                    d = this._cancelHandlers.concat(
                      this.oncancel ? [this.oncancel] : []
                    );
                  setTimeout(function () {
                    d.forEach(function (a) {
                      a.call(c.target, c);
                    });
                  }, 0);
                };
                var h = f.addEventListener;
                f.addEventListener = function (a, b) {
                  "function" == typeof b && "cancel" == a
                    ? this._cancelHandlers.push(b)
                    : h.call(this, a, b);
                };
                var i = f.removeEventListener;
                return (
                  (f.removeEventListener = function (a, b) {
                    if ("cancel" == a) {
                      var c = this._cancelHandlers.indexOf(b);
                      c >= 0 && this._cancelHandlers.splice(c, 1);
                    } else i.call(this, a, b);
                  }),
                  f
                );
              };
            }
          })(),
          (function (a) {
            var b = document.documentElement,
              c = null,
              d = !1;
            try {
              var e = getComputedStyle(b).getPropertyValue("opacity"),
                f = "0" == e ? "1" : "0";
              (c = b.animate({ opacity: [f, f] }, { duration: 1 })),
                (c.currentTime = 0),
                (d = getComputedStyle(b).getPropertyValue("opacity") == f);
            } catch (a) {
            } finally {
              c && c.cancel();
            }
            if (!d) {
              var g = window.Element.prototype.animate;
              window.Element.prototype.animate = function (b, c) {
                return (
                  window.Symbol &&
                    Symbol.iterator &&
                    Array.prototype.from &&
                    b[Symbol.iterator] &&
                    (b = Array.from(b)),
                  Array.isArray(b) ||
                    null === b ||
                    (b = a.convertToArrayForm(b)),
                  g.call(this, b, c)
                );
              };
            }
          })(a);
      })();
      //# sourceMappingURL=web-animations.min.js.map

      /***/
    },

    /******/
  };
  /************************************************************************/
  /******/ // The module cache
  /******/ var __webpack_module_cache__ = {};
  /******/
  /******/ // The require function
  /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    });
    /******/
    /******/ // Execute the module function
    /******/ __webpack_modules__[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports;
    /******/
  }
  /******/
  /************************************************************************/
  /******/ /* webpack/runtime/global */
  /******/ (() => {
    /******/ __webpack_require__.g = (function () {
      /******/ if (typeof globalThis === "object") return globalThis;
      /******/ try {
        /******/ return this || new Function("return this")();
        /******/
      } catch (e) {
        /******/ if (typeof window === "object") return window;
        /******/
      }
      /******/
    })();
    /******/
  })();
  /******/
  /************************************************************************/
  /******/
  /******/ // startup
  /******/ // Load entry module and return exports
  /******/ // This entry module doesn't tell about it's top-level declarations so it can't be inlined
  /******/ var __webpack_exports__ = __webpack_require__(420);
  /******/
  /******/
})();
