import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "3" -> "03" — the brand uses zero-padded section numbers. */
export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

/** Round for display without dragging float noise into the UI. */
export function round(v: number, dp = 2) {
  const f = 10 ** dp
  return Math.round(v * f) / f
}
