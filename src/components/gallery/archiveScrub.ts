// Scroll progress on the opening (Signature) wall, shared imperatively so the
// camera (R3F) and the DOM signature overlay move in lockstep without per-frame
// React re-renders. The signature writes during the first phase and remains
// visible for the rest of the downward scroll:
//   [0, SCRUB_FORMED]            zoom out of the central print; the signature writes on
//   [SCRUB_FORMED, SCRUB_SHRUNK] hold at the formed wall view
// `target` is what the wheel sets; `progress` eases toward it each frame.
export const archiveScrub = { progress: 0, target: 0 }

// phase boundaries (calibration knobs)
export const SCRUB_FORMED = 0.35
export const SCRUB_SHRUNK = 0.62
