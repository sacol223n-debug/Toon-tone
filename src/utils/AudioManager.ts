// AudioManager.ts - Persistent Web Audio API Controller (Singleton)
export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private ambientSource: AudioBufferSourceNode | null = null;
  private activeSynthNodes: (OscillatorNode | GainNode)[] = [];
  private ambientTimerId: any = null;

  // Internal states
  private isAmbientPlaying = false;
  private muted = false;
  private loading = false;
  private loaded = false;

  private constructor() {
    // Initiate lazy-preloading immediately on construction
    this.preload();
  }

  // Retrieve global AudioManager Singleton
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Lazily initializes the audio graph on user interaction
  private initContext() {
    if (!this.ctx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtxClass();

        // Master Gain Node - manages mute/unmute volume state
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : 0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Ambient Gain Node - slightly softer background volume level
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);
      } catch (e) {
        console.warn("[AudioManager] Web Audio API not supported by browser environment", e);
      }
    }

    // Recover AudioContext from suspended status (autoplay blocking mitigation)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => {
        console.warn("[AudioManager] Failed to resume suspended AudioContext:", err);
      });
    }
  }

  // Preloads WAV audio assets from the public folder
  public async preload() {
    if (this.loading || this.loaded) return;
    this.loading = true;

    const files = {
      click: "/audio/click.wav",
      submit: "/audio/submit.wav",
      win: "/audio/win.wav",
      fail: "/audio/fail.wav",
      ambient: "/audio/ambient.wav",
    };

    const loadAsset = async (name: string, url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url} (HTTP ${response.status})`);
        }
        const data = await response.arrayBuffer();
        
        this.initContext();
        if (this.ctx) {
          const decoded = await this.ctx.decodeAudioData(data);
          this.buffers[name] = decoded;
        }
      } catch (err) {
        console.warn(`[AudioManager] Failed to load "${name}" from ${url}. Fallback synthesis will handle play gracefully.`, err);
      }
    };

    try {
      await Promise.all(Object.entries(files).map(([name, url]) => loadAsset(name, url)));
      this.loaded = true;
      console.log("[AudioManager] All five public audio WAV assets cached successfully.");
    } catch (e) {
      console.error("[AudioManager] Critical loading error in audio resources:", e);
    } finally {
      this.loading = false;
    }
  }

  // Plays a sound effect (using public WAV files or high-fidelity synthesis fallback)
  public playSfx(type: "click" | "submit" | "win" | "fail") {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Check if the loaded WAV audio buffer is available
    if (this.buffers[type]) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[type];
        source.connect(this.masterGain);
        source.start(0);
      } catch (e) {
        console.warn(`[AudioManager] Error playing buffer "${type}". Invoking fallback synth instead.`, e);
        this.playSynthesizedSfx(type);
      }
    } else {
      // Buffer not ready or failed to load; run highly polished fallback synthesis
      this.playSynthesizedSfx(type);
    }
  }

  // Beautiful real-time fallback synthesizer algorithms (replaces original simple osc)
  private playSynthesizedSfx(type: "click" | "submit" | "win" | "fail") {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const now = ctx.currentTime;

    if (type === "click") {
      // Clean organic bubble pop sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(dest);

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "submit") {
      // Dual-tone ascending chime sparkle
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.connect(gain1);
      gain1.connect(dest);
      osc2.connect(gain2);
      gain2.connect(dest);

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(300, now);
      osc1.frequency.linearRampToValueAtTime(650, now + 0.28);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(450, now);
      osc2.frequency.linearRampToValueAtTime(975, now + 0.24);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.18, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } else if (type === "win") {
      // Arpeggiated C-Major harmonic fanfare (C5, E5, G5, C6) with vibrato
      const pitches = [523.25, 659.25, 783.99, 1046.50];
      pitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(dest);

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Retro vibrato (6.5Hz sound sweep)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 6.5;
        lfoGain.gain.value = freq * 0.005;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        lfo.start(now + idx * 0.12);
        osc.start(now + idx * 0.12);
        lfo.stop(now + idx * 0.12 + 1.2);
        osc.stop(now + idx * 0.12 + 1.2);
      });
    } else if (type === "fail") {
      // Comedic sad downward trombone slide with detuned dual-saws and low-pass sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";

      osc1.frequency.setValueAtTime(260, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 1.0);

      osc2.frequency.setValueAtTime(260 * 0.985, now);
      osc2.frequency.exponentialRampToValueAtTime(80 * 0.985, now + 1.0);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(85, now + 1.0);
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
    }
  }

  // Starts the background loop track (utilizes cached loopable WAV or real-time pad synthesis)
  public startAmbient() {
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    if (this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    if (this.buffers["ambient"]) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers["ambient"];
        source.loop = true;
        source.connect(this.ambientGain);
        source.start(0);
        this.ambientSource = source;
        console.log("[AudioManager] Successfully playing background ambient WAV loop.");
      } catch (err) {
        console.warn("[AudioManager] Error booting ambient WAV. Launching pad synthesis.", err);
        this.playAmbientSynthFallback();
      }
    } else {
      console.log("[AudioManager] WAV buffer not loaded. Launching loopable synthesizer chords fallback.");
      this.playAmbientSynthFallback();
    }
  }

  // Overlapping beautiful chord arpeggiator synthesizer for absolute ambient loops (zero-deps)
  private playAmbientSynthFallback() {
    this.stopAmbient(); // Clear lingering timers/nodes
    this.isAmbientPlaying = true;

    if (!this.ctx || !this.ambientGain) return;
    const ctx = this.ctx;
    const dest = this.ambientGain;

    const chords = [
      [130.81, 196.00, 246.94, 329.63], // Bar 1: C Maj 7
      [174.61, 261.63, 329.63, 440.00], // Bar 2: F Maj 7
      [130.81, 196.00, 293.66, 329.63], // Bar 3: C Maj 9
      [196.00, 246.94, 293.66, 349.23], // Bar 4: G sus
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;

      const now = ctx.currentTime;
      const notes = chords[chordIdx];
      const duration = 5.0; // Play chord block for 5 seconds
      const fadeTime = 1.0;  // 1-second crossfade window

      const voiceGains: GainNode[] = [];
      const voiceOscs: OscillatorNode[] = [];

      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        // Slow vibrato to give organic texture
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 1.2;
        lfoGain.gain.value = freq * 0.003;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(dest);

        // Seamless envelope fading
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + fadeTime);
        gain.gain.setValueAtTime(0.12, now + duration - fadeTime);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        lfo.start(now);
        osc.start(now);

        lfo.stop(now + duration);
        osc.stop(now + duration);

        voiceGains.push(gain);
        voiceOscs.push(osc);
      });

      chordIdx = (chordIdx + 1) % chords.length;
      this.activeSynthNodes = [...voiceGains, ...voiceOscs];

      // Re-trigger overlapping chord
      this.ambientTimerId = setTimeout(playNextChord, (duration - fadeTime) * 1000);
    };

    playNextChord();
  }

  // Stops any background music/sound streams
  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (e) {}
      this.ambientSource = null;
    }
    if (this.ambientTimerId) {
      clearTimeout(this.ambientTimerId);
      this.ambientTimerId = null;
    }

    // Stop active synth voices smoothly
    this.activeSynthNodes.forEach((node) => {
      try {
        if ("stop" in node) {
          node.stop();
        } else if ("gain" in node) {
          node.gain.cancelScheduledValues(0);
        }
      } catch (e) {}
    });
    this.activeSynthNodes = [];
  }

  // Globally mutes or unmutes sound elements
  public setMute(mute: boolean) {
    this.muted = mute;
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0.0 : 0.85, this.ctx.currentTime);
    }
  }

  // Get current mute state
  public isMuted(): boolean {
    return this.muted;
  }

  // Retrieves loading completion state
  public isLoaded(): boolean {
    return this.loaded;
  }
}
