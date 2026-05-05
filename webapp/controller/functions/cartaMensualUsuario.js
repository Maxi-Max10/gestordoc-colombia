sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], (JSONModel, MessageToast) => {
  "use strict";

  function onDownloadCartaMensualUsuario(oController, oEvent) {
    if (!oController) {
      return;
    }

    const oBusyDialog = oController.oGlobalBusyDialog;
    if (oBusyDialog) {
      oBusyDialog.open();
    }

    const oButton = oEvent?.getSource?.();
    const sButtonId = oButton?.getId();
    const oUserModel = oController.getOwnerComponent().getModel("user");
    const userId = oUserModel?.getProperty("/firstname");
    const oComponentModel = oController.getOwnerComponent().getModel();

    if (!userId || !oComponentModel) {
      MessageToast.show("No se encontró información del usuario.");
      if (oBusyDialog) {
        oBusyDialog.close();
      }
      return;
    }

    const readUsers = new Promise((resolve, reject) => {
      oComponentModel.read("/User", {
        urlParameters: {
          "$select": "userId,status,manager/jobCode,firstName,empInfo/customDate1,lastName,jobCode,email,nationality,jobCode,title,custom02,businessPhone,state,custom10,hireDate,country,salutation,empInfo/personNav/nationalIdNav/nationalId,empInfo/compInfoNav,empInfo/personNav,empInfo/startDate,empInfo/endDate,empInfo/jobInfoNav/eventReason,division,department,gender",
          "$filter": `userId eq '${userId}'`,
          "$expand": `manager,empInfo,
            empInfo/compInfoNav,
            empInfo/jobInfoNav,
            empInfo/personNav,
            empInfo/personNav/nationalIdNav,
            empInfo/compInfoNav/empPayCompRecurringNav,
            empInfo/personNav/personalInfoNav`
        },
        success: function (oData) {
          resolve(oData.results || []);
        },
        error: function (oError) {
          console.error("Error cargando /User:", oError);
          reject(oError);
        }
      });
    });

    const readMDF = new Promise((resolve, reject) => {
      oComponentModel.read("/cust_GD_mantenedorDatos", {
        success: function (oData) {
          resolve(oData.results || []);
        },
        error: function (oError) {
          console.error("Error cargando MDF:", oError);
          reject(oError);
        }
      });
    });

    Promise.all([readUsers, readMDF]).then(([aUsers, aMDF]) => {
      oController.aMDF = aMDF;
      oController.sFechaDGT3 = aMDF.length > 0 ? aMDF[0].cust_fechaDGT3 : null;

      const enrichedUsers = aUsers.map(user => {
        const compInfo = user.empInfo?.compInfoNav?.results?.[0];
        const recurring = compInfo?.empPayCompRecurringNav?.results?.[0];
        const rawSal = recurring?.paycompvalue;

        let salarioBase = 0;
        if (rawSal && !isNaN(Number(rawSal))) {
          salarioBase = Number(rawSal);
        }

        user.paycompValue = salarioBase;
        user.sueldoNumeros = salarioBase > 0
          ? `RD$ ${salarioBase.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "No disponible";

        const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
        const targetObject = nationalIdResults.find(item => item.cardType === "ZC" || item.cardType === "ZP");
        user.nationalId = targetObject?.nationalId ?? "";

        if (user.salutation === "3526") {
          user.salut = "Sra.";
        } else if (user.salutation === "3525") {
          user.salut = "Sr.";
        } else {
          user.salut = "Srta.";
        }

        
        user.customLong1 = user.empInfo?.personNav?.customLong1 || "";
        const marriageStatusId = user.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
        user.marriageStatusId = marriageStatusId;
        const isFemale = user.gender === "F";

        if (isFemale) {
          switch (marriageStatusId) {
            case "3528": user.marriageStatus = "divorciada"; break;
            case "3530": user.marriageStatus = "casada"; break;
            case "3529": user.marriageStatus = "separada"; break;
            case "3531": user.marriageStatus = "soltera"; break;
            case "3532": user.marriageStatus = "viuda"; break;
            case "3533": user.marriageStatus = "unión libre"; break;
            default: user.marriageStatus = ""; break;
          }
        } else {
          switch (marriageStatusId) {
            case "3528": user.marriageStatus = "divorciado"; break;
            case "3530": user.marriageStatus = "casado"; break;
            case "3529": user.marriageStatus = "separado"; break;
            case "3531": user.marriageStatus = "soltero"; break;
            case "3532": user.marriageStatus = "viudo"; break;
            case "3533": user.marriageStatus = "unión libre"; break;
            default: user.marriageStatus = ""; break;
          }
        }

        return user;
      });

      oController.getView().setModel(new JSONModel({ User: enrichedUsers }));
      oController.attachBoxEvents();
      oController.onDownloadPDFCartaMensual(sButtonId, enrichedUsers);

      if (oBusyDialog) {
        oBusyDialog.close();
      }
    }).catch(oError => {
      console.error("Error cargando datos:", oError);
      MessageToast.show("Error cargando los datos del usuario.");
      if (oBusyDialog) {
        oBusyDialog.close();
      }
    });
  }

  return {
    onDownloadCartaMensualUsuario
  };
});
