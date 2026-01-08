import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Shield } from './Shield';
import { HandData } from './HandTracker';
import { MutableRefObject, useRef } from 'react';
import * as THREE from 'three';

interface Scene3DProps {
    handDataRef: MutableRefObject<HandData | null>;
}

function CreateRig({ handDataRef }: Scene3DProps) {
    const { viewport, camera } = useThree();
    const shieldGroupRef = useRef<THREE.Group>(null);
    const smoothedPosition = useRef(new THREE.Vector3(0, 0, 0));
    const smoothedRotation = useRef(new THREE.Quaternion());

    useFrame((state, delta) => {
        if (!shieldGroupRef.current) return;

        const handData = handDataRef.current;

        if (handData && handData.gesture === 'OPEN') {
            shieldGroupRef.current.visible = true;

            // 1. Map Normalized Coordinates (-1 to 1) to Viewport World Coordinates
            // NDC x: -1 (left) to 1 (right)
            // NDC y: -1 (bottom) to 1 (top)
            // Viewport width/height tells us the world units at z=0 (where we draw)

            const targetX = handData.position.x * (viewport.width / 2);
            const targetY = handData.position.y * (viewport.height / 2);
            const targetZ = 0; // Keep it on the plane

            const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

            // 2. Linear Interpolation (Lerp) for Smoothing
            // Factor 0.1 for weight/lag effect
            smoothedPosition.current.lerp(targetPos, 0.1);
            shieldGroupRef.current.position.copy(smoothedPosition.current);

            // 3. Rotation Smoothing
            smoothedRotation.current.slerp(handData.rotation, 0.1);
            shieldGroupRef.current.quaternion.copy(smoothedRotation.current);

        } else {
            // Hide logic handled inside Shield scale, but we can also toggle vis here
            // We let Shield handle the scale-down animation
        }
    });

    return (
        <group ref={shieldGroupRef} visible={false}>
            {/* We pass 'visible' prop to Shield based on gesture to trigger animations */}
            <Shield visible={!!(handDataRef.current && handDataRef.current.gesture === 'OPEN')} />
        </group>
    );
}

export function Scene3D({ handDataRef }: Scene3DProps) {
    return (
        <Canvas
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0, 5], fov: 75 }}
        >
            {/* Lights - though particles are unlit, this helps if we add meshes */}
            <ambientLight intensity={0.5} />

            <CreateRig handDataRef={handDataRef} />

            <EffectComposer>
                <Bloom
                    luminanceThreshold={0}
                    luminanceSmoothing={0.9}
                    height={300}
                    opacity={1.5}
                    intensity={2}
                />
            </EffectComposer>
        </Canvas>
    );
}
