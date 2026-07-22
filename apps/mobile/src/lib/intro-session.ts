let shown = false

export function introShownThisSession(): boolean {
  return shown
}

export function markIntroShown() {
  shown = true
}
