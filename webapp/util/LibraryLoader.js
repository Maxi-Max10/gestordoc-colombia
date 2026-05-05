sap.ui.define([
    "sap/base/Log"
], function (Log) {
    "use strict";

    const mPromises = Object.create(null);
    const DATA_ATTR = "data-gestordoccolombia-lib-url";

    const loadScript = function (sUrl) {
        return new Promise((resolve, reject) => {
            const oExisting = document.querySelector(`script[${DATA_ATTR}="${sUrl}"]`);
            if (oExisting) {
                if (oExisting.getAttribute("data-loaded") === "true") {
                    resolve();
                    return;
                }
                oExisting.addEventListener("load", resolve, { once: true });
                oExisting.addEventListener("error", () => reject(new Error(`Failed to load script ${sUrl}`)), { once: true });
                return;
            }

            const oScript = document.createElement("script");
            oScript.src = sUrl;
            oScript.async = true;
            oScript.setAttribute(DATA_ATTR, sUrl);

            oScript.addEventListener("load", () => {
                oScript.setAttribute("data-loaded", "true");
                resolve();
            }, { once: true });

            oScript.addEventListener("error", () => {
                Log.error(`Could not load external library from ${sUrl}`);
                reject(new Error(`Failed to load script ${sUrl}`));
            }, { once: true });

            document.head.appendChild(oScript);
        });
    };

    const ensureLibrary = function (sKey, mConfig) {
        const {
            url: sUrl,
            globalName: sGlobalName,
            validator: fnValidator,
            onAfterLoad: fnAfterLoad
        } = mConfig || {};

        if (sGlobalName && typeof window[sGlobalName] !== "undefined") {
            if (typeof fnValidator === "function" && !fnValidator(window[sGlobalName])) {
                Log.error(`Validation failed for already loaded library ${sKey}.`);
            } else {
                return Promise.resolve(window[sGlobalName]);
            }
        }

        if (!mPromises[sKey]) {
            mPromises[sKey] = loadScript(sUrl).then(() => {
                const oExport = sGlobalName ? window[sGlobalName] : undefined;
                if (typeof fnValidator === "function" && !fnValidator(oExport)) {
                    throw new Error(`Validation failed for library ${sKey}.`);
                }
                if (typeof fnAfterLoad === "function") {
                    const vResult = fnAfterLoad(oExport);
                    return typeof vResult === "undefined" ? oExport : vResult;
                }
                return oExport;
            });
        }

        return mPromises[sKey];
    };

    return {
        ensureLibrary,
        loadScript
    };
});
