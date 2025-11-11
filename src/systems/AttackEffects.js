import * as THREE from 'three';
import { GameConfig } from '../core/Config.js';

export class AttackEffects {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.effects = [];
        this.projectiles = []; // отслеживаем активные снаряды
    }

    createAttackProjectile(from, targetPoint, damage, color = 0x4a90e2) {
        // Создаем проектиль от игрока к предсказанной точке
        const direction = new THREE.Vector3().subVectors(targetPoint, from).normalize();
        const distance = from.distanceTo(targetPoint);
        
        // Геометрия проектиля (светящаяся сфера)
        const geometry = new THREE.SphereGeometry(GameConfig.scene.projectile.radius, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9
        });
        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.copy(from);
        
        // Направление полета
        const velocity = direction.clone().multiplyScalar(GameConfig.scene.projectile.speed);
        
        // Добавляем след
        const trailGeometry = new THREE.CylinderGeometry(0.03, 0.08, 0.2, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2;
        projectile.add(trail);
        
        this.scene.add(projectile);
        
        // Данные снаряда
        const projectileData = {
            object: projectile,
            velocity: velocity,
            startPosition: from.clone(),
            damage: damage,
            color: color,
            distance: 0,
            hit: false
        };
        
        this.projectiles.push(projectileData);
        this.effects.push({ 
            object: projectile, 
            animate: (deltaTime) => this.updateProjectile(projectileData, deltaTime)
        });
    }

    updateProjectile(projectileData, deltaTime) {
        if (projectileData.hit) {
            return false; // Снаряд уже попал
        }

        const projectile = projectileData.object;
        
        // Движение снаряда
        projectile.position.addScaledVector(projectileData.velocity, deltaTime);
        projectileData.distance += projectileData.velocity.length() * deltaTime;

        // Вращение снаряда
        projectile.rotation.y += deltaTime * 10;
        projectile.rotation.x += deltaTime * 5;

        // Проверка максимального расстояния
        if (projectileData.distance > GameConfig.scene.projectile.maxDistance) {
            // Снаряд улетел слишком далеко - удаляем
            this.scene.remove(projectile);
            const index = this.projectiles.indexOf(projectileData);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
            return false;
        }

        // Проверка столкновений с мобами
        const hitMob = this.checkCollisions(projectile.position, GameConfig.scene.projectile.radius);
        
        if (hitMob) {
            // Попадание!
            projectileData.hit = true;
            this.createHitEffect(projectile.position, projectileData.damage, projectileData.color);
            
            // Наносим урон мобу
            this.game.combatSystem.dealDamage(hitMob, projectileData.damage);
            
            // Показываем число урона
            this.game.showDamageNumber(hitMob.mesh.position, projectileData.damage);
            
            // Удаляем снаряд
            this.scene.remove(projectile);
            const index = this.projectiles.indexOf(projectileData);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
            return false;
        }

        return true; // Продолжаем движение
    }

    checkCollisions(projectilePos, projectileRadius) {
        // Проверяем столкновения со всеми мобами
        for (const mob of this.game.mobs) {
            if (mob.isDead) continue;

            const mobPos = mob.mesh.position.clone();
            mobPos.y += 0.5; // центр моба
            const distance = projectilePos.distanceTo(mobPos);
            const hitboxRadius = mob.hitboxRadius;

            // Проверяем пересечение сфер (снаряд и хитбокс моба)
            if (distance < projectileRadius + hitboxRadius) {
                return mob;
            }
        }

        return null;
    }

    createHitEffect(position, damage, color = 0xff4444) {
        // Эффект взрыва при попадании
        const particles = 8;
        for (let i = 0; i < particles; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            this.scene.add(particle);
            
            // Случайное направление
            const angle = (Math.PI * 2 * i) / particles;
            const speed = 2 + Math.random() * 2;
            const direction = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 2,
                Math.sin(angle) * speed
            );
            
            const duration = 0.3;
            let progress = 0;
            
            const animate = (deltaTime) => {
                progress += deltaTime / duration;
                
                if (progress < 1) {
                    particle.position.addScaledVector(direction, deltaTime);
                    particle.material.opacity = 1 - progress;
                    particle.scale.setScalar(1 - progress * 0.5);
                    return true;
                } else {
                    this.scene.remove(particle);
                    return false;
                }
            };
            
            this.effects.push({ object: particle, animate });
        }
    }

    update(deltaTime) {
        // Обновляем все эффекты
        this.effects = this.effects.filter(effect => {
            return effect.animate(deltaTime);
        });
    }

    clear() {
        // Удаляем все эффекты
        this.effects.forEach(effect => {
            this.scene.remove(effect.object);
        });
        this.effects = [];
        this.projectiles = [];
    }
}
