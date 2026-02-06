// Abacus components barrel export
export { AbacusBead } from './AbacusBead';
export { AbacusColumn } from './AbacusColumn';
export { RealisticAbacus } from './RealisticAbacus';
export { AbacusModeSelector } from './AbacusModeSelector';
export { AbacusThemeSelector } from './AbacusThemeSelector';
export { AbacusColorSchemeSelector, colorSchemes, getColorPaletteForScheme } from './AbacusColorScheme';
export { FullscreenAbacus } from './FullscreenAbacus';

// Types
export type { AbacusMode, AbacusTheme, AbacusOrientation } from './RealisticAbacus';
export type { AbacusColorScheme } from './AbacusColorScheme';

// Engine
export type { AbacusState, ColumnState } from '@/lib/abacusEngine';
export {
  createAbacusState,
  stateFromValue,
  resetAbacus,
  computeValue,
  validateState,
  columnDigit,
} from '@/lib/abacusEngine';
