/* 
  Простейший пример. 
  - Есть одна сцена MainScene, в которой:
    1) Отображаем основные UI-элементы (HP игрока, MP игрока, HP врага).
    2) Кнопки "Атака" и "Защита".
    3) Простой "инвентарь" (просто список надписей, можно кликать по предмету).
    4) Простейшая логика: клик "Attack" уменьшает HP врага, 
       затем враг контратакует и бьёт игрока. "Defend" уменьшает получаемый урон.
    5) Пример предмета: зелье лечения (heal potion).
*/

// Конфиг Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1c1c1c',
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
  
  const game = new Phaser.Game(config);
  
  // Глобальные или статические переменные для примера
  let playerHP = 100;
  let playerMaxHP = 100;
  let playerMP = 30;
  let playerMaxMP = 30;
  
  let enemyHP = 60;
  let enemyMaxHP = 60;
  
  // Флаг, сигнализирующий, что игрок в защитной стойке
  let isDefending = false;
  
  // Тексты UI
  let playerHPText;
  let playerMPText;
  let enemyHPText;
  
  // Инвентарь (для упрощения — массив объектов)
  let inventory = [
    { name: 'Лечебное зелье', type: 'potion', heal: 20, quantity: 2 },
    { name: 'Свиток огня', type: 'scroll', damage: 15, quantity: 1 }
  ];
  
  function preload() {
    // Если нужны какие-то картинки или спрайты — загружаем тут.
    // Пример: this.load.image('enemy', 'assets/enemy.png');
  }
  
  function create() {
    // === 1. ТЕКСТОВЫЕ ПОЛЯ ДЛЯ HP / MP ===
    playerHPText = this.add.text(20, 20, `HP: ${playerHP}/${playerMaxHP}`, {
      fontSize: '24px',
      fill: '#fff'
    });
    playerMPText = this.add.text(20, 50, `MP: ${playerMP}/${playerMaxMP}`, {
      fontSize: '24px',
      fill: '#fff'
    });
    enemyHPText = this.add.text(600, 20, `Enemy HP: ${enemyHP}/${enemyMaxHP}`, {
      fontSize: '24px',
      fill: '#fff'
    });
  
    // === 2. КНОПКИ АТАКИ И ЗАЩИТЫ ===
    // Для простоты используем text-элементы как кнопки, 
    // но можно сделать спрайты/кнопки через UI-плагины и т.д.
  
    // Кнопка Атака
    const attackText = this.add.text(20, 100, '[ Атаковать ]', {
      fontSize: '28px',
      fill: '#ff4444',
      backgroundColor: '#333',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      doAttack();
    });
  
    // Кнопка Защита
    const defendText = this.add.text(20, 140, '[ Защищаться ]', {
      fontSize: '28px',
      fill: '#44ff44',
      backgroundColor: '#333',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      doDefend();
    });
  
    // === 3. ИНВЕНТАРЬ ===
    // Пишем слово "Инвентарь", затем ниже — список предметов
    this.add.text(20, 200, 'Инвентарь:', {
      fontSize: '24px',
      fill: '#fff',
      underline: true
    });
  
    // Рисуем предметы (списком), каждый — интерактивный
    let invY = 240;
    inventory.forEach((item, index) => {
      // Формат надписи: "Лечебное зелье (x2)"
      let itemText = this.add.text(20, invY, `${item.name} (x${item.quantity})`, {
        fontSize: '20px',
        fill: '#fff'
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        useItem(item, index);
      });
      invY += 30;
    });
  
    // === 4. (Пример) Визуализация врага / игрока ===
    // Для упрощения сейчас только текстом, 
    // но можно добавить спрайты, картинки и т.д.
    this.add.text(600, 60, 'Враг (demo)', { fontSize: '24px', fill: '#fff' });
    
    // Пример игрока
    this.add.text(200, 300, '[Твой персонаж]', { fontSize: '24px', fill: '#fff' });
  }
  
  // === 5. МЕТОД UPDATE (каждый кадр) ===
  function update() {
    // Можно тут делать анимации, проверки условий, и т.д.
    // Но для упрощения — ничего, 
    // обновляем только при событиях (нажатие атаки/предметов).
  }
  
  // === 6. ЛОГИКА АТАКИ ===
  function doAttack() {
    // Игрок атакует врага
    let damage = 10; // например, фиксированный урон
    enemyHP -= damage;
    if (enemyHP < 0) enemyHP = 0;
  
    // Обновляем текст
    enemyHPText.setText(`Enemy HP: ${enemyHP}/${enemyMaxHP}`);
  
    // Проверка: враг мёртв?
    if (enemyHP <= 0) {
      // Можно показать "враг побеждён" и остановить бой
      enemyHPText.setText(`Enemy HP: 0 / ${enemyMaxHP} (Побеждён)`);
      return;
    }
  
    // Если враг жив, он контратакует
    enemyAttack();
  }
  
  function enemyAttack() {
    // Простой урон от врага
    let enemyDamage = 8; // фиксирован
    if (isDefending) {
      // Если игрок в защите, урон меньше
      enemyDamage = Math.floor(enemyDamage / 2);
    }
  
    playerHP -= enemyDamage;
    if (playerHP < 0) playerHP = 0;
  
    // Обновляем текст
    playerHPText.setText(`HP: ${playerHP}/${playerMaxHP}`);
  
    // Снимаем флаг защиты (он действует только на 1 атаку)
    isDefending = false;
  
    // Проверяем, жив ли игрок
    if (playerHP <= 0) {
      playerHPText.setText(`HP: 0 / ${playerMaxHP} (Поражение)`);
      // Здесь можно завершить игру
    }
  }
  
  function doDefend() {
    // Просто ставим флаг, что мы в защите
    isDefending = true;
  }
  
  // === 7. ЛОГИКА ПРЕДМЕТОВ ===
  function useItem(item, index) {
    if (item.quantity <= 0) {
      // Нет предметов
      return;
    }
    // В зависимости от типа предмета — разные эффекты
    if (item.type === 'potion') {
      // Лечебное зелье восстанавливает HP
      playerHP += item.heal;
      if (playerHP > playerMaxHP) {
        playerHP = playerMaxHP;
      }
      playerHPText.setText(`HP: ${playerHP}/${playerMaxHP}`);
      item.quantity--;
    } else if (item.type === 'scroll') {
      // Свиток наносит урон врагу
      enemyHP -= item.damage;
      if (enemyHP < 0) enemyHP = 0;
      enemyHPText.setText(`Enemy HP: ${enemyHP}/${enemyMaxHP}`);
      item.quantity--;
      if (enemyHP <= 0) {
        enemyHPText.setText(`Enemy HP: 0 / ${enemyMaxHP} (Побеждён)`);
        return;
      }
      // Враг может контратаковать
      enemyAttack();
    }
  
    // Обновляем текст предмета в инвентаре
    // Так как инвентарь отрисован один раз, в реальной игре лучше
    // иметь массив текстовых объектов, но для демо можно "перерисовать" всю сцену
    // или же найти конкретный объект и изменить текст.
    // Здесь для простоты: перезапускаем сцену, или перенесём логику в отдельную функцию.
    redrawInventory(this); // <-- вариант, но "this" сейчас недоступно тут,
    // т.к. это обычная функция. Нужно аккуратно передавать ссылку на сцену.
  
    // Упростим: Просто перерисуем весь инвентарь через консоль или reload (демо):
    // (или перезапиши текст в create() — но для примера объясняем идею)
  }
  
  // Пример функции перерисовки инвентаря (если захотим динамически)
  function redrawInventory(scene) {
    // Если бы мы сохранили ссылки на каждый Text предмета, можно обновить их напрямую.
    // Или удалить все и заново создать. 
    // Это больше вопрос "грамотной архитектуры" — в данном скелете упрощаем.
  }
  
  