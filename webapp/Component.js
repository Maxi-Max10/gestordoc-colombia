sap.ui.define([
    "sap/ui/core/UIComponent",
    "gestordoccolombia/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("gestordoccolombia.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            sap.ui.getCore().getConfiguration().setLanguage("en");
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});