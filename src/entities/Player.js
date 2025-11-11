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
        this.groundY = 0;
        
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
        
        this.mesh.position.set(0, 0, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Анимация вращения оружия при атаке
        this.attackAnimationTime = 0;
        
        // Создаем HP бар над игроком
        this.createHealthBar();
    }

    createHealthBar() {
        // Фон HP бара
        const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide // Двусторонний
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.y = 2.0;
        this.mesh.add(this.healthBarBg);
        
        // HP бар
        const barGeometry = new THREE.PlaneGeometry(1, 0.1);
        const barMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide // Двусторонний
        });
        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBar.position.y = 2.0;
        this.healthBar.position.z = 0.01;
        this.mesh.add(this.healthBar);
    }

    updateHealthBar() {
        if (this.healthBar && this.healthBarBg) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBar.scale.x = healthPercent;
            this.healthBar.position.x = -(1 - healthPercent) / 2;
            
            // Цвет в зависимости от здоровья
            if (healthPercent > 0.6) {
                this.healthBar.material.color.setHex(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBar.material.color.setHex(0xffff00);
            } else {
                this.healthBar.material.color.setHex(0xff0000);
            }
        }
    }

    takeDamage(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            console.log('Игрок умер!');
        }
        
        this.updateHealthBar();
        
        // Визуальный эффект получения урона
        if (this.mesh) {
            this.mesh.traverse((child) => {
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
        if (this.isDead) return;
        
        // Прыжок
        if (this.keys.space && !this.isJumping && Math.abs(this.mesh.position.y - this.groundY) < 0.1) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpPower;
        }
        
        // Физика прыжка и гравитации
        if (this.isJumping || this.mesh.position.y > this.groundY) {
            this.jumpVelocity += this.gravity * deltaTime;
            this.mesh.position.y += this.jumpVelocity * deltaTime;
            
            if (this.mesh.position.y <= this.groundY) {
                this.mesh.position.y = this.groundY;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }
        
        // Движение
        this.velocity.set(0, 0, 0);
        
        const moveForward = this.keys.w || this.keys.arrowUp;
        const moveBackward = this.keys.s || this.keys.arrowDown;
        const moveLeft = this.keys.a || this.keys.arrowLeft;
        const moveRight = this.keys.d || this.keys.arrowRight;
        
        if (moveForward || moveBackward || moveLeft || moveRight) {
            // Получаем направление движения относительно камеры
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();
            
            if (cameraDirection) {
                forward.copy(cameraDirection);
                forward.y = 0;
                forward.normalize();
                
                right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
                right.normalize();
            } else {
                // Если камера не передана, используем направление по Z
                forward.set(0, 0, -1);
                right.set(1, 0, 0);
            }
            
            if (moveForward) {
                this.velocity.add(forward);
            }
            if (moveBackward) {
                this.velocity.sub(forward);
            }
            if (moveLeft) {
                this.velocity.sub(right);
            }
            if (moveRight) {
                this.velocity.add(right);
            }
            
            // Нормализуем для одинаковой скорости во всех направлениях
            if (this.velocity.lengthSq() > 0) {
                this.velocity.normalize().multiplyScalar(this.moveSpeed);
                this.mesh.position.addScaledVector(this.velocity, deltaTime);
                
                // Вращение игрока в направлении движения
                const lookDirection = this.velocity.clone().normalize();
                this.mesh.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
            }
        }
        
        // Обновляем HP бар, чтобы он всегда смотрел на камеру (billboard)
        if (this.healthBar && this.healthBarBg && camera) {
            const worldPos = new THREE.Vector3();
            this.mesh.getWorldPosition(worldPos);
            worldPos.y += 2.0; // Высота HP бара
            
            // Поворачиваем HP бары к камере
            this.healthBar.lookAt(camera.position);
            this.healthBarBg.lookAt(camera.position);
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

    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }
}

