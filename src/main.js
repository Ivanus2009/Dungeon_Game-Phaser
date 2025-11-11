import { Game } from './core/Game.js';

// Инициализация игры
let game;

window.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Инициализация игры...');
        game = new Game();
        console.log('Игра запущена!');
        
        // Экспортируем game для отладки
        window.game = game;
    } catch (error) {
        console.error('Ошибка при инициализации игры:', error);
        // Показываем ошибку пользователю
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.zIndex = '10000';
        errorDiv.innerHTML = `
            <h2>Ошибка загрузки игры</h2>
            <p>${error.message}</p>
            <p>Проверьте консоль браузера для подробностей.</p>
        `;
        document.body.appendChild(errorDiv);
    }
});

