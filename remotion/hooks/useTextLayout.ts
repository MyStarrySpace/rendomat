import { useResponsiveLayout } from './useResponsiveLayout';
import { getTextLayout, type TextLayoutPreset } from '../lib/textLayouts';

export function useTextLayout(preset?: TextLayoutPreset) {
  const layout = useResponsiveLayout();
  const textLayout = getTextLayout(preset, layout.aspectRatio);
  return { layout, textLayout };
}
