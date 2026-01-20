/**
 * Mask Utilities for After Effects
 *
 * Converts CSS clip-paths and SVG masks to AE mask paths
 * Handles various clip-path shapes: inset, circle, ellipse, polygon, path
 */

var MaskUtils = (function() {
  'use strict';

  // =====================
  // Constants
  // =====================

  var MASK_MODES = {
    add: MaskMode.ADD,
    subtract: MaskMode.SUBTRACT,
    intersect: MaskMode.INTERSECT,
    lighten: MaskMode.LIGHTEN,
    darken: MaskMode.DARKEN,
    difference: MaskMode.DIFFERENCE,
    none: MaskMode.NONE
  };

  // =====================
  // Shape Creators
  // =====================

  /**
   * Create a rectangle mask (for inset clip-path)
   * @param {AVLayer} layer - The layer to add mask to
   * @param {Object} inset - Inset values {top, right, bottom, left}
   * @param {boolean} isPercent - Whether values are percentages
   * @returns {MaskPropertyGroup} The created mask
   */
  function createInsetMask(layer, inset, isPercent) {
    var comp = layer.containingComp;
    var width = comp.width;
    var height = comp.height;

    // Convert percentages to pixels if needed
    var top = isPercent ? (inset.top / 100) * height : inset.top;
    var right = isPercent ? (inset.right / 100) * width : inset.right;
    var bottom = isPercent ? (inset.bottom / 100) * height : inset.bottom;
    var left = isPercent ? (inset.left / 100) * width : inset.left;

    // Create rectangle path
    var maskShape = new Shape();
    maskShape.vertices = [
      [left, top],
      [width - right, top],
      [width - right, height - bottom],
      [left, height - bottom]
    ];
    maskShape.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
    maskShape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
    maskShape.closed = true;

    return addMaskToLayer(layer, maskShape, 'Inset Mask');
  }

  /**
   * Create a circle mask
   * @param {AVLayer} layer - The layer to add mask to
   * @param {number} radius - Circle radius
   * @param {string} radiusUnit - 'px' or '%'
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {string} centerUnit - 'px' or '%'
   * @returns {MaskPropertyGroup} The created mask
   */
  function createCircleMask(layer, radius, radiusUnit, centerX, centerY, centerUnit) {
    var comp = layer.containingComp;
    var width = comp.width;
    var height = comp.height;

    // Convert to pixels
    var r = radiusUnit === '%' ? (radius / 100) * Math.min(width, height) : radius;
    var cx = centerUnit === '%' ? (centerX / 100) * width : centerX;
    var cy = centerUnit === '%' ? (centerY / 100) * height : centerY;

    // Create circle using bezier approximation
    // Control point factor for circle: 0.5522847498
    var k = 0.5522847498 * r;

    var maskShape = new Shape();
    maskShape.vertices = [
      [cx, cy - r],     // Top
      [cx + r, cy],     // Right
      [cx, cy + r],     // Bottom
      [cx - r, cy]      // Left
    ];
    maskShape.inTangents = [
      [-k, 0],
      [0, -k],
      [k, 0],
      [0, k]
    ];
    maskShape.outTangents = [
      [k, 0],
      [0, k],
      [-k, 0],
      [0, -k]
    ];
    maskShape.closed = true;

    return addMaskToLayer(layer, maskShape, 'Circle Mask');
  }

  /**
   * Create an ellipse mask
   * @param {AVLayer} layer - The layer to add mask to
   * @param {number} radiusX - Horizontal radius
   * @param {number} radiusY - Vertical radius
   * @param {number} centerX - Center X position (%)
   * @param {number} centerY - Center Y position (%)
   * @returns {MaskPropertyGroup} The created mask
   */
  function createEllipseMask(layer, radiusX, radiusY, centerX, centerY) {
    var comp = layer.containingComp;
    var width = comp.width;
    var height = comp.height;

    // Convert to pixels (assuming percent values)
    var rx = (radiusX / 100) * width;
    var ry = (radiusY / 100) * height;
    var cx = (centerX / 100) * width;
    var cy = (centerY / 100) * height;

    // Control point factors
    var kx = 0.5522847498 * rx;
    var ky = 0.5522847498 * ry;

    var maskShape = new Shape();
    maskShape.vertices = [
      [cx, cy - ry],    // Top
      [cx + rx, cy],    // Right
      [cx, cy + ry],    // Bottom
      [cx - rx, cy]     // Left
    ];
    maskShape.inTangents = [
      [-kx, 0],
      [0, -ky],
      [kx, 0],
      [0, ky]
    ];
    maskShape.outTangents = [
      [kx, 0],
      [0, ky],
      [-kx, 0],
      [0, -ky]
    ];
    maskShape.closed = true;

    return addMaskToLayer(layer, maskShape, 'Ellipse Mask');
  }

  /**
   * Create a polygon mask
   * @param {AVLayer} layer - The layer to add mask to
   * @param {Array} points - Array of {x, y, xUnit, yUnit} objects
   * @returns {MaskPropertyGroup} The created mask
   */
  function createPolygonMask(layer, points) {
    var comp = layer.containingComp;
    var width = comp.width;
    var height = comp.height;

    var vertices = [];
    var inTangents = [];
    var outTangents = [];

    for (var i = 0; i < points.length; i++) {
      var pt = points[i];
      var x = pt.xUnit === '%' ? (pt.x / 100) * width : pt.x;
      var y = pt.yUnit === '%' ? (pt.y / 100) * height : pt.y;
      vertices.push([x, y]);
      inTangents.push([0, 0]);
      outTangents.push([0, 0]);
    }

    var maskShape = new Shape();
    maskShape.vertices = vertices;
    maskShape.inTangents = inTangents;
    maskShape.outTangents = outTangents;
    maskShape.closed = true;

    return addMaskToLayer(layer, maskShape, 'Polygon Mask');
  }

  /**
   * Create a mask from SVG path data
   * @param {AVLayer} layer - The layer to add mask to
   * @param {string} pathData - SVG path d attribute
   * @returns {MaskPropertyGroup} The created mask
   */
  function createPathMask(layer, pathData) {
    // Parse SVG path data
    var parsed = parseSVGPath(pathData);
    if (!parsed) return null;

    var maskShape = new Shape();
    maskShape.vertices = parsed.vertices;
    maskShape.inTangents = parsed.inTangents;
    maskShape.outTangents = parsed.outTangents;
    maskShape.closed = parsed.closed;

    return addMaskToLayer(layer, maskShape, 'Path Mask');
  }

  // =====================
  // SVG Path Parser
  // =====================

  /**
   * Parse SVG path data into AE mask shape format
   * Supports: M, L, H, V, C, S, Q, T, A, Z commands
   * @param {string} d - SVG path d attribute
   * @returns {Object} Parsed path {vertices, inTangents, outTangents, closed}
   */
  function parseSVGPath(d) {
    if (!d) return null;

    var vertices = [];
    var inTangents = [];
    var outTangents = [];
    var closed = false;

    var currentX = 0;
    var currentY = 0;
    var startX = 0;
    var startY = 0;
    var lastControlX = 0;
    var lastControlY = 0;

    // Tokenize path data
    var commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
    if (!commands) return null;

    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      var type = cmd.charAt(0);
      var args = cmd.substring(1).trim().split(/[\s,]+/).map(parseFloat);
      var isRelative = type === type.toLowerCase();
      type = type.toUpperCase();

      switch (type) {
        case 'M': // Move to
          if (isRelative) {
            currentX += args[0];
            currentY += args[1];
          } else {
            currentX = args[0];
            currentY = args[1];
          }
          startX = currentX;
          startY = currentY;
          vertices.push([currentX, currentY]);
          inTangents.push([0, 0]);
          outTangents.push([0, 0]);
          break;

        case 'L': // Line to
          for (var j = 0; j < args.length; j += 2) {
            if (isRelative) {
              currentX += args[j];
              currentY += args[j + 1];
            } else {
              currentX = args[j];
              currentY = args[j + 1];
            }
            vertices.push([currentX, currentY]);
            inTangents.push([0, 0]);
            outTangents.push([0, 0]);
          }
          break;

        case 'H': // Horizontal line
          for (var k = 0; k < args.length; k++) {
            currentX = isRelative ? currentX + args[k] : args[k];
            vertices.push([currentX, currentY]);
            inTangents.push([0, 0]);
            outTangents.push([0, 0]);
          }
          break;

        case 'V': // Vertical line
          for (var l = 0; l < args.length; l++) {
            currentY = isRelative ? currentY + args[l] : args[l];
            vertices.push([currentX, currentY]);
            inTangents.push([0, 0]);
            outTangents.push([0, 0]);
          }
          break;

        case 'C': // Cubic bezier
          for (var m = 0; m < args.length; m += 6) {
            var c1x = isRelative ? currentX + args[m] : args[m];
            var c1y = isRelative ? currentY + args[m + 1] : args[m + 1];
            var c2x = isRelative ? currentX + args[m + 2] : args[m + 2];
            var c2y = isRelative ? currentY + args[m + 3] : args[m + 3];
            var endX = isRelative ? currentX + args[m + 4] : args[m + 4];
            var endY = isRelative ? currentY + args[m + 5] : args[m + 5];

            // Set out tangent of previous vertex
            if (outTangents.length > 0) {
              outTangents[outTangents.length - 1] = [c1x - currentX, c1y - currentY];
            }

            // Add new vertex with in tangent
            vertices.push([endX, endY]);
            inTangents.push([c2x - endX, c2y - endY]);
            outTangents.push([0, 0]);

            lastControlX = c2x;
            lastControlY = c2y;
            currentX = endX;
            currentY = endY;
          }
          break;

        case 'Z': // Close path
          closed = true;
          break;

        // Add more command handlers as needed
      }
    }

    return {
      vertices: vertices,
      inTangents: inTangents,
      outTangents: outTangents,
      closed: closed
    };
  }

  // =====================
  // Mask Application
  // =====================

  /**
   * Add a mask shape to a layer
   * @param {AVLayer} layer - The layer
   * @param {Shape} maskShape - The shape object
   * @param {string} name - Mask name
   * @returns {MaskPropertyGroup} The created mask
   */
  function addMaskToLayer(layer, maskShape, name) {
    try {
      var masks = layer.property('ADBE Mask Parade');
      var newMask = masks.addProperty('ADBE Mask Atom');
      newMask.name = name || 'Mask';

      var maskPath = newMask.property('ADBE Mask Shape');
      maskPath.setValue(maskShape);

      return newMask;
    } catch (e) {
      return null;
    }
  }

  /**
   * Create mask from clip-path definition
   * @param {AVLayer} layer - The layer
   * @param {Object} clipPath - Parsed clip-path object
   * @returns {MaskPropertyGroup} The created mask
   */
  function createMaskFromClipPath(layer, clipPath) {
    if (!clipPath) return null;

    switch (clipPath.type) {
      case 'inset':
        return createInsetMask(layer, clipPath.values, clipPath.isPercent);

      case 'circle':
        return createCircleMask(
          layer,
          clipPath.radius,
          clipPath.radiusUnit,
          clipPath.centerX,
          clipPath.centerY,
          clipPath.centerUnit
        );

      case 'ellipse':
        return createEllipseMask(
          layer,
          clipPath.radiusX,
          clipPath.radiusY,
          clipPath.centerX,
          clipPath.centerY
        );

      case 'polygon':
        return createPolygonMask(layer, clipPath.points);

      case 'path':
        return createPathMask(layer, clipPath.d);

      default:
        return null;
    }
  }

  /**
   * Set mask properties
   * @param {MaskPropertyGroup} mask - The mask
   * @param {Object} options - Mask options
   */
  function setMaskProperties(mask, options) {
    if (!mask || !options) return;

    try {
      // Mask mode
      if (options.mode && MASK_MODES[options.mode]) {
        mask.maskMode = MASK_MODES[options.mode];
      }

      // Mask feather
      if (options.feather !== undefined) {
        mask.property('ADBE Mask Feather').setValue([options.feather, options.feather]);
      }

      // Mask opacity
      if (options.opacity !== undefined) {
        mask.property('ADBE Mask Opacity').setValue(options.opacity);
      }

      // Mask expansion
      if (options.expansion !== undefined) {
        mask.property('ADBE Mask Offset').setValue(options.expansion);
      }

      // Inverted
      if (options.inverted !== undefined) {
        mask.inverted = options.inverted;
      }
    } catch (e) {
      // Property setting failed
    }
  }

  /**
   * Animate mask path
   * @param {MaskPropertyGroup} mask - The mask
   * @param {Array} keyframes - Array of {frame, shape} objects
   * @param {number} fps - Frames per second
   */
  function animateMaskPath(mask, keyframes, fps) {
    if (!mask || !keyframes || keyframes.length === 0) return;

    try {
      var maskPath = mask.property('ADBE Mask Shape');

      for (var i = 0; i < keyframes.length; i++) {
        var kf = keyframes[i];
        var time = kf.frame / fps;
        maskPath.setValueAtTime(time, kf.shape);
      }
    } catch (e) {
      // Animation failed
    }
  }

  // =====================
  // Public API
  // =====================

  return {
    MASK_MODES: MASK_MODES,
    createInsetMask: createInsetMask,
    createCircleMask: createCircleMask,
    createEllipseMask: createEllipseMask,
    createPolygonMask: createPolygonMask,
    createPathMask: createPathMask,
    createMaskFromClipPath: createMaskFromClipPath,
    addMaskToLayer: addMaskToLayer,
    setMaskProperties: setMaskProperties,
    animateMaskPath: animateMaskPath,
    parseSVGPath: parseSVGPath
  };

})();
