// Scroll-scrubbed signature state on the first wall, shared imperatively so the
// camera (R3F), the hero dim (R3F) and the DOM signature overlay all move in
// lockstep without per-frame React re-renders.
//   progress 1 = formed: resting wall view, signature written, art dimmed
//   progress 0 = zoomed into the painting, signature gone
// `target` is what the wheel/drag sets; `progress` eases toward it each frame.
// Defaults to 0 so the very first load opens zoomed in and the visitor scrolls
// down to reveal; every later arrival at the wall resets it to 1 (formed).
export const introScrub = { progress: 0, target: 0 }
