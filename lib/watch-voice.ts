type SpeakResult = boolean;

export type WatchVoice = {
  speak: (text: string) => Promise<SpeakResult>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
};

function synth() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

const FEMALE_HINTS = [
  "zira",
  "jenny",
  "aria",
  "sonia",
  "hazel",
  "susan",
  "samantha",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "fiona",
  "veena",
  "kate",
  "serena",
  "eva",
  "linda",
  "heather",
  "michelle",
  "salli",
  "ivy",
  "joanna",
  "kendra",
  "kimberly",
  "nicole",
  "amy",
  "emma",
  "raveena",
  "aditi",
  "natasha",
  "female",
  "woman",
  "google us english",
];

const MALE_HINTS = [
  "david",
  "mark",
  "guy",
  "ryan",
  "richard",
  "george",
  "daniel",
  "thomas",
  "james",
  "john",
  "matthew",
  "alex",
  "male",
  "man",
];

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (lang.startsWith("en")) score += 8;
  if (lang.startsWith("en-us") || lang.startsWith("en_us")) score += 3;
  if (lang.startsWith("en-gb") || lang.startsWith("en_gb")) score += 2;
  if (voice.localService) score += 2;
  if (voice.default) score += 1;

  if (FEMALE_HINTS.some((hint) => name.includes(hint))) score += 20;
  if (MALE_HINTS.some((hint) => name.includes(hint))) score -= 25;

  return score;
}

function pickFemaleVoice(voices: SpeechSynthesisVoice[]) {
  if (!voices.length) return null;

  const ranked = [...voices].sort((left, right) => scoreVoice(right) - scoreVoice(left));
  const best = ranked[0];
  if (best && scoreVoice(best) > 0) return best;

  return voices.find((voice) => /^en(-|$)/i.test(voice.lang)) ?? voices[0] ?? null;
}

function loadVoices(engine: SpeechSynthesis) {
  const ready = engine.getVoices();
  if (ready.length) return Promise.resolve(ready);

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const finish = () => {
      engine.removeEventListener("voiceschanged", finish);
      window.clearTimeout(timer);
      resolve(engine.getVoices());
    };
    const timer = window.setTimeout(finish, 700);
    engine.addEventListener("voiceschanged", finish);
  });
}

export function createWatchVoice(): WatchVoice {
  let utterance: SpeechSynthesisUtterance | null = null;
  let startTimer: number | null = null;
  let keepAlive: number | null = null;
  let fallbackTimer: number | null = null;
  let token = 0;
  let held = false;
  let resolveDone: ((completed: SpeakResult) => void) | null = null;

  function clearTimers() {
    if (startTimer != null) window.clearTimeout(startTimer);
    if (keepAlive != null) window.clearInterval(keepAlive);
    if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
    startTimer = null;
    keepAlive = null;
    fallbackTimer = null;
  }

  function finish(completed: SpeakResult) {
    const resolve = resolveDone;
    resolveDone = null;
    utterance = null;
    clearTimers();
    resolve?.(completed);
  }

  function cancel() {
    token += 1;
    held = false;
    const engine = synth();
    engine?.cancel();
    finish(false);
  }

  return {
    speak(text) {
      cancel();
      const engine = synth();
      if (!engine) return Promise.resolve(true);

      const myToken = (token += 1);
      held = false;

      return new Promise<SpeakResult>((resolve) => {
        resolveDone = resolve;

        void loadVoices(engine).then((voices) => {
          if (token !== myToken) return;

          const utter = new SpeechSynthesisUtterance(text);
          utterance = utter;
          utter.rate = 1;
          utter.pitch = 1.04;
          utter.volume = 1;

          const female = pickFemaleVoice(voices);
          if (female) utter.voice = female;
          if (!female || scoreVoice(female) < 20) utter.pitch = 1.18;

          const done = () => {
            if (token !== myToken) return;
            finish(true);
          };

          utter.onend = done;
          utter.onerror = (event) => {
            if (event.error === "interrupted" || event.error === "canceled") return;
            done();
          };

          startTimer = window.setTimeout(() => {
            if (token !== myToken) return;
            engine.speak(utter);
            if (held) engine.pause();
          }, 80);

          keepAlive = window.setInterval(() => {
            if (token !== myToken || held) return;
            if (engine.paused || !engine.speaking) return;
            engine.resume();
          }, 5000);

          const armFallback = (ms: number) => {
            fallbackTimer = window.setTimeout(() => {
              if (token !== myToken || held) return;
              if (engine.speaking || engine.pending || engine.paused) {
                armFallback(8000);
                return;
              }
              done();
            }, ms);
          };

          armFallback(Math.min(90_000, Math.max(8_000, text.length * 90)));
        });
      });
    },
    pause() {
      held = true;
      const engine = synth();
      if (engine?.speaking) engine.pause();
    },
    resume() {
      held = false;
      synth()?.resume();
    },
    cancel,
  };
}
