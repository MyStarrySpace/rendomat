/**
 * Layer Factory for After Effects
 *
 * Creates AE layers from Remotion manifest layer definitions.
 * Handles different layer types: solid, text, shape, image, null, precomp.
 */

var LayerFactory = (function() {
  'use strict';

  // =====================
  // Color Utilities
  // =====================

  /**
   * Convert hex color to RGB array (normalized 0-1 for AE)
   * @param {string} hex - Hex color string (#RRGGBB or RRGGBB)
   * @returns {Array} RGB array [r, g, b] normalized 0-1
   */
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);

    // Normalize to 0-1 range for AE
    return [r / 255, g / 255, b / 255];
  }

  /**
   * Parse color from various formats (hex, rgb, named)
   * @param {string} color - Color value
   * @returns {Array} RGB array normalized 0-1
   */
  function parseColor(color) {
    if (!color) return [0, 0, 0];

    // Hex format
    if (color.charAt(0) === '#' || /^[0-9a-f]{6}$/i.test(color)) {
      return hexToRgb(color);
    }

    // RGB format: rgb(r, g, b)
    var rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]) / 255,
        parseInt(rgbMatch[2]) / 255,
        parseInt(rgbMatch[3]) / 255
      ];
    }

    // Default to black
    return [0, 0, 0];
  }

  // =====================
  // Layer Type Creators
  // =====================

  /**
   * Create a solid layer
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {AVLayer} Created layer
   */
  function createSolidLayer(comp, layerData, fps) {
    var content = layerData.content || {};
    var color = parseColor(content.color || '#000000');
    var width = content.width || comp.width;
    var height = content.height || comp.height;

    var layer = comp.layers.addSolid(
      color,
      layerData.name || 'Solid',
      width,
      height,
      1 // pixel aspect ratio
    );

    // Set in/out points
    setLayerTiming(layer, layerData, fps);

    return layer;
  }

  /**
   * Create a text layer
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {TextLayer} Created layer
   */
  function createTextLayer(comp, layerData, fps) {
    var content = layerData.content || {};
    var text = content.text || '';

    // Create text layer
    var layer = comp.layers.addText(text);

    // Get text document property
    var textProp = layer.property('ADBE Text Properties').property('ADBE Text Document');
    var textDoc = textProp.value;

    // Apply text styling
    if (content.fontSize) {
      textDoc.fontSize = content.fontSize;
    }

    if (content.fontFamily) {
      textDoc.font = content.fontFamily;
    }

    if (content.color) {
      textDoc.fillColor = parseColor(content.color);
    }

    // Font weight (AE doesn't directly support weight, use font variant)
    // Note: This requires the specific font weight variant to be installed
    if (content.fontWeight && content.fontWeight >= 700) {
      // Try to append "Bold" to font name if weight is bold
      // This is a workaround since AE handles weights via font variants
    }

    // Text alignment
    if (content.textAlign) {
      switch (content.textAlign.toLowerCase()) {
        case 'center':
          textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
          break;
        case 'right':
          textDoc.justification = ParagraphJustification.RIGHT_JUSTIFY;
          break;
        case 'left':
        default:
          textDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
      }
    }

    // Apply text document changes
    textProp.setValue(textDoc);

    // Set position
    if (content.position && content.position.length >= 2) {
      layer.property('Position').setValue([content.position[0], content.position[1]]);
    }

    // Set anchor point to center text properly
    layer.property('Anchor Point').setValue([
      layer.sourceRectAtTime(0, false).width / 2,
      layer.sourceRectAtTime(0, false).height / 2
    ]);

    // Set timing
    setLayerTiming(layer, layerData, fps);

    return layer;
  }

  /**
   * Create a null/empty layer (for grouping/parenting)
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {AVLayer} Created layer
   */
  function createNullLayer(comp, layerData, fps) {
    var layer = comp.layers.addNull();
    layer.name = layerData.name || 'Null';

    setLayerTiming(layer, layerData, fps);

    return layer;
  }

  /**
   * Create a shape layer
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {ShapeLayer} Created layer
   */
  function createShapeLayer(comp, layerData, fps) {
    var layer = comp.layers.addShape();
    layer.name = layerData.name || 'Shape';

    var content = layerData.content || {};

    // Get the shape contents group
    var shapeGroup = layer.property('ADBE Root Vectors Group');

    // Create shape based on type
    if (content.shapeType === 'rectangle' || content.shapeType === 'rect') {
      createRectangleShape(shapeGroup, content);
    } else if (content.shapeType === 'ellipse' || content.shapeType === 'circle') {
      createEllipseShape(shapeGroup, content);
    }

    setLayerTiming(layer, layerData, fps);

    return layer;
  }

  /**
   * Create a rectangle shape within a shape group
   * @param {PropertyGroup} shapeGroup - Shape layer's vector group
   * @param {Object} content - Shape content definition
   */
  function createRectangleShape(shapeGroup, content) {
    // Add a new shape group
    var group = shapeGroup.addProperty('ADBE Vector Group');
    group.name = 'Rectangle';

    // Add rectangle path
    var rectPath = group.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect');
    if (content.width && content.height) {
      rectPath.property('ADBE Vector Rect Size').setValue([content.width, content.height]);
    }
    if (content.roundness) {
      rectPath.property('ADBE Vector Rect Roundness').setValue(content.roundness);
    }

    // Add fill
    if (content.fillColor) {
      var fill = group.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue(parseColor(content.fillColor));
      if (content.fillOpacity !== undefined) {
        fill.property('ADBE Vector Fill Opacity').setValue(content.fillOpacity);
      }
    }

    // Add stroke
    if (content.strokeColor) {
      var stroke = group.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Stroke');
      stroke.property('ADBE Vector Stroke Color').setValue(parseColor(content.strokeColor));
      if (content.strokeWidth) {
        stroke.property('ADBE Vector Stroke Width').setValue(content.strokeWidth);
      }
    }
  }

  /**
   * Create an ellipse shape within a shape group
   * @param {PropertyGroup} shapeGroup - Shape layer's vector group
   * @param {Object} content - Shape content definition
   */
  function createEllipseShape(shapeGroup, content) {
    var group = shapeGroup.addProperty('ADBE Vector Group');
    group.name = 'Ellipse';

    // Add ellipse path
    var ellipsePath = group.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Ellipse');
    var size = content.radius ? [content.radius * 2, content.radius * 2] :
               [content.width || 100, content.height || 100];
    ellipsePath.property('ADBE Vector Ellipse Size').setValue(size);

    // Add fill
    if (content.fillColor) {
      var fill = group.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue(parseColor(content.fillColor));
    }

    // Add stroke
    if (content.strokeColor) {
      var stroke = group.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Stroke');
      stroke.property('ADBE Vector Stroke Color').setValue(parseColor(content.strokeColor));
      if (content.strokeWidth) {
        stroke.property('ADBE Vector Stroke Width').setValue(content.strokeWidth);
      }
    }
  }

  /**
   * Create an image placeholder layer
   * Images need to be imported separately, so we create a placeholder
   *
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {AVLayer} Created placeholder layer
   */
  function createImagePlaceholder(comp, layerData, fps) {
    var content = layerData.content || {};

    // Create a gray placeholder solid
    var layer = comp.layers.addSolid(
      [0.3, 0.3, 0.3], // Gray color
      (layerData.name || 'Image') + ' (Placeholder)',
      comp.width,
      comp.height,
      1
    );

    // Scale to fit if dimensions specified
    if (content.scale) {
      layer.property('Scale').setValue(content.scale);
    }

    // Set position
    if (content.position) {
      layer.property('Position').setValue(content.position);
    }

    setLayerTiming(layer, layerData, fps);

    // Add a marker with the source URL for reference
    if (content.source) {
      try {
        var marker = new MarkerValue('Image Source: ' + content.source);
        layer.property('Marker').setValueAtTime(0, marker);
      } catch (e) {
        // Markers may not be available in all AE versions
      }
    }

    return layer;
  }

  // =====================
  // Utility Functions
  // =====================

  /**
   * Set layer timing (in/out points)
   * @param {Layer} layer - The layer to modify
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   */
  function setLayerTiming(layer, layerData, fps) {
    if (layerData.inPoint !== undefined) {
      layer.inPoint = layerData.inPoint / fps;
    }
    if (layerData.outPoint !== undefined) {
      layer.outPoint = layerData.outPoint / fps;
    }
  }

  /**
   * Main factory function - creates a layer based on type
   * @param {CompItem} comp - Parent composition
   * @param {Object} layerData - Layer definition from manifest
   * @param {number} fps - Frames per second
   * @returns {Layer|null} Created layer or null
   */
  function createLayer(comp, layerData, fps) {
    if (!layerData || !layerData.type) {
      return null;
    }

    var layer = null;

    switch (layerData.type.toLowerCase()) {
      case 'solid':
        layer = createSolidLayer(comp, layerData, fps);
        break;

      case 'text':
        layer = createTextLayer(comp, layerData, fps);
        break;

      case 'null':
        layer = createNullLayer(comp, layerData, fps);
        break;

      case 'shape':
        layer = createShapeLayer(comp, layerData, fps);
        break;

      case 'image':
        layer = createImagePlaceholder(comp, layerData, fps);
        break;

      default:
        // Unknown type - create null layer as fallback
        layer = createNullLayer(comp, layerData, fps);
        break;
    }

    // Apply common properties
    if (layer && layerData.name) {
      layer.name = layerData.name;
    }

    return layer;
  }

  // =====================
  // Public API
  // =====================

  return {
    createLayer: createLayer,
    createSolidLayer: createSolidLayer,
    createTextLayer: createTextLayer,
    createNullLayer: createNullLayer,
    createShapeLayer: createShapeLayer,
    createImagePlaceholder: createImagePlaceholder,
    hexToRgb: hexToRgb,
    parseColor: parseColor
  };

})();
