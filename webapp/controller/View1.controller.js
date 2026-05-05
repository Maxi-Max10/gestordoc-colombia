sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "gestordoccolombia/util/LibraryLoader",
  // Helpers genéricos  
  "gestordoccolombia/controller/helpers/pdfGenerator",
  "gestordoccolombia/controller/helpers/wordGenerator",
  "gestordoccolombia/controller/helpers/uiHelpers",
  "gestordoccolombia/controller/helpers/formatHelpers",
  //funciones de contratos
  "gestordoccolombia/controller/functions/confidencial",
  "gestordoccolombia/controller/functions/contrato",
  "gestordoccolombia/controller/functions/excolaborador",
  "gestordoccolombia/controller/functions/carta_mensual",
  "gestordoccolombia/controller/functions/cartaMensualUsuario",
  "gestordoccolombia/controller/functions/desahucio",
  "gestordoccolombia/controller/functions/notSalida_ministerio",
  "gestordoccolombia/controller/functions/carta_anual",
  "gestordoccolombia/controller/functions/notAmonestacion",
  "gestordoccolombia/controller/functions/notAusInjus"
], 

(Controller, JSONModel, MessageToast, LibraryLoader, pdfGenerator,wordGenerator, uiHelpers, formatHelpers, confidencial, contrato, excolaborador, carta_mensual, cartaMensualUsuario, desahucio, notSalida_ministerio, carta_anual, notAmonestacion, notAusInjus) => {
  "use strict";

  return Controller.extend("gestordoccolombia.controller.View1", {
    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },

    readModel: function (url, params) {
      var that = this;
      return new Promise((resolve, reject) => {
        this.getOwnerComponent().getModel().read(url, {
          urlParameters: params,
          success: function (oData) {
            resolve(oData);
          }.bind(this),
          error: function (oError) {
            reject(new Error("Error al leer los datos del modelo"));
          }.bind(this)
        });
      });

    },

    // ========================================
    // CATÁLOGO DE RAZONES DE EVENTOS
    // ========================================
    // Lista completa de todos los tipos de eventos laborales para mapear códigos a descripciones legibles
    aEventReasonDescriptions: [
      "Aprendiz etapa lectiva (C002)",
      "Aprendiz etapa productiva (C003)",
      "Asenso sustitución patronal (C404)",
      "Asignación organizativa (C901)",
      "Asignación organizativa (CHG_ALL_01)",
      "Aumento Legal (CA03)",
      "Aumento por Inflación (CHG_PAY_06)",
      "Aumento por Nivelación (CA06)",
      "Aumento por acuerdo Colectivo (CA04)",
      "Aumento por ley (CHG_PAY_04)",
      "Aumento por merito (CA05)",
      "Aumento por mérito (CHG_PAY_03)",
      "Aumento tabulador (CHG_PAY_02)",
      "Ausencia Temporal - Art. 140 (C801)",
      "CARGA_INICIAL (CARGA_INICIAL)",
      "Cambio a etapa prd aprendices (CA02)",
      "Cambio datos Kronos (C902)",
      "Cambio de jornada laboral (C501)",
      "Cambio de negociación Colectiva (C502)",
      "Cambio de régimen salarial (CA01)",
      "Cambio posición (CHG_POS_04)",
      "Cancelación contrato aprendizaje (CB07)",
      "Carga de datos Inicial (C099)",
      "Contrato Temporal (TER_TV_03)",
      "Contrato Temporal de Ley (TER_TV_01)",
      "Creación de Cargo (C001)",
      "Creación de Cargo (C101)",
      "Creación de Puesto (HIRE_01)",
      "Creación puesto (CHG_POS_01)",
      "Desahucio - Bajo rendimiento (TER_TH_01)",
      "Desahucio - Mutuo acuerdo (TER_TH_05)",
      "Desahucio - Reestructuración (TER_TH_03)",
      "Desahucio - Violación políticas (TER_TH_02)",
      "Desahucio-Incapacidad Enfermedad (TER_TH_04)",
      "Despido (TER_TD_01)",
      "Despido justificado (CB03)",
      "Despido sin justa causa (CB02)",
      "Dimisión-C. Injust.(ganado Emp) (TER_TI_01)",
      "Dimisión-C. Just.(Perdido Emp) (TER_TI_02)",
      "Fallecimiento (CB04)",
      "Fallecimiento (TER_TF_01)",
      "Horizontal con Traslado (C401)",
      "Horizontal sin Traslado (C402)",
      "Incapacidad - Accidente laboral (TER_TC_01)",
      "Incapacidad - Accidente personal (TER_TC_02)",
      "Migración de Datos (C504)",
      "Mutuo acuerdo (CB01)",
      "Pasantía/Aprendíz (HIRE_03)",
      "Paso a Termino Indefinido (C503)",
      "Promoción con Traslado (C301)",
      "Promoción sin Traslado (C302)",
      "Prorroga de Contrato (C903)",
      "Reemplazo Vacante (C102)",
      "Reemplazo de Posición (C004)",
      "Reestructuración (CHG_POS_05)",
      "Renuncia - Estudios (TER_TR_04)",
      "Renuncia -Liderazgo (TER_TR_05)",
      "Renuncia - Otro empleo (TER_TR_01)",
      "Renuncia - Proyectos personales (TER_TR_03)",
      "Renuncia - Salud (TER_TR_07)",
      "Renuncia - Viaje al exterior (TER_TR_02)",
      "Renuncia voluntaria (CB05)",
      "Renuncia - Crecimiento Profesional (TER_TR_06)",
      "Retiro en periodo de prueba (CB08)",
      "Reubicación Laboral (C601)",
      "Revaloración (C303)",
      "Revaloración (CHG_POS_03)",
      "Revaloración puesto (CHG_PAY_01)",
      "Sustitución (CHG_POS_02)",
      "Sustitución (HIRE_02)",
      "Sustitución patronal (C403)",
      "Terminación Laboral de Ley (TER_TV_02)",
      "Termino de Ausencia (C203)",
      "Vencimiento por término pactado (CB06)"
    ],

    // ========================================
    // SISTEMA DE BUSY DIALOG (Indicador de carga)
    // ========================================
    // Incrementa el contador y muestra el busy dialog. Usa un sistema de contador para manejar múltiples operaciones simultáneas

    _beginBusy: function () {
      if (!this.oGlobalBusyDialog) {
        return;
      }
      this._busyCounter = (this._busyCounter || 0) + 1;
      if (this._busyCounter === 1) {
        this.oGlobalBusyDialog.open();
      }
    },

    _endBusy: function () {
      if (!this.oGlobalBusyDialog) {
        return;
      }
      this._busyCounter = Math.max((this._busyCounter || 1) - 1, 0);
      if (this._busyCounter === 0) {
        this.oGlobalBusyDialog.close();
      }
    },

    _withBusy: function (fn) {
      this._beginBusy();
      return Promise.resolve()
        .then(fn)
        .finally(() => {
          this._endBusy();
        });
    },


    // ========================================
    // CARGA DE LIBRERÍAS EXTERNAS
    // ========================================
    _ensurePdfToolkit: function () {
      if (!this._pdfToolkitPromise) {// Si ya está en proceso de carga, retorna la promesa existente
        this._pdfToolkitPromise = Promise.all([
          // Carga pdf-lib desde CDN
          LibraryLoader.ensureLibrary("pdf-lib", {
            url: "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
            globalName: "PDFLib",
            validator: lib => !!lib && typeof lib.PDFDocument === "function"
          }),
          // Carga html2canvas desde CDN
          LibraryLoader.ensureLibrary("html2canvas", {
            url: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            globalName: "html2canvas",
            validator: fn => typeof fn === "function"
          })
        ]).then(() => {
          this._pdfLibRef = window.PDFLib;
          this._html2canvasRef = window.html2canvas;
          return {
            PDFLib: this._pdfLibRef,
            html2canvas: this._html2canvasRef
          };
        });
      }

      return this._pdfToolkitPromise;
    },

    _ensureDocxLib: function () {
      if (!this._docxPromise) {
        this._docxPromise = LibraryLoader.ensureLibrary("docx", {
          url: "https://unpkg.com/docx@8.0.3/build/index.js",
          globalName: "docx",
          validator: lib => !!lib && typeof lib.Document === "function"
        }).then(lib => {
          this._docxRef = lib || window.docx;
          return this._docxRef;
        });
      }

      return this._docxPromise;
    },

    //Asegura que Mammoth (lector de Word) esté cargado
    _ensureMammothLib: function () {
      if (!this._mammothPromise) {
        this._mammothPromise = LibraryLoader.ensureLibrary("mammoth", {
          url: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js",
          globalName: "mammoth",
          validator: lib => !!lib && typeof lib.extractRawText === "function"
        }).then(lib => {
          this._mammothRef = lib || window.mammoth;
          return this._mammothRef;
        });
      }

      return this._mammothPromise;
    },


    // ========================================
    // CARGA DE DATOS MAESTROS (MDF)
    // ========================================

    // Carga los datos del mantenedor (factores salariales, fechas, etc.)
    // Los datos del MDF incluyen:
    // - Factores salariales por antigüedad
    // - Fechas importantes (DGT3, etc.)

    _ensureMDFData: function () {
      if (!this._mdfDataPromise) {
        const oComponentModel = this.getOwnerComponent().getModel();
        this._mdfDataPromise = this._readOData(oComponentModel, "/cust_GD_mantenedorDatos", {})
          .then(oMDF => {
            const aResults = Array.isArray(oMDF?.results) ? oMDF.results : [];
            // Guarda en variables del controller
            this.aMDF = aResults;
            this.sFechaDGT3 = aResults.length > 0 ? aResults[0].cust_fechaDGT3 : null;
            return aResults;
          })
          .catch(oError => {
            // Si falla, limpia la promesa para poder reintentar
            this._mdfDataPromise = null;
            throw oError;
          });
      }

      return this._mdfDataPromise;
    },

    //Wrapper para leer datos OData con promesas
    _readOData: function (oModel, sPath, mParameters) {
      return new Promise((resolve, reject) => {
        oModel.read(sPath, Object.assign({}, mParameters, {
          success: resolve,
          error: reject
        }));
      });
    },

    // ========================================
    // CARGA INTELIGENTE DE DATOS
    // ========================================

     //Determina qué datos cargar según el tipo de documento
     //Algunos documentos requieren empleados activos, otros inactivos
    _ensureDataForTitle: function (sTitle) {
      let needsActive = true;
      let needsInactive = false;

      // Documentos que requieren empleados INACTIVOS
      if (sTitle === "Certificado Laboral Excolaborador" || sTitle === "Notificación Salida Ministerio") {
        needsActive = false;
        needsInactive = true;
      }

      const aPromises = [];

      //solo carga si no está previamente cargando 
      if (needsActive && !this._activeEmployeesLoaded) {
        aPromises.push(this.loadEmployees());
      }

      if (needsInactive && !this._inactiveEmployeesLoaded) {
        aPromises.push(this.loadEmployeesBkp());
      }

      // Si no hay nada que cargar, resuelve inmediatamente
      if (!aPromises.length) {
        return Promise.resolve();
      }

      return Promise.all(aPromises);
    },

    //Maneja la selección de un tile (boton)/documento. Carga los datos necesarios y abre el diálogo
    _handleTileSelection: function (sTitle) {
      return this._ensureDataForTitle(sTitle).then(() => {
        this._openDialogForTitle(sTitle);
      });
    },


    // ========================================
    // INICIALIZACIÓN
    // ========================================

    //Se ejecuta al inicializar el controller. Configura todo el estado inicial de la aplicación
    onInit: function () {
      const oView = this.getView();
      // Crea el busy dialog global
      this.oGlobalBusyDialog = new sap.m.BusyDialog();
      this._busyCounter = 0;
      //Modelo para manejar el estado de la vista
      var oViewModel = new JSONModel({
        BaseUsers: [], // Base estable para filtros (según documento)
        FilteredUsers: [],// Usuarios filtrados en la tabla
        SelectedUsers: [] //Array para guardar temporalmente los Usuarios seleccionados
      });
      oViewModel.setSizeLimit(999999); // Aumenta límite para muchos registros
      // Inicializa variables de estado
      this.getOwnerComponent().setModel(oViewModel, "view");
      this.aSelectedEmployees = [];
      this._activeEmployeesLoaded = false;
      this._inactiveEmployeesLoaded = false;
      this._activeEmployeesRequest = null;
      this._inactiveEmployeesRequest = null;
      this._tilesEventsAttached = false;
      this.aMDF = [];
      this.sFechaDGT3 = null;
      this._mdfDataPromise = null;
      this.getUserInfo();  // Carga información del usuario actual
      this.updateGreeting(); //Actualiza el saludo segun la hora
      // Variables para filtros
      this._currentCategory = null;
      this._manualDesahucioDate = null;
      this._activeSearch = "";
      this._activeDateFilter = null;
      // Configuración de diálogos
      const oManualDateDialog = oView.byId("manualDateDialog");
      if (oManualDateDialog) {
        oView.addDependent(oManualDateDialog);
      }
      const oManualDateDialogAusencia = this.getView().byId("manualDateDialogAusencia");
      if (oManualDateDialogAusencia) {
        this.getView().addDependent(oManualDateDialogAusencia);
      }
      //Carga el logo
      var oImage = this.byId("_IDGenImageeee");
      if (oImage) {
        oImage.setSrc(sap.ui.require.toUrl("gestordoccolombia/img/logo.png"));
      }
      // Adjunta eventos a los tiles
      this.attachBoxEvents();
    },


    // ========================================
    //  UTILIDADES DE URL Y USUARIO
    // ========================================
    
    //Obtiene la URL base de la aplicación
    getBaseURL: function () {
      var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      var appPath = appId.replaceAll(".", "/");
      var appModulePath = jQuery.sap.getModulePath(appPath);
      return appModulePath;
    },

    // Obtiene la empresa del usuario logueado
    /**
     * @param {string} userId - ID del usuario
     * @returns {Promise<string>} - Código de la empresa
     */
    getUserCompany: function(userId) { //Pregunta: De qué empresa es el userId?
      const oModel = this.getOwnerComponent().getModel();
      
      return new Promise((resolve, reject) => {
        oModel.read("/User('" + userId + "')", {
          urlParameters: {
            "$select": "userId,empInfo/jobInfoNav/company",
            "$expand": "empInfo/jobInfoNav"
          },
          success: function(oData) {
            // obtengo la empresa desde jobInfoNav
            const sCompany = oData?.empInfo?.jobInfoNav?.results?.[0]?.company || "DO01";
            console.log("Empresa del usuario:", sCompany);
            resolve(sCompany);
          },
          error: function(oError) {
            console.error("Error al obtener empresa:", oError);
            // si da error, usar empresa por defecto
            resolve("DO01");
          }
        });
      });
    },

    //Logueo de usuario: Obtiene la información del usuario actual desde la API
    // Si falla o es un usuario específico, usa un userId hardcodeado para testing
    getUserInfo: function () { //Pregunta: Cual es el userId del usuario logeado? 
      var that = this;
      const url = this.getBaseURL() + "/user-api/currentUser";
      var UseroModel = new JSONModel();
      UseroModel.loadData(url);
      
      UseroModel.attachRequestCompleted(function () {
        // Si no hay email o es un usuario específico, usa userId de prueba
        let userId;
        if (!UseroModel.getData().email || UseroModel.getData().email == "rodrigo.lopez@agprodservicios.com") {
          userId = "excagp";
        } else {
          userId = UseroModel.getData().name;
        }
        
        UseroModel.setProperty("/firstname", userId);
        that.getOwnerComponent().setModel(UseroModel, "user");
        
        // Obtiene la empresa del usuario antes de cargar los datos
        that.getUserCompany(userId).then(function(sCompany) {
          // guarda la empresa en el modelo de usuario
          UseroModel.setProperty("/company", sCompany);
          
          // ahora carga los datos del usuario con el filtro de empresa
          that.getDataUser(userId);
        }).catch(function(oError) {
          console.error("Error obteniendo empresa del usuario:", oError);
          sap.m.MessageToast.show("Error al obtener información de la empresa");
          that.oGlobalBusyDialog.close();
        });
      });
      
      UseroModel.attachRequestFailed(function () {
        that.oGlobalBusyDialog.close();
      });
    },


    //Formatea una fecha en formato ISO para SAP
    formatDate: function (date) {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    },

    //Maneja la selección en el header (navegación externa)
    onSelectHeader: function (oEvent) {
      var sKey = oEvent.getParameter("key");

      if (sKey === "1") {
        window.location.href = "https://hcm17.sapsf.com/sf/home?bplte_company=gerdaumeta&a9b67k648.accounts.ondemand.com/";
      }
    },


    // ========================================
    //  CARGA DE EMPLEADOS ACTIVOS
    // ========================================
    /**
     * Carga todos los empleados ACTIVOS desde SAP SuccessFactors
     * CARACTERÍSTICAS:
     * - Solo carga una vez (usa _activeEmployeesLoaded como flag)
     * - Evita llamadas duplicadas con _activeEmployeesRequest
     * - Muestra busy dialog mientras carga
     * - Enriquece los datos con información adicional
     * 
     * DATOS QUE CARGA:
     * - Información básica (nombre, email, etc.)
     * - Salario desde navegación anidada
     * - Cédula/documento nacional
     * - Estado civil (adaptado al género)
     * - Manager information
     */

    loadEmployees: function () {
      if (this._activeEmployeesRequest) {
        return this._activeEmployeesRequest;
      }

      const oComponentModel = this.getOwnerComponent().getModel();
      
      // obtengo la empresa del usuario logueado
      const oUserModel = this.getOwnerComponent().getModel("user");
      const sUserCompany = oUserModel.getProperty("/company") || "DO01";
      // Define los campos a seleccionar (optimiza la carga)
      const sSelect = [
        "userId",
        "status",
        "firstName",
        "lastName",
        "email",
        "nationality",
        "jobCode",
        "title",
        "custom02", // Tipo (Administrativo/Operativo)
        "custom03",
        "businessPhone",
        "state",
        "custom10",
        "hireDate",
        "country",
        "salutation",
        "division",
        "department",
        "defaultFullName",
        "gender",
        "manager/jobCode",
        "manager/businessPhone",
        "manager/email",
        "empInfo/customDate1",
        "empInfo/startDate",
        "empInfo/endDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason",
        "empInfo/jobInfoNav/company", // agrego company
        "empInfo/personNav/customLong1",
        "empInfo/personNav/personalInfoNav/maritalStatus",
        "empInfo/personNav/personalInfoNav/secondLastName",
        "empInfo/personNav/nationalIdNav/nationalId",
        "empInfo/personNav/nationalIdNav/cardType",
        "empInfo/personNav/nationalIdNav/country"
      ].join(",");

      // Define las navegaciones a expandir
      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav"
      ].join(",");

      // Actualizo el filtro con la empresa del usuario
      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status eq 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      })).then(oUsers => {
        const aUsers = Array.isArray(oUsers?.results) ? oUsers.results : [];

        // ENRIQUECIMIENTO DE DATOS
        const enrichedUsers = aUsers.map(user => {
          // 1. Extrae el salario desde la navegación anidada
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]?.empPayCompRecurringNav?.results?.[0]?.paycompvalue;
          user.paycompvalue = salaryRaw || 0;
          user.paycompValue = salaryRaw || 0;

          // 2. Extrae la cédula (busca cardType ZC o ZP)
          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          const targetObject = nationalIdResults.find(item => item.cardType === "ZC" || item.cardType === "ZP");
          user.nationalId = targetObject?.nationalId ?? "";

          // 3. Mapea el sueldo
          if (user.salutation === "3526") {
            user.salut = "Sra.";
          } else if (user.salutation === "3525") {
            user.salut = "Sr.";
          } else {
            user.salut = "Srta.";
          }

          // 4. Datos adicionales
          user.customLong1 = user.empInfo?.personNav?.customLong1 || "";
          const marriageStatusId = user.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
          user.marriageStatusId = marriageStatusId;

          // 5. Estado civil (adaptado al género)
          const isFemale = user.gender === "F";
          if (isFemale) {
            switch (marriageStatusId) {
              case '3528': user.marriageStatus = 'divorciada'; break;
              case '3530': user.marriageStatus = 'casada'; break;
              case '3529': user.marriageStatus = 'separada'; break;
              case '3531': user.marriageStatus = 'soltera'; break;
              case '3532': user.marriageStatus = 'viuda'; break;
              case '3533': user.marriageStatus = 'unión libre'; break;
              default: user.marriageStatus = ''; break;
            }
          } else {
            switch (marriageStatusId) {
              case '3528': user.marriageStatus = 'divorciado'; break;
              case '3530': user.marriageStatus = 'casado'; break;
              case '3529': user.marriageStatus = 'separado'; break;
              case '3531': user.marriageStatus = 'soltero'; break;
              case '3532': user.marriageStatus = 'viudo'; break;
              case '3533': user.marriageStatus = 'unión libre'; break;
              default: user.marriageStatus = ''; break;
            }
          }

          return user;
        });

        // Guarda en el modelo
        this.getView().setModel(new JSONModel({ User: enrichedUsers }));
        this._activeEmployeesLoaded = true;
        this.attachBoxEvents();
        return enrichedUsers;
      }).catch(oError => {
        console.error("Error cargando datos:", oError);
        sap.m.MessageToast.show("Error cargando los datos.");
        this._activeEmployeesLoaded = false;
        throw oError;
      });

      // Guarda la promesa para evitar duplicados
      this._activeEmployeesRequest = pFetch;
      // Limpia la referencia cuando termine
      pFetch.finally(() => {
        if (this._activeEmployeesRequest === pFetch) {
          this._activeEmployeesRequest = null;
        }
      });

      return pFetch;
    },



    /**
     * Obtiene y procesa datos del usuario logueado
     * Determina permisos y configura la UI según el rol
     * 
     * ROLES:
     * - admin: Gestor Documental - Administradores
     * - usuario: Gestor Documental - Usuarios
     * - ninguno: Sin permisos
    */
    getDataUser: function (user) {
      var that = this;
      console.log(user);
      var readurl = "/User('" + user + "')";
      var readUrlModelGroup = "/cust_GD_mantenedorGrupos('" + user + "')";

      this.getView().getModel().read(readUrlModelGroup, {
        success: function (oData) {
          var userModel = that.getOwnerComponent().getModel("user");
          var cleanData = JSON.parse(JSON.stringify(oData));

          that.getOwnerComponent().getModel("user").setProperty("/datos", cleanData);
          that.getOwnerComponent().getModel("user").setProperty("/displayName", cleanData.displayName);

          //Mapea el genero
          if (cleanData.gender === "F") {
            userModel.setProperty("/gender", "genero_Femenino");
          } else {
            userModel.setProperty("/gender", "genero_Masculino");
          }

          var grupo = cleanData.cust_grupo;
          userModel.setProperty("/grupo", grupo);

          //Determina permisos segun el grupo
          if (grupo === "Gestor Documental - Administradores") {
            userModel.setProperty("/permisos", "admin");
          } else if (grupo === "Gestor Documental - Usuarios") {
            userModel.setProperty("/permisos", "usuario");
          } else {
            userModel.setProperty("/permisos", "ninguno");
          }

          var permisos = userModel.getProperty("/permisos");
          var oGrid = that.byId("gridItems");

          // Referencias a los botones
          var oButtonSalida = that.byId("customListItemSalida");
          var oButtonCartasM = that.byId("customListItemCartasM");
          var oButtonCartasA = that.byId("customListItemCartasA");
          var oButtonAmonestacion = that.byId("customListItemAmonestacion");
          var oButtonAusenInjus = that.byId("customListItemAuseInjus");
          var oButtonDeshausio = that.byId("customListItemDeshausio");
          var oButtonCertEx = that.byId("customCertificadoEx");
          var oButtonContrato = that.byId("customListItemContrato");
          var oButtonConfiden = that.byId("customListItemConfidencialidad");
          var oButtonCartMensualUSuario = that.byId("customListItemcartaMensualUsuario");
          var oButtonCartAnualUSuario = that.byId("customListItemCartaAnualUsuario");

          // Botones solo para usuarios normales (los que queremos quitar si es admin)
          const aUserOnly = [
            oButtonCartMensualUSuario,
            oButtonCartAnualUSuario
          ];

          //Configuracion de visibilidad segun los permisos
          if (permisos === "admin") {
            // Admin: Remueve botones de usuario y muestra solo los de admin
            aUserOnly.forEach(oItem => {
              if (oItem) oGrid.removeContent(oItem);
            });

            // Mostrar solo los de admin
            oButtonSalida?.setVisible(true);
            oButtonCartasM?.setVisible(true);
            oButtonCartasA?.setVisible(true);
            oButtonAmonestacion?.setVisible(true);
            oButtonAusenInjus?.setVisible(true);
            oButtonDeshausio?.setVisible(true);
            oButtonCertEx?.setVisible(true);
            oButtonContrato?.setVisible(true);
            oButtonConfiden?.setVisible(true);
            // Usuario: Solo muestra sus botones
          } else if (permisos === "usuario") {
            oButtonCartMensualUSuario?.setVisible(true);
            oButtonCartAnualUSuario?.setVisible(true);

            // Ocultar los de admin
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
          sap.m.MessageToast.show("Error al leer grupo de usuario");
          console.log(oError);
        }
      });
    },


    // ========================================
    //  CARGA DE EMPLEADOS INACTIVOS
    // ========================================
    
    /**
     * Carga empleados INACTIVOS (dados de baja)
     * Usado para certificados de excolaboradores y notificacione
     * Es parecido a loadEmployees() pero con filtro inverso
     */

    loadEmployeesBkp: function () {
      if (this._inactiveEmployeesRequest) {
        return this._inactiveEmployeesRequest;
      }

      const oComponentModel = this.getOwnerComponent().getModel();
      
      // obtengo la empresa del usuario logueado
      const oUserModel = this.getOwnerComponent().getModel("user");
      const sUserCompany = oUserModel.getProperty("/company") || "DO01";
      
      const sSelect = [
        "userId",
        "status",
        "firstName",
        "lastName",
        "email",
        "nationality",
        "jobCode",
        "title",
        "custom02",
        "custom03",
        "businessPhone",
        "state",
        "custom10",
        "hireDate",
        "country",
        "salutation",
        "division",
        "department",
        "defaultFullName",
        "gender",
        "manager/jobCode",
        "manager/businessPhone",
        "manager/email",
        "empInfo/customDate1",
        "empInfo/startDate",
        "empInfo/endDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason",
        "empInfo/jobInfoNav/company", // agrego company
        "empInfo/personNav/customLong1",
        "empInfo/personNav/personalInfoNav/maritalStatus",
        "empInfo/personNav/personalInfoNav/secondLastName",
        "empInfo/personNav/nationalIdNav/nationalId",
        "empInfo/personNav/nationalIdNav/cardType",
        "empInfo/personNav/nationalIdNav/country"
      ].join(",");

      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav"
      ].join(",");

      // filtro actualizado con la empresa del usuario
      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          //  filtro: Empleados NO activos
          "$filter": `status ne 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      })).then(oData => {
        const aUsers = [];
        const aResults = Array.isArray(oData?.results) ? oData.results : [];

        aResults.forEach(user => {
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]?.empPayCompRecurringNav?.results?.[0]?.paycompvalue || 0;
          user.paycompValue = salaryRaw;
          user.paycompvalue = salaryRaw;
          user.marriageStatusId = user?.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
          user.defaultFullName = user.defaultFullName || "";
          const fn = user.firstName || "";
          const ln = user.lastName || "";
          user.fullNameReverse = `${ln} ${fn}`.toLowerCase();
          user.customLong1 = user?.empInfo?.personNav?.customLong1 || "";

          if (user.salutation === "3526") {
            user.salut = "Sra.";
          } else if (user.salutation === "3525") {
            user.salut = "Sr.";
          } else {
            user.salut = "Srta.";
          }

          if (user.gender === "F") {
            switch (user.marriageStatusId) {
              case '3528': user.marriageStatus = 'divorciada'; break;
              case '3530': user.marriageStatus = 'casada'; break;
              case '3529': user.marriageStatus = 'separada'; break;
              case '3531': user.marriageStatus = 'soltera'; break;
              case '3532': user.marriageStatus = 'viuda'; break;
              case '3533': user.marriageStatus = 'unión libre'; break;
              default: user.marriageStatus = ''; break;
            }
          } else {
            switch (user.marriageStatusId) {
              case '3528': user.marriageStatus = 'divorciado'; break;
              case '3530': user.marriageStatus = 'casado'; break;
              case '3529': user.marriageStatus = 'separado'; break;
              case '3531': user.marriageStatus = 'soltero'; break;
              case '3532': user.marriageStatus = 'viudo'; break;
              case '3533': user.marriageStatus = 'unión libre'; break;
              default: user.marriageStatus = ''; break;
            }
          }

          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          const targetObject = nationalIdResults.find(item => item.cardType === "ZC" || item.cardType === "ZP");
          user.nationalId = targetObject?.nationalId ?? "";

          aUsers.push(user);
        });

        this.getView().setModel(new JSONModel({ InactiveUsers: aUsers }), "inactive");
        this._inactiveEmployeesLoaded = true;
        this.attachBoxEvents();
      }).catch(oError => {
        sap.m.MessageToast.show("Error al cargar empleados dados de baja");
        console.error("Error al cargar empleados dados de baja", oError);
        this._inactiveEmployeesLoaded = false;
        throw oError;
      });

      this._inactiveEmployeesRequest = pFetch;
      pFetch.finally(() => {
        if (this._inactiveEmployeesRequest === pFetch) {
          this._inactiveEmployeesRequest = null;
        }
      });

      return pFetch;
    },

    //Obtiene la URL del logo
    getLogoUrl: function () {
      return sap.ui.require.toUrl("//img/logo.png");
    },

    //Maneja el press en un tile
    onTilePress: function () {
      const sTitle = this.sSelectedContract;
      this._handleTileSelection(sTitle).catch(oError => {
        console.error("Error al preparar la selección:", oError);
        sap.m.MessageToast.show("Error cargando los datos.");
      });
    },

    
    // ========================================
    //  APERTURA DEL DIÁLOGO DE EMPLEADOS
    // ========================================
    
    /**
     * Abre el diálogo de selección de empleados
     * Aplica filtros específicos según el tipo de documento
     * 
     * FLUJO:
     * 1. Determina si usa empleados activos o inactivos
     * 2. Aplica filtros específicos del documento
     * 3. Actualiza el modelo de vista
     * 4. Abre el diálogo
     * 5. Ejecuta la función de generación correspondiente
     */
    
    _openDialogForTitle: function (sTitle) {
      const oView = this.getView();
      const oDialog = oView.byId("employeeDialog");

      const oViewStateModel = oView.getModel("view");
      if (!oViewStateModel) {
        console.error("No se encontró el modelo 'view' para manejar el estado de la vista.");
        return;
      }

      // 1. Determina qué usuarios cargar
      let aUsers = [];
      if (sTitle === "Certificado Laboral Excolaborador" || sTitle === "Notificación Salida Ministerio") {
        // Usa empleados INACTIVOS
        const oInactiveModel = oView.getModel("inactive");
        aUsers = oInactiveModel ? oInactiveModel.getProperty("/InactiveUsers") : [];
      } else {
        //Usa empleados ACTIVOS
        const oUserModel = oView.getModel();
        aUsers = oUserModel ? oUserModel.getProperty("/User") : [];
      }

      if (!Array.isArray(aUsers) || aUsers.length === 0) {
        console.error("aUsers no es un array válido o está vacío:", aUsers);
        return;
      }

      // 2. Aplica el filtro especial según el documento, si corresponde
      let aFilteredUsers;
      switch (sTitle) {
        case "Contrato De Trabajo":
          // Solo Administrativos y Operativos
          aFilteredUsers = aUsers.filter(user =>
            user.custom02 === "Administrativo" || user.custom02 === "Operativo"
          );
          break;
        case "Confidencialidad":
        case "Carta Desahucio":
        case "Cartas De Trabajo Mensual":
        case "Cartas De Trabajo Anual":
        case "Certificado Laboral Excolaborador":
        case "Notificación Salida Ministerio":
        case "Notificación De Amonestación":
        case "Notificación De Ausencia Injustificada":
          aFilteredUsers = aUsers; // MOSTRAR TODOS
          break;
        default:
          // Solo Administrativos
          aFilteredUsers = aUsers.filter(user => user.custom02 === "Administrativo");
      }

      if (!aFilteredUsers.length) {
        console.warn("No se encontraron usuarios con el filtro aplicado.");
      }

      // 3. Actualiza el modelo de vista
      oViewStateModel.setProperty("/BaseUsers", aFilteredUsers);
      oViewStateModel.setProperty("/FilteredUsers", aFilteredUsers);

      // 4. Abre el diálogo
      if (oDialog) {
        const oTable = oView.byId("idUserTable");
        oTable.setModel(oViewStateModel, "view");

        oDialog.setTitle(sTitle);
        oDialog.open();
      } else {
        console.error("No se encontró el diálogo employeeDialog.");
      }

      // 5. Aplica filtros combinados para asegurarte de que arranque limpio
      this._applyCombinedFilters();

      // 6. Ejecuta la función asociada al documento
      switch (sTitle) {
        case "Confidencialidad":
          this.onDownloadPDFConfidencialidad();
          break;
        case "Contrato De Trabajo":
          this.onDownloadPDFContratoTrabajo();
          break;
        case "Certificado Laboral Excolaborador":
          this.onDownloadPDFExcolaborador();
          break;
        case "Notificación Salida Ministerio":
          this.onDownloadPDFSalidaMinisterio();
          break;
        case "Cartas De Trabajo Mensual":
          this.onDownloadPDFCartaMensual();
          break;
        case "Carta Desahucio":
          this.onDownloadPDFDesahucio(aFilteredUsers);
          break;
        case "Cartas De Trabajo Anual":
          this.onDownloadPDFCartaAnual();
          break;
        case "Notificación De Amonestación":
          this.onDownloadPDFNotAmonestacion();
          break;
        case "Notificación De Ausencia Injustificada":
          this.onDownloadPDFNotAusInjus();
          break;
        default:
          MessageToast.show("No hay función asociada para este documento.");
      }
    },


    // ========================================
    //  MANEJO DE DIÁLOGOS
    // ========================================
    
    /**
     * Se ejecuta antes de abrir el diálogo
     * Aplica blur al fondo y limpia filtros
     */
    onBeforeOpenDialog() {
      const oView = this.getView();
      const oTable = oView.byId("idUserTable");
      const oBinding = oTable.getBinding("items");
      oView.byId("contentContainer").addStyleClass("blurredBackground");
      oView.byId("searchField").setValue("");
      oView.byId("dateRange").setDateValue(null);
      oView.byId("dateRange").setSecondDateValue(null);
      this._activeSearch = "";
      this._activeDateFilter = null;
      oBinding.filter([]);
      oTable.removeSelections();
    },

    //Se ejecuta después de cerrar el diálogo. Remueve el blur del fondo
    onAfterCloseDialog() {
      this.getView().byId("contentContainer").removeStyleClass("blurredBackground");
    },

    // Cierra el diálogo y limpia el estado
    onCloseDialog: function () {
      const oView = this.getView();
      const oTable = oView.byId("idUserTable");
      const oBinding = oTable.getBinding("items");
      this._manualDesahucioDate = null;
      const oDatePicker = sap.ui.getCore().byId("manualDatePicker");
      if (oDatePicker) {
        oDatePicker.setValue("");
      }
      // Limpia los filtros
      oView.byId("searchField").setValue("");
      oView.byId("dateRange").setDateValue(null);
      oView.byId("dateRange").setSecondDateValue(null);
      this._activeSearch = "";
      this._activeDateFilter = null;

      const oViewStateModel = oView.getModel("view");
      oViewStateModel?.setProperty("/BaseUsers", []);
      oViewStateModel?.setProperty("/FilteredUsers", []);
      oBinding.filter([]);
      oTable.removeSelections();
      this.aSelectedEmployees = [];
      //  Cerramos el diálogo principal de empleados
      oView.byId("employeeDialog").close();
      this.onAfterCloseDialog();
    },

    // Handler del SearchField (liveChange)
    onSearch: function (oEvent) {
      const sNewValue = oEvent?.getParameter?.("newValue");
      const sValue = (typeof sNewValue === "string") ? sNewValue : (oEvent.getSource?.().getValue?.() || "");
      this._activeSearch = sValue;
      this._applyCombinedFilters();
    },

    
    // ========================================
    //  SISTEMA DE FILTROS COMBINADOS
    // ========================================
    
    /**
     * Aplica filtros de búsqueda y fecha simultáneamente
     * 
     * FILTROS QUE APLICA:
     * 1. Filtro por fecha (hireDate o endDate)
     * 2. Filtro por texto (busca en múltiples campos)
     * 
     * FUNCIONAMIENTO:
     * - Parte del array base (activos o inactivos)
     * - Aplica filtro de fecha si existe
     * - Aplica filtro de texto si existe
     * - Actualiza el modelo "view" con los resultados
     */
    _applyCombinedFilters: function () {
      const oView = this.getView();

      // Definí si es excolaborador
      const isExColaborador =
        this.sSelectedContract === "Certificado Laboral Excolaborador" ||
        this.sSelectedContract === "Notificación Salida Ministerio";

      // Modelo correspondiente
      const oModel = isExColaborador ? oView.getModel("inactive") : oView.getModel();

      // Siempre asegurate que la tabla apunte al modelo correcto
      const oTable = this.byId("idUserTable");
      if (oTable.getModel() !== oModel) {
        oTable.setModel(oModel);
      }

      // Array base: si el diálogo ya definió una base (según documento), úsala
      const oViewStateModel = oView.getModel("view");
      const aBaseFromState = oViewStateModel?.getProperty("/BaseUsers");

      const baseArray = Array.isArray(aBaseFromState) && aBaseFromState.length
        ? aBaseFromState
        : (isExColaborador
          ? (oModel.getProperty("/InactiveUsers") || [])
          : (oModel.getProperty("/User") || []));

      let filtered = baseArray;

      // --- Filtro por fecha (usa la lógica original que te andaba bien) ---
      if (this._activeDateFilter && this._activeDateFilter.dFrom && this._activeDateFilter.dTo) {
        const dFrom = this._activeDateFilter.dFrom;
        const dTo = this._activeDateFilter.dTo;

        const toUTCDate = (date) => {
          return new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          ));
        };
        const utcFrom = toUTCDate(dFrom);
        const utcTo = toUTCDate(dTo);

        filtered = filtered.filter(user => {
          // Para excolaborador o salida ministerio
          let userDateStr = isExColaborador ? user.empInfo?.endDate : user.hireDate;
          if (!userDateStr) return false;

          let userDate = new Date(userDateStr);
          let userUTCDate = new Date(Date.UTC(
            userDate.getUTCFullYear(),
            userDate.getUTCMonth(),
            userDate.getUTCDate()
          ));
          if (utcFrom.getTime() === utcTo.getTime()) {
            return userUTCDate.getTime() === utcFrom.getTime();
          }
          return userUTCDate >= utcFrom && userUTCDate <= utcTo;
        });
      }

      // --- Filtro por texto (buscador) ---
      if (this._activeSearch && this._activeSearch.trim() !== "") {
        const normalize = str =>
          str?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase() || "";
        const query = normalize(this._activeSearch);
        const words = query.split(" ");
        filtered = filtered.filter(user => {
          return words.every(word =>
          (normalize(user.firstName).includes(word) ||
            normalize(user.lastName).includes(word) ||
            normalize(user.userId).includes(word) ||
            normalize(user.nationalId).includes(word) ||
            normalize(user.defaultFullName).includes(word) ||
            normalize(user.fullNameReverse).includes(word) ||
            normalize(user.custom02).includes(word) ||
            normalize(user.customLong1).includes(word))
          );
        });
      }

      // Actualizar el modelo con los datos filtrados
      if (oViewStateModel) {
        oViewStateModel.setProperty("/FilteredUsers", filtered);
      }

      // Extra: si querés, asegúrate que la tabla refresque (UI5 a veces cachea)
      const oItemsBinding = oTable.getBinding("items");
      if (oItemsBinding && typeof oItemsBinding.refresh === "function") {
        oItemsBinding.refresh();
      }
    },

    onDateFilterChange: function () {
      const oDateRange = this.byId("dateRange");
      this._activeDateFilter = {
        dFrom: oDateRange.getDateValue(),
        dTo: oDateRange.getSecondDateValue()
      };
      this._applyCombinedFilters();
    },

    //Agrego funcion con el this._activeSearch
    onSearchFieldChange: function(oEvent) {
      this._activeSearch = oEvent.getParameter("newValue") || "";
      this._applyCombinedFilters();
    },

    // Delegar a formatHelpers
    mapTitleToFile: function(sTitle) {
      return formatHelpers.mapTitleToFile(sTitle);
    },

    formatDateToSpanish: function(sDate) {
      return formatHelpers.formatDateToSpanish(sDate);
    },

    formatFechaCorta: function(fecha) {
      return formatHelpers.formatFechaCorta(fecha);
    },

    formatFechaFormal: function(fechaInput) {
      return formatHelpers.formatFechaFormal(fechaInput);
    },

    convertNumberToWords: function(num) {
      return formatHelpers.convertNumberToWords(num);
    },

    formatDateToWords: function(date) {
      return formatHelpers.formatDateToWords(date);
    },

    getSelectedUsers: function() {
      return formatHelpers.getSelectedUsers.call(this);
    },

    onDownloadPDF: function (oEvent) {
      var sTitle = this.sSelectedContract; // Asumimos que el título ya está guardado
      const oButton = oEvent.getSource();
      const sButtonId = oButton.getId();
      const sButtonText = oButton.getText();
      // Verificar qué documento se debe generar
      switch (sTitle) {
        case "Confidencialidad":
          this.onDownloadPDFConfidencialidad(sButtonId);
          break;
        case "Contrato De Trabajo":
          this.onDownloadPDFContratoTrabajo(sButtonId);
          break;
        case "Certificado Laboral Excolaborador":
          this.onDownloadPDFExcolaborador(sButtonId);
          break;
        case "Notificación Salida Ministerio":
          this.onDownloadPDFSalidaMinisterio(sButtonId);
          break;
        case "Cartas De Trabajo Mensual":
          this.onDownloadPDFCartaMensual(sButtonId);
          break;
        case "Carta Desahucio":
          this.onDownloadPDFDesahucio(sButtonId);
          break;
        case "Cartas De Trabajo Anual":
          this.onDownloadPDFCartaAnual(sButtonId)
          break;
        case "Notificación De Amonestación":
          this.onDownloadPDFNotAmonestacion(sButtonId)
          break;
        case "Notificación De Ausencia Injustificada":
          this.onDownloadPDFNotAusInjus(sButtonId)
          break;
        case "anual usuario":
          this.onDownloadCartaAnualUsuario(oEvent)
          break;
        case "mensual usuario":
          this.onDownloadCartaMensualUsuario(oEvent)
          break;
        default:
          sap.m.MessageToast.show("No hay función definida para este documento.");
          break;
      }
    },

    //Carpeta: Helpers -----------------------------------------------------------------------
    // Generadores genéricos que usan los helpers

    onDownloadPDF1: function () {
      return pdfGenerator.onDownloadPDF1(this); // Usa 'pdfGenerator' (minúscula) y pasa 'this' como contexto 
    },    

    onDownloadWord: function () {
      return wordGenerator.onDownloadWord(this);
    },

    // Helpers de UI
    updateGreeting: function () {
     uiHelpers.updateGreeting(this.getView());
    },

    attachBoxEvents: function () {
      uiHelpers.attachBoxEvents(this); 
    },

    //----------------------------------------------------------------------------------------------

    attachBoxEvents: function () {
      if (this._tilesEventsAttached) {
        return;
      }
      this._tilesEventsAttached = true;

      const view = this.getView();
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

      boxMap.forEach(box => {
        const oItem = view.byId(box.id);
        if (!oItem) {
          console.warn("No se encontró el CustomListItem con ID:", box.id);
          return;
        }

        oItem.addStyleClass("boxHover");
        oItem.attachBrowserEvent("click", () => {
          this.sSelectedContract = box.title;
          this._handleTileSelection(box.title).catch(oError => {
            console.error("Error al preparar la selección:", oError);
            sap.m.MessageToast.show("Error cargando los datos.");
          });
        });
      });

      ["customListItemDeshausio", "customListItemAuseInjus"].forEach(sId => {
        const oItem = view.byId(sId);
        if (oItem) {
          oItem.addStyleClass("boxHover");
        }
      });
    },

    _getDocumentSearchCards: function () {
      return [
        { id: "customListItemcartaMensualUsuario", title: "Cartas - Trabajo Mensual", desc: "Gestionar cartas de trabajo mensual" },
        { id: "customListItemCartaAnualUsuario", title: "Cartas - Trabajo Anual", desc: "Gestionar cartas de trabajo anual" },
        { id: "customListItemConfidencialidad", title: "Confidencialidad", desc: "Gestionar documentos confidenciales" },
        { id: "customListItemContrato", title: "Contrato De Trabajo", desc: "Gestionar contratos de trabajo" },
        { id: "customCertificadoEx", title: "Certificado Laboral Excolaborador", desc: "Gestionar certificados laborales" },
        { id: "customListItemSalida", title: "Notificación Salida Ministerio", desc: "Gestionar notificaciones de salida" },
        { id: "customListItemCartasM", title: "Cartas de Trabajo Mensual", desc: "Gestionar cartas de trabajo mensual" },
        { id: "customListItemDeshausio", title: "Carta Desahucio", desc: "Gestionar cartas de desahucio" },
        { id: "customListItemCartasA", title: "Cartas De Trabajo Anual", desc: "Gestionar cartas de trabajo anual" },
        { id: "customListItemAmonestacion", title: "Notificación De Amonestación", desc: "Gestionar notificaciones de amonestación" },
        { id: "customListItemAuseInjus", title: "Notificación De Ausencia Injustificada", desc: "Gestionar notificaciones de ausencia" }
      ];
    },

    _normalizeSearchText: function (sValue) {
      return String(sValue || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    },

    onDocumentSearch: function (oEvent) {
      const sValue = oEvent?.getParameter("newValue") ?? oEvent?.getParameter("query") ?? this.byId("documentSearch")?.getValue() ?? "";
      const sQuery = this._normalizeSearchText(sValue);
      const aCards = this._getDocumentSearchCards();

      if (sQuery && !this._documentSearchBaseVisibility) {
        this._documentSearchBaseVisibility = {};
        aCards.forEach(oCard => {
          const oItem = this.byId(oCard.id);
          if (oItem) {
            this._documentSearchBaseVisibility[oCard.id] = oItem.getVisible();
          }
        });
      }

      if (!sQuery) {
        if (this._documentSearchBaseVisibility) {
          aCards.forEach(oCard => {
            const oItem = this.byId(oCard.id);
            if (oItem && Object.prototype.hasOwnProperty.call(this._documentSearchBaseVisibility, oCard.id)) {
              oItem.setVisible(this._documentSearchBaseVisibility[oCard.id]);
            }
          });
          this._documentSearchBaseVisibility = null;
        }
        return;
      }

      aCards.forEach(oCard => {
        const oItem = this.byId(oCard.id);
        if (!oItem) {
          return;
        }

        const bWasVisible = this._documentSearchBaseVisibility?.[oCard.id] !== false;
        const sSearchText = this._normalizeSearchText(`${oCard.title} ${oCard.desc}`);
        oItem.setVisible(bWasVisible && sSearchText.includes(sQuery));
      });
    },

    

    //Carpeta: Functions - Lógica específica de cada tipo de contrato/documento -----------------------------------------------------------------------------

    //Archivo: Confidencial
    onDownloadPDFConfidencialidad: async function (sButtonId) {
      confidencial.onDownloadPDFConfidencialidad(this, sButtonId);
    },

    //Archivo: Contrato
    onDownloadPDFContratoTrabajo: async function (sButtonId) {
      contrato.onDownloadPDFContratoTrabajo(this, sButtonId);
    },

    //Archivo: ExColaborador 
    onDownloadPDFExcolaborador: async function (sButtonId) {
      excolaborador.onDownloadPDFExcolaborador(this, sButtonId);
    },

    //Archivo: Carta Mensual
    onDownloadPDFCartaMensual: async function (sButtonId, data) {
      carta_mensual.onDownloadPDFCartaMensual(this, sButtonId, data);
    },

    //Archivo: Carta Mensual (usuario)
    onDownloadCartaMensualUsuario: function (oEvent) {
      return cartaMensualUsuario.onDownloadCartaMensualUsuario(this, oEvent);
    },

    //Archivo: Carta Anual (usuario)
    onDownloadCartaAnualUsuario: function (oEvent) {
      const oBusyDialog = this.oGlobalBusyDialog;
      if (oBusyDialog) {
        oBusyDialog.open();
      }

      const sButtonId = typeof oEvent === "string"
        ? oEvent
        : oEvent?.getSource?.()?.getId?.();

      const oUserModel = this.getOwnerComponent().getModel("user");
      const userId = oUserModel?.getProperty("/firstname");
      const oComponentModel = this.getOwnerComponent().getModel();

      if (!userId || !oComponentModel) {
        MessageToast.show("No se encontró información del usuario.");
        if (oBusyDialog) {
          oBusyDialog.close();
        }
        return;
      }

      oComponentModel.read("/User", {
        urlParameters: {
          "$select": "userId,status,manager/jobCode,firstName,empInfo/customDate1,lastName,jobCode,email,nationality,jobCode,title,custom02,businessPhone,state,custom10,hireDate,country,salutation,empInfo/personNav/nationalIdNav/nationalId,empInfo/compInfoNav,empInfo/personNav,empInfo/startDate,empInfo/endDate,empInfo/jobInfoNav/eventReason,division,department,gender",
          "$filter": `userId eq '${userId}'`,
          "$expand": "manager,empInfo,empInfo/compInfoNav,empInfo/jobInfoNav,empInfo/personNav,empInfo/personNav/nationalIdNav,empInfo/compInfoNav/empPayCompRecurringNav,empInfo/personNav/personalInfoNav"
        },
        success: (oData) => {
          const aUsers = oData?.results || [];
          if (!aUsers.length) {
            MessageToast.show("No se encontró información del usuario.");
            if (oBusyDialog) {
              oBusyDialog.close();
            }
            return;
          }

          const enrichedUsers = aUsers.map(user => {
            const compInfo = user.empInfo?.compInfoNav?.results?.[0];
            const recurring = compInfo?.empPayCompRecurringNav?.results?.[0];
            const rawSal = recurring?.paycompvalue;
            const salarioBase = rawSal && !isNaN(Number(rawSal)) ? Number(rawSal) : 0;
            user.paycompValue = salarioBase;
            user.paycompvalue = salarioBase;
            return user;
          });

          carta_anual.onDownloadPDFCartaAnual(this, sButtonId, enrichedUsers);

          if (oBusyDialog) {
            oBusyDialog.close();
          }
        },
        error: (oError) => {
          console.error("Error cargando /User:", oError);
          MessageToast.show("Error cargando los datos del usuario.");
          if (oBusyDialog) {
            oBusyDialog.close();
          }
        }
      });
    },

    onDesahucioPress: function () {
      const sTitle = "Carta Desahucio";
      this.sSelectedContract = sTitle;
      this._currentCategory = "desahucio";

      this._handleTileSelection(sTitle)
        .then(() => {
          this._openManualDateDialog();
        })
        .catch(oError => {
          console.error("Error al preparar datos de desahucio:", oError);
          sap.m.MessageToast.show("Error cargando los datos.");
        });
    },

    _openManualDateDialog: function () {
      const oView = this.getView();

      if (!this._oManualDateDialog) {
        sap.ui.core.Fragment.load({
          name: "gestordoccolombia.view.manualDateDialog",
          controller: this
        }).then(function (oDialog) {
          this._oManualDateDialog = oDialog;
          oView.addDependent(oDialog);
          oDialog.open();

          setTimeout(() => {
            const oDatePicker = sap.ui.getCore().byId("manualDatePicker");
            if (oDatePicker) {
              oDatePicker.$().find("input").attr("readonly", true);
            }
          }, 0);

        }.bind(this));
      } else {
        this._oManualDateDialog.open();

        setTimeout(() => {
          const oDatePicker = sap.ui.getCore().byId("manualDatePicker");
          if (oDatePicker) {
            oDatePicker.$().find("input").attr("readonly", true);
          }
        }, 0);

      }
    },

    onConfirmManualDate: function () {
      const oDatePicker = sap.ui.getCore().byId("manualDatePicker");
      const sDateValue = oDatePicker.getValue();

      if (!sDateValue) {
        sap.m.MessageToast.show("Por favor, seleccione una fecha.");
        return;
      }

      this._manualDesahucioDate = sDateValue;

      // Cerramos el Dialog manual de la fecha
      const oDialog = sap.ui.getCore().byId("manualDateDialog");
      oDialog.close();

      sap.m.MessageToast.show("Fecha de Desahucio seleccionada: " + sDateValue);
    },

    onCancelManualDate: function () {
      const oView = this.getView();

      this._manualDesahucioDate = null;
      this._oManualDateDialog.close();

      oView.byId("employeeDialog").close();
    },

    onAusenciaInjustificadaPress: function () {
      const sTitle = "Notificación De Ausencia Injustificada";
      this.sSelectedContract = sTitle;
      this._currentCategory = "ausenciaInjustificada";

      this._handleTileSelection(sTitle)
        .then(() => {
          this._openManualDateDialogAusencia();
        })
        .catch(oError => {
          console.error("Error al preparar datos de ausencia injustificada:", oError);
          sap.m.MessageToast.show("Error cargando los datos.");
        });
    },

    _openManualDateDialogAusencia: function () {
      const oView = this.getView();

      if (!this._oManualDateDialogAusencia) {
        sap.ui.core.Fragment.load({
          name: "gestordoccolombia.view.manualDateDialogAusencia",
          controller: this
        }).then(function (oDialog) {
          this._oManualDateDialogAusencia = oDialog;
          oView.addDependent(oDialog);
          oDialog.open();
        }.bind(this));
      } else {
        this._oManualDateDialogAusencia.open();
      }
    },

    onConfirmManualDateAusencia: function () {
      const oDatePicker = sap.ui.getCore().byId("manualDatePickerAusencia");
      const sDateValue = oDatePicker.getValue();

      if (!sDateValue) {
        sap.m.MessageToast.show("Por favor, seleccione una fecha.");
        return;
      }

      this._manualAusenciaDate = sDateValue;

      // Cerramos el Dialog manual de la fecha
      const oDialog = sap.ui.getCore().byId("manualDateDialogAusencia");
      oDialog.close();

      sap.m.MessageToast.show("Fecha de Ausencia Injustificada seleccionada: " + sDateValue);
    },

    onCancelManualDateAusencia: function () {
      const oView = this.getView();

      this._manualAusenciaDate = null;
      this._oManualDateDialogAusencia.close();

      oView.byId("employeeDialog").close();
    },



    onSelectionChange: function (oEvent) {
      const oTable = oEvent.getSource();
      const oContext = oEvent.getParameter("listItem").getBindingContext("view");
      const oChangedItem = oContext ? oContext.getObject() : null;
      const bSelected = oEvent.getParameter("selected");

      if (!oChangedItem) {
        console.warn("No se pudo obtener el colaborador seleccionado del modelo 'view'.");
        return;
      }

      // Inicializamos el array si no existe
      if (!this.aSelectedEmployees) {
        this.aSelectedEmployees = [];
      }

      if (bSelected) {
        // Agregamos si no existe
        if (!this.aSelectedEmployees.find(emp => emp.userId === oChangedItem.userId)) {
          this.aSelectedEmployees.push(oChangedItem);
        }
      } else {
        // Removemos si se deselecciona
        this.aSelectedEmployees = this.aSelectedEmployees.filter(emp => emp.userId !== oChangedItem.userId);
      }
    },

    //Archivo: Desahucio
    onDownloadPDFDesahucio: async function (sButtonId) {
      desahucio.onDownloadPDFDesahucio(this, sButtonId);
    },


    getEventReasonDescription: function (sCode) {
      const match = this.aEventReasonDescriptions.find(desc => desc.includes(`(${sCode})`));
      if (match) {
        if (match.toLowerCase().startsWith("contrato temporal")) {
          return "Contrato temporal";
        }
        return match.split(" ")[0];
      }
      return sCode;
    },


    //Archivo: Salida Minesterio
    onDownloadPDFSalidaMinisterio: async function (sButtonId) {
      notSalida_ministerio.onDownloadPDFSalidaMinisterio(this, sButtonId);
    },


    //Archivo: Carta Anual
    onDownloadPDFCartaAnual: async function (sButtonId) {
      carta_anual.onDownloadPDFCartaAnual(this, sButtonId);
    },
    

    //Archivo: Amonestacion
    onDownloadPDFNotAmonestacion: async function (sButtonId) {
      notAmonestacion.onDownloadPDFNotAmonestacion(this, sButtonId);
    },
    

    //Archivo: notAusInjus (Notificacion de Ausencia Injustificada)
    onDownloadPDFNotAusInjus: async function (sButtonId) {
      notAusInjus.onDownloadPDFNotAusInjus(this, sButtonId);
    },



  });
});
