import { Canvas } from '@react-three/fiber'
import ClockModel from './ClockModel'

/**
 * Lightweight Canvas wrapper around ClockModel. No drag interaction — the
 * face stays readable, it just idles gently — so it works as a real,
 * glanceable clock/stopwatch rather than a toy.
 */
export default function ClockScene({ className = '', mode = 'clock', stopwatch }) {
  return (
    <div className={`select-none ${className}`} style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 5]} intensity={0.9} color="#F7F4ED" />
        <directionalLight position={[-3, -2, -3]} intensity={0.25} color="#C2491D" />
        <ClockModel mode={mode} stopwatch={stopwatch} scale={1.05} />
      </Canvas>
    </div>
  )
}
