'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onTranscript?: (text: string) => void;
}

export default function VoiceRecorder({ onRecordingComplete, onTranscript }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Audio visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAmplitude = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animFrameRef.current);
        audioCtx.close();
        setAmplitude(0);

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onRecordingComplete(blob, duration);

        // Try browser-native speech recognition for transcript
        if (onTranscript && 'webkitSpeechRecognition' in window) {
          transcribeWithWebSpeech(blob);
        }
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [duration, onRecordingComplete, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [recording]);

  const transcribeWithWebSpeech = (blob: Blob) => {
    setProcessing(true);
    // Use Web Speech API as fallback for transcription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setProcessing(false);
      return;
    }

    // For Web Speech API, we need to replay the audio
    const audio = new Audio(URL.createObjectURL(blob));
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;

    let transcript = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
    };
    recognition.onend = () => {
      setProcessing(false);
      if (transcript.trim() && onTranscript) {
        onTranscript(transcript.trim());
      }
    };
    recognition.onerror = () => {
      setProcessing(false);
    };

    recognition.start();
    audio.play();
    audio.onended = () => {
      setTimeout(() => recognition.stop(), 1000);
    };
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Waveform visualization */}
      <div style={{
        position: 'relative',
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Ripple rings */}
        {recording && (
          <>
            <motion.div
              animate={{ scale: [1, 1.5 + amplitude], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px solid var(--pink-300)',
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.3 + amplitude * 0.5], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px solid var(--lavender-300)',
              }}
            />
          </>
        )}

        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={recording ? stopRecording : startRecording}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: 'none',
            background: recording
              ? 'linear-gradient(135deg, #E55050, #D43030)'
              : 'linear-gradient(135deg, var(--pink-300), var(--lavender-400))',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: recording
              ? '0 0 30px rgba(229, 80, 80, 0.4)'
              : '0 4px 20px rgba(244, 160, 181, 0.4)',
            transition: 'all 0.3s',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {processing ? (
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          ) : recording ? (
            <Square size={24} fill="white" />
          ) : (
            <Mic size={28} />
          )}
        </motion.button>
      </div>

      {/* Duration / Status */}
      <div style={{ textAlign: 'center' }}>
        {recording ? (
          <div>
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 24, fontWeight: 600, color: '#E55050', fontFamily: "'Outfit', sans-serif" }}
            >
              {formatTime(duration)}
            </motion.p>
            <p style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>
              Recording... tap to stop
            </p>
          </div>
        ) : processing ? (
          <p style={{ fontSize: 13, color: 'var(--lavender-400)' }}>Transcribing...</p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--neutral-400)' }}>
            Tap to start voice note
          </p>
        )}
      </div>

    </div>
  );
}
