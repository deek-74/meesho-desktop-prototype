import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInputButtonProps {
  onValueDetected: (value: number) => void;
  lang?: string;
}

export const SpeechInputButton: React.FC<SpeechInputButtonProps> = ({
  onValueDetected,
  lang = 'hi-IN',
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    }
  }, []);

  if (!isSupported) {
    return null; // Silently hide if unsupported
  }

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Extract numbers from voice transcript
      const match = transcript.match(/\d+(\.\d+)?/);
      if (match) {
        const val = parseFloat(match[0]);
        if (!isNaN(val)) {
          onValueDetected(val);
        }
      }
    };

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={startListening}
      title="Speak number (e.g. 299)"
      className={`p-2 rounded-lg border transition-colors ${
        isListening
          ? 'bg-red-100 border-red-400 text-red-600 animate-pulse'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};
