sap.ui.define([
  "sap/m/MessageToast"
], (MessageToast) => {
  "use strict";

  function getDataUser(oController, userId) {
    if (!oController || !userId) {
      return;
    }

    const readUrlModelGroup = `/cust_GD_mantenedorGrupos('${userId}')`;
    const oViewModel = oController.getView().getModel();

    oViewModel.read(readUrlModelGroup, {
      success: function (oData) {
        const oUserModel = oController.getOwnerComponent().getModel("user");
        const cleanData = JSON.parse(JSON.stringify(oData));

        oUserModel.setProperty("/datos", cleanData);
        oUserModel.setProperty("/displayName", cleanData.displayName);

        if (cleanData.gender === "F") {
          oUserModel.setProperty("/gender", "genero_Femenino");
        } else {
          oUserModel.setProperty("/gender", "genero_Masculino");
        }

        const grupo = cleanData.cust_grupo;
        oUserModel.setProperty("/grupo", grupo);

        if (grupo === "Gestor Documental - Administradores") {
          oUserModel.setProperty("/permisos", "admin");
        } else if (grupo === "Gestor Documental - Usuarios") {
          oUserModel.setProperty("/permisos", "usuario");
        } else {
          oUserModel.setProperty("/permisos", "ninguno");
        }

        const permisos = oUserModel.getProperty("/permisos");
        const oGrid = oController.byId("gridItems");

        const oButtonSalida = oController.byId("customListItemSalida");
        const oButtonCartasM = oController.byId("customListItemCartasM");
        const oButtonCartasA = oController.byId("customListItemCartasA");
        const oButtonAmonestacion = oController.byId("customListItemAmonestacion");
        const oButtonAusenInjus = oController.byId("customListItemAuseInjus");
        const oButtonDeshausio = oController.byId("customListItemDeshausio");
        const oButtonCertEx = oController.byId("customCertificadoEx");
        const oButtonContrato = oController.byId("customListItemContrato");
        const oButtonConfiden = oController.byId("customListItemConfidencialidad");
        const oButtonCartMensualUsuario = oController.byId("customListItemcartaMensualUsuario");
        const oButtonCartAnualUsuario = oController.byId("customListItemCartaAnualUsuario");

        const aUserOnly = [
          oButtonCartMensualUsuario,
          oButtonCartAnualUsuario
        ];

        if (permisos === "admin") {
          aUserOnly.forEach(oItem => {
            if (oItem && oGrid) {
              oGrid.removeContent(oItem);
            }
          });

          oButtonSalida?.setVisible(true);
          oButtonCartasM?.setVisible(true);
          oButtonCartasA?.setVisible(true);
          oButtonAmonestacion?.setVisible(true);
          oButtonAusenInjus?.setVisible(true);
          oButtonDeshausio?.setVisible(true);
          oButtonCertEx?.setVisible(true);
          oButtonContrato?.setVisible(true);
          oButtonConfiden?.setVisible(true);
        } else if (permisos === "usuario") {
          oButtonCartMensualUsuario?.setVisible(true);
          oButtonCartAnualUsuario?.setVisible(true);

          oButtonSalida?.setVisible(false);
          oButtonCartasM?.setVisible(false);
          oButtonCartasA?.setVisible(false);
          oButtonAmonestacion?.setVisible(false);
          oButtonAusenInjus?.setVisible(false);
          oButtonDeshausio?.setVisible(false);
          oButtonCertEx?.setVisible(false);
          oButtonContrato?.setVisible(false);
          oButtonConfiden?.setVisible(false);
        }
      },
      error: function (oError) {
        MessageToast.show("Error al leer grupo de usuario");
        console.log(oError);
      }
    });
  }

  return {
    getDataUser
  };
});
