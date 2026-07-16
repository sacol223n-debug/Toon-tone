import fs from "fs";
import path from "path";

// Formats a wav file with standard 44-byte Header and writes to target path
function writeWavFile(filePath: string, sampleRate: number, samples: Float32Array) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size minus 8
  view.setUint32(4, 36 + samples.length * 2, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Chunk length (16 for PCM)
  view.setUint32(16, 16, true);
  // Audio format (1 = PCM)
  view.setUint16(20, 1, true);
  // Channels (1 = Mono)
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (channels * bytes/sample)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write PCM audio data (clamp float samples between -1 and 1 and scale to 16-bit signed integer)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, sample, true);
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, Buffer.from(buffer));
  console.log(`✓ Audio generated successfully at: ${filePath} (${samples.length} samples)`);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Global parameters
const SAMPLE_RATE = 44100;

// 1. CLICK SFX Generator (short organic popping bubble click)
function generateClickSFX(): Float32Array {
  const duration = 0.08; // 80ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Fast frequency decay sweep 600Hz -> 80Hz
    const pitchDecay = Math.exp(-t * 90);
    const freq = 80 + 520 * pitchDecay;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    // Fast amplitude envelope decay
    const ampEnvelope = Math.exp(-t * 70);
    samples[i] = Math.sin(phase) * ampEnvelope * 0.45;
  }
  return samples;
}

// 2. SUBMIT SFX Generator (magical ascending tone sparkle)
function generateSubmitSFX(): Float32Array {
  const duration = 0.28; // 280ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  let phase1 = 0;
  let phase2 = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Core tone rising gracefully 300Hz -> 650Hz
    const freq1 = 300 + 350 * progress;
    phase1 += (2 * Math.PI * freq1) / SAMPLE_RATE;
    const tone1 = Math.sin(phase1);

    // Harmonic fifth chime offset layer rising 450Hz -> 975Hz (perfect harmony)
    let tone2 = 0;
    if (t > 0.04) {
      const freq2 = 450 + 525 * ((t - 0.04) / (duration - 0.04));
      phase2 += (2 * Math.PI * freq2) / SAMPLE_RATE;
      tone2 = Math.sin(phase2) * 0.5 * Math.exp(-(t - 0.04) * 20); // crisp high chime spark
    }

    // Bell envelope fading toward end
    const ampEnvelope = Math.sin(Math.PI * progress) * Math.exp(-t * 3);
    samples[i] = (tone1 + tone2) * ampEnvelope * 0.35;
  }
  return samples;
}

// 3. WIN SFX Generator (triumphant retro major-harmony arpeggiator fanfare)
function generateWinSFX(): Float32Array {
  const duration = 1.8; // 1.8 seconds
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Arpeggio structure (C5, E5, G5, C6) + root harmonies
  const voices = [
    { freq: 261.63, start: 0.0, decay: 1.2, vol: 0.25, type: 'sine' },      // Root C4 depth
    { freq: 329.63, start: 0.1, decay: 1.2, vol: 0.20, type: 'triangle' },  // E4 body
    { freq: 523.25, start: 0.0, decay: 1.5, vol: 0.30, type: 'sine' },      // C5
    { freq: 659.25, start: 0.12, decay: 1.5, vol: 0.25, type: 'triangle' }, // E5
    { freq: 783.99, start: 0.24, decay: 1.5, vol: 0.25, type: 'sine' },      // G5
    { freq: 1046.50, start: 0.36, decay: 1.6, vol: 0.28, type: 'sine' },     // C6
    { freq: 1318.51, start: 0.48, decay: 1.3, vol: 0.15, type: 'sine' }      // E6 Sparkle
  ];

  // Dynamic phase trackers
  const phases = new Float32Array(voices.length);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let mixedSample = 0;

    for (let v = 0; v < voices.length; v++) {
      const voice = voices[v];
      if (t >= voice.start) {
        const vt = t - voice.start;
        // Pitch vibrato (6Hz frequency modulation) for rich analog feel
        const vibrato = 1 + 0.005 * Math.sin(2 * Math.PI * 6.5 * vt);
        const freq = voice.freq * vibrato;
        phases[v] += (2 * Math.PI * freq) / SAMPLE_RATE;

        let val = 0;
        if (voice.type === 'sine') {
          val = Math.sin(phases[v]);
        } else {
          // Warm Triangle wave: 8 * abs((x/2pi)%1 - 0.5) - 1
          const normPhase = (phases[v] / (2 * Math.PI)) % 1;
          val = 4 * Math.abs(normPhase - 0.5) - 1;
        }

        // Apply slow decay to the specific node envelope
        const env = Math.exp(-vt * voice.decay);
        mixedSample += val * voice.vol * env;
      }
    }

    // Master compress / warm saturation fadeout
    const masterEnv = t > 1.4 ? (1.8 - t) / 0.4 : 1.0;
    samples[i] = mixedSample * masterEnv * 0.40;
  }
  return samples;
}

