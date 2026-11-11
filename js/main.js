(function () {
  "use strict";

  const TIME_ZONE = "Europe/Moscow";

  // Часы работы по дням недели (0 — воскресенье), в минутах от полуночи
  const SCHEDULE = [
    { open: 9 * 60, close: 23 * 60 },
    { open: 8 * 60, close: 22 * 60 },
    { open: 8 * 60, close: 22 * 60 },
    { open: 8 * 60, close: 22 * 60 },
    { open: 8 * 60, close: 22 * 60 },
    { open: 8 * 60, close: 22 * 60 },
    { open: 9 * 60, close: 23 * 60 }
  ];

  const PICKUP = {
    daysAhead: 3,
    slotStep: 30,
    prepTime: 20,          // минимум минут на сборку заказа
    lastBeforeClose: 15    // последний самовывоз — за 15 минут до закрытия
  };

  const GRINDS = [
    { id: "beans", label: "В зёрнах", hint: "Целые зёрна: смелете сами перед варкой, так вкус держится дольше." },
    { id: "turka", label: "Под турку", hint: "Самый мелкий помол, почти в пыль." },
    { id: "espresso", label: "Под кофемашину", hint: "Мелкий помол, как мука." },
    { id: "moka", label: "Под гейзерную", hint: "Мелкий, чуть крупнее, чем для кофемашины." },
    { id: "filter", label: "Под воронку и кемекс", hint: "Средний помол, как песок." },
    { id: "french", label: "Под френч-пресс", hint: "Крупный помол, как морская соль." }
  ];

  // Каталог зерна. Цены за пачку 250 г и 1 кг.
  // tags нужны подбору: brew — для каких способов, milk — хорошо ли с молоком, taste — профиль.
  const BEANS = [
    {
      id: "ethiopia",
      name: "Эфиопия Иргачеффе",
      origin: "Эфиопия, регион Иргачеффе, 1 900 м",
      process: "мытая",
      roast: "light",
      notes: "Бергамот, белый персик, чай с жасмином",
      bestFor: "воронки, кемекса и аэропресса",
      prices: { 250: 890, 1000: 3200 },
      tags: { brew: ["filter", "french"], milk: false, taste: "fruit" }
    },
    {
      id: "kenya",
      name: "Кения Ньери",
      origin: "Кения, округ Ньери, 1 750 м",
      process: "мытая",
      roast: "light",
      notes: "Чёрная смородина, грейпфрут, тростниковый сахар",
      bestFor: "воронки и френч-пресса",
      prices: { 250: 990, 1000: 3600 },
      tags: { brew: ["filter", "french"], milk: false, taste: "fruit" }
    },
    {
      id: "colombia",
      name: "Колумбия Уила",
      origin: "Колумбия, департамент Уила, 1 650 м",
      process: "мытая",
      roast: "medium",
      notes: "Карамель, красное яблоко, какао",
      bestFor: "любого способа — универсальное зерно",
      prices: { 250: 790, 1000: 2800 },
      tags: { brew: ["filter", "espresso", "moka", "turka", "french"], milk: true, taste: "balanced" }
    },
    {
      id: "brazil",
      name: "Бразилия Серрадо",
      origin: "Бразилия, Серрадо-Минейро, 1 100 м",
      process: "натуральная",
      roast: "medium",
      notes: "Молочный шоколад, фундук, печенье",
      bestFor: "турки, гейзерной и кофе с молоком",
      prices: { 250: 650, 1000: 2300 },
      tags: { brew: ["turka", "moka", "espresso"], milk: true, taste: "chocolate" }
    },
    {
      id: "morning",
      name: "Смесь «Утро»",
      origin: "Бразилия и Эфиопия, наш эспрессо-бленд",
      process: "натуральная + мытая",
      roast: "dark",
      notes: "Тёмный шоколад, вишня, долгое сладкое послевкусие",
      bestFor: "кофемашины и капучино дома",
      prices: { 250: 690, 1000: 2450 },
      tags: { brew: ["espresso", "moka"], milk: true, taste: "chocolate" }
    }
  ];

  const ROAST_LABEL = { light: "светлая обжарка", medium: "средняя обжарка", dark: "тёмная обжарка" };

  const QUIZ = [
    {
      key: "brew",
      question: "Как вы обычно варите кофе?",
      options: [
        { value: "turka", title: "В турке" },
        { value: "espresso", title: "В кофемашине", hint: "рожковой или автоматической" },
        { value: "moka", title: "В гейзерной кофеварке" },
        { value: "filter", title: "В воронке или кемексе" },
        { value: "french", title: "Во френч-прессе" }
      ]
    },
    {
      key: "milk",
      question: "Пьёте с молоком?",
      options: [
        { value: "yes", title: "Да, почти всегда", hint: "капучино, латте, раф" },
        { value: "no", title: "Нет, только чёрный" },
        { value: "both", title: "По настроению" }
      ]
    },
    {
      key: "taste",
      question: "Какой вкус вам ближе?",
      options: [
        { value: "chocolate", title: "Шоколад и орехи", hint: "плотный, без кислинки" },
        { value: "fruit", title: "Фрукты и ягоды", hint: "яркий, с приятной кислинкой" },
        { value: "balanced", title: "Что-то посередине", hint: "сладкий и мягкий" }
      ]
    }
  ];

  const MENU = [
    {
      id: "espresso",
      title: "Эспрессо",
      items: [
        { name: "Эспрессо", meta: "30 мл, двойная порция", price: "140" },
        { name: "Американо", meta: "250 мл", price: "170" },
        { name: "Капучино", meta: "250 / 350 мл", price: "220 / 260" },
        { name: "Флэт уайт", meta: "200 мл, двойной эспрессо", price: "240" },
        { name: "Раф ванильный", meta: "300 мл, ваниль своей варки", price: "290", tag: "хит" }
      ]
    },
    {
      id: "filter",
      title: "Фильтр",
      items: [
        { name: "Воронка V60", meta: "300 мл, зерно дня", price: "260", tag: "зерно дня" },
        { name: "Кемекс на двоих", meta: "500 мл", price: "420" },
        { name: "Аэропресс", meta: "250 мл", price: "230" },
        { name: "Колд брю", meta: "300 мл, настаиваем 16 часов", price: "250" }
      ]
    },
    {
      id: "no-coffee",
      title: "Не кофе",
      items: [
        { name: "Какао", meta: "300 мл, бельгийский шоколад", price: "230" },
        { name: "Чай листовой", meta: "чайник 500 мл", price: "280" },
        { name: "Матча латте", meta: "300 мл", price: "290" }
      ]
    },
    {
      id: "food",
      title: "Еда",
      items: [
        { name: "Круассан", meta: "печём утром", price: "160" },
        { name: "Сырники", meta: "со сметаной и ягодным соусом", price: "320", tag: "до 12:00" },
        { name: "Морковный торт", meta: "кусок 150 г", price: "290" },
        { name: "Банановый хлеб", meta: "с грецким орехом", price: "210" }
      ]
    }
  ];

  const $ = (selector) => document.querySelector(selector);

  function nowInZone() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    return {
      iso: `${map.year}-${map.month}-${map.day}`,
      day: weekdays[map.weekday],
      minutes: Number(map.hour) * 60 + Number(map.minute)
    };
  }

  // Даты считаем в UTC, чтобы часовой пояс браузера не сдвигал день
  function addDays(iso, days) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDay(),
      date
    };
  }

  const formatClock = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function renderOpenStatus() {
    const el = $("#open-status");
    const text = $("#open-status-text");
    const now = nowInZone();
    const today = SCHEDULE[now.day];
    const isOpen = now.minutes >= today.open && now.minutes < today.close;

    el.dataset.open = String(isOpen);

    if (isOpen) {
      const left = today.close - now.minutes;
      text.textContent = left <= 60
        ? `Открыто, закроемся через ${left} ${plural(left, "минуту", "минуты", "минут")}`
        : `Открыто до ${formatClock(today.close)}`;
    } else if (now.minutes < today.open) {
      text.textContent = `Закрыто, откроемся в ${formatClock(today.open)}`;
    } else {
      text.textContent = `Закрыто, завтра с ${formatClock(SCHEDULE[(now.day + 1) % 7].open)}`;
    }
  }

  function setupMenu() {
    const tabs = $("#menu-tabs");
    const list = $("#menu-list");

    function renderItem(item) {
      const li = document.createElement("li");
      li.className = "menu__item";
      li.innerHTML = `
        <div class="menu__line">
          <span class="menu__name"></span>
          <span class="menu__leader" aria-hidden="true"></span>
          <span class="menu__price"></span>
        </div>
        <span class="menu__meta"></span>`;

          li.querySelector(".menu__name").textContent = item.name;
      li.querySelector(".menu__price").textContent = `${item.price} ₽`;
      li.querySelector(".menu__meta").textContent = item.meta;

      if (item.tag) {
        const tag = document.createElement("span");
        tag.className = "menu__tag";
        tag.textContent = item.tag;
        li.querySelector(".menu__name").append(tag);
      }
      return li;
    }

    function select(id, { focus = false } = {}) {
      const category = MENU.find((c) => c.id === id);
      for (const button of tabs.children) {
        const active = button.dataset.id === id;
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
        if (active && focus) button.focus();
      }
      list.setAttribute("aria-labelledby", `tab-${id}`);
      list.replaceChildren(...category.items.map(renderItem));
    }

    for (const category of MENU) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tabs__button";
      button.id = `tab-${category.id}`;
      button.dataset.id = category.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "menu-list");
      button.textContent = category.title;
      tabs.append(button);
    }

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest(".tabs__button");
      if (button) select(button.dataset.id);
    });

    tabs.addEventListener("keydown", (event) => {
      const buttons = [...tabs.children];
      const index = buttons.indexOf(document.activeElement);
      if (index === -1) return;

      const moves = {
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: buttons.length - 1
      };
      if (!(event.key in moves)) return;

      event.preventDefault();
      const next = (moves[event.key] + buttons.length) % buttons.length;
      select(buttons[next].dataset.id, { focus: true });
    });

    select(MENU[0].id);
  }

  const formatPrice = (rub) => `${rub.toLocaleString("ru-RU")} ₽`;
  const grindLabel = (id) => GRINDS.find((g) => g.id === id).label;
  const weightLabel = (grams) => (grams >= 1000 ? `${grams / 1000} кг` : `${grams} г`);

  // Обжариваем по понедельникам, а продаём после 3 дней отдыха зерна.
  // До четверга в продаже ещё обжарка прошлого понедельника.
  const REST_DAYS = 3;

  function roastOnSale() {
    const now = nowInZone();
    const daysSinceMonday = (now.day + 6) % 7;
    const back = daysSinceMonday >= REST_DAYS ? daysSinceMonday : daysSinceMonday + 7;
    return addDays(now.iso, -back).date;
  }

  function renderRoastDates() {
    const text = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "numeric", month: "long" })
      .format(roastOnSale());
    document.querySelectorAll("[data-roast-date]").forEach((el) => { el.textContent = text; });
  }

  function formatPhone(value) {
    let digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);

    let out = "+7";
    if (digits.length > 1) out += ` (${digits.slice(1, 4)}`;
    if (digits.length >= 4) out += ")";
    if (digits.length > 4) out += ` ${digits.slice(4, 7)}`;
    if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
    if (digits.length > 9) out += `-${digits.slice(9, 11)}`;
    return out;
  }

  function createCart() {
    const STORAGE_KEY = "12g-cart-v1";
    const MAX_QTY = 10;
    const listeners = new Set();
    let items = load();

    function load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        // отбрасываем позиции, которых больше нет в каталоге
        return saved.filter((item) => BEANS.some((b) => b.id === item.beanId && b.prices[item.weight]));
      } catch {
        return [];
      }
    }

    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* приватный режим */ }
    }

    function notify(change) {
      save();
      listeners.forEach((fn) => fn(change));
    }

    const keyOf = (beanId, weight, grind) => `${beanId}:${weight}:${grind}`;

    return {
      subscribe(fn) { listeners.add(fn); fn({ type: "init" }); },

      add(beanId, weight, grind) {
        const key = keyOf(beanId, weight, grind);
        const existing = items.find((i) => i.key === key);
        if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
        else items.push({ key, beanId, weight, grind, qty: 1 });
        notify({ type: "add", key });
      },

      setQty(key, qty) {
        const item = items.find((i) => i.key === key);
        if (!item) return;
        item.qty = Math.max(1, Math.min(MAX_QTY, qty));
        notify({ type: "qty", key });
      },

      remove(key) {
        items = items.filter((i) => i.key !== key);
        notify({ type: "remove", key });
      },

      clear() {
        items = [];
        notify({ type: "clear" });
      },

      get lines() {
        return items.map((item) => {
          const bean = BEANS.find((b) => b.id === item.beanId);
          const price = bean.prices[item.weight];
          return { ...item, bean, price, sum: price * item.qty };
        });
      },

      get count() { return items.reduce((n, i) => n + i.qty, 0); },
      get total() { return this.lines.reduce((sum, l) => sum + l.sum, 0); },
      maxQty: MAX_QTY
    };
  }

  function setupShop(cart) {
    const list = $("#shop");

    function card(bean) {
      const li = document.createElement("li");
      li.className = "product";
      li.dataset.roast = bean.roast;

      const weightName = `weight-${bean.id}`;
      const grindId = `grind-${bean.id}`;

      li.innerHTML = `
        <div class="product__head">
          <h3 class="product__name"></h3>
          <p class="product__origin"></p>
        </div>
        <ul class="product__facts"><li data-fact="roast"></li><li data-fact="process"></li></ul>
        <p class="product__notes"><span data-notes></span><span class="product__for" data-for></span></p>
        <div class="product__options">
          <fieldset class="segmented">
            <legend class="visually-hidden">Вес пачки</legend>
            <label><input type="radio" name="${weightName}" value="250" checked><span>250 г</span></label>
            <label><input type="radio" name="${weightName}" value="1000"><span>1 кг</span></label>
          </fieldset>
          <div class="field">
            <label class="visually-hidden" for="${grindId}">Помол</label>
            <select class="field__control" id="${grindId}" aria-describedby="${grindId}-hint"></select>
            <p class="product__grind-hint" id="${grindId}-hint" aria-live="polite"></p>
          </div>
        </div>
        <div class="product__buy">
          <span class="product__price" aria-live="polite"></span>
          <button class="button button--small" type="button">В корзину</button>
        </div>`;

      li.querySelector(".product__name").textContent = bean.name;
      li.querySelector(".product__origin").textContent = bean.origin;
      li.querySelector('[data-fact="roast"]').textContent = ROAST_LABEL[bean.roast];
      li.querySelector('[data-fact="process"]').textContent = `обработка: ${bean.process}`;
      li.querySelector("[data-notes]").textContent = bean.notes;
      li.querySelector("[data-for]").textContent = `Хорошо для ${bean.bestFor}`;

      const select = li.querySelector("select");
      select.append(...GRINDS.map((g) => new Option(g.label, g.id)));
      select.value = bean.tags.brew[0];

      const price = li.querySelector(".product__price");
      const weight = () => Number(li.querySelector(`input[name="${weightName}"]:checked`).value);
      const renderPrice = () => { price.textContent = formatPrice(bean.prices[weight()]); };

      const hint = li.querySelector(".product__grind-hint");
      const renderGrindHint = () => {
        const grind = GRINDS.find((g) => g.id === select.value);
        const fits = grind.id === "beans" || bean.tags.brew.includes(grind.id);
        hint.textContent = fits
          ? grind.hint
          : `${grind.hint} Это зерно раскрывается лучше всего для ${bean.bestFor}.`;
        hint.toggleAttribute("data-warn", !fits);
      };

      li.addEventListener("change", () => {
        renderPrice();
        renderGrindHint();
      });
      li.querySelector(".product__buy .button").addEventListener("click", () => {
        cart.add(bean.id, weight(), select.value);
      });

      renderPrice();
      renderGrindHint();
      return li;
    }

    list.replaceChildren(...BEANS.map(card));
  }

  function recommend(answers) {
    const scored = BEANS.map((bean) => {
      let score = 0;
      if (bean.tags.brew.includes(answers.brew)) score += 3;
      if (answers.milk === "yes" && bean.tags.milk) score += 2;
      if (answers.milk === "no" && !bean.tags.milk) score += 1;
      if (bean.tags.taste === answers.taste) score += 3;
      return { bean, score };
    });
    // при равенстве — дешевле, чтобы первая покупка была без риска
    scored.sort((a, b) => b.score - a.score || a.bean.prices[250] - b.bean.prices[250]);
    return scored[0].bean;
  }

  function setupQuiz(cart) {
    const panel = $("#quiz-panel");
    const state = { step: 0, answers: {} };

    function progress(step) {
      const wrap = document.createElement("div");
      wrap.className = "quiz__progress";
      wrap.innerHTML = '<span></span><span class="quiz__bar"><span></span></span>';
      wrap.firstChild.textContent = `Вопрос ${step + 1} из ${QUIZ.length}`;
      wrap.querySelector(".quiz__bar span").style.width = `${((step + 1) / QUIZ.length) * 100}%`;
      return wrap;
    }

    function renderQuestion() {
      const q = QUIZ[state.step];
      const title = document.createElement("h3");
      title.className = "quiz__question";
      title.textContent = q.question;
      title.tabIndex = -1;

      const options = document.createElement("div");
      options.className = "quiz__options";
      for (const option of q.options) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz__option";
        const strong = document.createElement("strong");
        strong.textContent = option.title;
        button.append(strong);
        if (option.hint) {
          const small = document.createElement("small");
          small.textContent = option.hint;
          button.append(small);
        }
        button.addEventListener("click", () => {
          state.answers[q.key] = option.value;
          state.step += 1;
          render({ focus: true });
        });
        options.append(button);
      }

      const nodes = [progress(state.step), title, options];

      if (state.step > 0) {
        const nav = document.createElement("div");
        nav.className = "quiz__nav";
        const back = document.createElement("button");
        back.type = "button";
        back.className = "link-button";
        back.textContent = "Назад к предыдущему вопросу";
        back.addEventListener("click", () => { state.step -= 1; render({ focus: true }); });
        nav.append(back);
        nodes.push(nav);
      }
      return nodes;
    }

    function renderResult() {
      const bean = recommend(state.answers);
      const grind = state.answers.brew;

      const wrap = document.createElement("div");
      wrap.className = "quiz__result";
      wrap.innerHTML = `
        <p class="product__origin">Вам подойдёт</p>
        <h3 class="quiz__result-name" tabindex="-1"></h3>
        <p class="product__notes"></p>
        <p class="quiz__why"></p>
        <ul class="quiz__summary"></ul>
        <div class="quiz__actions">
          <button class="button" type="button" data-add></button>
          <button class="button button--ghost" type="button" data-restart>Пройти заново</button>
        </div>`;

      wrap.querySelector(".quiz__result-name").textContent = bean.name;
      wrap.querySelector(".product__notes").textContent = bean.notes;
      wrap.querySelector(".quiz__why").textContent =
        `${ROAST_LABEL[bean.roast][0].toUpperCase() + ROAST_LABEL[bean.roast].slice(1)}, хорошо для ${bean.bestFor}. ` +
        `Смелем ${grindLabel(grind).toLowerCase()}.`;

      const summary = wrap.querySelector(".quiz__summary");
      QUIZ.forEach((q) => {
        const li = document.createElement("li");
        li.textContent = q.options.find((o) => o.value === state.answers[q.key]).title;
        summary.append(li);
      });

      const add = wrap.querySelector("[data-add]");
      add.textContent = `В корзину · 250 г · ${formatPrice(bean.prices[250])}`;
      add.addEventListener("click", () => cart.add(bean.id, 250, grind));

      wrap.querySelector("[data-restart]").addEventListener("click", () => {
        state.step = 0;
        state.answers = {};
        render({ focus: true });
      });

      return [wrap];
    }

    function render({ focus = false } = {}) {
      const done = state.step >= QUIZ.length;
      panel.replaceChildren(...(done ? renderResult() : renderQuestion()));
      if (focus) panel.querySelector("[tabindex='-1']")?.focus({ preventScroll: true });
    }

    render();
  }

  function setupCartDialog(cart) {
    const dialog = $("#cart");
    const count = $("#cart-count");
    const itemsList = $("#cart-items");
    const empty = $("#cart-empty");
    const form = $("#checkout");
    const total = $("#cart-total");
    const daysBox = $("#pickup-days");
    const timeSelect = $("#pickup-time");
    const nameInput = $("#checkout-name");
    const phoneInput = $("#checkout-phone");
    const confirmation = $("#order-confirmation");
    const toast = $("#toast");
    let toastTimer = 0;

    const longDate = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
    const shortDate = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "numeric", month: "short" });

    function open() {
      hideToast();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      renderPickupDays();
    }

    function close() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    $("#cart-open").addEventListener("click", open);
    $("#toast-open").addEventListener("click", open);
    $("#cart-close").addEventListener("click", close);
    // После закрытия (кнопкой, Esc или кликом мимо) убираем экран «Заказ принят»
    dialog.addEventListener("close", () => {
      if (!confirmation.hidden) {
        confirmation.hidden = true;
        renderItems();
      }
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });

    function showToast(text) {
      $("#toast-text").textContent = text;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, 4000);
    }

    function hideToast() {
      clearTimeout(toastTimer);
      toast.hidden = true;
    }

    function renderItems() {
      const lines = cart.lines;

      itemsList.replaceChildren(...lines.map((line) => {
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
          <div>
            <p class="cart-item__name"></p>
            <p class="cart-item__meta"></p>
          </div>
          <p class="cart-item__price"></p>
          <div class="cart-item__controls">
            <div class="qty" role="group">
              <button type="button" data-step="-1">−</button>
              <output></output>
              <button type="button" data-step="1">+</button>
            </div>
            <button class="link-button" type="button" data-remove>Удалить</button>
          </div>`;

        li.querySelector(".cart-item__name").textContent = line.bean.name;
        li.querySelector(".cart-item__meta").textContent =
          `${weightLabel(line.weight)}, ${grindLabel(line.grind).toLowerCase()} · ${formatPrice(line.price)} за пачку`;
        li.querySelector(".cart-item__price").textContent = formatPrice(line.sum);
        li.querySelector("output").textContent = line.qty;
        li.querySelector(".qty").setAttribute("aria-label", `Количество: ${line.bean.name}`);

        const [minus, plus] = li.querySelectorAll("[data-step]");
        minus.setAttribute("aria-label", "Убрать одну пачку");
        plus.setAttribute("aria-label", "Добавить ещё пачку");
        minus.disabled = line.qty <= 1;
        plus.disabled = line.qty >= cart.maxQty;
        minus.addEventListener("click", () => cart.setQty(line.key, line.qty - 1));
        plus.addEventListener("click", () => cart.setQty(line.key, line.qty + 1));
        li.querySelector("[data-remove]").addEventListener("click", () => cart.remove(line.key));
        return li;
      }));

      const hasItems = lines.length > 0;
      empty.hidden = hasItems || !confirmation.hidden;
      form.hidden = !hasItems;
      total.textContent = formatPrice(cart.total);

      count.textContent = cart.count;
      count.setAttribute("aria-label", `товаров в корзине: ${cart.count}`);
    }

    cart.subscribe((change) => {
      renderItems();
      if (change.type === "add") {
        const line = cart.lines.find((l) => l.key === change.key);
        if (!dialog.open) showToast(`${line.bean.name}, ${weightLabel(line.weight)} — в корзине`);
        count.removeAttribute("data-bump");
        void count.offsetWidth;
        count.setAttribute("data-bump", "");
      }
    });

    function pickupSlots(iso, weekday) {
      const now = nowInZone();
      const { open: opens, close: closes } = SCHEDULE[weekday];
      // Слоты ровные — :00 и :30; первый не раньше, чем успеем собрать заказ
      let earliest = opens + PICKUP.prepTime;
      if (iso === now.iso) earliest = Math.max(earliest, now.minutes + PICKUP.prepTime);
      const first = Math.ceil(earliest / PICKUP.slotStep) * PICKUP.slotStep;
      const slots = [];
      for (let t = first; t <= closes - PICKUP.lastBeforeClose; t += PICKUP.slotStep) slots.push(t);
      return slots;
    }

    const checkedDay = () => daysBox.querySelector("input:checked")?.value || "";

    function renderPickupDays() {
      const today = nowInZone().iso;
      const previous = checkedDay();
      const chips = [];

      for (let i = 0; i < PICKUP.daysAhead; i++) {
        const d = addDays(today, i);
        const free = pickupSlots(d.iso, d.day).length > 0;
        const label = document.createElement("label");
        label.className = "chip";
        label.innerHTML = '<input type="radio" name="day"><span></span>';
        const input = label.firstChild;
        input.value = d.iso;
        input.disabled = !free;
        const span = label.lastChild;
        span.textContent = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : "Послезавтра";
        const small = document.createElement("small");
        small.textContent = free ? shortDate.format(d.date).replace(".", "") : "уже закрыто";
        span.append(small);
        chips.push(label);
      }

      daysBox.replaceChildren(...chips);
      const keep = previous && daysBox.querySelector(`input[value="${previous}"]:not(:disabled)`);
      (keep || daysBox.querySelector("input:not(:disabled)")).checked = true;
      renderTimes();
    }

    function renderTimes() {
      const day = checkedDay();
      const previous = timeSelect.value;
      timeSelect.replaceChildren(new Option("Выберите время", ""));
      if (!day) return;
      const slots = pickupSlots(day, addDays(day, 0).day);
      timeSelect.append(...slots.map((t) => new Option(formatClock(t), formatClock(t))));
      if (slots.some((t) => formatClock(t) === previous)) timeSelect.value = previous;
    }

    const rules = [
      { el: daysBox, error: "#pickup-days-error", check: () => (checkedDay() ? "" : "Выберите день") },
      { el: timeSelect, error: "#pickup-time-error", check: () => (timeSelect.value ? "" : "Выберите, во сколько заберёте заказ") },
      { el: nameInput, error: "#checkout-name-error", check: () => (nameInput.value.trim().length >= 2 ? "" : "Напишите имя, хотя бы две буквы") },
      { el: phoneInput, error: "#checkout-phone-error", check: () => (phoneInput.value.replace(/\D/g, "").length === 11 ? "" : "Номер должен быть из 11 цифр, например +7 (900) 123-45-67") }
    ];

    function showError(rule, message) {
      rule.el.setAttribute("aria-invalid", message ? "true" : "false");
      $(rule.error).textContent = message;
    }

    function recheckInvalid() {
      rules.forEach((rule) => {
        if (rule.el.getAttribute("aria-invalid") === "true") showError(rule, rule.check());
      });
    }

    form.addEventListener("change", (event) => {
      if (event.target.name === "day") renderTimes();
      recheckInvalid();
    });
    form.addEventListener("input", recheckInvalid);
    phoneInput.addEventListener("input", () => { phoneInput.value = formatPhone(phoneInput.value); });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;
      for (const rule of rules) {
        const message = rule.check();
        showError(rule, message);
        if (message && !firstInvalid) firstInvalid = rule.el;
      }
      if (firstInvalid) {
        (firstInvalid.matches("input, select") ? firstInvalid : firstInvalid.querySelector("input:not(:disabled)")).focus();
        return;
      }

      const day = addDays(checkedDay(), 0);
      const isToday = day.iso === nowInZone().iso;
      const orderNumber = 1000 + Math.floor(Math.random() * 9000);
      const packs = cart.count;

      $("#order-title").textContent = `Заказ № ${orderNumber} принят`;
      $("#order-summary").textContent =
        `${nameInput.value.trim()}, соберём ${packs} ${plural(packs, "пачку", "пачки", "пачек")} ` +
        `на ${formatPrice(cart.total)} к ${timeSelect.value}, ${isToday ? "сегодня" : longDate.format(day.date)}. ` +
        `Назовите у бара номер заказа, оплата при получении.`;

      cart.clear();
      form.reset();
      rules.forEach((rule) => showError(rule, ""));
      confirmation.hidden = false;
      empty.hidden = true;
      $("#order-title").focus();
    });

    $("#order-done").addEventListener("click", () => {
      confirmation.hidden = true;
      renderItems();
      close();
    });
  }

  function setupHeaderTheme() {
    const header = $("#site-header");
    const darkPart = $(".hero__grid");
    let queued = false;

    // Шапка тёмная, пока под ней тёмная часть первого экрана (без зоны перехода)
    function update() {
      queued = false;
      const onDark = darkPart.getBoundingClientRect().bottom > header.offsetHeight;
      header.classList.toggle("site-header--on-dark", onDark);
    }

    window.addEventListener("scroll", () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  function setupHeroBeans() {
    const canvas = $("#hero-canvas");
    const hero = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const PALETTE = ["#5a3524", "#6b3f2a", "#4a2b1d", "#7a4a32", "#3d2318"];
    let beans = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();

    // Простой детерминированный генератор, чтобы раскладка не «прыгала» при ресайзе
    function random(seed) {
      let x = seed;
      return () => {
        x = (x * 1664525 + 1013904223) >>> 0;
        return x / 4294967296;
      };
    }

    function createBeans() {
      const rand = random(12);
      const count = Math.round(Math.min(70, (width * height) / 16000));
      beans = Array.from({ length: count }, () => {
        const depth = 0.35 + rand() * 0.65; // 0.35 — дальние, 1 — ближние
        return {
          x: rand() * width,
          y: rand() * height,
          size: 9 + depth * 16,
          depth,
          angle: rand() * Math.PI * 2,
          spin: (rand() - 0.5) * 0.15,
          speed: 8 + depth * 18,
          sway: rand() * Math.PI * 2,
          color: PALETTE[Math.floor(rand() * PALETTE.length)]
        };
      });
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      createBeans();
      draw(0);
    }

    function drawBean(bean, offsetY) {
      const w = bean.size;
      const h = bean.size * 0.68;
      ctx.save();
      ctx.translate(bean.x, bean.y + offsetY);
      ctx.rotate(bean.angle);
      ctx.globalAlpha = 0.35 + bean.depth * 0.55;

      ctx.fillStyle = bean.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 220, 190, 0.08)";
      ctx.beginPath();
      ctx.ellipse(-w * 0.15, -h * 0.35, w * 0.6, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(20, 10, 6, 0.75)";
      ctx.lineWidth = Math.max(1, w * 0.12);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-w * 0.85, 0);
      ctx.bezierCurveTo(-w * 0.3, -h * 0.35, w * 0.3, h * 0.35, w * 0.85, 0);
      ctx.stroke();
      ctx.restore();
    }

    function draw(dt) {
      ctx.clearRect(0, 0, width, height);
      const scroll = Math.min(window.scrollY, height);

      for (const bean of beans) {
        if (dt) {
          bean.y += bean.speed * dt;
          bean.sway += dt * 0.6;
          bean.x += Math.sin(bean.sway) * bean.depth * 4 * dt;
          bean.angle += bean.spin * dt;
          if (bean.y > height + 40) {
            bean.y = -40;
            bean.x = Math.random() * width;
          }
        }
        // ближние зёрна уезжают при прокрутке быстрее дальних
        drawBean(bean, -scroll * bean.depth * 0.35);
      }
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(frame);
      if (reducedMotion.matches || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }).observe(hero);

    document.addEventListener("visibilitychange", start);
    reducedMotion.addEventListener("change", () => { draw(0); start(); });

    // При отключённой анимации параллакс всё равно перерисовываем на прокрутке
    window.addEventListener("scroll", () => {
      if (reducedMotion.matches && visible) draw(0);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();
    start();
  }

  renderOpenStatus();
  setInterval(renderOpenStatus, 60 * 1000);
  setupHeaderTheme();
  setupHeroBeans();
  setupMenu();
  renderRoastDates();
  const cart = createCart();
  setupShop(cart);
  setupQuiz(cart);
  setupCartDialog(cart);
})();
