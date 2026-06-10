import React, { useEffect, useRef } from 'react';
import { getLeaderProfile } from '../../data/leaders';

interface LeaderPortraitProps {
  countryId: string;
}

export const LeaderPortrait: React.FC<LeaderPortraitProps> = ({ countryId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset size
    canvas.width = 120;
    canvas.height = 150;

    const leader = getLeaderProfile(countryId);
    const { skinTone, uniformType, hairStyle, facialHair, glassesStyle, backgroundType } = leader.portraitSeed;

    // 1. Draw Background (Section 9.2)
    ctx.fillStyle = '#100000';
    if (backgroundType === 'FLAG') {
      // Draw a subtle flag indicator gradient
      const grad = ctx.createLinearGradient(0, 0, 120, 150);
      if (countryId === 'US') {
        grad.addColorStop(0, '#001144'); grad.addColorStop(0.5, '#440000'); grad.addColorStop(1, '#110000');
      } else if (countryId === 'CN' || countryId === 'RU') {
        grad.addColorStop(0, '#550000'); grad.addColorStop(1, '#100000');
      } else if (countryId === 'IN') {
        grad.addColorStop(0, '#442200'); grad.addColorStop(0.5, '#444444'); grad.addColorStop(1, '#004400');
      } else {
        grad.addColorStop(0, '#003311'); grad.addColorStop(1, '#050a05');
      }
      ctx.fillStyle = grad;
    } else if (backgroundType === 'MAP') {
      ctx.fillStyle = '#0a1a0a';
    } else if (backgroundType === 'CLASSIFIED') {
      ctx.fillStyle = '#1c150c';
    } else {
      ctx.fillStyle = '#080c08'; // DARK
    }
    ctx.fillRect(0, 0, 120, 150);

    // Draw map coordinate background text lines in case of MAP background
    if (backgroundType === 'MAP' || backgroundType === 'CLASSIFIED') {
      ctx.strokeStyle = '#114411';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(60, 75, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '7px sans-serif';
      ctx.fillStyle = '#00a833';
      ctx.fillText(`GEO_RAD_E4`, 8, 15);
      ctx.fillText(`${countryId}_COORDS`, 82, 142);
    }

    // 2. Neck & Shoulders (Section 9.2)
    ctx.fillStyle = '#050c18';
    if (uniformType === 'MILITARY') {
      ctx.fillStyle = '#1c2d15'; // army green / khaki uniform
    } else if (uniformType === 'ROBE') {
      ctx.fillStyle = '#3c2510'; // brown traditional robes
    } else if (uniformType === 'CASUAL') {
      ctx.fillStyle = '#222222'; // modern casual dark tee
    } else {
      ctx.fillStyle = '#050c18'; // elegant suit navy blue
    }

    // Base coat silhouette
    ctx.beginPath();
    ctx.moveTo(15, 150);
    ctx.quadraticCurveTo(30, 110, 60, 110);
    ctx.quadraticCurveTo(90, 110, 105, 150);
    ctx.closePath();
    ctx.fill();

    // Suit lapel or robe collar
    ctx.strokeStyle = '#3a5040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(45, 150);
    ctx.moveTo(60, 110);
    ctx.lineTo(75, 150);
    ctx.stroke();

    // Robe golden stripes / embroidery or military shoulder pads
    if (uniformType === 'ROBE') {
      ctx.strokeStyle = '#ffb300';
      ctx.stroke();
    } else if (uniformType === 'MILITARY') {
      // golden epaulette pads
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(15, 118, 15, 6);
      ctx.fillRect(90, 118, 15, 6);
    }

    // Shirt collar
    ctx.fillStyle = uniformType === 'MILITARY' ? '#2e3e1c' : '#eaeaea';
    ctx.beginPath();
    ctx.moveTo(48, 110);
    ctx.lineTo(60, 122);
    ctx.lineTo(72, 110);
    ctx.closePath();
    ctx.fill();

    // Tie (for suits)
    if (uniformType === 'SUIT') {
      ctx.fillStyle = '#990011';
      ctx.beginPath();
      ctx.moveTo(56, 122);
      ctx.lineTo(64, 122);
      ctx.lineTo(62, 145);
      ctx.lineTo(58, 145);
      ctx.closePath();
      ctx.fill();
    }

    // Neck
    const neckSkin = `hsl(${25 + skinTone * 0.15}, ${40 + skinTone * 0.2}%, ${30 + skinTone * 0.35}%)`;
    ctx.fillStyle = neckSkin;
    ctx.fillRect(48, 90, 24, 25);

    // 3. Head (Oval) (Section 9.2)
    ctx.fillStyle = neckSkin;
    ctx.beginPath();
    ctx.ellipse(60, 62, 26, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Ears
    ctx.beginPath();
    ctx.ellipse(32, 62, 5, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(88, 62, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hair (Section 9.2)
    ctx.fillStyle = hairStyle === 0 ? '#111111' : hairStyle === 1 ? '#444444' : hairStyle === 2 ? '#cccccc' : hairStyle === 3 ? '#999999' : '#030303';
    ctx.beginPath();
    if (hairStyle === 1) {
      // standard short crop
      ctx.ellipse(60, 36, 26, 10, 0, 0, Math.PI * 2);
    } else if (hairStyle === 2) {
      // swept side hair
      ctx.ellipse(56, 36, 28, 12, 0.1, 0, Math.PI * 2);
    } else if (hairStyle === 3) {
      // bald white side patches / older look
      ctx.ellipse(38, 48, 6, 15, -0.2, 0, Math.PI * 2);
      ctx.ellipse(82, 48, 6, 15, 0.2, 0, Math.PI * 2);
    } else if (hairStyle === 4) {
      // wavy fuller hair
      ctx.ellipse(60, 34, 28, 16, 0, 0, Math.PI * 2);
    } else if (hairStyle === 5) {
      // nearly bald top
      ctx.ellipse(60, 32, 22, 4, 0, 0, Math.PI * 2);
    } else {
      // traditional cowl / turban turban wrapping if robe profile
      if (uniformType === 'ROBE') {
        ctx.fillStyle = '#eaeaea';
        ctx.ellipse(60, 32, 28, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffb300';
        ctx.fillRect(52, 22, 16, 8);
      } else {
        ctx.ellipse(60, 36, 24, 8, 0, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // 6. Facial Hair (Section 9.2)
    if (facialHair) {
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      // mustache & chin beard
      ctx.ellipse(60, 84, 15, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(60, 74, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Eyes (Section 9.2)
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(48, 58, 2, 0, Math.PI * 2);
    ctx.arc(72, 58, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye brows
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(42, 54); ctx.lineTo(54, 54);
    ctx.moveTo(66, 54); ctx.lineTo(78, 54);
    ctx.stroke();

    // Nose
    ctx.strokeStyle = '#443322';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 58);
    ctx.lineTo(60, 72);
    ctx.lineTo(63, 72);
    ctx.stroke();

    // Mouth
    ctx.strokeStyle = '#603333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(52, 80);
    ctx.lineTo(68, 80);
    ctx.stroke();

    // 8. Glasses overlay
    if (glassesStyle === 1) {
      // thin wire rims
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(48, 58, 8, 0, Math.PI * 2);
      ctx.arc(72, 58, 8, 0, Math.PI * 2);
      ctx.moveTo(56, 58); ctx.lineTo(64, 58);
      ctx.stroke();
    } else if (glassesStyle === 2) {
      // thick black rims
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(39, 50, 16, 14);
      ctx.rect(65, 50, 16, 14);
      ctx.moveTo(55, 57); ctx.lineTo(65, 57);
      ctx.stroke();
    }

    // Military Visor cap
    if (uniformType === 'MILITARY' && hairStyle !== 5) {
      ctx.fillStyle = '#1c2d15';
      ctx.beginPath();
      ctx.ellipse(60, 32, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // black visor
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(60, 35, 26, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // golden badge
      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.arc(60, 28, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. CRT Phosphor scan line scan overlays (military terminal filter)
    ctx.fillStyle = 'rgba(0, 255, 68, 0.05)';
    for (let y = 0; y < 150; y += 3) {
      ctx.fillRect(0, y, 120, 1);
    }

  }, [countryId]);

  return (
    <div className="w-[124px] h-[154px] border border-[#1a3a1a] bg-black p-0.5 rounded shadow-lg overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} width={120} height={150} className="w-full h-full block bg-black" />
    </div>
  );
};

export default LeaderPortrait;
