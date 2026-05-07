(function () {
  "use strict";

  var oTimer = null;
  var oFailsafeTimer = null;
  var iProgress = 8;
  var iTarget = 84;

  function updateProgress(iValue) {
    var oPreloader = document.getElementById("appPreloader");
    if (!oPreloader) {
      return;
    }

    var oBar = oPreloader.querySelector(".appPreloader__bar");
    var oPercent = oPreloader.querySelector(".appPreloader__percent");
    var iSafeValue = Math.max(0, Math.min(100, Math.round(iValue)));

    if (oBar) {
      oBar.style.width = iSafeValue + "%";
    }

    if (oPercent) {
      oPercent.textContent = iSafeValue + "%";
    }
  }

  function startProgress() {
    updateProgress(iProgress);

    oTimer = window.setInterval(function () {
      if (iProgress < iTarget) {
        iProgress += Math.max(1, Math.round((iTarget - iProgress) * 0.12));
        updateProgress(iProgress);
      } else if (iTarget < 94) {
        iTarget += 1;
      }
    }, 280);

    oFailsafeTimer = window.setTimeout(function () {
      if (typeof window.gmaHideAppPreloader === "function") {
        window.gmaHideAppPreloader();
      }
    }, 9000);
  }

  window.gmaHideAppPreloader = function () {
    var oPreloader = document.getElementById("appPreloader");
    if (!oPreloader || oPreloader.classList.contains("is-hiding")) {
      return;
    }

    window.clearInterval(oTimer);
    window.clearTimeout(oFailsafeTimer);
    updateProgress(100);

    window.setTimeout(function () {
      oPreloader.classList.add("is-hiding");
    }, 260);

    window.setTimeout(function () {
      if (oPreloader && oPreloader.parentNode) {
        oPreloader.parentNode.removeChild(oPreloader);
      }
    }, 850);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startProgress);
  } else {
    startProgress();
  }
}());
