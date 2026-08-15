import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, LocateFixed, RotateCcw, Shield, Target, Timer, Users, Zap } from "lucide-react";
import GameCanvas from "@/components/GameCanvas";
import type { GameHandle, GameSnapshot } from "@/game/types";
import "./skyfront.css";

const REFERENCE_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032246958/DUhhausTWsjzyver.png";

const initialSnapshot: GameSnapshot = {
  status: "lobby",
  health: 100,
  armor: 60,
  ammo: 30,
  reserveAmmo: 180,
  eliminations: 0,
  enemiesRemaining: 2,
  zoneSeconds: 112,
  zoneRadius: 32,
  message: "READY FOR INSERTION",
  crateCollected: false,
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function Skyfront() {
  const handleRef = useRef<GameHandle | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const fireTimerRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [ready, setReady] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });

  const onReady = useCallback((handle: GameHandle) => {
    handleRef.current = handle;
    setReady(true);
  }, []);

  const onSnapshot = useCallback((nextSnapshot: GameSnapshot) => {
    setSnapshot(nextSnapshot);
  }, []);

  const startMatch = useCallback(() => {
    handleRef.current?.startMatch();
  }, []);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const joystickElement = joystickRef.current;
    if (!joystickElement) return;
    const rect = joystickElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const max = rect.width * 0.29;
    const length = Math.hypot(rawX, rawY);
    const ratio = length > max ? max / length : 1;
    const x = rawX * ratio;
    const y = rawY * ratio;
    setJoystick({ x, y, active: true });
    handleRef.current?.setMoveInput(x / max, y / max);
  }, []);

  const releaseJoystick = useCallback(() => {
    setJoystick({ x: 0, y: 0, active: false });
    handleRef.current?.setMoveInput(0, 0);
  }, []);

  const startFiring = useCallback(() => {
    handleRef.current?.fire();
    if (fireTimerRef.current !== null) return;
    fireTimerRef.current = window.setInterval(() => handleRef.current?.fire(), 240);
  }, []);

  const stopFiring = useCallback(() => {
    if (fireTimerRef.current !== null) {
      window.clearInterval(fireTimerRef.current);
      fireTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopFiring(), [stopFiring]);

  const zonePercent = Math.max(37, (snapshot.zoneRadius / 32) * 100);
  const isPlaying = snapshot.status === "active";
  const isEnded = snapshot.status === "victory" || snapshot.status === "defeat";

  return (
    <main className="skyfront-shell">
      <GameCanvas onReady={onReady} onSnapshot={onSnapshot} />

      <section className="sf-hud" aria-label="戦闘情報">
        <div className="sf-topbar">
          <div className="sf-operator-card glass-panel">
            <div className="sf-operator-mark">V</div>
            <div className="sf-vitals">
              <div className="sf-call-sign">RAVEN-07 <span>SOLO</span></div>
              <div className="sf-vital-row"><span className="sf-vital-icon health">+</span><div className="sf-meter"><i style={{ width: `${snapshot.health}%` }} /></div><b>{snapshot.health}</b></div>
              <div className="sf-vital-row"><Shield size={13} /><div className="sf-meter armor"><i style={{ width: `${snapshot.armor}%` }} /></div><b>{snapshot.armor}</b></div>
            </div>
          </div>

          <div className="sf-zone-clock glass-panel">
            <div><Timer size={14} /> SAFE ZONE SHIFT</div>
            <strong>{formatTime(snapshot.zoneSeconds)}</strong>
            <div className="sf-zone-track"><i style={{ width: `${zonePercent}%` }} /></div>
          </div>

          <div className="sf-minimap glass-panel" aria-label="安全地帯ミニマップ">
            <div className="sf-gridlines" />
            <div className="sf-zone-circle" style={{ width: `${zonePercent}%`, height: `${zonePercent}%` }} />
            <div className="sf-player-dot" />
            <div className="sf-enemy-dot one" />
            <div className="sf-enemy-dot two" />
            <span>NE</span>
          </div>
        </div>

        <div className="sf-mid-status" aria-live="polite">
          <span className={isPlaying ? "active" : ""}>{snapshot.message}</span>
        </div>

        <div className="sf-combat-readout glass-panel">
          <div className="sf-elims"><Target size={15} /><span>ELIMS</span><strong>{snapshot.eliminations}</strong></div>
          <div className="sf-hostiles"><Users size={15} /><span>HOSTILES</span><strong>{snapshot.enemiesRemaining}</strong></div>
          <div className="sf-supply"><Zap size={15} /><span>{snapshot.crateCollected ? "SUPPLY SECURED" : "SUPPLY SIGNAL"}</span></div>
        </div>

        <div className="sf-touch-area" aria-label="タッチ操作">
          <div
            ref={joystickRef}
            className={`sf-joystick ${joystick.active ? "is-active" : ""}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystick(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) updateJoystick(event.clientX, event.clientY);
            }}
            onPointerUp={releaseJoystick}
            onPointerCancel={releaseJoystick}
          >
            <div className="sf-joystick-knob" style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }} />
            <span>MOVE</span>
          </div>

          <div className="sf-weapon-panel glass-panel">
            <div className="sf-rifle-symbol"><span /><span /><span /></div>
            <div><b>VX-4 CARBINE</b><strong>{String(snapshot.ammo).padStart(2, "0")}<small> / {String(snapshot.reserveAmmo).padStart(3, "0")}</small></strong></div>
          </div>

          <div className="sf-actions">
            <button
              type="button"
              className="sf-action aim-left"
              onPointerDown={() => handleRef.current?.setAimInput(-1)}
              onPointerUp={() => handleRef.current?.setAimInput(0)}
              onPointerCancel={() => handleRef.current?.setAimInput(0)}
              aria-label="左に照準を動かす"
            >‹</button>
            <button
              type="button"
              className="sf-fire-button"
              onPointerDown={startFiring}
              onPointerUp={stopFiring}
              onPointerCancel={stopFiring}
              aria-label="発射"
            ><Crosshair size={28} /><span>FIRE</span></button>
            <button
              type="button"
              className="sf-action aim-right"
              onPointerDown={() => handleRef.current?.setAimInput(1)}
              onPointerUp={() => handleRef.current?.setAimInput(0)}
              onPointerCancel={() => handleRef.current?.setAimInput(0)}
              aria-label="右に照準を動かす"
            >›</button>
            <button type="button" className="sf-action jump" onPointerDown={() => handleRef.current?.jump()} aria-label="ジャンプ">JUMP</button>
          </div>
        </div>
      </section>

      {snapshot.status === "lobby" && (
        <section className="sf-lobby" style={{ backgroundImage: `linear-gradient(90deg, rgba(4, 15, 23, .98) 0%, rgba(4, 15, 23, .82) 42%, rgba(4, 15, 23, .2) 74%, rgba(4, 15, 23, .62) 100%), url(${REFERENCE_IMAGE})` }}>
          <div className="sf-lobby-content">
            <div className="sf-status-line"><i /> TRAINING ARENA / SECTOR-09</div>
            <h1>SKY<span>FRONT</span></h1>
            <p>降下、戦闘、安全地帯への帰還。短時間で完結する、タッチ操作対応のオリジナル戦術バトルロイヤル・プロトタイプです。</p>
            <div className="sf-lobby-specs"><span><LocateFixed size={15} /> 2 HOSTILES</span><span><Shield size={15} /> ACTIVE ZONE</span><span><Crosshair size={15} /> TOUCH READY</span></div>
            <button type="button" className="sf-deploy" onClick={startMatch} disabled={!ready}><span>{ready ? "DEPLOY" : "LOADING ARENA"}</span><i>→</i></button>
            <small>Landscape recommended · WASD + Space supported for desktop testing</small>
          </div>
        </section>
      )}

      {isEnded && (
        <section className="sf-result-backdrop">
          <div className={`sf-result glass-panel ${snapshot.status}`}>
            <div className="sf-result-tag">{snapshot.status === "victory" ? "MISSION STATUS" : "SIGNAL TERMINATED"}</div>
            <h2>{snapshot.status === "victory" ? "EXTRACTION COMPLETE" : "DROP FAILED"}</h2>
            <p>{snapshot.status === "victory" ? `エリアを制圧しました。排除数: ${snapshot.eliminations}。` : "装備を調整して、もう一度降下してください。"}</p>
            <div className="sf-result-stats"><span>ELIMS <b>{snapshot.eliminations}</b></span><span>ZONE <b>{formatTime(snapshot.zoneSeconds)}</b></span></div>
            <button type="button" className="sf-deploy retry" onClick={startMatch}><RotateCcw size={17} /><span>REDEPLOY</span></button>
          </div>
        </section>
      )}
    </main>
  );
}
