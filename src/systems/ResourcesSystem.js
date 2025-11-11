export class ResourcesSystem {
    constructor() {
        this.gold = 100; // Начальное золото для тестирования
        this.crystals = 0;
    }

    addGold(amount) {
        this.gold += amount;
        this.gold = Math.floor(this.gold);
    }

    addCrystals(amount) {
        this.crystals += amount;
        this.crystals = Math.floor(this.crystals);
    }

    spendGold(amount) {
        if (this.hasEnoughGold(amount)) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    spendCrystals(amount) {
        if (this.hasEnoughCrystals(amount)) {
            this.crystals -= amount;
            return true;
        }
        return false;
    }

    hasEnoughGold(amount) {
        return this.gold >= amount;
    }

    hasEnoughCrystals(amount) {
        return this.crystals >= amount;
    }

    hasEnough(cost) {
        if (cost.gold && !this.hasEnoughGold(cost.gold)) {
            return false;
        }
        if (cost.crystals && !this.hasEnoughCrystals(cost.crystals)) {
            return false;
        }
        return true;
    }
}

