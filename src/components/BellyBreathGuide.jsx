import React, { useEffect, useState } from 'react';
import { cpTheme } from '../theme/colors';

const BellyBreathGuide = ({ phase, blowIntensity = 0, isListening = false, customStyle = {}, scale = 1.4, theme = 'auto' }) => {
  const [internalPhase, setInternalPhase] = useState('inhale');

  // If a specific phase is provided by the game, use it.
  // Otherwise, fallback to blowIntensity (if > 10, child is exhaling, else inhaling).
  useEffect(() => {
    if (phase) {
      if (phase === 'exhale') setInternalPhase('exhale');
      else setInternalPhase('inhale'); // 'inhale', 'hold', 'idle' -> inhale (belly expands)
    } else {
      if (blowIntensity > 10) {
        setInternalPhase('exhale');
      } else {
        setInternalPhase('inhale');
      }
    }
  }, [phase, blowIntensity]);

  if (!isListening) return null; // Don't show if game hasn't started

  const isExhaling = internalPhase === 'exhale';

  // SVG Balloon animation values
  const balloonRadius = isExhaling ? 10 : 25; // Exhale -> shrinks, Inhale -> expands
  const balloonColor = isExhaling ? '#FFB74D' : '#FF7043'; // Orange-ish when small, Coral when big

  // Dinamik Renk ve Tema Ayarı
  let isDarkBg = false;
  if (theme === 'darkBg') {
    isDarkBg = true;
  } else if (theme === 'lightBg') {
    isDarkBg = false;
  } else {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    // Sadece arka planı gerçekten çok koyu olan oyunlar için (örn: Gökkuşağı - gece modu vs.)
    const darkBgGames = ['hafta-3-hareket-ettir', 'hafta-8']; 
    isDarkBg = darkBgGames.some(game => pathname.includes(game));
  }

  const textColor = isDarkBg ? '#FFFFFF' : cpTheme.text.dark;
  const textShadow = isDarkBg ? '0px 2px 4px rgba(0,0,0,0.8)' : '0px 1px 2px rgba(255,255,255,0.8)';
  const strokeColor = isDarkBg ? '#FFFFFF' : cpTheme.primary.teal;
  const bodyFill = isDarkBg ? 'rgba(255, 255, 255, 0.2)' : '#E0F7FA';
  const arrowInhale = isDarkBg ? '#38BDF8' : '#0284C7'; // Lighter blue for dark bg
  const arrowExhale = isDarkBg ? '#4ADE80' : '#16A34A'; // Lighter green for dark bg

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      right: '30px',
      transform: 'translateY(-50%)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'all 0.3s ease',
      ...customStyle
    }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'right center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: textColor, 
          textShadow: textShadow,
          fontSize: '15px', 
          fontWeight: '900',
          textAlign: 'center'
        }}>
          {isExhaling ? "Nefes Ver" : "Nefes Al"}
        </h4>

        <div style={{ position: 'relative', width: '100px', height: '110px' }}>
          
          <svg width="100" height="110" viewBox="0 0 100 110" style={{ overflow: 'visible' }}>
            
            {/* INHALE ARROW (Points to face) */}
            <g 
              style={{ 
                transition: 'all 0.5s ease', 
                opacity: isExhaling ? 0 : 1, 
                transform: isExhaling ? 'translateX(-10px)' : 'translateX(0px)'
              }}
            >
              <path d="M 5 35 L 25 35 M 15 25 L 25 35 L 15 45" stroke={arrowInhale} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            {/* EXHALE ARROW (Points away from face) */}
            <g 
              style={{ 
                transition: 'all 0.5s ease', 
                opacity: isExhaling ? 1 : 0, 
                transform: isExhaling ? 'translateX(0px)' : 'translateX(10px)'
              }}
            >
              <path d="M 30 35 L 10 35 M 20 25 L 10 35 L 20 45" stroke={arrowExhale} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            {/* Body/Torso */}
            <path 
              d="M 25 110 C 25 70, 35 60, 50 60 C 65 60, 75 70, 75 110 Z" 
              fill={bodyFill} 
              stroke={strokeColor} 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />
            
            {/* Head */}
            <circle cx="50" cy="35" r="20" fill={bodyFill} stroke={strokeColor} strokeWidth="3" />
            
            {/* Eyes & Smile */}
            <circle cx="43" cy="32" r="2" fill={strokeColor} />
            <circle cx="57" cy="32" r="2" fill={strokeColor} />
            <path d="M 45 42 Q 50 47 55 42" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

            {/* Belly Balloon Metaphor */}
            <circle 
              cx="50" 
              cy="85" 
              r={balloonRadius} 
              fill={balloonColor}
              style={{ 
                transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)', 
                opacity: 0.9 
              }}
            />
            
            {/* Balloon reflection/highlight */}
            <circle 
              cx="46" 
              cy="80" 
              r={balloonRadius * 0.3} 
              fill="#FFF"
              style={{ 
                transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)', 
                opacity: 0.7 
              }}
            />
          </svg>

        </div>
        
        <p style={{ 
          margin: '5px 0 0 0', 
          fontSize: '12px', 
          color: textColor,
          textShadow: textShadow,
          textAlign: 'center',
          fontWeight: '800'
        }}>
          {isExhaling ? "Karnın içeri insin" : "Karnını balon gibi şişir"}
        </p>
      </div>
    </div>
  );
};

export default BellyBreathGuide;