// 4. FAIL SFX Generator (cartoon sad trombone "wah-wah" slide sweep)
function generateFailSFX(): Float32Array {
  const duration = 1.0; // 1 second
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  let phase1 = 0;
  let phase2 = 0;
  let filtState = 0; // standard 1-pole Low-Pass Filter mock accumulator

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Sad comedic falling frequency slide (trombone swoop effect)
    // Starts at 260Hz and curves down to 75Hz
    const pitchCurve = Math.pow(progress, 1.4);
    const freq1 = 260 - 185 * pitchCurve;
    // Comedic heavy chorus: detuning secondary oscillator at -12 cents
    const freq2 = freq1 * 0.985;

    phase1 += (2 * Math.PI * freq1) / SAMPLE_RATE;
    phase2 += (2 * Math.PI * freq2) / SAMPLE_RATE;

    // Buzzing comical sawtooth wave generator (summing primary and chorus)
    const normPhase1 = (phase1 / (2 * Math.PI)) % 1;
    const saw1 = 2 * normPhase1 - 1;

    const normPhase2 = (phase2 / (2 * Math.PI)) % 1;
    const saw2 = 2 * normPhase2 - 1;

    const rawBuzz = (saw1 * 0.6 + saw2 * 0.4);

    // Simulated resonant sliding low-pass envelope (opens slightly then closes heavily for the wah-wah resonance)
    // Combines with tone amplitude fading out
    const wahEnv = Math.sin(Math.PI * progress);
    const alpha = 0.05 + 0.35 * wahEnv; // LPF cutoff sweep factor
    
    // RC Low-pass implementation
    filtState += alpha * (rawBuzz - filtState);

    const ampEnvelope = Math.sin(Math.PI * progress) * Math.exp(-t * 2);
    samples[i] = filtState * ampEnvelope * 0.38;
  }
  return samples;
}

// 5. AMBIENT MUSIC Generator (beautiful loopable watercolor background synth chords)
function generateAmbientSFX(): Float32Array {
  const duration = 12.0; // 12 seconds loop
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Soothing chord structures
  // Bar 1 (0s - 3s): C Maj 7 (C3, G3, B3, E4)
  // Bar 2 (3s - 6s): F Maj 7 (F3, C4, E4, A4)
  // Bar 3 (6s - 9s): C Maj 9 (C3, G3, D4, E4)
  // Bar 4 (9s - 12s): G sus soft resolution (G3, B3, D4, F4)
  const notesC = [130.81, 196.00, 246.94, 329.63]; // C3, G3, B3, E4
  const notesF = [174.61, 261.63, 329.63, 440.00]; // F3, C4, E4, A4
  const notesC9 = [130.81, 196.00, 293.66, 329.63]; // C3, G3, D4, E4
  const notesGsus = [196.00, 246.94, 293.66, 349.23]; // G3, B3, D4, F4

  const notesMatrix = [notesC, notesF, notesC9, notesGsus];
  const phases = notesC.map(() => 0); // 4 synth voices
  let lpf = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const barIdx = Math.floor(t / 3) % 4;
    const nextBarIdx = (barIdx + 1) % 4;
    const subTime = t % 3;

    // Smooth linear crossfade weight between chords inside bar transition (0.4s window)
    const crossfadeWidth = 0.4;
    let weightNext = 0;
    if (subTime > (3.0 - crossfadeWidth)) {
      weightNext = (subTime - (3.0 - crossfadeWidth)) / crossfadeWidth;
    }

    let synthSum = 0;
    for (let voice = 0; voice < 4; voice++) {
      const activeFreq = notesMatrix[barIdx][voice] * (1 - weightNext) + notesMatrix[nextBarIdx][voice] * weightNext;
      phases[voice] += (2 * Math.PI * activeFreq) / SAMPLE_RATE;

      // Pure warm triangle wave for nostalgic soothing texture
      const normP = (phases[voice] / (2 * Math.PI)) % 1;
      const tri = 4 * Math.abs(normP - 0.5) - 1;
      synthSum += tri * 0.25;
    }

    // Slow low pass filter sweep (organic breathing pad chords modulated at 0.15Hz)
    const lfo = Math.sin(2 * Math.PI * 0.15 * t);
    const filterCutoff = 0.08 + 0.05 * lfo; // sweeps filter smooth
    lpf += filterCutoff * (synthSum - lpf);

    // Smooth boundary loop windowing to avoid pops when repeating (fade boundaries at 0-250ms)
    let boundaryFade = 1.0;
    const fadeBounds = 0.25;
    if (t < fadeBounds) {
      boundaryFade = t / fadeBounds;
    } else if (t > (duration - fadeBounds)) {
      boundaryFade = (duration - t) / fadeBounds;
    }

    samples[i] = lpf * boundaryFade * 0.25;
  }
  return samples;
}

// Trigger process sequentially
console.log("=== TOONTONE WEB AUDIO SOURCE GENERATOR ===");
const basePublicPath = path.join(process.cwd(), "public", "audio");

try {
  writeWavFile(path.join(basePublicPath, "click.wav"), SAMPLE_RATE, generateClickSFX());
  writeWavFile(path.join(basePublicPath, "submit.wav"), SAMPLE_RATE, generateSubmitSFX());
  writeWavFile(path.join(basePublicPath, "win.wav"), SAMPLE_RATE, generateWinSFX());
  writeWavFile(path.join(basePublicPath, "fail.wav"), SAMPLE_RATE, generateFailSFX());
  writeWavFile(path.join(basePublicPath, "ambient.wav"), SAMPLE_RATE, generateAmbientSFX());
  console.log("===========================================");
  console.log("🚀 All five professional WAV audio assets generated inside public/audio!");
} catch (error) {
  console.error("❌ Failed to generate audio files:", error);
}
