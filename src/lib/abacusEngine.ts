/**
 * PROFESSIONAL SOROBAN ABACUS ENGINE
 * ===================================
 * Pure logic engine — zero UI dependency.
 * Single source of truth for all abacus state.
 * 
 * SOROBAN RULES:
 * - 1 upper bead (heaven bead) = 5
 * - 4 lower beads (earth beads) = 1 each
 * - Column digit range: 0–9
 * - Bead is "counted" only when touching the reckoning bar
 * 
 * ARCHITECTURE:
 * - Immutable state transitions
 * - Every mutation returns a new state
 * - Value is always recomputed, never cached stale
 */

// ============= TYPES =============

export interface ColumnState {
  /** Upper bead active (touching bar): 0 or 1 */
  upper: 0 | 1;
  /** Lower beads active (touching bar): 0–4 */
  lower: 0 | 1 | 2 | 3 | 4;
}

export interface AbacusState {
  /** Columns from right (ones) to left (highest place value) */
  columns: ColumnState[];
  /** Computed total value — always derived from columns */
  value: number;
}

// ============= COLUMN HELPERS =============

/** Get the digit (0–9) represented by a single column */
export function columnDigit(col: ColumnState): number {
  return col.upper * 5 + col.lower;
}

/** Validate a column state is legal */
export function isValidColumn(col: ColumnState): boolean {
  return (
    (col.upper === 0 || col.upper === 1) &&
    col.lower >= 0 &&
    col.lower <= 4 &&
    Number.isInteger(col.lower)
  );
}

/** Create a column from a digit (0–9). Returns null if invalid. */
export function columnFromDigit(digit: number): ColumnState | null {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return null;
  return {
    upper: (digit >= 5 ? 1 : 0) as 0 | 1,
    lower: (digit % 5) as 0 | 1 | 2 | 3 | 4,
  };
}

// ============= STATE CREATION =============

/** Create a fresh abacus state with all beads cleared */
export function createAbacusState(columnCount: number): AbacusState {
  const columns: ColumnState[] = Array.from({ length: columnCount }, () => ({
    upper: 0 as const,
    lower: 0 as const,
  }));
  return { columns, value: 0 };
}

/** Create abacus state from a numeric value */
export function stateFromValue(num: number, columnCount: number): AbacusState {
  const clamped = Math.max(0, Math.min(num, Math.pow(10, columnCount) - 1));
  const columns: ColumnState[] = [];

  for (let i = 0; i < columnCount; i++) {
    const digit = Math.floor((clamped / Math.pow(10, i)) % 10);
    const col = columnFromDigit(digit);
    columns.push(col ?? { upper: 0, lower: 0 });
  }

  return { columns, value: computeValue(columns) };
}

// ============= VALUE COMPUTATION =============

/** Compute total value from columns — THE authoritative calculation */
export function computeValue(columns: ColumnState[]): number {
  let total = 0;
  for (let i = 0; i < columns.length; i++) {
    total += columnDigit(columns[i]) * Math.pow(10, i);
  }
  return total;
}

// ============= STATE TRANSITIONS =============

/**
 * Set upper bead state for a column.
 * Returns new state or null if the move is invalid.
 */
export function setUpperBead(
  state: AbacusState,
  columnIndex: number,
  active: boolean
): AbacusState | null {
  if (columnIndex < 0 || columnIndex >= state.columns.length) return null;

  const col = state.columns[columnIndex];
  const newUpper: 0 | 1 = active ? 1 : 0;

  // No change
  if (col.upper === newUpper) return state;

  const newCol: ColumnState = { upper: newUpper, lower: col.lower };

  // Validate: digit must be 0–9 (always true with upper 0|1 and lower 0–4)
  if (!isValidColumn(newCol)) return null;

  const newColumns = [...state.columns];
  newColumns[columnIndex] = newCol;

  return { columns: newColumns, value: computeValue(newColumns) };
}

/**
 * Set lower bead count for a column.
 * Returns new state or null if the move is invalid.
 */
export function setLowerBeads(
  state: AbacusState,
  columnIndex: number,
  count: number
): AbacusState | null {
  if (columnIndex < 0 || columnIndex >= state.columns.length) return null;
  if (!Number.isInteger(count) || count < 0 || count > 4) return null;

  const col = state.columns[columnIndex];
  const newLower = count as 0 | 1 | 2 | 3 | 4;

  // No change
  if (col.lower === newLower) return state;

  const newCol: ColumnState = { upper: col.upper, lower: newLower };
  if (!isValidColumn(newCol)) return null;

  const newColumns = [...state.columns];
  newColumns[columnIndex] = newCol;

  return { columns: newColumns, value: computeValue(newColumns) };
}

/**
 * Set a full column digit (0–9) with automatic carry/borrow.
 * This is the primary method for programmatic value changes.
 */
export function setColumnDigit(
  state: AbacusState,
  columnIndex: number,
  digit: number
): AbacusState | null {
  if (columnIndex < 0 || columnIndex >= state.columns.length) return null;
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return null;

  const col = columnFromDigit(digit);
  if (!col) return null;

  const newColumns = [...state.columns];
  newColumns[columnIndex] = col;

  return { columns: newColumns, value: computeValue(newColumns) };
}

/**
 * Reset entire abacus to zero.
 * Deterministic, instant, no stale state.
 */
export function resetAbacus(columnCount: number): AbacusState {
  return createAbacusState(columnCount);
}

/**
 * Resize abacus (change column count), preserving value if possible.
 */
export function resizeAbacus(state: AbacusState, newColumnCount: number): AbacusState {
  const maxValue = Math.pow(10, newColumnCount) - 1;
  const clampedValue = Math.min(state.value, maxValue);
  return stateFromValue(clampedValue, newColumnCount);
}

// ============= VALIDATION =============

/**
 * Validate entire abacus state is consistent.
 * Returns true if visual state matches logical value.
 */
export function validateState(state: AbacusState): boolean {
  // Check every column is valid
  for (const col of state.columns) {
    if (!isValidColumn(col)) return false;
    if (columnDigit(col) > 9) return false;
  }

  // Check computed value matches stored value
  const computed = computeValue(state.columns);
  if (computed !== state.value) return false;

  return true;
}

// ============= ADDITION / SUBTRACTION WITH CARRY/BORROW =============

/**
 * Add a number to the abacus with automatic carry.
 * Returns new state or null if result overflows.
 */
export function addToAbacus(state: AbacusState, amount: number): AbacusState | null {
  const newValue = state.value + amount;
  const maxValue = Math.pow(10, state.columns.length) - 1;

  if (newValue < 0 || newValue > maxValue) return null;

  return stateFromValue(newValue, state.columns.length);
}

/**
 * Subtract a number from the abacus with automatic borrow.
 * Returns new state or null if result would be negative.
 */
export function subtractFromAbacus(state: AbacusState, amount: number): AbacusState | null {
  return addToAbacus(state, -amount);
}
