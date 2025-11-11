import { GameConfig } from '../core/Config.js';

export class ContractSystem {
    constructor(game) {
        this.game = game;
        this.activeContracts = [];
        this.availableContracts = [...GameConfig.contracts.types];
    }

    /**
     * Активирует контракт
     */
    activateContract(contractId) {
        const contract = this.availableContracts.find(c => c.id === contractId);
        if (!contract) {
            console.error(`Контракт не найден: ${contractId}`);
            return false;
        }

        // Проверяем, не активирован ли уже
        if (this.activeContracts.find(c => c.id === contractId)) {
            console.log('Контракт уже активирован');
            return false;
        }

        // Проверяем лимит активных контрактов
        if (this.activeContracts.length >= GameConfig.contracts.maxActive) {
            console.log('Достигнут лимит активных контрактов');
            return false;
        }

        // Проверка стоимости
        if (contract.cost && !this.game.resources.hasEnough(contract.cost)) {
            console.log('Недостаточно ресурсов для активации контракта');
            return false;
        }

        // Списываем стоимость
        if (contract.cost) {
            if (contract.cost.gold) {
                this.game.resources.spendGold(contract.cost.gold);
            }
            if (contract.cost.crystals) {
                this.game.resources.spendCrystals(contract.cost.crystals);
            }
        }

        // Активируем контракт
        this.activeContracts.push({ ...contract });
        console.log(`Активирован контракт: ${contract.name}`);
        return true;
    }

    /**
     * Деактивирует контракт
     */
    deactivateContract(contractId) {
        const index = this.activeContracts.findIndex(c => c.id === contractId);
        if (index > -1) {
            this.activeContracts.splice(index, 1);
            console.log(`Деактивирован контракт: ${contractId}`);
            return true;
        }
        return false;
    }

    /**
     * Получает активные контракты
     */
    getActiveContracts() {
        return this.activeContracts;
    }

    /**
     * Применяет модификаторы к награде
     */
    applyRewardModifiers(reward, mobType) {
        let modifiedReward = { ...reward };

        this.activeContracts.forEach(contract => {
            // Модификатор опыта
            if (contract.expModifier) {
                modifiedReward.exp = Math.floor(modifiedReward.exp * contract.expModifier);
            }

            // Модификатор золота
            if (contract.goldModifier) {
                modifiedReward.gold = Math.floor(modifiedReward.gold * contract.goldModifier);
            }
        });

        return modifiedReward;
    }

    /**
     * Получает доступные контракты
     */
    getAvailableContracts() {
        return this.availableContracts;
    }
}

