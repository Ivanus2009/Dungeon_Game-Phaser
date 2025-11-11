import * as THREE from 'three';
import { GameConfig } from '../core/Config.js';

export class Player {
    constructor() {
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = GameConfig.player.expPerLevel;
        this.damage = GameConfig.player.baseDamage;
        this.attackSpeed = GameConfig.player.baseAttackSpeed;
        
        // HP система
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isDead = false;
        this.hitboxRadius = 0.5;
        
        // Управление
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = GameConfig.player.moveSpeed;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            arrowUp: false,
            arrowLeft: false,
            arrowDown: false,
            arrowRight: false
        };
        
        // Прыжок
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -20;
        this.jumpPower = 8;
        this.groundY = 0.5; // Игрок стоит на высоте 0.5 (ноги на земле)
        
        // Отталкивание при получении урона
        this.knockbackVelocity = new THREE.Vector3(0, 0, 0);
        this.knockbackDecay = 8.0; // Затухание отталкивания
        
        // Создание 3D модели игрока
        this.createMesh();
    }

    createMesh() {
        // Создаем группу для игрока (более сложная модель)
        this.mesh = new THREE.Group();
        
        // Тело игрока (цилиндр)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a90e2,
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Голова игрока (сфера)
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            metalness: 0.1,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.25;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Оружие (меч/посох)
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x4a90e2,
            emissiveIntensity: 0.3
        });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.4, 0.8, 0);
        weapon.rotation.z = -0.3;
        weapon.castShadow = true;
        this.mesh.add(weapon);
        this.weapon = weapon;
        
        // Ноги (два цилиндра)
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2a5a8a });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, -0.2, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, -0.2, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        // Сохраняем ссылки на ноги, чтобы исключить их из эффекта урона
        this.leftLeg = leftLeg;
        this.rightLeg = rightLeg;
        
        // Устанавливаем начальную позицию с учетом groundY
        this.mesh.position.set(0, this.groundY, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Анимация вращения оружия при атаке
        this.attackAnimationTime = 0;
        
        // HP бар игрока теперь в UI (HTML), не в 3D
    }

    takeDamage(damage, knockbackDirection = null) {
        if (this.isDead) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            console.log('Игрок умер!');
        }
        
        // Отталкивание от моба
        if (knockbackDirection && knockbackDirection.lengthSq() > 0) {
            knockbackDirection.normalize();
            const knockbackStrength = 9.0; // Сила отталкивания (увеличена в 3 раза)
            this.knockbackVelocity.copy(knockbackDirection).multiplyScalar(knockbackStrength);
        }
        
        // Визуальный эффект получения урона (исключаем ноги)
        if (this.mesh) {
            this.mesh.traverse((child) => {
                // Пропускаем ноги
                if (child === this.leftLeg || child === this.rightLeg) {
                    return;
                }
                
                if (child instanceof THREE.Mesh && child.material) {
                    const originalColor = child.material.color.clone();
                    child.material.color.setHex(0xff0000);
                    setTimeout(() => {
                        if (child.material) {
                            child.material.color.copy(originalColor);
                        }
                    }, 100);
                }
            });
        }
    }

    getDamage() {
        // Урон масштабируется только от уровня
        const baseDamage = GameConfig.player.baseDamage;
        const levelMultiplier = 1 + (this.level - 1) * 0.15; // 15% за уровень
        return Math.floor(baseDamage * levelMultiplier);
    }

    addExp(amount) {
        this.exp += amount;
        
        // Проверка уровня
        while (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level++;
        this.expToNextLevel = Math.floor(
            GameConfig.player.expPerLevel * 
            Math.pow(GameConfig.player.expMultiplier, this.level - 1)
        );
        
        // Урон теперь рассчитывается динамически через getDamage()
        console.log(`Level up! Новый уровень: ${this.level}`);
    }

    // Анимация атаки
    playAttackAnimation() {
        if (this.weapon) {
            this.attackAnimationTime = 0.3; // 0.3 секунды анимации
        }
    }

    update(deltaTime, cameraDirection, camera) {
        if (this.isDead || !this.mesh || deltaTime <= 0) return;
        
        // Обработка отталкивания
        if (this.knockbackVelocity.lengthSq() > 0.01) {
            // Применяем отталкивание (только по горизонтали)
            this.knockbackVelocity.y = 0;
            this.mesh.position.addScaledVector(this.knockbackVelocity, deltaTime);
            
            // Затухание отталкивания
            this.knockbackVelocity.multiplyScalar(1 - this.knockbackDecay * deltaTime);
            if (this.knockbackVelocity.lengthSq() < 0.01) {
                this.knockbackVelocity.set(0, 0, 0);
            }
        }
        
        // Прыжок
        if (this.keys.space && !this.isJumping && Math.abs(this.mesh.position.y - this.groundY) < 0.1) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpPower;
        }
        
        // Физика прыжка и гравитации
        if (this.isJumping || this.mesh.position.y > this.groundY) {
            this.jumpVelocity += this.gravity * deltaTime;
            this.mesh.position.y += this.jumpVelocity * deltaTime;
            
            // Коллизия с землей - не даем игроку погрузиться под землю
            if (this.mesh.position.y <= this.groundY) {
                this.mesh.position.y = this.groundY;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        } else {
            // Если игрок не прыгает, но почему-то ниже земли - поднимаем его
            if (this.mesh.position.y < this.groundY) {
                this.mesh.position.y = this.groundY;
            }
        }
        
        // Движение - переписанная версия
        // Проверяем нажатые клавиши
        const moveForward = this.keys.w;
        const moveBackward = this.keys.s;
        const moveLeft = this.keys.a || this.keys.arrowLeft;
        const moveRight = this.keys.d || this.keys.arrowRight;
        
        // Если есть какое-то движение
        if (moveForward || moveBackward || moveLeft || moveRight) {
            // Вычисляем направление движения
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();
            
            // Используем направление камеры если оно есть
            if (cameraDirection) {
                forward.copy(cameraDirection);
                forward.y = 0;
                
                if (forward.lengthSq() > 0.001) {
                    forward.normalize();
                    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
                    right.normalize();
                } else {
                    // Если направление камеры некорректное, используем дефолтное
                    forward.set(0, 0, -1);
                    right.set(1, 0, 0);
                }
            } else if (camera) {
                // Получаем направление камеры напрямую
                const camDir = new THREE.Vector3();
                camera.getWorldDirection(camDir);
                camDir.y = 0;
                if (camDir.lengthSq() > 0.001) {
                    camDir.normalize();
                    forward.copy(camDir);
                    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
                    right.normalize();
                } else {
                    forward.set(0, 0, -1);
                    right.set(1, 0, 0);
                }
            } else {
                // Запасной вариант - движение по осям мира
                forward.set(0, 0, -1);
                right.set(1, 0, 0);
            }
            
            // Вычисляем вектор движения
            const moveDir = new THREE.Vector3(0, 0, 0);
            if (moveForward) moveDir.add(forward);
            if (moveBackward) moveDir.sub(forward);
            if (moveLeft) moveDir.sub(right);
            if (moveRight) moveDir.add(right);
            
            // Применяем движение
            if (moveDir.lengthSq() > 0.001) {
                moveDir.normalize();
                const moveDistance = this.moveSpeed * deltaTime;
                this.mesh.position.addScaledVector(moveDir, moveDistance);
                
                // Вращение игрока в направлении движения
                this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            }
        }
        
        // Анимация оружия при атаке
        if (this.attackAnimationTime > 0 && this.weapon) {
            this.attackAnimationTime -= deltaTime;
            const progress = 1 - (this.attackAnimationTime / 0.3);
            const swing = Math.sin(progress * Math.PI) * 1.5;
            this.weapon.rotation.z = -0.3 - swing;
        } else if (this.weapon) {
            this.weapon.rotation.z = -0.3;
        }
    }

    setKey(key, pressed) {
        if (key in this.keys) {
            this.keys[key] = pressed;
        }
    }
    
    // Метод для проверки состояния клавиш (для отладки)
    getKeysState() {
        return { ...this.keys };
    }

    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }
}

