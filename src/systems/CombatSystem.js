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
        
        // Даем награду игроку
        this.game.player.addExp(modifiedReward.exp);
        this.game.resources.addGold(modifiedReward.gold);
        
        // Удаляем моба через небольшую задержку для анимации
        setTimeout(() => {
            this.game.removeMob(mob);
        }, 500);
    }
}

