import React from 'react';
import { Environment, ContactShadows } from '@react-three/drei';

const SceneEnvironment = () => {
    return (
        <>
            {/* High intensity ambient light to prevent any black areas */}
            <ambientLight intensity={1.0} color="#ffffff" />

            {/* Bright Directional Light from the front */}
            <directionalLight
                position={[0, 5, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            {/* Studio Environment for reflections */}
            <Environment preset="studio" />

            {/* Contact shadows */}
            <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={15}
                blur={2}
                far={4}
            />

            {/* Point lights for specific hotspots */}
            <pointLight position={[5, 5, 5]} intensity={1.0} color="#ffeecc" />
            <pointLight position={[-5, 5, 5]} intensity={1.0} color="#cceeff" />
        </>
    );
};

export default SceneEnvironment;
