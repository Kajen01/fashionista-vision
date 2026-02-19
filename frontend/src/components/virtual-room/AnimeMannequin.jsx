import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Procedural anime-style mannequin built from primitives.
 * Accepts a `dressColor` prop to tint the torso region.
 * If a .glb model is available later, this can be replaced with useGLTF.
 */
const AnimeMannequin = ({ dressColor = '#e8a0bf', position = [1.5, -1.4, 0] }) => {
    const groupRef = useRef();

    // Soft idle animation — gentle bob
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    // Skin material
    const skinMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#fce4d6',
                roughness: 0.6,
                metalness: 0.05,
            }),
        []
    );

    // Dress / torso material (dynamic color)
    const dressMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: dressColor,
                roughness: 0.5,
                metalness: 0.05,
            }),
        [dressColor]
    );

    // Hair material
    const hairMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#2c1810',
                roughness: 0.7,
                metalness: 0.05,
            }),
        []
    );

    // Eye material
    const eyeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#3a5f8a',
                roughness: 0.3,
                metalness: 0.1,
            }),
        []
    );

    return (
        <group ref={groupRef} position={position} scale={[1, 1, 1]}>
            {/* ========== HEAD ========== */}
            {/* Main head — slightly elongated sphere for anime style */}
            <mesh position={[0, 2.35, 0]} castShadow material={skinMat}>
                <sphereGeometry args={[0.28, 32, 32]} />
            </mesh>

            {/* Hair — back volume */}
            <mesh position={[0, 2.45, -0.08]} castShadow material={hairMat}>
                <sphereGeometry args={[0.32, 32, 32]} />
            </mesh>

            {/* Hair — fringe/bangs */}
            <mesh position={[0, 2.55, 0.12]} material={hairMat}>
                <boxGeometry args={[0.5, 0.12, 0.15]} />
            </mesh>

            {/* Hair — side strands left */}
            <mesh position={[-0.22, 2.2, 0.02]} material={hairMat}>
                <boxGeometry args={[0.08, 0.4, 0.12]} />
            </mesh>

            {/* Hair — side strands right */}
            <mesh position={[0.22, 2.2, 0.02]} material={hairMat}>
                <boxGeometry args={[0.08, 0.4, 0.12]} />
            </mesh>

            {/* Left eye */}
            <mesh position={[-0.1, 2.38, 0.24]} material={eyeMat}>
                <sphereGeometry args={[0.05, 16, 16]} />
            </mesh>

            {/* Right eye */}
            <mesh position={[0.1, 2.38, 0.24]} material={eyeMat}>
                <sphereGeometry args={[0.05, 16, 16]} />
            </mesh>

            {/* Eye highlights */}
            <mesh position={[-0.08, 2.39, 0.28]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.12, 2.39, 0.28]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Mouth — small smile */}
            <mesh position={[0, 2.28, 0.25]}>
                <boxGeometry args={[0.08, 0.015, 0.02]} />
                <meshStandardMaterial color="#d4827a" roughness={0.5} />
            </mesh>

            {/* ========== NECK ========== */}
            <mesh position={[0, 2.0, 0]} castShadow material={skinMat}>
                <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
            </mesh>

            {/* ========== TORSO (DRESS AREA) ========== */}
            {/* Upper torso */}
            <mesh position={[0, 1.65, 0]} castShadow material={dressMat}>
                <boxGeometry args={[0.55, 0.55, 0.3]} />
            </mesh>

            {/* Lower torso / skirt */}
            <mesh position={[0, 1.1, 0]} castShadow material={dressMat}>
                <cylinderGeometry args={[0.22, 0.4, 0.6, 16]} />
            </mesh>

            {/* Skirt flare */}
            <mesh position={[0, 0.7, 0]} castShadow material={dressMat}>
                <cylinderGeometry args={[0.4, 0.5, 0.3, 16]} />
            </mesh>

            {/* ========== ARMS ========== */}
            {/* Left upper arm */}
            <mesh position={[-0.38, 1.7, 0]} rotation={[0, 0, 0.15]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
            </mesh>

            {/* Left forearm */}
            <mesh position={[-0.45, 1.3, 0.05]} rotation={[0.1, 0, 0.25]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.05, 0.3, 8, 16]} />
            </mesh>

            {/* Right upper arm */}
            <mesh position={[0.38, 1.7, 0]} rotation={[0, 0, -0.15]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
            </mesh>

            {/* Right forearm */}
            <mesh position={[0.45, 1.3, 0.05]} rotation={[0.1, 0, -0.25]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.05, 0.3, 8, 16]} />
            </mesh>

            {/* ========== LEGS ========== */}
            {/* Left leg */}
            <mesh position={[-0.15, 0.2, 0]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
            </mesh>

            {/* Left shoe */}
            <mesh position={[-0.15, -0.12, 0.05]} castShadow>
                <boxGeometry args={[0.12, 0.08, 0.2]} />
                <meshStandardMaterial color="#2c2c2c" roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Right leg */}
            <mesh position={[0.15, 0.2, 0]} castShadow material={skinMat}>
                <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
            </mesh>

            {/* Right shoe */}
            <mesh position={[0.15, -0.12, 0.05]} castShadow>
                <boxGeometry args={[0.12, 0.08, 0.2]} />
                <meshStandardMaterial color="#2c2c2c" roughness={0.4} metalness={0.1} />
            </mesh>
        </group>
    );
};

export default AnimeMannequin;
