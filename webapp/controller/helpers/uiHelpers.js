sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Actualiza el saludo según la hora actual del día.
         * @param {sap.ui.core.mvc.View} oView - La vista desde donde se accederá al control del texto.
         */
        updateGreeting: function (oView) {

            // Obtiene la hora actual del sistema (0–23)
            var currentHour = new Date().getHours();
            var greetingText = "";

            // Determina el saludo dependiendo del rango horario
            if (currentHour >= 1 && currentHour < 12) {
                greetingText = "¡Buenos Días!";
            } else if (currentHour >= 12 && currentHour <= 19) {
                greetingText = "¡Buenas Tardes!";
            } else {
                greetingText = "¡Buenas Noches!";
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

        /**
         * Agrega eventos de hover y click a las “cajas” (CustomListItem).
         * Garantiza que los eventos se configuren solo una vez.
         * @param {sap.ui.core.mvc.Controller} context - El controlador desde donde se ejecuta.
         */
        attachBoxEvents: function (context) {

            // Evita registrar los eventos dos veces
            if (context._tilesEventsAttached) {
                return;
            }
            context._tilesEventsAttached = true;

            const view = context.getView();

            // Mapea cada box con su ID en la vista y su título asociado
            const boxMap = [
                { id: "customListItemCartasM", title: "Cartas De Trabajo Mensual" },
                { id: "customListItemCartasA", title: "Cartas De Trabajo Anual" },
                { id: "customListItemCertificado", title: "Certificado Laboral" },
                { id: "customListItemConfidencialidad", title: "Confidencialidad" },
                { id: "customListItemContrato", title: "Contrato De Trabajo" },
                { id: "customListItemSalida", title: "Notificación Salida Ministerio" },
                { id: "customListItemAmonestacion", title: "Notificación De Amonestación" },
                { id: "customListItemPasantes", title: "Contrato Pasantes" },
                { id: "customListItemTemporeros", title: "Contrato Temporeros" },
                { id: "customCertificadoEx", title: "Certificado Laboral Excolaborador" }
            ];

            // Recorre cada box del mapa
            boxMap.forEach(box => {

                // Obtiene el item por ID desde la vista
                const oItem = view.byId(box.id);

                // Si el item no existe, muestra advertencia y continúa
                if (!oItem) {
                    console.warn("No se encontró el CustomListItem con ID:", box.id);
                    return;
                }

                // Agrega la clase visual para hover
                oItem.addStyleClass("boxHover");

                /**
                 * Registra un evento click en cada box.
                 * Cuando se hace click:
                 *  - Se guarda el tipo de contrato seleccionado.
                 *  - Se llama a _handleTileSelection() para cargar datos o navegar.
                 */
                oItem.attachBrowserEvent("click", () => {

                    // Guarda internamente el título seleccionado
                    context.sSelectedContract = box.title;

                    // Ejecuta el handler principal con manejo de errores
                    context._handleTileSelection(box.title).catch(oError => {
                        console.error("Error al preparar la selección:", oError);
                        sap.m.MessageToast.show("Error cargando los datos.");
                    });
                });
            });

            /**
             * Para estos dos CustomListItem especiales, solo se agrega hover,
             * pero NO se registra el evento click.
             */
            ["customListItemDeshausio", "customListItemAuseInjus"].forEach(sId => {
                const oItem = view.byId(sId);
                if (oItem) {
                    oItem.addStyleClass("boxHover");
                }
            });
        }
    };
});
