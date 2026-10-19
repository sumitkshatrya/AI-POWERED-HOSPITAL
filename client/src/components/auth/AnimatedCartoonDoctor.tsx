import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CartoonDoctorProps {
  isPasswordFocused: boolean;
  showPassword: boolean;
  cursorPosition: number; // 0 to 100 based on input text length
  status: 'idle' | 'typing' | 'covering_eyes' | 'peeking' | 'success' | 'error';
  mode: 'login' | 'signup';
}

export const AnimatedCartoonDoctor: React.FC<CartoonDoctorProps> = ({
  isPasswordFocused,
  showPassword,
  cursorPosition,
  status,
  mode,
}) => {
  const [blink, setBlink] = useState(false);

  // Periodic blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Compute pupil position based on typing progression
  // Normal range: center is 0, moving -10 to +10 horizontally, +6 down towards input
  const pupilX = isPasswordFocused ? 0 : Math.min(Math.max((cursorPosition - 50) / 4, -12), 12);
  const pupilY = isPasswordFocused ? 0 : 5;

  const isCoveringEyes = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  // Speech bubble dynamic messages
  const getSpeechMessage = () => {
    if (status === 'success') return 'Access Granted! Welcome back!';
    if (status === 'error') return 'Oops! Check your credentials.';
    if (isPeeking) return 'Pst... peeking at your password! 👀';
    if (isCoveringEyes) return "Don't worry, I won't peek! 🙈";
    if (status === 'typing') {
      return mode === 'login' ? 'Verifying clinical credentials...' : 'Setting up your medical profile!';
    }
    return mode === 'login' ? 'Ready for clinical shift!' : 'Join the MediCore network!';
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Dynamic 3D Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={getSpeechMessage()}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="mb-3 px-4 py-1.5 rounded-full bg-slate-900/90 text-slate-200 border border-blue-500/30 text-xs font-semibold shadow-lg shadow-blue-500/10 flex items-center gap-1.5 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{getSpeechMessage()}</span>
        </motion.div>
      </AnimatePresence>

      {/* Main 3D Cartoon Character Stage */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
        {/* Glow backdrop aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/20 via-sky-400/20 to-indigo-600/20 blur-2xl animate-pulse" />

        {/* Floating 3D Props: Levitation heart & pill */}
        <motion.div
          animate={{ y: [-4, 4, -4], rotate: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -left-4 w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 text-sm font-bold border border-white/20"
        >
          ❤️
        </motion.div>

        <motion.div
          animate={{ y: [4, -4, 4], rotate: [8, -8, 8] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-1 -right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 text-xs border border-white/20 font-bold"
        >
          💊
        </motion.div>

        {/* Cartoon Doctor SVG Character */}
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            {/* 3D Skin Gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdfc9" />
              <stop offset="100%" stopColor="#f3b89b" />
            </linearGradient>

            {/* 3D Coat Gradient */}
            <linearGradient id="coatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Doctor Scrub/Inner Gradient */}
            <linearGradient id="scrubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Doctor Gloves Gradient */}
            <linearGradient id="gloveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Mirror / Reflector Shimmer */}
            <linearGradient id="mirrorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Torso & Doctor Coat */}
          <motion.g
            animate={{ y: status === 'typing' ? [0, -1.5, 0] : [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Shoulders */}
            <path
              d="M 45 155 Q 100 135 155 155 L 165 200 L 35 200 Z"
              fill="url(#coatGrad)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {/* Inner Scrub V-Neck */}
            <path d="M 80 148 L 100 180 L 120 148 Z" fill="url(#scrubGrad)" />
            {/* Stethoscope Tubing around neck */}
            <path
              d="M 68 150 Q 100 195 132 150"
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Stethoscope Chest Piece */}
            <circle cx="100" cy="188" r="8" fill="#94a3b8" stroke="#334155" strokeWidth="2.5" />
            <circle cx="100" cy="188" r="4" fill="#38bdf8" />
          </motion.g>

          {/* Head Group (tilts slightly based on typing cursor) */}
          <motion.g
            animate={{
              rotate: pupilX * 0.4,
              y: isPasswordFocused ? 4 : 0,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformOrigin: '100px 105px' }}
          >
            {/* Ears */}
            <ellipse cx="44" cy="105" rx="8" ry="11" fill="url(#skinGrad)" />
            <ellipse cx="156" cy="105" rx="8" ry="11" fill="url(#skinGrad)" />

            {/* Face / Head Base */}
            <rect
              x="50"
              y="55"
              width="100"
              height="95"
              rx="46"
              fill="url(#skinGrad)"
              stroke="#e2a88c"
              strokeWidth="1.5"
            />

            {/* Hair / Doctor Cap */}
            <path
              d="M 48 85 Q 100 40 152 85 Q 155 50 130 42 Q 100 36 70 42 Q 45 50 48 85 Z"
              fill="#1e293b"
            />

            {/* Doctor Headband & Circular Reflector Mirror */}
            <path
              d="M 52 70 Q 100 62 148 70"
              fill="none"
              stroke="#0284c7"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="62"
              r="12"
              fill="url(#mirrorGrad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="100" cy="62" r="4" fill="#ffffff" opacity="0.8" />

            {/* Eyebrows */}
            <motion.path
              d={isPasswordFocused ? 'M 66 84 Q 76 88 86 84' : 'M 66 82 Q 76 77 86 82'}
              fill="none"
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <motion.path
              d={isPasswordFocused ? 'M 114 84 Q 124 88 134 84' : 'M 114 82 Q 124 77 134 82'}
              fill="none"
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Left Eye */}
            <g transform="translate(76, 98)">
              {/* Eye White */}
              <ellipse cx="0" cy="0" rx="14" ry={blink ? '1' : '15'} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              {/* Pupil */}
              {!blink && (
                <motion.g
                  animate={{
                    x: isPeeking ? 4 : pupilX,
                    y: isPeeking ? 3 : pupilY,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <circle cx="0" cy="0" r="7.5" fill="#0f172a" />
                  {/* Iris color ring */}
                  <circle cx="0" cy="0" r="6" fill="#0284c7" opacity="0.6" />
                  {/* Eye sparkle highlights */}
                  <circle cx="-2.5" cy="-2.5" r="2.5" fill="#ffffff" />
                  <circle cx="2.5" cy="2" r="1" fill="#ffffff" />
                </motion.g>
              )}
            </g>

            {/* Right Eye */}
            <g transform="translate(124, 98)">
              {/* Eye White */}
              <ellipse cx="0" cy="0" rx="14" ry={blink ? '1' : '15'} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              {/* Pupil */}
              {!blink && (
                <motion.g
                  animate={{
                    x: isPeeking ? 4 : pupilX,
                    y: isPeeking ? 3 : pupilY,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <circle cx="0" cy="0" r="7.5" fill="#0f172a" />
                  <circle cx="0" cy="0" r="6" fill="#0284c7" opacity="0.6" />
                  <circle cx="-2.5" cy="-2.5" r="2.5" fill="#ffffff" />
                  <circle cx="2.5" cy="2" r="1" fill="#ffffff" />
                </motion.g>
              )}
            </g>

            {/* Cute Cheek Blushes */}
            <circle cx="62" cy="116" r="6" fill="#f43f5e" opacity={status === 'success' ? '0.45' : '0.25'} />
            <circle cx="138" cy="116" r="6" fill="#f43f5e" opacity={status === 'success' ? '0.45' : '0.25'} />

            {/* Cute Button Nose */}
            <ellipse cx="100" cy="112" rx="3.5" ry="2.5" fill="#e2a88c" />

            {/* Mouth */}
            {status === 'error' ? (
              <path d="M 90 134 Q 100 125 110 134" fill="none" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
            ) : status === 'success' ? (
              <path d="M 88 126 Q 100 144 112 126 Z" fill="#e11d48" stroke="#be123c" strokeWidth="1.5" />
            ) : isCoveringEyes ? (
              <path d="M 92 128 Q 100 132 108 128" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M 90 126 Q 100 138 110 126" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            )}
          </motion.g>

          {/* Interactive Animated Cartoon Hands (Cover Eyes Mechanism) */}
          {/* Left Hand */}
          <motion.g
            initial={false}
            animate={
              isCoveringEyes
                ? { x: 74, y: 92, rotate: 18, scale: 1 }
                : isPeeking
                ? { x: 62, y: 115, rotate: 45, scale: 0.95 }
                : { x: 50, y: 175, rotate: -15, scale: 0.9 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            {/* Glove Hand Shape */}
            <ellipse cx="0" cy="0" rx="15" ry="12" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1.5" />
            {/* Glove Thumb */}
            <circle cx="6" cy="-10" r="5" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1" />
            <circle cx="-4" cy="-11" r="4.5" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1" />
          </motion.g>

          {/* Right Hand */}
          <motion.g
            initial={false}
            animate={
              isCoveringEyes
                ? { x: 126, y: 92, rotate: -18, scale: 1 }
                : isPeeking
                ? { x: 138, y: 110, rotate: -40, scale: 0.95 }
                : { x: 150, y: 175, rotate: 15, scale: 0.9 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <ellipse cx="0" cy="0" rx="15" ry="12" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1.5" />
            <circle cx="-6" cy="-10" r="5" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1" />
            <circle cx="4" cy="-11" r="4.5" fill="url(#gloveGrad)" stroke="#0891b2" strokeWidth="1" />
          </motion.g>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedCartoonDoctor;

