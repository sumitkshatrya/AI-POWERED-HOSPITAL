import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, ShieldCheck, Heart } from 'lucide-react';
import { DoctorCarryOnBag } from './DoctorCarryOnBag';
import { brandConfig } from '../../config/brand';

interface DoctorArrivalSceneProps {
  onComplete: () => void;
}

export const DoctorArrivalScene: React.FC<DoctorArrivalSceneProps> = ({ onComplete }) => {
  const [countdown, setCountdown] = useState(5);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // 5-second countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerBagOpening();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerBagOpening = () => {
    setIsOpening(true);
    // After opening beam animation (800ms), transition to the revealed form
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleSkip = () => {
    triggerBagOpening();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-950/60 text-center flex flex-col items-center relative overflow-hidden"
    >
      {/* Glow Radiance */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hospital Entrance Header */}
      <div className="mb-4 space-y-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Doctor Arriving on Shift</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome to {brandConfig.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
          Dr. MediPaws is carrying the hospital medical kit. Opening portal in{' '}
          <strong className="text-sky-400 font-mono text-base">{countdown}s</strong>...
        </p>
      </div>

      {/* Walking Character Carrying Bag */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Walking Doctor Cartoon Sprite */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Animated 3D Carry-on Bag */}
          <DoctorCarryOnBag
            isOpen={false}
            isOpening={isOpening}
            onClickOpen={handleSkip}
          />
        </motion.div>

        {/* Dynamic Footstep Dust & Shadow */}
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-2 w-44 h-4 bg-slate-950/80 rounded-full blur-xs pointer-events-none"
        />
      </div>

      {/* 5-Second Animated Progress Bar */}
      <div className="w-full max-w-xs space-y-2 mt-4 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Unpacking Medical Kit</span>
          </span>
          <span className="font-mono font-bold text-sky-400">{countdown}s</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
            transition={{ ease: 'linear', duration: 1 }}
            className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 rounded-full shadow-sm"
          />
        </div>
      </div>

      {/* Immediate Skip / Open Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 relative z-10">
        <button
          onClick={handleSkip}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
        >
          <span>Open Bag & Sign In Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Compliance Badge */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>HIPAA Verified Medical Access Node</span>
      </div>
    </motion.div>
  );
};

export default DoctorArrivalScene;

