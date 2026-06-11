import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';

// Feed dimensions: width={192} height={148}

const CHAR_POOL = '0123456789ABCDEFabcdef.:/%[]{}!@#><=+-_~`|\\▓▒░█▄▀■□●○◆→←↑↓⚡';

class MatrixColumn {
  x: number;
  headY: number;
  speed: number;
  fadeLen: number;
  chars: string[];
  attackMode: boolean = false;

  constructor(x: number) {
    this.x = x;
    this.headY = Math.random() * -180;
    this.speed = 1.0 + Math.random() * 2.5;
    this.fadeLen = 6 + Math.floor(Math.random() * 10);
    this.chars = Array.from({ length: this.fadeLen + 2 }, () =>
      CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)]
    );
  }

  draw(ctx: CanvasRenderingContext2D, canvasH: number) {
    this.headY += this.speed;
    if (this.headY > canvasH + this.fadeLen * 11) {
      this.headY = -this.fadeLen * 11;
      this.speed = 1.0 + Math.random() * 2.5;
    }

    for (let i = 0; i < this.fadeLen; i++) {
      const cy = this.headY - i * 11;
      if (cy < -11 || cy > canvasH) continue;

      // Slowly mutate characters over time
      if (Math.random() < 0.05) {
        this.chars[i] = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
      }

      const alpha = Math.pow(Math.max(0, 1 - i / this.fadeLen), 1.5);
      const isHead = i === 0;

      if (isHead) {
        ctx.fillStyle = `rgba(215, 255, 220, ${alpha})`;
        ctx.shadowColor = '#00ff44';
        ctx.shadowBlur = 6;
      } else if (this.attackMode) {
        ctx.fillStyle = `rgba(255, 45, 45, ${alpha * 0.95})`;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = `rgba(0, ${Math.round(175 + 80 * alpha)}, 60, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx!.fillText(this.chars[i] || '0', this.x + 0.5, cy);
    }
    ctx.shadowBlur = 0;

    // Random system network coordinate intercept rows inside cyber cascade
    if (Math.random() < 0.0018) {
      ctx.fillStyle = 'rgba(255, 179, 0, 0.15)';
      ctx.fillRect(0, this.headY - 5, ctx.canvas.width, 11);
      ctx.fillStyle = '#ffb300';
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx!.fillText(
        `CAP_TRPT:${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
        2,
        this.headY + 3
      );
    }
  }
}

export default function CyberFeed() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const colsRef = useRef<MatrixColumn[]>([]);

  const [firewallLevel, setFirewallLevel] = useState(2);
  const [hackActive, setHackActive] = useState(false);
  const [underAttack, setUnderAttack] = useState(false);

  useEffect(() => {
    // Generate static firewall attacks alert if global threat or tension triggers
    const timer = setInterval(() => {
      setUnderAttack(Math.random() < 0.15);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const COLS = 15;
    const colW = W / COLS;

    colsRef.current = Array.from({ length: COLS }, (_, i) => new MatrixColumn(i * colW));

    let tick = 0;

    function frameLoop() {
      tick++;

      // Pixel decay matrix persistence (authentic glowing phosphor effect)
      const imageData = ctx!.getImageData(0, 0, W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.86;      // R decayed
        data[i + 1] = data[i + 1] * 0.90;  // Green (phosphor) decays slowest
        data[i + 2] = data[i + 2] * 0.84;  // B decayed
      }
      ctx!.putImageData(imageData, 0, 0);

      // Draw active columns
      colsRef.current.forEach((col) => {
        col.attackMode = underAttack;
        col.draw(ctx!, H);
      });

      // Intrusion Warning Overlay
      if (underAttack && tick % 24 < 12) {
        ctx!.fillStyle = 'rgba(255, 34, 68, 0.08)';
        ctx!.fillRect(0, 0, W, H);
        ctx!.fillStyle = '#ff2244';
        ctx!.font = 'bold 8px "JetBrains Mono", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillText('⚠️ INTRUSION BREACH', W / 2, H / 2 - 5);
        ctx!.fillText('CALIBRATE CONTROLS', W / 2, H / 2 + 5);
        ctx!.textAlign = 'left';
      }

      // Hack Active state
      if (hackActive && !underAttack) {
        ctx!.fillStyle = 'rgba(0, 229, 255, 0.05)';
        ctx!.fillRect(0, 0, W, H);
        if (tick % 30 < 15) {
          ctx!.fillStyle = '#00e5ff';
          ctx!.font = '6.5px "JetBrains Mono", monospace';
          ctx!.fillText('⚡ OP EXECUTING...', 4, 15);
        }
      }

      // Live firewall parameters footer
      ctx!.fillStyle = 'rgba(2, 5, 2, 0.85)';
      ctx!.fillRect(0, H - 13, W, 13);
      ctx!.fillStyle = underAttack ? '#ff2244' : hackActive ? '#00e5ff' : '#00ff44';
      ctx!.font = '6px "JetBrains Mono", monospace';
      ctx!.fillText(
        `FW_SEC:${firewallLevel}/5  ${underAttack ? 'PORT_BREACHED' : hackActive ? 'COVERT_NET_LIVE' : 'NET_SHIELD_OK'}`,
        4,
        H - 4
      );

      rafRef.current = requestAnimationFrame(frameLoop);
    }

    rafRef.current = requestAnimationFrame(frameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [underAttack, hackActive, firewallLevel]);

  const handleDeployHack = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('Cyber op fail: Select a target territory to infect inside tactical map.', 'WARNING');
      return;
    }
    setHackActive(true);
    pushTerminalLine(`Infecting ${targetCountryId} communications systems. Trojan vectors deployed.`, 'WARNING');
    audio.sfxKlaxon();

    setTimeout(() => {
      setHackActive(false);
      pushTerminalLine(`Cyber penetration of ${targetCountryId} grid completed. System defense degraded.`, 'SYSTEM');
    }, 4500);
  };

  const handleBoostFirewall = () => {
    audio.sfxKeyClick();
    if (firewallLevel >= 5) {
      pushTerminalLine('Cyber security: Firewall matrices at peak security calibration.', 'INFO');
      return;
    }
    setFirewallLevel((prev) => prev + 1);
    pushTerminalLine(`Calibrated firewall security parameters. Current shield multiplier: v${firewallLevel + 1}.0`, 'SYSTEM');
  };

  const handleTraceAttack = () => {
    audio.sfxKeyClick();
    pushTerminalLine('Executing network trace query...', 'INFO');
    audio.sfxRadarPing();
    setTimeout(() => {
      setUnderAttack(false);
      pushTerminalLine('Trace routine complete: Threat neutralized. Backdoor loops resolved.', 'SYSTEM');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5">
        <span>COVERT CYBER GRID DIAGRAM</span>
        <span style={{ color: underAttack ? '#ff2244' : hackActive ? '#00e5ff' : '#00cc33' }}>
          ◆ {underAttack ? 'PORT ALERT' : hackActive ? 'DEPLOYS' : 'ACTIVE'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={192}
        height={148}
        className="w-full h-auto block select-none border border-[#0d2e0d]"
        style={{ background: '#020302' }}
      />

      <div className="flex gap-1 mt-1">
        <button
          onClick={handleDeployHack}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center"
        >
          HACK GRID
        </button>
        <button
          onClick={handleBoostFirewall}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center"
        >
          FW BOOST
        </button>
        <button
          onClick={handleTraceAttack}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center"
        >
          TRACE
        </button>
      </div>
    </div>
  );
}
