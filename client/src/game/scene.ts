import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/Materials/Textures/Loaders";
import type { GameHandle, GameSnapshot, MatchStatus } from "./types";

const GROUND_TEXTURE = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032246958/tsFunooYPkFmLIGY.png";
const ARENA_RADIUS = 35;
const STARTING_ZONE_RADIUS = 32;
const MIN_ZONE_RADIUS = 12;
const MATCH_SECONDS = 112;

type Enemy = {
  id: number;
  root: TransformNode;
  health: number;
  cooldown: number;
  alive: boolean;
};

type Projectile = {
  mesh: AbstractMesh;
  velocity: Vector3;
  owner: "player" | "enemy";
  ttl: number;
};

type SceneCallback = (snapshot: GameSnapshot) => void;

function makeMaterial(scene: Scene, name: string, color: Color3, emissive?: Color3) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = Color3.Black();
  if (emissive) material.emissiveColor = emissive;
  return material;
}

function createSoldier(scene: Scene, name: string, colors: { jacket: Color3; accent: Color3; helmet: Color3 }) {
  const root = new TransformNode(name, scene);
  const jacket = makeMaterial(scene, `${name}-jacket`, colors.jacket);
  const accent = makeMaterial(scene, `${name}-accent`, colors.accent, colors.accent.scale(0.22));
  const helmet = makeMaterial(scene, `${name}-helmet`, colors.helmet);
  const skin = makeMaterial(scene, `${name}-skin`, new Color3(0.48, 0.31, 0.19));
  const gunMaterial = makeMaterial(scene, `${name}-gun`, new Color3(0.1, 0.13, 0.15), new Color3(0.02, 0.04, 0.05));

  const torso = MeshBuilder.CreateBox(`${name}-torso`, { width: 0.82, height: 1.05, depth: 0.44 }, scene);
  torso.position.y = 1.16;
  torso.material = jacket;
  torso.parent = root;

  const vest = MeshBuilder.CreateBox(`${name}-vest`, { width: 0.9, height: 0.44, depth: 0.49 }, scene);
  vest.position = new Vector3(0, 1.29, -0.04);
  vest.material = accent;
  vest.parent = root;

  const head = MeshBuilder.CreateSphere(`${name}-head`, { diameter: 0.5, segments: 12 }, scene);
  head.position.y = 1.94;
  head.material = skin;
  head.parent = root;

  const helm = MeshBuilder.CreateSphere(`${name}-helmet`, { diameter: 0.56, segments: 12, slice: 0.52 }, scene);
  helm.position.y = 2.05;
  helm.material = helmet;
  helm.parent = root;

  for (const x of [-0.27, 0.27]) {
    const leg = MeshBuilder.CreateBox(`${name}-leg-${x}`, { width: 0.25, height: 0.82, depth: 0.3 }, scene);
    leg.position = new Vector3(x, 0.42, 0);
    leg.material = jacket;
    leg.parent = root;

    const boot = MeshBuilder.CreateBox(`${name}-boot-${x}`, { width: 0.29, height: 0.16, depth: 0.46 }, scene);
    boot.position = new Vector3(x, 0.07, 0.1);
    boot.material = helmet;
    boot.parent = root;
  }

  const gun = MeshBuilder.CreateBox(`${name}-carbine`, { width: 0.16, height: 0.18, depth: 0.92 }, scene);
  gun.position = new Vector3(0.28, 1.34, 0.48);
  gun.rotation.x = Math.PI / 2;
  gun.rotation.z = -0.12;
  gun.material = gunMaterial;
  gun.parent = root;

  const barrel = MeshBuilder.CreateCylinder(`${name}-barrel`, { height: 0.48, diameter: 0.08, tessellation: 8 }, scene);
  barrel.position = new Vector3(0.28, 1.38, 0.98);
  barrel.rotation.x = Math.PI / 2;
  barrel.material = gunMaterial;
  barrel.parent = root;

  return root;
}

