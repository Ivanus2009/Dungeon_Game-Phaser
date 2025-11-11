import * as THREE from 'three';
import { GameConfig } from './Config.js';
import { Player } from '../entities/Player.js';
import { MobSpawner } from '../systems/MobSpawner.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { ContractSystem } from '../systems/ContractSystem.js';
import { ResourcesSystem } from '../systems/ResourcesSystem.js';
import { AttackEffects } from '../systems/AttackEffects.js';
import { TargetingSystem } from '../systems/TargetingSystem.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.mobs = [];
        this.mobSpawner = null;
        this.combatSystem = null;
        this.contractSystem = null;
        this.resources = null;
        this.attackEffects = null;
        this.targetingSystem = null;
        this.uiManager = null;
        
        // Собственная система времени вместо Three.js Clock
        this.lastFrameTime = 0; // Время последнего кадра в миллисекундах (0 = еще не инициализировано)
        this.startTime = 0; // Время начала игры в миллисекундах (0 = еще не инициализировано)
        this.gameTime = 0; // Время игры в секундах
        this.autoAttack = true; // Автоатака всегда включена
        this.lastAttackTime = 0; // Время последней атаки в секундах
        this.lastPlayerDamageTime = 0; // Время последнего урона игроку в секундах
        this.isPaused = false;
        this.pauseStartTime = 0; // Время начала паузы
        this.totalPauseTime = 0; // Общее время в паузе в миллисекундах
        this.firstFrame = true; // Флаг первого кадра
        
        // Управление камерой
        this.cameraRotation = { x: 0, y: 0 };
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cameraDistance = 15;
        this.cameraHeight = 8;
        this.minCameraDistance = 8;
        this.maxCameraDistance = 25;
        
        // Асинхронная инициализация, чтобы не блокировать поток
        this.initAsync();
    }

    async initAsync() {
        try {
            // Этап 1: Базовая инициализация (синхронная, быстрая)
            this.initBasic();
            
            // Устанавливаем события сразу после базовой инициализации
            // Это нужно, чтобы события работали даже до полной загрузки игры
            this.setupEvents();
            
            // Запускаем игровой цикл СРАЗУ, чтобы не было задержки
            // Он будет работать даже если игра еще не полностью инициализирована
            this.animate();
            
            // Этап 2: Тяжелые операции разбиваем на части (асинхронно)
            await this.initHeavy();
            
            // Этап 3: Финальная настройка
            this.startGame();
        } catch (error) {
            console.error('Error initializing game:', error);
            throw error;
        }
    }

    initBasic() {
        // Инициализация Three.js сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Камера (следует за игроком)
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Рендерер
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            throw new Error('Canvas element not found! Make sure index.html has <canvas id="canvas"></canvas>');
        }
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Освещение
        const ambientLight = new THREE.AmbientLight(
            GameConfig.scene.lighting.ambient,
            0.5
        );
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(
            GameConfig.scene.lighting.directional.color,
            GameConfig.scene.lighting.directional.intensity
        );
        directionalLight.position.set(
            GameConfig.scene.lighting.directional.position.x,
            GameConfig.scene.lighting.directional.position.y,
            GameConfig.scene.lighting.directional.position.z
        );
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    async initHeavy() {
        // Разбиваем тяжелые операции на части, чтобы не блокировать поток
        
        // Пол с сеткой (может быть тяжелым для больших размеров)
        return new Promise((resolve) => {
            // Используем requestIdleCallback или setTimeout для разбивки
            const initStep = () => {
                // Пол
                const floorGeometry = new THREE.PlaneGeometry(
                    GameConfig.scene.floor.size,
                    GameConfig.scene.floor.size
                );
                const floorMaterial = new THREE.MeshStandardMaterial({
                    color: GameConfig.scene.floor.color,
                    roughness: 0.8,
                    metalness: 0.2
                });
                const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                this.scene.add(floor);

                // Сетка на полу для визуализации (может быть тяжелой)
                setTimeout(() => {
                    const gridHelper = new THREE.GridHelper(
                        GameConfig.scene.floor.size,
                        20,
                        0x444444,
                        0x222222
                    );
                    this.scene.add(gridHelper);
                    
                    // Игрок
                    this.player = new Player();
                    this.scene.add(this.player.mesh);

                    // Системы
                    this.resources = new ResourcesSystem();
                    this.targetingSystem = new TargetingSystem();
                    this.attackEffects = new AttackEffects(this.scene, this);
                    this.combatSystem = new CombatSystem(this);
                    this.contractSystem = new ContractSystem(this);
                    this.mobSpawner = new MobSpawner(this);
                    this.uiManager = new UIManager(this);

                    // Инициализация камеры после создания игрока
                    if (this.player && this.player.mesh) {
                        this.updateCameraPosition();
                    } else {
                        this.camera.position.set(0, 8, 15);
                        this.camera.lookAt(0, 0, 0);
                    }
                    
                    resolve();
                }, 0);
            };
            
            // Используем requestIdleCallback если доступен, иначе setTimeout
            if (window.requestIdleCallback) {
                requestIdleCallback(initStep, { timeout: 100 });
            } else {
                setTimeout(initStep, 0);
            }
        });
    }

    startGame() {
        console.log('Game initialized successfully');
        if (this.player && this.player.mesh) {
            console.log('Player position:', this.player.mesh.position);
        }
        console.log('Camera position:', this.camera.position);
        console.log('Scene children:', this.scene.children.length);
    }

    setupEvents() {
        // Получаем canvas один раз
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.error('Canvas element not found for event setup');
            return;
        }
        
        // Меню паузы по Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
                e.preventDefault();
            } else {
                // Управление игроком (обрабатываем всегда, но внутри handleKeyDown проверяем isPaused)
                this.handleKeyDown(e);
            }
        });

        window.addEventListener('keyup', (e) => {
            // Управление игроком (обрабатываем всегда, но внутри handleKeyUp проверяем isPaused)
            this.handleKeyUp(e);
        });
        
        // Предотвращаем контекстное меню по правой кнопке мыши на canvas
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Управление камерой мышкой
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown && !this.isPaused) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.cameraRotation.y -= deltaX * GameConfig.player.cameraRotationSpeed;
                this.cameraRotation.x -= deltaY * GameConfig.player.cameraRotationSpeed;
                this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotation.x));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        // Touch события для мобильных
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
            if (this.mouseDown && !this.isPaused && e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.cameraRotation.y -= deltaX * GameConfig.player.cameraRotationSpeed;
                this.cameraRotation.x -= deltaY * GameConfig.player.cameraRotationSpeed;
                this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotation.x));
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        });

        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Зум камеры колесиком мыши
        canvas.addEventListener('wheel', (e) => {
            if (this.isPaused) return;
            e.preventDefault();
            const zoomSpeed = 1.0;
            this.cameraDistance += e.deltaY * 0.01 * zoomSpeed;
            this.cameraDistance = Math.max(this.minCameraDistance, Math.min(this.maxCameraDistance, this.cameraDistance));
        });
    }

    handleKeyDown(e) {
        // Не обрабатываем клавиши, если игра на паузе (кроме Escape, который обрабатывается отдельно)
        if (this.isPaused) return;
        
        // Проверяем, что игрок инициализирован
        if (!this.player || !this.player.setKey) return;
        
        const key = e.key.toLowerCase();
        if (key === 'w') this.player.setKey('w', true);
        if (key === 'a') this.player.setKey('a', true);
        if (key === 's') this.player.setKey('s', true);
        if (key === 'd') this.player.setKey('d', true);
        if (e.key === ' ') {
            this.player.setKey('space', true);
            e.preventDefault(); // Предотвращаем прокрутку страницы
        }
        
        if (e.key === 'ArrowUp') this.player.setKey('arrowUp', true);
        if (e.key === 'ArrowLeft') this.player.setKey('arrowLeft', true);
        if (e.key === 'ArrowDown') this.player.setKey('arrowDown', true);
        if (e.key === 'ArrowRight') this.player.setKey('arrowRight', true);
    }

    handleKeyUp(e) {
        // Не обрабатываем клавиши, если игра на паузе
        if (this.isPaused) return;
        
        // Проверяем, что игрок инициализирован
        if (!this.player || !this.player.setKey) return;
        
        const key = e.key.toLowerCase();
        if (key === 'w') this.player.setKey('w', false);
        if (key === 'a') this.player.setKey('a', false);
        if (key === 's') this.player.setKey('s', false);
        if (key === 'd') this.player.setKey('d', false);
        if (e.key === ' ') this.player.setKey('space', false);
        
        if (e.key === 'ArrowUp') this.player.setKey('arrowUp', false);
        if (e.key === 'ArrowLeft') this.player.setKey('arrowLeft', false);
        if (e.key === 'ArrowDown') this.player.setKey('arrowDown', false);
        if (e.key === 'ArrowRight') this.player.setKey('arrowRight', false);
    }

    updateCameraPosition() {
        if (!this.player || !this.player.mesh || !this.camera) return;
        
        const playerPos = this.player.mesh.position;
        
        // Вычисляем позицию камеры относительно игрока
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance,
            Math.sin(this.cameraRotation.x) * this.cameraDistance + this.cameraHeight,
            Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance
        );
        
        this.camera.position.copy(playerPos).add(cameraOffset);
        this.camera.lookAt(playerPos);
    }

    getCameraDirection() {
        // Возвращает направление камеры (куда она смотрит)
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.uiManager) {
            this.uiManager.togglePauseMenu(this.isPaused);
        }
        
        if (this.isPaused) {
            // Начинаем паузу - запоминаем время начала паузы
            this.pauseStartTime = performance.now();
        } else {
            // Возобновление - добавляем время паузы к общему времени паузы
            if (this.pauseStartTime > 0) {
                this.totalPauseTime += performance.now() - this.pauseStartTime;
            }
            // Сбрасываем lastFrameTime, чтобы избежать большого deltaTime при возобновлении
            this.lastFrameTime = performance.now();
            this.pauseStartTime = 0;
        }
    }

    getElapsedTime() {
        // Возвращает время с момента начала игры в секундах (без учета паузы)
        // Если startTime еще не инициализирован, возвращаем 0
        if (this.startTime === 0) {
            return 0;
        }
        
        let pauseTime = this.totalPauseTime;
        // Если сейчас на паузе, добавляем текущее время паузы
        if (this.isPaused && this.pauseStartTime > 0) {
            pauseTime += performance.now() - this.pauseStartTime;
        }
        const elapsed = (performance.now() - this.startTime - pauseTime) / 1000.0;
        // Защита от отрицательных значений
        return Math.max(0, elapsed);
    }

    attackTarget(targetMob) {
        if (!targetMob || targetMob.isDead || this.isPaused) return;

        const damage = this.player.getDamage();
        const playerPos = this.player.mesh.position.clone();
        playerPos.y += 1; // Позиция оружия игрока
        
        // Вычисляем целевую точку с учетом предсказания движения
        const aimPoint = this.targetingSystem.calculateAimPoint(
            targetMob,
            playerPos,
            GameConfig.scene.projectile.speed
        );
        
        if (!aimPoint) return;
        
        // Создаем снаряд, который полетит к предсказанной точке
        this.attackEffects.createAttackProjectile(playerPos, aimPoint, damage, 0x4a90e2);
        
        // Анимация атаки игрока
        this.player.playAttackAnimation();
        
        // Урон наносится при попадании снаряда, а не сразу
    }

    showDamageNumber(position, damage) {
        // Визуальный эффект урона с анимацией
        const damageText = document.createElement('div');
        damageText.textContent = `-${damage}`;
        damageText.style.position = 'fixed';
        damageText.style.color = damage > 50 ? '#ff0000' : '#ff4444';
        damageText.style.fontSize = damage > 50 ? '28px' : '24px';
        damageText.style.fontWeight = 'bold';
        damageText.style.pointerEvents = 'none';
        damageText.style.zIndex = '1000';
        damageText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        damageText.style.opacity = '1';
        damageText.style.transition = 'none';
        
        const screenPos = this.worldToScreen(position);
        // Добавляем случайное смещение для разнообразия
        const offsetX = (Math.random() - 0.5) * 30;
        damageText.style.left = (screenPos.x + offsetX) + 'px';
        damageText.style.top = screenPos.y + 'px';
        
        document.body.appendChild(damageText);
        
        // Анимация появления и исчезновения (используем setTimeout вместо requestAnimationFrame)
        // Небольшая задержка для правильного применения стилей
        setTimeout(() => {
            damageText.style.transform = 'translateY(-50px) scale(1.2)';
            damageText.style.transition = 'all 0.5s ease-out';
            damageText.style.opacity = '0';
            
            setTimeout(() => {
                damageText.remove();
            }, 500);
        }, 0);
    }

    worldToScreen(position) {
        const vector = position.clone();
        vector.project(this.camera);
        
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = -(vector.y - 1) / 2 * window.innerHeight;
        
        return { x, y };
    }

    update(deltaTime) {
        try {
            // Проверяем, что игра полностью инициализирована
            if (!this.scene || !this.camera || !this.renderer) {
                return;
            }
            
            // Обновляем UI всегда (даже в паузе)
            if (this.uiManager) {
                try {
                    this.uiManager.update();
                } catch (error) {
                    console.error('Error updating UI:', error);
                }
            }
            
            if (this.isPaused) {
                // В паузе не обновляем игру, но сцена должна продолжать рендериться
                // (рендеринг происходит в animate() после update())
                return;
            }

            // Проверяем наличие игрока и других компонентов перед обновлением
            if (!this.player || !this.mobSpawner || !this.combatSystem || 
                !this.attackEffects || !this.targetingSystem) {
                return;
            }

            // Обновляем время игры (только когда не на паузе)
            this.gameTime += deltaTime;

            // Обновление камеры
            try {
                this.updateCameraPosition();
            } catch (error) {
                console.error('Error updating camera:', error);
            }

            // Обновление игрока (с направлением камеры и камерой для billboard)
            if (this.player && this.player.update) {
                try {
                    const cameraDirection = this.getCameraDirection();
                    this.player.update(deltaTime, cameraDirection, this.camera);

                    // Ограничиваем позицию игрока границами карты
                    const mapSize = GameConfig.scene.floor.size / 2 - 2;
                    this.player.mesh.position.x = Math.max(-mapSize, Math.min(mapSize, this.player.mesh.position.x));
                    this.player.mesh.position.z = Math.max(-mapSize, Math.min(mapSize, this.player.mesh.position.z));
                } catch (error) {
                    console.error('Error updating player:', error);
                }
            }

            // Спавн мобов
            if (this.mobSpawner && this.mobSpawner.update) {
                try {
                    this.mobSpawner.update(deltaTime);
                } catch (error) {
                    console.error('Error updating mob spawner:', error);
                }
            }

            // Обновление мобов (движение к игроку)
            if (this.player && this.player.mesh) {
                try {
                    const playerPos = this.player.mesh.position;
                    this.mobs.forEach(mob => {
                        if (!mob.isDead && mob.update) {
                            try {
                                mob.update(deltaTime, playerPos, this.camera);
                                
                                // Проверка столкновения хитбоксов игрока и моба
                                this.checkPlayerMobCollision(mob);
                            } catch (error) {
                                console.error('Error updating mob:', error);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error updating mobs:', error);
                }

                // Автоатака (всегда включена)
                if (this.startTime > 0) {
                    try {
                        const attackSpeed = GameConfig.player.baseAttackSpeed;
                        const attackInterval = 1 / attackSpeed;
                        const currentTime = this.getElapsedTime();
                        
                        if (currentTime - this.lastAttackTime >= attackInterval) {
                            // Выбираем цель с помощью системы прицеливания
                            if (this.targetingSystem && this.targetingSystem.selectTarget) {
                                const playerPos = this.player.mesh.position;
                                const targetMob = this.targetingSystem.selectTarget(this.mobs, playerPos);
                                
                                if (targetMob) {
                                    this.attackTarget(targetMob);
                                    this.lastAttackTime = currentTime;
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error in auto attack:', error);
                    }
                }
            }

            // Обновление эффектов атаки (включая снаряды)
            if (this.attackEffects && this.attackEffects.update) {
                try {
                    this.attackEffects.update(deltaTime);
                } catch (error) {
                    console.error('Error updating attack effects:', error);
                }
            }
        } catch (error) {
            console.error('Error in update():', error);
            console.error('Stack:', error.stack);
            // Продолжаем выполнение даже при ошибке
        }
    }

    getFormattedTime() {
        const hours = Math.floor(this.gameTime / 3600);
        const minutes = Math.floor((this.gameTime % 3600) / 60);
        const seconds = Math.floor(this.gameTime % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    animate() {
        // Запланировать следующий кадр ПЕРЕД выполнением текущего кадра
        // Это гарантирует, что цикл будет продолжаться даже при ошибках
        requestAnimationFrame(() => this.animate());
        
        try {
            const currentTime = performance.now();
            let deltaTime = 0;
            
            // Инициализируем startTime и lastFrameTime при первом вызове
            if (this.startTime === 0) {
                this.startTime = currentTime;
                this.lastFrameTime = currentTime;
                this.firstFrame = true;
                deltaTime = 0;
            } else if (!this.isPaused) {
                // Вычисляем deltaTime только когда игра не на паузе и уже инициализирована
                if (this.firstFrame) {
                    // Первый кадр после инициализации - deltaTime = 0
                    this.lastFrameTime = currentTime;
                    deltaTime = 0;
                    this.firstFrame = false;
                } else {
                    // Вычисляем deltaTime в секундах
                    deltaTime = (currentTime - this.lastFrameTime) / 1000.0;
                    
                    // Ограничиваем deltaTime, чтобы избежать больших скачков
                    // Это защита от паузы, больших задержек или первого кадра
                    if (deltaTime > 0.1) {
                        deltaTime = 0.1; // Максимум 100мс за кадр
                    }
                    
                    // Защита от отрицательных значений
                    if (deltaTime < 0) {
                        deltaTime = 0;
                    }
                    
                    // Обновляем время последнего кадра
                    this.lastFrameTime = currentTime;
                }
            } else {
                // На паузе не обновляем lastFrameTime и deltaTime = 0
                // Это позволяет корректно возобновить игру после паузы
                deltaTime = 0;
            }
            
            // Всегда обновляем игру (внутри update() проверяется isPaused)
            this.update(deltaTime);
            
            // ВСЕГДА рендерим сцену, даже в паузе (чтобы игра была видна)
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Error in game loop:', error);
            console.error('Stack:', error.stack);
            // Продолжаем выполнение даже при ошибке, чтобы игра не останавливалась
        }
    }

    removeMob(mob) {
        const index = this.mobs.indexOf(mob);
        if (index > -1) {
            this.mobs.splice(index, 1);
            this.scene.remove(mob.mesh);
        }
    }

    checkPlayerMobCollision(mob) {
        if (!this.player || !mob || mob.isDead || this.player.isDead) return;
        
        const playerPos = this.player.mesh.position.clone();
        const mobPos = mob.mesh.position.clone();
        
        // Учитываем высоту для проверки столкновения
        playerPos.y = 0;
        mobPos.y = 0;
        
        const distance = playerPos.distanceTo(mobPos);
        const playerHitboxRadius = this.player.hitboxRadius || 0.5;
        const mobHitboxRadius = mob.hitboxRadius;
        
        // Проверяем пересечение хитбоксов
        if (distance < playerHitboxRadius + mobHitboxRadius) {
            // Игрок получает урон от моба
            // Урон скейлится со временем игры
            const baseDamage = 5; // Базовый урон
            const timeMultiplier = 1 + (this.gameTime / 60); // Увеличивается каждую минуту на 1
            const damage = Math.floor(baseDamage * timeMultiplier);
            
            // Наносим урон игроку (с защитой от спама)
            const now = this.getElapsedTime();
            if (!this.lastPlayerDamageTime || now - this.lastPlayerDamageTime >= 0.5) {
                this.player.takeDamage(damage);
                this.lastPlayerDamageTime = now;
            }
        }
    }
}
