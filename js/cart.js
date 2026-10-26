/* ============================================================
   Модуль корзины — состояние и операции.
   Хранилище: localStorage (переживает перезагрузку страницы).
   API доступен глобально как window.Cart.
   ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "zeleny-dom-cart";

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Не удалось прочитать корзину из localStorage:", error);
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Не удалось сохранить корзину:", error);
    }
  }

  function findIndex(items, productId) {
    return items.findIndex(function (item) {
      return item.productId === productId;
    });
  }

  var Cart = {
    items: load(),

    /* Общее количество единиц товаров */
    getCount: function () {
      return this.items.reduce(function (sum, item) {
        return sum + item.qty;
      }, 0);
    },

    /* Позиции корзины, обогащённые данными из каталога */
    getItems: function () {
      var products = window.PRODUCTS || [];
      return this.items.map(function (item) {
        var product = products.find(function (p) {
          return p.id === item.productId;
        }) || {};
        return {
          productId: item.productId,
          qty: item.qty,
          name: product.name || item.productId,
          price: product.price || 0,
          emoji: product.emoji || "🌿"
        };
      });
    },

    /* Итоговая сумма */
    getTotal: function () {
      return this.getItems().reduce(function (sum, item) {
        return sum + item.price * item.qty;
      }, 0);
    },

    /* Добавить товар (по умолчанию 1 шт.) */
    add: function (productId, qty) {
      var amount = typeof qty === "number" && qty > 0 ? qty : 1;
      var index = findIndex(this.items, productId);

      if (index === -1) {
        this.items.push({ productId: productId, qty: amount });
      } else {
        this.items[index].qty += amount;
      }
      save(this.items);
    },

    /* Установить количество; при qty <= 0 позиция удаляется */
    setQty: function (productId, qty) {
      var index = findIndex(this.items, productId);
      if (index === -1) {
        return;
      }
      if (qty <= 0) {
        this.remove(productId);
        return;
      }
      this.items[index].qty = qty;
      save(this.items);
    },

    remove: function (productId) {
      this.items = this.items.filter(function (item) {
        return item.productId !== productId;
      });
      save(this.items);
    },

    clear: function () {
      this.items = [];
      save(this.items);
    }
  };

  window.Cart = Cart;
})();