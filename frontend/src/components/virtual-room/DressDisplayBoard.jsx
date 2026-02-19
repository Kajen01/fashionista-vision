import React, { useMemo, useRef, Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';

/**
 * Sub-component to handle async texture loading.
 */
const GarmentImage = ({ imageUrl }) => {
    useEffect(() => {
        console.log("Attempting to load texture from:", imageUrl);
    }, [imageUrl]);

    try {
        const texture = useTexture(imageUrl);

        if (texture) {
            console.log("Texture loaded successfully:", imageUrl);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
        }

        return (
            <mesh position={[0, 0.3, 0.1]} receiveShadow={false}>
                <planeGeometry args={[1.4, 1.8]} />
                {/* Using MeshBasicMaterial to ensure it's visible even without light */}
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    side={THREE.DoubleSide}
                />
            </mesh>
        );
    } catch (error) {
        console.error("Critical error in GarmentImage:", imageUrl, error);
        return (
            <mesh position={[0, 0.3, 0.1]}>
                <planeGeometry args={[1.4, 1.8]} />
                <meshBasicMaterial color="#ff0000" />
            </mesh>
        );
    }
};

const DressDisplayBoard = ({
    imageUrl,
    productName = 'Select a Dress',
    position = [-2, 0.5, -1],
}) => {
    const frameRef = useRef();

    useFrame((state) => {
        if (frameRef.current) {
            frameRef.current.position.y =
                position[1] + Math.sin(state.clock.elapsedTime * 0.6 + 1) * 0.02;
        }
    });

    return (
        <group ref={frameRef} position={position}>
            {/* Target object for light alignment help */}
            <object3D position={[0, 0.3, 0]} />

            {/* Display stand base */}
            <mesh position={[0, -1.9, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.45, 0.1, 24]} />
                <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Stand pole */}
            <mesh position={[0, -1, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 1.9, 12]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Frame border — outer */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[1.65, 2.15, 0.08]} />
                <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
            </mesh>

            {/* Frame inner accent */}
            <mesh position={[0, 0.3, 0.05]}>
                <boxGeometry args={[1.5, 2.0, 0.02]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Image surface */}
            <Suspense
                fallback={
                    <mesh position={[0, 0.3, 0.06]}>
                        <planeGeometry args={[1.4, 1.8]} />
                        <meshBasicMaterial color="#cccccc" />
                    </mesh>
                }
            >
                {imageUrl ? (
                    <GarmentImage imageUrl={imageUrl} />
                ) : (
                    <mesh position={[0, 0.3, 0.06]}>
                        <planeGeometry args={[1.4, 1.8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                )}
            </Suspense>

            {/* Product name label */}
            <Text
                position={[0, -0.75, 0.1]}
                fontSize={0.1}
                color="#333333"
                maxWidth={1.4}
                textAlign="center"
                anchorY="top"
            >
                {productName}
            </Text>

            {/* Local Fill Light for the board area */}
            <pointLight position={[0, 1, 2]} intensity={1.5} color="#ffffff" />
        </group>
    );
};

export default DressDisplayBoard;
