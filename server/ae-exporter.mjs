/**
 * Remotion to After Effects Export Module - Full Pipeline
 *
 * Comprehensive export system that converts Remotion compositions to After Effects,
 * including support for:
 * - CSS filters (blur, brightness, contrast, etc.)
 * - Masks and clip-paths
 * - Blend modes
 * - Spring physics animations
 * - SVG filters and gradients
 * - Motion blur settings
 * - Complex transform animations
 */

// =====================
// Easing Conversion Maps
// =====================

export const EASING_BEZIER_MAP = {
  // Basic
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],

  // Quad
  'ease-in-quad': [0.55, 0.085, 0.68, 0.53],
  'ease-out-quad': [0.25, 0.46, 0.45, 0.94],
  'ease-in-out-quad': [0.455, 0.03, 0.515, 0.955],

  // Cubic
  'ease-in-cubic': [0.55, 0.055, 0.675, 0.19],
  'ease-out-cubic': [0.215, 0.61, 0.355, 1],
  'ease-in-out-cubic': [0.645, 0.045, 0.355, 1],

  // Quart
  'ease-in-quart': [0.895, 0.03, 0.685, 0.22],
  'ease-out-quart': [0.165, 0.84, 0.44, 1],
  'ease-in-out-quart': [0.77, 0, 0.175, 1],

  // Quint
  'ease-in-quint': [0.755, 0.05, 0.855, 0.06],
  'ease-out-quint': [0.23, 1, 0.32, 1],
  'ease-in-out-quint': [0.86, 0, 0.07, 1],

  // Expo
  'ease-in-expo': [0.95, 0.05, 0.795, 0.035],
  'ease-out-expo': [0.19, 1, 0.22, 1],
  'ease-in-out-expo': [1, 0, 0, 1],

  // Circ
  'ease-in-circ': [0.6, 0.04, 0.98, 0.335],
  'ease-out-circ': [0.075, 0.82, 0.165, 1],
  'ease-in-out-circ': [0.785, 0.135, 0.15, 0.86],

  // Back (overshoot)
  'ease-in-back': [0.6, -0.28, 0.735, 0.045],
  'ease-out-back': [0.175, 0.885, 0.32, 1.275],
  'ease-in-out-back': [0.68, -0.55, 0.265, 1.55],

  // Elastic (approximation - true elastic needs expressions)
  'ease-in-elastic': [0.5, -0.5, 0.75, -0.5],
  'ease-out-elastic': [0.25, 1.5, 0.5, 1.5],
  'ease-in-out-elastic': [0.5, -0.25, 0.5, 1.25],

  // Bounce (approximation - true bounce needs expressions)
  'ease-in-bounce': [0.6, -0.28, 0.735, 0.045],
  'ease-out-bounce': [0.175, 0.885, 0.32, 1.1],
  'ease-in-out-bounce': [0.68, -0.35, 0.265, 1.35],
};

// =====================
// CSS Filter Mapping
// =====================

/**
 * Map CSS filter functions to After Effects effect names and properties
 */
export const CSS_FILTER_TO_AE = {
  blur: {
    effectName: 'ADBE Gaussian Blur 2',
    matchName: 'ADBE Gaussian Blur 2',
    properties: {
      blurriness: 'ADBE Gaussian Blur 2-0001', // Blurriness
    },
    convert: (value) => {
      // CSS blur is in pixels, AE Gaussian Blur uses the same unit
      const px = parseFloat(value);
      return { blurriness: px };
    },
  },
  brightness: {
    effectName: 'ADBE Brightness & Contrast 2',
    matchName: 'ADBE Brightness & Contrast 2',
    properties: {
      brightness: 'ADBE Brightness & Contrast 2-0001',
    },
    convert: (value) => {
      // CSS brightness: 1 = normal, 0 = black, 2 = 200%
      // AE brightness: 0 = normal, -100 to 100
      const val = parseFloat(value);
      return { brightness: (val - 1) * 100 };
    },
  },
  contrast: {
    effectName: 'ADBE Brightness & Contrast 2',
    matchName: 'ADBE Brightness & Contrast 2',
    properties: {
      contrast: 'ADBE Brightness & Contrast 2-0002',
    },
    convert: (value) => {
      // CSS contrast: 1 = normal, 0 = gray, 2 = 200%
      // AE contrast: 0 = normal, -100 to 100
      const val = parseFloat(value);
      return { contrast: (val - 1) * 100 };
    },
  },
  saturate: {
    effectName: 'ADBE HUE SATURATION',
    matchName: 'ADBE HUE SATURATION',
    properties: {
      saturation: 'ADBE HUE SATURATION-0002', // Master Saturation
    },
    convert: (value) => {
      // CSS saturate: 1 = normal, 0 = grayscale, 2 = 200%
      // AE saturation: 0 = normal, -100 to 100
      const val = parseFloat(value);
      return { saturation: (val - 1) * 100 };
    },
  },
  'hue-rotate': {
    effectName: 'ADBE HUE SATURATION',
    matchName: 'ADBE HUE SATURATION',
    properties: {
      hue: 'ADBE HUE SATURATION-0001', // Master Hue
    },
    convert: (value) => {
      // CSS hue-rotate in degrees, AE uses degrees too
      const deg = parseFloat(value);
      return { hue: deg };
    },
  },
  grayscale: {
    effectName: 'ADBE Black&White',
    matchName: 'ADBE Black&White',
    properties: {
      // Black & White effect doesn't have a simple "amount" - use tint instead
    },
    convert: (value) => {
      const val = parseFloat(value);
      return { amount: val * 100 };
    },
    // Alternative: Use Hue/Saturation with saturation = -100
    alternative: {
      effectName: 'ADBE HUE SATURATION',
      convert: (value) => {
        const val = parseFloat(value);
        return { saturation: -val * 100 };
      },
    },
  },
  invert: {
    effectName: 'ADBE Invert',
    matchName: 'ADBE Invert',
    properties: {
      blend: 'ADBE Invert-0001',
    },
    convert: (value) => {
      // CSS invert: 0 = normal, 1 = fully inverted
      // AE invert blend: 0-100%
      const val = parseFloat(value);
      return { blend: val * 100 };
    },
  },
  sepia: {
    effectName: 'ADBE Tint',
    matchName: 'ADBE Tint',
    properties: {
      amount: 'ADBE Tint-0003', // Amount to Tint
      mapBlackTo: 'ADBE Tint-0001',
      mapWhiteTo: 'ADBE Tint-0002',
    },
    convert: (value) => {
      const val = parseFloat(value);
      return {
        amount: val * 100,
        mapBlackTo: [0.24, 0.19, 0.11], // Sepia black point
        mapWhiteTo: [1, 0.96, 0.82], // Sepia white point
      };
    },
  },
  'drop-shadow': {
    effectName: 'ADBE Drop Shadow',
    matchName: 'ADBE Drop Shadow',
    properties: {
      opacity: 'ADBE Drop Shadow-0001',
      direction: 'ADBE Drop Shadow-0002',
      distance: 'ADBE Drop Shadow-0003',
      softness: 'ADBE Drop Shadow-0004',
      color: 'ADBE Drop Shadow-0005',
    },
    convert: (offsetX, offsetY, blurRadius, color) => {
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      const direction = (Math.atan2(offsetY, offsetX) * 180) / Math.PI + 90;
      return {
        distance,
        direction,
        softness: blurRadius * 2,
        color: color || [0, 0, 0],
        opacity: 75,
      };
    },
  },
  opacity: {
    // Opacity is handled at layer level, not as effect
    isLayerProperty: true,
    convert: (value) => {
      const val = parseFloat(value);
      return { opacity: val * 100 };
    },
  },
};

