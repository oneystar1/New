// Tiny pub/sub for visual effects (confetti, shake) so the store can fire
// them without importing React.
export type FxEvent = { kind: 'confetti'; intensity: number } | { kind: 'shake' } | { kind: 'flash'; color: string };
type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();
export function onFx(l: Listener): () => void { listeners.add(l); return () => listeners.delete(l); }
export function fx(e: FxEvent): void { for (const l of listeners) l(e); }
