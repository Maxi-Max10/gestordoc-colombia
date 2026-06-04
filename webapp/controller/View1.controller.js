sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "gestordoccolombia/util/LibraryLoader",
  // Helpers reutilizables
  "gestordoccolombia/controller/helpers/uiHelpers",
  "gestordoccolombia/controller/helpers/formatHelpers",
  // Lógica específica por documento
  "gestordoccolombia/controller/functions/kitRetiro",
  "gestordoccolombia/controller/functions/otroSiRodamiento",
  "gestordoccolombia/controller/functions/otroSiAlimentacion15",
  "gestordoccolombia/controller/functions/otroSiAlimentacion11",
  "gestordoccolombia/controller/functions/otroSiAlimentacion10",
  "gestordoccolombia/controller/functions/beneficiosExtralegales",
  "gestordoccolombia/controller/functions/solicitudDeduccionesRetencion",
  "gestordoccolombia/controller/functions/compromisoEtica",
  "gestordoccolombia/controller/functions/autorizacionDescuento",
  "gestordoccolombia/controller/functions/datosPersonales",
  "gestordoccolombia/controller/functions/noDeclarante",
  "gestordoccolombia/controller/functions/protocoloRecibo",
  "gestordoccolombia/controller/functions/contratoIndefIntegral",
  "gestordoccolombia/controller/functions/contratoTerminoFijo",
  "gestordoccolombia/controller/functions/contratoTerminoIndef",
  "gestordoccolombia/controller/functions/contratoAprendizajeLectivo",
  "gestordoccolombia/controller/functions/contratoAprendizajeProductivo"

], (Controller, JSONModel, MessageToast, LibraryLoader, uiHelpers, formatHelpers,
    kitRetiro, otroSiRodamiento, otroSiAlimentacion15, otroSiAlimentacion11,
    otroSiAlimentacion10, beneficiosExtralegales, solicitudDeduccionesRetencion,
    compromisoEtica, autorizacionDescuento, datosPersonales, noDeclarante,
    protocoloRecibo, contratoIndefIntegral, contratoTerminoFijo, contratoTerminoIndef, contratoAprendizajeLectivo, contratoAprendizajeProductivo) => {
  "use strict";

  return Controller.extend("gestordoccolombia.controller.View1", {

    // ═══════════════════════════════════════════════════════════════════
    // CATÁLOGO DE RAZONES DE EVENTOS
    // ═══════════════════════════════════════════════════════════════════
    // Mapa de todos los códigos de eventos laborales de SAP SuccessFactors.
    // Se usa en getEventReasonDescription() para mostrar texto legible
    // en lugar del código técnico (ej: "CB01" → "Mutuo acuerdo").
    // ═══════════════════════════════════════════════════════════════════
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


    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE BUSY DIALOG (Indicador de carga global)
    // ═══════════════════════════════════════════════════════════════════
    // Maneja un spinner/overlay de carga global usando un contador interno
    // (_busyCounter) para soportar múltiples operaciones simultáneas.
    // Cada operación llama _beginBusy() al inicio y _endBusy() al terminar.
    // El diálogo solo se cierra cuando el contador vuelve a 0.
    // Para envolver una operación async completa usar _withBusy(fn).
    // ═══════════════════════════════════════════════════════════════════

    _beginBusy: function () {
      if (!this.oGlobalBusyDialog) return;
      this._busyCounter = (this._busyCounter || 0) + 1;
      if (this._busyCounter === 1) {
        this.oGlobalBusyDialog.open();
      }
    },

    _endBusy: function () {
      if (!this.oGlobalBusyDialog) return;
      this._busyCounter = Math.max((this._busyCounter || 1) - 1, 0);
      if (this._busyCounter === 0) {
        this.oGlobalBusyDialog.close();
      }
    },

    // Envuelve una función async mostrando el busy dialog durante su ejecución.
    // Uso: this._withBusy(() => this._readOData(...))
    _withBusy: function (fn) {
      this._beginBusy();
      return Promise.resolve()
        .then(fn)
        .finally(() => this._endBusy());
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA DE LIBRERÍAS EXTERNAS
    // ═══════════════════════════════════════════════════════════════════
    // Las librerías PDF se cargan de forma lazy (solo cuando se necesitan)
    // y se cachean en _pdfToolkitPromise para no recargarlas en cada descarga.
    // - pdf-lib:     genera y manipula archivos PDF
    // - html2canvas: convierte HTML a imagen para incrustar en el PDF
    // ═══════════════════════════════════════════════════════════════════

    _ensurePdfToolkit: function () {
      if (!this._pdfToolkitPromise) {
        this._pdfToolkitPromise = Promise.all([
          LibraryLoader.ensureLibrary("pdf-lib", {
            url: "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
            globalName: "PDFLib",
            validator: lib => !!lib && typeof lib.PDFDocument === "function"
          }),
          LibraryLoader.ensureLibrary("html2canvas", {
            url: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            globalName: "html2canvas",
            validator: fn => typeof fn === "function"
          })
        ]).then(() => {
          this._pdfLibRef = window.PDFLib;
          this._html2canvasRef = window.html2canvas;
          return { PDFLib: this._pdfLibRef, html2canvas: this._html2canvasRef };
        });
      }
      return this._pdfToolkitPromise;
    },


    // ═══════════════════════════════════════════════════════════════════
    // UTILIDAD ODATA
    // ═══════════════════════════════════════════════════════════════════
    // Wrapper que convierte las llamadas OData de SAP (basadas en callbacks)
    // a Promesas, para poder usar async/await en el resto del controller.
    // ═══════════════════════════════════════════════════════════════════

    _readOData: function (oModel, sPath, mParameters) {
      return new Promise((resolve, reject) => {
        oModel.read(sPath, Object.assign({}, mParameters, {
          success: resolve,
          error: reject
        }));
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA INTELIGENTE DE EMPLEADOS
    // ═══════════════════════════════════════════════════════════════════
    // Antes de abrir el diálogo de selección, se determina qué empleados
    // cargar según el tipo de documento seleccionado:
    // - Documentos normales → empleados ACTIVOS (loadEmployees)
    // - Excolaboradores     → empleados INACTIVOS (loadEmployeesBkp)
    // La carga solo ocurre una vez por sesión (flag _activeEmployeesLoaded).
    // ═══════════════════════════════════════════════════════════════════

    _ensureDataForTitle: function (sTitle) {
      // Por ahora todos los documentos Colombia usan empleados activos.
      // Si en el futuro se agregan documentos de excolaboradores,
      // agregar la lógica de needsInactive aquí según sTitle.
      const needsActive   = true;
      const needsInactive = false;
      const aPromises     = [];

      if (needsActive && !this._activeEmployeesLoaded) {
        aPromises.push(this.loadEmployees());
      }
      if (needsInactive && !this._inactiveEmployeesLoaded) {
        aPromises.push(this.loadEmployeesBkp());
      }

      return aPromises.length ? Promise.all(aPromises) : Promise.resolve();
    },

    // Punto de entrada cuando el usuario hace click en un tile/documento.
    // Primero garantiza que los datos estén cargados, luego abre el diálogo.
    _handleTileSelection: function (sTitle) {
      return this._ensureDataForTitle(sTitle).then(() => {
        this._openDialogForTitle(sTitle);
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN DEL CONTROLLER
    // ═══════════════════════════════════════════════════════════════════
    // Se ejecuta una sola vez al cargar la vista.
    // Responsabilidades:
    //   - Crear el modelo de estado de la vista ("view")
    //   - Inicializar variables de control internas
    //   - Aplicar el tema guardado (dark/light)
    //   - Cargar info del usuario logueado
    //   - Mostrar el saludo según la hora
    // ═══════════════════════════════════════════════════════════════════

    onInit: function () {
      const oView     = this.getView();
      const bDarkMode = this._readStoredThemeMode();

      // Busy dialog global: se reutiliza durante toda la sesión
      this.oGlobalBusyDialog = new sap.m.BusyDialog();
      this._busyCounter      = 0;

      // Modelo "view": controla el estado de la UI (usuarios filtrados, título del diálogo, tema, etc.)
      const oViewModel = new JSONModel({
        BaseUsers:         [], // Lista base sin filtros (según el documento seleccionado)
        FilteredUsers:     [], // Lista que se muestra en la tabla (resultado de búsqueda/fecha)
        SelectedUsers:     [], // Usuarios marcados en la tabla (uso interno)
        DialogTitle:       "",
        IsDarkMode:        bDarkMode,
        ThemeToggleText:   bDarkMode ? "☾" : "☀",
        ThemeToggleTooltip: bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      });
      oViewModel.setSizeLimit(999999); // Sin límite práctico para empresas con muchos empleados
      this.getOwnerComponent().setModel(oViewModel, "view");

      // Aplica el tema guardado en localStorage
      this._applyThemeMode(bDarkMode);

      // Variables internas de control
      this.aSelectedEmployees       = [];    // Empleados seleccionados en la tabla
      this._activeEmployeesLoaded   = false; // Flag: evita recargar empleados activos
      this._inactiveEmployeesLoaded = false; // Flag: evita recargar empleados inactivos
      this._activeEmployeesRequest  = null;  // Promesa en curso (evita llamadas duplicadas)
      this._inactiveEmployeesRequest = null;
      this._tilesEventsAttached     = false; // Flag: eventos de tiles ya registrados
      this._currentCategory         = null;  // Categoría del documento seleccionado
      this._activeSearch            = "";    // Texto actual del buscador
      this._activeDateFilter        = null;  // Rango de fechas activo

      // Carga info del usuario (empresa, permisos, nombre para el saludo)
      this.getUserInfo();
      this.updateGreeting();

      // Carga el logo desde la carpeta img del proyecto
      const oImage = this.byId("_IDGenImageeee");
      if (oImage) {
        oImage.setSrc(sap.ui.require.toUrl("gestordoccolombia/img/logo.png"));
      }

      // Registra los eventos de los tiles (press handlers)
      this.attachBoxEvents();
    },


    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE TEMA (DARK / LIGHT MODE)
    // ═══════════════════════════════════════════════════════════════════
    // El tema se guarda en localStorage para persistir entre sesiones.
    // Se aplica agregando/quitando la clase CSS "gdDarkMode" en el DOM.
    // ═══════════════════════════════════════════════════════════════════

    // Lee el tema guardado. Devuelve true si es dark, false si es light.
    _readStoredThemeMode: function () {
      try {
        return window.localStorage.getItem("gestordoccolombia-theme") === "dark";
      } catch (oError) {
        return false;
      }
    },

    // Aplica el tema al DOM y actualiza el modelo de vista y localStorage.
    _applyThemeMode: function (bDarkMode) {
      const sThemeClass = "gdDarkMode";
      const oViewModel  = this.getOwnerComponent().getModel("view");

      document.documentElement.classList.toggle(sThemeClass, bDarkMode);
      if (document.body) {
        document.body.classList.toggle(sThemeClass, bDarkMode);
      }

      if (oViewModel) {
        oViewModel.setProperty("/IsDarkMode",        bDarkMode);
        oViewModel.setProperty("/ThemeToggleText",   bDarkMode ? "☾" : "☀");
        oViewModel.setProperty("/ThemeToggleTooltip", bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      }

      try {
        window.localStorage.setItem("gestordoccolombia-theme", bDarkMode ? "dark" : "light");
      } catch (oError) {
        console.warn("No se pudo guardar la preferencia de tema:", oError);
      }
    },

    // Handler del botón de toggle de tema en la barra superior.
    onToggleTheme: function () {
      const oViewModel = this.getOwnerComponent().getModel("view");
      const bDarkMode  = !(oViewModel && oViewModel.getProperty("/IsDarkMode"));
      this._applyThemeMode(bDarkMode);
    },


    // ═══════════════════════════════════════════════════════════════════
    // PRELOADER INICIAL
    // ═══════════════════════════════════════════════════════════════════
    // Oculta el splash screen de carga inicial una vez que el grid de
    // tiles está visualmente estable (posiciones fijas por N frames).
    // Tiene un tiempo mínimo (2.4s) y máximo (6.5s) de espera.
    // ═══════════════════════════════════════════════════════════════════

    _hideInitialPreloader: function () {
      if (this._initialPreloaderHideRequested) return;
      this._initialPreloaderHideRequested = true;

      const fnHide = () => {
        if (typeof window.gmaHideAppPreloader === "function") {
          window.gmaHideAppPreloader();
        }
      };

      this._waitForInitialLayoutReady().then(fnHide).catch(fnHide);
    },

    // Espera a que el grid de tiles tenga posiciones estables durante
    // iRequiredStableFrames frames consecutivos antes de resolver.
    _waitForInitialLayoutReady: function () {
      const iMinWait             = 2400;
      const iMaxWait             = 6500;
      const iRequiredStableFrames = 12;
      const iStartedAt           = Date.now();
      const fnNextFrame          = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));

      try { sap.ui.getCore().applyChanges(); } catch (e) {}

      return new Promise((resolve) => {
        let sLastSignature = "";
        let iStableFrames  = 0;

        const fnGetLayoutSignature = () => {
          const oGrid      = this.byId("gridItems");
          const oGridDomRef = oGrid?.getDomRef();
          const aContent   = oGrid?.getContent?.() || [];

          if (!oGridDomRef || !aContent.length) return "";

          const oGridRect    = oGridDomRef.getBoundingClientRect();
          const aVisibleRects = aContent
            .filter(oItem => oItem.getVisible && oItem.getVisible())
            .map(oItem => oItem.getDomRef && oItem.getDomRef())
            .filter(Boolean)
            .map(oDomRef => {
              const r = oDomRef.getBoundingClientRect();
              return [
                Math.round(r.left - oGridRect.left),
                Math.round(r.top  - oGridRect.top),
                Math.round(r.width),
                Math.round(r.height)
              ].join(":");
            });

          return aVisibleRects.length ? aVisibleRects.join("|") : "";
        };

        const fnCheck = () => {
          const iElapsed  = Date.now() - iStartedAt;
          const sSignature = fnGetLayoutSignature();

          if (sSignature && sSignature === sLastSignature) {
            iStableFrames += 1;
          } else {
            sLastSignature = sSignature;
            iStableFrames  = 0;
          }

          if ((iElapsed >= iMinWait && iStableFrames >= iRequiredStableFrames) || iElapsed >= iMaxWait) {
            resolve();
            return;
          }
          fnNextFrame(fnCheck);
        };

        fnNextFrame(fnCheck);
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // AUTENTICACIÓN Y DATOS DEL USUARIO
    // ═══════════════════════════════════════════════════════════════════
    // Flujo de inicio de sesión:
    //   1. getUserInfo()    → obtiene el userId del usuario logueado
    //   2. getUserCompany() → obtiene la empresa del usuario (ej: CO10)
    //   3. getDataUser()    → obtiene grupo/permisos y configura la UI
    //
    // La empresa se usa como filtro en las consultas de empleados,
    // para que cada usuario solo vea colaboradores de su propia empresa.
    // ═══════════════════════════════════════════════════════════════════

    // Obtiene la URL base del módulo para llamadas a APIs internas de SAP BTP.
    getBaseURL: function () {
      const appId      = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      const appPath    = appId.replaceAll(".", "/");
      return jQuery.sap.getModulePath(appPath);
    },

    // Consulta la empresa del userId en SuccessFactors.
    // Si falla, usa "CO10" como empresa por defecto.
    getUserCompany: function (userId) {
      const oModel = this.getOwnerComponent().getModel();
      return new Promise((resolve) => {
        oModel.read("/User('" + userId + "')", {
          urlParameters: {
            "$select": "userId,empInfo/jobInfoNav/company",
            "$expand": "empInfo/jobInfoNav"
          },
          success: function (oData) {
            const sCompany = oData?.empInfo?.jobInfoNav?.results?.[0]?.company || "CO10";
            resolve(sCompany);
          },
          error: function () {
            console.warn("No se pudo obtener la empresa, usando CO10 por defecto.");
            resolve("CO10");
          }
        });
      });
    },

    // Detecta el userId del usuario logueado a través de la API de SAP BTP.
    // Una vez obtenido, encadena getUserCompany() y getDataUser().
    getUserInfo: function () {
      const that = this;
      const url  = this.getBaseURL() + "/user-api/currentUser";
      const UseroModel = new JSONModel();
      UseroModel.loadData(url);

      UseroModel.attachRequestCompleted(function () {
        // Fallback para testing local: si no hay email válido, usa usuario de prueba
        let userId = (!UseroModel.getData().email ||
                      UseroModel.getData().email === "rodrigo.lopez@agprodservicios.com")
          ? "excagp"
          : UseroModel.getData().name;

        UseroModel.setProperty("/firstname", userId);
        that.getOwnerComponent().setModel(UseroModel, "user");

        that.getUserCompany(userId).then(function (sCompany) {
          UseroModel.setProperty("/company", sCompany);
          that.getDataUser(userId);
        }).catch(function () {
          MessageToast.show("Error al obtener información de la empresa.");
          that.oGlobalBusyDialog.close();
          that._hideInitialPreloader();
        });
      });

      UseroModel.attachRequestFailed(function () {
        that.oGlobalBusyDialog.close();
        that._hideInitialPreloader();
      });
    },

    // Obtiene el grupo/perfil del usuario desde el mantenedor de grupos
    // (cust_GD_mantenedorGrupos) y configura la visibilidad de los tiles
    // según sus permisos:
    //   - "admin"   → ve todos los documentos
    //   - "usuario" → no ve ningún documento (solo lectura/consulta)
    //   - "ninguno" → sin acceso
    getDataUser: function (user) {
      const that             = this;
      const readUrlModelGroup = "/cust_GD_mantenedorGrupos('" + user + "')";

      this.getView().getModel().read(readUrlModelGroup, {
        success: function (oData) {
          const userModel  = that.getOwnerComponent().getModel("user");
          const cleanData  = JSON.parse(JSON.stringify(oData));

          userModel.setProperty("/datos",       cleanData);
          userModel.setProperty("/displayName", cleanData.displayName);
          that.updateGreeting();

          // Género para tratamiento gramatical en documentos
          userModel.setProperty("/gender",
            cleanData.gender === "F" ? "genero_Femenino" : "genero_Masculino"
          );

          // Grupo y permisos
          const grupo = cleanData.cust_grupo;
          userModel.setProperty("/grupo", grupo);

          let permisos = "ninguno";
          if (grupo === "Gestor Documental - Administradores") permisos = "admin";
          else if (grupo === "Gestor Documental - Usuarios")   permisos = "usuario";
          userModel.setProperty("/permisos", permisos);

          // IDs de todos los tiles de documentos
          const aTileIds = [
            "customListItemKitRetiro",
            "customListItemOtroSiRodamiento",
            "customListItemOtroSiAlimentacion15",
            "customListItemOtroSiAlimentacion11",
            "customListItemOtroSiAlimentacion10",
            "customListItemBeneficiosExtralegales",
            "customListItemSolicitudDeduccionesRetencion",
            "customListItemCompromisoEtica",
            "customListItemAutorizacionDescuento",
            "customListItemDatosPersonales",
            "customListItemNoDeclarante",
            "customListItemProtocoloRecibo",
            "customListItemContratoIndefIntegral",
            "customListItemContratoTerminoFijo",
            "customListItemContratoTerminoIndef",
            "customListItemContratoAprendizajeLectivo",
            "customListItemContratoAprendizajeProductivo"
          ];

          // Admins ven todo, usuarios no ven nada
          const bVisible = (permisos === "admin");
          aTileIds.forEach(sId => {
            that.byId(sId)?.setVisible(bVisible);
          });

          that._hideInitialPreloader();
        },

        error: function (oError) {
          MessageToast.show("Error al leer grupo de usuario.");
          console.error(oError);
          that._hideInitialPreloader();
        }
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA DE EMPLEADOS ACTIVOS
    // ═══════════════════════════════════════════════════════════════════
    // Trae todos los empleados con status='t' (activos) de la empresa
    // del usuario logueado. La carga es lazy y se ejecuta una sola vez
    // por sesión (controlado por _activeEmployeesLoaded).
    //
    // Los datos se enriquecen con campos calculados:
    //   - paycompValue:    salario extraído de navegación anidada
    //   - nationalId:      cédula (solo cardType === "CC")
    //   - salut:           tratamiento (Sr./Sra./Srta.)
    //   - marriageStatus:  estado civil en texto, adaptado al género
    //   - customLong1:     campo personalizado de SuccessFactors
    // ═══════════════════════════════════════════════════════════════════

    loadEmployees: function () {
      // Si ya hay una carga en curso, devuelve esa promesa (evita duplicados)
      if (this._activeEmployeesRequest) return this._activeEmployeesRequest;

      const oComponentModel = this.getOwnerComponent().getModel();
      const sUserCompany    = this.getOwnerComponent().getModel("user").getProperty("/company") || "CO10";

      const sSelect = [
        "userId", "status", "firstName", "lastName", "email", "nationality",
        "jobCode", "title", "custom02", "custom03", "businessPhone", "state",
        "custom10", "hireDate", "country", "salutation", "division", "department",
        "defaultFullName", "gender",
        "manager/jobCode", "manager/businessPhone", "manager/email",
        "empInfo/customDate1", "empInfo/startDate", "empInfo/endDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason", "empInfo/jobInfoNav/company",
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

      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status eq 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      })).then(oUsers => {
        const aUsers = Array.isArray(oUsers?.results) ? oUsers.results : [];

        const enrichedUsers = aUsers.map(user => {
          // Salario
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]
                              ?.empPayCompRecurringNav?.results?.[0]?.paycompvalue;
          user.paycompvalue = salaryRaw || 0;
          user.paycompValue = salaryRaw || 0;

          // Cédula (solo documentos tipo CC - Cédula de Ciudadanía)
          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          user.nationalId = nationalIdResults.find(i => i.cardType === "CC")?.nationalId ?? "";

          // Tratamiento (salut)
          user.salut = user.salutation === "3526" ? "Sra."
                     : user.salutation === "3525" ? "Sr."
                     : "Srta.";

          // Campo personalizado
          user.customLong1 = user.empInfo?.personNav?.customLong1 || "";

          // Estado civil en texto, adaptado al género
          const marriageStatusId = user.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
          user.marriageStatusId  = marriageStatusId;
          const isFemale         = user.gender === "F";
          const statusMap        = {
            "3528": isFemale ? "divorciada"   : "divorciado",
            "3530": isFemale ? "casada"        : "casado",
            "3529": isFemale ? "separada"      : "separado",
            "3531": isFemale ? "soltera"       : "soltero",
            "3532": isFemale ? "viuda"         : "viudo",
            "3533": "unión libre"
          };
          user.marriageStatus = statusMap[marriageStatusId] || "";

          return user;
        });

        this.getView().setModel(new JSONModel({ User: enrichedUsers }));
        this._activeEmployeesLoaded = true;
        this.attachBoxEvents();
        return enrichedUsers;

      }).catch(oError => {
        console.error("Error cargando empleados activos:", oError);
        MessageToast.show("Error cargando los datos.");
        this._activeEmployeesLoaded = false;
        throw oError;
      });

      this._activeEmployeesRequest = pFetch;
      pFetch.finally(() => {
        if (this._activeEmployeesRequest === pFetch) this._activeEmployeesRequest = null;
      });
      return pFetch;
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA DE EMPLEADOS INACTIVOS
    // ═══════════════════════════════════════════════════════════════════
    // Similar a loadEmployees() pero con filtro status !== 't'.
    // Usado para documentos de excolaboradores (si se agregan en el futuro).
    // Los datos se guardan en el modelo con nombre "inactive".
    // ═══════════════════════════════════════════════════════════════════

    loadEmployeesBkp: function () {
      if (this._inactiveEmployeesRequest) return this._inactiveEmployeesRequest;

      const oComponentModel = this.getOwnerComponent().getModel();
      const sUserCompany    = this.getOwnerComponent().getModel("user").getProperty("/company") || "CO10";

      const sSelect = [
        "userId", "status", "firstName", "lastName", "email", "nationality",
        "jobCode", "title", "custom02", "custom03", "businessPhone", "state",
        "custom10", "hireDate", "country", "salutation", "division", "department",
        "defaultFullName", "gender",
        "manager/jobCode", "manager/businessPhone", "manager/email",
        "empInfo/customDate1", "empInfo/startDate", "empInfo/endDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason", "empInfo/jobInfoNav/company",
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

      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status ne 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      })).then(oData => {
        const aUsers   = [];
        const aResults = Array.isArray(oData?.results) ? oData.results : [];

        aResults.forEach(user => {
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]
                              ?.empPayCompRecurringNav?.results?.[0]?.paycompvalue || 0;
          user.paycompValue     = salaryRaw;
          user.paycompvalue     = salaryRaw;
          user.marriageStatusId = user?.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
          user.defaultFullName  = user.defaultFullName || "";
          user.fullNameReverse  = `${user.lastName || ""} ${user.firstName || ""}`.toLowerCase();
          user.customLong1      = user?.empInfo?.personNav?.customLong1 || "";

          user.salut = user.salutation === "3526" ? "Sra."
                     : user.salutation === "3525" ? "Sr."
                     : "Srta.";

          const isFemale  = user.gender === "F";
          const statusMap = {
            "3528": isFemale ? "divorciada" : "divorciado",
            "3530": isFemale ? "casada"     : "casado",
            "3529": isFemale ? "separada"   : "separado",
            "3531": isFemale ? "soltera"    : "soltero",
            "3532": isFemale ? "viuda"      : "viudo",
            "3533": "unión libre"
          };
          user.marriageStatus = statusMap[user.marriageStatusId] || "";

          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          user.nationalId = nationalIdResults.find(i => i.cardType === "CC")?.nationalId ?? "";

          aUsers.push(user);
        });

        this.getView().setModel(new JSONModel({ InactiveUsers: aUsers }), "inactive");
        this._inactiveEmployeesLoaded = true;
        this.attachBoxEvents();

      }).catch(oError => {
        MessageToast.show("Error al cargar empleados dados de baja.");
        console.error(oError);
        this._inactiveEmployeesLoaded = false;
        throw oError;
      });

      this._inactiveEmployeesRequest = pFetch;
      pFetch.finally(() => {
        if (this._inactiveEmployeesRequest === pFetch) this._inactiveEmployeesRequest = null;
      });
      return pFetch;
    },


    // ═══════════════════════════════════════════════════════════════════
    // DIÁLOGO DE SELECCIÓN DE EMPLEADOS
    // ═══════════════════════════════════════════════════════════════════
    // Al abrir el diálogo se aplica un filtro base según el documento:
    // - Actualmente todos los documentos Colombia filtran solo Administrativos.
    // - Si en el futuro un documento necesita Operativos o todos,
    //   se puede agregar lógica aquí según sTitle.
    // ═══════════════════════════════════════════════════════════════════

    _openDialogForTitle: function (sTitle) {
      const oView           = this.getView();
      const oDialog         = oView.byId("employeeDialog");
      const oViewStateModel = oView.getModel("view");

      if (!oViewStateModel) {
        console.error("No se encontró el modelo 'view'.");
        return;
      }

      // Determina el array fuente según el tipo de documento
      const isInactive = sTitle === "Certificado Laboral Excolaborador" ||
                         sTitle === "Notificación Salida Ministerio";
      const oSourceModel = isInactive ? oView.getModel("inactive") : oView.getModel();
      const aUsers       = isInactive
        ? (oSourceModel?.getProperty("/InactiveUsers") || [])
        : (oSourceModel?.getProperty("/User") || []);

      if (!Array.isArray(aUsers) || aUsers.length === 0) {
        console.error("No hay usuarios disponibles para el diálogo.");
        return;
      }

      // Filtro base: solo Administrativos (aplica a todos los documentos Colombia actuales)
      const aFilteredUsers = aUsers.filter(user => user.custom02 === "Administrativo");
      if (!aFilteredUsers.length) {
        console.warn("No se encontraron usuarios Administrativos.");
      }

      // Actualiza el modelo de estado con la lista base y el título
      oViewStateModel.setProperty("/BaseUsers",     aFilteredUsers);
      oViewStateModel.setProperty("/FilteredUsers", aFilteredUsers);
      oViewStateModel.setProperty("/DialogTitle",   sTitle);

      if (oDialog) {
        oView.byId("idUserTable").setModel(oViewStateModel, "view");
        oDialog.setTitle(sTitle);
        oDialog.open();
      } else {
        console.error("No se encontró el diálogo employeeDialog.");
      }

      // Resetea los filtros activos para que el diálogo arranque limpio
      this._applyCombinedFilters();
    },


    // ═══════════════════════════════════════════════════════════════════
    // CICLO DE VIDA DEL DIÁLOGO
    // ═══════════════════════════════════════════════════════════════════

    // Antes de abrir: aplica blur al fondo y limpia filtros anteriores.
    onBeforeOpenDialog: function () {
      const oView    = this.getView();
      const oTable   = oView.byId("idUserTable");
      const oBinding = oTable.getBinding("items");

      oView.byId("contentContainer").addStyleClass("blurredBackground");
      oView.byId("searchField").setValue("");
      oView.byId("dateRange").setDateValue(null);
      oView.byId("dateRange").setSecondDateValue(null);
      this._activeSearch      = "";
      this._activeDateFilter  = null;
      oBinding.filter([]);
      oTable.removeSelections();
    },

    // Después de cerrar: remueve el blur del fondo.
    onAfterCloseDialog: function () {
      this.getView().byId("contentContainer").removeStyleClass("blurredBackground");
    },

    // Cierra el diálogo y resetea todo el estado relacionado a la selección.
    onCloseDialog: function () {
      const oView           = this.getView();
      const oTable          = oView.byId("idUserTable");
      const oBinding        = oTable.getBinding("items");
      const oViewStateModel = oView.getModel("view");

      oView.byId("searchField").setValue("");
      oView.byId("dateRange").setDateValue(null);
      oView.byId("dateRange").setSecondDateValue(null);
      this._activeSearch     = "";
      this._activeDateFilter = null;

      oViewStateModel?.setProperty("/BaseUsers",     []);
      oViewStateModel?.setProperty("/FilteredUsers", []);
      oBinding.filter([]);
      oTable.removeSelections();
      this.aSelectedEmployees = [];

      oView.byId("employeeDialog").close();
      this.onAfterCloseDialog();
    },


    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE FILTROS COMBINADOS
    // ═══════════════════════════════════════════════════════════════════
    // La tabla de empleados soporta dos filtros simultáneos:
    //   1. Rango de fechas (hireDate para activos, endDate para inactivos)
    //   2. Búsqueda por texto (nombre, apellido, userId, cédula, etc.)
    //
    // Ambos filtros operan sobre el array BaseUsers (ya filtrado por
    // tipo de documento) y el resultado se guarda en FilteredUsers.
    // Los filtros se recalculan cada vez que el usuario escribe o cambia fechas.
    // ═══════════════════════════════════════════════════════════════════

    _applyCombinedFilters: function () {
      const oView          = this.getView();
      const oViewStateModel = oView.getModel("view");
      const isExColaborador = this.sSelectedContract === "Certificado Laboral Excolaborador" ||
                              this.sSelectedContract === "Notificación Salida Ministerio";

      // Apunta la tabla al modelo correcto (activos o inactivos)
      const oModel = isExColaborador ? oView.getModel("inactive") : oView.getModel();
      const oTable = this.byId("idUserTable");
      if (oTable.getModel() !== oModel) oTable.setModel(oModel);

      // Parte del array base definido al abrir el diálogo
      const aBaseFromState = oViewStateModel?.getProperty("/BaseUsers");
      let filtered = Array.isArray(aBaseFromState) && aBaseFromState.length
        ? aBaseFromState
        : (isExColaborador
            ? (oModel.getProperty("/InactiveUsers") || [])
            : (oModel.getProperty("/User") || []));

      // --- Filtro por rango de fechas ---
      if (this._activeDateFilter?.dFrom && this._activeDateFilter?.dTo) {
        const toUTC = d => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const utcFrom = toUTC(this._activeDateFilter.dFrom);
        const utcTo   = toUTC(this._activeDateFilter.dTo);

        filtered = filtered.filter(user => {
          const raw = isExColaborador ? user.empInfo?.endDate : user.hireDate;
          if (!raw) return false;
          const d   = new Date(raw);
          const utcD = toUTC(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
          return utcFrom.getTime() === utcTo.getTime()
            ? utcD.getTime() === utcFrom.getTime()
            : utcD >= utcFrom && utcD <= utcTo;
        });
      }

      // --- Filtro por texto (acepta múltiples palabras como AND) ---
      if (this._activeSearch?.trim()) {
        const normalize = str =>
          str?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
             .replace(/\s+/g, " ").trim().toLowerCase() || "";
        const words = normalize(this._activeSearch).split(" ");

        filtered = filtered.filter(user =>
          words.every(word =>
            normalize(user.firstName).includes(word)    ||
            normalize(user.lastName).includes(word)     ||
            normalize(user.userId).includes(word)       ||
            normalize(user.nationalId).includes(word)   ||
            normalize(user.defaultFullName).includes(word) ||
            normalize(user.fullNameReverse).includes(word) ||
            normalize(user.custom02).includes(word)     ||
            normalize(user.customLong1).includes(word)
          )
        );
      }

      oViewStateModel?.setProperty("/FilteredUsers", filtered);

      // Fuerza refresco del binding de la tabla (UI5 puede cachear)
      const oItemsBinding = oTable.getBinding("items");
      if (typeof oItemsBinding?.refresh === "function") oItemsBinding.refresh();
    },

    // Handler del DateRangePicker: actualiza el filtro de fechas activo.
    onDateFilterChange: function () {
      const oDateRange = this.byId("dateRange");
      this._activeDateFilter = {
        dFrom: oDateRange.getDateValue(),
        dTo:   oDateRange.getSecondDateValue()
      };
      this._applyCombinedFilters();
    },

    // Handler del SearchField (evento liveChange): actualiza el texto de búsqueda.
    onSearch: function (oEvent) {
      const sNewValue = oEvent?.getParameter?.("newValue");
      this._activeSearch = (typeof sNewValue === "string")
        ? sNewValue
        : (oEvent.getSource?.().getValue?.() || "");
      this._applyCombinedFilters();
    },

    // Handler alternativo para el campo de búsqueda (evento change).
    onSearchFieldChange: function (oEvent) {
      this._activeSearch = oEvent.getParameter("newValue") || "";
      this._applyCombinedFilters();
    },


    // ═══════════════════════════════════════════════════════════════════
    // DELEGACIONES A HELPERS DE FORMATO
    // ═══════════════════════════════════════════════════════════════════
    // Estos métodos exponen las funciones de formatHelpers.js como métodos
    // del controller, para que puedan ser llamados desde los archivos de
    // functions/ (que reciben 'this' como contexto del controller).
    // Ver: gestordoccolombia/controller/helpers/formatHelpers.js
    // ═══════════════════════════════════════════════════════════════════

    formatDateToSpanish:  function (sDate)      { return formatHelpers.formatDateToSpanish(sDate); },
    formatFechaCorta:     function (fecha)       { return formatHelpers.formatFechaCorta(fecha); },
    formatFechaFormal:    function (fechaInput)  { return formatHelpers.formatFechaFormal(fechaInput); },
    convertNumberToWords: function (num)         { return formatHelpers.convertNumberToWords(num); },
    formatDateToWords:    function (date)        { return formatHelpers.formatDateToWords(date); },
    formatDateToSpanish:  function (sDate)      { return formatHelpers.formatDateToSpanish(sDate); },
    formatFechaCorta:     function (fecha)       { return formatHelpers.formatFechaCorta(fecha); },
    formatFechaFormal:    function (fechaInput)  { return formatHelpers.formatFechaFormal(fechaInput); },
    convertNumberToWords: function (num)         { return formatHelpers.convertNumberToWords(num); },
    formatDateToWords:    function (date)        { return formatHelpers.formatDateToWords(date); },
    resolveGender:        function (text, gender){ return formatHelpers.resolveGender(text, gender); },
    getCiudadWork:        function (user)        { return formatHelpers.getCiudadWork(user); },
    getLocalDate:         function ()            { return formatHelpers.getLocalDate(); },
    formatDateRaw:        function (dateStr)     { return formatHelpers.formatDateRaw(dateStr); },
    formatSalary:         function (value)       { return formatHelpers.formatSalary(value); },

    // Devuelve un array con los datos completos de los empleados seleccionados en la tabla.
    // Cada elemento incluye todos los campos necesarios para rellenar las plantillas de documentos.
    getSelectedUsers: function () { return formatHelpers.getSelectedUsers.call(this); },


    // ═══════════════════════════════════════════════════════════════════
    // DELEGACIÓN A HELPER DE UI
    // ═══════════════════════════════════════════════════════════════════

    // Actualiza el texto de saludo ("Buenos días/tardes/noches, [Nombre]")
    // y la fecha en el banner superior según la hora actual.
    updateGreeting: function () {
      const oUserModel   = this.getOwnerComponent().getModel("user");
      const sDisplayName = oUserModel?.getProperty("/displayName") || oUserModel?.getProperty("/firstname") || "";
      uiHelpers.updateGreeting(this.getView(), sDisplayName);
    },


    // ═══════════════════════════════════════════════════════════════════
    // TILES / CARDS DE DOCUMENTOS
    // ═══════════════════════════════════════════════════════════════════
    // Los eventos de press de cada tile están declarados directamente en
    // el XML de la vista. Esta función se mantiene por compatibilidad
    // pero no registra eventos adicionales.
    // ═══════════════════════════════════════════════════════════════════

    attachBoxEvents: function () {
      if (this._tilesEventsAttached) return;
      this._tilesEventsAttached = true;
      // Los press handlers están en la vista XML (onXxxPress)
    },

    // Lista de tiles para el buscador de documentos (onDocumentSearch).
    // Cada entrada tiene: id del control, título y descripción para búsqueda.
    _getDocumentSearchCards: function () {
      return [
        { id: "customListItemKitRetiro",                   title: "Kit De Retiro",                    desc: "Gestionar kit de retiro" },
        { id: "customListItemOtroSiRodamiento",            title: "Otro Sí - Rodamiento",             desc: "Auxilio de rodamiento" },
        { id: "customListItemOtroSiAlimentacion15",        title: "Otro Sí - Alimentación 15",        desc: "Auxilio de alimentación 15" },
        { id: "customListItemOtroSiAlimentacion11",        title: "Otro Sí - Alimentación 11",        desc: "Auxilio de alimentación 11" },
        { id: "customListItemOtroSiAlimentacion10",        title: "Otro Sí - Alimentación 10",        desc: "Auxilio de alimentación 10" },
        { id: "customListItemBeneficiosExtralegales",      title: "Beneficios Extralegales",          desc: "Gestionar beneficios extralegales" },
        { id: "customListItemSolicitudDeduccionesRetencion", title: "Solicitud Deducciones Retencion", desc: "Gestionar solicitud de deducciones y retenciones" },
        { id: "customListItemCompromisoEtica",             title: "Compromiso con la Ética",          desc: "Declaración de principios éticos" },
        { id: "customListItemAutorizacionDescuento",       title: "Autorización de Descuento",        desc: "Gestionar autorización de descuento" },
        { id: "customListItemDatosPersonales",             title: "Datos Personales",                 desc: "Actualizar datos personales" },
        { id: "customListItemNoDeclarante",                title: "No Declarante",                    desc: "Certificado de no declarante" },
        { id: "customListItemProtocoloRecibo",             title: "Protocolo de Recibo",              desc: "Generar protocolo de recibo" },
        { id: "customListItemContratoIndefIntegral",       title: "Contrato Indefinido Integral",     desc: "Generar contrato indefinido integral" },
        { id: "customListItemContratoTerminoFijo",         title: "Contrato a Término Fijo",          desc: "Generar contrato a término fijo" },
        { id: "customListItemContratoTerminoIndef",       title: "Contrato a Término Indefinido",    desc: "Generar contrato a término indefinido" },
        { id: "customListItemContratoAprendizajeLectivo", title: "Contrato Aprendizaje Lectivo",      desc: "Generar contrato de aprendizaje lectivo" },
        { id: "customListItemContratoAprendizajeProductivo", title: "Contrato Aprendizaje Productivo", desc: "Generar contrato de aprendizaje productivo" }
      ];
    },

    // Normaliza un texto para búsqueda: quita tildes, minúsculas, sin espacios extra.
    _normalizeSearchText: function (sValue) {
      return String(sValue || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    },

    // Handler del buscador de tiles en la pantalla principal.
    // Filtra qué tiles son visibles en el grid según el texto ingresado.
    onDocumentSearch: function (oEvent) {
      const oSearchField = this.byId("documentSearch");
      const sValue = oEvent?.getParameter("newValue") ?? oEvent?.getParameter("query") ?? oSearchField?.getValue() ?? "";
      const sQuery = this._normalizeSearchText(sValue);
      const aCards = this._getDocumentSearchCards();
      const oGrid  = this.byId("gridItems");

      oSearchField?.toggleStyleClass("documentSearchFieldActive", Boolean(sQuery));
      if (!oGrid) return;

      // Guarda el estado original del grid la primera vez que se busca
      if (sQuery && !this._documentSearchBaseState) {
        const aCurrentContent = oGrid.getContent();
        this._documentSearchBaseState = {};
        aCards.forEach(oCard => {
          const oItem = this.byId(oCard.id);
          if (oItem) {
            this._documentSearchBaseState[oCard.id] = {
              inGrid:  aCurrentContent.includes(oItem),
              visible: oItem.getVisible()
            };
          }
        });
      }

      // Si se borra la búsqueda, restaura el estado original del grid
      if (!sQuery) {
        if (this._documentSearchBaseState) {
          oGrid.removeAllContent();
          aCards.forEach(oCard => {
            const oItem  = this.byId(oCard.id);
            const oState = this._documentSearchBaseState[oCard.id];
            if (oItem && oState?.inGrid && oState.visible) {
              oItem.setVisible(true);
              oGrid.addContent(oItem);
            }
          });
          this._documentSearchBaseState = null;
        }
        return;
      }

      // Muestra solo los tiles que coinciden con la búsqueda
      oGrid.removeAllContent();
      aCards.forEach(oCard => {
        const oItem  = this.byId(oCard.id);
        const oState = this._documentSearchBaseState?.[oCard.id];
        if (!oItem || !oState?.inGrid || !oState.visible) return;

        const sSearchText = this._normalizeSearchText(`${oCard.title} ${oCard.desc}`);
        if (sSearchText.includes(sQuery)) {
          oItem.setVisible(true);
          oGrid.addContent(oItem);
        }
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // HANDLERS DE PRESS DE TILES (uno por documento)
    // ═══════════════════════════════════════════════════════════════════
    // Cada handler registra qué documento fue seleccionado y llama a
    // _handleTileSelection() para cargar datos y abrir el diálogo.
    // El patrón es idéntico en todos: solo cambia sTitle y _currentCategory.
    // ═══════════════════════════════════════════════════════════════════

    onKitRetiroPress: function () {
      this.sSelectedContract = "Kit De Retiro";
      this._currentCategory  = "kitRetiro";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiRodamientoPress: function () {
      this.sSelectedContract = "Otro Sí - Rodamiento";
      this._currentCategory  = "otroSiRodamiento";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiAlimentacion15Press: function () {
      this.sSelectedContract = "Otro Sí - Alimentación 15";
      this._currentCategory  = "otroSiAlimentacion15";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiAlimentacion11Press: function () {
      this.sSelectedContract = "Otro Sí - Alimentación 11";
      this._currentCategory  = "otroSiAlimentacion11";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiAlimentacion10Press: function () {
      this.sSelectedContract = "Otro Sí - Alimentación 10";
      this._currentCategory  = "otroSiAlimentacion10";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onBeneficiosExtralegalesPress: function () {
      this.sSelectedContract = "Beneficios Extralegales";
      this._currentCategory  = "beneficiosExtralegales";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onDeduccionesPress: function () {
      this.sSelectedContract = "Solicitud Deducciones Retencion";
      this._currentCategory  = "solicitudDeduccionesRetencion";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onCompromisoEticaPress: function () {
      this.sSelectedContract = "Compromiso con la Ética";
      this._currentCategory  = "compromisoEtica";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onAutorizacionDescuentoPress: function () {
      this.sSelectedContract = "Autorización de Descuento";
      this._currentCategory  = "autorizacionDescuento";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onDatosPersonalesPress: function () {
      this.sSelectedContract = "Datos Personales";
      this._currentCategory  = "datosPersonales";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onNoDeclarantePress: function () {
      this.sSelectedContract = "No Declarante";
      this._currentCategory  = "noDeclarante";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onProtocoloReciboPress: function () {
      this.sSelectedContract = "Protocolo de Recibo";
      this._currentCategory  = "protocoloRecibo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onContratoIntegralPress: function () {
      this.sSelectedContract = "Contrato Indefinido Integral";
      this._currentCategory  = "contratoIndefIntegral";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

      onContratoTerminoFijoPress: function () {
      this.sSelectedContract = "Contrato a Término Fijo";
      this._currentCategory  = "contratoTerminoFijo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onContratoIndefinidoPress: function () {
      this.sSelectedContract = "Contrato a Término Indefinido";
      this._currentCategory  = "contratoTerminoIndef";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

      onContratoAprendizajeLectivoPress: function () {
      this.sSelectedContract = "Contrato Aprendizaje Lectivo";
      this._currentCategory  = "contratoAprendizajeLectivo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

      onContratoAprendizajeProductivoPress: function () {
      this.sSelectedContract = "Contrato Aprendizaje Productivo";
      this._currentCategory  = "contratoAprendizajeProductivo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },



    // ═══════════════════════════════════════════════════════════════════
    // SELECCIÓN DE EMPLEADOS EN LA TABLA
    // ═══════════════════════════════════════════════════════════════════
    // Mantiene el array aSelectedEmployees sincronizado con la selección
    // actual de la tabla. Soporta selección múltiple y deselección.
    // ═══════════════════════════════════════════════════════════════════

    onSelectionChange: function (oEvent) {
      const oContext     = oEvent.getParameter("listItem").getBindingContext("view");
      const oChangedItem = oContext ? oContext.getObject() : null;
      const bSelected    = oEvent.getParameter("selected");

      if (!oChangedItem) {
        console.warn("No se pudo obtener el colaborador seleccionado.");
        return;
      }

      if (!this.aSelectedEmployees) this.aSelectedEmployees = [];

      if (bSelected) {
        if (!this.aSelectedEmployees.find(emp => emp.userId === oChangedItem.userId)) {
          this.aSelectedEmployees.push(oChangedItem);
        }
      } else {
        this.aSelectedEmployees = this.aSelectedEmployees.filter(
          emp => emp.userId !== oChangedItem.userId
        );
      }
    },


    // ═══════════════════════════════════════════════════════════════════
    // UTILIDADES VARIAS
    // ═══════════════════════════════════════════════════════════════════

    // Convierte un código de evento (ej: "CB01") a su descripción legible
    // (ej: "Mutuo") buscando en el catálogo aEventReasonDescriptions.
    getEventReasonDescription: function (sCode) {
      const match = this.aEventReasonDescriptions.find(desc => desc.includes(`(${sCode})`));
      if (match) {
        if (match.toLowerCase().startsWith("contrato temporal")) return "Contrato temporal";
        return match.split(" ")[0];
      }
      return sCode;
    },


    // ═══════════════════════════════════════════════════════════════════
    // DESCARGA DE DOCUMENTOS
    // ═══════════════════════════════════════════════════════════════════
    // onDownloadPDF() es el handler principal del botón de descarga.
    // Despacha al método específico según el documento activo (sSelectedContract).
    //
    // Cada documento tiene su propia lógica en:
    //   gestordoccolombia/controller/functions/[nombreDocumento].js
    //
    // El parámetro sButtonId diferencia entre descarga PDF y Word
    // (los botones Word incluyen "wordDataInfo" en su ID).
    // ═══════════════════════════════════════════════════════════════════

    onDownloadPDF: function (oEvent) {
      const sTitle    = this.sSelectedContract;
      const sButtonId = oEvent.getSource().getId();

      switch (sTitle) {
        case "Kit De Retiro":                  this.onDownloadPDFKitRetiro(sButtonId);              break;
        case "Otro Sí - Rodamiento":           this.onDownloadPDFOtroSiRodamiento(sButtonId);       break;
        case "Otro Sí - Alimentación 15":      this.onDownloadPDFOtroSiAlimentacion15(sButtonId);   break;
        case "Otro Sí - Alimentación 11":      this.onDownloadPDFOtroSiAlimentacion11(sButtonId);   break;
        case "Otro Sí - Alimentación 10":      this.onDownloadPDFOtroSiAlimentacion10(sButtonId);   break;
        case "Beneficios Extralegales":        this.onDownloadPDFBeneficiosExtralegales(sButtonId); break;
        case "Solicitud Deducciones Retencion": this.onDownloadPDFRetencionFuente(sButtonId);       break;
        case "Compromiso con la Ética":        this.onDownloadPDFCompromisoEtica(sButtonId);        break;
        case "Autorización de Descuento":      this.onDownloadPDFAutorizacionDescuento(sButtonId);  break;
        case "Datos Personales":               this.onDownloadPDFDatosPersonales(sButtonId);        break;
        case "No Declarante":                  this.onDownloadPDFNoDeclarante(sButtonId);           break;
        case "Protocolo de Recibo":            this.onDownloadPDFProtocoloRecibo(sButtonId);        break;
        case "Contrato Indefinido Integral":   this.onDownloadPDFContratoIndefIntegral(sButtonId);  break;
        case "Contrato a Término Fijo":        this.onDownloadPDFContratoTerminoFijo(sButtonId);  break;
        case "Contrato a Término Indefinido": this.onDownloadPDFContratoTerminoIndef(sButtonId);  break;
        case "Contrato Aprendizaje Lectivo": this.onDownloadPDFContratoAprendizajeLectivo(sButtonId); break;
        case "Contrato Aprendizaje Productivo": this.onDownloadPDFContratoAprendizajeProductivo(sButtonId); break;
        default:
          MessageToast.show("No hay función definida para este documento.");
      }
    },

    // Métodos delegados a los módulos de functions/.
    // Cada módulo es responsable de generar el PDF o Word correspondiente.
    onDownloadPDFKitRetiro:              async function (sButtonId) { kitRetiro.onDownloadPDFKitRetiro(this, sButtonId); },
    onDownloadPDFOtroSiRodamiento:       async function (sButtonId) { otroSiRodamiento.onDownloadPDFOtroSiRodamiento(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion15:   async function (sButtonId) { otroSiAlimentacion15.onDownloadPDFOtroSiAlimentacion15(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion11:   async function (sButtonId) { otroSiAlimentacion11.onDownloadPDFOtroSiAlimentacion11(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion10:   async function (sButtonId) { otroSiAlimentacion10.onDownloadPDFOtroSiAlimentacion10(this, sButtonId); },
    onDownloadPDFBeneficiosExtralegales: async function (sButtonId) { beneficiosExtralegales.onDownloadPDFBeneficiosExtralegales(this, sButtonId); },
    onDownloadPDFRetencionFuente:        async function (sButtonId) { solicitudDeduccionesRetencion.onDownloadPDFRetencionFuente(this, sButtonId); },
    onDownloadPDFCompromisoEtica:        async function (sButtonId) { compromisoEtica.onDownloadPDFCompromisoEtica(this, sButtonId); },
    onDownloadPDFAutorizacionDescuento:  async function (sButtonId) { autorizacionDescuento.onDownloadPDFAutorizacionDescuento(this, sButtonId); },
    onDownloadPDFDatosPersonales:        async function (sButtonId) { datosPersonales.onDownloadPDFDatosPersonales(this, sButtonId); },
    onDownloadPDFNoDeclarante:           async function (sButtonId) { noDeclarante.onDownloadPDFNoDeclarante(this, sButtonId); },
    onDownloadPDFProtocoloRecibo:        async function (sButtonId) { protocoloRecibo.onDownloadPDFProtocoloRecibo(this, sButtonId); },
    onDownloadPDFContratoIndefIntegral:  async function (sButtonId) { contratoIndefIntegral.onDownloadPDFContratoIndefIntegral(this, sButtonId); },
    onDownloadPDFContratoTerminoFijo:    async function (sButtonId) { contratoTerminoFijo.onDownloadPDFContratoTerminoFijo(this, sButtonId); },
    onDownloadPDFContratoTerminoIndef:   async function (sButtonId) { contratoTerminoIndef.onDownloadPDFContratoTerminoIndef(this, sButtonId); },
    onDownloadPDFContratoAprendizajeLectivo: async function (sButtonId) { contratoAprendizajeLectivo.onDownloadPDFContratoAprendizajeLectivo(this, sButtonId); },
    onDownloadPDFContratoAprendizajeProductivo: async function (sButtonId) { contratoAprendizajeProductivo.onDownloadPDFContratoAprendizajeProductivo(this, sButtonId); }

  });
});