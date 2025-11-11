export class UIManager {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.updateTimer();
        
        // Обновляем меню паузы только если оно открыто
        if (this.game.isPaused) {
            this.updatePauseMenu();
        }
    }

    updateTimer() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.game.getFormattedTime();
        }
    }

    togglePauseMenu(isPaused) {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            if (isPaused) {
                pauseMenu.classList.add('active');
                this.updatePauseMenu();
            } else {
                pauseMenu.classList.remove('active');
            }
        }
    }

    updatePauseMenu() {
        if (!this.game.player || !this.game.resources) return;

        const player = this.game.player;
        const resources = this.game.resources;

        // Обновляем характеристики (проверяем наличие элементов)
        const levelEl = document.getElementById('pause-player-level');
        const damageEl = document.getElementById('pause-player-damage');
        const expEl = document.getElementById('pause-player-exp');
        const expNextEl = document.getElementById('pause-player-exp-next');
        const healthEl = document.getElementById('pause-player-health');
        const goldEl = document.getElementById('pause-gold');
        const crystalsEl = document.getElementById('pause-crystals');

        if (levelEl) levelEl.textContent = player.level;
        if (damageEl) damageEl.textContent = player.getDamage();
        if (expEl) expEl.textContent = Math.floor(player.exp);
        if (expNextEl) expNextEl.textContent = Math.floor(player.expToNextLevel);
        if (healthEl) healthEl.textContent = '-'; // Пока не реализовано
        if (goldEl) goldEl.textContent = resources.gold.toLocaleString();
        if (crystalsEl) crystalsEl.textContent = resources.crystals.toLocaleString();

        // Обновляем контракты
        this.updatePauseContracts();
    }

    updatePauseContracts() {
        if (!this.game.contractSystem || !this.game.resources) return;

        const activeContracts = this.game.contractSystem.getActiveContracts();
        const availableContracts = this.game.contractSystem.getAvailableContracts();
        const contractsList = document.getElementById('pause-contracts-list');
        const resources = this.game.resources;
        
        if (!contractsList) return;
        
        let html = '';
        
        // Активные контракты
        if (activeContracts.length > 0) {
            html += '<h3 style="color: #4ae24a; margin-bottom: 10px; margin-top: 10px;">Активные контракты:</h3>';
            activeContracts.forEach(contract => {
                html += `
                    <div class="contract-item active">
                        <h3>${contract.name}</h3>
                        <p>${contract.description}</p>
                        <button class="contract-button deactivate" 
                                onclick="window.game.contractSystem.deactivateContract('${contract.id}'); window.game.uiManager.updatePauseMenu();">
                            Деактивировать
                        </button>
                    </div>
                `;
            });
        }
        
        // Доступные контракты
        html += '<h3 style="color: #4a90e2; margin-bottom: 10px; margin-top: 20px;">Доступные контракты:</h3>';
        availableContracts.forEach(contract => {
            const isActive = activeContracts.find(c => c.id === contract.id);
            const canAfford = contract.cost ? resources.hasEnough(contract.cost) : true;
            const canActivate = !isActive && canAfford && activeContracts.length < 3;
            
            const costText = contract.cost 
                ? `💰 ${contract.cost.gold || 0} ${contract.cost.crystals ? '💎 ' + contract.cost.crystals : ''}`
                : 'Бесплатно';
            
            html += `
                <div class="contract-item ${isActive ? 'active' : ''}">
                    <h3>${contract.name}</h3>
                    <p>${contract.description}</p>
                    <div class="cost">Стоимость: ${costText}</div>
                    <button class="contract-button" 
                            onclick="window.game.contractSystem.activateContract('${contract.id}'); window.game.uiManager.updatePauseMenu();"
                            ${!canActivate ? 'disabled' : ''}>
                        ${isActive ? 'Активирован' : 'Активировать'}
                    </button>
                </div>
            `;
        });
        
        contractsList.innerHTML = html;

        // Добавляем обработчик для кнопки закрытия
        const closeButton = document.getElementById('close-pause-menu');
        if (closeButton && !closeButton.onclick) {
            closeButton.onclick = () => {
                this.game.togglePause();
            };
        }
    }
}
