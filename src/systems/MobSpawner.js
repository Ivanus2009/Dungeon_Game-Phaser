import { Mob } from '../entities/Mob.js';
import { GameConfig } from '../core/Config.js';
import { RandomSystem } from './RandomSystem.js';

export class MobSpawner {
    constructor(game) {
        this.game = game;
        this.randomSystem = new RandomSystem(game);
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.mobs.baseSpawnRate;
    }

    update(deltaTime) {
        // Линейное увеличение скорости спавна со временем
        const timeIncrease = this.game.gameTime * GameConfig.mobs.spawnRateIncrease;
        const currentSpawnRate = Math.max(
            GameConfig.mobs.baseSpawnRate - timeIncrease,
            GameConfig.mobs.minSpawnRate
        );
        
        this.spawnTimer += deltaTime * 1000; // deltaTime в секундах, spawnTimer в миллисекундах

        if (this.spawnTimer >= currentSpawnRate) {
            this.spawnMob();
            this.spawnTimer = 0;
        }
    }

    spawnMob() {
        // Используем RandomSystem для выбора типа моба с учетом контрактов
        const mobType = this.randomSystem.selectMobType();
        
        // Уровень моба зависит от уровня игрока
        const mobLevel = Math.max(1, Math.floor(this.game.player.level / 5) + 1);
        
        const mob = new Mob(mobType, mobLevel);
        this.game.mobs.push(mob);
        this.game.scene.add(mob.mesh);
        
        console.log(`Спавн моба: ${mob.mobData.name} (уровень ${mobLevel})`);
    }
}

