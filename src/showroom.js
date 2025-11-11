import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { Mob } from './entities/Mob.js';
import { GameConfig } from './core/Config.js';

class Showroom {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentEntity = null;
        this.entityType = 'player';
        this.floor = null;
        this.directionalLight = null;
        
        // Управление камерой
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 10;
        this.cameraHeight = 5;
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.init();
        this.setupControls();
    }

    init() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Камера
        this.camera = new THREE.PerspectiveCamera(
            75,
            (window.innerWidth - 300) / window.innerHeight,
            0.1,
            1000
        );
        // Камера будет обновлена после создания сущности
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Рендерер
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Освещение
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(5, 10, 5);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);

        // Пол
        this.createFloor();

        // Начальная сущность
        this.loadEntity('player');

        // Запуск анимации
        this.animate();

        // Обработка изменения размера
        window.addEventListener('resize', () => {
            this.camera.aspect = (window.innerWidth - 300) / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
        });
    }

    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Сетка
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);
    }

    loadEntity(type) {
        // Удаляем старую сущность
        if (this.currentEntity) {
            this.scene.remove(this.currentEntity.mesh);
        }

        this.entityType = type;

        // Создаем новую сущность
        if (type === 'player') {
            this.currentEntity = new Player();
        } else {
            this.currentEntity = new Mob(type, 1);
            // Сбрасываем целевую позицию для мобов, чтобы они не двигались
            this.currentEntity.targetPlayer = null;
        }

        this.currentEntity.mesh.position.set(0, 0, 0);
        this.scene.add(this.currentEntity.mesh);

        // Обновляем активный элемент в списке
        document.querySelectorAll('.entity-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.entity === type) {
                item.classList.add('active');
            }
        });

        // Сбрасываем вращение камеры при смене сущности
        this.cameraRotation = { x: 0, y: 0 };
        this.updateCameraPosition();
    }

    playDeathAnimation() {
        if (!this.currentEntity || this.entityType === 'player') return;

        // Восстанавливаем сущность если она мертва
        if (this.currentEntity.isDead) {
            this.loadEntity(this.entityType);
        }

        // Запускаем анимацию смерти
        this.currentEntity.die();
    }

    playAttackAnimation() {
        if (!this.currentEntity) return;

        if (this.entityType === 'player') {
            this.currentEntity.playAttackAnimation();
        } else {
            // Для мобов можно добавить анимацию атаки позже
            console.log('Анимация атаки для мобов пока не реализована');
        }
    }

    resetEntity() {
        if (this.currentEntity) {
            this.loadEntity(this.entityType);
        }
    }

    updateCameraPosition() {
        if (!this.currentEntity || !this.currentEntity.mesh) {
            // Если сущности нет, устанавливаем камеру по умолчанию
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            return;
        }
        
        const entityPos = this.currentEntity.mesh.position.clone();
        
        // Вычисляем позицию камеры относительно сущности
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance,
            Math.sin(this.cameraRotation.x) * this.cameraDistance + this.cameraHeight,
            Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance
        );
        
        this.camera.position.copy(entityPos).add(cameraOffset);
        this.camera.lookAt(entityPos);
    }

    setupControls() {
        // Выбор сущности
        document.querySelectorAll('.entity-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadEntity(item.dataset.entity);
                this.updateCameraPosition();
            });
        });

        // Анимации
        document.getElementById('play-death').addEventListener('click', () => {
            this.playDeathAnimation();
        });

        document.getElementById('play-attack').addEventListener('click', () => {
            this.playAttackAnimation();
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.resetEntity();
            this.updateCameraPosition();
        });

        // Текстуры земли
        const floorColorInput = document.getElementById('floor-color');
        floorColorInput.addEventListener('input', (e) => {
            this.floor.material.color.setHex(parseInt(e.target.value.replace('#', ''), 16));
        });

        const floorRoughnessInput = document.getElementById('floor-roughness');
        const roughnessValue = document.getElementById('roughness-value');
        floorRoughnessInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.floor.material.roughness = value;
            roughnessValue.textContent = value.toFixed(1);
        });

        const floorMetalnessInput = document.getElementById('floor-metalness');
        const metalnessValue = document.getElementById('metalness-value');
        floorMetalnessInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.floor.material.metalness = value;
            metalnessValue.textContent = value.toFixed(1);
        });

        // Освещение
        const lightIntensityInput = document.getElementById('light-intensity');
        const intensityValue = document.getElementById('intensity-value');
        lightIntensityInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.directionalLight.intensity = value;
            intensityValue.textContent = value.toFixed(1);
        });

        // Управление камерой мышкой/тачпадом
        const canvas = document.getElementById('canvas');
        
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.cameraRotation.y -= deltaX * 0.002;
                this.cameraRotation.x -= deltaY * 0.002;
                this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotation.x));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.updateCameraPosition();
            }
        });

        // Touch события
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.mouseDown = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchend', () => {
            this.mouseDown = false;
        });

        canvas.addEventListener('touchmove', (e) => {
            if (this.mouseDown && e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.cameraRotation.y -= deltaX * 0.002;
                this.cameraRotation.x -= deltaY * 0.002;
                this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotation.x));
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                
                this.updateCameraPosition();
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // примерное значение

        // Обновление сущности (только анимации, БЕЗ движения)
        if (this.currentEntity) {
            if (this.entityType === 'player') {
                // Для игрока обновляем только анимацию оружия (без движения)
                if (this.currentEntity.attackAnimationTime !== undefined) {
                    if (this.currentEntity.attackAnimationTime > 0 && this.currentEntity.weapon) {
                        this.currentEntity.attackAnimationTime -= deltaTime;
                        const progress = 1 - (this.currentEntity.attackAnimationTime / 0.3);
                        const swing = Math.sin(progress * Math.PI) * 1.5;
                        this.currentEntity.weapon.rotation.z = -0.3 - swing;
                    } else if (this.currentEntity.weapon) {
                        this.currentEntity.weapon.rotation.z = -0.3;
                    }
                }
            } else if (!this.currentEntity.isDead) {
                // Для мобов обновляем только анимацию покачивания и вращения (БЕЗ движения)
                if (this.currentEntity.bobOffset !== undefined && this.currentEntity.baseY !== undefined) {
                    const bobSpeed = this.entityType === 'boss' ? 1 : 2;
                    this.currentEntity.bobOffset += deltaTime * bobSpeed;
                    const bob = Math.sin(this.currentEntity.bobOffset) * (this.entityType === 'boss' ? 0.1 : 0.05);
                    // Обновляем только Y позицию для покачивания
                    this.currentEntity.mesh.position.y = this.currentEntity.baseY + bob;
                }
                
                // Медленное вращение вокруг своей оси
                this.currentEntity.mesh.rotation.y += deltaTime * (this.entityType === 'boss' ? 0.2 : 0.3);
            }
        }

        // Камера полностью статична - обновляется ТОЛЬКО при движении мыши/тачпада
        // lookAt обновляется только при движении мыши в setupControls
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Инициализация шоурума
window.addEventListener('DOMContentLoaded', () => {
    new Showroom();
});

