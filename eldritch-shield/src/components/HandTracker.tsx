import { useEffect, RefObject } from 'react';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Webcam from 'react-webcam';
import * as THREE from 'three';

interface HandTrackerProps {
    videoRef: RefObject<Webcam>;
    onHandUpdate: (data: HandData | null) => void;
}

export interface HandData {
    position: THREE.Vector3; // Wrist position mapped to 3D space
    rotation: THREE.Quaternion; // Orientation
    gesture: 'OPEN' | 'FIST' | 'UNKNOWN';
}

export function HandTracker({ videoRef, onHandUpdate }: HandTrackerProps) {
    useEffect(() => {
        if (!videoRef.current || !videoRef.current.video) return;

        const videoElement = videoRef.current.video;

        const onResults = (results: Results) => {
            // No hand?
            if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
                onHandUpdate(null);
                return;
            }

            const landmarks = results.multiHandLandmarks[0]; // Tracking one hand

            // 1. Get Key Landmarks
            const wrist = landmarks[0];
            const middleFingerMCP = landmarks[9];
            const middleFingerTip = landmarks[12];
            const indexFingerTip = landmarks[8];
            const ringFingerTip = landmarks[16];
            const pinkyFingerTip = landmarks[20];
            const thumbTip = landmarks[4];

            // 2. Gesture Detection (Simple Heuristic)
            // Check if fingertips are close to the palm (Fist) or extended (Open)
            // We'll calculate distance from wrist to tips vs wrist to MCPs

            const isFingerExtended = (tip: any, mcp: any) => {
                // Simple Y check (assuming hand is upright-ish) or distance check relative to wrist
                const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                const distMcp = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
                return distTip > distMcp * 1.5; // Tip significantly further than MCP behavior
            };

            // For robustness, let's just use a simple "Palm Open" check:
            // Area of the hand box or spread of fingers.
            // Actually, let's check distance from Wrist to Middle Tip.
            // Fist: Tip is close to wrist. Open: Tip is far.
            const dWristToMiddleTip = Math.sqrt(Math.pow(middleFingerTip.x - wrist.x, 2) + Math.pow(middleFingerTip.y - wrist.y, 2));
            const dWristToMiddleMCP = Math.sqrt(Math.pow(middleFingerMCP.x - wrist.x, 2) + Math.pow(middleFingerMCP.y - wrist.y, 2));

            const gesture = dWristToMiddleTip > dWristToMiddleMCP * 1.8 ? 'OPEN' : 'FIST';

            // 3. Coordinate Mapping (Video Space -> 3D Space)
            // MediaPipe: x (0-1), y (0-1). 
            // 3D Scene: Assuming scale where screen defines bounds.
            // We need to invert X because webcam is mirrored.

            const x = (1 - wrist.x) * 2 - 1; // Map 0..1 to -1..1, inverted
            const y = -(wrist.y * 2 - 1);    // Map 0..1 to 1..-1 (Y is up in 3D)

            // Z estimation? MediaPipe gives z relative to wrist.
            // We can just set a fixed Z or use the hand size to estimate depth.
            // For AR overlay, fixed Z (0) with some parallax is usually fine or 0.

            // Scale to our 3D viewport size (approx width 10 for camera z=5)
            // Let's assume camera z=5, fov=75. Visible height at z=0 is approx 7.6.
            const viewportHeight = 7.6;
            const viewportWidth = viewportHeight * (window.innerWidth / window.innerHeight); // Aspect ratio logic needed

            // IMPORTANT: We will do the mapping inside the Three.js component using useThree(), 
            // passing raw Normalized Device Coordinates (NDC) here.

            const position = new THREE.Vector3(x, y, 0);

            // 4. Orientation
            // Vector from Wrist to MiddleMCP defines "Up" or "Forward" for the hand
            const vDirection = new THREE.Vector3(
                (1 - middleFingerMCP.x) - (1 - wrist.x),
                -(middleFingerMCP.y - wrist.y),
                0
            ).normalize();

            // Calculate rotation quaternion to align Shield's logic Up (Y) with Hand Direction
            const dummyUp = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(dummyUp, vDirection);

            onHandUpdate({
                position,
                rotation: quaternion,
                gesture
            });
        };

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 1280,
            height: 720,
        });

        camera.start();

        return () => {
            // Cleanup logic if needed, though camera.stop() isn't exposed easily in this creation pattern
            // simple unmount is usually fine for reload
        };
    }, []); // Run once on mount (assuming ref is stable)

    return null; // Logic only
}
