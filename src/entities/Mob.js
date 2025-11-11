import * as THREE from 'three';
import { GameConfig } from '../core/Config.js';

export class Mob {
    constructor(type, level = 1, gameTime = 0) {
        this.type = type;
        this.level = level;
        this.mobData = GameConfig.mobs.types.find(t => t.id === type);
        
        if (!this.mobData) {
            throw new Error(`Unknown mob type: ${type}`);
        }

        // Базовое здоровье с учетом уровня
        const baseHealth = this.mobData.health * Math.pow(GameConfig.mobs.healthMultiplier, level - 1);
        
        // Мультипликатор HP в зависимости от времени игры
        // Формула: 1 + (время игры в секундах * масштаб)
        // Например, через 100 секунд: 1 + (100 * 0.02) = 3.0 (HP увеличится в 3 раза)
        const timeMultiplier = GameConfig.mobs.healthTimeMultiplier + (gameTime * GameConfig.mobs.healthTimeScale);
        
        this.maxHealth = Math.floor(baseHealth * timeMultiplier);
        this.health = this.maxHealth;
        this.isDead = false;
        this.reward = {
            gold: this.mobData.reward.gold * level,
            exp: this.mobData.reward.exp * level
        };

        // Скорость и движение
        this.speed = this.mobData.speed;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.lastPosition = new THREE.Vector3();
        this.hitboxRadius = this.mobData.hitboxRadius;
        this.targetPlayer = null; // будет установлен извне
        
        // Анимация смерти
        this.deathAnimationProgress = 0;
        this.deathAnimationDuration = 0.5; // секунды
        this.deathStartY = 0;

        // Создание 3D модели моба
        this.createMesh();
        
        // Позиция на сцене
        this.setRandomPosition();
        this.lastPosition.copy(this.mesh.position);
    }

    createMesh() {
        this.mesh = new THREE.Group();
        const baseSize = this.type === 'boss' ? 1.5 : (this.type === 'orc' ? 1.2 : 1);
        
        if (this.type === 'slime') {
            this.createSlimeMesh(baseSize);
        } else if (this.type === 'goblin') {
            this.createGoblinMesh(baseSize);
        } else if (this.type === 'orc') {
            this.createOrcMesh(baseSize);
        } else if (this.type === 'boss') {
            this.createBossMesh(baseSize);
        }
        
        this.baseY = baseSize / 2;
        this.mesh.position.y = this.baseY;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.bobOffset = 0;
        
        // HP бары у мобов убраны
    }

    createSlimeMesh(size) {
        // Слайм - большая капля
        const bodyGeometry = new THREE.SphereGeometry(size * 0.6, 8, 8);
        bodyGeometry.scale(1, 0.7, 1); // Сплющиваем снизу
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00aa00,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.3;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Глаза
        const eyeGeometry = new THREE.SphereGeometry(size * 0.1, 6, 6);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-size * 0.2, size * 0.4, size * 0.4);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(size * 0.2, size * 0.4, size * 0.4);
        this.mesh.add(rightEye);
        
