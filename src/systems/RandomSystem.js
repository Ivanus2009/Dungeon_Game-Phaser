import { GameConfig } from '../core/Config.js';

export class RandomSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Выбирает тип моба для спавна с учетом контрактов
     * Использует взвешенный рандом
     */
    selectMobType() {
        const mobTypes = GameConfig.mobs.types;
        const activeContracts = this.game.contractSystem.getActiveContracts();
        
        // Создаем массив весов для каждого типа моба
        const weights = mobTypes.map(mobType => {
            let weight = mobType.spawnWeight;
            
            // Применяем модификаторы от контрактов
            activeContracts.forEach(contract => {
                if (contract.mobType === mobType.id && contract.spawnModifier) {
                    weight *= contract.spawnModifier;
                }
            });
            
            return weight;
        });

        // Вычисляем общую сумму весов
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        // Генерируем случайное число от 0 до totalWeight
        let random = Math.random() * totalWeight;

        // Выбираем тип моба на основе весов
        for (let i = 0; i < mobTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return mobTypes[i].id;
            }
        }

        // Fallback на первый тип (не должно произойти)
        return mobTypes[0].id;
    }

    /**
     * Генерирует случайное число с учетом модификаторов
     */
    randomWithModifiers(baseValue, modifiers) {
        let value = baseValue;
        modifiers.forEach(modifier => {
            value *= modifier;
        });
        return value;
    }

    /**
     * Проверяет шанс с учетом модификаторов
     */
    checkChance(baseChance, modifiers = []) {
        let chance = baseChance;
        modifiers.forEach(modifier => {
            chance *= modifier;
        });
        return Math.random() < chance;
    }
}