// =====================
// Blend Mode Mapping
// =====================

export const CSS_BLEND_TO_AE = {
  normal: 'BlendingMode.NORMAL',
  multiply: 'BlendingMode.MULTIPLY',
  screen: 'BlendingMode.SCREEN',
  overlay: 'BlendingMode.OVERLAY',
  darken: 'BlendingMode.DARKEN',
  lighten: 'BlendingMode.LIGHTEN',
  'color-dodge': 'BlendingMode.COLOR_DODGE',
  'color-burn': 'BlendingMode.COLOR_BURN',
  'hard-light': 'BlendingMode.HARD_LIGHT',
  'soft-light': 'BlendingMode.SOFT_LIGHT',
  difference: 'BlendingMode.DIFFERENCE',
  exclusion: 'BlendingMode.EXCLUSION',
  hue: 'BlendingMode.HUE',
  saturation: 'BlendingMode.SATURATION',
  color: 'BlendingMode.COLOR',
  luminosity: 'BlendingMode.LUMINOSITY',
  // Additional AE modes
  add: 'BlendingMode.ADD',
  'linear-dodge': 'BlendingMode.LINEAR_DODGE',
  'linear-burn': 'BlendingMode.LINEAR_BURN',
  'vivid-light': 'BlendingMode.VIVID_LIGHT',
  'linear-light': 'BlendingMode.LINEAR_LIGHT',
  'pin-light': 'BlendingMode.PIN_LIGHT',
  'hard-mix': 'BlendingMode.HARD_MIX',
};

// =====================
// Color Utilities
// =====================

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export function hexToNormalizedRgb(hex) {
  const rgb = hexToRgb(hex);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

export function rgbaToNormalized(r, g, b, a = 1) {
  return [r / 255, g / 255, b / 255, a];
}

export function parseColor(colorStr) {
  if (!colorStr) return [0, 0, 0, 1];

  // Hex
  if (colorStr.startsWith('#')) {
    const rgb = hexToNormalizedRgb(colorStr);
    return [...rgb, 1];
  }

  // rgba(r, g, b, a)
  const rgbaMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    return rgbaToNormalized(
      parseInt(rgbaMatch[1]),
      parseInt(rgbaMatch[2]),
      parseInt(rgbaMatch[3]),
      rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    );
  }

  return [0, 0, 0, 1];
}

// =====================
// CSS Filter Parser
// =====================

/**
 * Parse CSS filter string into individual filter objects
 * @param {string} filterStr - CSS filter string like "blur(5px) brightness(1.2)"
 * @returns {object[]} Array of parsed filter objects
 */
export function parseCSSFilters(filterStr) {
  if (!filterStr || filterStr === 'none') return [];

  const filters = [];
  // Match filter functions: name(value)
  const regex = /(\w+(?:-\w+)?)\s*\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(filterStr)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2].trim();

    if (CSS_FILTER_TO_AE[name]) {
      const mapping = CSS_FILTER_TO_AE[name];
      const converted = mapping.convert(value);

      filters.push({
        name,
        rawValue: value,
        aeEffect: mapping.effectName,
        aeMatchName: mapping.matchName,
        aeProperties: mapping.properties,
        convertedValues: converted,
        isLayerProperty: mapping.isLayerProperty || false,
      });
    }
  }

  return filters;
}

/**
 * Parse drop-shadow specifically (has multiple values)
 */
export function parseDropShadow(shadowStr) {
  // drop-shadow(offset-x offset-y blur-radius color)
  const match = shadowStr.match(
    /drop-shadow\s*\(\s*([-\d.]+)(?:px)?\s+([-\d.]+)(?:px)?\s+([-\d.]+)(?:px)?\s*([^)]*)\)/i
  );

  if (match) {
    const offsetX = parseFloat(match[1]);
    const offsetY = parseFloat(match[2]);
    const blurRadius = parseFloat(match[3]);
    const color = match[4] ? parseColor(match[4].trim()) : [0, 0, 0, 0.5];

    return CSS_FILTER_TO_AE['drop-shadow'].convert(offsetX, offsetY, blurRadius, color);
  }

  return null;
}

// =====================
// Clip-Path Parser
// =====================

/**
 * Parse CSS clip-path into AE-compatible mask path
 * @param {string} clipPath - CSS clip-path value
 * @returns {object|null} Mask definition for AE
 */
