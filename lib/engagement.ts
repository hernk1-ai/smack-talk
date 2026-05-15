export const QUICK_PICK_WIN = 3;
export const QUICK_PICK_LOSS = -1;

export const RIDE_WIN = 12;
export const RIDE_LOSS = -6;

export const LOCK_WIN = 100;
export const LOCK_LOSS = -75;

export function formatRepSwing(winValue: number, lossValue: number) {
  return `+${winValue} / ${lossValue}`;
}
