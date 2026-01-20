/**
 * Keyframe Utilities for After Effects
 *
 * Handles application of keyframe animations from Remotion manifests
 * to After Effects layer properties.
 */

var KeyframeUtils = (function() {
  'use strict';

  // =====================
  // Property Mapping
  // =====================

  /**
   * Map manifest property names to AE property match names
   */
  var PROPERTY_MAP = {
    // Transform properties
    'position': 'Position',
    'Position': 'Position',
    'ADBE Position': 'Position',

    'scale': 'Scale',
    'Scale': 'Scale',
    'ADBE Scale': 'Scale',

    'rotation': 'Rotation',
    'Rotation': 'Rotation',
    'ADBE Rotate Z': 'Rotation',
    'rotationZ': 'Rotation',

    'opacity': 'Opacity',
    'Opacity': 'Opacity',
    'ADBE Opacity': 'Opacity',

    'anchorPoint': 'Anchor Point',
    'anchor_point': 'Anchor Point',
    'Anchor Point': 'Anchor Point',
    'ADBE Anchor Point': 'Anchor Point',

    // 3D properties
    'rotationX': 'X Rotation',
    'rotation_x': 'X Rotation',
    'rotationY': 'Y Rotation',
    'rotation_y': 'Y Rotation',
    'rotationZ': 'Z Rotation',
    'rotation_z': 'Z Rotation',
    'orientation': 'Orientation',

    // Audio
    'audioLevels': 'Audio Levels',
    'audio_levels': 'Audio Levels',
  };

  /**
   * Get the AE property from a layer by manifest property name
   * @param {Layer} layer - The AE layer
   * @param {string} propName - Property name from manifest
   * @returns {Property|null} The AE property or null
   */
  function getLayerProperty(layer, propName) {
    var aePropName = PROPERTY_MAP[propName] || propName;

    // Try transform group first (most common)
    try {
      var transformGroup = layer.property('ADBE Transform Group');
      if (transformGroup) {
        var prop = transformGroup.property(aePropName);
        if (prop) return prop;
      }
    } catch (e) {
      // Property not found in transform, continue
    }

    // Try direct property access
    try {
      var directProp = layer.property(aePropName);
      if (directProp) return directProp;
    } catch (e) {
      // Property not found
    }

    // For text layers, try text properties
    if (layer instanceof TextLayer) {
      try {
        var textProp = layer.property('ADBE Text Properties');
        if (textProp) {
          var animator = textProp.property(aePropName);
          if (animator) return animator;
        }
      } catch (e) {
        // Not a text property
      }
    }

    return null;
  }

  // =====================
  // Keyframe Application
  // =====================

  /**
   * Add keyframes to a property
   * @param {Property} property - The AE property
   * @param {Array} keyframes - Array of keyframe definitions
   * @param {number} fps - Frames per second
   */
  function addKeyframes(property, keyframes, fps) {
    if (!property || !property.canVaryOverTime) {
      return;
    }

    // Add each keyframe
    for (var i = 0; i < keyframes.length; i++) {
      var kf = keyframes[i];
      var time = kf.frame / fps;
      var value = kf.value;

      // Handle array values (position, scale, etc.)
      if (value instanceof Array) {
        // Ensure correct dimension for the property
        if (property.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
            property.propertyValueType === PropertyValueType.TwoD) {
          if (value.length < 2) value = [value[0] || 0, value[0] || 0];
        } else if (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
                   property.propertyValueType === PropertyValueType.ThreeD) {
          if (value.length < 3) value = [value[0] || 0, value[1] || 0, value[2] || 0];
        }
      }

      property.setValueAtTime(time, value);
    }
  }

  /**
   * Apply easing to keyframes
   * @param {Property} property - The AE property with keyframes
   * @param {Array} keyframes - Keyframe definitions with easing info
   * @param {number} fps - Frames per second
   */
  function applyEasing(property, keyframes, fps) {
    if (!property || property.numKeys === 0) {
      return;
    }

    for (var i = 1; i <= property.numKeys; i++) {
      var kfData = keyframes[i - 1];
      if (!kfData || !kfData.easing) continue;

      var easing = kfData.easing;

      switch (easing.type) {
        case 'hold':
          // Set interpolation to hold
          property.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD);
          break;

        case 'linear':
          // Set interpolation to linear
          property.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR);
          break;

        case 'bezier':
          if (easing.bezier) {
            applyBezierEasing(property, i, easing.bezier);
          }
          break;

        case 'preset':
          if (easing.preset && BezierEasing.PRESETS[easing.preset]) {
            applyBezierEasing(property, i, BezierEasing.PRESETS[easing.preset]);
          }
          break;

        default:
          // Keep default interpolation
          break;
      }
    }
  }

  /**
   * Apply bezier easing to a specific keyframe
   * @param {Property} property - The AE property
   * @param {number} keyIndex - Index of the keyframe (1-based)
   * @param {Array} bezier - Bezier control points [x1, y1, x2, y2]
   */
  function applyBezierEasing(property, keyIndex, bezier) {
    try {
      // Convert bezier to KeyframeEase
      var ease = BezierEasing.toKeyframeEase(bezier);

      // Set interpolation type to Bezier
      property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER);

      // For spatial properties, we also need to set spatial tangents
      var isSpatial = property.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
                      property.propertyValueType === PropertyValueType.ThreeD_SPATIAL;

      // Apply temporal ease
      // AE expects arrays of KeyframeEase for each dimension
      var numDimensions = getPropertyDimensions(property);
      var inEaseArray = [];
      var outEaseArray = [];

      for (var d = 0; d < numDimensions; d++) {
        inEaseArray.push(ease.inEase);
        outEaseArray.push(ease.outEase);
      }

      property.setTemporalEaseAtKey(keyIndex, inEaseArray, outEaseArray);

    } catch (e) {
      // Silently fail - some properties may not support easing
      // $.writeln('Easing error: ' + e.message);
    }
  }

  /**
   * Get number of dimensions for a property
   * @param {Property} property - The AE property
   * @returns {number} Number of dimensions
   */
  function getPropertyDimensions(property) {
    switch (property.propertyValueType) {
      case PropertyValueType.OneD:
      case PropertyValueType.MARKER:
      case PropertyValueType.LAYER_INDEX:
      case PropertyValueType.MASK_INDEX:
        return 1;

      case PropertyValueType.TwoD:
      case PropertyValueType.TwoD_SPATIAL:
        return 2;

      case PropertyValueType.ThreeD:
      case PropertyValueType.ThreeD_SPATIAL:
      case PropertyValueType.COLOR:
        return 3;

      default:
        return 1;
    }
  }

  // =====================
  // Expression Handling
  // =====================

  /**
   * Apply expression to a property
   * @param {Property} property - The AE property
   * @param {string} expression - The expression string
   * @param {number} fps - Frames per second
   */
  function applyExpression(property, expression, fps) {
    if (!property || !property.canSetExpression || !expression) {
      return;
    }

    try {
      // Convert Remotion-style expressions to AE
      var aeExpression = convertExpression(expression, fps);
      property.expression = aeExpression;
    } catch (e) {
      // Expression failed - silently continue
      // $.writeln('Expression error: ' + e.message);
    }
  }

  /**
   * Convert Remotion expression patterns to AE expression syntax
   * @param {string} expr - Remotion expression
   * @param {number} fps - Frames per second
   * @returns {string} AE expression
   */
  function convertExpression(expr, fps) {
    var result = expr;

    // Convert frame to time-based
    // Remotion: frame
    // AE: time * fps
    result = result.replace(/\bframe\b/g, '(time * ' + fps + ')');

    // Convert durationInFrames to duration
    result = result.replace(/\bdurationInFrames\b/g, '(thisComp.duration * ' + fps + ')');

    // Convert Math functions (should work as-is in both)
    // Math.sin, Math.cos, Math.abs, etc. are the same

    // Convert Remotion interpolate to AE linear
    // Basic pattern: interpolate(value, [a, b], [c, d])
    // This is a simplified conversion
    result = result.replace(
      /interpolate\s*\(\s*([^,]+)\s*,\s*\[\s*([^,]+)\s*,\s*([^\]]+)\s*\]\s*,\s*\[\s*([^,]+)\s*,\s*([^\]]+)\s*\]\s*\)/g,
      'linear($1, $2, $3, $4, $5)'
    );

    return result;
  }

  // =====================
  // Main Animation Function
  // =====================

  /**
   * Apply all animations from manifest to a layer
   * @param {Layer} layer - The AE layer
   * @param {Array} properties - Array of animated property definitions
   * @param {number} fps - Frames per second
   */
  function applyAnimations(layer, properties, fps) {
    if (!layer || !properties || properties.length === 0) {
      return;
    }

    for (var i = 0; i < properties.length; i++) {
      var propDef = properties[i];

      // Get the AE property
      var aeProp = getLayerProperty(layer, propDef.name);
      if (!aeProp) {
        continue;
      }

      // If there's an expression, apply it
      if (propDef.expression) {
        applyExpression(aeProp, propDef.expression, fps);
        continue;
      }

      // If there are keyframes, add them
      if (propDef.keyframes && propDef.keyframes.length > 0) {
        addKeyframes(aeProp, propDef.keyframes, fps);
        applyEasing(aeProp, propDef.keyframes, fps);
      }
    }
  }

  // =====================
  // Public API
  // =====================

  return {
    applyAnimations: applyAnimations,
    getLayerProperty: getLayerProperty,
    addKeyframes: addKeyframes,
    applyEasing: applyEasing,
    applyBezierEasing: applyBezierEasing,
    applyExpression: applyExpression,
    convertExpression: convertExpression,
    PROPERTY_MAP: PROPERTY_MAP
  };

})();