export function parseClipPath(clipPath) {
  if (!clipPath || clipPath === 'none') return null;

  // inset(top right bottom left)
  const insetMatch = clipPath.match(
    /inset\s*\(\s*([\d.]+)(%|px)?\s*([\d.]+)?(%|px)?\s*([\d.]+)?(%|px)?\s*([\d.]+)?(%|px)?\s*\)/i
  );
  if (insetMatch) {
    const top = parseFloat(insetMatch[1]) || 0;
    const right = parseFloat(insetMatch[3]) || top;
    const bottom = parseFloat(insetMatch[5]) || top;
    const left = parseFloat(insetMatch[7]) || right;
    const isPercent = insetMatch[2] === '%';

    return {
      type: 'inset',
      values: { top, right, bottom, left },
      isPercent,
      // Will be converted to rectangle mask in AE
    };
  }

  // circle(radius at cx cy)
  const circleMatch = clipPath.match(
    /circle\s*\(\s*([\d.]+)(%|px)?\s*(?:at\s+([\d.]+)(%|px)?\s+([\d.]+)(%|px)?)?\s*\)/i
  );
  if (circleMatch) {
    return {
      type: 'circle',
      radius: parseFloat(circleMatch[1]),
      radiusUnit: circleMatch[2] || 'px',
      centerX: circleMatch[3] ? parseFloat(circleMatch[3]) : 50,
      centerY: circleMatch[5] ? parseFloat(circleMatch[5]) : 50,
      centerUnit: circleMatch[4] || '%',
    };
  }

  // ellipse(rx ry at cx cy)
  const ellipseMatch = clipPath.match(
    /ellipse\s*\(\s*([\d.]+)(%|px)?\s+([\d.]+)(%|px)?\s*(?:at\s+([\d.]+)(%|px)?\s+([\d.]+)(%|px)?)?\s*\)/i
  );
  if (ellipseMatch) {
    return {
      type: 'ellipse',
      radiusX: parseFloat(ellipseMatch[1]),
      radiusY: parseFloat(ellipseMatch[3]),
      centerX: ellipseMatch[5] ? parseFloat(ellipseMatch[5]) : 50,
      centerY: ellipseMatch[7] ? parseFloat(ellipseMatch[7]) : 50,
    };
  }

  // polygon(x1 y1, x2 y2, ...)
  const polygonMatch = clipPath.match(/polygon\s*\(\s*([^)]+)\s*\)/i);
  if (polygonMatch) {
    const pointsStr = polygonMatch[1];
    const points = pointsStr.split(',').map((pair) => {
      const [x, y] = pair.trim().split(/\s+/);
      return {
        x: parseFloat(x),
        y: parseFloat(y),
        xUnit: x.includes('%') ? '%' : 'px',
        yUnit: y.includes('%') ? '%' : 'px',
      };
    });

    return {
      type: 'polygon',
      points,
    };
  }

  // path() - SVG path
  const pathMatch = clipPath.match(/path\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i);
  if (pathMatch) {
    return {
      type: 'path',
      d: pathMatch[1],
    };
  }

  return null;
}

// =====================
// Transform Parser
// =====================

/**
 * Parse CSS transform string into individual transforms
 * @param {string} transformStr - CSS transform string
 * @returns {object[]} Array of transform objects
 */
export function parseCSSTransform(transformStr) {
  if (!transformStr || transformStr === 'none') return [];

  const transforms = [];
  const regex = /(\w+)\s*\(\s*([^)]+)\s*\)/g;
  let match;

  while ((match = regex.exec(transformStr)) !== null) {
    const func = match[1].toLowerCase();
    const args = match[2].split(',').map((s) => s.trim());

    switch (func) {
      case 'translate':
      case 'translatex':
      case 'translatey':
      case 'translatez':
      case 'translate3d':
        transforms.push({
          type: 'translate',
          func,
          values: args.map((a) => parseFloat(a)),
        });
        break;

      case 'scale':
      case 'scalex':
      case 'scaley':
      case 'scale3d':
        transforms.push({
          type: 'scale',
          func,
          values: args.map((a) => parseFloat(a) * 100), // AE uses percentage
        });
        break;

      case 'rotate':
      case 'rotatex':
      case 'rotatey':
      case 'rotatez':
      case 'rotate3d':
        transforms.push({
          type: 'rotation',
          func,
          values: args.map((a) => parseFloat(a)), // degrees
        });
        break;

      case 'skew':
      case 'skewx':
      case 'skewy':
        transforms.push({
          type: 'skew',
          func,
          values: args.map((a) => parseFloat(a)),
        });
        break;

      case 'matrix':
      case 'matrix3d':
        transforms.push({
          type: 'matrix',
          func,
          values: args.map((a) => parseFloat(a)),
        });
        break;

      case 'perspective':
        transforms.push({
          type: 'perspective',
          func,
          value: parseFloat(args[0]),
        });
        break;
    }
  }

  return transforms;
}

// =====================
// Spring Animation Converter
// =====================

/**
 * Convert Remotion spring() config to AE expression
 * Remotion spring: spring({ fps, frame, config: { damping, mass, stiffness } })
 *
 * @param {object} springConfig - Spring configuration
 * @param {string} propertyName - Property being animated
 * @param {number} startValue - Start value
 * @param {number} endValue - End value
 * @returns {string} AE expression
 */
export function springToAEExpression(springConfig, propertyName, startValue, endValue) {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = springConfig;

  // AE expression that simulates spring physics
  // Based on damped harmonic oscillator equation
  return `
// Spring Animation (converted from Remotion)
// Config: damping=${damping}, mass=${mass}, stiffness=${stiffness}

var damping = ${damping};
var mass = ${mass};
var stiffness = ${stiffness};
var overshootClamping = ${overshootClamping};

var startValue = ${JSON.stringify(startValue)};
var endValue = ${JSON.stringify(endValue)};
var startTime = inPoint;

var t = Math.max(0, time - startTime);
var omega = Math.sqrt(stiffness / mass);
var zeta = damping / (2 * Math.sqrt(stiffness * mass));

var value;
if (zeta < 1) {
  // Underdamped
  var omegaD = omega * Math.sqrt(1 - zeta * zeta);
  var envelope = Math.exp(-zeta * omega * t);
  var oscillation = Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t);
  value = 1 - envelope * oscillation;
} else if (zeta === 1) {
  // Critically damped
  value = 1 - Math.exp(-omega * t) * (1 + omega * t);
} else {
  // Overdamped
  var s1 = omega * (-zeta + Math.sqrt(zeta * zeta - 1));
  var s2 = omega * (-zeta - Math.sqrt(zeta * zeta - 1));
  value = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
}

if (overshootClamping) {
  value = Math.min(1, Math.max(0, value));
}

// Interpolate between start and end values
linear(value, 0, 1, startValue, endValue);
`.trim();
}

/**
 * Convert interpolate() call to AE expression
 */
