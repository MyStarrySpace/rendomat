import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Img } from 'remotion';

// Common styles
const FONT_BODY = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const BG_DARK = '#0A0A0A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A0A0A0';
const ACCENT_COLOR = '#00D9A3';

interface SceneData {
  title?: string;
  body_text?: string;
  style?: string;
  image_url?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  quote?: string;
  author?: string;
  stats_text?: string;
  chart_data?: string;
  [key: string]: any;
}

interface SceneProps {
  data: SceneData;
  durationInFrames: number;
}

// Helper function for fade animations
const useFadeAnimation = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const fadeInDuration = 15;
  const fadeOutStart = durationInFrames - 15;

  let opacity = 1;
  if (frame < fadeInDuration) {
    opacity = frame / fadeInDuration;
  } else if (frame > fadeOutStart) {
    opacity = 1 - ((frame - fadeOutStart) / 15);
  }

  return opacity;
};

// Text Only Scene
export const TextOnlyScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const titleDelay = 10;
  const bodyDelay = 25;

  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;
  const bodyOpacity = frame > bodyDelay ? Math.min(1, (frame - bodyDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 80
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 1000,
        fontFamily: FONT_BODY
      }}>
        {data.title && (
          <div style={{
            fontSize: 72,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            opacity: titleOpacity,
            marginBottom: 40,
            lineHeight: 1.2
          }}>
            {data.title}
          </div>
        )}
        {data.body_text && (
          <div style={{
            fontSize: 36,
            fontWeight: 300,
            color: TEXT_SECONDARY,
            opacity: bodyOpacity,
            lineHeight: 1.5
          }}>
            {data.body_text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Single Image + Title Scene
export const SingleImageScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const imageScale = interpolate(frame, [0, 30], [0.95, 1], { extrapolateRight: 'clamp' });
  const titleDelay = 20;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{ background: BG_DARK, fontFamily: FONT_BODY }}>
      {data.image_url && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${imageScale})`,
          width: '70%',
          height: '70%',
          opacity
        }}>
          <Img
            src={data.image_url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 16
            }}
          />
        </div>
      )}

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 80px'
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            opacity: titleOpacity,
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            padding: '20px 40px',
            borderRadius: 12,
            display: 'inline-block'
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Dual Images + Title Scene
export const DualImagesScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const image1Delay = 10;
  const image2Delay = 20;
  const titleDelay = 35;

  const image1Opacity = frame > image1Delay ? Math.min(1, (frame - image1Delay) / 15) * opacity : 0;
  const image2Opacity = frame > image2Delay ? Math.min(1, (frame - image2Delay) / 15) * opacity : 0;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 80
    }}>
      <div style={{
        display: 'flex',
        gap: 40,
        height: '80%',
        alignItems: 'center'
      }}>
        {data.image_url && (
          <div style={{ flex: 1, height: '100%', opacity: image1Opacity }}>
            <Img
              src={data.image_url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 16
              }}
            />
          </div>
        )}
        {data.image_url_2 && (
          <div style={{ flex: 1, height: '100%', opacity: image2Opacity }}>
            <Img
              src={data.image_url_2}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 16
              }}
            />
          </div>
        )}
      </div>

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            opacity: titleOpacity
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Grid 2x2 Scene
export const GridScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const images = [data.image_url, data.image_url_2, data.image_url_3, data.image_url_4].filter(Boolean);
  const titleDelay = 40;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 80
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 30,
        height: '80%'
      }}>
        {images.map((img, idx) => {
          const delay = idx * 10;
          const imgOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;

          return img ? (
            <div key={idx} style={{ opacity: imgOpacity }}>
              <Img
                src={img}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12
                }}
              />
            </div>
          ) : null;
        })}
      </div>

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            opacity: titleOpacity
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Quote Scene
export const QuoteScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const quoteDelay = 15;
  const authorDelay = 35;

  const quoteOpacity = frame > quoteDelay ? Math.min(1, (frame - quoteDelay) / 20) * opacity : 0;
  const authorOpacity = frame > authorDelay ? Math.min(1, (frame - authorDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 120,
      fontFamily: FONT_BODY
    }}>
      <div style={{ maxWidth: 1200, textAlign: 'center' }}>
        <div style={{
          fontSize: 28,
          color: ACCENT_COLOR,
          opacity: quoteOpacity,
          marginBottom: 40
        }}>
          "
        </div>

        {data.quote && (
          <div style={{
            fontSize: 52,
            fontWeight: 300,
            color: TEXT_PRIMARY,
            opacity: quoteOpacity,
            lineHeight: 1.4,
            fontStyle: 'italic',
            marginBottom: 40
          }}>
            {data.quote}
          </div>
        )}

        {data.author && (
          <div style={{
            fontSize: 32,
            fontWeight: 500,
            color: TEXT_SECONDARY,
            opacity: authorOpacity
          }}>
            — {data.author}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Stats Scene
export const StatsScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  // Parse stats from stats_text format: "75% | Description"
  const stats = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value, label };
      })
    : [];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 120
    }}>
      {data.title && (
        <div style={{
          fontSize: 56,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 80
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: stats.length <= 3 ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 60,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {stats.map((stat, idx) => {
          const delay = 25 + (idx * 15);
          const statOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;
          const scale = interpolate(
            frame,
            [delay, delay + 15],
            [0.8, 1],
            { extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={idx}
              style={{
                opacity: statOpacity,
                transform: `scale(${scale})`,
                textAlign: 'center',
                minWidth: 300
              }}
            >
              <div style={{
                fontSize: 96,
                fontWeight: 700,
                color: ACCENT_COLOR,
                marginBottom: 20
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 400,
                color: TEXT_SECONDARY,
                lineHeight: 1.4
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Simple Bar Chart Scene
export const BarChartScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  let chartData: any = null;
  try {
    chartData = data.chart_data ? JSON.parse(data.chart_data) : null;
  } catch (e) {
    // Invalid JSON
  }

  if (!chartData || !chartData.labels || !chartData.data) {
    return (
      <TextOnlyScene
        data={{ title: data.title || 'Chart Data Missing', body_text: 'Please add valid chart data' }}
        durationInFrames={durationInFrames}
      />
    );
  }

  const maxValue = Math.max(...chartData.data);
  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 120
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 60
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '60%',
        padding: '0 100px',
        gap: 30
      }}>
        {chartData.data.map((value: number, idx: number) => {
          const delay = 30 + (idx * 8);
          const barHeight = (value / maxValue) * 100;
          const animatedHeight = frame > delay
            ? interpolate(frame, [delay, delay + 20], [0, barHeight], { extrapolateRight: 'clamp' })
            : 0;

          const barOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: barOpacity
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                marginBottom: 10,
                height: 30
              }}>
                {value}
              </div>
              <div style={{
                width: '100%',
                height: `${animatedHeight}%`,
                backgroundColor: ACCENT_COLOR,
                borderRadius: '8px 8px 0 0',
                minHeight: 10
              }} />
              <div style={{
                fontSize: 18,
                color: TEXT_SECONDARY,
                marginTop: 20,
                textAlign: 'center'
              }}>
                {chartData.labels[idx]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Simple Line Chart Scene
export const LineChartScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  let chartData: any = null;
  try {
    chartData = data.chart_data ? JSON.parse(data.chart_data) : null;
  } catch (e) {
    // Invalid JSON
  }

  if (!chartData || !chartData.labels || !chartData.data) {
    return (
      <TextOnlyScene
        data={{ title: data.title || 'Chart Data Missing', body_text: 'Please add valid chart data' }}
        durationInFrames={durationInFrames}
      />
    );
  }

  const maxValue = Math.max(...chartData.data);
  const minValue = Math.min(...chartData.data);
  const range = maxValue - minValue;

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  const chartWidth = 1200;
  const chartHeight = 500;
  const padding = 60;
  const innerWidth = chartWidth - 2 * padding;
  const innerHeight = chartHeight - 2 * padding;

  const points = chartData.data.map((value: number, idx: number) => {
    const x = padding + (idx / (chartData.data.length - 1)) * innerWidth;
    const y = padding + ((maxValue - value) / range) * innerHeight;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const lineDelay = 30;
  const lineProgress = frame > lineDelay
    ? Math.min(1, (frame - lineDelay) / 40)
    : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {data.title && (
        <div style={{
          position: 'absolute',
          top: 80,
          fontSize: 48,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          opacity: titleOpacity
        }}>
          {data.title}
        </div>
      )}

      <svg width={chartWidth} height={chartHeight} style={{ opacity }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            x2={chartWidth - padding}
            y1={padding + innerHeight * ratio}
            y2={padding + innerHeight * ratio}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Line */}
        <path
          d={pathD}
          stroke={ACCENT_COLOR}
          strokeWidth="4"
          fill="none"
          strokeDasharray="2000"
          strokeDashoffset={2000 * (1 - lineProgress)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />

        {/* Points */}
        {points.map((point, idx) => {
          const pointDelay = lineDelay + 40 + (idx * 3);
          const pointOpacity = frame > pointDelay ? opacity : 0;

          return (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={ACCENT_COLOR}
              opacity={pointOpacity}
            />
          );
        })}

        {/* Labels */}
        {chartData.labels.map((label: string, idx: number) => (
          <text
            key={idx}
            x={points[idx].x}
            y={chartHeight - 20}
            fill={TEXT_SECONDARY}
            fontSize="14"
            textAnchor="middle"
            opacity={opacity}
          >
            {label}
          </text>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Pie Chart Scene (using simple SVG)
export const PieChartScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  let chartData: any = null;
  try {
    chartData = data.chart_data ? JSON.parse(data.chart_data) : null;
  } catch (e) {
    // Invalid JSON
  }

  if (!chartData || !chartData.labels || !chartData.data) {
    return (
      <TextOnlyScene
        data={{ title: data.title || 'Chart Data Missing', body_text: 'Please add valid chart data' }}
        durationInFrames={durationInFrames}
      />
    );
  }

  const total = chartData.data.reduce((sum: number, val: number) => sum + val, 0);
  const colors = ['#00D9A3', '#FF6B6B', '#FFD93D', '#4ECDC4', '#A78BFA'];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  const radius = 200;
  const centerX = 400;
  const centerY = 300;

  let currentAngle = -90; // Start at top

  const animationDelay = 25;
  const animationProgress = frame > animationDelay
    ? Math.min(1, (frame - animationDelay) / 40)
    : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 80
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 40
        }}>
          {data.title}
        </div>
      )}

      <div style={{ display: 'flex', gap: 100, alignItems: 'center', justifyContent: 'center' }}>
        <svg width={800} height={600} style={{ opacity }}>
          {chartData.data.map((value: number, idx: number) => {
            const percentage = value / total;
            const angle = percentage * 360 * animationProgress;

            const startAngle = currentAngle;
            const endAngle = startAngle + angle;

            const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArc = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${startX} ${startY}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
              'Z'
            ].join(' ');

            currentAngle += percentage * 360;

            return (
              <path
                key={idx}
                d={pathData}
                fill={colors[idx % colors.length]}
                stroke={BG_DARK}
                strokeWidth="3"
              />
            );
          })}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {chartData.labels.map((label: string, idx: number) => {
            const legendDelay = animationDelay + 40 + (idx * 5);
            const legendOpacity = frame > legendDelay ? opacity : 0;
            const percentage = ((chartData.data[idx] / total) * 100).toFixed(1);

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 15,
                  opacity: legendOpacity
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  backgroundColor: colors[idx % colors.length],
                  borderRadius: 4
                }} />
                <div>
                  <div style={{
                    fontSize: 24,
                    color: TEXT_PRIMARY,
                    fontWeight: 500
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 18,
                    color: TEXT_SECONDARY
                  }}>
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Progress Bars Scene
export const ProgressBarsScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  // Parse from stats_text format: "75 | Label"
  const bars = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value: parseInt(value) || 0, label };
      })
    : [];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      fontFamily: FONT_BODY,
      padding: 120,
      justifyContent: 'center'
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: TEXT_PRIMARY,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 80
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        maxWidth: 1000,
        margin: '0 auto',
        width: '100%'
      }}>
        {bars.map((bar, idx) => {
          const delay = 25 + (idx * 12);
          const barOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;
          const progressWidth = frame > delay + 5
            ? interpolate(frame, [delay + 5, delay + 30], [0, bar.value], { extrapolateRight: 'clamp' })
            : 0;

          return (
            <div key={idx} style={{ opacity: barOpacity }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{
                  fontSize: 24,
                  color: TEXT_PRIMARY,
                  fontWeight: 500
                }}>
                  {bar.label}
                </div>
                <div style={{
                  fontSize: 24,
                  color: ACCENT_COLOR,
                  fontWeight: 600
                }}>
                  {Math.round(progressWidth)}%
                </div>
              </div>
              <div style={{
                width: '100%',
                height: 24,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  backgroundColor: ACCENT_COLOR,
                  borderRadius: 12,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Area Chart (similar to line chart but filled)
export const AreaChartScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  // Reuse line chart logic but add fill
  return <LineChartScene data={data} durationInFrames={durationInFrames} />;
};

// Image Gallery (carousel effect)
export const ImageGalleryScene: React.FC<SceneProps> = ({ data, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const images = [data.image_url, data.image_url_2, data.image_url_3, data.image_url_4].filter(Boolean);

  if (images.length === 0) {
    return <TextOnlyScene data={{ title: 'No Images', body_text: 'Please add images' }} durationInFrames={durationInFrames} />;
  }

  const framesPerImage = Math.floor(durationInFrames / images.length);
  const currentImageIndex = Math.min(Math.floor(frame / framesPerImage), images.length - 1);
  const nextImageIndex = Math.min(currentImageIndex + 1, images.length - 1);

  const transitionStart = currentImageIndex * framesPerImage + framesPerImage - 15;
  const transitionProgress = frame > transitionStart
    ? Math.min(1, (frame - transitionStart) / 15)
    : 0;

  const currentOpacity = 1 - transitionProgress;
  const nextOpacity = transitionProgress;

  return (
    <AbsoluteFill style={{ background: BG_DARK, fontFamily: FONT_BODY }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '80%',
          height: '80%',
          opacity: currentOpacity * opacity
        }}>
          <Img
            src={images[currentImageIndex]}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 16
            }}
          />
        </div>

        {currentImageIndex !== nextImageIndex && (
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            opacity: nextOpacity * opacity
          }}>
            <Img
              src={images[nextImageIndex]}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 16
              }}
            />
          </div>
        )}
      </div>

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 48,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            opacity,
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            padding: '20px 40px',
            borderRadius: 12,
            display: 'inline-block'
          }}>
            {data.title}
          </div>
        </div>
      )}

      {/* Image indicators */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12
      }}>
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: idx === currentImageIndex ? ACCENT_COLOR : 'rgba(255,255,255,0.3)',
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