function createTree(scene: Scene, position: Vector3, scale = 1) {
  const trunkMaterial = makeMaterial(scene, "tree-trunk", new Color3(0.2, 0.11, 0.05));
  const leafMaterial = makeMaterial(scene, "tree-leaf", new Color3(0.08, 0.19, 0.14));
  const trunk = MeshBuilder.CreateCylinder("pine-trunk", { height: 2.4 * scale, diameter: 0.38 * scale, tessellation: 8 }, scene);
  trunk.position = position.add(new Vector3(0, 1.2 * scale, 0));
  trunk.material = trunkMaterial;
  for (let index = 0; index < 3; index += 1) {
    const cone = MeshBuilder.CreateCylinder(
      `pine-crown-${index}`,
      { height: (2.6 - index * 0.38) * scale, diameterTop: 0, diameterBottom: (2.1 - index * 0.26) * scale, tessellation: 8 },
      scene,
    );
    cone.position = position.add(new Vector3(0, (2.45 + index * 0.75) * scale, 0));
    cone.material = leafMaterial;
  }
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, onSnapshot: SceneCallback): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.33, 0.67, 0.87, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.56, 0.74, 0.79);
  scene.fogDensity = 0.012;

  const camera = new ArcRotateCamera("field-camera", Math.PI / 2.42, 1.08, 14, new Vector3(0, 1.4, 5), scene);
  camera.lowerBetaLimit = 0.76;
  camera.upperBetaLimit = 1.22;
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 17;
  camera.fov = 0.88;
  camera.minZ = 0.2;
  scene.activeCamera = camera;

  const hemi = new HemisphericLight("sky-light", new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 1.08;
  hemi.diffuse = new Color3(0.76, 0.87, 0.96);
  hemi.groundColor = new Color3(0.34, 0.19, 0.09);

  const sun = new DirectionalLight("sun", new Vector3(-0.4, -1, 0.25), scene);
  sun.position = new Vector3(26, 40, -18);
  sun.intensity = 2.15;
  sun.diffuse = new Color3(1, 0.87, 0.68);

  const skyMaterial = makeMaterial(scene, "sky-material", new Color3(0.31, 0.68, 0.88), new Color3(0.15, 0.43, 0.63));
  skyMaterial.backFaceCulling = false;
  const sky = MeshBuilder.CreateBox("sky-box", { size: 180 }, scene);
  sky.material = skyMaterial;
  sky.infiniteDistance = true;

  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.specularColor = Color3.Black();
  const groundTexture = new Texture(GROUND_TEXTURE, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
  groundTexture.uScale = 12;
  groundTexture.vScale = 12;
  groundMaterial.diffuseTexture = groundTexture;
  const ground = MeshBuilder.CreateGround("highland-ground", { width: 76, height: 76, subdivisions: 2 }, scene);
  ground.material = groundMaterial;

  const player = createSoldier(scene, "raven", {
    jacket: new Color3(0.07, 0.1, 0.12),
    accent: new Color3(0.02, 0.63, 0.7),
    helmet: new Color3(0.11, 0.15, 0.17),
  });
  player.position = new Vector3(0, 0, 5);
  player.rotation.y = Math.PI;

  const barrierMaterial = makeMaterial(scene, "barrier-material", new Color3(0.3, 0.32, 0.3));
  const edgeMaterial = makeMaterial(scene, "barrier-edge", new Color3(0.02, 0.5, 0.55), new Color3(0.01, 0.16, 0.18));
  const createBarrier = (x: number, z: number, rotation = 0) => {
    const barrier = MeshBuilder.CreateBox("concrete-barrier", { width: 4.4, height: 1.3, depth: 0.7 }, scene);
    barrier.position = new Vector3(x, 0.65, z);
    barrier.rotation.y = rotation;
    barrier.material = barrierMaterial;
    const edge = MeshBuilder.CreateBox("barrier-signal", { width: 1.2, height: 0.11, depth: 0.03 }, scene);
    edge.position = new Vector3(x, 0.52, z - 0.37);
    edge.rotation.y = rotation;
    edge.material = edgeMaterial;
  };
  createBarrier(-13, 1.5, 0.18);
  createBarrier(12, -2.3, -0.18);
  createBarrier(-4.2, -12, Math.PI / 2);
  createBarrier(16, -15, 0.24);
  createBarrier(-17, -15, -0.36);

  const crateMaterial = makeMaterial(scene, "crate-material", new Color3(0.42, 0.28, 0.14));
  const crateGlow = makeMaterial(scene, "crate-glow", new Color3(0.03, 0.28, 0.28), new Color3(0.02, 0.85, 0.88));
  const crate = MeshBuilder.CreateBox("supply-crate", { width: 1.6, height: 1.4, depth: 1.6 }, scene);
  crate.position = new Vector3(-5, 0.7, -2.5);
  crate.material = crateMaterial;
  const beacon = MeshBuilder.CreateCylinder("crate-beacon", { height: 1.4, diameter: 0.13, tessellation: 10 }, scene);
  beacon.position = new Vector3(-5, 2.05, -2.5);
  beacon.material = crateGlow;

  const towerWood = makeMaterial(scene, "tower-wood", new Color3(0.23, 0.12, 0.06));
  const tower = new TransformNode("watchtower", scene);
  tower.position = new Vector3(17, 0, -21);
  for (const x of [-1.2, 1.2]) {
    for (const z of [-1.2, 1.2]) {
      const leg = MeshBuilder.CreateBox("tower-leg", { width: 0.22, height: 5.2, depth: 0.22 }, scene);
      leg.position = new Vector3(x, 2.6, z);
      leg.rotation.z = x * -0.08;
      leg.material = towerWood;
      leg.parent = tower;
    }
  }
  const deck = MeshBuilder.CreateBox("tower-deck", { width: 3.4, height: 0.3, depth: 3.4 }, scene);
  deck.position = new Vector3(0, 5.15, 0);
  deck.material = towerWood;
  deck.parent = tower;
  const cabin = MeshBuilder.CreateBox("tower-cabin", { width: 2.2, height: 1.8, depth: 2.2 }, scene);
  cabin.position = new Vector3(0, 6.15, 0);
  cabin.material = towerWood;
  cabin.parent = tower;
  const roof = MeshBuilder.CreateCylinder("tower-roof", { height: 0.65, diameterTop: 0, diameterBottom: 3.25, tessellation: 4 }, scene);
  roof.position = new Vector3(0, 7.38, 0);
  roof.rotation.y = Math.PI / 4;
  roof.material = towerWood;
  roof.parent = tower;

  for (const item of [
    [-26, -7, 1.05], [-22, 16, 0.82], [-17, 24, 1.1], [22, 18, 0.94], [27, 4, 1.06], [6, -28, 1.1], [-23, -24, 0.98],
  ]) {
    createTree(scene, new Vector3(item[0], 0, item[1]), item[2]);
  }

  const zoneMaterial = makeMaterial(scene, "zone-material", new Color3(0.0, 0.52, 0.75), new Color3(0.0, 0.85, 1));
  zoneMaterial.alpha = 0.9;
  const zoneRing = MeshBuilder.CreateTorus("safe-zone", { diameter: 2, thickness: 0.1, tessellation: 96 }, scene);
  zoneRing.position.y = 0.12;
  zoneRing.material = zoneMaterial;
  const zoneHalo = MeshBuilder.CreateTorus("safe-zone-halo", { diameter: 2, thickness: 0.035, tessellation: 96 }, scene);
  zoneHalo.position.y = 1.1;
  zoneHalo.material = zoneMaterial;

  const enemies: Enemy[] = [
    { id: 1, root: createSoldier(scene, "training-bot-1", { jacket: new Color3(0.25, 0.1, 0.09), accent: new Color3(0.9, 0.24, 0.07), helmet: new Color3(0.16, 0.08, 0.08) }), health: 100, cooldown: 1.5, alive: true },
    { id: 2, root: createSoldier(scene, "training-bot-2", { jacket: new Color3(0.19, 0.12, 0.24), accent: new Color3(0.94, 0.37, 0.1), helmet: new Color3(0.1, 0.06, 0.16) }), health: 100, cooldown: 2.1, alive: true },
  ];
  const enemySpawns = [new Vector3(0, 0, -8), new Vector3(8, 0, -12)];
  enemies.forEach((enemy, index) => {
    enemy.root.position.copyFrom(enemySpawns[index]);
    enemy.root.rotation.y = Math.PI;
  });

  const bullets: Projectile[] = [];
  const pressed = new Set<string>();
  let status: MatchStatus = "lobby";
  let health = 100;
  let armor = 60;
  let ammo = 30;
  let reserveAmmo = 180;
  let eliminations = 0;
  let matchSeconds = MATCH_SECONDS;
  let zoneRadius = STARTING_ZONE_RADIUS;
  let moveInput = { x: 0, y: 0 };
  let aimInput = 0;
  let fireCooldown = 0;
  let enemyShotCooldown = 0;
  let zoneDamageCooldown = 0;
  let jumpVelocity = 0;
  let crateCollected = false;
  let message = "READY FOR INSERTION";
  let snapshotCooldown = 0;
  let disposed = false;

  const aliveEnemies = () => enemies.filter((enemy) => enemy.alive);
  const forwardVector = () => new Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  const rightVector = () => new Vector3(Math.cos(player.rotation.y), 0, -Math.sin(player.rotation.y));

  const emit = () => {
    onSnapshot({
      status,
      health: Math.max(0, Math.round(health)),
      armor: Math.max(0, Math.round(armor)),
      ammo,
      reserveAmmo,
      eliminations,
      enemiesRemaining: aliveEnemies().length,
      zoneSeconds: Math.max(0, Math.ceil(matchSeconds)),
      zoneRadius,
      message,
      crateCollected,
    });
  };

  const clearProjectiles = () => {
    while (bullets.length) bullets.pop()?.mesh.dispose();
  };

  const resetMatch = () => {
    clearProjectiles();
    status = "active";
    health = 100;
    armor = 60;
    ammo = 30;
    reserveAmmo = 180;
    eliminations = 0;
    matchSeconds = MATCH_SECONDS;
    zoneRadius = STARTING_ZONE_RADIUS;
    fireCooldown = 0;
    enemyShotCooldown = 0;
    zoneDamageCooldown = 0;
    jumpVelocity = 0;
    crateCollected = false;
    message = "ZONE STABLE — ELIMINATE HOSTILES";
    player.position.set(0, 0, 5);
    player.rotation.y = Math.PI;
    enemies.forEach((enemy, index) => {
      enemy.health = 100;
      enemy.cooldown = 1.4 + index * 0.6;
      enemy.alive = true;
      enemy.root.setEnabled(true);
      enemy.root.position.copyFrom(enemySpawns[index]);
      enemy.root.rotation.y = Math.PI;
    });
    crate.setEnabled(true);
    beacon.setEnabled(true);
    emit();
  };

  const takeDamage = (amount: number, source: string) => {
    let remaining = amount;
    if (armor > 0) {
      const absorbed = Math.min(armor, remaining * 0.7);
      armor -= absorbed;
      remaining -= absorbed;
    }
    health -= remaining;
    message = source;
    if (health <= 0 && status === "active") {
      health = 0;
      status = "defeat";
      message = "SIGNAL LOST — RETRY THE DROP";
      clearProjectiles();
    }
  };

  const spawnProjectile = (owner: "player" | "enemy", origin: Vector3, direction: Vector3) => {
    const bulletMaterial = makeMaterial(
      scene,
      `projectile-${owner}-${Date.now()}`,
      owner === "player" ? new Color3(0.05, 0.7, 0.85) : new Color3(0.98, 0.24, 0.05),
      owner === "player" ? new Color3(0.02, 0.95, 1) : new Color3(1, 0.22, 0.03),
    );
    const bullet = MeshBuilder.CreateSphere(`bullet-${owner}`, { diameter: 0.17, segments: 8 }, scene);
    bullet.position.copyFrom(origin);
    bullet.material = bulletMaterial;
    bullets.push({ mesh: bullet, velocity: direction.normalize().scale(owner === "player" ? 34 : 20), owner, ttl: owner === "player" ? 1.4 : 1.8 });
  };

  const fire = () => {
    if (status !== "active" || fireCooldown > 0) return;
    if (ammo <= 0) {
      if (reserveAmmo > 0) {
        const reload = Math.min(30, reserveAmmo);
        ammo = reload;
        reserveAmmo -= reload;
        fireCooldown = 0.85;
        message = "MAGAZINE RELOADED";
      } else {
        message = "WEAPON DRY — COLLECT SUPPLIES";
        fireCooldown = 0.35;
      }
      return;
    }
    ammo -= 1;
    fireCooldown = 0.22;
    const direction = forwardVector();
    const origin = player.position.add(direction.scale(1.1)).add(new Vector3(0, 1.3, 0));
    spawnProjectile("player", origin, direction);
    message = ammo === 0 ? "MAGAZINE EMPTY" : "ENGAGING";
  };

  const keyDown = (event: KeyboardEvent) => {
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)) event.preventDefault();
    if (event.code === "Space") fire();
    if (event.code === "KeyR" && (status === "victory" || status === "defeat")) resetMatch();
    pressed.add(event.code);
  };
  const keyUp = (event: KeyboardEvent) => pressed.delete(event.code);
  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") fire();
  };
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  canvas.addEventListener("pointerdown", pointerDown);

  scene.onBeforeRenderObservable.add(() => {
    if (disposed) return;
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    snapshotCooldown -= dt;
    fireCooldown = Math.max(0, fireCooldown - dt);

    let keyboardX = 0;
    let keyboardY = 0;
    if (pressed.has("KeyA") || pressed.has("ArrowLeft")) keyboardX -= 1;
    if (pressed.has("KeyD") || pressed.has("ArrowRight")) keyboardX += 1;
    if (pressed.has("KeyW") || pressed.has("ArrowUp")) keyboardY -= 1;
    if (pressed.has("KeyS") || pressed.has("ArrowDown")) keyboardY += 1;
    const activeInput = Math.abs(moveInput.x) + Math.abs(moveInput.y) > 0.05 ? moveInput : { x: keyboardX, y: keyboardY };

    if (status === "active") {
      player.rotation.y += aimInput * dt * 1.8;
      if (pressed.has("KeyQ")) player.rotation.y -= dt * 1.6;
      if (pressed.has("KeyE")) player.rotation.y += dt * 1.6;
      const move = rightVector().scale(activeInput.x).add(forwardVector().scale(-activeInput.y));
      if (move.lengthSquared() > 0.001) {
        move.normalize();
        player.position.addInPlace(move.scale(dt * 8.2));
      }
      player.position.x = Math.max(-ARENA_RADIUS, Math.min(ARENA_RADIUS, player.position.x));
      player.position.z = Math.max(-ARENA_RADIUS, Math.min(ARENA_RADIUS, player.position.z));

      if (jumpVelocity !== 0 || player.position.y > 0) {
        player.position.y += jumpVelocity * dt;
        jumpVelocity -= 18 * dt;
        if (player.position.y <= 0) {
          player.position.y = 0;
          jumpVelocity = 0;
        }
      }

      matchSeconds -= dt;
      zoneRadius = Math.max(MIN_ZONE_RADIUS, STARTING_ZONE_RADIUS - (STARTING_ZONE_RADIUS - MIN_ZONE_RADIUS) * (1 - Math.max(0, matchSeconds) / MATCH_SECONDS));
      zoneRing.scaling.set(zoneRadius, 1, zoneRadius);
      zoneHalo.scaling.set(zoneRadius, 1, zoneRadius);
      zoneHalo.rotation.y += dt * 0.9;

      const playerDistance = Math.hypot(player.position.x, player.position.z);
      zoneDamageCooldown -= dt;
      if (playerDistance > zoneRadius && zoneDamageCooldown <= 0) {
        takeDamage(8, "OUTSIDE THE SAFE ZONE");
        zoneDamageCooldown = 0.82;
      }

      if (!crateCollected && Vector3.Distance(player.position, crate.position) < 2.25) {
        crateCollected = true;
        reserveAmmo += 54;
        armor = Math.min(100, armor + 24);
        crate.setEnabled(false);
        beacon.setEnabled(false);
        message = "SUPPLY SECURED +54 AMMO";
      }

      enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const toPlayer = player.position.subtract(enemy.root.position);
        const distance = toPlayer.length();
        enemy.root.lookAt(new Vector3(player.position.x, enemy.root.position.y, player.position.z));
        if (distance > 10 && distance < 27) {
          const step = toPlayer.normalize().scale(dt * 1.25);
          enemy.root.position.addInPlace(step);
        }
        enemy.cooldown -= dt;
        if (distance < 19 && enemy.cooldown <= 0) {
          const origin = enemy.root.position.add(new Vector3(0, 1.32, 0));
          spawnProjectile("enemy", origin, player.position.add(new Vector3(0, 1.25, 0)).subtract(origin));
          enemy.cooldown = 1.85 + Math.random() * 0.65;
        }
      });

      for (let index = bullets.length - 1; index >= 0; index -= 1) {
        const bullet = bullets[index];
        bullet.ttl -= dt;
        bullet.mesh.position.addInPlace(bullet.velocity.scale(dt));
        if (bullet.ttl <= 0) {
          bullet.mesh.dispose();
          bullets.splice(index, 1);
          continue;
        }
        if (bullet.owner === "player") {
          const hit = aliveEnemies().find((enemy) => Vector3.Distance(bullet.mesh.position, enemy.root.position.add(new Vector3(0, 1.1, 0))) < 1.1);
          if (hit) {
            hit.health -= 34;
            bullet.mesh.dispose();
            bullets.splice(index, 1);
            if (hit.health <= 0) {
              hit.alive = false;
              hit.root.setEnabled(false);
              eliminations += 1;
              message = `HOSTILE ${hit.id} ELIMINATED`;
              if (aliveEnemies().length === 0) {
                status = "victory";
                message = "EXTRACTION COMPLETE";
                clearProjectiles();
              }
            } else {
              message = "TARGET HIT";
            }
          }
        } else if (Vector3.Distance(bullet.mesh.position, player.position.add(new Vector3(0, 1.15, 0))) < 0.95) {
          takeDamage(9, "INCOMING FIRE");
          bullet.mesh.dispose();
          bullets.splice(index, 1);
        }
      }

      if (matchSeconds <= 0 && status === "active") {
        status = "defeat";
        message = "STORM OVERWHELMED THE SQUAD";
        clearProjectiles();
      }
    }

    const cameraTarget = player.position.add(forwardVector().scale(4.2)).add(new Vector3(0, 1.25, 0));
    camera.target.copyFrom(cameraTarget);
    if (snapshotCooldown <= 0) {
      emit();
      snapshotCooldown = 0.1;
    }
  });

  emit();

  return {
    scene,
    startMatch: resetMatch,
    restart: resetMatch,
    setMoveInput: (x, y) => {
      moveInput = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    },
    setAimInput: (value) => {
      aimInput = Math.max(-1, Math.min(1, value));
    },
    fire,
    jump: () => {
      if (status === "active" && player.position.y <= 0.01) {
        jumpVelocity = 6.8;
        message = "MOBILITY BOOST";
      }
    },
    dispose: () => {
      disposed = true;
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      canvas.removeEventListener("pointerdown", pointerDown);
      clearProjectiles();
      scene.dispose();
    },
  };
}
