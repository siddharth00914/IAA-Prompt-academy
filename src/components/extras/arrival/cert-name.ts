/**
 * Staff name for the certificate. The progress store has no name field and
 * must not be modified, so the name lives in its own localStorage key and is
 * written alongside checkIn() (the store's idempotent "I was here" entry).
 */
import { checkIn } from '@/lib/progress';

const NAME_KEY = 'iaa-prompt-academy:staff-name';

export function getStaffName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Persist the certificate name and log the check-in entry in the store. */
export function setStaffName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NAME_KEY, name.trim());
  } catch {
    // storage blocked — name lives for this render only
  }
  checkIn();
}
