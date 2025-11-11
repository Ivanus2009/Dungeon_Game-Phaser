import * as THREE from 'three';
import { GameConfig } from '../core/Config.js';

export class ExpParticle {
    constructor(position, expAmount, scene) {
        this.expAmount = expAmount;
        this.scene = scene;
        this.collected = false;
        this.attracted = false; // Притягивается ли к игроку
        
        // Создаем визуальную частицу (маленькая светящаяся сфера)
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            emissive: 0x4a90e2,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        // Устанавливаем высоту частицы над землей (земля на Y=0, мобы на Y=0.5, частица на Y=1.0)
        this.mesh.position.y = Math.max(position.y, 0) + 0.5;
        this.mesh.castShadow = true;
        
        // Добавляем свечение (point light)
        this.light = new THREE.PointLight(0x4a90e2, 0.5, 2);
        this.light.position.copy(this.mesh.position);
        this.mesh.add(this.light);
        
        // Анимация парения (легкое покачивание вверх-вниз)
        this.floatTime = Math.random() * Math.PI * 2;
        this.floatSpeed = 2.0;
        this.floatAmplitude = 0.1;
        this.startY = this.mesh.position.y;
        this.groundY = 0.5; // Минимальная высота частицы
        
        // Скорость движения к игроку
        this.attractionSpeed = 8.0; // Скорость притягивания к игроку
        
        scene.add(this.mesh);
    }
    
    update(deltaTime, playerPosition, attractionRadius) {
        if (this.collected) return;
        
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        
        // Если игрок в радиусе притягивания - начинаем притягивание
        if (distanceToPlayer <= attractionRadius) {
            this.attracted = true;
        }
        
        // Применяем движение если притягивается
        if (this.attracted) {
            // Вычисляем направление к игроку (включая высоту)
            const directionToPlayer = new THREE.Vector3()
                .subVectors(playerPosition, this.mesh.position);
            
            // Нормализуем и применяем скорость
            if (directionToPlayer.lengthSq() > 0.01) {
                directionToPlayer.normalize();
                const speed = this.attractionSpeed * (1 + (attractionRadius - distanceToPlayer) / attractionRadius);
                this.mesh.position.addScaledVector(directionToPlayer, speed * deltaTime);
            }
            
            // Гарантируем, что частица не упадет под землю
            if (this.mesh.position.y < this.groundY) {
                this.mesh.position.y = this.groundY;
            }
        } else {
            // Анимация парения (только если не притягивается)
            this.floatTime += this.floatSpeed * deltaTime;
            const floatOffset = Math.sin(this.floatTime) * this.floatAmplitude;
            this.mesh.position.y = this.startY + floatOffset;
            // Гарантируем, что частица не упадет под землю
            if (this.mesh.position.y < this.groundY) {
                this.mesh.position.y = this.groundY;
                this.startY = this.groundY;
            }
        }
        
        // Обновляем позицию света
        this.light.position.copy(this.mesh.position);
        
        // Вращение частицы
        this.mesh.rotation.y += deltaTime * 2;
    }
    
    checkCollision(playerPosition, playerHitboxRadius) {
        if (this.collected) return false;
        
        const distance = this.mesh.position.distanceTo(playerPosition);
        return distance < playerHitboxRadius + 0.2; // 0.2 - радиус частицы
    }
    
    collect() {
        if (this.collected) return;
        
        this.collected = true;
        
        // Удаляем из сцены
        if (this.mesh.parent) {
            this.scene.remove(this.mesh);
        }
        
        // Освобождаем ресурсы
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
    
    dispose() {
        this.collect();
    }
}

