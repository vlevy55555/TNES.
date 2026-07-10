// Scroll-scrubbed opening progress, shared imperatively so the camera (R3F),
// the hero dim (R3F) and the DOM signature overlay all move in lockstep without
// per-frame React re-renders.
//   progress 0 = framed inside the hero, no signature, painting bright
//   progress 1 = resting wall view, full signature, painting dimmed
// `target` is what the wheel/drag sets; `progress` eases toward it each frame.
export const introScrub = { progress: 0, target: 0 }