export function interpolateToAEExpression(
  inputRange,
  outputRange,
  options = {}
) {
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing = 'linear' } = options;

  let easingCode = 'progress'; // linear by default
  if (easing !== 'linear' && EASING_BEZIER_MAP[easing]) {
    const [x1, y1, x2, y2] = EASING_BEZIER_MAP[easing];
    easingCode = `cubicBezier(progress, ${x1}, ${y1}, ${x2}, ${y2})`;
  }

  return `
// Interpolation (converted from Remotion)
var inputRange = ${JSON.stringify(inputRange)};
var outputRange = ${JSON.stringify(outputRange)};
var extrapolateLeft = "${extrapolateLeft}";
var extrapolateRight = "${extrapolateRight}";

function cubicBezier(t, x1, y1, x2, y2) {
  // Approximate cubic bezier
  var cx = 3 * x1;
  var bx = 3 * (x2 - x1) - cx;
  var ax = 1 - cx - bx;
  var cy = 3 * y1;
  var by = 3 * (y2 - y1) - cy;
  var ay = 1 - cy - by;

  function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }
  function sampleY(t) { return ((ay * t + by) * t + cy) * t; }

  // Newton-Raphson iteration to find t for x
  var guessT = t;
  for (var i = 0; i < 4; i++) {
    var currentX = sampleX(guessT) - t;
    var currentSlope = (3 * ax * guessT + 2 * bx) * guessT + cx;
    if (Math.abs(currentSlope) < 0.00001) break;
    guessT -= currentX / currentSlope;
  }
  return sampleY(guessT);
}

var frame = time * thisComp.frameRate;
var progress;

// Find which segment we're in
var segmentIndex = 0;
for (var i = 0; i < inputRange.length - 1; i++) {
  if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {
    segmentIndex = i;
    break;
  }
  if (frame > inputRange[i + 1]) segmentIndex = i + 1;
}

if (frame < inputRange[0]) {
  if (extrapolateLeft === "clamp") {
    progress = 0;
  } else {
    progress = (frame - inputRange[0]) / (inputRange[1] - inputRange[0]);
  }
  segmentIndex = 0;
} else if (frame > inputRange[inputRange.length - 1]) {
  if (extrapolateRight === "clamp") {
    progress = 1;
  } else {
    var lastIdx = inputRange.length - 1;
    progress = 1 + (frame - inputRange[lastIdx]) / (inputRange[lastIdx] - inputRange[lastIdx - 1]);
  }
  segmentIndex = inputRange.length - 2;
} else {
  progress = (frame - inputRange[segmentIndex]) / (inputRange[segmentIndex + 1] - inputRange[segmentIndex]);
}

var easedProgress = ${easingCode};
linear(easedProgress, 0, 1, outputRange[segmentIndex], outputRange[segmentIndex + 1]);
`.trim();
}

// =====================
// Gradient Converter
// =====================

/**
 * Parse CSS gradient to AE Gradient Ramp/4-Color Gradient parameters
 */
export function parseGradient(gradientStr) {
  if (!gradientStr) return null;

  // Linear gradient
  const linearMatch = gradientStr.match(
    /linear-gradient\s*\(\s*([\d.]+deg|to\s+\w+)?\s*,?\s*(.+)\s*\)/i
  );

  if (linearMatch) {
    let angle = 180; // default: top to bottom
    if (linearMatch[1]) {
      if (linearMatch[1].includes('deg')) {
        angle = parseFloat(linearMatch[1]);
      } else if (linearMatch[1].includes('to')) {
        const dir = linearMatch[1].toLowerCase();
        if (dir.includes('right')) angle = 90;
        else if (dir.includes('left')) angle = 270;
        else if (dir.includes('bottom')) angle = 180;
        else if (dir.includes('top')) angle = 0;
      }
    }

    const stopsStr = linearMatch[2];
    const stops = parseGradientStops(stopsStr);

    return {
      type: 'linear',
      angle,
      stops,
    };
  }

  // Radial gradient
  const radialMatch = gradientStr.match(/radial-gradient\s*\(\s*(.+)\s*\)/i);
  if (radialMatch) {
    const content = radialMatch[1];
    const stops = parseGradientStops(content);

    return {
      type: 'radial',
      shape: 'ellipse',
      stops,
    };
  }

  return null;
}

