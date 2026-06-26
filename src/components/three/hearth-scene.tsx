import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/* Hearth cinematic palette — periwinkle / ink (no warm ember). */
const PERI = "#8b7cf6";
const PERI_DEEP = "#6d5ef0";
const PERI_SOFT = "#a99bff";
const VIOLET = "#9b6cf0";

type ProgressRef = RefObject<number>;

/* ── Glowing hearth core ─────────────────────────────────────────────────── */
function HearthCore() {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.1) * 0.04;
    if (core.current) core.current.scale.setScalar(pulse);
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(t * 1.1) * 0.05;
    }
  });

  return (
    <group>
      {/* Inner emissive orb */}
      <mesh ref={core}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshStandardMaterial
          color={PERI_SOFT}
          emissive={PERI}
          emissiveIntensity={2.2}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* Soft additive halo */}
      <mesh ref={halo} scale={2.4}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshBasicMaterial color={PERI} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <pointLight color={PERI} intensity={6} distance={6} position={[0, 0, 0]} />
    </group>
  );
}

/* ── A single floating frosted-glass "day" tile ──────────────────────────── */
function DayTile({
  position,
  rotation,
  scale = 1,
  tint = PERI,
  emissive = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tint?: string;
  emissive?: boolean;
}) {
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.7}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[0.92, 1.16, 0.08]} radius={0.09} smoothness={5} castShadow>
          <meshPhysicalMaterial
            color={tint}
            transmission={0.78}
            thickness={0.6}
            roughness={0.16}
            metalness={0}
            ior={1.35}
            clearcoat={1}
            clearcoatRoughness={0.2}
            attenuationColor={tint}
            attenuationDistance={1.4}
            transparent
            opacity={0.92}
          />
        </RoundedBox>
        {/* Accent header bar on the tile */}
        <mesh position={[0, 0.4, 0.05]}>
          <planeGeometry args={[0.62, 0.1]} />
          <meshStandardMaterial
            color={emissive ? PERI_SOFT : PERI_DEEP}
            emissive={emissive ? PERI : "#000000"}
            emissiveIntensity={emissive ? 1.6 : 0}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Tiny event dots */}
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0.05 - i * 0.0, 0.05]}>
            <circleGeometry args={[0.035, 18]} />
            <meshBasicMaterial color={i === 1 ? VIOLET : PERI_SOFT} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

/* ── Ambient particle dust ───────────────────────────────────────────────── */
function Particles({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={PERI_SOFT}
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── The orbiting constellation rig ──────────────────────────────────────── */
function Constellation({ progress, dense = true }: { progress?: ProgressRef; dense?: boolean }) {
  const rig = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    // Pointer parallax (eased)
    target.current.x = state.pointer.y * 0.18;
    target.current.y = state.pointer.x * 0.28;
    const scroll = progress?.current ?? 0;

    rig.current.rotation.x = THREE.MathUtils.lerp(
      rig.current.rotation.x,
      target.current.x + scroll * 0.5,
      0.05,
    );
    rig.current.rotation.y = THREE.MathUtils.lerp(
      rig.current.rotation.y,
      target.current.y + t * 0.06 + scroll * 0.9,
      0.05,
    );
    rig.current.position.z = THREE.MathUtils.lerp(rig.current.position.z, scroll * -1.2, 0.05);
  });

  return (
    <group ref={rig}>
      <HearthCore />
      <DayTile position={[-1.55, 0.55, -0.4]} rotation={[0.1, 0.5, 0.08]} tint={PERI} emissive />
      <DayTile position={[1.5, 0.2, -0.2]} rotation={[-0.05, -0.5, -0.1]} tint={PERI_SOFT} scale={0.92} />
      <DayTile position={[-0.95, -1.0, 0.5]} rotation={[0.2, 0.35, -0.12]} tint={VIOLET} scale={0.8} />
      {dense && (
        <>
          <DayTile position={[1.15, -0.85, 0.4]} rotation={[-0.15, -0.3, 0.14]} tint={PERI_DEEP} scale={0.78} emissive />
          <DayTile position={[0.1, 1.35, -0.8]} rotation={[0.25, 0.1, 0.05]} tint={PERI_SOFT} scale={0.7} />
        </>
      )}
      <Particles count={dense ? 260 : 130} />
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} color="#cfd2ff" />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color={PERI} />
      {/* Inline lightformers give the glass real reflections without an external HDR */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} color={PERI_SOFT} position={[0, 3, 2]} scale={[6, 3, 1]} />
        <Lightformer intensity={1.6} color="#ffffff" position={[-3, 1, 2]} scale={[3, 3, 1]} />
        <Lightformer intensity={2} color={VIOLET} position={[3, -1, 1]} scale={[4, 2, 1]} />
        <Lightformer intensity={1.2} color={PERI_DEEP} position={[0, -3, 1]} scale={[6, 2, 1]} />
      </Environment>
    </>
  );
}

const GL_PROPS = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance" as const,
};

/* ── Public: full cinematic hero scene ───────────────────────────────────── */
export function HearthHeroScene({
  className,
  progress,
}: {
  className?: string;
  progress?: ProgressRef;
}) {
  return (
    <div className={cn("h-full w-full", className)} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={GL_PROPS}
        style={{ background: "transparent" }}
      >
        <SceneLighting />
        <Constellation progress={progress} dense />
      </Canvas>
    </div>
  );
}

/* ── Public: compact scene for the auth panel ────────────────────────────── */
export function HearthAuthScene({ className }: { className?: string }) {
  return (
    <div className={cn("h-full w-full", className)} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.5], fov: 40 }}
        gl={GL_PROPS}
        style={{ background: "transparent" }}
      >
        <SceneLighting />
        <Constellation dense={false} />
      </Canvas>
    </div>
  );
}

/* Legacy aliases — older imports keep resolving. */
export const HearthGatheringScene = HearthHeroScene;
export const HearthEmberMiniScene = HearthAuthScene;
export const HearthOrbitalScene = HearthHeroScene;
export const HearthCoreMiniScene = HearthAuthScene;
