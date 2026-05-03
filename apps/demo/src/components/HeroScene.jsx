/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Environment,
  MeshDistortMaterial,
  Sparkles,
  Stars,
} from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";

const IdentityCard = () => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.35;
    ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.12;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.1}>
      <group ref={ref}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 2, 0.08]} />
          <meshPhysicalMaterial
            color="#0A0D16"
            metalness={0.6}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
            reflectivity={0.9}
          />
        </mesh>
        <mesh position={[0, 0.55, 0.045]}>
          <boxGeometry args={[2.9, 0.14, 0.01]} />
          <meshBasicMaterial color="#9945FF" toneMapped={false} />
        </mesh>
        <mesh position={[-1.2, -0.55, 0.045]}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color="#14F195" toneMapped={false} />
        </mesh>
        <mesh position={[1.05, -0.55, 0.05]}>
          <boxGeometry args={[0.5, 0.32, 0.02]} />
          <meshStandardMaterial
            color="#1A1E2E"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[1.6, 0, 0]}>
          <boxGeometry args={[0.02, 2, 0.1]} />
          <meshBasicMaterial color="#9945FF" toneMapped={false} />
        </mesh>
        <mesh position={[-1.6, 0, 0]}>
          <boxGeometry args={[0.02, 2, 0.1]} />
          <meshBasicMaterial color="#14F195" toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
};

const OrbitalRing = ({
  radius = 3.5,
  color = "#9945FF",
  speed = 0.5,
  tilt = 0.2,
}) => {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current)
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
  });
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 0.45, 0),
      );
    }
    return pts;
  }, [radius]);
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  );

  return (
    <group rotation={[tilt, 0, 0]} ref={ref}>
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          toneMapped={false}
        />
      </line>
    </group>
  );
};

const OrbitNode = ({
  radius,
  speed,
  offset,
  color,
  size = 0.12,
  tilt = 0.2,
}) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.y = Math.sin(t) * radius * 0.45;
    ref.current.position.z = Math.sin(t * 0.5) * 0.4;
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
};

const CenterCore = () => {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.25;
      ref.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -0.5]}>
      <icosahedronGeometry args={[0.55, 1]} />
      <MeshDistortMaterial
        color="#9945FF"
        emissive="#9945FF"
        emissiveIntensity={0.6}
        distort={0.35}
        speed={2}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight
        position={[-3, 0, 2]}
        intensity={2.5}
        color="#9945FF"
        distance={10}
      />
      <pointLight
        position={[3, 0, 2]}
        intensity={2.5}
        color="#14F195"
        distance={10}
      />
      <pointLight
        position={[0, -2, 3]}
        intensity={1.2}
        color="#00C2FF"
        distance={8}
      />

      <Stars
        radius={50}
        depth={50}
        count={1500}
        factor={2.5}
        fade
        speed={0.6}
      />
      <Sparkles count={70} scale={8} size={2} speed={0.3} color="#9945FF" />

      <CenterCore />
      <IdentityCard />

      <OrbitalRing radius={3.2} color="#9945FF" tilt={0.25} speed={0.4} />
      <OrbitalRing radius={4.4} color="#14F195" tilt={-0.15} speed={0.3} />
      <OrbitalRing radius={5.4} color="#00C2FF" tilt={0.4} speed={0.2} />

      <OrbitNode
        radius={3.2}
        speed={0.6}
        offset={0}
        color="#9945FF"
        size={0.14}
        tilt={0.25}
      />
      <OrbitNode
        radius={3.2}
        speed={0.6}
        offset={Math.PI}
        color="#14F195"
        size={0.1}
        tilt={0.25}
      />
      <OrbitNode
        radius={4.4}
        speed={0.4}
        offset={1}
        color="#00C2FF"
        size={0.12}
        tilt={-0.15}
      />
      <OrbitNode
        radius={4.4}
        speed={0.4}
        offset={Math.PI + 0.5}
        color="#14F195"
        size={0.09}
        tilt={-0.15}
      />
      <OrbitNode
        radius={5.4}
        speed={0.25}
        offset={2}
        color="#9945FF"
        size={0.08}
        tilt={0.4}
      />

      <Environment preset="night" />
    </>
  );
};

const HeroScene = () => {
  return (
    <div className="absolute inset-0 z-0" data-testid="hero-3d-scene">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.4, 7], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,4,10,0.8)_100%)]" />
    </div>
  );
};

export default HeroScene;
