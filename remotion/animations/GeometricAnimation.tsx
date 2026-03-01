import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat, rngInt } from './random';

// ── 3D shape definitions ────────────────────────────────────────────
// Each shape is defined by unit-sphere vertices, edges (index pairs),
// and faces (index arrays) so we can render filled translucent panels.

type Vec3 = [number, number, number];
interface ShapeDef {
  verts: Vec3[];
  edges: [number, number][];
  faces: number[][];
}

const CUBE: ShapeDef = (() => {
  const v: Vec3[] = [];
  for (let z = -1; z <= 1; z += 2)
    for (let y = -1; y <= 1; y += 2)
      for (let x = -1; x <= 1; x += 2)
        v.push([x, y, z]);
  // normalise to unit sphere
  const s = 1 / Math.sqrt(3);
  const verts = v.map(([x, y, z]) => [x * s, y * s, z * s] as Vec3);
  return {
    verts,
    edges: [
      [0,1],[2,3],[4,5],[6,7], // x-edges
      [0,2],[1,3],[4,6],[5,7], // y-edges
      [0,4],[1,5],[2,6],[3,7], // z-edges
    ],
    faces: [
      [0,1,3,2],[4,5,7,6], // front/back
      [0,1,5,4],[2,3,7,6], // bottom/top
      [0,2,6,4],[1,3,7,5], // left/right
    ],
  };
})();

const OCTAHEDRON: ShapeDef = {
  verts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
  edges: [
    [0,2],[0,3],[0,4],[0,5],
    [1,2],[1,3],[1,4],[1,5],
    [2,4],[2,5],[3,4],[3,5],
  ],
  faces: [
    [0,2,4],[0,4,3],[0,3,5],[0,5,2],
    [1,2,4],[1,4,3],[1,3,5],[1,5,2],
  ],
};

const ICOSAHEDRON: ShapeDef = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: Vec3[] = [
    [-1, t,0],[1, t,0],[-1,-t,0],[1,-t,0],
    [0,-1, t],[0,1, t],[0,-1,-t],[0,1,-t],
    [ t,0,-1],[ t,0,1],[-t,0,-1],[-t,0,1],
  ];
  const len = Math.sqrt(1 + t * t);
  const verts = raw.map(([x,y,z]) => [x/len, y/len, z/len] as Vec3);
  const faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ];
  // Derive edges from faces (unique pairs)
  const edgeSet = new Set<string>();
  const edges: [number,number][] = [];
  for (const f of faces) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i+1) % f.length];
      const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
      if (!edgeSet.has(key)) { edgeSet.add(key); edges.push([a,b]); }
    }
  }
  return { verts, edges, faces };
})();

const SHAPES: ShapeDef[] = [CUBE, OCTAHEDRON, ICOSAHEDRON];

// ── Rotation & projection helpers ───────────────────────────────────

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
}
function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}
function rotateZ(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2]];
}

// ── Polyhedron instance ─────────────────────────────────────────────

interface PolyInstance {
  id: number;
  cx: number;
  cy: number;
  radius: number;
  shapeIdx: number;
  rotSpeedY: number;
  rotSpeedX: number;
  rotSpeedZ: number;
  delay: number;
  opacity: number;
}

// ── Component ───────────────────────────────────────────────────────

export const GeometricAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);
  const frame = rawFrame + p.timeOffset;

  const baseCount = intensity === 'low' ? 3 : intensity === 'medium' ? 5 : 8;
  const polyCount = Math.round(baseCount * p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  const instances = useMemo<PolyInstance[]>(() => {
    const rng = createRng(6000);
    return Array.from({ length: polyCount }, (_, i) => ({
      id: i,
      cx: rngFloat(rng, width * 0.1, width * 0.9),
      cy: rngFloat(rng, height * 0.1, height * 0.9),
      radius: rngFloat(rng, 35, 90),
      shapeIdx: rngInt(rng, 0, SHAPES.length - 1),
      rotSpeedY: rngFloat(rng, 0.4, 1.0),
      rotSpeedX: rngFloat(rng, 0.15, 0.45),
      rotSpeedZ: rngFloat(rng, 0.05, 0.25),
      delay: rngFloat(rng, 0, 40),
      opacity: rngFloat(rng, 0.15, 0.35),
    }));
  }, [polyCount, width, height]);

  // Global entrance fade (uses rawFrame so each scene fades in independently)
  const entrance = interpolate(rawFrame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <filter id="vertexGlow">
          <feGaussianBlur stdDeviation={3 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity={entrance}>
        {instances.map((inst) => {
          const shape = SHAPES[inst.shapeIdx];
          const t = Math.max(0, frame - inst.delay) * 0.02 * p.speed;

          const polyEntrance = interpolate(
            rawFrame,
            [inst.delay, inst.delay + 25],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          // Breathing scale
          const breathe = 1 + Math.sin(t * 1.5 + inst.id * 2.3) * 0.06;
          const r = inst.radius * p.scale * breathe;

          // Rotate all vertices
          const aY = t * inst.rotSpeedY;
          const aX = t * inst.rotSpeedX;
          const aZ = t * inst.rotSpeedZ;
          const projected = shape.verts.map((v) => {
            let rv = rotateY(v, aY);
            rv = rotateX(rv, aX);
            rv = rotateZ(rv, aZ);
            return [inst.cx + rv[0] * r, inst.cy + rv[1] * r, rv[2]] as Vec3;
          });

          // Sort faces by average z (painter's algorithm)
          const sortedFaces = shape.faces
            .map((f, fi) => {
              const avgZ = f.reduce((s, vi) => s + projected[vi][2], 0) / f.length;
              return { fi, avgZ };
            })
            .sort((a, b) => a.avgZ - b.avgZ);

          return (
            <g key={inst.id} opacity={inst.opacity * polyEntrance}>
              {/* Faces — translucent fill, back-to-front */}
              {sortedFaces.map(({ fi }) => {
                const face = shape.faces[fi];
                const d = face.map((vi, j) => {
                  const [x, y] = projected[vi];
                  return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ' Z';
                // Shade by face normal z: front faces brighter
                const avgZ = face.reduce((s, vi) => s + projected[vi][2], 0) / face.length;
                const faceBrightness = 0.04 + Math.max(0, avgZ) * 0.12;
                return (
                  <path
                    key={`f-${fi}`}
                    d={d}
                    fill={accentColor}
                    opacity={faceBrightness}
                  />
                );
              })}
              {/* Edges */}
              {shape.edges.map(([a, b], ei) => (
                <line
                  key={`e-${ei}`}
                  x1={projected[a][0]}
                  y1={projected[a][1]}
                  x2={projected[b][0]}
                  y2={projected[b][1]}
                  stroke={accentColor}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              ))}
              {/* Vertex dots */}
              {projected.map(([x, y], vi) => (
                <circle
                  key={`v-${vi}`}
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill={accentColor}
                  opacity={0.8}
                  filter="url(#vertexGlow)"
                />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
