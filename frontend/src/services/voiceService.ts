import { Language } from '../types';

export function getLanguageSpeechCode(lang: Language): string {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'mr':
      return 'mr-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function startSpeechToText(
  lang: Language,
  onResult: (transcript: string) => void,
  onError: (error: string) => void,
  onEnd: () => void
): { stop: () => void } {
  if (!isSpeechRecognitionSupported()) {
    onError('Browser does not support Speech Recognition.');
    onEnd();
    return { stop: () => {} };
  }

  try {
    const SpeechRecognitionClass = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                                   (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getLanguageSpeechCode(lang);

    recognition.onresult = (event: any) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
      onEnd();
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };
  } catch (e) {
    onError('Unable to start speech recognition');
    onEnd();
    return { stop: () => {} };
  }
}

export function speakText(text: string, lang: Language, onEnd?: () => void): { stop: () => void } {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return { stop: () => {} };
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageSpeechCode(lang);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);

    return {
      stop: () => {
        window.speechSynthesis.cancel();
      }
    };
  } catch {
    if (onEnd) onEnd();
    return { stop: () => {} };
  }
}
