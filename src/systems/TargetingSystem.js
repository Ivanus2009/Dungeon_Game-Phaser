import * as THREE from 'three';
import { GameConfig } from '../core/Config.js';

export class TargetingSystem {
    constructor() {
        this.lastTargetMob = null;
        this.targetLockTime = 0;
        this.minLockTime = 0.1; // минимальное время удержания цели
    }

    /**
     * Выбирает лучшую цель для атаки с учетом предсказания движения
     */
    selectTarget(mobs, playerPosition) {
        if (!mobs || mobs.length === 0) return null;

        const aliveMobs = mobs.filter(mob => !mob.isDead);
        if (aliveMobs.length === 0) return null;

        // Если у нас есть зафиксированная цель и она еще жива, продолжаем атаковать её
        if (this.lastTargetMob && !this.lastTargetMob.isDead && aliveMobs.includes(this.lastTargetMob)) {
            this.targetLockTime += 0.016; // примерно один кадр
            
            // Удерживаем цель минимум minLockTime секунд
            if (this.targetLockTime >= this.minLockTime) {
                const distance = playerPosition.distanceTo(this.lastTargetMob.mesh.position);
                
                // Если цель слишком далеко, ищем ближе
                if (distance > GameConfig.scene.targeting.maxPredictionDistance) {
                    this.lastTargetMob = null;
                    this.targetLockTime = 0;
                } else {
                    return this.lastTargetMob;
                }
            }
        }

        // Ищем лучшую цель на основе расстояния и предсказания
        let bestTarget = null;
        let bestScore = Infinity;

        for (const mob of aliveMobs) {
            const distance = playerPosition.distanceTo(mob.mesh.position);
            
            // Пропускаем слишком далекие мобы
            if (distance > GameConfig.scene.targeting.maxPredictionDistance) continue;

            // Предсказываем позицию моба
            const predictedPos = mob.getPredictedPosition(GameConfig.scene.targeting.predictionTime);
            const predictedDistance = playerPosition.distanceTo(predictedPos);

            // Оценка: чем ближе и чем больше шанс попадания, тем лучше
            // Учитываем как текущее расстояние, так и предсказанное
            const score = distance * 0.7 + predictedDistance * 0.3;

            if (score < bestScore) {
                bestScore = score;
                bestTarget = mob;
            }
        }

        // Если нашли новую цель, обновляем зафиксированную
        if (bestTarget && bestTarget !== this.lastTargetMob) {
            this.lastTargetMob = bestTarget;
            this.targetLockTime = 0;
        }

        return bestTarget;
    }

    /**
     * Вычисляет целевую точку для выстрела с учетом предсказания движения
     * Использует итеративный подход для более точного предсказания
     */
    calculateAimPoint(targetMob, playerPosition, projectileSpeed) {
        if (!targetMob) return null;

        const playerPos = playerPosition.clone();
        if (typeof playerPosition.y === 'number') {
            playerPos.y = playerPosition.y + 1; // позиция оружия
        }
        
        // Итеративный расчет точки прицеливания
        let predictedPos = targetMob.mesh.position.clone();
        predictedPos.y += 0.5; // центр моба
        
        // Несколько итераций для более точного предсказания
        for (let i = 0; i < 3; i++) {
            const distance = playerPos.distanceTo(predictedPos);
            const timeToTarget = distance / projectileSpeed;
            
            // Предсказываем позицию моба через timeToTarget секунд
            const newPredictedPos = targetMob.getPredictedPosition(timeToTarget);
            newPredictedPos.y = predictedPos.y; // сохраняем высоту
            
            // Если изменение незначительно, останавливаемся
            if (predictedPos.distanceTo(newPredictedPos) < 0.1) {
                break;
            }
            
            predictedPos = newPredictedPos;
        }

        return predictedPos;
    }

    reset() {
        this.lastTargetMob = null;
        this.targetLockTime = 0;
    }
}

