type AudioContextConstructor = typeof AudioContext;

type GlobalWithWebkitAudioContext = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

type HeatmapDocument = Pick<Document, 'addEventListener'>;

type HeatmapNavigator = {
  userActivation?: {
    hasBeenActive?: boolean;
  };
};

export type CreateHeatmapSoundsOptions = {
  createAudioContext?: () => AudioContext | null;
  document?: HeatmapDocument | null;
  navigator?: HeatmapNavigator | null;
  random?: () => number;
};

export type HeatmapSounds = {
  click: () => void;
  installUnlockListeners: () => void;
  tick: () => void;
};

function createDefaultAudioContext(): AudioContext | null {
  const AudioContextConstructor =
    globalThis.AudioContext ?? (globalThis as GlobalWithWebkitAudioContext).webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

export function createHeatmapSounds({
  createAudioContext = createDefaultAudioContext,
  document: documentRef = globalThis.document,
  navigator: navigatorRef = globalThis.navigator,
  random = Math.random,
}: CreateHeatmapSoundsOptions = {}): HeatmapSounds {
  let audioContext: AudioContext | null = null;
  let audioUnlocked = navigatorRef?.userActivation?.hasBeenActive === true;
  let unlockListenersInstalled = false;

  function getAudioContext(): AudioContext | null {
    if (!audioContext) {
      audioContext = createAudioContext();
    }

    return audioContext;
  }

  function hasUserActivation(): boolean {
    return audioUnlocked || navigatorRef?.userActivation?.hasBeenActive === true;
  }

  function resumeAudioContext(ctx: AudioContext): void {
    if (ctx.state !== 'suspended') {
      audioUnlocked = true;
      return;
    }

    const resumeResult = ctx.resume();

    if (resumeResult && typeof resumeResult.then === 'function') {
      void resumeResult
        .then(() => {
          audioUnlocked = true;
        })
        .catch(() => {});
    }
  }

  function primeSilentBuffer(ctx: AudioContext): void {
    const source = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const gain = ctx.createGain();

    gain.gain.value = 0;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  function unlockAudioContext(): void {
    audioUnlocked = true;

    const ctx = getAudioContext();
    if (!ctx) return;

    resumeAudioContext(ctx);
    primeSilentBuffer(ctx);
  }

  function getPlayableAudioContext({
    unlock = false,
  }: { unlock?: boolean } = {}): AudioContext | null {
    if (unlock) {
      audioUnlocked = true;
    }

    if (!hasUserActivation()) {
      return null;
    }

    const ctx = getAudioContext();
    if (!ctx) return null;

    resumeAudioContext(ctx);
    return ctx;
  }

  function playTick(): void {
    const ctx = getPlayableAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.003, ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (random() * 2 - 1) * Math.exp(-i / 15);
    }

    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  function playClick(): void {
    const ctx = getPlayableAudioContext({ unlock: true });
    if (!ctx) return;

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.006, ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (random() * 2 - 1) * Math.exp(-i / 40);
    }

    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000 + random() * 800;
    filter.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.32;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  return {
    click: playClick,
    installUnlockListeners() {
      if (unlockListenersInstalled || !documentRef?.addEventListener) {
        return;
      }

      unlockListenersInstalled = true;
      documentRef.addEventListener('pointerdown', unlockAudioContext, {
        capture: true,
        once: true,
        passive: true,
      });
      documentRef.addEventListener('keydown', unlockAudioContext, {
        capture: true,
        once: true,
      });
    },
    tick: playTick,
  };
}
