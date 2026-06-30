import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// Theme colors pulled straight from the app's CSS variables
const COLORS = {
  paperWarm: '#F1ECE0',
  paperLine: '#E0D9C8',
  ink: '#1C1F26',
  rust: '#C2491D',
  moss: '#4F6F52',
}

/**
 * A stylized 3D clock — a chunky watch-like case built entirely from
 * primitive geometries (no external assets) so it matches the flat, matte
 * aesthetic of the rest of the UI.
 *
 * mode 'clock'     -> hands follow the real, live system time every frame.
 * mode 'stopwatch' -> hands sweep based on the elapsed stopwatch time.
 *
 * @param {{running: boolean, elapsedMs: number, startedAt: number|null}} stopwatch
 *   elapsedMs is the accumulated time while paused; startedAt is the
 *   performance.now() timestamp the stopwatch was last (re)started at.
 */
export default function ClockModel({ mode = 'clock', stopwatch, scale = 1 }) {
  const group = useRef()
  const hourRef = useRef()
  const minuteRef = useRef()
  const secondRef = useRef()

  const bobOffset = useState(() => Math.random() * Math.PI * 2)[0]

  useFrame((state) => {
    if (!group.current) return

    // gentle idle bob + tilt — alive, but never spins the face so it stays readable
    const t = state.clock.elapsedTime + bobOffset
    group.current.position.y = Math.sin(t * 0.8) * 0.05
    group.current.rotation.x = 0.06 + Math.sin(t * 0.5) * 0.012
    group.current.rotation.y = 0.18 + Math.sin(t * 0.35) * 0.04

    let totalSeconds
    if (mode === 'clock') {
      const d = new Date()
      totalSeconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000
    } else {
      const elapsed = stopwatch?.running
        ? (stopwatch.elapsedMs || 0) + (performance.now() - stopwatch.startedAt)
        : stopwatch?.elapsedMs || 0
      totalSeconds = elapsed / 1000
    }

    const secAngle = ((totalSeconds % 60) / 60) * Math.PI * 2
    const minAngle = ((totalSeconds % 3600) / 3600) * Math.PI * 2
    const hrAngle = ((totalSeconds % 43200) / 43200) * Math.PI * 2

    if (secondRef.current) secondRef.current.rotation.z = -secAngle
    if (minuteRef.current) minuteRef.current.rotation.z = -minAngle
    if (hourRef.current) hourRef.current.rotation.z = -hrAngle
  })

  const ticks = useMemo(() => {
    const items = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const major = i % 3 === 0
      const r = 0.76
      items.push({
        x: Math.sin(a) * r,
        y: Math.cos(a) * r,
        major,
        isTwelve: i === 0,
      })
    }
    return items
  }, [])

  return (
    <group ref={group} scale={scale}>
      {/* Case (back) */}
      <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.16, 32]} />
        <meshStandardMaterial color={COLORS.ink} roughness={0.85} metalness={0} />
      </mesh>

      {/* Rust bezel ring */}
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.0, 0.97, 0.06, 32]} />
        <meshStandardMaterial color={COLORS.rust} roughness={0.7} metalness={0} />
      </mesh>

      {/* Face */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.88, 0.88, 0.05, 32]} />
        <meshStandardMaterial color={COLORS.paperWarm} roughness={1} metalness={0} />
      </mesh>

      {/* Tick marks */}
      {ticks.map((tick, i) => (
        <mesh key={i} position={[tick.x, tick.y, 0.1]}>
          <boxGeometry args={tick.major ? [0.045, 0.13, 0.02] : [0.025, 0.07, 0.02]} />
          <meshStandardMaterial color={tick.isTwelve ? COLORS.rust : COLORS.ink} roughness={0.6} />
        </mesh>
      ))}

      {/* Hour hand */}
      <group ref={hourRef} position={[0, 0, 0.11]}>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.05, 0.44, 0.025]} />
          <meshStandardMaterial color={COLORS.ink} roughness={0.6} />
        </mesh>
      </group>

      {/* Minute hand */}
      <group ref={minuteRef} position={[0, 0, 0.13]}>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.035, 0.64, 0.02]} />
          <meshStandardMaterial color={COLORS.ink} roughness={0.6} />
        </mesh>
      </group>

      {/* Second hand */}
      <group ref={secondRef} position={[0, 0, 0.15]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.015, 0.68, 0.015]} />
          <meshStandardMaterial color={COLORS.rust} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.015, 0.18, 0.015]} />
          <meshStandardMaterial color={COLORS.rust} roughness={0.5} />
        </mesh>
      </group>

      {/* Center cap */}
      <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.moss} roughness={0.5} />
      </mesh>

      {/* Crown (little knob on the side, watch-style) */}
      <mesh position={[1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
        <meshStandardMaterial color={COLORS.ink} roughness={0.7} />
      </mesh>
    </group>
  )
}
