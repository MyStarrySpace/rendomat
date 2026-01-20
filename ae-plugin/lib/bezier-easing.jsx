/**
 * Bezier Easing Utilities for After Effects
 *
 * Converts CSS cubic-bezier curves to After Effects KeyframeEase parameters.
 * This bridges Remotion's easing system with AE's keyframe interpolation.
 */

var BezierEasing = (function() {
  'use strict';

  // =====================
  // Constants
  // =====================

  /**
   * Standard easing presets as cubic bezier values
   * Format: [x1, y1, x2, y2] for cubic-bezier(x1, y1, x2, y2)
   */
  var PRESETS = {
    'linear': [0, 0, 1, 1],
    'ease': [0.25, 0.1, 0.25, 1],
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
  };

  // =====================
  // Core Functions
  // =====================

  /**
   * Get preset bezier values by name
   * @param {string} name - Preset name
   * @returns {Array|null} Bezier values [x1, y1, x2, y2] or null
   */
  function getPreset(name) {
    return PRESETS[name] || null;
  }

  /**
   * Calculate the speed component for KeyframeEase
   * Speed represents the velocity of the property at the keyframe
   *
   * @param {number} x - X control point
   * @param {number} y - Y control point
   * @param {string} direction - 'in' or 'out'
   * @returns {number} Speed value
   */
  function calculateSpeed(x, y, direction) {
    if (direction === 'in') {
      // Incoming ease: tangent from (1,1) through (x2, y2)
      if ((1 - x) === 0) return 0;
      return ((1 - y) / (1 - x));
    } else {
      // Outgoing ease: tangent from (0,0) through (x1, y1)
      if (x === 0) return 0;
      return (y / x);
    }
  }

  /**
   * Calculate the influence component for KeyframeEase
   * Influence controls how much the easing affects the interpolation (0.1-100%)
   *
   * @param {number} x - X control point
   * @param {number} y - Y control point
   * @param {string} direction - 'in' or 'out'
   * @returns {number} Influence value (0.1-100)
   */
  function calculateInfluence(x, y, direction) {
    var influence;

    if (direction === 'in') {
      // Incoming influence based on distance from (1,1) to (x2, y2)
      influence = (1 - x) * 100;
    } else {
      // Outgoing influence based on distance from (0,0) to (x1, y1)
      influence = x * 100;
    }

    // Clamp to AE's valid range
    return Math.max(0.1, Math.min(100, influence));
  }

  /**
   * Convert cubic bezier control points to After Effects KeyframeEase objects
   *
   * CSS cubic-bezier: P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)
   *
   * For AE keyframe easing:
   * - Incoming ease (easeIn) controls how the value approaches THIS keyframe
   * - Outgoing ease (easeOut) controls how the value leaves THIS keyframe
   *
   * @param {Array} bezier - Control points [x1, y1, x2, y2]
   * @returns {Object} Object with inEase and outEase KeyframeEase objects
   */
  function toKeyframeEase(bezier) {
    if (!bezier || bezier.length !== 4) {
      // Default to linear
      return {
        inEase: new KeyframeEase(0, 33.33),
        outEase: new KeyframeEase(0, 33.33)
      };
    }

    var x1 = bezier[0];
    var y1 = bezier[1];
    var x2 = bezier[2];
    var y2 = bezier[3];

    // Calculate incoming ease (uses x2, y2 - the second control point)
    var inSpeed = calculateSpeed(x2, y2, 'in');
    var inInfluence = calculateInfluence(x2, y2, 'in');

    // Calculate outgoing ease (uses x1, y1 - the first control point)
    var outSpeed = calculateSpeed(x1, y1, 'out');
    var outInfluence = calculateInfluence(x1, y1, 'out');

    return {
      inEase: new KeyframeEase(inSpeed, inInfluence),
      outEase: new KeyframeEase(outSpeed, outInfluence)
    };
  }

  /**
   * Convert easing definition from manifest to KeyframeEase
   * Handles different easing types: linear, bezier, hold
   *
   * @param {Object} easingDef - Easing definition from manifest
   * @returns {Object} Object with inEase, outEase, and optional interpolationType
   */
  function fromEasingDefinition(easingDef) {
    if (!easingDef) {
      return toKeyframeEase(PRESETS['linear']);
    }

    switch (easingDef.type) {
      case 'linear':
        return toKeyframeEase(PRESETS['linear']);

      case 'bezier':
        if (easingDef.bezier) {
          return toKeyframeEase(easingDef.bezier);
        }
        return toKeyframeEase(PRESETS['linear']);

      case 'hold':
        return {
          inEase: new KeyframeEase(0, 33.33),
          outEase: new KeyframeEase(0, 33.33),
          interpolationType: KeyframeInterpolationType.HOLD
        };

      case 'preset':
        if (easingDef.preset && PRESETS[easingDef.preset]) {
          return toKeyframeEase(PRESETS[easingDef.preset]);
        }
        return toKeyframeEase(PRESETS['linear']);

      default:
        return toKeyframeEase(PRESETS['linear']);
    }
  }

  /**
   * Apply "Easy Ease" preset (common AE animation style)
   * @returns {Object} KeyframeEase objects for easy ease
   */
  function easyEase() {
    return {
      inEase: new KeyframeEase(0, 33.33),
      outEase: new KeyframeEase(0, 33.33)
    };
  }

  /**
   * Apply "Easy Ease In" preset
   * @returns {Object} KeyframeEase objects
   */
  function easyEaseIn() {
    return {
      inEase: new KeyframeEase(0, 75),
      outEase: new KeyframeEase(0, 33.33)
    };
  }

  /**
   * Apply "Easy Ease Out" preset
   * @returns {Object} KeyframeEase objects
   */
  function easyEaseOut() {
    return {
      inEase: new KeyframeEase(0, 33.33),
      outEase: new KeyframeEase(0, 75)
    };
  }

  // =====================
  // Public API
  // =====================

  return {
    PRESETS: PRESETS,
    getPreset: getPreset,
    toKeyframeEase: toKeyframeEase,
    fromEasingDefinition: fromEasingDefinition,
    easyEase: easyEase,
    easyEaseIn: easyEaseIn,
    easyEaseOut: easyEaseOut,
    calculateSpeed: calculateSpeed,
    calculateInfluence: calculateInfluence
  };

})();
