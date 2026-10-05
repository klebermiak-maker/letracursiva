// Web Audio API Synthesizer and Web Speech API narrator for immediate feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;

  constructor() {
    // Lazily init AudioContext on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public isVoiceEnabled() {
    return this.voiceEnabled;
  }

  // Play gentle pop/bubble sound when touching canvas or clicking buttons
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Play a soft paper drawing swoosh sound
  public playStrokeTick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 40, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Play a bright sparkle chime when hitting a guiding waypoint checkpoint
  public playCheckpoint(index: number = 0) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Pentatonic scale frequencies (C5, D5, E5, G5, A5, C6)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[index % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Play star chime when rating stars appear
  public playStar(starIndex: number) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFrequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const freq = baseFrequencies[Math.min(starIndex, baseFrequencies.length - 1)];

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Play celebration fanfare when letter/word is completed
  public playCelebration() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.12 },    // C5
      { f: 659.25, t: 0.1, d: 0.12 },  // E5
      { f: 783.99, t: 0.2, d: 0.14 },  // G5
      { f: 1046.5, t: 0.32, d: 0.45 }, // C6
    ];

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + note.t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + note.d);
    });
  }

  // Narrate encouraging messages or letter names in Brazilian Portuguese
  public speak(text: string) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95; // slightly slower for clear comprehension for kids
      utterance.pitch = 1.2; // warm and friendly pitch

      // Try finding a PT-BR voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.startsWith('pt') || v.lang.includes('BR') || v.name.toLowerCase().includes('brazil')
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is disabled or blocked
    }
  }
}

export const sound = new SoundEngine();
