export class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    dealDamage(mob, damage) {
        if (!mob || mob.isDead) return;

        mob.takeDamage(damage);

        if (mob.isDead) {
            this.onMobKilled(mob);
        }
    }

    onMobKilled(mob) {
        const reward = mob.getReward();
        
        // Применяем модификаторы от контрактов
        const modifiedReward = this.game.contractSystem.applyRewardModifiers(reward, mob.type);
        
        // Создаем частицу опыта на месте смерти моба (только опыт, золото пока сразу)
        if (modifiedReward.exp > 0 && mob.mesh) {
            const mobPosition = mob.mesh.position.clone();
            this.game.createExpParticle(mobPosition, modifiedReward.exp);
        }
        
        // Золото даем сразу (пока только опыт в частицах)
        this.game.resources.addGold(modifiedReward.gold);
        
        // Удаляем моба через небольшую задержку для анимации
        setTimeout(() => {
            this.game.removeMob(mob);
        }, 500);
    }
}

