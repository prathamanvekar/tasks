// Web Audio API Sound Synthesizer for ASMR-like UI feedback
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper to generate a scratch sound (pencil on paper) using bandpass filtered white noise
export function playScratchSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // We do a double-scratch sound: "ch-ch"
    triggerSingleScratch(ctx, now);
    triggerSingleScratch(ctx, now + 0.08, 0.7); // slightly softer second scratch
  } catch (e) {
    console.warn("Failed to play scratch sound:", e);
  }
}

function triggerSingleScratch(ctx: AudioContext, startTime: number, volumeScale = 1.0) {
  const duration = 0.07; // 70ms scratch
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  // Filter to make it sound like a pencil scratch (mid-to-high frequencies)
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1600; // resonant scratch frequency
  filter.Q.value = 3.0;

  // Gain node for envelope
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.12 * volumeScale, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Connect graph
  noiseNode.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noiseNode.start(startTime);
  noiseNode.stop(startTime + duration);
}

// Helper to play a tiny, clean tick sound for input focus
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 0.04; // 40ms

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Failed to play tick sound:", e);
  }
}

// Helper to play a satisfying, tactile mechanical keyboard blue switch click
export function playSparkSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Part 1: High-frequency click transient (noise burst representing contact click)
    const clickDuration = 0.004; // 4ms
    const clickBuffer = ctx.createBuffer(1, ctx.sampleRate * clickDuration, ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickBuffer.length; i++) {
      clickData[i] = Math.random() * 2 - 1;
    }
    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 6500; // super sharp treble tick

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.05, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + clickDuration);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickSource.start(now);
    clickSource.stop(now + clickDuration);

    // Part 2: Low-frequency switch bottoming out (fast decaying sine wave)
    const tapDuration = 0.012; // 12ms
    const osc = ctx.createOscillator();
    const tapGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + tapDuration);

    tapGain.gain.setValueAtTime(0.03, now); // soft tactile tap volume
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + tapDuration);

    osc.connect(tapGain);
    tapGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + tapDuration);
  } catch (e) {
    console.warn("Failed to play mechanical click sound:", e);
  }
}

// Helper to play a soft, warm major pentatonic arpeggio/chord for target completion
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Lavender-toned major 9th chord arpeggio: C4, G4, C5, D5, G5
    const frequencies = [261.63, 392.00, 523.25, 587.33, 783.99];

    frequencies.forEach((freq, index) => {
      const noteDelay = index * 0.08;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + noteDelay);

      // Soft envelope
      gainNode.gain.setValueAtTime(0, now + noteDelay);
      gainNode.gain.linearRampToValueAtTime(0.08, now + noteDelay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteDelay + 1.2);

      // Filter to cut harsh highs
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + noteDelay);
      osc.stop(now + noteDelay + 1.3);
    });
  } catch (e) {
    console.warn("Failed to play success sound:", e);
  }
}
