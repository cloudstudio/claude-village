/**
 * ParticleSystem - Agent particle effects
 */

import * as THREE from 'three';

/**
 * Particle system for agent visual effects
 */
export class ParticleSystem {
    /**
     * Create a particle system
     * @param {THREE.Scene} scene - The scene to add to
     * @param {number} count - Number of particles
     * @param {number} color - Particle color hex
     * @param {number} size - Particle size (default 0.1)
     */
    constructor(scene, count, color, size = 0.1) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities.push({ x: 0, y: 0, z: 0, life: 0 });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Points(geometry, material);
        this.velocities = velocities;
        this.positions = positions;
        this.active = false;
        this.emitRate = 0;
        this.emitTimer = 0;
        this.basePosition = new THREE.Vector3();
        scene.add(this.mesh);
    }

    /**
     * Emit a single particle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {number} vz - Z velocity
     */
    emit(x, y, z, vx, vy, vz) {
        for (let i = 0; i < this.velocities.length; i++) {
            if (this.velocities[i].life <= 0) {
                this.positions[i * 3] = x + (Math.random() - 0.5) * 0.3;
                this.positions[i * 3 + 1] = y;
                this.positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

                this.velocities[i] = {
                    x: vx + (Math.random() - 0.5) * 0.5,
                    y: vy + Math.random() * 0.5,
                    z: vz + (Math.random() - 0.5) * 0.5,
                    life: 1
                };
                break;
            }
        }
    }

    /**
     * Update particle positions
     * @param {number} dt - Delta time
     */
    update(dt) {
        for (let i = 0; i < this.velocities.length; i++) {
            const v = this.velocities[i];
            if (v.life > 0) {
                this.positions[i * 3] += v.x * dt;
                this.positions[i * 3 + 1] += v.y * dt;
                this.positions[i * 3 + 2] += v.z * dt;
                v.y -= dt * 2;
                v.life -= dt * 1.5;
            } else {
                this.positions[i * 3 + 1] = -100;
            }
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;

        if (this.active && this.emitRate > 0) {
            this.emitTimer += dt;
            while (this.emitTimer > 1 / this.emitRate) {
                this.emitTimer -= 1 / this.emitRate;
                this.emit(this.basePosition.x, this.basePosition.y + 1.8, this.basePosition.z, 0, 2, 0);
            }
        }
    }

    /**
     * Start emitting particles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} rate - Emission rate
     */
    start(x, y, z, rate) {
        this.basePosition.set(x, y, z);
        this.emitRate = rate;
        this.active = true;
    }

    /**
     * Stop emitting particles
     */
    stop() {
        this.active = false;
        this.emitRate = 0;
    }
}
