'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, Delete, Eye, EyeOff } from 'lucide-react';
import { getSetting, setSetting } from '@/lib/db';

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [phase, setPhase] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const existingPin = await getSetting('pin_lock');
      if (!existingPin) {
        setIsSetup(true);
      }
      setLoading(false);
    })();
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      setTimeout(() => verifyPin(newPin), 200);
    }
  }, [pin]);

  const verifyPin = async (enteredPin: string) => {
    if (isSetup) {
      if (phase === 'enter') {
        setConfirmPin(enteredPin);
        setPhase('confirm');
        setPin('');
        return;
      }
      // Confirm phase
      if (enteredPin === confirmPin) {
        await setSetting('pin_lock', enteredPin);
        onUnlock();
      } else {
        setError('PINs don\'t match. Try again.');
        triggerShake();
        setPhase('enter');
        setPin('');
        setConfirmPin('');
      }
    } else {
      const storedPin = await getSetting('pin_lock');
      if (enteredPin === storedPin) {
        onUnlock();
      } else {
        setError('Wrong PIN');
        triggerShake();
        setPin('');
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // Try biometric
  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) return;
    try {
      // Web Authentication API for biometric
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) {
        // Simple biometric check using credential API
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname,
            allowCredentials: [],
          },
        } as CredentialRequestOptions).catch(() => null);
        if (credential) {
          onUnlock();
        }
      }
    } catch {
      // Biometric not available
    }
  };

  if (loading) return null;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Lock icon */}
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--pink-100), var(--lavender-100))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Lock size={28} style={{ color: 'var(--pink-400)' }} />
      </motion.div>

      {/* Title */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--neutral-700)',
        marginBottom: 8,
        fontFamily: "'Outfit', sans-serif",
      }}>
        {isSetup
          ? phase === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'
          : 'Enter Your PIN'}
      </h2>
      <p style={{
        fontSize: 13,
        color: 'var(--neutral-400)',
        marginBottom: 32,
        textAlign: 'center',
      }}>
        {isSetup
          ? 'Protect your private thoughts'
          : 'Your garden is waiting inside'}
      </p>

      {/* PIN dots */}
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        style={{ display: 'flex', gap: 16, marginBottom: 12 }}
      >
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            animate={{
              scale: pin.length > i ? 1.2 : 1,
              background: pin.length > i
                ? 'linear-gradient(135deg, #F4A0B5, #C4B5E0)'
                : 'var(--neutral-200)',
            }}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 12, color: 'var(--pink-500)', marginBottom: 16, height: 18 }}
        >
          {error}
        </motion.p>
      )}
      {!error && <div style={{ height: 30 }} />}

      {/* Numpad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 70px)',
        gap: 12,
        marginBottom: 24,
      }}>
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === 'del') {
            return (
              <motion.button
                key="del"
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                style={{
                  width: 70,
                  height: 56,
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--neutral-500)',
                }}
              >
                <Delete size={22} />
              </motion.button>
            );
          }
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDigit(d)}
              style={{
                width: 70,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--neutral-200)',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--neutral-700)',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {d}
            </motion.button>
          );
        })}
      </div>

      {/* Biometric button */}
      {!isSetup && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBiometric}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'none',
            border: '1px solid var(--neutral-200)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--neutral-500)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <Fingerprint size={18} />
          Use biometric
        </motion.button>
      )}
    </motion.div>
  );
}
