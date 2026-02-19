import React, { useMemo } from 'react';
import * as THREE from 'three';

const RoomScene = () => {
    // Create a subtle gradient texture for the floor
    const floorTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Radial gradient — lighter center, darker edges
        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 350);
        gradient.addColorStop(0, '#f8f6f3');
        gradient.addColorStop(0.6, '#eae6e1');
        gradient.addColorStop(1, '#d8d2ca');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Subtle grid lines for visual interest
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 512; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    }, []);

    // Wall texture — subtle vertical stripe pattern
    const wallTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base color
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#faf9f7');
        gradient.addColorStop(1, '#f0eeea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Very subtle vertical stripes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.015)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 512; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }, []);

    return (
        <group>
            {/* Floor */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[14, 14]} />
                <meshStandardMaterial
                    map={floorTexture}
                    roughness={0.8}
                    metalness={0.05}
                />
            </mesh>

            {/* Back wall */}
            <mesh position={[0, 2, -5]} receiveShadow>
                <planeGeometry args={[14, 7]} />
                <meshStandardMaterial
                    map={wallTexture}
                    roughness={0.9}
                    metalness={0}
                />
            </mesh>

            {/* Left wall */}
            <mesh
                position={[-7, 2, 0]}
                rotation={[0, Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[10, 7]} />
                <meshStandardMaterial
                    color="#f5f3f0"
                    roughness={0.9}
                    metalness={0}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Right wall */}
            <mesh
                position={[7, 2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[10, 7]} />
                <meshStandardMaterial
                    color="#f5f3f0"
                    roughness={0.9}
                    metalness={0}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Decorative accent line on back wall */}
            <mesh position={[0, -0.5, -4.98]}>
                <boxGeometry args={[12, 0.02, 0.02]} />
                <meshStandardMaterial color="#c9a96e" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Decorative ceiling trim */}
            <mesh position={[0, 5.49, -4.98]}>
                <boxGeometry args={[14, 0.05, 0.05]} />
                <meshStandardMaterial color="#e0dcd5" roughness={0.5} />
            </mesh>

            {/* Small platform/stage for mannequin */}
            <mesh position={[1.5, -1.45, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[1.2, 1.3, 0.1, 32]} />
                <meshStandardMaterial
                    color="#e8e4de"
                    roughness={0.4}
                    metalness={0.1}
                />
            </mesh>

            {/* Platform ring */}
            <mesh position={[1.5, -1.39, 0]}>
                <torusGeometry args={[1.2, 0.015, 8, 64]} />
                <meshStandardMaterial color="#c9a96e" metalness={0.7} roughness={0.2} />
            </mesh>
        </group>
    );
};

export default RoomScene;
