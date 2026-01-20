/**
 * Expression Generator for After Effects
 *
 * Generates AE expressions that replicate Remotion animation behaviors
 * including spring physics, interpolation, and dynamic animations
 */

var ExpressionGenerator = (function() {
  'use strict';

  // =====================
  // Spring Physics
  // =====================

  /**
   * Generate spring animation expression
   * Replicates Remotion's spring() function behavior
   *
   * @param {Object} config - Spring configuration
   * @param {number} config.damping - Damping ratio (default: 10)
   * @param {number} config.mass - Mass (default: 1)
   * @param {number} config.stiffness - Stiffness (default: 100)
   * @param {boolean} config.overshootClamping - Clamp overshoot (default: false)
   * @param {*} startValue - Animation start value
   * @param {*} endValue - Animation end value
   * @param {number} startFrame - Frame to start animation (optional)
   * @returns {string} AE expression
   */
  function springExpression(config, startValue, endValue, startFrame) {
    config = config || {};
    var damping = config.damping !== undefined ? config.damping : 10;
    var mass = config.mass !== undefined ? config.mass : 1;
    var stiffness = config.stiffness !== undefined ? config.stiffness : 100;
    var overshootClamping = config.overshootClamping || false;
    startFrame = startFrame || 0;

    return [
      '// Spring Animation Expression',
      '// Damping: ' + damping + ', Mass: ' + mass + ', Stiffness: ' + stiffness,
      '',
      'var damping = ' + damping + ';',
      'var mass = ' + mass + ';',
      'var stiffness = ' + stiffness + ';',
      'var overshootClamping = ' + overshootClamping + ';',
      '',
      'var startValue = ' + JSON.stringify(startValue) + ';',
      'var endValue = ' + JSON.stringify(endValue) + ';',
      'var startFrame = ' + startFrame + ';',
      '',
      'var fps = thisComp.frameRate;',
      'var frame = time * fps;',
      'var t = Math.max(0, (frame - startFrame) / fps);',
      '',
      'var omega = Math.sqrt(stiffness / mass);',
      'var zeta = damping / (2 * Math.sqrt(stiffness * mass));',
      '',
      'var progress;',
      'if (zeta < 1) {',
      '  // Underdamped',
      '  var omegaD = omega * Math.sqrt(1 - zeta * zeta);',
      '  var envelope = Math.exp(-zeta * omega * t);',
      '  var oscillation = Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t);',
      '  progress = 1 - envelope * oscillation;',
      '} else if (zeta === 1) {',
      '  // Critically damped',
      '  progress = 1 - Math.exp(-omega * t) * (1 + omega * t);',
      '} else {',
      '  // Overdamped',
      '  var s1 = omega * (-zeta + Math.sqrt(zeta * zeta - 1));',
      '  var s2 = omega * (-zeta - Math.sqrt(zeta * zeta - 1));',
      '  progress = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);',
      '}',
      '',
      'if (overshootClamping) {',
      '  progress = clamp(progress, 0, 1);',
      '}',
      '',
      '// Interpolate between values',
      'linear(progress, 0, 1, startValue, endValue);'
    ].join('\n');
  }

  // =====================
  // Interpolation
  // =====================

  /**
   * Generate interpolation expression
   * Replicates Remotion's interpolate() function
   *
   * @param {Array} inputRange - Input frame range [start, end]
   * @param {Array} outputRange - Output value range [start, end]
   * @param {Object} options - Interpolation options
   * @returns {string} AE expression
   */
  function interpolateExpression(inputRange, outputRange, options) {
    options = options || {};
    var extrapolateLeft = options.extrapolateLeft || 'extend';
    var extrapolateRight = options.extrapolateRight || 'extend';
    var easing = options.easing || 'linear';

    // Generate easing function code
    var easingCode = generateEasingCode(easing);

    return [
      '// Interpolation Expression',
      '',
      'var inputRange = ' + JSON.stringify(inputRange) + ';',
      'var outputRange = ' + JSON.stringify(outputRange) + ';',
      '',
      easingCode,
      '',
      'var fps = thisComp.frameRate;',
      'var frame = time * fps;',
      '',
      '// Find segment',
      'var segmentIndex = 0;',
      'for (var i = 0; i < inputRange.length - 1; i++) {',
      '  if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {',
      '    segmentIndex = i;',
      '    break;',
      '  }',
      '  if (frame > inputRange[i + 1]) segmentIndex = i + 1;',
      '}',
      '',
      '// Calculate progress',
      'var progress;',
      'if (frame < inputRange[0]) {',
      '  ' + (extrapolateLeft === 'clamp' ? 'progress = 0;' : 'progress = (frame - inputRange[0]) / (inputRange[1] - inputRange[0]);'),
      '  segmentIndex = 0;',
      '} else if (frame > inputRange[inputRange.length - 1]) {',
      '  ' + (extrapolateRight === 'clamp' ? 'progress = 1;' : 'var lastIdx = inputRange.length - 1; progress = 1 + (frame - inputRange[lastIdx]) / (inputRange[lastIdx] - inputRange[lastIdx - 1]);'),
      '  segmentIndex = inputRange.length - 2;',
      '} else {',
      '  progress = (frame - inputRange[segmentIndex]) / (inputRange[segmentIndex + 1] - inputRange[segmentIndex]);',
      '}',
      '',
      '// Apply easing',
      'var easedProgress = applyEasing(progress);',
      '',
      '// Output value',
      'linear(easedProgress, 0, 1, outputRange[segmentIndex], outputRange[Math.min(segmentIndex + 1, outputRange.length - 1)]);'
    ].join('\n');
  }

  /**
   * Generate easing function code
   * @param {string} easing - Easing name or bezier array
   * @returns {string} Easing function code
   */
  function generateEasingCode(easing) {
    if (easing === 'linear') {
      return 'function applyEasing(t) { return t; }';
    }

    // Bezier presets
    var bezierMap = {
      'ease': [0.25, 0.1, 0.25, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1],
      'ease-in-cubic': [0.55, 0.055, 0.675, 0.19],
      'ease-out-cubic': [0.215, 0.61, 0.355, 1],
      'ease-in-out-cubic': [0.645, 0.045, 0.355, 1],
      'ease-out-back': [0.175, 0.885, 0.32, 1.275],
      'ease-in-back': [0.6, -0.28, 0.735, 0.045]
    };

    var bezier = bezierMap[easing] || bezierMap['ease'];

    return [
      'function cubicBezier(t, x1, y1, x2, y2) {',
      '  var cx = 3 * x1;',
      '  var bx = 3 * (x2 - x1) - cx;',
      '  var ax = 1 - cx - bx;',
      '  var cy = 3 * y1;',
      '  var by = 3 * (y2 - y1) - cy;',
      '  var ay = 1 - cy - by;',
      '  ',
      '  function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }',
      '  function sampleY(t) { return ((ay * t + by) * t + cy) * t; }',
      '  function sampleDerivX(t) { return (3 * ax * t + 2 * bx) * t + cx; }',
      '  ',
      '  var guessT = t;',
      '  for (var i = 0; i < 4; i++) {',
      '    var currentSlope = sampleDerivX(guessT);',
      '    if (Math.abs(currentSlope) < 0.00001) break;',
      '    var currentX = sampleX(guessT) - t;',
      '    guessT -= currentX / currentSlope;',
      '  }',
      '  return sampleY(guessT);',
      '}',
      '',
      'function applyEasing(t) {',
      '  return cubicBezier(t, ' + bezier.join(', ') + ');',
      '}'
    ].join('\n');
  }

  // =====================
  // Wave Animations
  // =====================

  /**
   * Generate sine wave expression
   * @param {Object} options - Wave options
   * @returns {string} AE expression
   */
  function sineWaveExpression(options) {
    options = options || {};
    var amplitude = options.amplitude !== undefined ? options.amplitude : 50;
    var frequency = options.frequency !== undefined ? options.frequency : 1;
    var phase = options.phase !== undefined ? options.phase : 0;
    var offset = options.offset !== undefined ? options.offset : 0;

    return [
      '// Sine Wave Animation',
      'var amplitude = ' + amplitude + ';',
      'var frequency = ' + frequency + ';',
      'var phase = ' + phase + ';',
      'var offset = ' + offset + ';',
      '',
      'offset + amplitude * Math.sin((time * frequency * 2 * Math.PI) + phase);'
    ].join('\n');
  }

  /**
   * Generate wiggle expression (native AE wiggle)
   * @param {number} freq - Wiggles per second
   * @param {number} amp - Amplitude
   * @returns {string} AE expression
   */
  function wiggleExpression(freq, amp) {
    return 'wiggle(' + freq + ', ' + amp + ')';
  }

  /**
   * Generate looping animation expression
   * @param {Object} options - Loop options
   * @returns {string} AE expression
   */
  function loopExpression(options) {
    options = options || {};
    var loopType = options.type || 'cycle'; // cycle, pingpong, offset, continue
    var numKeyframes = options.numKeyframes || 0;

    if (loopType === 'pingpong') {
      return 'loopOut("pingpong", ' + numKeyframes + ')';
    } else if (loopType === 'offset') {
      return 'loopOut("offset", ' + numKeyframes + ')';
    } else if (loopType === 'continue') {
      return 'loopOut("continue", ' + numKeyframes + ')';
    }
    return 'loopOut("cycle", ' + numKeyframes + ')';
  }

  // =====================
  // Position Animations
  // =====================

  /**
   * Generate circular motion expression
   * @param {Object} options - Motion options
   * @returns {string} AE expression
   */
  function circularMotionExpression(options) {
    options = options || {};
    var centerX = options.centerX !== undefined ? options.centerX : 'thisComp.width / 2';
    var centerY = options.centerY !== undefined ? options.centerY : 'thisComp.height / 2';
    var radius = options.radius !== undefined ? options.radius : 100;
    var speed = options.speed !== undefined ? options.speed : 1;
    var startAngle = options.startAngle !== undefined ? options.startAngle : 0;

    return [
      '// Circular Motion',
      'var centerX = ' + centerX + ';',
      'var centerY = ' + centerY + ';',
      'var radius = ' + radius + ';',
      'var speed = ' + speed + ';',
      'var startAngle = ' + startAngle + ' * Math.PI / 180;',
      '',
      'var angle = startAngle + (time * speed * 2 * Math.PI);',
      '[centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];'
    ].join('\n');
  }

  /**
   * Generate follow/inertia expression
   * @param {Object} options - Inertia options
   * @returns {string} AE expression
   */
  function inertiaExpression(options) {
    options = options || {};
    var friction = options.friction !== undefined ? options.friction : 0.7;

    return [
      '// Inertia/Follow Animation',
      'var friction = ' + friction + ';',
      '',
      'var n = 0;',
      'if (numKeys > 0) {',
      '  n = nearestKey(time).index;',
      '  if (key(n).time > time) n--;',
      '}',
      '',
      'if (n > 0) {',
      '  var t = time - key(n).time;',
      '  var v = velocityAtTime(key(n).time - 0.001);',
      '  value + v * t * Math.pow(friction, t * thisComp.frameRate);',
      '} else {',
      '  value;',
      '}'
    ].join('\n');
  }

  // =====================
  // Text Animations
  // =====================

  /**
   * Generate typewriter effect expression (for Source Text)
   * @param {Object} options - Typewriter options
   * @returns {string} AE expression
   */
  function typewriterExpression(options) {
    options = options || {};
    var charsPerSecond = options.speed || 10;
    var fullText = options.text || '';

    return [
      '// Typewriter Effect',
      'var fullText = "' + fullText.replace(/"/g, '\\"') + '";',
      'var charsPerSecond = ' + charsPerSecond + ';',
      '',
      'var numChars = Math.floor(time * charsPerSecond);',
      'fullText.substring(0, Math.min(numChars, fullText.length));'
    ].join('\n');
  }

  /**
   * Generate counting number expression
   * @param {Object} options - Counter options
   * @returns {string} AE expression
   */
  function counterExpression(options) {
    options = options || {};
    var startValue = options.startValue !== undefined ? options.startValue : 0;
    var endValue = options.endValue !== undefined ? options.endValue : 100;
    var duration = options.duration !== undefined ? options.duration : 2;
    var decimals = options.decimals !== undefined ? options.decimals : 0;
    var prefix = options.prefix || '';
    var suffix = options.suffix || '';

    return [
      '// Counting Number',
      'var startValue = ' + startValue + ';',
      'var endValue = ' + endValue + ';',
      'var duration = ' + duration + ';',
      'var decimals = ' + decimals + ';',
      'var prefix = "' + prefix + '";',
      'var suffix = "' + suffix + '";',
      '',
      'var progress = Math.min(1, time / duration);',
      'var easedProgress = progress * progress * (3 - 2 * progress); // Smooth step',
      'var currentValue = startValue + (endValue - startValue) * easedProgress;',
      '',
      'prefix + currentValue.toFixed(decimals) + suffix;'
    ].join('\n');
  }

  // =====================
  // Utility Expressions
  // =====================

  /**
   * Generate time remap expression
   * @param {number} speedFactor - Speed multiplier
   * @param {number} startTime - Start time offset
   * @returns {string} AE expression
   */
  function timeRemapExpression(speedFactor, startTime) {
    speedFactor = speedFactor !== undefined ? speedFactor : 1;
    startTime = startTime !== undefined ? startTime : 0;

    return [
      '// Time Remap',
      'var speedFactor = ' + speedFactor + ';',
      'var startTime = ' + startTime + ';',
      '',
      'startTime + (time * speedFactor);'
    ].join('\n');
  }

  /**
   * Generate expression to link to another property
   * @param {string} layerName - Target layer name
   * @param {string} propertyPath - Property path (e.g., "Position")
   * @returns {string} AE expression
   */
  function linkExpression(layerName, propertyPath) {
    return 'thisComp.layer("' + layerName + '").effect("' + propertyPath + '")("Slider")';
  }

  /**
   * Apply expression to a property
   * @param {Property} property - The AE property
   * @param {string} expression - The expression string
   * @returns {boolean} Success status
   */
  function applyExpression(property, expression) {
    try {
      if (property && property.canSetExpression) {
        property.expression = expression;
        return true;
      }
    } catch (e) {
      // Expression application failed
    }
    return false;
  }

  // =====================
  // Public API
  // =====================

  return {
    springExpression: springExpression,
    interpolateExpression: interpolateExpression,
    sineWaveExpression: sineWaveExpression,
    wiggleExpression: wiggleExpression,
    loopExpression: loopExpression,
    circularMotionExpression: circularMotionExpression,
    inertiaExpression: inertiaExpression,
    typewriterExpression: typewriterExpression,
    counterExpression: counterExpression,
    timeRemapExpression: timeRemapExpression,
    linkExpression: linkExpression,
    applyExpression: applyExpression,
    generateEasingCode: generateEasingCode
  };

})();
