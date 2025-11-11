// Конфигурация игры
export const GameConfig = {
    // Настройки игрока
    player: {
        baseDamage: 10,
        baseAttackSpeed: 0.5, // атак в секунду (уменьшено в 2 раза)
        baseExp: 0,
        expPerLevel: 100,
        expMultiplier: 1.5, // множитель опыта для следующего уровня
        moveSpeed: 5.0, // скорость движения
        cameraRotationSpeed: 0.002, // скорость вращения камеры
    },

    // Настройки мобов
    mobs: {
        baseSpawnRate: 2000, // базовый интервал между спавнами (мс)
        spawnRateIncrease: 50, // уменьшение интервала за секунду игры (мс/сек)
        minSpawnRate: 500, // минимальный интервал спавна (мс)
        baseHealth: 50,
        healthMultiplier: 1.2, // увеличение здоровья за уровень
        baseReward: {
            gold: 10,
            exp: 5
        },
        types: [
            {
                id: 'slime',
                name: 'Слайм',
                health: 30,
                reward: { gold: 5, exp: 3 },
                spawnWeight: 50, // вес для рандома (чем больше, тем чаще)
                color: 0x00ff00,
                speed: 2.0, // скорость движения
                hitboxRadius: 0.5 // радиус хитбокса
            },
            {
                id: 'goblin',
                name: 'Гоблин',
                health: 60,
                reward: { gold: 15, exp: 8 },
                spawnWeight: 30,
                color: 0x808080,
                speed: 3.0,
                hitboxRadius: 0.6
            },
            {
                id: 'orc',
                name: 'Орк',
                health: 120,
                reward: { gold: 30, exp: 15 },
                spawnWeight: 15,
                color: 0x8b4513,
                speed: 1.5,
                hitboxRadius: 0.8
            },
            {
                id: 'boss',
                name: 'Босс',
                health: 500,
                reward: { gold: 100, exp: 50 },
                spawnWeight: 5,
                color: 0xff0000,
                speed: 1.0,
                hitboxRadius: 1.2
            }
        ]
    },

    // Настройки контрактов
    contracts: {
        maxActive: 3, // максимальное количество активных контрактов
        types: [
            {
                id: 'slime_contract',
                name: 'Контракт на слаймов',
                description: '+50% шанс спавна слаймов',
                mobType: 'slime',
                spawnModifier: 1.5,
                cost: { gold: 100 }
            },
            {
                id: 'goblin_contract',
                name: 'Контракт на гоблинов',
                description: '+50% шанс спавна гоблинов',
                mobType: 'goblin',
                spawnModifier: 1.5,
                cost: { gold: 150 }
            },
            {
                id: 'exp_contract',
                name: 'Контракт на опыт',
                description: '+25% опыта от всех мобов',
                expModifier: 1.25,
                cost: { gold: 200 }
            },
            {
                id: 'gold_contract',
                name: 'Контракт на золото',
                description: '+25% золота от всех мобов',
                goldModifier: 1.25,
                cost: { gold: 200 }
            }
        ]
    },

    // Настройки улучшений (пока не используется, урон только от уровня)
    upgrades: {
        // Будет добавлено позже для предметов и улучшений
    },

    // Настройки 3D сцены
    scene: {
        camera: {
            position: { x: 0, y: 5, z: 10 },
            lookAt: { x: 0, y: 0, z: 0 }
        },
        lighting: {
            ambient: 0x404040,
            directional: {
                color: 0xffffff,
                intensity: 1,
                position: { x: 5, y: 10, z: 5 }
            }
        },
        floor: {
            size: 200, // увеличено в 10 раз
            color: 0x222222
        },
        projectile: {
            speed: 8.0, // скорость полета снаряда (уменьшено для механики промахов)
            maxDistance: 100, // максимальное расстояние, после которого снаряд пропадает
            radius: 0.15 // радиус снаряда для проверки столкновений
        },
        targeting: {
            predictionTime: 0.5, // время предсказания движения цели (секунды)
            maxPredictionDistance: 20 // максимальное расстояние для предсказания
        }
    }
};