function parseGradientStops(stopsStr) {
  const stops = [];
  // Match color and optional position
  const regex = /(#[a-f\d]{3,8}|rgba?\s*\([^)]+\)|[a-z]+)\s*([\d.]+%?)?/gi;
  let match;

  while ((match = regex.exec(stopsStr)) !== null) {
    const color = parseColor(match[1]);
    let position = match[2] ? parseFloat(match[2]) / 100 : null;

    stops.push({ color, position });
  }

  // Fill in missing positions
  if (stops.length > 0) {
    if (stops[0].position === null) stops[0].position = 0;
    if (stops[stops.length - 1].position === null) stops[stops.length - 1].position = 1;

    // Interpolate middle positions
    let lastPos = 0;
    for (let i = 0; i < stops.length; i++) {
      if (stops[i].position === null) {
        // Find next non-null position
        let nextIdx = i + 1;
        while (nextIdx < stops.length && stops[nextIdx].position === null) nextIdx++;
        const nextPos = stops[nextIdx]?.position || 1;
        const gap = nextPos - lastPos;
        const count = nextIdx - i + 1;
        stops[i].position = lastPos + gap * ((i - lastPos + 1) / count);
      }
      lastPos = stops[i].position;
    }
  }

  return stops;
}

// =====================
// Animation Builders
// =====================

export function createFadeAnimation(durationInFrames, fps) {
  const fadeInDuration = 15;
  const fadeOutStart = durationInFrames - 15;

  return {
    name: 'opacity',
    keyframes: [
      { frame: 0, value: 0, easing: { type: 'linear' } },
      { frame: fadeInDuration, value: 100, easing: { type: 'linear' } },
      { frame: fadeOutStart, value: 100, easing: { type: 'linear' } },
      { frame: durationInFrames, value: 0, easing: { type: 'hold' } },
    ],
  };
}

export function createDelayedFadeIn(delay, duration, totalDuration) {
  const fadeInEnd = delay + duration;
  const fadeOutStart = totalDuration - 15;

  return {
    name: 'opacity',
    keyframes: [
      { frame: 0, value: 0, easing: { type: 'hold' } },
      { frame: delay, value: 0, easing: { type: 'linear' } },
      { frame: fadeInEnd, value: 100, easing: { type: 'linear' } },
      { frame: fadeOutStart, value: 100, easing: { type: 'linear' } },
      { frame: totalDuration, value: 0, easing: { type: 'hold' } },
    ],
  };
}

export function createScaleAnimation(startScale, endScale, startFrame, endFrame, easing = 'ease-out-cubic') {
  return {
    name: 'scale',
    keyframes: [
      {
        frame: startFrame,
        value: [startScale, startScale],
        easing: { type: 'bezier', bezier: EASING_BEZIER_MAP[easing] || EASING_BEZIER_MAP['ease-out'] },
      },
      {
        frame: endFrame,
        value: [endScale, endScale],
        easing: { type: 'hold' },
      },
    ],
  };
}

export function createPositionAnimation(startPos, endPos, startFrame, endFrame, easing = 'ease-out-cubic') {
  return {
    name: 'position',
    keyframes: [
      {
        frame: startFrame,
        value: startPos,
        easing: { type: 'bezier', bezier: EASING_BEZIER_MAP[easing] || EASING_BEZIER_MAP['ease-out'] },
      },
      {
        frame: endFrame,
        value: endPos,
        easing: { type: 'hold' },
      },
    ],
  };
}

export function createRotationAnimation(startRot, endRot, startFrame, endFrame, easing = 'ease-in-out') {
  return {
    name: 'rotation',
    keyframes: [
      {
        frame: startFrame,
        value: startRot,
        easing: { type: 'bezier', bezier: EASING_BEZIER_MAP[easing] },
      },
      {
        frame: endFrame,
        value: endRot,
        easing: { type: 'hold' },
      },
    ],
  };
}

// =====================
// Scene Layer Generators
// =====================

function generateTextOnlyLayers(sceneData, durationInFrames, theme) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  // Background
  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  // Title
  if (data?.title) {
    layers.push({
      id: `title-${sceneData.id}`,
      type: 'text',
      name: 'Title',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [
        createDelayedFadeIn(10, 15, durationInFrames),
        createScaleAnimation(95, 100, 10, 25),
      ],
      content: {
        text: data.title,
        fontSize: 72,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 700,
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 400],
      },
    });
  }

  // Body
  if (data?.body_text) {
    layers.push({
      id: `body-${sceneData.id}`,
      type: 'text',
      name: 'Body Text',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(25, 15, durationInFrames)],
      content: {
        text: data.body_text,
        fontSize: 42,
        fontFamily: theme?.fonts?.body || 'Inter',
        fontWeight: 300,
        color: theme?.colors?.textSecondary || '#A0AEC0',
        textAlign: 'center',
        position: [960, 550],
      },
    });
  }

  return layers;
}

function generateSingleImageLayers(sceneData, durationInFrames, theme) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  if (data?.image_url) {
    layers.push({
      id: `image-${sceneData.id}`,
      type: 'image',
      name: 'Image',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [
        createFadeAnimation(durationInFrames),
        createScaleAnimation(102, 100, 0, durationInFrames), // Ken Burns
      ],
      content: {
        source: data.image_url,
        position: [960, 400],
        scale: [100, 100],
      },
    });
  }

  if (data?.title) {
    layers.push({
      id: `title-${sceneData.id}`,
      type: 'text',
      name: 'Title',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(10, 15, durationInFrames)],
      content: {
        text: data.title,
        fontSize: 56,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 700,
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 850],
      },
    });
  }

  return layers;
}

function generateQuoteLayers(sceneData, durationInFrames, theme) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  // Quote marks decoration
  layers.push({
    id: `quotemark-${sceneData.id}`,
    type: 'text',
    name: 'Quote Mark',
    inPoint: 0,
    outPoint: durationInFrames,
    blendMode: 'screen',
    properties: [
      createDelayedFadeIn(5, 20, durationInFrames),
      { name: 'opacity', keyframes: [
        { frame: 25, value: 20, easing: { type: 'hold' } },
      ]},
    ],
    content: {
      text: '"',
      fontSize: 300,
      fontFamily: 'Georgia',
      fontWeight: 400,
      color: theme?.colors?.accent || '#00D9A3',
      textAlign: 'center',
      position: [200, 350],
    },
  });

  if (data?.quote) {
    layers.push({
      id: `quote-${sceneData.id}`,
      type: 'text',
      name: 'Quote',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(15, 20, durationInFrames)],
      content: {
        text: `"${data.quote}"`,
        fontSize: 56,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 500,
        fontStyle: 'italic',
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 480],
      },
    });
  }

  if (data?.author) {
    layers.push({
      id: `author-${sceneData.id}`,
      type: 'text',
      name: 'Author',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(40, 15, durationInFrames)],
      content: {
        text: `— ${data.author}`,
        fontSize: 32,
        fontFamily: theme?.fonts?.body || 'Inter',
        fontWeight: 400,
        color: theme?.colors?.accent || '#00D9A3',
        textAlign: 'center',
        position: [960, 620],
      },
    });
  }

  return layers;
}

function generateStatsLayers(sceneData, durationInFrames, theme) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  if (data?.title) {
    layers.push({
      id: `title-${sceneData.id}`,
      type: 'text',
      name: 'Title',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(10, 15, durationInFrames)],
      content: {
        text: data.title,
        fontSize: 56,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 700,
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 200],
      },
    });
  }

  if (data?.stats_text) {
    layers.push({
      id: `stats-${sceneData.id}`,
      type: 'text',
      name: 'Stats',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [
        createDelayedFadeIn(25, 15, durationInFrames),
        createScaleAnimation(80, 100, 25, 45, 'ease-out-back'),
      ],
      content: {
        text: data.stats_text,
        fontSize: 120,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 800,
        color: theme?.colors?.accent || '#00D9A3',
        textAlign: 'center',
        position: [960, 500],
      },
    });
  }

  return layers;
}

function generateChartLayers(sceneData, durationInFrames, theme, chartType) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  // Background
  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  // Title
  if (data?.title) {
    layers.push({
      id: `title-${sceneData.id}`,
      type: 'text',
      name: 'Title',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(10, 15, durationInFrames)],
      content: {
        text: data.title,
        fontSize: 48,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 700,
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 100],
      },
    });
  }

  // Chart placeholder - charts need to be recreated in AE
  layers.push({
    id: `chart-${sceneData.id}`,
    type: 'null',
    name: `Chart Placeholder (${chartType})`,
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [createFadeAnimation(durationInFrames)],
    metadata: {
      chartType,
      chartData: data?.chart_data,
      note: 'Recreate chart using AE shape layers or a chart plugin',
    },
  });

  return layers;
}

