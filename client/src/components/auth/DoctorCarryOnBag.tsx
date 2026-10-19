import React from 'react';
import { motion } from 'framer-motion';

interface DoctorCarryOnBagProps {
  isOpen: boolean;
  isOpening: boolean;
  onClickOpen?: () => void;
}

export const DoctorCarryOnBag: React.FC<DoctorCarryOnBagProps> = ({
  isOpen,
  isOpening,
  onClickOpen,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 3D Medical Carry-on Bag / Suitcase */}
      <motion.div
        animate={
          isOpen
            ? { y: 0, scale: 1 }
            : isOpening
            ? { scale: [1, 1.08, 1], y: [-2, -8, 0] }
            : { y: [-3, 3, -3], rotate: [-2, 2, -2] }
        }
        transition={{
          duration: isOpen ? 0.3 : isOpening ? 0.6 : 3,
          repeat: isOpen || isOpening ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        onClick={onClickOpen}
        className="relative cursor-pointer group"
      >
        {/* Glow radiance when opening */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.15 }}
            transition={{ duration: 0.8 }}
            className="absolute -inset-4 bg-gradient-to-t from-blue-600/40 via-cyan-400/30 to-transparent blur-xl rounded-full pointer-events-none"
          />
        )}

        <svg
          viewBox="0 0 240 180"
          className="w-56 h-40 sm:w-64 sm:h-44 drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Rich Leather Bag Gradient */}
            <linearGradient id="bagLeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Bag Lid Gradient */}
            <linearGradient id="lidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Gold Metallic Hardware */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Medical Cross Red Gradient */}
            <linearGradient id="redCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Light beam when opened */}
            <linearGradient id="magicBeam" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Magical Light Beams erupting when bag opens */}
          {isOpen && (
            <motion.g
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.6 }}
              style={{ transformOrigin: '120px 80px' }}
            >
              <polygon points="70,80 120,-40 170,80" fill="url(#magicBeam)" />
              <circle cx="95" cy="40" r="3" fill="#ffffff" opacity="0.9" />
              <circle cx="145" cy="30" r="2.5" fill="#38bdf8" opacity="0.8" />
              <circle cx="120" cy="10" r="4" fill="#67e8f9" opacity="0.9" />
            </motion.g>
          )}

          {/* Carry-on Bag Wheels */}
          <rect x="52" y="160" width="16" height="10" rx="3" fill="#475569" />
          <circle cx="60" cy="168" r="4" fill="#0f172a" />
          <rect x="172" y="160" width="16" height="10" rx="3" fill="#475569" />
          <circle cx="180" cy="168" r="4" fill="#0f172a" />

          {/* Telescopic / Carry Handle */}
          <g>
            <rect x="100" y="10" width="8" height="30" rx="2" fill="#64748b" />
            <rect x="132" y="10" width="8" height="30" rx="2" fill="#64748b" />
            <path
              d="M 96 14 Q 120 4 144 14 L 144 24 Q 120 16 96 24 Z"
              fill="url(#goldGrad)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
          </g>

          {/* Main Carry-On Bag Body */}
          <rect
            x="40"
            y="40"
            width="160"
            height="122"
            rx="20"
            fill="url(#bagLeatherGrad)"
            stroke="#475569"
            strokeWidth="2.5"
          />

          {/* Stitching Lines along borders */}
          <rect
            x="46"
            y="46"
            width="148"
            height="110"
            rx="16"
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.6"
          />

          {/* Reinforcement Corner Guards */}
          <path d="M 40 60 Q 40 40 60 40 L 60 52 Q 52 52 52 60 Z" fill="url(#goldGrad)" />
          <path d="M 200 60 Q 200 40 180 40 L 180 52 Q 188 52 188 60 Z" fill="url(#goldGrad)" />
          <path d="M 40 142 Q 40 162 60 162 L 60 150 Q 52 150 52 142 Z" fill="url(#goldGrad)" />
          <path d="M 200 142 Q 200 162 180 162 L 180 150 Q 188 150 188 142 Z" fill="url(#goldGrad)" />

          {/* Medical Cross Emblem Plate */}
          <circle cx="120" cy="100" r="22" fill="#0f172a" stroke="url(#goldGrad)" strokeWidth="2.5" />
          <g transform="translate(120, 100)">
            <rect x="-4" y="-12" width="8" height="24" rx="2" fill="url(#redCrossGrad)" />
            <rect x="-12" y="-4" width="24" height="8" rx="2" fill="url(#redCrossGrad)" />
          </g>

          {/* Luggage Tag ("Hospital Staff / Dr.") */}
          <motion.g
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '170px 48px' }}
          >
            <line x1="168" y1="45" x2="176" y2="60" stroke="#fde047" strokeWidth="2" />
            <rect x="166" y="58" width="20" height="28" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="170" y="64" width="12" height="3" rx="1" fill="#0284c7" />
            <rect x="170" y="70" width="12" height="2" rx="0.5" fill="#94a3b8" />
            <rect x="170" y="74" width="8" height="2" rx="0.5" fill="#94a3b8" />
          </motion.g>

          {/* Bag Hinged Lid (Opens in 3D when isOpen is true) */}
          <motion.g
            initial={false}
            animate={
              isOpen
                ? { rotateX: -110, y: -20, opacity: 0.85 }
                : isOpening
                ? { rotateX: -45, y: -8 }
                : { rotateX: 0, y: 0 }
            }
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformOrigin: '120px 40px' }}
          >
            <rect
              x="42"
              y="38"
              width="156"
              height="38"
              rx="12"
              fill="url(#lidGrad)"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Dual Gold Clasps */}
            <rect x="76" y="58" width="14" height="16" rx="3" fill="url(#goldGrad)" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="83" cy="66" r="2" fill="#0f172a" />
            <rect x="150" y="58" width="14" height="16" rx="3" fill="url(#goldGrad)" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="157" cy="66" r="2" fill="#0f172a" />
          </motion.g>
        </svg>

        {/* Hover / Click Prompt on Closed Bag */}
        {!isOpen && (
          <div className="text-center mt-1">
            <span className="text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-800/80 group-hover:bg-sky-900 transition shadow-sm">
              Dr. MediPaws Medical Bag
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DoctorCarryOnBag;

