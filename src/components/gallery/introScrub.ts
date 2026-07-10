// Scroll-scrubbed signature state on the first wall, shared imperatively so the
// camera (R3F), the hero dim (R3F) and the DOM signature overlay all move in
// lockstep without per-frame React re-renders.
//   progress 1 = formed (default): resting wall view, signature written, art dimmed
//   progress 0 = zoomed into the painting, signature gone
// `target` is what the wheel/drag sets; `progress` eases toward it each frame.
// Defaults to 1 so the wall always opens in the finished state; scrolling in
// takes it toward 0.
export const introScrub = { progress: 1, target: 1 }