function generateGenericLayers(sceneData, durationInFrames, theme) {
  const layers = [];
  const data = typeof sceneData.data === 'string' ? JSON.parse(sceneData.data) : sceneData.data;

  layers.push({
    id: `bg-${sceneData.id}`,
    type: 'solid',
    name: 'Background',
    inPoint: 0,
    outPoint: durationInFrames,
    properties: [],
    content: {
      color: theme?.colors?.background || '#0A0A0A',
      width: 1920,
      height: 1080,
    },
  });

  if (data?.title) {
    layers.push({
      id: `title-${sceneData.id}`,
      type: 'text',
      name: 'Title',
      inPoint: 0,
      outPoint: durationInFrames,
      properties: [createDelayedFadeIn(10, 15, durationInFrames)],
      content: {
        text: data.title,
        fontSize: 64,
        fontFamily: theme?.fonts?.heading || 'Inter',
        fontWeight: 700,
        color: theme?.colors?.textPrimary || '#FFFFFF',
        textAlign: 'center',
        position: [960, 540],
      },
    });
  }

  return layers;
}

// Animation layer generator
function generateAnimationLayer(animationStyle, durationInFrames, theme) {
  if (!animationStyle || animationStyle === 'none') return null;

  const baseLayer = {
    id: `animation-${animationStyle}`,
    type: 'animation',
    name: `Animation: ${animationStyle}`,
    inPoint: 0,
    outPoint: durationInFrames,
    blendMode: 'screen',
    properties: [],
    content: {
      animationType: animationStyle,
      theme,
    },
  };

  // Add animation-specific effects
  switch (animationStyle) {
    case 'particles':
      baseLayer.effects = [
        {
          name: 'CC Particle World',
          matchName: 'CC Particle World',
          properties: {
            'Birth Rate': 2,
            'Longevity': 2,
            'Producer': { 'Position X': 960, 'Position Y': 540 },
          },
        },
      ];
      baseLayer.metadata = {
        note: 'Use CC Particle World or Particular for particle effects',
      };
      break;

    case 'bokeh':
      baseLayer.effects = [
        {
          name: 'CC Lens',
          matchName: 'CC Lens',
          properties: {
            'Size': 50,
            'Convergence': 0,
          },
        },
      ];
      break;

    case 'aurora':
    case 'waves':
      baseLayer.effects = [
        {
          name: 'Turbulent Displace',
          matchName: 'ADBE Turbulent Displace',
          properties: {
            'Amount': 50,
            'Size': 100,
          },
        },
      ];
      break;

    case 'matrix':
      baseLayer.metadata = {
        note: 'Create text rain effect using text animators or a preset',
      };
      break;

    case 'geometric':
      baseLayer.metadata = {
        note: 'Create geometric shapes using shape layers with repeaters',
      };
      break;

    default:
      baseLayer.metadata = {
        note: `Animation style "${animationStyle}" - recreate manually in AE`,
      };
  }

  return baseLayer;
}

// =====================
// Main Generator
// =====================

export function generateSceneLayers(scene, theme, fps = 30) {
  const durationInFrames = scene.end_frame - scene.start_frame;
  const data = typeof scene.data === 'string' ? JSON.parse(scene.data) : scene.data;
  let layers = [];

  switch (scene.scene_type) {
    case 'text-only':
      layers = generateTextOnlyLayers(scene, durationInFrames, theme);
      break;
    case 'single-image':
      layers = generateSingleImageLayers(scene, durationInFrames, theme);
      break;
    case 'quote':
      layers = generateQuoteLayers(scene, durationInFrames, theme);
      break;
    case 'stats':
      layers = generateStatsLayers(scene, durationInFrames, theme);
      break;
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
    case 'area-chart':
      layers = generateChartLayers(scene, durationInFrames, theme, scene.scene_type);
      break;
    default:
      layers = generateGenericLayers(scene, durationInFrames, theme);
  }

  // Add animation layer if specified
  const animationStyle = data?.animation_style;
  if (animationStyle && animationStyle !== 'none') {
    const animLayer = generateAnimationLayer(animationStyle, durationInFrames, theme);
    if (animLayer) {
      layers.unshift(animLayer); // Add at bottom (rendered first)
    }
  }

  return layers;
}

export function generateAEManifest(options) {
  const {
    video,
    scenes,
    fps = 30,
    width = 1920,
    height = 1080,
    theme = null,
  } = options;

  const totalFrames = scenes.reduce((max, scene) => Math.max(max, scene.end_frame), 0);
  const durationInSeconds = totalFrames / fps;

  const compositions = [];

  // Scene compositions
  const sceneCompositions = scenes.map((scene) => {
    const sceneStartFrame = scene.start_frame;
    const sceneEndFrame = scene.end_frame;
    const sceneDuration = sceneEndFrame - sceneStartFrame;

    return {
      id: `scene-${scene.id}`,
      name: scene.name || `Scene ${scene.scene_number}`,
      inPoint: sceneStartFrame,
      outPoint: sceneEndFrame,
      durationInFrames: sceneDuration,
      layers: generateSceneLayers(scene, theme, fps),
    };
  });

  // Main composition
  const mainComp = {
    id: 'main',
    name: video.title || 'Remotion Export',
    layers: sceneCompositions.map((sceneComp, index) => ({
      id: `precomp-${sceneComp.id}`,
      type: 'precomp',
      name: sceneComp.name,
      inPoint: scenes[index].start_frame,
      outPoint: scenes[index].end_frame,
      properties: [],
      content: {
        compositionId: sceneComp.id,
      },
    })),
  };

  compositions.push(mainComp);
  compositions.push(...sceneCompositions);

  return {
    version: '2.0',
    metadata: {
      name: video.title || 'Remotion Export',
      width,
      height,
      fps,
      durationInFrames: totalFrames,
      durationInSeconds,
      exportedAt: new Date().toISOString(),
      source: 'rendomat',
    },
    theme: theme
      ? {
          id: theme.id,
          name: theme.name,
          colors: theme.colors,
          fonts: theme.fonts,
        }
      : null,
    compositions,
    easingPresets: EASING_BEZIER_MAP,
    effectsMapping: CSS_FILTER_TO_AE,
    blendModes: CSS_BLEND_TO_AE,
  };
}

