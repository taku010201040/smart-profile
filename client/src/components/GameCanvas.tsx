import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene } from "@/game/scene";
import type { GameHandle, GameSnapshot } from "@/game/types";

type GameCanvasProps = {
  onReady: (handle: GameHandle) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
};

export default function GameCanvas({ onReady, onSnapshot }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    let handle: GameHandle | null = null;
    let cancelled = false;

    createGameScene(engine, canvas, onSnapshot).then((createdHandle) => {
      if (cancelled) {
        createdHandle.dispose();
        return;
      }
      handle = createdHandle;
      onReady(createdHandle);
      engine.runRenderLoop(() => createdHandle.scene.render());
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.stopRenderLoop();
      engine.dispose();
      startedRef.current = false;
    };
  }, [onReady, onSnapshot]);

  return <canvas ref={canvasRef} className="skyfront-canvas" aria-label="SKYFRONT tactical arena" />;
}
