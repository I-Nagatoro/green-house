/* ============================================================
   Модуль интерфейса — рендер, меню, корзина, тост, форма.
   Инициализация: window.UI.init() (вызывается из main.js).
   ============================================================ */

(function () {
  "use strict";

  var DEFAULT_CART_BUTTON_TEXT = "В корзину";
  var NEWSLETTER_NOTE_DEFAULT = "Без спама. Только растения и хорошие новости.";
  var NEWSLETTER_NOTE_SUCCESS = "Готово! Промокод на скидку 10% отправим на вашу почту 🌿";

  function formatPrice(value) {
    return value.toLocaleString("ru-RU") + " ₽";
  }

  function formatQty(price, qty) {
    return formatPrice(price) + " × " + qty;
  }

  /* ---------- Рендер каталога ---------- */

  function productCardTemplate(product) {
    return (
      '<article class="product-card">' +
      '<div class="product-visual">' +
      '<div class="plant-emoji" role="img" aria-label="' + product.name + '">' + product.emoji + "</div>" +
      "</div>" +
      '<div class="product-body">' +
      '<span class="product-tag">' + product.tag + "</span>" +
      "<h3>" + product.name + "</h3>" +
      '<p class="product-description">' + product.description + "</p>" +
      '<div class="product-bottom">' +
      '<div class="product-meta">' +
      '<span class="price">' + formatPrice(product.price) + "</span>" +
      '<span class="care">' + product.care + "</span>" +
      "</div>" +
      '<button class="btn btn-cart add-to-cart" type="button" data-product="' + product.id + '">' +
      DEFAULT_CART_BUTTON_TEXT +
      "</button>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderProducts(grid) {
    var products = window.PRODUCTS || [];
    grid.innerHTML = products.map(productCardTemplate).join("");
  }

  /* ---------- Корзина: рендер ---------- */

  function cartItemTemplate(item) {
    return (
      '<div class="cart-item" data-product-id="' + item.productId + '">' +
      '<span class="cart-item-emoji" aria-hidden="true">' + item.emoji + "</span>" +
      "<div>" +
      '<p class="cart-item-name">' + item.name + "</p>" +
      '<p class="cart-item-price">' + formatQty(item.price, item.qty) + "</p>" +
      "</div>" +
      '<div class="cart-item-qty">' +
      '<button class="qty-btn" type="button" data-action="dec" aria-label="Уменьшить количество: ' + item.name + '">−</button>' +
      '<span class="qty-value">' + item.qty + "</span>" +
      '<button class="qty-btn" type="button" data-action="inc" aria-label="Увеличить количество: ' + item.name + '">+</button>' +
      '<button class="cart-item-remove" type="button" data-action="remove" aria-label="Удалить из корзины: ' + item.name + '">Удалить</button>' +
      "</div>" +
      "</div>"
    );
  }

  function renderCart() {
    var items = window.Cart.getItems();
    var count = window.Cart.getCount();
    var list = document.getElementById("cartItems");
    var empty = document.getElementById("cartEmpty");
    var total = document.getElementById("cartTotal");
    var counter = document.getElementById("cartCount");

    if (counter) {
      counter.textContent = count;
    }
    if (list) {
      list.innerHTML = items.map(cartItemTemplate).join("");
    }
    if (empty) {
      empty.hidden = items.length !== 0;
    }
    if (total) {
      total.textContent = formatPrice(window.Cart.getTotal());
    }
  }

  /* ---------- Тост ---------- */

  var toastTimer = null;

  function showToast(message) {
    var toast = document.getElementById("toast");
    var toastMessage = document.getElementById("toastMessage");

    if (!toast || !toastMessage) {
      return;
    }

    toastMessage.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  /* ---------- Меню ---------- */

  function toggleMenu(open) {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("mainNav");

    if (!toggle || !nav) {
      return;
    }

    var isOpen = typeof open === "boolean" ? open : toggle.getAttribute("aria-expanded") !== "true";

    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", isOpen);
  }

  function closeMenu() {
    var toggle = document.getElementById("menuToggle");
    if (toggle && toggle.getAttribute("aria-expanded") === "true") {
      toggleMenu(false);
    }
  }

  /* ---------- Drawer корзины ---------- */

  function openCart() {
    var drawer = document.getElementById("cartDrawer");
    var backdrop = document.getElementById("cartBackdrop");
    var button = document.getElementById("cartButton");
    var closeButton = document.getElementById("cartClose");

    if (!drawer || !backdrop) {
      return;
    }

    renderCart();
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    if (button) {
      button.setAttribute("aria-expanded", "true");
    }
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeCart() {
    var drawer = document.getElementById("cartDrawer");
    var backdrop = document.getElementById("cartBackdrop");
    var button = document.getElementById("cartButton");

    if (!drawer || !backdrop) {
      return;
    }

    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  }

  /* ---------- Обработчики событий ---------- */

  function handleAddToCart(event) {
    var button = event.target.closest(".add-to-cart");
    if (!button) {
      return;
    }

    var productId = button.dataset.product;
    var product = (window.PRODUCTS || []).find(function (p) {
      return p.id === productId;
    });
    if (!product) {
      return;
    }

    window.Cart.add(productId);
    renderCart();

    // Блокируем кнопку на время анимации — исключаем гонку таймеров
    button.textContent = "Добавлено ✓";
    button.disabled = true;
    setTimeout(function () {
      button.textContent = DEFAULT_CART_BUTTON_TEXT;
      button.disabled = false;
    }, 1400);

    showToast(product.name + " добавлено в корзину");
  }

  function handleCartItemClick(event) {
    var actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    var itemElement = actionButton.closest(".cart-item");
    if (!itemElement) {
      return;
    }

    var productId = itemElement.dataset.productId;
    var action = actionButton.dataset.action;
    var current = window.Cart.items.find(function (item) {
      return item.productId === productId;
    });

    if (action === "inc" && current) {
      window.Cart.setQty(productId, current.qty + 1);
    } else if (action === "dec" && current) {
      window.Cart.setQty(productId, current.qty - 1);
    } else if (action === "remove") {
      window.Cart.remove(productId);
    }

    renderCart();
  }

  function handleEscape(event) {
    if (event.key !== "Escape") {
      return;
    }
    var drawer = document.getElementById("cartDrawer");
    if (drawer && drawer.classList.contains("is-open")) {
      closeCart();
    }
    closeMenu();
  }

  function initNewsletter() {
    var form = document.getElementById("newsletterForm");
    var note = document.getElementById("formNote");
    var email = document.getElementById("email");

    if (!form || !note || !email) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!email.checkValidity()) {
        email.reportValidity();
        return;
      }
      note.textContent = NEWSLETTER_NOTE_SUCCESS;
      form.reset();
    });

    // Возвращаем подпись формы, как только пользователь снова начал ввод
    email.addEventListener("input", function () {
      note.textContent = NEWSLETTER_NOTE_DEFAULT;
    });
  }

  /* ---------- Инициализация ---------- */

  function init() {
    var productsGrid = document.getElementById("productsGrid");
    var currentYear = document.getElementById("currentYear");
    var cartButton = document.getElementById("cartButton");
    var cartCloseButton = document.getElementById("cartClose");
    var cartClearButton = document.getElementById("cartClear");
    var cartBackdrop = document.getElementById("cartBackdrop");
    var cartItemsList = document.getElementById("cartItems");
    var menuToggle = document.getElementById("menuToggle");
    var mainNav = document.getElementById("mainNav");

    if (currentYear) {
      currentYear.textContent = new Date().getFullYear();
    }

    if (productsGrid) {
      renderProducts(productsGrid);
    }
    renderCart();

    // Делегирование: обработчик один на документ, кнопки рендерятся динамически
    document.addEventListener("click", handleAddToCart);

    if (cartItemsList) {
      cartItemsList.addEventListener("click", handleCartItemClick);
    }
    if (cartButton) {
      cartButton.addEventListener("click", openCart);
    }
    if (cartCloseButton) {
      cartCloseButton.addEventListener("click", closeCart);
    }
    if (cartClearButton) {
      cartClearButton.addEventListener("click", function () {
        window.Cart.clear();
        renderCart();
      });
    }
    if (cartBackdrop) {
      cartBackdrop.addEventListener("click", closeCart);
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        toggleMenu();
      });
    }
    if (mainNav) {
      mainNav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          closeMenu();
        }
      });
    }

    document.addEventListener("keydown", handleEscape);

    initNewsletter();
  }

  window.UI = {
    init: init
  };
})();