export function generateSelfContainedScript(manifest) {
  return `/**
 * Remotion to After Effects Import Script v2.0
 * Generated: ${new Date().toISOString()}
 *
 * Composition: "${manifest.metadata.name}"
 * Duration: ${manifest.metadata.durationInSeconds.toFixed(2)}s @ ${manifest.metadata.fps}fps
 *
 * This script creates compositions with full layer structure,
 * animations, effects, and blend modes.
 */

// =====================
// Embedded Manifest
// =====================
var MANIFEST = ${JSON.stringify(manifest, null, 2)};

// =====================
// Utility Functions
// =====================

function hexToRgb(hex) {
  var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
}

function bezierToKeyframeEase(bezier) {
  var x1 = bezier[0], y1 = bezier[1];
  var x2 = bezier[2], y2 = bezier[3];

  var inInfluence = Math.min(100, Math.max(0.1, (1 - x2) * 100));
  var inSpeed = (1 - x2) === 0 ? 0 : ((1 - y2) / (1 - x2));
  var outInfluence = Math.min(100, Math.max(0.1, x1 * 100));
  var outSpeed = x1 === 0 ? 0 : (y1 / x1);

  return {
    inEase: new KeyframeEase(inSpeed, inInfluence),
    outEase: new KeyframeEase(outSpeed, outInfluence)
  };
}

// =====================
// Blend Mode Mapping
// =====================

var BLEND_MODE_MAP = {
  'normal': BlendingMode.NORMAL,
  'multiply': BlendingMode.MULTIPLY,
  'screen': BlendingMode.SCREEN,
  'overlay': BlendingMode.OVERLAY,
  'darken': BlendingMode.DARKEN,
  'lighten': BlendingMode.LIGHTEN,
  'color-dodge': BlendingMode.COLOR_DODGE,
  'color-burn': BlendingMode.COLOR_BURN,
  'hard-light': BlendingMode.HARD_LIGHT,
  'soft-light': BlendingMode.SOFT_LIGHT,
  'difference': BlendingMode.DIFFERENCE,
  'exclusion': BlendingMode.EXCLUSION,
  'hue': BlendingMode.HUE,
  'saturation': BlendingMode.SATURATION,
  'color': BlendingMode.COLOR,
  'luminosity': BlendingMode.LUMINOSITY,
  'add': BlendingMode.ADD
};

// =====================
// Layer Creation
// =====================

function createSolidLayer(comp, layerData, fps) {
  var content = layerData.content;
  var color = hexToRgb(content.color);
  var layer = comp.layers.addSolid(
    color,
    layerData.name,
    content.width || comp.width,
    content.height || comp.height,
    1
  );

  layer.inPoint = layerData.inPoint / fps;
  layer.outPoint = layerData.outPoint / fps;

  return layer;
}

function createTextLayer(comp, layerData, fps) {
  var content = layerData.content;
  var layer = comp.layers.addText(content.text);

  var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
  var textDoc = textProp.value;

  textDoc.fontSize = content.fontSize || 48;
  textDoc.fillColor = hexToRgb(content.color || "#FFFFFF");
  textDoc.font = content.fontFamily || "Arial";
  textDoc.justification = content.textAlign === "center" ? ParagraphJustification.CENTER_JUSTIFY :
                          content.textAlign === "right" ? ParagraphJustification.RIGHT_JUSTIFY :
                          ParagraphJustification.LEFT_JUSTIFY;

  textProp.setValue(textDoc);

  if (content.position) {
    layer.property("Position").setValue(content.position);
  }

  layer.inPoint = layerData.inPoint / fps;
  layer.outPoint = layerData.outPoint / fps;

  return layer;
}

function createNullLayer(comp, layerData, fps) {
  var layer = comp.layers.addNull();
  layer.name = layerData.name;
  layer.inPoint = layerData.inPoint / fps;
  layer.outPoint = layerData.outPoint / fps;

  // Add metadata as marker if present
  if (layerData.metadata && layerData.metadata.note) {
    try {
      var marker = new MarkerValue(layerData.metadata.note);
      layer.property("Marker").setValueAtTime(0, marker);
    } catch(e) {}
  }

  return layer;
}

function createImagePlaceholder(comp, layerData, fps) {
  var content = layerData.content || {};
  var layer = comp.layers.addSolid(
    [0.3, 0.3, 0.3],
    layerData.name + " (Image Placeholder)",
    comp.width,
    comp.height,
    1
  );

  if (content.position) {
    layer.property("Position").setValue(content.position);
  }
  if (content.scale) {
    layer.property("Scale").setValue(content.scale);
  }

  layer.inPoint = layerData.inPoint / fps;
  layer.outPoint = layerData.outPoint / fps;

  if (content.source) {
    try {
      var marker = new MarkerValue("Source: " + content.source);
      layer.property("Marker").setValueAtTime(0, marker);
    } catch(e) {}
  }

  return layer;
}

function createAnimationLayer(comp, layerData, fps) {
  // Create a null layer with metadata about the animation
  var layer = comp.layers.addNull();
  layer.name = layerData.name;
  layer.inPoint = layerData.inPoint / fps;
  layer.outPoint = layerData.outPoint / fps;

  // Add marker with animation info
  var content = layerData.content || {};
  var note = "Animation Type: " + (content.animationType || "unknown");
  if (layerData.metadata && layerData.metadata.note) {
    note += "\\n" + layerData.metadata.note;
  }

  try {
    var marker = new MarkerValue(note);
    layer.property("Marker").setValueAtTime(0, marker);
  } catch(e) {}

  return layer;
}

function createLayer(comp, layerData, fps) {
  var layer = null;

  switch (layerData.type) {
    case "solid":
      layer = createSolidLayer(comp, layerData, fps);
      break;
    case "text":
      layer = createTextLayer(comp, layerData, fps);
      break;
    case "null":
      layer = createNullLayer(comp, layerData, fps);
      break;
    case "image":
      layer = createImagePlaceholder(comp, layerData, fps);
      break;
    case "animation":
      layer = createAnimationLayer(comp, layerData, fps);
      break;
    default:
      layer = createNullLayer(comp, layerData, fps);
  }

  if (layer) {
    layer.name = layerData.name;

    // Apply blend mode
    if (layerData.blendMode && BLEND_MODE_MAP[layerData.blendMode]) {
      layer.blendingMode = BLEND_MODE_MAP[layerData.blendMode];
    }
  }

  return layer;
}

// =====================
// Animation Application
// =====================

function applyAnimations(layer, properties, fps) {
  for (var i = 0; i < properties.length; i++) {
    var prop = properties[i];
    var aeProp;

    switch (prop.name) {
      case "opacity":
        aeProp = layer.property("Opacity");
        break;
      case "position":
        aeProp = layer.property("Position");
        break;
      case "scale":
        aeProp = layer.property("Scale");
        break;
      case "rotation":
        aeProp = layer.property("Rotation");
        break;
      default:
        continue;
    }

    if (!aeProp || !prop.keyframes || prop.keyframes.length === 0) continue;

    // Add keyframes
    for (var j = 0; j < prop.keyframes.length; j++) {
      var kf = prop.keyframes[j];
      var time = kf.frame / fps;
      aeProp.setValueAtTime(time, kf.value);
    }

    // Apply easing
    for (var k = 1; k <= aeProp.numKeys; k++) {
      var kfData = prop.keyframes[k - 1];
      if (!kfData || !kfData.easing) continue;

      if (kfData.easing.type === "hold") {
        aeProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
      } else if (kfData.easing.type === "bezier" && kfData.easing.bezier) {
        var ease = bezierToKeyframeEase(kfData.easing.bezier);
        try {
          aeProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);
          var dims = aeProp.propertyValueType === PropertyValueType.TwoD ||
                     aeProp.propertyValueType === PropertyValueType.TwoD_SPATIAL ? 2 :
                     aeProp.propertyValueType === PropertyValueType.ThreeD ||
                     aeProp.propertyValueType === PropertyValueType.ThreeD_SPATIAL ? 3 : 1;
          var inArr = [], outArr = [];
          for (var d = 0; d < dims; d++) {
            inArr.push(ease.inEase);
            outArr.push(ease.outEase);
          }
          aeProp.setTemporalEaseAtKey(k, inArr, outArr);
        } catch(e) {}
      }
    }
  }
}

// =====================
// Effects Application
// =====================

function applyEffects(layer, effects) {
  if (!effects || effects.length === 0) return;

  for (var i = 0; i < effects.length; i++) {
    var effectDef = effects[i];
    try {
      var effect = layer.property("ADBE Effect Parade").addProperty(effectDef.matchName);
      if (effect && effectDef.properties) {
        for (var propName in effectDef.properties) {
          if (effectDef.properties.hasOwnProperty(propName)) {
            try {
              var effProp = effect.property(propName);
              if (effProp) {
                effProp.setValue(effectDef.properties[propName]);
              }
            } catch(e2) {}
          }
        }
      }
    } catch(e) {
      // Effect may not be available
    }
  }
}

// =====================
// Main Import Function
// =====================

function importRemotionComposition() {
  if (!app.project) {
    alert("Please create or open a project first.");
    return;
  }

  var manifest = MANIFEST;
  var meta = manifest.metadata;

  // Progress window
  var progress = new Window("palette", "Importing Remotion Composition");
  progress.add("statictext", undefined, "Processing...");
  var bar = progress.add("progressbar", undefined, 0, 100);
  bar.preferredSize.width = 300;
  progress.show();

  app.beginUndoGroup("Import Remotion Composition");

  try {
    var compMap = {};
    var sceneComps = manifest.compositions.slice(1);
    var total = sceneComps.length + 1;

    // Create scene compositions
    for (var i = 0; i < sceneComps.length; i++) {
      var sceneData = sceneComps[i];
      progress.children[0].text = "Creating: " + sceneData.name;
      bar.value = (i / total) * 100;

      var sceneComp = app.project.items.addComp(
        sceneData.name,
        meta.width,
        meta.height,
        1,
        sceneData.durationInFrames / meta.fps,
        meta.fps
      );

      // Create layers (reverse order for AE stacking)
      var layers = sceneData.layers || [];
      for (var j = layers.length - 1; j >= 0; j--) {
        var layerData = layers[j];
        var layer = createLayer(sceneComp, layerData, meta.fps);

        if (layer && layerData.properties && layerData.properties.length > 0) {
          applyAnimations(layer, layerData.properties, meta.fps);
        }

        if (layer && layerData.effects) {
          applyEffects(layer, layerData.effects);
        }
      }

      compMap[sceneData.id] = sceneComp;
    }

    // Create main composition
    progress.children[0].text = "Creating main composition...";
    bar.value = 90;

    var mainComp = app.project.items.addComp(
      meta.name,
      meta.width,
      meta.height,
      1,
      meta.durationInSeconds,
      meta.fps
    );

    var mainCompData = manifest.compositions[0];
    if (mainCompData && mainCompData.layers) {
      for (var k = mainCompData.layers.length - 1; k >= 0; k--) {
        var precompData = mainCompData.layers[k];
        if (precompData.type === "precomp" && precompData.content) {
          var sourceComp = compMap[precompData.content.compositionId];
          if (sourceComp) {
            var precompLayer = mainComp.layers.add(sourceComp);
            precompLayer.name = precompData.name;
            precompLayer.inPoint = precompData.inPoint / meta.fps;
            precompLayer.outPoint = precompData.outPoint / meta.fps;
          }
        }
      }
    }

    bar.value = 100;
    progress.close();

    alert("Import Complete!\\n\\n" +
          "Composition: " + meta.name + "\\n" +
          "Duration: " + meta.durationInSeconds.toFixed(2) + "s\\n" +
          "FPS: " + meta.fps + "\\n" +
          "Scenes: " + sceneComps.length + "\\n\\n" +
          "Notes:\\n" +
          "- Image placeholders need manual replacement\\n" +
          "- Animation layers contain setup notes\\n" +
          "- Check markers for additional info");

  } catch(e) {
    progress.close();
    alert("Import error: " + e.message + "\\nLine: " + e.line);
  }

  app.endUndoGroup();
}

// Run import
importRemotionComposition();
`;
}

export default {
  generateAEManifest,
  generateSelfContainedScript,
  EASING_BEZIER_MAP,
  CSS_FILTER_TO_AE,
  CSS_BLEND_TO_AE,
  parseCSSFilters,
  parseClipPath,
  parseCSSTransform,
  parseGradient,
  springToAEExpression,
  interpolateToAEExpression,
};
