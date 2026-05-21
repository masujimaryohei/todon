'use client';

import { useCallback, useState } from 'react';

type Props = {
  onText: (text: string) => void;
  disabled?: boolean;
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceInputButton({ onText, disabled }: Props) {
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    const Win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

    const Ctor = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!Ctor) {
      alert('このブラウザは音声入力に未対応です（Chrome 推奨）');
      return;
    }

    const rec = new Ctor();
    rec.lang = 'ja-JP';
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      if (text) {
        onText(text);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }, [onText]);

  return (
    <button
      type="button"
      disabled={disabled || listening}
      onClick={start}
      className="todon-btn-ghost text-xs"
      title="音声入力（v3）"
    >
      {listening ? '🎙 聞き取り中…' : '🎙 音声'}
    </button>
  );
}
