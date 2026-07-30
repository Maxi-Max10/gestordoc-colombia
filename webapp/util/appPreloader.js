(function () {
  "use strict";

  var oTimer = null;
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
  }

  window.gmaHoldAppPreloader = function () {
    // El preload inicial queda visible hasta que el controller llama a gmaHideAppPreloader().
  };

  window.gmaSetAppPreloaderStatus = function (sStatus, sCopy, iValue) {
    var oPreloader = document.getElementById("appPreloader");
    if (!oPreloader) {
      return;
    }

    var oStatus = oPreloader.querySelector(".appPreloader__status");
    var oCopy = oPreloader.querySelector(".appPreloader__copy");

    if (oStatus && sStatus) {
      oStatus.textContent = sStatus;
    }

    if (oCopy && sCopy) {
      oCopy.textContent = sCopy;
    }

    if (typeof iValue === "number") {
      iTarget = Math.max(iTarget, Math.min(99, iValue));
      updateProgress(iTarget);
    }
  };

  window.gmaShowAppPreloaderError = function (sStatus, sCopy) {
    var oPreloader = document.getElementById("appPreloader");
    if (!oPreloader) {
      return;
    }

    window.clearInterval(oTimer);
    oPreloader.classList.add("is-error");
    var sErrorStatus = sStatus || "No se pudo iniciar la aplicación";
    var sErrorCopy = sCopy || "";
    oPreloader.setAttribute("aria-label", sErrorStatus);

    var oStatus = oPreloader.querySelector(".appPreloader__status");
    var oCopy = oPreloader.querySelector(".appPreloader__copy");

    if (oStatus) {
      oStatus.textContent = sErrorStatus;
    }
    if (oCopy) {
      oCopy.textContent = sErrorCopy;
      oCopy.hidden = !sErrorCopy;
    }
  };

  window.gmaHideAppPreloader = function () {
    var oPreloader = document.getElementById("appPreloader");
    if (!oPreloader || oPreloader.classList.contains("is-hiding")) {
      return;
    }

    window.clearInterval(oTimer);
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
