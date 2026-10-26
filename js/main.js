/* ============================================================
   Точка входа приложения.
   Скрипты подключены с defer, поэтому DOM готов к моменту вызова.
   Порядок: products.js → cart.js → ui.js → main.js
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    window.UI.init();
  });
})();