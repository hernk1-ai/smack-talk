import { getSoundMutedPreference } from "@/lib/preferences";

export type SoundEvent =
  | "take_locked"
  | "pick_locked"
  | "ride"
  | "fade"
  | "reply_posted"
  | "follow_request"
  | "follow_accepted"
  | "error"
  | "success";

let context: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  context = context ?? new AudioContextCtor();
  return context;
}

function pulse({
  frequency,
  duration,
  type,
  gain = 0.06,
}: {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain?: number;
}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function playSound(event: SoundEvent) {
  if (typeof window === "undefined") return;
  if (getSoundMutedPreference()) return;

  switch (event) {
    case "take_locked":
      pulse({ frequency: 220, duration: 0.08, type: "square", gain: 0.07 });
      pulse({ frequency: 330, duration: 0.12, type: "triangle", gain: 0.05 });
      return;
    case "pick_locked":
      pulse({ frequency: 250, duration: 0.09, type: "square", gain: 0.06 });
      pulse({ frequency: 370, duration: 0.13, type: "triangle", gain: 0.05 });
      return;
    case "ride":
      pulse({ frequency: 520, duration: 0.08, type: "sine", gain: 0.05 });
      return;
    case "fade":
      pulse({ frequency: 180, duration: 0.1, type: "sawtooth", gain: 0.05 });
      return;
    case "reply_posted":
      pulse({ frequency: 460, duration: 0.06, type: "triangle", gain: 0.04 });
      return;
    case "follow_request":
      pulse({ frequency: 410, duration: 0.07, type: "sine", gain: 0.045 });
      return;
    case "follow_accepted":
      pulse({ frequency: 550, duration: 0.09, type: "sine", gain: 0.05 });
      pulse({ frequency: 690, duration: 0.09, type: "sine", gain: 0.04 });
      return;
    case "error":
      pulse({ frequency: 130, duration: 0.12, type: "square", gain: 0.05 });
      return;
    case "success":
      pulse({ frequency: 600, duration: 0.08, type: "triangle", gain: 0.05 });
      pulse({ frequency: 760, duration: 0.1, type: "triangle", gain: 0.04 });
      return;
    default:
      return;
  }
}
