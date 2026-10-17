"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import { browserSpeechSupported } from "./browser-speech";

// One player for everything the interview reads aloud (original question,
// translated question). Starting one stops the other, nothing auto-replays
// on re-render, and recording stops playback first - so the original audio,
// the translated audio and the microphone never interfere.
//
// Server voice first; if it isn't available, the browser's own voice,
// spoken sentence by sentence (Chrome silently cuts a single long utterance
// off after ~15 seconds - the "incomplete English audio" problem).

export type AudioState = { key: string | null; status: "idle" | "loading" | "playing" };

function splitForSpeech(text: string): string[] {
  const parts = text.match(/[^.!?؟。\n]+[.!?؟。]*\s*/g) ?? [text];
  const chunks: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 180) {
      chunks.push(trimmed);
      continue;
    }
    // Long sentence: break on commas / spaces.
    let rest = trimmed;
    while (rest.length > 180) {
      const cut = Math.max(rest.lastIndexOf(",", 180), rest.lastIndexOf("،", 180), rest.lastIndexOf(" ", 180));
      const at = cut > 40 ? cut + 1 : 180;
      chunks.push(rest.slice(0, at).trim());
      rest = rest.slice(at);
    }
    if (rest.trim()) chunks.push(rest.trim());
  }
  return chunks;
}

async function pickVoice(languageCode: string): Promise<SpeechSynthesisVoice | null> {
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  if (!voices.length) {
    voices = await new Promise((resolve) => {
      const done = () => resolve(synth.getVoices());
      synth.addEventListener("voiceschanged", done, { once: true });
      setTimeout(done, 1500);
    });
  }
  const code = languageCode.toLowerCase();
  const prefix = code.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === code) ||
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix)) ||
    null
  );
}

interface UseInterviewAudio {
  state: AudioState;
  notice: { key: string; languageCode: string } | null;
  play: (key: string, opts: { text: string; languageCode: string; serverLanguageCode?: string | null }) => Promise<void>;
  stop: () => void;
}

export function useInterviewAudio(sessionId: string, token: string): UseInterviewAudio {
  const [state, setState] = useState<AudioState>({ key: null, status: "idle" });
  const [notice, setNotice] = useState<{ key: string; languageCode: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0);
  // Server audio known to be unavailable for this page view (e.g. provider
  // down) - don't wait on it again for every click.
  const serverDownRef = useRef(false);

  const stop = useCallback(() => {
    runRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (browserSpeechSupported()) window.speechSynthesis.cancel();
    setState({ key: null, status: "idle" });
  }, []);

  useEffect(() => stop, [stop]);

  const speakWithBrowser = useCallback(async (run: number, key: string, text: string, languageCode: string) => {
    if (!browserSpeechSupported() || !text) return false;
    const voice = await pickVoice(languageCode);
    if (!voice || run !== runRef.current) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = splitForSpeech(text);
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.95;
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (run === runRef.current) setState({ key: null, status: "idle" });
        };
      }
      utterance.onerror = (event) => {
        // "interrupted"/"canceled" = we stopped it on purpose.
        if (run === runRef.current && event.error !== "interrupted" && event.error !== "canceled") {
          setState({ key: null, status: "idle" });
        }
      };
      synth.speak(utterance);
    });
    setState({ key, status: "playing" });
    return true;
  }, []);

  const play = useCallback<UseInterviewAudio["play"]>(
    async (key, { text, languageCode, serverLanguageCode }) => {
      stop();
      const run = runRef.current;
      setNotice(null);
      setState({ key, status: "loading" });

      if (serverLanguageCode && !serverDownRef.current) {
        try {
          const artifact = await interviewSessionService.getQuestionAudio(sessionId, token, serverLanguageCode);
          if (run !== runRef.current) return;
          if (artifact.audio_url) {
            const audio = new Audio(artifact.audio_url);
            audioRef.current = audio;
            audio.onended = () => {
              if (run === runRef.current) setState({ key: null, status: "idle" });
            };
            try {
              await audio.play();
              if (run === runRef.current) setState({ key, status: "playing" });
              return;
            } catch {
              audioRef.current = null; // fall through to the browser voice
            }
          }
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response?.status;
          // 400 = no translation / unsupported language for this question;
          // anything else = the voice service itself is unavailable.
          if (status !== 400) serverDownRef.current = true;
          if (run !== runRef.current) return;
        }
      }

      const spoke = await speakWithBrowser(run, key, text, languageCode);
      if (run !== runRef.current) return;
      if (!spoke) {
        setState({ key: null, status: "idle" });
        setNotice({ key, languageCode });
      }
    },
    [sessionId, token, stop, speakWithBrowser]
  );

  return { state, notice, play, stop };
}
