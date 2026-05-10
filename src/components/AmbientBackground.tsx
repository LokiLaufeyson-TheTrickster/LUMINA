'use client';

import { useEffect, useRef } from 'react';

export default function AmbientBackground({ dreamMode = false }: { dreamMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];
    const stars: Star[] = [];

    interface Particle {
      x: number; y: number; size: number; speedY: number; speedX: number;
      opacity: number; color: string; life: number; maxLife: number;
    }

    interface Star {
      x: number; y: number; size: number; twinkleSpeed: number; phase: number;
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = dreamMode
      ? ['rgba(196,181,224,', 'rgba(168,146,208,', 'rgba(139,111,192,']
      : ['rgba(244,160,181,', 'rgba(196,181,224,', 'rgba(255,213,128,'];

    // Initialize stars for dream mode
    if (dreamMode) {
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnParticle() {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        size: Math.random() * 4 + 2,
        speedY: -(Math.random() * 0.5 + 0.2),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: 0,
        color,
        life: 0,
        maxLife: Math.random() * 400 + 300,
      });
    }

    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      frame++;

      // Spawn particles
      if (frame % (dreamMode ? 8 : 15) === 0 && particles.length < (dreamMode ? 40 : 25)) {
        spawnParticle();
      }

      // Draw stars in dream mode
      if (dreamMode) {
        stars.forEach(star => {
          const twinkle = Math.sin(frame * star.twinkleSpeed + star.phase);
          const opacity = 0.3 + twinkle * 0.4;
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255, 255, 255, ${Math.max(0, opacity)})`;
          ctx!.fill();
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;

        // Fade in/out
        if (p.life < 60) {
          p.opacity = p.life / 60;
        } else if (p.life > p.maxLife - 60) {
          p.opacity = (p.maxLife - p.life) / 60;
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `${p.color}${p.opacity * 0.6})`;
        ctx!.fill();

        // Glow effect
        if (!dreamMode) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = `${p.color}${p.opacity * 0.1})`;
          ctx!.fill();
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [dreamMode]);

  return (
    <div className="ambient-bg">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  );
}
