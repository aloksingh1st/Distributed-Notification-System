import { prefetchGauge, rampPausedGauge } from "./metrics.js";


let currentPrefetch = 1;

const MIN_PREFETCH = 1;
const MAX_PREFETCH = 50;
const STEP = 5;
const RAMP_INTERVAL = 30000; // 30 seconds

let rampInterval = null;
let rampPaused = false;

/*
   Apply prefetch to channel
*/
export function applyPrefetch(channel) {
    channel.prefetch(currentPrefetch);
    prefetchGauge.set(currentPrefetch);
    console.log(`[RAMP] Prefetch set → ${currentPrefetch}`);
}

/*
   Start time-based ramp-up
*/
export function startRampUp(channel) {
    if (rampInterval) return;

    console.log("[RAMP] Starting ramp-up...");

    rampPaused = false;

    rampInterval = setInterval(() => {
        if (rampPaused) return;

        if (currentPrefetch >= MAX_PREFETCH) {
            console.log("[RAMP] Max prefetch reached");
            clearInterval(rampInterval);
            rampInterval = null;
            return;
        }

        currentPrefetch += STEP;
        applyPrefetch(channel);

    }, RAMP_INTERVAL);
}

/*
   Reset ramp when failure happens
*/
export function resetRamp(channel) {
    console.log("[RAMP] Reset due to system failure");

    if (rampInterval) {
        clearInterval(rampInterval);
        rampInterval = null;
    }

    currentPrefetch = MIN_PREFETCH;
    rampPaused = false;

    applyPrefetch(channel);
}


export function pauseRamp() {
    rampPaused = true;
    rampPausedGauge.set(1);
}

export function resumeRamp() {
    rampPaused = false;
    rampPausedGauge.set(0);
}