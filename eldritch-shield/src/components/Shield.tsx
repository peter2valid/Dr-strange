import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShieldProps {
    visible: boolean;
}

export function Shield({ visible }: ShieldProps) {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Points>(null);
    const middleRef = useRef<THREE.Points>(null);
    const outerRef = useRef<THREE.Points>(null);

    // --- Particle Generation ---
    // We generate geometry once using useMemo

    // 1. Inner Square (Rotating Clockwise)
    const innerGeometry = useMemo(() => {
        const points: number[] = [];
        const size = 0.5;
        const particlesPerSide = 100;

        // Create a square using particles
        for (let i = 0; i < particlesPerSide; i++) {
            const t = (i / particlesPerSide) * 2 - 1; // -1 to 1
            // Top
            points.push(t * size, size, 0);
            // Bottom
            points.push(t * size, -size, 0);
            // Left
            points.push(-size, t * size, 0);
            // Right
            points.push(size, t * size, 0);
        }

        // Add some diagonal cross lines for "rune" look
        for (let i = 0; i < particlesPerSide * 1.5; i++) {
            const t = (i / (particlesPerSide * 1.5)) * 2 - 1;
            points.push(t * size, t * size, 0);
            points.push(t * size, -t * size, 0);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, []);

    // 2. Middle Mandala (Rotating Counter-Clockwise)
    const middleGeometry = useMemo(() => {
        const points: number[] = [];
        const count = 600;
        const radius = 0.8;

        for (let i = 0; i < count; i++) {
            const theta = (i / count) * Math.PI * 2;
            // Main circle
            points.push(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);

            // Secondary intricate pattern (Sine wave offset)
            const r2 = radius * (0.8 + 0.2 * Math.cos(theta * 6));
            points.push(Math.cos(theta) * r2, Math.sin(theta) * r2, 0);

            // Inner circle
            points.push(Math.cos(theta) * (radius * 0.5), Math.sin(theta) * (radius * 0.5), 0);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, []);

    // 3. Outer Ring (Sparks/Ember)
    const outerGeometry = useMemo(() => {
        const points: number[] = [];
        const count = 400;
        const radius = 1.2;

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            // Spread them slightly for "spark" effect
            const r = radius + (Math.random() - 0.5) * 0.1;
            points.push(Math.cos(theta) * r, Math.sin(theta) * r, (Math.random() - 0.5) * 0.1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, []);

    // Shared Material (Eldritch Orange Bloom)
    // To get the "Ember" look with bloom, the color values should be > 1.0 or the intensity high.
    // We use blending: THREE.AdditiveBlending for that glowing overlap.
    const material = useMemo(() => new THREE.PointsMaterial({
        color: new THREE.Color('#FF6F00').multiplyScalar(4), // Boost for Bloom
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // Essential for transparency
    }), []);


    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. Gesture State (Scale Lerp)
        const targetScale = visible ? 1 : 0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Hide completely if tiny to save resources
        if (groupRef.current.scale.x < 0.01 && !visible) {
            groupRef.current.visible = false;
            return;
        } else {
            groupRef.current.visible = true;
        }

        // 2. Rotation Animation
        if (innerRef.current) innerRef.current.rotation.z -= delta * 0.5;
        if (middleRef.current) middleRef.current.rotation.z += delta * 0.3;
        if (outerRef.current) {
            // Sparks rotate and jitter slightly
            outerRef.current.rotation.z -= delta * 0.1;
            outerRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            <points geometry={innerGeometry} material={material} ref={innerRef} />
            <points geometry={middleGeometry} material={material} ref={middleRef} />
            <points geometry={outerGeometry} material={material} ref={outerRef} />
        </group>
    );
}
