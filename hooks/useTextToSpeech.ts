import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSettings } from '../types';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserSupportsTTS, setBrowserSupportsTTS] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      setBrowserSupportsTTS(true);
      const utterance = new SpeechSynthesisUtterance();
      utteranceRef.current = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error', event);
        setIsSpeaking(false);
      };

      // Load and update available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      loadVoices(); // Initial call

      // Cancel speech if component unmounts while speaking
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      };
    } else {
      setBrowserSupportsTTS(false);
      console.warn('Text-to-Speech API not supported in this browser.');
    }
  }, []);

  const findBestVoice = useCallback((settings: VoiceSettings) => {
    if (!availableVoices.length) return null;

    const { voiceName, lang } = settings;
    let voices = availableVoices;

    // Filter by language if specified
    if (lang) {
      voices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    }

    // Try to find exact voice match if specified
    if (voiceName) {
      const exactMatch = voices.find(v => v.name === voiceName);
      if (exactMatch) return exactMatch;
    }

    // Find best matching voice based on language and gender
    if (voices.length > 0) {
      // Try to find a default voice for the language
      const defaultVoice = voices.find(v => v.default);
      if (defaultVoice) return defaultVoice;

      // Otherwise return the first available voice
      return voices[0];
    }

    return null;
  }, [availableVoices]);

  const speak = useCallback(async (text: string, settings: VoiceSettings = {}) => {
    // 1. Try ElevenLabs if VoiceID is present
    if (settings.voiceId) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error('No ElevenLabs API Key');

        setIsSpeaking(true);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!response.ok) throw new Error('ElevenLabs API error');

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.play();
        return; // Success!
      } catch (error) {
        console.error('AI Voice failed, falling back to browser TTS:', error);
      }
    }

    // 2. Fallback to Browser TTS
    if (!browserSupportsTTS || !utteranceRef.current) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = utteranceRef.current;
    utterance.text = text;

    const voice = findBestVoice(settings);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = settings.lang || 'en-US';
    utterance.rate = settings.rate || 1;
    utterance.pitch = settings.pitch || 1;

    window.speechSynthesis.speak(utterance);
  }, [browserSupportsTTS, findBestVoice]);

  const stopSpeaking = useCallback(() => {
    if (browserSupportsTTS && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [browserSupportsTTS]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    browserSupportsTTS,
    availableVoices
  };
};