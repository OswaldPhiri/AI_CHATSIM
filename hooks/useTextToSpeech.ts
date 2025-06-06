import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSettings } from '../types';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserSupportsTTS, setBrowserSupportsTTS] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      try {
        setBrowserSupportsTTS(true);
        setError(null);
        const utterance = new SpeechSynthesisUtterance();
        utteranceRef.current = utterance;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setError(null);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          setError('Speech synthesis failed. Please try again.');
        };

        // Load and update available voices
        const loadVoices = () => {
          try {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            setError(null);
          } catch (err) {
            console.error('Error loading voices:', err);
            setError('Failed to load available voices.');
          }
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
      } catch (err) {
        console.error('Error initializing text-to-speech:', err);
        setBrowserSupportsTTS(false);
        setError('Text-to-speech initialization failed.');
      }
    } else {
      setBrowserSupportsTTS(false);
      setError('Text-to-speech is not supported in this browser.');
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

  const speak = useCallback((text: string, settings: VoiceSettings = {}) => {
    if (!browserSupportsTTS || !utteranceRef.current) {
      setError('Text-to-speech is not available.');
      return;
    }

    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = utteranceRef.current;
      utterance.text = text;
      
      // Apply voice settings
      const voice = findBestVoice(settings);
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = settings.lang || 'en-US';
      utterance.rate = Math.min(Math.max(settings.rate || 1, 0.1), 10); // Clamp between 0.1 and 10
      utterance.pitch = Math.min(Math.max(settings.pitch || 1, 0.5), 2); // Clamp between 0.5 and 2
      
      window.speechSynthesis.speak(utterance);
      setError(null);
    } catch (err) {
      console.error('Error speaking text:', err);
      setError('Failed to speak text. Please try again.');
    }
  }, [browserSupportsTTS, findBestVoice]);

  const stopSpeaking = useCallback(() => {
    if (browserSupportsTTS && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setError(null);
      } catch (err) {
        console.error('Error stopping speech:', err);
        setError('Failed to stop speech.');
      }
    }
  }, [browserSupportsTTS]);

  return { 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    browserSupportsTTS,
    availableVoices,
    error
  };
};