        // Зрачки
        const pupilGeometry = new THREE.SphereGeometry(size * 0.05, 4, 4);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-size * 0.2, size * 0.4, size * 0.45);
        this.mesh.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(size * 0.2, size * 0.4, size * 0.45);
        this.mesh.add(rightPupil);
    }

    createGoblinMesh(size) {
        // Гоблин - маленький человечек
        // Тело
        const bodyGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.25, size * 0.6, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            metalness: 0.1,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.3;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Голова
        const headGeometry = new THREE.SphereGeometry(size * 0.25, 6, 6);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b6914,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = size * 0.7;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Уши
        const earGeometry = new THREE.ConeGeometry(size * 0.1, size * 0.2, 4);
        const earMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-size * 0.3, size * 0.75, 0);
        leftEar.rotation.z = -0.5;
        this.mesh.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(size * 0.3, size * 0.75, 0);
        rightEar.rotation.z = 0.5;
        this.mesh.add(rightEar);
    }

    createOrcMesh(size) {
        // Орк - большой и сильный
        // Тело
        const bodyGeometry = new THREE.CylinderGeometry(size * 0.4, size * 0.35, size * 0.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            metalness: 0.2,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.4;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Голова
        const headGeometry = new THREE.SphereGeometry(size * 0.35, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = size * 0.9;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Клыки
        const tuskGeometry = new THREE.ConeGeometry(size * 0.08, size * 0.15, 4);
        const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        leftTusk.position.set(-size * 0.2, size * 0.85, size * 0.3);
        leftTusk.rotation.x = Math.PI;
        this.mesh.add(leftTusk);
        
        const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        rightTusk.position.set(size * 0.2, size * 0.85, size * 0.3);
        rightTusk.rotation.x = Math.PI;
        this.mesh.add(rightTusk);
        
        // Топор
        const axeHandleGeometry = new THREE.CylinderGeometry(size * 0.05, size * 0.05, size * 0.6, 6);
        const axeHandleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const axeHandle = new THREE.Mesh(axeHandleGeometry, axeHandleMaterial);
        axeHandle.position.set(size * 0.5, size * 0.5, 0);
        axeHandle.rotation.z = -0.3;
        this.mesh.add(axeHandle);
        
        const axeHeadGeometry = new THREE.BoxGeometry(size * 0.2, size * 0.15, size * 0.05);
        const axeHeadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.8
        });
        const axeHead = new THREE.Mesh(axeHeadGeometry, axeHeadMaterial);
        axeHead.position.set(size * 0.6, size * 0.7, 0);
        this.mesh.add(axeHead);
    }

    createBossMesh(size) {
        // Босс - огромный и страшный
        // Тело
        const bodyGeometry = new THREE.CylinderGeometry(size * 0.5, size * 0.45, size, 10);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.2,
            metalness: 0.3,
            roughness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.5;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Голова
        const headGeometry = new THREE.SphereGeometry(size * 0.45, 10, 10);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x660000,
            emissive: 0xff4444,
            emissiveIntensity: 0.3,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = size * 1.1;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Рога
        const hornGeometry = new THREE.ConeGeometry(size * 0.15, size * 0.4, 6);
        const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-size * 0.3, size * 1.35, 0);
        leftHorn.rotation.z = -0.3;
        this.mesh.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(size * 0.3, size * 1.35, 0);
        rightHorn.rotation.z = 0.3;
        this.mesh.add(rightHorn);
        
        // Глаза (светящиеся)
        const eyeGeometry = new THREE.SphereGeometry(size * 0.12, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-size * 0.2, size * 1.15, size * 0.35);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(size * 0.2, size * 1.15, size * 0.35);
        this.mesh.add(rightEye);
    }


    setRandomPosition() {
        const range = GameConfig.scene.floor.size / 2 - 5;
        const x = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        this.mesh.position.set(x, this.baseY, z);
        this.lastPosition.copy(this.mesh.position);
    }

    setTarget(playerPosition) {
        this.targetPlayer = playerPosition;
    }

    getVelocity() {
        // Возвращает текущую скорость моба
        return this.velocity.clone();
    }

    getPredictedPosition(timeAhead) {
        // Предсказывает позицию моба через timeAhead секунд
        if (!this.targetPlayer) {
            return this.mesh.position.clone();
        }
        
        const predictedPos = this.mesh.position.clone();
        const direction = new THREE.Vector3().subVectors(this.targetPlayer, this.mesh.position);
        direction.y = 0; // движение только по горизонтали
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            const moveDistance = this.speed * timeAhead;
            predictedPos.addScaledVector(direction, moveDistance);
        }
        
        return predictedPos;
    }

    moveTowards(target, deltaTime) {
        if (!target || this.isDead) return;
        
        const direction = new THREE.Vector3().subVectors(target, this.mesh.position);
        direction.y = 0; // движение только по горизонтали
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            const moveDistance = this.speed * deltaTime;
            this.velocity.copy(direction).multiplyScalar(this.speed);
            
            // Обновляем только X и Z координаты
            this.mesh.position.x += direction.x * moveDistance;
            this.mesh.position.z += direction.z * moveDistance;
        } else {
            this.velocity.set(0, 0, 0);
        }
    }

    takeDamage(damage) {
        if (this.isDead) return;

        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        // Визуальный эффект получения урона (мигание)
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material && child.material.emissiveIntensity !== undefined) {
                const originalIntensity = child.material.emissiveIntensity || 0.2;
                child.material.emissiveIntensity = Math.min(originalIntensity * 2.5, 1);
                setTimeout(() => {
                    if (child.material) {
                        child.material.emissiveIntensity = originalIntensity;
                    }
                }, 100);
            }
        });
    }


    die() {
        this.isDead = true;
        // Включаем прозрачность для всех материалов
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                child.material.transparent = true;
                if (!child.material.opacity) {
                    child.material.opacity = 1;
                }
            }
        });
        
        // Начинаем анимацию смерти
        this.deathAnimationProgress = 0;
        this.deathStartY = this.mesh.position.y;
    }

    update(deltaTime, playerPosition, camera) {
        if (this.isDead) {
            // Для мертвых мобов обновляем анимацию смерти
            this.deathAnimationProgress += deltaTime;
            const progress = Math.min(this.deathAnimationProgress / this.deathAnimationDuration, 1);
            
            // Плавное исчезновение
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.opacity = 1 - progress;
                }
            });
            
            // Падение вниз
            this.mesh.position.y = this.deathStartY - progress * 1.5;
            
            // Уменьшение размера
            const scale = 1 - progress * 0.3;
            this.mesh.scale.set(scale, scale, scale);
            
            return;
        }
        
        // Обновляем последнюю позицию для расчета скорости
        this.lastPosition.copy(this.mesh.position);
        
        // Движение к игроку
        if (playerPosition) {
            this.setTarget(playerPosition);
            this.moveTowards(playerPosition, deltaTime);
        }
        
        // Анимация покачивания (применяем к Y после движения)
        const bobSpeed = this.type === 'boss' ? 1 : 2;
        this.bobOffset += deltaTime * bobSpeed;
        const bob = Math.sin(this.bobOffset) * (this.type === 'boss' ? 0.1 : 0.05);
        this.mesh.position.y = this.baseY + bob;
        
        // Вращение моба в направлении движения
        if (this.velocity.lengthSq() > 0.01) {
            const lookDirection = this.velocity.clone().normalize();
            this.mesh.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
        } else {
            // Если не движемся, медленно вращаемся
            this.mesh.rotation.y += deltaTime * (this.type === 'boss' ? 0.2 : 0.3);
        }
        
        // HP бары у мобов убраны
    }

    getReward() {
        return { ...this.reward };
    }
}

