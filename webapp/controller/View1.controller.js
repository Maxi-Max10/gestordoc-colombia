sap.ui.define([
  // ── Núcleo de SAPUI5 ──
  "sap/ui/core/mvc/Controller",            // Clase base de la que extiende este controller
  "sap/ui/model/json/JSONModel",           // Modelo JSON para manejar el estado de la vista y el usuario
  "sap/m/MessageToast",                    // Muestra mensajes breves tipo "toast" al usuario
  "gestordoccolombia/util/LibraryLoader",  // Carga librerías externas (pdf-lib, html2canvas) solo cuando se necesitan
  // Helpers reutilizables
  "gestordoccolombia/controller/helpers/uiHelpers",
  "gestordoccolombia/controller/helpers/formatHelpers",
  // Lógica específica por tipo de documento (un archivo por cada documento que se puede generar)
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
  "gestordoccolombia/controller/functions/contratoAprendizajeProductivo",
  "gestordoccolombia/service/CpiService" // Servicio que envía documentos a SAP CPI para la integración con DocuSign

// El segundo argumento de sap.ui.define es la función que recibe cada módulo cargado,
// en el mismo orden que el array de arriba.
], (Controller, JSONModel, MessageToast, LibraryLoader, uiHelpers, formatHelpers,
    kitRetiro, otroSiRodamiento, otroSiAlimentacion15, otroSiAlimentacion11,
    otroSiAlimentacion10, beneficiosExtralegales, solicitudDeduccionesRetencion,
    compromisoEtica, autorizacionDescuento, datosPersonales, noDeclarante,
    protocoloRecibo, contratoIndefIntegral, contratoTerminoFijo, contratoTerminoIndef, contratoAprendizajeLectivo, contratoAprendizajeProductivo, CpiService) => {
  "use strict";

  const DOCUSIGN_DOCUMENTS = {
    contratoTerminoFijo: { documentType: CpiService.DOCUMENT_TYPES.CONTRATO_TERMINO_FIJO, generator: contratoTerminoFijo.generatePdfDocuments },
    contratoTerminoIndef: { documentType: CpiService.DOCUMENT_TYPES.CONTRATO_TERMINO_INDEFINIDO, generator: contratoTerminoIndef.generatePdfDocuments },
    contratoAprendizajeLectivo: { documentType: CpiService.DOCUMENT_TYPES.CONTRATO_APRENDIZAJE_LECTIVO, generator: contratoAprendizajeLectivo.generatePdfDocuments },
    contratoAprendizajeProductivo: { documentType: CpiService.DOCUMENT_TYPES.CONTRATO_APRENDIZAJE_PRODUCTIVO, generator: contratoAprendizajeProductivo.generatePdfDocuments },
    contratoIndefIntegral: { documentType: CpiService.DOCUMENT_TYPES.CONTRATO_INDEFINIDO_INTEGRAL, generator: contratoIndefIntegral.generatePdfDocuments },
    otroSiAlimentacion10: { documentType: CpiService.DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_10000, generator: otroSiAlimentacion10.generatePdfDocuments },
    otroSiAlimentacion11: { documentType: CpiService.DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_11500, generator: otroSiAlimentacion11.generatePdfDocuments },
    otroSiAlimentacion15: { documentType: CpiService.DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_15000, generator: otroSiAlimentacion15.generatePdfDocuments },
    otroSiRodamiento: { documentType: CpiService.DOCUMENT_TYPES.OTRO_SI_RODAMIENTO, generator: otroSiRodamiento.generatePdfDocuments }
  };

  return Controller.extend("gestordoccolombia.controller.View1", {

    // ═══════════════════════════════════════════════════════════════════
    // CATÁLOGO DE RAZONES DE EVENTOS
    // ═══════════════════════════════════════════════════════════════════
    // Lista completa de los eventos laborales que maneja SAP SuccessFactors.
    // Se usa en getEventReasonDescription() para mostrar el nombre legible
    // de un evento en lugar de su código técnico (ej: "CB01" → "Mutuo acuerdo").
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
    // SPINNER DE CARGA GLOBAL
    // ═══════════════════════════════════════════════════════════════════
    // Maneja el overlay de carga que aparece mientras se procesan datos.
    // Usa un contador interno (_busyCounter) para soportar varias operaciones
    // corriendo al mismo tiempo: el spinner solo se cierra cuando todas terminan.
    //
    // Uso básico:
    //   - _beginBusy() al iniciar una operación
    //   - _endBusy() al terminarla
    //   - _withBusy(fn) para envolver una operación async completa
    // ═══════════════════════════════════════════════════════════════════

    _beginBusy: function () {
      if (!this.oGlobalBusyDialog) return;                        // Protección: si no existe el diálogo, no hace nada
      this._busyCounter = (this._busyCounter || 0) + 1;           // Suma 1 al contador de operaciones en curso
      if (this._busyCounter === 1) {                              // Solo abre el spinner cuando pasa de 0 a 1
        this.oGlobalBusyDialog.open();
      }
    },

    _endBusy: function () {
      if (!this.oGlobalBusyDialog) return;
      this._busyCounter = Math.max((this._busyCounter || 1) - 1, 0); // Resta 1, pero nunca deja el contador en negativo
      if (this._busyCounter === 0) {                                  // Solo cierra cuando ya no quedan operaciones pendientes
        this.oGlobalBusyDialog.close();
      }
    },

    // Muestra el spinner mientras se ejecuta una función async y lo cierra al terminar,
    // pase lo que pase (éxito o error).
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
    // Las librerías de PDF se cargan solo cuando el usuario genera un documento
    // por primera vez, y después se reutilizan sin volver a descargarlas.
    //   - pdf-lib:     crea y manipula archivos PDF
    //   - html2canvas: convierte contenido HTML en imagen para incrustar en el PDF
    // ═══════════════════════════════════════════════════════════════════

    _ensurePdfToolkit: function () {
      if (!this._pdfToolkitPromise) {                      // Solo arranca la descarga la primera vez que se necesita
        this._pdfToolkitPromise = Promise.all([
          LibraryLoader.ensureLibrary("pdf-lib", {          // Descarga pdf-lib desde CDN
            url: "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
            globalName: "PDFLib",                           // Nombre de la variable global que crea el script
            validator: lib => !!lib && typeof lib.PDFDocument === "function" // Verifica que cargó correctamente
          }),
          LibraryLoader.ensureLibrary("html2canvas", {      // Descarga html2canvas desde CDN
            url: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            globalName: "html2canvas",
            validator: fn => typeof fn === "function"
          })
        ]).then(() => {
          // Una vez cargadas ambas, guarda referencias para acceso rápido
          this._pdfLibRef       = window.PDFLib;
          this._html2canvasRef  = window.html2canvas;
          return { PDFLib: this._pdfLibRef, html2canvas: this._html2canvasRef };
        });
      }
      return this._pdfToolkitPromise; // Siempre devuelve la misma promesa (cacheada)
    },


    // ═══════════════════════════════════════════════════════════════════
    // LECTURA DE ODATA
    // ═══════════════════════════════════════════════════════════════════
    // Las llamadas OData de SAP trabajan con callbacks (onSuccess/onError).
    // Este wrapper las convierte a Promesas para poder usar async/await
    // de forma limpia en el resto del controller.
    // ═══════════════════════════════════════════════════════════════════

    _readOData: function (oModel, sPath, mParameters) {
      return new Promise((resolve, reject) => {
        oModel.read(sPath, Object.assign({}, mParameters, {
          success: resolve,  // Si todo sale bien, resuelve la promesa con los datos
          error:   reject    // Si falla, rechaza la promesa con el error
        }));
      });
    },

    _isInactiveDocumentTitle: function (sTitle) {
      return [
        "Kit de Retiro",
        "Certificado Laboral Excolaborador",
        "Notificación Salida Ministerio"
      ].includes(sTitle);
    },

    _compareEmployeeNames: function (aUser, bUser) {
      const sALast  = String(aUser?.lastName || "");
      const sBLast  = String(bUser?.lastName || "");
      const sAFirst = String(aUser?.firstName || "");
      const sBFirst = String(bUser?.firstName || "");

      return sALast.localeCompare(sBLast, "es", { sensitivity: "base" }) ||
        sAFirst.localeCompare(sBFirst, "es", { sensitivity: "base" });
    },

    _prepareEmployeeDialogUsers: function (aUsers, mOptions) {
      const bInactiveOnly = !!mOptions?.inactiveOnly;

      return (Array.isArray(aUsers) ? aUsers : [])
        .filter(user => user.custom02 === "Administrativo" && (!bInactiveOnly || user.status !== "t"))
        .slice()
        .sort(this._compareEmployeeNames.bind(this));
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA DE EMPLEADOS SEGÚN EL DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════
    // Antes de abrir el diálogo de selección, se decide qué empleados traer
    // según el documento que el usuario eligió:
    //   - La mayoría de documentos → empleados activos (loadEmployees)
    //   - Documentos de excolaboradores → empleados inactivos (loadEmployeesBkp)
    //
    // La carga se hace una sola vez por sesión; si ya se hizo, no se repite.
    // ═══════════════════════════════════════════════════════════════════

    _ensureDataForTitle: function (sTitle) {

      const needsInactive = this._isInactiveDocumentTitle(sTitle);
      const needsActive   = !needsInactive;
      const aPromises     = [];

      if (needsActive && !this._activeEmployeesLoaded) {
        aPromises.push(this.loadEmployees());
      }
      if (needsInactive && !this._inactiveEmployeesLoaded) {
        aPromises.push(this.loadEmployeesBkp());
      }

      return aPromises.length ? Promise.all(aPromises) : Promise.resolve();
    },

    // Se dispara cuando el usuario hace click en un tile/documento.
    // Primero garantiza que los datos estén cargados, después abre el diálogo.
    _handleTileSelection: function (sTitle) {
      return this._ensureDataForTitle(sTitle).then(() => {
        this._openDialogForTitle(sTitle); // El diálogo se abre solo cuando los datos ya están listos
      });
    },

    _preloadEmployeesForStartup: function () {
      if (this._initialEmployeesPreloadRequest) {
        return this._initialEmployeesPreloadRequest;
      }

      const aPreloads = [];
      if (!this._activeEmployeesLoaded) {
        aPreloads.push(this.loadEmployees({ suppressBusy: true, silent: true }));
      }
      if (!this._inactiveEmployeesLoaded) {
        aPreloads.push(this.loadEmployeesBkp({ suppressBusy: true, silent: true }));
      }

      if (!aPreloads.length) {
        return Promise.resolve();
      }

      this._initialEmployeesPreloadRequest = Promise.all(aPreloads)
        .finally(() => {
          this._initialEmployeesPreloadRequest = null;
        });

      return this._initialEmployeesPreloadRequest;
    },

    _completeInitialPreload: function (bPreloadEmployees) {
      if (this._initialPreloadCompletionRequest) {
        return this._initialPreloadCompletionRequest;
      }

      if (bPreloadEmployees && typeof window.gmaHoldAppPreloader === "function") {
        window.gmaHoldAppPreloader();
      }

      if (bPreloadEmployees && typeof window.gmaSetAppPreloaderStatus === "function") {
        window.gmaSetAppPreloaderStatus("Cargando colaboradores...", "Preparando tablas para abrir sin espera", 92);
      }

      let pPreload;
      try {
        pPreload = bPreloadEmployees ? this._preloadEmployeesForStartup() : Promise.resolve();
      } catch (oError) {
        console.error("No se pudo iniciar la precarga inicial de colaboradores:", oError);
        pPreload = Promise.reject(oError);
      }

      this._initialPreloadCompletionRequest = pPreload.then(() => {
        if (bPreloadEmployees && typeof window.gmaSetAppPreloaderStatus === "function") {
          window.gmaSetAppPreloaderStatus("Listo", "Tablas preparadas", 99);
        }
        this._hideInitialPreloader();
      }).catch(oError => {
        this._showInitialPreloadError(
          "Error cargando colaboradores",
          "No se pudo completar la carga de usuarios de SuccessFactors.",
          oError
        );
      });

      return this._initialPreloadCompletionRequest;
    },


    _showInitialPreloadError: function (sStatus, sCopy, oError) {
      if (oError) {
        console.error(oError);
      }

      if (typeof window.gmaHoldAppPreloader === "function") {
        window.gmaHoldAppPreloader();
      }

      if (typeof window.gmaSetAppPreloaderStatus === "function") {
        window.gmaSetAppPreloaderStatus(sStatus, sCopy, 99);
      }
    },


    // ═══════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════════════════
    // Se ejecuta una sola vez cuando la vista termina de cargar.
    // Se encarga de:
    //   - Crear el modelo de estado de la vista
    //   - Inicializar las variables internas de control
    //   - Aplicar el tema guardado (oscuro o claro)
    //   - Cargar la información del usuario logueado
    //   - Mostrar el saludo inicial según la hora del día
    // ═══════════════════════════════════════════════════════════════════

    onInit: function () {
      const oView     = this.getView();
      const bDarkMode = this._readStoredThemeMode(); // Lee de localStorage si el usuario usaba modo oscuro

      // Crea una sola instancia del spinner de carga que se reutiliza durante toda la sesión
      this.oGlobalBusyDialog = new sap.m.BusyDialog();
      this._busyCounter      = 0; // Contador en 0: ninguna operación corriendo todavía
      if (typeof window.gmaHoldAppPreloader === "function") {
        window.gmaHoldAppPreloader();
      }

      // Modelo "view": guarda el estado de la interfaz (lista de usuarios, filtros, tema, etc.)
      const oViewModel = new JSONModel({
        BaseUsers:          [], // Lista completa según el documento (sin filtros aplicados)
        FilteredUsers:      [], // Lo que se muestra en la tabla (resultado de búsqueda o filtro de fecha)
        SelectedUsers:      [], // Empleados marcados en la tabla (uso interno)
        DialogTitle:        "",
        DialogIcon:         "sap-icon://document-text",
        ShowDocuSignButton: false,
        IsDarkMode:         bDarkMode,
        ThemeToggleText:    bDarkMode ? "☾" : "☀",
        ThemeToggleTooltip: bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      });
      oViewModel.setSizeLimit(999999); // Sin límite práctico, para empresas con muchos empleados
      this.getOwnerComponent().setModel(oViewModel, "view"); // Registra el modelo a nivel de componente (visible en toda la app)

      // Aplica el tema guardado y habilita las animaciones de transición después del primer render
      this._applyThemeMode(bDarkMode);
      this._enableThemeTransitionsAfterInitialRender();

      // Variables internas de control
      this.aSelectedEmployees        = [];    // Empleados seleccionados en la tabla
      this._activeEmployeesLoaded    = false; // Evita recargar empleados activos si ya se trajeron
      this._inactiveEmployeesLoaded  = false; // Idem para inactivos
      this._activeAdministrativeUsers = [];
      this._inactiveAdministrativeUsers = [];
      this._activeEmployeesRequest   = null;  // Promesa en curso (evita llamadas duplicadas)
      this._inactiveEmployeesRequest = null;
      this._initialEmployeesPreloadRequest = null;
      this._initialPreloadCompletionRequest = null;
      this._tilesEventsAttached      = false; // Evita registrar eventos de tiles más de una vez
      this._currentCategory          = null;  // Categoría del documento actualmente seleccionado
      this._activeSearch             = "";    // Texto actual del buscador de empleados
      this._activeDateFilter         = null;  // Rango de fechas activo en el filtro

      // Arranca el flujo de autenticación: usuario → empresa → permisos
      this.getUserInfo();
      this.updateGreeting(); // Saludo provisional; se actualiza cuando llega el nombre real

      // Carga el logo de la app
      const oImage = this.byId("_IDGenImageeee");
      if (oImage) {
        oImage.setSrc(sap.ui.require.toUrl("gestordoccolombia/img/logo.png"));
      }

      this.attachBoxEvents();
    },


    // ═══════════════════════════════════════════════════════════════════
    // MODO OSCURO / CLARO
    // ═══════════════════════════════════════════════════════════════════
    // La preferencia de tema se guarda en localStorage para que persista
    // entre sesiones. Se aplica añadiendo o quitando la clase CSS "gdDarkMode"
    // en el documento HTML.
    // ═══════════════════════════════════════════════════════════════════

    // Lee si el usuario tenía modo oscuro activado. Devuelve true o false.
    _readStoredThemeMode: function () {
      try {
        return window.localStorage.getItem("gestordoccolombia-theme") === "dark";
      } catch (oError) {
        return false; // Si localStorage no está disponible (ej: modo privado), arranca en claro
      }
    },

    // Aplica el tema al DOM, actualiza el modelo de vista y guarda la preferencia.
    _applyThemeMode: function (bDarkMode) {
      const sThemeClass = "gdDarkMode";
      const oViewModel  = this.getOwnerComponent().getModel("view");

      document.documentElement.classList.toggle(sThemeClass, bDarkMode); // Agrega o quita la clase en <html>
      if (document.body) {
        document.body.classList.toggle(sThemeClass, bDarkMode); // Y también en <body> por si el CSS la necesita ahí
      }

      if (oViewModel) {
        oViewModel.setProperty("/IsDarkMode",         bDarkMode);
        oViewModel.setProperty("/ThemeToggleText",    bDarkMode ? "☾" : "☀");
        oViewModel.setProperty("/ThemeToggleTooltip", bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      }

      ["themeToggleButton", "mobileThemeToggleButton"].forEach(function (sButtonId) {
        const oButton = this.byId(sButtonId);
        if (oButton) {
          oButton.toggleStyleClass("themeToggleButtonActive", bDarkMode);
        }
      }.bind(this));

      try {
        window.localStorage.setItem("gestordoccolombia-theme", bDarkMode ? "dark" : "light");
      } catch (oError) {
        console.warn("No se pudo guardar la preferencia de tema:", oError);
      }
    },

    // Habilita las animaciones de transición del tema solo después del primer render.
    // Esto evita el efecto de parpadeo que se vería si las transiciones estuvieran
    // activas desde el principio al cargar el tema guardado.
    _enableThemeTransitionsAfterInitialRender: function () {
      const fnEnableTransitions = function () {
        document.documentElement.classList.add("gdThemeTransitionReady");
        if (document.body) {
          document.body.classList.add("gdThemeTransitionReady");
        }
      };

      // Espera dos frames de animación antes de activar las transiciones
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(fnEnableTransitions);
        });
      } else {
        window.setTimeout(fnEnableTransitions, 0); // Fallback para navegadores muy viejos
      }
    },

    // Handler del botón de cambio de tema en la barra superior.
    onToggleTheme: function () {
      const oViewModel = this.getOwnerComponent().getModel("view");
      const bDarkMode  = !(oViewModel && oViewModel.getProperty("/IsDarkMode")); // Invierte el estado actual
      this._applyThemeMode(bDarkMode);
    },

    // Hace scroll suave hacia arriba del contenedor principal de la página.
    _scrollToHome: function () {
      const oPage    = this.byId("contentContainer");
      const oPageDom = oPage && oPage.getDomRef && oPage.getDomRef();
      const oScrollDom = oPageDom && (
        oPageDom.querySelector(".sapMPageEnableScrolling") ||
        oPageDom.querySelector(".sapMPageScroll") ||
        oPageDom
      );

      if (oScrollDom && typeof oScrollDom.scrollTo === "function") {
        oScrollDom.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" }); // Fallback: scrollea la ventana completa
      }
    },

    // Handler del tab superior: si el usuario vuelve al inicio (key "1"), hace scroll arriba.
    onSelectHeader: function (oEvent) {
      const sKey = oEvent && oEvent.getParameter && oEvent.getParameter("selectedKey");
      if (!sKey || sKey === "1") {
        this._scrollToHome();
      }
    },

    // Abre el menú del header en vista mobile.
    onOpenMobileHeaderMenu: function (oEvent) {
      const oPopover = this.byId("mobileHeaderMenuPopover");
      if (oPopover) {
        oPopover.openBy(oEvent.getSource());
      }
    },

    _closeMobileHeaderMenu: function () {
      const oPopover = this.byId("mobileHeaderMenuPopover");
      if (oPopover && oPopover.isOpen()) {
        oPopover.close();
      }
    },

    // Desde el menú mobile: cierra el menú y vuelve al inicio.
    onMobileHeaderHomePress: function () {
      this._closeMobileHeaderMenu();
      this._scrollToHome();
    },

    // Desde el menú mobile: cambia el tema y cierra el menú.
    onMobileToggleTheme: function () {
      this.onToggleTheme();
      this._closeMobileHeaderMenu();
    },


    // ═══════════════════════════════════════════════════════════════════
    // PANTALLA DE CARGA INICIAL
    // ═══════════════════════════════════════════════════════════════════
    // Oculta el splash screen de arranque una vez que el grid de tiles
    // tiene posiciones estables visualmente.
    // Tiene un tiempo mínimo de espera (2.4s) y un máximo (6.5s) para
    // garantizar que siempre se oculte, aunque el layout no se estabilice.
    // ═══════════════════════════════════════════════════════════════════

    _hideInitialPreloader: function () {
      if (this._initialPreloaderHideRequested) return; // Evita ejecutar esto más de una vez
      this._initialPreloaderHideRequested = true;

      const fnHide = () => {
        if (typeof window.gmaHideAppPreloader === "function") { // Función global definida en index.html
          window.gmaHideAppPreloader();
        }
      };

      this._waitForInitialLayoutReady().then(fnHide).catch(fnHide); // Se oculta pase lo que pase
    },

    // Espera a que el grid de tiles tenga posiciones estables durante
    // varios frames consecutivos antes de dar la señal de "listo".
    _waitForInitialLayoutReady: function () {
      const iMinWait              = 2400;  // Mínimo de espera (ms), aunque el layout ya esté listo
      const iMaxWait              = 6500;  // Máximo: si nunca se estabiliza, se libera igual
      const iRequiredStableFrames = 12;   // Frames seguidos con el mismo layout para considerar "estable"
      const iStartedAt            = Date.now();
      const fnNextFrame           = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));

      try { sap.ui.getCore().applyChanges(); } catch (e) {} // Fuerza un render inmediato antes de medir

      return new Promise((resolve) => {
        let sLastSignature = ""; // "Huella" del layout anterior para comparar entre frames
        let iStableFrames  = 0;

        // Genera una cadena que representa la posición y tamaño de cada tile visible.
        // Si dos frames generan la misma cadena, el layout no cambió.
        const fnGetLayoutSignature = () => {
          const oGrid      = this.byId("gridItems");
          const oGridDomRef = oGrid?.getDomRef();
          const aContent   = oGrid?.getContent?.() || [];

          if (!oGridDomRef || !aContent.length) return "";

          const oGridRect     = oGridDomRef.getBoundingClientRect();
          const aVisibleRects = aContent
            .filter(oItem => oItem.getVisible && oItem.getVisible())
            .map(oItem => oItem.getDomRef && oItem.getDomRef())
            .filter(Boolean)
            .map(oDomRef => {
              const r = oDomRef.getBoundingClientRect();
              // Redondea posición relativa al grid para ignorar diferencias de subpíxel
              return [
                Math.round(r.left - oGridRect.left),
                Math.round(r.top  - oGridRect.top),
                Math.round(r.width),
                Math.round(r.height)
              ].join(":");
            });

          return aVisibleRects.length ? aVisibleRects.join("|") : "";
        };

        // Se ejecuta en cada frame: compara la huella actual con la anterior
        const fnCheck = () => {
          const iElapsed   = Date.now() - iStartedAt;
          const sSignature = fnGetLayoutSignature();

          if (sSignature && sSignature === sLastSignature) {
            iStableFrames += 1; // El layout no cambió: suma un frame estable
          } else {
            sLastSignature = sSignature; // El layout cambió: reinicia el conteo
            iStableFrames  = 0;
          }

          // Resuelve si: ya pasó el mínimo Y el layout está estable, o ya se llegó al máximo
          if ((iElapsed >= iMinWait && iStableFrames >= iRequiredStableFrames) || iElapsed >= iMaxWait) {
            resolve();
            return;
          }
          fnNextFrame(fnCheck); // Si no, programa la siguiente revisión
        };

        fnNextFrame(fnCheck);
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // AUTENTICACIÓN Y DATOS DEL USUARIO
    // ═══════════════════════════════════════════════════════════════════
    // El flujo de inicio de sesión tiene tres pasos encadenados:
    //   1. getUserInfo()    → detecta el userId del usuario logueado
    //   2. getUserCompany() → consulta a qué empresa pertenece (ej: CO10)
    //   3. getDataUser()    → obtiene su grupo/permisos y configura la UI
    //
    // La empresa se usa como filtro en las consultas de empleados, para que
    // cada usuario solo vea colaboradores de su propia organización.
    // ═══════════════════════════════════════════════════════════════════

    // Devuelve la URL base de la app para llamadas a las APIs de SAP BTP.
    getBaseURL: function () {
      const appId   = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      const appPath = appId.replaceAll(".", "/");
      return jQuery.sap.getModulePath(appPath);
    },

    // Consulta la empresa del usuario en SuccessFactors.
    // Si la consulta falla, usa "CO10" como valor por defecto para no romper el flujo.
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
            resolve("CO10"); // Resuelve igual (sin rechazar) para no cortar el flujo de login
          }
        });
      });
    },

    // Detecta el userId del usuario logueado a través de la API de SAP BTP
    // y encadena getUserCompany() y getDataUser().
    getUserInfo: function () {
      const that = this;
      const url  = this.getBaseURL() + "/user-api/currentUser";
      const UseroModel = new JSONModel();
      UseroModel.loadData(url);

      UseroModel.attachRequestCompleted(function () {
        // En desarrollo local sin usuario real, usa un usuario de prueba fijo
        let userId = (!UseroModel.getData().email ||
                      UseroModel.getData().email === "rodrigo.lopez@agprodservicios.com")
          ? "excagp"
          : UseroModel.getData().name;

        UseroModel.setProperty("/firstname", userId);
        that.getOwnerComponent().setModel(UseroModel, "user");

        that.getUserCompany(userId).then(function (sCompany) {
          UseroModel.setProperty("/company", sCompany);
          that.getDataUser(userId);
        }).catch(function (oError) {
          MessageToast.show("Error al obtener información de la empresa.");
          that.oGlobalBusyDialog.close();
          that._showInitialPreloadError(
            "Error cargando empresa",
            "No se pudo completar la carga inicial desde SuccessFactors.",
            oError
          );
        });
      });

      UseroModel.attachRequestFailed(function (oError) {
        that.oGlobalBusyDialog.close();
        that._showInitialPreloadError(
          "Error cargando usuario",
          "No se pudo obtener el usuario actual para iniciar la carga de SSFF.",
          oError
        );
      });
    },

    // Consulta el grupo y permisos del usuario desde la entidad custom de SuccessFactors
    // y configura qué tiles son visibles según su perfil:
    //   - "admin"   → ve todos los documentos
    //   - "usuario" → no ve ningún documento
    //   - "ninguno" → sin acceso
    getDataUser: function (user) {
      const that             = this;
      const readUrlModelGroup = "/cust_GD_mantenedorGrupos('" + user + "')";

      this.getView().getModel().read(readUrlModelGroup, {
        success: function (oData) {
          const userModel = that.getOwnerComponent().getModel("user");
          const cleanData = JSON.parse(JSON.stringify(oData)); // Clona el objeto para evitar referencias internas de OData

          userModel.setProperty("/datos",       cleanData);
          userModel.setProperty("/displayName", cleanData.displayName);
          that.updateGreeting(); // Ahora sí, actualiza el saludo con el nombre real

          // Género para el tratamiento gramatical en los documentos
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
            "customListItemBeneficios",
            "customListItemSolicitudDeduccionesRetencion",
            "customListItemCompromisoEtica",
            "customListItemAutorizacionDescuento",
            "customListItemDatosPersonales",
            "customListItemNoDeclarante",
            "customListItemProtocoloRecibo",
            "customListItemContratoIntegral",
            "customListItemContratoTerminoFijo",
            "customListItemContratoTerminoIndef",
            "customListItemContratoAprendizajeLectivo",
            "customListItemContratoAprendizajeProductivo"
          ];

          // Los admins ven todos los tiles; los demás no ven ninguno
          const bVisible = (permisos === "admin");
          aTileIds.forEach(sId => {
            that.byId(sId)?.setVisible(bVisible);
          });

          that._completeInitialPreload(bVisible); // Ya se sabe qué mostrar: precarga tablas y libera el splash
        },

        error: function (oError) {
          MessageToast.show("Error al leer grupo de usuario.");
          that._showInitialPreloadError(
            "Error cargando permisos",
            "No se pudieron validar permisos ni completar la carga inicial de SSFF.",
            oError
          );
        }
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // CARGA DE EMPLEADOS ACTIVOS
    // ═══════════════════════════════════════════════════════════════════
    // Trae todos los empleados con status='t' (activos) de la empresa
    // del usuario logueado.
    //
    // La carga se hace una sola vez por sesión. Si ya se ejecutó, no vuelve
    // a correr (controlado por _activeEmployeesLoaded).
    //
    // Los datos crudos de SAP se enriquecen con campos calculados:
    //   - paycompValue:   salario, extraído de una navegación anidada en OData
    //   - nationalId:     cédula (solo cuando cardType === "CC")
    //   - salut:          tratamiento (Sr./Sra./Srta.)
    //   - marriageStatus: estado civil en texto, adaptado al género
    //   - customLong1:    campo personalizado de SuccessFactors
    // ═══════════════════════════════════════════════════════════════════

    loadEmployees: function (mOptions) {
      mOptions = mOptions || {};
      if (this._activeEmployeesRequest) return this._activeEmployeesRequest;

      const oComponentModel = this.getOwnerComponent().getModel();
      const sUserCompany    = this.getOwnerComponent().getModel("user").getProperty("/company") || "CO10";
      const oViewStateModel = this.getOwnerComponent().getModel("view");

      const sSelect = [
        "userId", "status", "firstName", "lastName", "email", "nationality",
        "jobCode", "title", "custom02", "custom03", "businessPhone", "state", "city",
        "custom10", "hireDate", "country", "salutation", "division", "department",
        "defaultFullName", "gender",
        "manager/jobCode", "manager/businessPhone", "manager/email",
        "empInfo/customDate1", "empInfo/startDate", "empInfo/endDate",
        "empInfo/originalStartDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason", "empInfo/jobInfoNav/company",
        "empInfo/personNav/customLong1",
        "empInfo/personNav/personalInfoNav/maritalStatus",
        "empInfo/personNav/personalInfoNav/secondLastName",
        "empInfo/personNav/nationalIdNav/nationalId",
        "empInfo/personNav/nationalIdNav/cardType",
        "empInfo/personNav/nationalIdNav/country",
        "empInfo/personNav/nationalIdNav/customDate1",
        "empInfo/personNav/personalInfoNav/customString10",
        "custom05",
        "custom05Nav/id",
        "custom05Nav/externalCode",
        "custom05Nav/localeLabel",
        "dateOfBirth",
        "addressLine1",
        "custom15",
        "empInfo/personNav/nationalIdNav/customString2",
        "empInfo/personNav/nationalIdNav/customString2Nav/localeLabel"

      ].join(",");

      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav",
        "custom05Nav",
        "empInfo/personNav/nationalIdNav/customString2Nav"
      ].join(",");

      // Bloquea el botón Descargar hasta que EmpJob termine
      oViewStateModel.setProperty("/EmpJobLoaded", false);

      const fnReadUsers = () => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status eq 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      });

      const pFetch = (mOptions.suppressBusy ? Promise.resolve().then(fnReadUsers) : this._withBusy(fnReadUsers)).then(async oUsers => {
        const aUsers = Array.isArray(oUsers?.results) ? oUsers.results : [];

        const enrichedUsers = aUsers.map(user => {
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]
                              ?.empPayCompRecurringNav?.results?.[0]?.paycompvalue;
          user.paycompvalue = salaryRaw || 0;
          user.paycompValue = salaryRaw || 0;

          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          const ccEntry           = nationalIdResults.find(i => i.cardType === "CC");
          user.docExpeditionCity =  ccEntry?.customString2Nav?.localeLabel || "";
          user.nationalId         = ccEntry?.nationalId ?? "";
          user.docCardType        = nationalIdResults[0]?.cardType ?? "";
          user.originalStartDate  = user.empInfo?.originalStartDate || null;
          user.nationalityCode    = nationalIdResults.find(i => i.country)?.country ?? "";
          user.docExpeditionDate  = ccEntry?.customDate1 || null;
          user.bloodType          = user.custom05Nav?.localeLabel || "";
          user.addressLine1       = user.addressLine1 || "";
          user.city = user.city || "";
          user.hasDependents      = user.custom15 || "";
          user.dateOfBirth        = user.dateOfBirth || null;

          user.managerName      = "";
          user.managerEmail     = "";
          user.managerJobCode   = "";
          user.managerId        = "";
          user.paymentFrequency = "";

          user.salut = user.salutation === "3526" ? "Sra."
                    : user.salutation === "3525" ? "Sr."
                    : "Srta.";

          user.customLong1 = user.empInfo?.personNav?.customLong1 || "";

          const marriageStatusId = user.empInfo?.personNav?.personalInfoNav?.results?.[0]?.maritalStatus;
          user.marriageStatusId  = marriageStatusId;
          const isFemale         = user.gender === "F";
          const statusMap        = {
            "3528": isFemale ? "divorciada" : "divorciado",
            "3530": isFemale ? "casada"     : "casado",
            "3529": isFemale ? "separada"   : "separado",
            "3531": isFemale ? "soltera"    : "soltero",
            "3532": isFemale ? "viuda"      : "viudo",
            "3533": "unión libre"
          };
          user.marriageStatus = statusMap[marriageStatusId] || "";

          return user;
        });

        // ── Muestra la tabla apenas llega /User, sin esperar EmpJob ──
        this.getView().setModel(new JSONModel({ User: enrichedUsers }));
        this.attachBoxEvents();

        // ── Segunda llamada: completa manager y frecuencia de pago desde EmpJob ──
        try {
          const userIds    = enrichedUsers.map(u => u.userId).filter(Boolean);
          const chunkSize  = 50;
          const managerMap = {};

          const payScaleAreaMap = {};
          try {
            const psaData = await this._readOData(oComponentModel, "/PayScaleArea", {
              urlParameters: { "$select": "code,externalName_defaultValue" }
            });
            (psaData?.results || []).forEach(psa => {
              if (psa.code) payScaleAreaMap[psa.code] = psa.externalName_defaultValue
                ? `${psa.externalName_defaultValue} (${psa.code})`
                : psa.code;
            });
          } catch (e) {
            console.warn("No se pudo cargar PayScaleArea:", e);
          }

          for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk     = userIds.slice(i, i + chunkSize);
            const filterIds = chunk.map(id => `userId eq '${id}'`).join(" or ");

            // ─── Llamadas en paralelo: EmpJob + PerEmail + PerPhone + PerAddress ─────────────────
            const [empJobData, perEmailData, perPhoneData, perAddressData] = await Promise.all([  // ← NUEVO: Promise.all

              this._readOData(oComponentModel, "/EmpJob", {
                urlParameters: {
                  // ← NUEVO: agregamos locationNav/customString1Nav para ciudad de cédula
                  "$select": "userId,managerId,managerUserNav/userId,managerUserNav/displayName,managerUserNav/email,managerUserNav/jobCode,payGroup,location,locationNav/name,locationNav/customString1Nav/localeLabel,payScaleArea",
                  "$filter": `(${filterIds})`,
                  "$expand": "managerUserNav,payGroupNav,locationNav/customString1Nav"  // ← NUEVO: expand anidado
                }
              }),

              // ← NUEVO: email personal (tipo 4083 = email personal en este tenant)
              this._readOData(oComponentModel, "/PerEmail", {
                urlParameters: {
                  "$select": "personIdExternal,emailAddress",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and emailType eq '4083'`
                }
              }).catch(e => { console.warn("PerEmail falló:", e); return { results: [] }; }),

              // ← NUEVO: teléfono celular (tipo 4088 = celular en este tenant)
              this._readOData(oComponentModel, "/PerPhone", {
                urlParameters: {
                  "$select": "personIdExternal,phoneNumber",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and phoneType eq '4088'`
                }
              }).catch(e => { console.warn("PerPhone falló:", e); return { results: [] }; }),

              // ← NUEVO: dirección de residencia, para sacar la ciudad real
              this._readOData(oComponentModel, "/PerAddressDEFLT", {
                urlParameters: {
                  "$select": "personIdExternal,addressType,city,cityNav/externalCode,cityNav/localeLabel",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and addressType eq 'home'`,
                  "$expand": "cityNav"
                }
              }).catch(e => { console.warn("PerAddress falló:", e); return { results: [] }; })

            ]);
            // ────────────────────────────────────────────────────────────────────────

            const empJobResults  = Array.isArray(empJobData?.results)  ? empJobData.results  : [];
            const perEmailMap    = {};  // ← NUEVO
            const perPhoneMap    = {};  // ← NUEVO
            const perCityMap = {};
            (perAddressData?.results || []).forEach(a => {
              if (a.personIdExternal) perCityMap[a.personIdExternal] = a.cityNav?.localeLabel || "";
            });

            // ← NUEVO: indexar por personIdExternal para lookup O(1)
            (perEmailData?.results || []).forEach(e => {
              if (e.personIdExternal) perEmailMap[e.personIdExternal] = e.emailAddress || "";
            });
            (perPhoneData?.results || []).forEach(p => {
              if (p.personIdExternal) perPhoneMap[p.personIdExternal] = p.phoneNumber || "";
            });

            const PAY_GROUP_LABELS = {
              "Q2": "QUINCENAL",
              "M1": "MENSUAL",
              "M2": "MENSUAL",
              "S1": "SEMANAL",
            };

            empJobResults.forEach(job => {
              if (job.userId) {
                managerMap[job.userId] = {
                  managerId:        job.managerId || "",
                  managerName:      (job.managerUserNav?.displayName || "").trim(),
                  managerEmail:     job.managerUserNav?.email || "",
                  managerJobCode:   (job.managerUserNav?.jobCode || "").replace(/\s*\(\d+\)$/, ""),
                  paymentFrequency: PAY_GROUP_LABELS[job.payGroup] || (job.payGroup || ""),
                  planta:           job.locationNav?.name || job.location || "",
                  area:             payScaleAreaMap[job.payScaleArea] || job.payScaleArea || "",
                  ciudadFirma:     job.locationNav?.customString1Nav?.localeLabel || "",  // ← NUEVO
                  personalEmail:    perEmailMap[job.userId] || "",   // ← NUEVO
                  personalPhone:    perPhoneMap[job.userId] || "",   // ← NUEVO
                  city:             perCityMap[job.userId] || "",  // ← NUEVO: ciudad residencia
                };
              }
            });
            
          }

          // ← NUEVO: fecha de baja desde EmpEmployment (en activos vendrá null normalmente)
          const empEmpData = await this._readOData(oComponentModel, "/EmpEmployment", {
            urlParameters: {
              "$select": "userId,endDate",
              "$filter": userIds.map(id => `userId eq '${id}'`).join(" or ")
              // Sin chunks: EmpEmployment es liviano y el filter de userId es suficiente.
              // Si la empresa tiene miles de empleados activos, envolver esto en el mismo loop de chunks.
            }
          }).catch(e => { console.warn("EmpEmployment endDate falló:", e); return { results: [] }; });

          const empEndDateMap = {};
          (empEmpData?.results || []).forEach(emp => {
            if (emp.userId) empEndDateMap[emp.userId] = emp.endDate || null;
          });

          enrichedUsers.forEach(user => {
            const mgr = managerMap[user.userId] || {};
            user.managerId        = mgr.managerId        || "";
            user.managerName      = mgr.managerName      || "";
            user.managerEmail     = mgr.managerEmail     || "";
            user.managerJobCode   = mgr.managerJobCode   || "";
            user.paymentFrequency = mgr.paymentFrequency || "";
            user.planta           = mgr.planta           || "";
            user.area             = mgr.area             || "";
            user.ciudadFirma     = mgr.ciudadFirma     || "";  // ← NUEVO
            user.personalEmail    = mgr.personalEmail    || "";  // ← NUEVO
            user.personalPhone    = mgr.personalPhone    || "";  // ← NUEVO
            user.city             = mgr.city             || "";  // ← NUEVO: ciudad real (sobrescribe el city vacío del enrichedUsers inicial)
            user.endDateBaja = empEndDateMap[user.userId] || null;
          });

          // Actualiza el modelo con los datos de EmpJob sin reemplazar el modelo entero
          this.getView().getModel().setProperty("/User", enrichedUsers);

          this._activeAdministrativeUsers = this._prepareEmployeeDialogUsers(enrichedUsers);

          // Habilita el botón Descargar y marca la carga como completa
          oViewStateModel.setProperty("/EmpJobLoaded", true);
          this._activeEmployeesLoaded = true;
          return enrichedUsers;

        } catch (e) {
          console.error("No se pudo completar la carga de datos SSFF para empleados activos:", e);
          oViewStateModel.setProperty("/EmpJobLoaded", false);
          this._activeEmployeesLoaded = false;
          throw e;
        }

      }).catch(oError => {
        console.error("Error cargando empleados activos:", oError);
        if (!mOptions.silent) {
          MessageToast.show("Error cargando los datos.");
        }
        oViewStateModel?.setProperty("/EmpJobLoaded", false); // No se marca listo si la carga completa falló
        this._activeEmployeesLoaded = false;
        throw oError;
      });

      this._activeEmployeesRequest = pFetch;
      pFetch.finally(() => {
        if (this._activeEmployeesRequest === pFetch) this._activeEmployeesRequest = null;
      }).catch(() => {});
      return pFetch;
    },


    // Igual que loadEmployees, pero trae los empleados con status diferente de 't' (dados de baja).
    // Se usa para documentos que aplican a excolaboradores.
    loadEmployeesBkp: function (mOptions) {
      mOptions = mOptions || {};
      if (this._inactiveEmployeesRequest) return this._inactiveEmployeesRequest;

      const oComponentModel = this.getOwnerComponent().getModel();
      const sUserCompany    = this.getOwnerComponent().getModel("user").getProperty("/company") || "CO10";

      const sSelect = [
        "userId", "status", "firstName", "lastName", "email", "nationality",
        "jobCode", "title", "custom02", "custom03", "businessPhone", "state", "city",
        "custom10", "hireDate", "country", "salutation", "division", "department",
        "defaultFullName", "gender",
        "manager/jobCode", "manager/businessPhone", "manager/email",
        "empInfo/customDate1", "empInfo/startDate", "empInfo/endDate",
        "empInfo/originalStartDate",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "empInfo/jobInfoNav/eventReason", "empInfo/jobInfoNav/company",
        "empInfo/personNav/customLong1",
        "empInfo/personNav/personalInfoNav/maritalStatus",
        "empInfo/personNav/personalInfoNav/secondLastName",
        "empInfo/personNav/nationalIdNav/nationalId",
        "empInfo/personNav/nationalIdNav/cardType",
        "empInfo/personNav/nationalIdNav/country",
        "empInfo/personNav/nationalIdNav/customDate1",
        "empInfo/personNav/personalInfoNav/customString10",
        "dateOfBirth",
        "addressLine1",
        "custom15",
        "custom05",
        "custom05Nav/id",
        "custom05Nav/externalCode",
        "custom05Nav/localeLabel",
        "empInfo/personNav/nationalIdNav/customString2",
        "empInfo/personNav/nationalIdNav/customString2Nav/localeLabel"
      ].join(",");

      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav",
        "custom05Nav",
        "empInfo/personNav/nationalIdNav/customString2Nav"
      ].join(",");

      const fnReadUsers = () => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status ne 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`, // ne 't' = no activo
          "$expand": sExpand
        }
      });

      const pFetch = (mOptions.suppressBusy ? Promise.resolve().then(fnReadUsers) : this._withBusy(fnReadUsers)).then(async oData => {
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
          const ccEntry           = nationalIdResults.find(i => i.cardType === "CC");
          user.docExpeditionCity =  ccEntry?.customString2Nav?.localeLabel || "";
          user.nationalId         = ccEntry?.nationalId ?? "";
          user.docCardType        = nationalIdResults[0]?.cardType ?? "";
          user.originalStartDate  = user.empInfo?.originalStartDate || null;
          user.nationalityCode    = nationalIdResults.find(i => i.country)?.country ?? "";
          user.docExpeditionDate  = ccEntry?.customDate1 || null;
          user.addressLine1       = user.addressLine1 || "";
          user.city                = user.city || "";
          user.hasDependents      = user.custom15 || "";
          user.dateOfBirth        = user.dateOfBirth || null;

          user.managerName      = "";
          user.managerEmail     = "";
          user.managerJobCode   = "";
          user.managerId        = "";
          user.paymentFrequency = "";

          aUsers.push(user);
        });

        // Segunda llamada: manager y frecuencia de pago desde EmpJob (mismo patrón que en activos)
        try {
          const userIds    = aUsers.map(u => u.userId).filter(Boolean);
          const chunkSize  = 50;
          const managerMap = {};

          const payScaleAreaMap = {};
          try {
            const psaData = await this._readOData(oComponentModel, "/PayScaleArea", {
              urlParameters: { "$select": "code,externalName_defaultValue" }
            });
            (psaData?.results || []).forEach(psa => {
              if (psa.code) payScaleAreaMap[psa.code] = psa.externalName_defaultValue
                ? `${psa.externalName_defaultValue} (${psa.code})`
                : psa.code;
            });
          } catch (e) {
            console.warn("No se pudo cargar PayScaleArea:", e);
          }

          for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk     = userIds.slice(i, i + chunkSize);
            const filterIds = chunk.map(id => `userId eq '${id}'`).join(" or ");

            // ─── Llamadas en paralelo: EmpJob + PerEmail + PerPhone ─────────────────
            const [empJobData, perEmailData, perPhoneData, perAddressData] = await Promise.all([  // ← NUEVO: Promise.all

              this._readOData(oComponentModel, "/EmpJob", {
                urlParameters: {
                  // ← NUEVO: agregamos locationNav/customString1Nav para ciudad de cédula
                  "$select": "userId,managerId,managerUserNav/userId,managerUserNav/displayName,managerUserNav/email,managerUserNav/jobCode,payGroup,location,locationNav/name,locationNav/customString1Nav/localeLabel,payScaleArea",
                  "$filter": `(${filterIds})`,
                  "$expand": "managerUserNav,payGroupNav,locationNav/customString1Nav"  // ← NUEVO: expand anidado
                }
              }),

              // ← NUEVO: email personal (tipo 4083 = email personal en este tenant)
              this._readOData(oComponentModel, "/PerEmail", {
                urlParameters: {
                  "$select": "personIdExternal,emailAddress",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and emailType eq '4083'`
                }
              }).catch(e => { console.warn("PerEmail falló:", e); return { results: [] }; }),

              // ← NUEVO: teléfono celular (tipo 4088 = celular en este tenant)
              this._readOData(oComponentModel, "/PerPhone", {
                urlParameters: {
                  "$select": "personIdExternal,phoneNumber",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and phoneType eq '4088'`
                }
              }).catch(e => { console.warn("PerPhone falló:", e); return { results: [] }; }),

              // ← NUEVO: dirección de residencia, para sacar la ciudad real
              this._readOData(oComponentModel, "/PerAddressDEFLT", {
                urlParameters: {
                  "$select": "personIdExternal,addressType,city,cityNav/externalCode,cityNav/localeLabel",
                  "$filter": `(${chunk.map(id => `personIdExternal eq '${id}'`).join(" or ")}) and addressType eq 'home'`,
                  "$expand": "cityNav"
                }
              }).catch(e => { console.warn("PerAddress falló:", e); return { results: [] }; })

            ]);
            // ────────────────────────────────────────────────────────────────────────

            const empJobResults  = Array.isArray(empJobData?.results)  ? empJobData.results  : [];
            const perEmailMap    = {};  // ← NUEVO
            const perPhoneMap    = {};  // ← NUEVO
            const perCityMap     = {};  // ← NUEVO

            // ← NUEVO: indexar por personIdExternal para lookup O(1)
            (perEmailData?.results || []).forEach(e => {
              if (e.personIdExternal) perEmailMap[e.personIdExternal] = e.emailAddress || "";
            });
            (perPhoneData?.results || []).forEach(p => {
              if (p.personIdExternal) perPhoneMap[p.personIdExternal] = p.phoneNumber || "";
            });
            (perAddressData?.results || []).forEach(a => {
              if (a.personIdExternal) perCityMap[a.personIdExternal] = a.cityNav?.localeLabel || "";
            });

            const PAY_GROUP_LABELS = {
              "Q2": "QUINCENAL",
              "M1": "MENSUAL",
              "M2": "MENSUAL",
              "S1": "SEMANAL",
            };

            empJobResults.forEach(job => {
              if (job.userId) {
                managerMap[job.userId] = {
                  managerId:        job.managerId || "",
                  managerName:      (job.managerUserNav?.displayName || "").trim(),
                  managerEmail:     job.managerUserNav?.email || "",
                  managerJobCode:   (job.managerUserNav?.jobCode || "").replace(/\s*\(\d+\)$/, ""),
                  paymentFrequency: PAY_GROUP_LABELS[job.payGroup] || (job.payGroup || ""),
                  planta:           job.locationNav?.name || job.location || "",
                  area:             payScaleAreaMap[job.payScaleArea] || job.payScaleArea || "",
                  ciudadFirma:     job.locationNav?.customString1Nav?.localeLabel || "",  // ← NUEVO
                  personalEmail:    perEmailMap[job.userId] || "",   // ← NUEVO
                  personalPhone:    perPhoneMap[job.userId] || "",   // ← NUEVO
                  city:             perCityMap[job.userId] || "",  // ← NUEVO: ciudad residencia
                };
              }
            });
          }

          // ← NUEVO: fecha de baja desde EmpEmployment (en activos vendrá null normalmente)
          const empEmpData = await this._readOData(oComponentModel, "/EmpEmployment", {
            urlParameters: {
              "$select": "userId,endDate",
              "$filter": userIds.map(id => `userId eq '${id}'`).join(" or ")
              // Sin chunks: EmpEmployment es liviano y el filter de userId es suficiente.
              // Si la empresa tiene miles de empleados activos, envolver esto en el mismo loop de chunks.
            }
          }).catch(e => { console.warn("EmpEmployment endDate falló:", e); return { results: [] }; });

          const empEndDateMap = {};
          (empEmpData?.results || []).forEach(emp => {
            if (emp.userId) empEndDateMap[emp.userId] = emp.endDate || null;
          });

          aUsers.forEach(user => {
            const mgr = managerMap[user.userId] || {};
            user.managerId        = mgr.managerId        || "";
            user.managerName      = mgr.managerName      || "";
            user.managerEmail     = mgr.managerEmail     || "";
            user.managerJobCode   = mgr.managerJobCode   || "";
            user.paymentFrequency = mgr.paymentFrequency || "";
            user.planta           = mgr.planta           || "";
            user.area             = mgr.area             || "";
            user.ciudadFirma     = mgr.ciudadFirma     || "";  // ← NUEVO
            user.personalEmail    = mgr.personalEmail    || "";  // ← NUEVO
            user.personalPhone    = mgr.personalPhone    || "";  // ← NUEVO
            user.city             = mgr.city             || "";  // ← NUEVO: ciudad real (sobrescribe el city vacío del enrichedUsers inicial)
            user.endDateBaja = empEndDateMap[user.userId] || null;
          });

        } catch (e) {
          console.error("No se pudo completar la carga de datos SSFF para empleados inactivos:", e);
          this._inactiveEmployeesLoaded = false;
          throw e;
        }

        this._inactiveAdministrativeUsers = this._prepareEmployeeDialogUsers(aUsers, { inactiveOnly: true });
        this.getView().setModel(new JSONModel({ InactiveUsers: aUsers }), "inactive");
        this._inactiveEmployeesLoaded = true;
        this.attachBoxEvents();

      }).catch(oError => {
        if (!mOptions.silent) {
          MessageToast.show("Error al cargar empleados dados de baja.");
        }
        console.error(oError);
        this._inactiveEmployeesLoaded = false;
        throw oError;
      });

      this._inactiveEmployeesRequest = pFetch;
      pFetch.finally(() => {
        if (this._inactiveEmployeesRequest === pFetch) this._inactiveEmployeesRequest = null;
      }).catch(() => {});
      return pFetch;
    },


    // ═══════════════════════════════════════════════════════════════════
    // DIÁLOGO DE SELECCIÓN DE EMPLEADOS
    // ═══════════════════════════════════════════════════════════════════
    // Al abrir el diálogo se aplica un filtro base según el documento:
    // hoy todos los documentos de Colombia muestran solo Administrativos.
    // Si en el futuro algún documento necesita Operativos u otros perfiles,
    // se puede agregar la lógica acá según el sTitle recibido.
    // ═══════════════════════════════════════════════════════════════════

    _openDialogForTitle: function (sTitle) {
      const oView           = this.getView();
      const oDialog         = oView.byId("employeeDialog");
      const oViewStateModel = oView.getModel("view");

      if (!oViewStateModel) {
        console.error("No se encontró el modelo 'view'.");
        return;
      }

      // Decide si mostrar activos o inactivos según el documento
      const isInactive   = this._isInactiveDocumentTitle(sTitle);
      const oSourceModel = isInactive ? oView.getModel("inactive") : oView.getModel();
      const aUsers       = isInactive
        ? (oSourceModel?.getProperty("/InactiveUsers") || [])
        : (oSourceModel?.getProperty("/User") || []);

      let aFilteredUsers = isInactive ? this._inactiveAdministrativeUsers : this._activeAdministrativeUsers;
      if (!Array.isArray(aFilteredUsers) || !aFilteredUsers.length) {
        aFilteredUsers = this._prepareEmployeeDialogUsers(aUsers, { inactiveOnly: isInactive });
        if (isInactive) {
          this._inactiveAdministrativeUsers = aFilteredUsers;
        } else {
          this._activeAdministrativeUsers = aFilteredUsers;
        }
      }

      if ((!Array.isArray(aUsers) || aUsers.length === 0) && !aFilteredUsers.length) {
        console.error("No hay usuarios disponibles para el diálogo.");
        return;
      }

      if (!aFilteredUsers.length) {
        console.warn("No se encontraron usuarios Administrativos.");
      }

      oViewStateModel.setProperty("/BaseUsers",     aFilteredUsers);
      oViewStateModel.setProperty("/FilteredUsers", aFilteredUsers);
      oViewStateModel.setProperty("/DialogTitle",   sTitle);
      oViewStateModel.setProperty("/ShowDocuSignButton", this._shouldShowDocuSignButton());
      this._applyDialogPresentation();

      if (oDialog) {
        oView.byId("idUserTable").setModel(oViewStateModel, "view");
        oDialog.setTitle(sTitle);
        oDialog.open();
      } else {
        console.error("No se encontró el diálogo employeeDialog.");
      }

      // Resetea los filtros para que el diálogo arranque limpio
      this._applyCombinedFilters();
    },


    _shouldShowDocuSignButton: function () {
      return !!DOCUSIGN_DOCUMENTS[this._currentCategory];
    },

    _getDocumentPresentation: function () {
      const mPresentation = {
        kitRetiro: { icon: "sap-icon://employee-rejections", cardClass: "card-red" },
        otroSiRodamiento: { icon: "sap-icon://car-rental", cardClass: "card-sky" },
        otroSiAlimentacion15: { icon: "sap-icon://fridge", cardClass: "card-emerald" },
        otroSiAlimentacion11: { icon: "sap-icon://basket", cardClass: "card-rose" },
        otroSiAlimentacion10: { icon: "sap-icon://meal", cardClass: "card-amber" },
        beneficiosExtralegales: { icon: "sap-icon://collections-insight", cardClass: "card-orange" },
        solicitudDeduccionesRetencion: { icon: "sap-icon://expense-report", cardClass: "card-indigo" },
        compromisoEtica: { icon: "sap-icon://signature", cardClass: "card-blue" },
        autorizacionDescuento: { icon: "sap-icon://money-bills", cardClass: "card-purple" },
        datosPersonales: { icon: "sap-icon://private", cardClass: "card-teal" },
        noDeclarante: { icon: "sap-icon://survey", cardClass: "card-pink" },
        protocoloRecibo: { icon: "sap-icon://official-service", cardClass: "card-gray" },
        contratoIndefIntegral: { icon: "sap-icon://documents", cardClass: "card-violet" },
        contratoTerminoFijo: { icon: "sap-icon://business-card", cardClass: "card-green" },
        contratoTerminoIndef: { icon: "sap-icon://hr-approval", cardClass: "card-brown" },
        contratoAprendizajeLectivo: { icon: "sap-icon://education", cardClass: "card-lime" },
        contratoAprendizajeProductivo: { icon: "sap-icon://work-history", cardClass: "card-cyan" }
      };

      return mPresentation[this._currentCategory] || {
        icon: "sap-icon://document-text",
        cardClass: "card-blue"
      };
    },

    _applyDialogPresentation: function () {
      const oPresentation = this._getDocumentPresentation();
      const oViewModel = this.getView().getModel("view");
      const oBadge = this.byId("employeeDialogIconBadge");
      const aCardClasses = [
        "card-red", "card-blue", "card-teal", "card-gray", "card-pink",
        "card-purple", "card-indigo", "card-orange", "card-green", "card-brown",
        "card-lime", "card-cyan", "card-violet", "card-amber", "card-rose",
        "card-emerald", "card-sky"
      ];

      oViewModel?.setProperty("/DialogIcon", oPresentation.icon);

      if (oBadge) {
        aCardClasses.forEach(sClass => oBadge.removeStyleClass(sClass));
        oBadge.addStyleClass(oPresentation.cardClass);
      }
    },


    // ═══════════════════════════════════════════════════════════════════
    // CICLO DE VIDA DEL DIÁLOGO
    // ═══════════════════════════════════════════════════════════════════

    // Antes de abrir: desenfoca el fondo y limpia los filtros anteriores.
    onBeforeOpenDialog: function () {
      const oView    = this.getView();
      const oTable   = oView.byId("idUserTable");
      const oBinding = oTable.getBinding("items");

      oView.byId("contentContainer").addStyleClass("blurredBackground");
      oView.byId("searchField").setValue("");
      oView.byId("dateRange").setDateValue(null);
      oView.byId("dateRange").setSecondDateValue(null);
      this._activeSearch     = "";
      this._activeDateFilter = null;
      oBinding.filter([]);
      oTable.removeSelections();
    },

    // Después de cerrar: quita el efecto de desenfoque del fondo.
    onAfterCloseDialog: function () {
      this.getView().byId("contentContainer").removeStyleClass("blurredBackground");
    },

    // Cierra el diálogo y deja todo el estado limpio para la próxima apertura.
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
      oViewStateModel?.setProperty("/ShowDocuSignButton", false);
      oBinding.filter([]);
      oTable.removeSelections();
      this.aSelectedEmployees = [];

      oView.byId("employeeDialog").close();
      this.onAfterCloseDialog();
    },


    // ═══════════════════════════════════════════════════════════════════
    // FILTROS DE LA TABLA DE EMPLEADOS
    // ═══════════════════════════════════════════════════════════════════
    // La tabla soporta dos filtros que funcionan al mismo tiempo:
    //   1. Rango de fechas (fecha de ingreso para activos, fecha de salida para inactivos)
    //   2. Búsqueda por texto (nombre, apellido, userId, cédula, etc.)
    //
    // Ambos parten del array BaseUsers (la lista base del documento abierto)
    // y el resultado se guarda en FilteredUsers, que es lo que muestra la tabla.
    // Se recalculan cada vez que el usuario escribe o cambia las fechas.
    // ═══════════════════════════════════════════════════════════════════

    _applyCombinedFilters: function () {
      const oView           = this.getView();
      const oViewStateModel = oView.getModel("view");
      const isExColaborador = this._isInactiveDocumentTitle(this.sSelectedContract);

      // Parte de la lista base definida al abrir el diálogo
      const oModel = isExColaborador ? oView.getModel("inactive") : oView.getModel();
      const aBaseFromState = oViewStateModel?.getProperty("/BaseUsers");
      let filtered = Array.isArray(aBaseFromState) && aBaseFromState.length
        ? aBaseFromState
        : (isExColaborador
            ? (oModel.getProperty("/InactiveUsers") || [])
            : (oModel.getProperty("/User") || []));
      const bHasDateFilter = !!(this._activeDateFilter?.dFrom && this._activeDateFilter?.dTo);
      const sSearch = this._activeSearch?.trim() || "";

      if (!bHasDateFilter && !sSearch) {
        if (oViewStateModel?.getProperty("/FilteredUsers") !== filtered) {
          oViewStateModel?.setProperty("/FilteredUsers", filtered);
        }
        return;
      }

      // Filtro por rango de fechas
      if (bHasDateFilter) {
        const toUTC   = d => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const utcFrom = toUTC(this._activeDateFilter.dFrom);
        const utcTo   = toUTC(this._activeDateFilter.dTo);

        filtered = filtered.filter(user => {
          const raw  = isExColaborador ? user.empInfo?.endDate : user.hireDate;
          if (!raw) return false;
          const d    = new Date(raw);
          const utcD = toUTC(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
          return utcFrom.getTime() === utcTo.getTime()
            ? utcD.getTime() === utcFrom.getTime()
            : utcD >= utcFrom && utcD <= utcTo;
        });
      }

      // Filtro por texto (varias palabras funcionan como AND: el empleado debe coincidir con todas)
      if (sSearch) {
        const normalize = str =>
          str?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
             .replace(/\s+/g, " ").trim().toLowerCase() || "";
        const words = normalize(sSearch).split(" ");

        filtered = filtered.filter(user =>
          words.every(word =>
            normalize(user.firstName).includes(word)       ||
            normalize(user.lastName).includes(word)        ||
            normalize(user.userId).includes(word)          ||
            normalize(user.nationalId).includes(word)      ||
            normalize(user.defaultFullName).includes(word) ||
            normalize(user.fullNameReverse).includes(word) ||
            normalize(user.custom02).includes(word)        ||
            normalize(user.customLong1).includes(word)
          )
        );
      }

      oViewStateModel?.setProperty("/FilteredUsers", filtered);

      // Fuerza el refresco del binding para que UI5 actualice la tabla
      const oItemsBinding = this.byId("idUserTable")?.getBinding("items");
      if (typeof oItemsBinding?.refresh === "function") oItemsBinding.refresh();
    },

    // Handler del selector de fechas: actualiza el filtro de rango activo.
    onDateFilterChange: function () {
      const oDateRange = this.byId("dateRange");
      this._activeDateFilter = {
        dFrom: oDateRange.getDateValue(),
        dTo:   oDateRange.getSecondDateValue()
      };
      this._applyCombinedFilters();
    },

    // Handler del buscador de empleados (mientras el usuario escribe).
    onSearch: function (oEvent) {
      const sNewValue = oEvent?.getParameter?.("newValue");
      this._activeSearch = (typeof sNewValue === "string")
        ? sNewValue
        : (oEvent.getSource?.().getValue?.() || "");
      this._applyCombinedFilters();
    },

    // Handler alternativo para el campo de búsqueda (evento change, al salir del campo).
    onSearchFieldChange: function (oEvent) {
      this._activeSearch = oEvent.getParameter("newValue") || "";
      this._applyCombinedFilters();
    },


    // ═══════════════════════════════════════════════════════════════════
    // DELEGACIONES A HELPERS DE FORMATO
    // ═══════════════════════════════════════════════════════════════════
    // Estos métodos exponen las funciones de formatHelpers.js como métodos
    // del controller, para que los archivos de functions/ puedan llamarlos
    // usando 'this' como contexto del controller.
    // Ver: gestordoccolombia/controller/helpers/formatHelpers.js
    // ═══════════════════════════════════════════════════════════════════

    formatDateToSpanish:  function (sDate)       { return formatHelpers.formatDateToSpanish(sDate); },
    formatFechaCorta:     function (fecha)        { return formatHelpers.formatFechaCorta(fecha); },
    formatFechaFormal:    function (fechaInput)   { return formatHelpers.formatFechaFormal(fechaInput); },
    convertNumberToWords: function (num)          { return formatHelpers.convertNumberToWords(num); },
    formatDateToWords:    function (date)         { return formatHelpers.formatDateToWords(date); },
    resolveGender:        function (text, gender) { return formatHelpers.resolveGender(text, gender); },
    getCiudadWork:        function (user)         { return formatHelpers.getCiudadWork(user); },
    getCiudadResidencia:  function (user)         { return formatHelpers.getCiudadResidencia(user); },
    getLocalDate:         function ()             { return formatHelpers.getLocalDate(); },
    formatDateRaw:        function (dateStr)      { return formatHelpers.formatDateRaw(dateStr); },
    formatSalary:         function (value)        { return formatHelpers.formatSalary(value); },
    getTelefono:          function (user)         { return formatHelpers.getTelefono(user); },
    getEmail:             function (user)         { return formatHelpers.getEmail(user); },
    getNacionalidad:      function (user)         { return formatHelpers.getNacionalidad(user); },
    getSexo:              function (user)         { return formatHelpers.getSexo(user); },
    getPaisName:          function (code)         { return formatHelpers.getPaisName(code); },
    getEstadoCivil:       function (user)         { return formatHelpers.getEstadoCivil(user); },
    getGrupoSanguineo:    function (user)         { return formatHelpers.getGrupoSanguineo(user); },

    // Devuelve los datos completos de los empleados seleccionados en la tabla,
    // ya formateados y listos para reemplazar los placeholders en las plantillas.
    getSelectedUsers: function () { return formatHelpers.getSelectedUsers.call(this); },


    // ═══════════════════════════════════════════════════════════════════
    // DELEGACIÓN AL HELPER DE UI
    // ═══════════════════════════════════════════════════════════════════

    // Actualiza el saludo ("Buenos días/tardes/noches, [Nombre]") en el banner superior.
    updateGreeting: function () {
      const oUserModel   = this.getOwnerComponent().getModel("user");
      const sDisplayName = oUserModel?.getProperty("/displayName") || oUserModel?.getProperty("/firstname") || "";
      uiHelpers.updateGreeting(this.getView(), sDisplayName);
    },


    // ═══════════════════════════════════════════════════════════════════
    // TILES / CARDS DE DOCUMENTOS
    // ═══════════════════════════════════════════════════════════════════
    // Los handlers de click de cada tile están declarados en el XML de la vista.
    // Esta función se mantiene por compatibilidad pero ya no registra eventos adicionales.
    // ═══════════════════════════════════════════════════════════════════

    attachBoxEvents: function () {
      if (this._tilesEventsAttached) return;
      this._tilesEventsAttached = true;
      // Los press handlers están declarados directamente en la vista XML (onXxxPress)
    },

    // Lista de todos los tiles del buscador de documentos (onDocumentSearch).
    // Cada entrada tiene el id del control, el título y palabras clave para la búsqueda.
    _getDocumentSearchCards: function () {
      return [
        { id: "customListItemKitRetiro", title: "Kit de Retiro", desc: "Gestionar documentos de retiro", aliases: "retiro kit ex colaborador" },
        { id: "customListItemCompromisoEtica", title: "Compromiso con la Ética", desc: "Declaración de principios éticos", aliases: "compromiso etica declaracion principios" },
        { id: "customListItemDatosPersonales", title: "Autorización Datos Personales", desc: "Gestión de política de datos", aliases: "autorizacion datos personales politica privacidad" },
        { id: "customListItemProtocoloRecibo", title: "Protocolo Reglamento Interno", desc: "Recibo de reglamento interno", aliases: "protocolo recibo reglamento interno" },
        { id: "customListItemNoDeclarante", title: "Manifestación No Declarante", desc: "Declaración tributaria", aliases: "manifestacion no declarante declaracion tributaria" },
        { id: "customListItemAutorizacionDescuento", title: "Autorización de Descuento", desc: "Gestión de deducciones", aliases: "autorizacion descuento deduccion deducciones" },
        { id: "customListItemSolicitudDeduccionesRetencion", title: "Deducciones de Retención", desc: "Solicitud de retenciones", aliases: "solicitud deducciones retencion retenciones fuente" },
        { id: "customListItemBeneficios", title: "Beneficios Extralegales", desc: "Declaración política de beneficios", aliases: "beneficios extralegales politica" },
        { id: "customListItemContratoTerminoFijo", title: "Contrato Término Fijo", desc: "Documentación contrato fijo", aliases: "contrato a termino fijo documentacion" },
        { id: "customListItemContratoTerminoIndef", title: "Contrato Término Indefinido", desc: "Documentación contrato indefinido", aliases: "contrato a termino indefinido documentacion" },
        { id: "customListItemContratoAprendizajeLectivo", title: "Aprendizaje Etapa Lectiva", desc: "Contrato de aprendizaje lectivo", aliases: "contrato aprendizaje etapa lectiva" },
        { id: "customListItemContratoAprendizajeProductivo", title: "Aprendizaje Etapa Productiva", desc: "Contrato de aprendizaje productivo", aliases: "contrato aprendizaje etapa productiva" },
        { id: "customListItemContratoIntegral", title: "Contrato Indefinido Integral", desc: "Documentación contrato integral", aliases: "contrato indefinido integral documentacion" },
        { id: "customListItemOtroSiAlimentacion10", title: "Otro Sí - Alim. 10.000", desc: "Modificación contrato alimentación", aliases: "otro si alimentacion auxilio contrato 10000 diez mil 10 000" },
        { id: "customListItemOtroSiAlimentacion11", title: "Otro Sí - Alim. 11.500", desc: "Modificación contrato alimentación", aliases: "otro si alimentacion auxilio contrato 11500 once mil quinientos 11 500" },
        { id: "customListItemOtroSiAlimentacion15", title: "Otro Sí - Alim. 15.000", desc: "Modificación contrato alimentación", aliases: "otro si alimentacion auxilio contrato 15000 quince mil 15 000" },
        { id: "customListItemOtroSiRodamiento", title: "Otro Sí - Rodamiento", desc: "Auxilio de rodamiento", aliases: "otro si contrato trabajo auxilio rodamiento" }
      ];
    },

    // Quita tildes, pasa a minúsculas y elimina espacios extra, para comparar texto sin importar la escritura.
    _normalizeSearchText: function (sValue) {
      return String(sValue || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    },

    // Handler del buscador de tiles en la pantalla principal.
    // Filtra los tiles visibles en el grid según el texto que escribe el usuario.
    onDocumentSearch: function (oEvent) {
      const oMainSearch   = this.byId("documentSearch");
      const oHeaderSearch = this.byId("headerDocumentSearch");
      const oMobileSearch = this.byId("mobileHeaderDocumentSearch");
      const oSource       = oEvent?.getSource?.();
      const sValue = oEvent?.getParameter("newValue")
        ?? oEvent?.getParameter("query")
        ?? oSource?.getValue?.()
        ?? oMainSearch?.getValue()
        ?? oHeaderSearch?.getValue()
        ?? oMobileSearch?.getValue()
        ?? "";
      const sQuery = this._normalizeSearchText(sValue);
      const aCards = this._getDocumentSearchCards();
      const oGrid  = this.byId("gridItems");
      const bHasQuery = Boolean(sQuery);

      [oMainSearch, oHeaderSearch, oMobileSearch].forEach(oField => {
        if (!oField) return;
        if (oField !== oSource && oField.getValue?.() !== sValue) {
          oField.setValue(sValue);
        }
        oField.toggleStyleClass("documentSearchFieldActive", bHasQuery);
        oField.toggleStyleClass("headerSearchFieldActive", bHasQuery);
      });

      if (!oGrid) return;

      // Guarda el estado original del grid la primera vez que se usa el buscador
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

      // Si se borra el texto, restaura el grid a su estado original
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

        const sSearchText = this._normalizeSearchText([oCard.title, oCard.desc, oCard.aliases].join(" "));
        if (sSearchText.includes(sQuery)) {
          oItem.setVisible(true);
          oGrid.addContent(oItem);
        }
      });
    },


    // ═══════════════════════════════════════════════════════════════════
    // HANDLERS DE CLICK DE TILES
    // ═══════════════════════════════════════════════════════════════════
    // Un handler por cada tipo de documento. Todos siguen el mismo patrón:
    // registran qué documento se eligió y llaman a _handleTileSelection()
    // para cargar los datos y abrir el diálogo.
    // ═══════════════════════════════════════════════════════════════════

    onKitRetiroPress: function () {
      this.sSelectedContract = "Kit de Retiro";
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
      this.sSelectedContract = "Otro Sí - Alim. $15.000";
      this._currentCategory  = "otroSiAlimentacion15";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiAlimentacion11Press: function () {
      this.sSelectedContract = "Otro Sí - Alim. $11.500";
      this._currentCategory  = "otroSiAlimentacion11";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onOtroSiAlimentacion10Press: function () {
      this.sSelectedContract = "Otro Sí - Alim. $10.000";
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
      this.sSelectedContract = "Deducciones de Retención";
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
      this.sSelectedContract = "Autorización Datos Personales";
      this._currentCategory  = "datosPersonales";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onNoDeclarantePress: function () {
      this.sSelectedContract = "Manifestación No Declarante";
      this._currentCategory  = "noDeclarante";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onProtocoloReciboPress: function () {
      this.sSelectedContract = "Protocolo Reglamento Interno";
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
      this.sSelectedContract = "Contrato Término Fijo";
      this._currentCategory  = "contratoTerminoFijo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onContratoIndefinidoPress: function () {
      this.sSelectedContract = "Contrato Término Indefinido";
      this._currentCategory  = "contratoTerminoIndef";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onContratoAprendizajeLectivoPress: function () {
      this.sSelectedContract = "Aprendizaje Etapa Lectiva";
      this._currentCategory  = "contratoAprendizajeLectivo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },

    onContratoAprendizajeProductivoPress: function () {
      this.sSelectedContract = "Aprendizaje Etapa Productiva";
      this._currentCategory  = "contratoAprendizajeProductivo";
      this._handleTileSelection(this.sSelectedContract)
        .catch(() => MessageToast.show("Error cargando los datos."));
    },


    // ═══════════════════════════════════════════════════════════════════
    // SELECCIÓN DE EMPLEADOS EN LA TABLA
    // ═══════════════════════════════════════════════════════════════════
    // Mantiene el array aSelectedEmployees sincronizado con lo que el usuario
    // marca o desmarca en la tabla. Soporta selección múltiple.
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
    // UTILIDADES
    // ═══════════════════════════════════════════════════════════════════

    // Traduce un código de evento laboral (ej: "CB01") al nombre legible correspondiente
    // (ej: "Mutuo"), buscando en el catálogo aEventReasonDescriptions.
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
    // onDownloadPDF() es el handler del botón de descarga.
    // Despacha al método correcto según el documento activo (_currentCategory).
    //
    // Cada documento tiene su propia lógica en:
    //   gestordoccolombia/controller/functions/[nombreDocumento].js
    //
    // El parámetro sButtonId permite distinguir si el usuario pidió PDF o Word
    // (los botones de Word incluyen "wordDataInfo" en su ID).
    // ═══════════════════════════════════════════════════════════════════

    onDownloadPDF: function (oEvent) {
      const sCategory = this._currentCategory;
      const sButtonId = oEvent.getSource().getId();

      switch (sCategory) {
        case "kitRetiro":                       this.onDownloadPDFKitRetiro(sButtonId); break;
        case "otroSiRodamiento":                this.onDownloadPDFOtroSiRodamiento(sButtonId); break;
        case "otroSiAlimentacion15":            this.onDownloadPDFOtroSiAlimentacion15(sButtonId); break;
        case "otroSiAlimentacion11":            this.onDownloadPDFOtroSiAlimentacion11(sButtonId); break;
        case "otroSiAlimentacion10":            this.onDownloadPDFOtroSiAlimentacion10(sButtonId); break;
        case "beneficiosExtralegales":          this.onDownloadPDFBeneficiosExtralegales(sButtonId); break;
        case "solicitudDeduccionesRetencion":   this.onDownloadPDFRetencionFuente(sButtonId); break;
        case "compromisoEtica":                 this.onDownloadPDFCompromisoEtica(sButtonId); break;
        case "autorizacionDescuento":           this.onDownloadPDFAutorizacionDescuento(sButtonId); break;
        case "datosPersonales":                 this.onDownloadPDFDatosPersonales(sButtonId); break;
        case "noDeclarante":                    this.onDownloadPDFNoDeclarante(sButtonId); break;
        case "protocoloRecibo":                 this.onDownloadPDFProtocoloRecibo(sButtonId); break;
        case "contratoIndefIntegral":           this.onDownloadPDFContratoIndefIntegral(sButtonId); break;
        case "contratoTerminoFijo":             this.onDownloadPDFContratoTerminoFijo(sButtonId); break;
        case "contratoTerminoIndef":            this.onDownloadPDFContratoTerminoIndef(sButtonId); break;
        case "contratoAprendizajeLectivo":      this.onDownloadPDFContratoAprendizajeLectivo(sButtonId); break;
        case "contratoAprendizajeProductivo":   this.onDownloadPDFContratoAprendizajeProductivo(sButtonId); break;
        default:
          MessageToast.show("No hay función definida para este documento.");
      }
    },

    // Cada método delega al módulo de functions/ correspondiente.
    onDownloadPDFKitRetiro:                     async function (sButtonId) { kitRetiro.onDownloadPDFKitRetiro(this, sButtonId); },
    onDownloadPDFOtroSiRodamiento:              async function (sButtonId) { otroSiRodamiento.onDownloadPDFOtroSiRodamiento(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion15:          async function (sButtonId) { otroSiAlimentacion15.onDownloadPDFOtroSiAlimentacion15(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion11:          async function (sButtonId) { otroSiAlimentacion11.onDownloadPDFOtroSiAlimentacion11(this, sButtonId); },
    onDownloadPDFOtroSiAlimentacion10:          async function (sButtonId) { otroSiAlimentacion10.onDownloadPDFOtroSiAlimentacion10(this, sButtonId); },
    onDownloadPDFBeneficiosExtralegales:        async function (sButtonId) { beneficiosExtralegales.onDownloadPDFBeneficiosExtralegales(this, sButtonId); },
    onDownloadPDFRetencionFuente:               async function (sButtonId) { solicitudDeduccionesRetencion.onDownloadPDFRetencionFuente(this, sButtonId); },
    onDownloadPDFCompromisoEtica:               async function (sButtonId) { compromisoEtica.onDownloadPDFCompromisoEtica(this, sButtonId); },
    onDownloadPDFAutorizacionDescuento:         async function (sButtonId) { autorizacionDescuento.onDownloadPDFAutorizacionDescuento(this, sButtonId); },
    onDownloadPDFDatosPersonales:               async function (sButtonId) { datosPersonales.onDownloadPDFDatosPersonales(this, sButtonId); },
    onDownloadPDFNoDeclarante:                  async function (sButtonId) { noDeclarante.onDownloadPDFNoDeclarante(this, sButtonId); },
    onDownloadPDFProtocoloRecibo:               async function (sButtonId) { protocoloRecibo.onDownloadPDFProtocoloRecibo(this, sButtonId); },
    onDownloadPDFContratoIndefIntegral:         async function (sButtonId) { contratoIndefIntegral.onDownloadPDFContratoIndefIntegral(this, sButtonId); },
    onDownloadPDFContratoTerminoFijo:           async function (sButtonId) { contratoTerminoFijo.onDownloadPDFContratoTerminoFijo(this, sButtonId); },
    onDownloadPDFContratoTerminoIndef:          async function (sButtonId) { contratoTerminoIndef.onDownloadPDFContratoTerminoIndef(this, sButtonId); },
    onDownloadPDFContratoAprendizajeLectivo:    async function (sButtonId) { contratoAprendizajeLectivo.onDownloadPDFContratoAprendizajeLectivo(this, sButtonId); },
    onDownloadPDFContratoAprendizajeProductivo: async function (sButtonId) { contratoAprendizajeProductivo.onDownloadPDFContratoAprendizajeProductivo(this, sButtonId); },

    onSendToDocusign: async function (oEvent) {
      const oDocusignDocument = DOCUSIGN_DOCUMENTS[this._currentCategory];
      if (!oDocusignDocument) {
        MessageToast.show("Este documento no está habilitado para envío a DocuSign.");
        return;
      }

      const oButton = oEvent?.getSource?.();
      if (oButton?.setBusy) {
        oButton.setBusy(true);
      }

      try {
        await this._withBusy(async () => {
          const aDocuments = await oDocusignDocument.generator(this);

          if (!Array.isArray(aDocuments) || aDocuments.length === 0) {
            MessageToast.show("Seleccione al menos un colaborador.");
            return;
          }

          for (let i = 0; i < aDocuments.length; i++) {
            const oDocument = aDocuments[i];
            const oPayload = await CpiService.buildDocusignPayload(
              oDocument,
              oDocusignDocument.documentType
            );
            const oCpiResponse = await CpiService.sendTerminoFijoToCPI(oPayload);
            console.log("Respuesta CPI DocuSign " + oDocusignDocument.documentType + ":", oCpiResponse);
          }

          MessageToast.show(
            aDocuments.length > 1
              ? aDocuments.length + " documentos enviados a DocuSign correctamente."
              : "Documento enviado a DocuSign correctamente."
          );
        });
      } catch (oError) {
        console.error("No se pudo enviar el documento a DocuSign:", oError);
        MessageToast.show("No se pudo enviar el documento a DocuSign. Inténtalo nuevamente.");
      } finally {
        if (oButton?.setBusy) {
          oButton.setBusy(false);
        }
      }
    },

    // Busca la institución de formación más reciente del empleado en SuccessFactors
    // (entidad Background_Education, ordenada del registro más nuevo al más viejo).
    _getInstitucionFormacion: async function (sUserId) {
      const oComponentModel = this.getOwnerComponent().getModel();
      try {
        const oData = await this._readOData(oComponentModel, "/Background_Education", {
          urlParameters: {
            "$select": "userId,backgroundElementId,bgOrderPos,institucion",
            "$filter": `userId eq '${sUserId}'`,
            "$orderby": "bgOrderPos desc"
          }
        });
        const aResults = oData?.results || [];
        return aResults[0]?.institucion || "";
      } catch (e) {
        console.warn("No se pudo cargar Background_Education para", sUserId, e);
        return "";
      }
    },

    _debugCountryCodes: function () {
      const oModel = this.getOwnerComponent().getModel();
      oModel.read("/Country", {
        success: function (oData) {
          console.table(oData.results);
        },
        error: function (e) { console.error(e); }
      });
    }

  });
});