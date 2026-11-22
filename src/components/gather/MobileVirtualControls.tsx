import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EventBus } from '../../game/EventBus';
import { Armchair, Hand, Footprints } from 'lucide-react';

interface MobileVirtualControlsProps {
  isSitting?: boolean;
}

export const MobileVirtualControls: React.FC<MobileVirtualControlsProps> = ({ isSitting: initialSitting = false }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSitting, setIsSitting] = useState<boolean>(initialSitting);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isActionActive, setIsActionActive] = useState<boolean>(false);

  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // Sync external sitting prop & internal EventBus listener
  useEffect(() => {
    setIsSitting(initialSitting);
  }, [initialSitting]);

  useEffect(() => {
    const handleSittingChanged = (sitting: boolean) => {
      setIsSitting(sitting);
    };

    EventBus.on('LOCAL_PLAYER_SITTING_CHANGED', handleSittingChanged);
    return () => {
      EventBus.off('LOCAL_PLAYER_SITTING_CHANGED', handleSittingChanged);
    };
  }, []);

  // Detect mobile & touch devices (including DevTools emulation)
  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === 'undefined') return;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth < 1024;
      // Active if either touch capability exists OR screen viewport is mobile/tablet
      setIsMobile(hasTouch || isNarrow);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Max joystick knob travel distance (pixels from center)
  const MAX_RADIUS = 42;
  const DEADZONE = 0.12;

  // Joystick Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback if pointer capture isn't supported
    }

    updateJoystickPosition(e.clientX, e.clientY);
  };

  // Joystick Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    updateJoystickPosition(e.clientX, e.clientY);
  };

  // Reset Joystick
  const resetJoystick = useCallback(() => {
    activePointerIdRef.current = null;
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    EventBus.emit('ANALOG_JOYSTICK_MOVE', { x: 0, y: 0 });
  }, []);

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      resetJoystick();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      resetJoystick();
    }
  };

  // Compute delta and emit normalized analog vector (-1.0 to 1.0)
  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      EventBus.emit('ANALOG_JOYSTICK_MOVE', { x: 0, y: 0 });
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(distance, MAX_RADIUS);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobPos({ x: kx, y: ky });

    // Normalized magnitude
    const magnitude = clampedDist / MAX_RADIUS;
    if (magnitude < DEADZONE) {
      EventBus.emit('ANALOG_JOYSTICK_MOVE', { x: 0, y: 0 });
      return;
    }

    // Rate-limit emit to ~60fps (16ms) to prevent event flooding
    const now = performance.now();
    if (now - lastEmitTimeRef.current >= 14) {
      lastEmitTimeRef.current = now;
      const nx = Math.cos(angle) * magnitude;
      const ny = Math.sin(angle) * magnitude;
      EventBus.emit('ANALOG_JOYSTICK_MOVE', { x: nx, y: ny });
    }
  };

  // Mobile Action Button Handler (Sit, Stand, Interact)
  const handleActionClick = () => {
    // Subtle tactile haptic pulse on mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Safe ignore
      }
    }

    setIsActionActive(true);
    setTimeout(() => setIsActionActive(false), 160);

    // Emit interaction event for OfficeScene
    EventBus.emit('MOBILE_INTERACT');
  };

  // Desktop guard: return null if on desktop view without touch
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none touch-none lg:hidden">
      {/* ==================================================================== */}
      {/* BOTTOM-LEFT: VIRTUAL ANALOG JOYSTICK                                  */}
      {/* Elevated above dock (bottom-20) for optimal thumb reach & zero overlap*/}
      {/* ==================================================================== */}
      <div className="absolute bottom-20 left-4 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors duration-150 flex items-center justify-center ${
            isDragging
              ? 'bg-slate-900/80 border-teal-400 shadow-[0_0_24px_rgba(45,212,191,0.35)]'
              : 'bg-slate-950/65 border-teal-500/35 backdrop-blur-md shadow-xl'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Cardinal Direction Accent Dots */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400/50" />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400/50" />
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400/50" />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400/50" />

          {/* Inner Deadzone Target Circle */}
          <div className="w-10 h-10 rounded-full border border-teal-500/20 bg-teal-950/20 pointer-events-none flex items-center justify-center">
            <Footprints className="w-4 h-4 text-teal-500/30" />
          </div>

          {/* Movable Joystick Knob */}
          <div
            className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center transition-transform pointer-events-none ${
              isDragging
                ? 'bg-gradient-to-br from-teal-400 to-teal-600 border-white shadow-[0_0_16px_rgba(45,212,191,0.8)] scale-105'
                : 'bg-gradient-to-br from-teal-500/90 to-teal-800/90 border-teal-300/70 shadow-md'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Center Thumb Grip Dot */}
            <div className="w-3 h-3 rounded-full bg-white/70 shadow-inner" />
          </div>
        </div>

        {/* Joystick Label Badge */}
        <div className="mt-1.5 text-center">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider bg-slate-900/80 text-teal-300/80 border border-teal-500/30">
            GERAK
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM-RIGHT: INTERACTIVE ACTION BUTTON (SIT / STAND / INTERACT)    */}
      {/* Elevated above dock (bottom-20) for optimal thumb reach & zero overlap*/}
      {/* ==================================================================== */}
      <div className="absolute bottom-20 right-4 pointer-events-auto flex flex-col items-center">
        <button
          type="button"
          onPointerDown={handleActionClick}
          aria-label={isSitting ? 'Berdiri dari Kursi' : 'Aksi / Duduk / Interaksi'}
          className={`relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-100 shadow-xl backdrop-blur-md active:scale-90 ${
            isSitting
              ? isActionActive
                ? 'bg-amber-500 border-amber-200 scale-95 shadow-[0_0_24px_rgba(245,158,11,0.7)]'
                : 'bg-gradient-to-br from-amber-600/90 to-rose-700/90 border-amber-400 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.4)]'
              : isActionActive
              ? 'bg-teal-400 border-white scale-95 shadow-[0_0_24px_rgba(45,212,191,0.7)]'
              : 'bg-gradient-to-br from-teal-600/90 to-cyan-800/90 border-teal-300 text-teal-100 shadow-[0_0_18px_rgba(20,184,166,0.4)]'
          }`}
          style={{ touchAction: 'none' }}
        >
          {isSitting ? (
            <>
              <Armchair className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-tighter uppercase leading-none">
                BERDIRI
              </span>
            </>
          ) : (
            <>
              <Hand className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />
              <span className="text-[9px] font-mono font-bold tracking-tighter uppercase leading-none">
                AKSI [E]
              </span>
            </>
          )}

          {/* Glowing pulse ring while sitting */}
          {isSitting && (
            <span className="absolute -inset-1 rounded-full border border-amber-400/40 animate-ping pointer-events-none" />
          )}
        </button>

        {/* Action Button Label Badge */}
        <div className="mt-1.5 text-center">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider border ${
              isSitting
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/80 text-teal-300/80 border-teal-500/30'
            }`}
          >
            {isSitting ? '[SPASI]' : 'INTERAKSI'}
          </span>
        </div>
      </div>
    </div>
  );
};
