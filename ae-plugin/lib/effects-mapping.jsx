/**
 * Effects Mapping for After Effects
 *
 * Maps CSS/web effects to After Effects native effects
 * Handles filter chains, blend modes, and effect parameters
 */

var EffectsMapping = (function() {
  'use strict';

  // =====================
  // Effect Match Names
  // =====================

  /**
   * AE effect match names for common effects
   */
  var EFFECT_MATCH_NAMES = {
    // Blur effects
    'gaussianBlur': 'ADBE Gaussian Blur 2',
    'boxBlur': 'ADBE Box Blur2',
    'directionalBlur': 'ADBE Motion Blur',
    'radialBlur': 'ADBE Radial Blur',
    'fastBlur': 'ADBE Fast Blur',
    'cameraLensBlur': 'ADBE Camera Lens Blur',

    // Color correction
    'brightnessContrast': 'ADBE Brightness & Contrast 2',
    'hueSaturation': 'ADBE HUE SATURATION',
    'levels': 'ADBE Pro Levels2',
    'curves': 'ADBE CurvesCustom',
    'colorBalance': 'ADBE Color Balance 2',
    'tint': 'ADBE Tint',
    'invert': 'ADBE Invert',
    'blackAndWhite': 'ADBE Black&White',
    'exposure': 'ADBE Exposure2',
    'vibrance': 'ADBE Vibrance',

    // Stylize
    'dropShadow': 'ADBE Drop Shadow',
    'glow': 'ADBE Glo2',
    'bevelAlpha': 'ADBE Bevel Alpha',
    'motionTile': 'ADBE Motion Tile',
    'posterize': 'ADBE Posterize',
    'roughenEdges': 'ADBE Roughen Edges',
    'scatter': 'ADBE Scatter',
    'strobe': 'ADBE Strobe',

    // Distort
    'turbulentDisplace': 'ADBE Turbulent Displace',
    'waveWarp': 'ADBE Wave Warp',
    'spherize': 'ADBE Spherize',
    'twirl': 'ADBE Twirl',
    'bulge': 'ADBE Bulge',
    'ripple': 'ADBE Ripple',
    'displacement': 'ADBE Displacement Map',

    // Generate
    'fill': 'ADBE Fill',
    'stroke': 'ADBE Stroke',
    'gradientRamp': 'ADBE Ramp',
    '4ColorGradient': 'ADBE 4ColorGradient',
    'checkerboard': 'ADBE Checkerboard',
    'grid': 'ADBE Grid',
    'fractalNoise': 'ADBE Fractal Noise',
    'cellPattern': 'ADBE Cell Pattern',

    // Transition
    'linearWipe': 'ADBE Linear Wipe',
    'radialWipe': 'ADBE Radial Wipe',
    'venetianBlinds': 'ADBE Venetian Blinds',
    'blockDissolve': 'ADBE Block Dissolve',

    // Matte
    'setMatte': 'ADBE Set Matte3',
    'simpleFringe': 'ADBE Simple Choker',
    'miniMax': 'ADBE Minimax',

    // Keying
    'keylight': 'Keylight 906',
    'colorKey': 'ADBE Color Key',

    // Third-party (commonly available)
    'ccParticleWorld': 'CC Particle World',
    'ccLens': 'CC Lens',
    'ccBall': 'CC Ball Action',
    'ccMrMercury': 'CC Mr. Mercury',
    'ccStarBurst': 'CC Star Burst'
  };

  // =====================
  // CSS Filter Conversions
  // =====================

  /**
   * Convert CSS blur to AE Gaussian Blur
   */
  function convertBlur(value, layer) {
    var px = parseFloat(value);
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.gaussianBlur);
      effect.property('ADBE Gaussian Blur 2-0001').setValue(px);
      effect.property('ADBE Gaussian Blur 2-0002').setValue(true); // Repeat Edge Pixels
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS brightness to AE Brightness & Contrast
   */
  function convertBrightness(value, layer) {
    var val = parseFloat(value);
    var brightness = (val - 1) * 100; // CSS: 1 = normal, AE: 0 = normal
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.brightnessContrast);
      effect.property('ADBE Brightness & Contrast 2-0001').setValue(brightness);
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS contrast to AE Brightness & Contrast
   */
  function convertContrast(value, layer) {
    var val = parseFloat(value);
    var contrast = (val - 1) * 100;
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.brightnessContrast);
      effect.property('ADBE Brightness & Contrast 2-0002').setValue(contrast);
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS saturate to AE Hue/Saturation
   */
  function convertSaturate(value, layer) {
    var val = parseFloat(value);
    var saturation = (val - 1) * 100;
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.hueSaturation);
      effect.property('ADBE HUE SATURATION-0002').setValue(saturation); // Master Saturation
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS hue-rotate to AE Hue/Saturation
   */
  function convertHueRotate(value, layer) {
    var deg = parseFloat(value);
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.hueSaturation);
      effect.property('ADBE HUE SATURATION-0001').setValue(deg); // Master Hue
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS grayscale to AE Hue/Saturation (desaturate)
   */
  function convertGrayscale(value, layer) {
    var val = parseFloat(value);
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.hueSaturation);
      effect.property('ADBE HUE SATURATION-0002').setValue(-val * 100); // Desaturate
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS invert to AE Invert
   */
  function convertInvert(value, layer) {
    var val = parseFloat(value);
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.invert);
      effect.property('ADBE Invert-0001').setValue(val * 100); // Blend with Original
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS sepia to AE Tint
   */
  function convertSepia(value, layer) {
    var val = parseFloat(value);
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.tint);
      // Map to black and tint to white
      effect.property('ADBE Tint-0001').setValue([0.24, 0.19, 0.11]); // Map Black To (sepia dark)
      effect.property('ADBE Tint-0002').setValue([1, 0.96, 0.82]); // Map White To (sepia light)
      effect.property('ADBE Tint-0003').setValue(val * 100); // Amount to Tint
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert CSS drop-shadow to AE Drop Shadow
   */
  function convertDropShadow(offsetX, offsetY, blurRadius, color, layer) {
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.dropShadow);

      // Calculate distance and direction from offset
      var distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      var direction = (Math.atan2(offsetY, offsetX) * 180 / Math.PI) + 90;

      effect.property('ADBE Drop Shadow-0001').setValue(75); // Opacity
      effect.property('ADBE Drop Shadow-0002').setValue(direction); // Direction
      effect.property('ADBE Drop Shadow-0003').setValue(distance); // Distance
      effect.property('ADBE Drop Shadow-0004').setValue(blurRadius * 2); // Softness
      if (color) {
        effect.property('ADBE Drop Shadow-0005').setValue(color); // Shadow Color
      }
      return effect;
    } catch (e) {
      return null;
    }
  }

  // =====================
  // Effect Chain Application
  // =====================

  /**
   * Apply a chain of CSS filters to a layer
   * @param {AVLayer} layer - The AE layer
   * @param {Array} filters - Array of filter definitions
   */
  function applyFilterChain(layer, filters) {
    if (!filters || filters.length === 0) return;

    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      var effect = null;

      switch (filter.name) {
        case 'blur':
          effect = convertBlur(filter.rawValue, layer);
          break;
        case 'brightness':
          effect = convertBrightness(filter.rawValue, layer);
          break;
        case 'contrast':
          effect = convertContrast(filter.rawValue, layer);
          break;
        case 'saturate':
          effect = convertSaturate(filter.rawValue, layer);
          break;
        case 'hue-rotate':
          effect = convertHueRotate(filter.rawValue, layer);
          break;
        case 'grayscale':
          effect = convertGrayscale(filter.rawValue, layer);
          break;
        case 'invert':
          effect = convertInvert(filter.rawValue, layer);
          break;
        case 'sepia':
          effect = convertSepia(filter.rawValue, layer);
          break;
        case 'opacity':
          // Handle at layer level
          var opacity = parseFloat(filter.rawValue) * 100;
          layer.property('Opacity').setValue(opacity);
          break;
      }

      // Apply animated values if present
      if (effect && filter.keyframes) {
        applyEffectKeyframes(effect, filter);
      }
    }
  }

  /**
   * Apply keyframes to an effect property
   */
  function applyEffectKeyframes(effect, filter) {
    // Get the main property of the effect
    var propName = null;
    switch (filter.name) {
      case 'blur':
        propName = 'ADBE Gaussian Blur 2-0001';
        break;
      case 'brightness':
        propName = 'ADBE Brightness & Contrast 2-0001';
        break;
      case 'contrast':
        propName = 'ADBE Brightness & Contrast 2-0002';
        break;
      case 'saturate':
      case 'grayscale':
        propName = 'ADBE HUE SATURATION-0002';
        break;
      case 'hue-rotate':
        propName = 'ADBE HUE SATURATION-0001';
        break;
    }

    if (!propName || !filter.keyframes) return;

    try {
      var prop = effect.property(propName);
      if (!prop) return;

      for (var i = 0; i < filter.keyframes.length; i++) {
        var kf = filter.keyframes[i];
        var time = kf.frame / 30; // Assume 30fps
        prop.setValueAtTime(time, kf.value);
      }
    } catch (e) {
      // Keyframe application failed
    }
  }

  // =====================
  // Effect Presets
  // =====================

  /**
   * Apply a glow effect
   */
  function applyGlow(layer, options) {
    options = options || {};
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.glow);
      effect.property('ADBE Glo2-0001').setValue(options.threshold || 50); // Glow Threshold
      effect.property('ADBE Glo2-0002').setValue(options.radius || 50); // Glow Radius
      effect.property('ADBE Glo2-0003').setValue(options.intensity || 1); // Glow Intensity
      if (options.color) {
        effect.property('ADBE Glo2-0010').setValue(2); // Glow Colors: A & B Colors
        effect.property('ADBE Glo2-0011').setValue(options.color); // Color A
      }
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Apply turbulent displace (for wavy/organic effects)
   */
  function applyTurbulentDisplace(layer, options) {
    options = options || {};
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.turbulentDisplace);
      effect.property('ADBE Turbulent Displace-0001').setValue(options.amount || 50);
      effect.property('ADBE Turbulent Displace-0002').setValue(options.size || 100);
      effect.property('ADBE Turbulent Displace-0006').setValue(options.complexity || 2);
      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Apply gradient ramp
   */
  function applyGradientRamp(layer, options) {
    options = options || {};
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.gradientRamp);

      // Start/End points
      var startPoint = options.startPoint || [0, 0];
      var endPoint = options.endPoint || [layer.width, layer.height];
      effect.property('ADBE Ramp-0001').setValue(startPoint);
      effect.property('ADBE Ramp-0002').setValue(options.startColor || [0, 0, 0]);
      effect.property('ADBE Ramp-0003').setValue(endPoint);
      effect.property('ADBE Ramp-0004').setValue(options.endColor || [1, 1, 1]);

      // Ramp shape: 1 = linear, 2 = radial
      effect.property('ADBE Ramp-0005').setValue(options.type === 'radial' ? 2 : 1);

      // Blend
      effect.property('ADBE Ramp-0007').setValue(options.blend || 100);

      return effect;
    } catch (e) {
      return null;
    }
  }

  /**
   * Apply fractal noise (for procedural backgrounds)
   */
  function applyFractalNoise(layer, options) {
    options = options || {};
    try {
      var effect = layer.property('ADBE Effect Parade').addProperty(EFFECT_MATCH_NAMES.fractalNoise);
      effect.property('ADBE Fractal Noise-0001').setValue(options.fractalType || 1); // Basic
      effect.property('ADBE Fractal Noise-0002').setValue(options.noiseType || 1); // Soft Linear
      effect.property('ADBE Fractal Noise-0006').setValue(options.contrast || 100);
      effect.property('ADBE Fractal Noise-0007').setValue(options.brightness || 0);
      effect.property('ADBE Fractal Noise-0102').setValue(options.scale || 100);
      effect.property('ADBE Fractal Noise-0202').setValue(options.complexity || 6);
      return effect;
    } catch (e) {
      return null;
    }
  }

  // =====================
  // Public API
  // =====================

  return {
    EFFECT_MATCH_NAMES: EFFECT_MATCH_NAMES,
    applyFilterChain: applyFilterChain,
    convertBlur: convertBlur,
    convertBrightness: convertBrightness,
    convertContrast: convertContrast,
    convertSaturate: convertSaturate,
    convertHueRotate: convertHueRotate,
    convertGrayscale: convertGrayscale,
    convertInvert: convertInvert,
    convertSepia: convertSepia,
    convertDropShadow: convertDropShadow,
    applyGlow: applyGlow,
    applyTurbulentDisplace: applyTurbulentDisplace,
    applyGradientRamp: applyGradientRamp,
    applyFractalNoise: applyFractalNoise
  };

})();
