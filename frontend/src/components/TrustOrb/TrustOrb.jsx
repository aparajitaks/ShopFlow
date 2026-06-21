import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Html } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
import { getOrbConfig } from './orbColor';

// ── Inner 3D mesh — lives inside Canvas ────────────────────────────────────

function OrbScene({ config, reducedMotion, fraudFlag, score }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const clockRef = useRef(0);

  useFrame((_state, delta) => {
    if (reducedMotion) return;
    clockRef.current += delta;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x = Math.sin(clockRef.current * 0.4) * 0.06;
      meshRef.current.position.y = Math.sin(clockRef.current * 0.9) * 0.09;
    }

    // Fraud ring pulse: opacity oscillates at ~2 Hz
    if (ringRef.current && fraudFlag) {
      ringRef.current.material.opacity =
        0.55 + 0.45 * Math.sin(clockRef.current * 4.5);
    }
  });

  return (
    <>
      {/* Key light — gives the orb dimensionality */}
      <directionalLight position={[4, 6, 4]} intensity={1.4} />
      {/* Ambient — prevents pitch-black shadows */}
      <ambientLight intensity={0.55} />
      {/* Fill light from below-left for a slight glow */}
      <pointLight position={[-3, -2, 2]} intensity={0.4} color={config.hex} />

      {/* Main orb sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <MeshDistortMaterial
          color={config.hex}
          distort={config.distort}
          speed={config.speed}
          roughness={0.08}
          metalness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Fraud warning ring — torus, only rendered when fraudFlag is true */}
      {fraudFlag && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.58, 0.045, 16, 100]} />
          <meshStandardMaterial
            color="#DC2626"
            transparent
            opacity={0.8}
            emissive="#DC2626"
            emissiveIntensity={0.6}
          />
        </mesh>
      )}

      {/* Score overlay — HTML rendered inside Canvas via drei's Html portal */}
      <Html center>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '3rem',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 2px 12px rgba(0,0,0,0.45)',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
      </Html>
    </>
  );
}

// ── Public component ───────────────────────────────────────────────────────

/**
 * TrustOrb — 3D animated trust score visualization.
 *
 * @param {object}  props
 * @param {number}  props.score      0–100
 * @param {string}  props.riskLevel  'Low' | 'Medium' | 'High'
 * @param {boolean} props.fraudFlag
 */
export default function TrustOrb({ score, riskLevel, fraudFlag }) {
  const config = useMemo(() => getOrbConfig(riskLevel, fraudFlag), [riskLevel, fraudFlag]);

  // Detect prefers-reduced-motion once on mount
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* ── Accessible DOM score — visible to screen readers & text-only browsers ── */}
      <div
        className="sr-only"
        aria-label={`Trust score ${score} out of 100. Risk level: ${riskLevel}${fraudFlag ? '. Fraud flag active.' : ''}`}
      />

      {/* ── 3D Canvas (aria-hidden — all real info is in DOM text alongside) ── */}
      <div className="w-72 h-72">
        <Canvas
          aria-hidden="true"
          camera={{ position: [0, 0, 3.8], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent', borderRadius: '50%' }}
          dpr={[1, 2]}
        >
          <OrbScene
            config={config}
            reducedMotion={reducedMotion}
            fraudFlag={fraudFlag}
            score={score}
          />
        </Canvas>
      </div>

      {/* ── Glow ring behind canvas — pure CSS, no WebGL cost ── */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.hex}22 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />
    </div>
  );
}
