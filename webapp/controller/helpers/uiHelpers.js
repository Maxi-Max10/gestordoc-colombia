sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Actualiza el saludo según la hora actual del día.
         * @param {sap.ui.core.mvc.View} oView - La vista desde donde se accederá al control del texto.
         */
        updateGreeting: function (oView, sFirstName) {

            // Obtiene la hora actual del sistema (0–23)
            var currentHour = new Date().getHours();
            var greetingText = "";
            var firstName = String(sFirstName || "").trim().split(/\s+/)[0] || "";

            // Determina el saludo dependiendo del rango horario
            if (currentHour >= 1 && currentHour < 12) {
                greetingText = "¡Buenos Días" + (firstName ? ", " + firstName : "") + "!";
            } else if (currentHour >= 12 && currentHour <= 19) {
                greetingText = "¡Buenas Tardes" + (firstName ? ", " + firstName : "") + "!";
            } else {
                greetingText = "¡Buenas Noches" + (firstName ? ", " + firstName : "") + "!";
            }

            // Coloca el texto calculado en el elemento con ID "greetingText"
            oView.byId("greetingText").setText(greetingText);

            var oDateText = oView.byId("bannerDateText");
            if (oDateText) {
                var currentDate = new Date();
                var formattedDate = currentDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
                oDateText.setText(formattedDate);
            }
        },

    };
});
