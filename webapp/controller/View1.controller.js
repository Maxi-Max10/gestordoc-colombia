sap.ui.define([
  // ── Núcleo de SAPUI5 ──
  "sap/ui/core/mvc/Controller",            // Clase base de la que extiende este controller
  "sap/ui/model/json/JSONModel",           // Modelo JSON usado para "view" y "user"
  "sap/m/MessageToast",                    // Notificaciones tipo "toast" para avisos al usuario
  "gestordoccolombia/util/LibraryLoader",  // Carga librerías externas (pdf-lib, html2canvas) de forma lazy
  // Helpers reutilizables
  "gestordoccolombia/controller/helpers/uiHelpers",
  "gestordoccolombia/controller/helpers/formatHelpers",
  // Lógica específica por documento (un módulo por cada tipo de documento a generar)
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
  "gestordoccolombia/service/CpiService" // Servicio que envía documentos a SAP CPI (integración DocuSign)

// El segundo argumento de sap.ui.define es la "factory function": recibe, en el
// mismo orden que el array de arriba, cada módulo ya cargado y listo para usar.
], (Controller, JSONModel, MessageToast, LibraryLoader, uiHelpers, formatHelpers,
    kitRetiro, otroSiRodamiento, otroSiAlimentacion15, otroSiAlimentacion11,
    otroSiAlimentacion10, beneficiosExtralegales, solicitudDeduccionesRetencion,
    compromisoEtica, autorizacionDescuento, datosPersonales, noDeclarante,
    protocoloRecibo, contratoIndefIntegral, contratoTerminoFijo, contratoTerminoIndef, contratoAprendizajeLectivo, contratoAprendizajeProductivo, CpiService) => {
  "use strict";

  // Extiende el Controller base de SAPUI5 y devuelve la clase de este controller,
  // identificada con el nombre completo "gestordoccolombia.controller.View1"
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
      if (!this.oGlobalBusyDialog) return;                       // Si no existe el diálogo, no hace nada (protección)
      this._busyCounter = (this._busyCounter || 0) + 1;           // Suma 1 al contador de operaciones en curso
      if (this._busyCounter === 1) {                              // Solo abre el diálogo cuando pasa de 0 a 1
        this.oGlobalBusyDialog.open();
      }
    },

    _endBusy: function () {
      if (!this.oGlobalBusyDialog) return;
      this._busyCounter = Math.max((this._busyCounter || 1) - 1, 0); // Resta 1, nunca deja el contador negativo
      if (this._busyCounter === 0) {                                 // Solo cierra cuando ya no quedan operaciones pendientes
        this.oGlobalBusyDialog.close();
      }
    },

    // Envuelve una función async mostrando el busy dialog durante su ejecución.
    // Uso: this._withBusy(() => this._readOData(...))
    _withBusy: function (fn) {
      this._beginBusy();                  // Muestra (o mantiene) el busy dialog antes de ejecutar fn
      return Promise.resolve()
        .then(fn)                         // Ejecuta la función recibida (puede ser async)
        .finally(() => this._endBusy());  // Pase lo que pase (éxito o error), libera el contador
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
      if (!this._pdfToolkitPromise) {                     // Solo arranca la carga la primera vez que se pide
        this._pdfToolkitPromise = Promise.all([
          LibraryLoader.ensureLibrary("pdf-lib", {         // Carga la librería pdf-lib desde un CDN
            url: "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
            globalName: "PDFLib",                          // Nombre de la variable global que crea el script
            validator: lib => !!lib && typeof lib.PDFDocument === "function" // Verifica que cargó bien
          }),
          LibraryLoader.ensureLibrary("html2canvas", {     // Carga html2canvas (convierte HTML a imagen)
            url: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            globalName: "html2canvas",
            validator: fn => typeof fn === "function"
          })
        ]).then(() => {
          // Una vez cargadas ambas, guarda referencias directas para uso rápido
          this._pdfLibRef = window.PDFLib;
          this._html2canvasRef = window.html2canvas;
          return { PDFLib: this._pdfLibRef, html2canvas: this._html2canvasRef };
        });
      }
      return this._pdfToolkitPromise; // Devuelve siempre la misma promesa (cacheada)
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
          success: resolve,  // Si la lectura OData tiene éxito, resuelve la promesa con los datos
          error: reject       // Si falla, rechaza la promesa con el error
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
      // agregar la lógica de needsInactive acá según sTitle.
      const needsActive   = true;          // Siempre se necesitan los activos hoy en día
      const needsInactive = false;         // Reservado para futuros documentos de excolaboradores
      const aPromises     = [];

      if (needsActive && !this._activeEmployeesLoaded) {     // Solo carga si todavía no se cargó en esta sesión
        aPromises.push(this.loadEmployees());
      }
      if (needsInactive && !this._inactiveEmployeesLoaded) {
        aPromises.push(this.loadEmployeesBkp());
      }

      return aPromises.length ? Promise.all(aPromises) : Promise.resolve(); // Espera todas las cargas pendientes
    },

    // Punto de entrada cuando el usuario hace click en un tile/documento.
    // Primero garantiza que los datos estén cargados, luego abre el diálogo.
    _handleTileSelection: function (sTitle) {
      return this._ensureDataForTitle(sTitle).then(() => {
        this._openDialogForTitle(sTitle); // Recién acá se abre el diálogo, con los datos ya disponibles
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
      const bDarkMode = this._readStoredThemeMode();      // Lee de localStorage si el usuario venía en modo oscuro

      // Busy dialog global: se reutiliza durante toda la sesión
      this.oGlobalBusyDialog = new sap.m.BusyDialog();    // Crea UNA sola instancia del spinner de carga
      this._busyCounter      = 0;                          // Contador en 0: ninguna operación corriendo todavía

      // Modelo "view": controla el estado de la UI (usuarios filtrados, título del diálogo, tema, etc.)
      const oViewModel = new JSONModel({
        BaseUsers:         [], // Lista base sin filtros (según el documento seleccionado)
        FilteredUsers:     [], // Lista que se muestra en la tabla (resultado de búsqueda/fecha)
        SelectedUsers:     [], // Usuarios marcados en la tabla (uso interno)
        DialogTitle:       "",
        DialogIcon:        "sap-icon://document-text",
        ShowDocuSignButton: false,
        IsDarkMode:        bDarkMode,
        ThemeToggleText:   bDarkMode ? "☾" : "☀",
        ThemeToggleTooltip: bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      });
      oViewModel.setSizeLimit(999999); // Sin límite práctico para empresas con muchos empleados
      this.getOwnerComponent().setModel(oViewModel, "view"); // Registra el modelo "view" a nivel de Component (visible en toda la app)

      // Aplica el tema guardado en localStorage
      this._applyThemeMode(bDarkMode);                       // Pone las clases CSS correctas en el DOM
      this._enableThemeTransitionsAfterInitialRender();      // Habilita animaciones de transición solo después del primer render

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
      this.getUserInfo();      // Dispara el flujo: userId -> empresa -> permisos/grupo
      this.updateGreeting();   // Muestra un saludo provisional (se actualiza de nuevo cuando llega el nombre real)

      // Carga el logo desde la carpeta img del proyecto
      const oImage = this.byId("_IDGenImageeee");
      if (oImage) {
        oImage.setSrc(sap.ui.require.toUrl("gestordoccolombia/img/logo.png")); // Resuelve la URL del logo según el namespace del módulo
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
        return window.localStorage.getItem("gestordoccolombia-theme") === "dark"; // true solo si el valor guardado es exactamente "dark"
      } catch (oError) {
        return false; // Si localStorage no está disponible (ej: modo privado), arranca en claro
      }
    },

    // Aplica el tema al DOM y actualiza el modelo de vista y localStorage.
    _applyThemeMode: function (bDarkMode) {
      const sThemeClass = "gdDarkMode";
      const oViewModel  = this.getOwnerComponent().getModel("view");

      document.documentElement.classList.toggle(sThemeClass, bDarkMode); // Agrega/quita la clase en <html>
      if (document.body) {
        document.body.classList.toggle(sThemeClass, bDarkMode);          // Y también en <body>, por si el CSS la necesita ahí
      }

      if (oViewModel) {
        oViewModel.setProperty("/IsDarkMode",        bDarkMode);
        oViewModel.setProperty("/ThemeToggleText",   bDarkMode ? "☾" : "☀");          // Ícono del botón de toggle
        oViewModel.setProperty("/ThemeToggleTooltip", bDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"); // Tooltip dice la acción contraria al estado actual
      }

      try {
        window.localStorage.setItem("gestordoccolombia-theme", bDarkMode ? "dark" : "light"); // Persiste la preferencia
      } catch (oError) {
        console.warn("No se pudo guardar la preferencia de tema:", oError);
      }
    },

    // Activa las transiciones solo después de aplicar el tema inicial guardado.
    _enableThemeTransitionsAfterInitialRender: function () {
      const fnEnableTransitions = function () {
        document.documentElement.classList.add("gdThemeTransitionReady"); // Esta clase es la que habilita el "transition" en CSS
        if (document.body) {
          document.body.classList.add("gdThemeTransitionReady");
        }
      };

      // Espera 2 frames de animación antes de habilitar transiciones,
      // para que el cambio de tema inicial no se vea "animado" (parpadeo feo al cargar)
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(fnEnableTransitions);
        });
      } else {
        window.setTimeout(fnEnableTransitions, 0); // Fallback para navegadores muy viejos
      }
    },

    // Handler del botón de toggle de tema en la barra superior.
    onToggleTheme: function () {
      const oViewModel = this.getOwnerComponent().getModel("view");
      const bDarkMode  = !(oViewModel && oViewModel.getProperty("/IsDarkMode")); // Invierte el estado actual
      this._applyThemeMode(bDarkMode);
    },

    // Hace scroll suave hacia arriba del contenedor principal (o de la ventana si no encuentra el contenedor)
    _scrollToHome: function () {
      const oPage = this.byId("contentContainer");
      const oPageDom = oPage && oPage.getDomRef && oPage.getDomRef();
      // Busca el elemento DOM real que tiene el scroll dentro del control sap.m.Page
      const oScrollDom = oPageDom && (oPageDom.querySelector(".sapMPageEnableScrolling") || oPageDom.querySelector(".sapMPageScroll") || oPageDom);

      if (oScrollDom && typeof oScrollDom.scrollTo === "function") {
        oScrollDom.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" }); // Fallback: scrollea la ventana completa
      }
    },

    // Handler de selección en el IconTabBar superior: si vuelve al tab "1" (home), hace scroll arriba
    onSelectHeader: function (oEvent) {
      const sKey = oEvent && oEvent.getParameter && oEvent.getParameter("selectedKey");
      if (!sKey || sKey === "1") {
        this._scrollToHome();
      }
    },

    // Abre el menú (Popover) del header en vista mobile
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

    // Desde el menú mobile: cierra el menú y vuelve al inicio
    onMobileHeaderHomePress: function () {
      this._closeMobileHeaderMenu();
      this._scrollToHome();
    },

    // Desde el menú mobile: cambia el tema y cierra el menú
    onMobileToggleTheme: function () {
      this.onToggleTheme();
      this._closeMobileHeaderMenu();
    },


    // ═══════════════════════════════════════════════════════════════════
    // PRELOADER INICIAL
    // ═══════════════════════════════════════════════════════════════════
    // Oculta el splash screen de carga inicial una vez que el grid de
    // tiles está visualmente estable (posiciones fijas por N frames).
    // Tiene un tiempo mínimo (2.4s) y máximo (6.5s) de espera.
    // ═══════════════════════════════════════════════════════════════════

    _hideInitialPreloader: function () {
      if (this._initialPreloaderHideRequested) return;  // Evita ejecutar esto más de una vez
      this._initialPreloaderHideRequested = true;

      const fnHide = () => {
        if (typeof window.gmaHideAppPreloader === "function") { // Función global definida en el index.html
          window.gmaHideAppPreloader();
        }
      };

      this._waitForInitialLayoutReady().then(fnHide).catch(fnHide); // Pase lo que pase (resuelve o falla), oculta el preloader
    },

    // Espera a que el grid de tiles tenga posiciones estables durante
    // iRequiredStableFrames frames consecutivos antes de resolver.
    _waitForInitialLayoutReady: function () {
      const iMinWait             = 2400;   // Tiempo mínimo de espera (ms), aunque el layout ya esté listo
      const iMaxWait             = 6500;   // Tiempo máximo: si nunca se estabiliza, se libera igual
      const iRequiredStableFrames = 12;    // Cantidad de frames seguidos con el mismo layout para considerarlo "estable"
      const iStartedAt           = Date.now();
      const fnNextFrame          = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16)); // Fallback ~60fps

      try { sap.ui.getCore().applyChanges(); } catch (e) {} // Fuerza un render inmediato de UI5 antes de medir

      return new Promise((resolve) => {
        let sLastSignature = ""; // "Huella" del layout anterior, para comparar entre frames
        let iStableFrames  = 0;  // Cuántos frames seguidos llevamos con la misma huella

        // Genera una cadena que representa la posición/tamaño de cada tile visible.
        // Si dos frames generan la misma cadena, el layout no cambió.
        const fnGetLayoutSignature = () => {
          const oGrid      = this.byId("gridItems");
          const oGridDomRef = oGrid?.getDomRef();
          const aContent   = oGrid?.getContent?.() || [];

          if (!oGridDomRef || !aContent.length) return "";

          const oGridRect    = oGridDomRef.getBoundingClientRect();
          const aVisibleRects = aContent
            .filter(oItem => oItem.getVisible && oItem.getVisible())       // Solo tiles visibles
            .map(oItem => oItem.getDomRef && oItem.getDomRef())
            .filter(Boolean)
            .map(oDomRef => {
              const r = oDomRef.getBoundingClientRect();
              // Redondea posición y tamaño relativos al grid, para evitar diferencias de subpíxel
              return [
                Math.round(r.left - oGridRect.left),
                Math.round(r.top  - oGridRect.top),
                Math.round(r.width),
                Math.round(r.height)
              ].join(":");
            });

          return aVisibleRects.length ? aVisibleRects.join("|") : "";
        };

        // Se ejecuta en cada frame de animación: compara la huella actual con la anterior
        const fnCheck = () => {
          const iElapsed  = Date.now() - iStartedAt;
          const sSignature = fnGetLayoutSignature();

          if (sSignature && sSignature === sLastSignature) {
            iStableFrames += 1;       // El layout no cambió: suma un frame estable más
          } else {
            sLastSignature = sSignature; // El layout cambió: reinicia el conteo
            iStableFrames  = 0;
          }

          // Resuelve si: ya pasó el mínimo Y el layout está estable, O ya se llegó al máximo de espera
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
      const appId      = this.getOwnerComponent().getManifestEntry("/sap.app/id"); // Lee el "id" declarado en manifest.json
      const appPath    = appId.replaceAll(".", "/");                               // Convierte "namespace.app" en "namespace/app"
      return jQuery.sap.getModulePath(appPath);                                    // UI5 resuelve esto a la URL real donde corre la app
    },

    // Consulta la empresa del userId en SuccessFactors.
    // Si falla, usa "CO10" como empresa por defecto.
    getUserCompany: function (userId) {
      const oModel = this.getOwnerComponent().getModel(); // Modelo OData principal (conexión a SuccessFactors)
      return new Promise((resolve) => {
        oModel.read("/User('" + userId + "')", {
          urlParameters: {
            "$select": "userId,empInfo/jobInfoNav/company",  // Solo pide el campo "company" para no traer info de más
            "$expand": "empInfo/jobInfoNav"                  // Necesario para poder navegar a jobInfoNav/company
          },
          success: function (oData) {
            const sCompany = oData?.empInfo?.jobInfoNav?.results?.[0]?.company || "CO10"; // Si no viene, usa CO10
            resolve(sCompany);
          },
          error: function () {
            console.warn("No se pudo obtener la empresa, usando CO10 por defecto.");
            resolve("CO10"); // Importante: resuelve igual (no rechaza) para no romper el flujo de login
          }
        });
      });
    },
    
    //OBTENGO INFORMACION DEL USUARIO LOGUEADO
    // Detecta el userId del usuario logueado a través de la API de SAP BTP.
    // Una vez obtenido, encadena getUserCompany() y getDataUser().
    getUserInfo: function () {
      const that = this;
      const url  = this.getBaseURL() + "/user-api/currentUser"; // Endpoint estándar de SAP BTP que devuelve el usuario logueado
      const UseroModel = new JSONModel();
      UseroModel.loadData(url); // Dispara la petición; los datos llegan vía evento (no es una promesa)

      UseroModel.attachRequestCompleted(function () {
        // Fallback para testing local: si no hay email válido, usa usuario de prueba
        let userId = (!UseroModel.getData().email ||
                      UseroModel.getData().email === "rodrigo.lopez@agprodservicios.com")
          ? "excagp"                          // Usuario de prueba fijo (para desarrollo local)
          : UseroModel.getData().name;        // En producción: usa el "name" devuelto por la API

        UseroModel.setProperty("/firstname", userId);
        that.getOwnerComponent().setModel(UseroModel, "user"); // Registra el modelo "user", visible en toda la app

        that.getUserCompany(userId).then(function (sCompany) {
          UseroModel.setProperty("/company", sCompany);
          that.getDataUser(userId); // Sigue la cadena: ahora busca permisos/grupo del usuario
        }).catch(function () {
          MessageToast.show("Error al obtener información de la empresa.");
          that.oGlobalBusyDialog.close();
          that._hideInitialPreloader(); // Aunque falle, hay que ocultar el splash de carga igual
        });
      });

      UseroModel.attachRequestFailed(function () {
        // Si ni siquiera se pudo obtener el usuario logueado, libera la UI igual
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
      const readUrlModelGroup = "/cust_GD_mantenedorGrupos('" + user + "')"; // Entidad custom de SuccessFactors con permisos

      this.getView().getModel().read(readUrlModelGroup, {
        success: function (oData) {
          const userModel  = that.getOwnerComponent().getModel("user");
          const cleanData  = JSON.parse(JSON.stringify(oData)); // Clona el objeto para evitar referencias internas de OData

          userModel.setProperty("/datos",       cleanData);
          userModel.setProperty("/displayName", cleanData.displayName);
          that.updateGreeting(); // Ahora sí, actualiza el saludo con el nombre real (ya no el provisional)

          // Género para tratamiento gramatical en documentos
          userModel.setProperty("/gender",
            cleanData.gender === "F" ? "genero_Femenino" : "genero_Masculino"
          );

          // Grupo y permisos
          const grupo = cleanData.cust_grupo;
          userModel.setProperty("/grupo", grupo);

          let permisos = "ninguno"; // Por defecto, sin acceso
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

          // Admins ven todo, usuarios no ven nada
          const bVisible = (permisos === "admin");
          aTileIds.forEach(sId => {
            that.byId(sId)?.setVisible(bVisible); // El "?." protege si algún tile no existe en la vista
          });

          that._hideInitialPreloader(); // Ya se sabe qué mostrar: ahora sí se puede ocultar el splash
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
      if (this._activeEmployeesRequest) return this._activeEmployeesRequest; // Si ya hay una carga en curso, reutiliza esa misma promesa (evita pedidos duplicados)

      const oComponentModel = this.getOwnerComponent().getModel();
      const sUserCompany    = this.getOwnerComponent().getModel("user").getProperty("/company") || "CO10";

      // Campos a pedir del endpoint /User (OData $select)
      const sSelect = [
        "userId", "status", "firstName", "lastName", "email", "nationality",
        "jobCode", "title", "custom02", "custom03", "businessPhone", "state",
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
        "custom15"
      ].join(",");

      // Navegaciones que hay que expandir para poder leer los campos anidados de arriba (OData $expand)
      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav",
        "custom05Nav"
      ].join(",");

      // ── Primera llamada: trae todos los empleados activos de la empresa del usuario ──
      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status eq 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`, // status='t' = activo
          "$expand": sExpand
        }
      })).then(async oUsers => {
        const aUsers = Array.isArray(oUsers?.results) ? oUsers.results : [];

        // Recorre cada usuario crudo y le agrega campos calculados/aplanados,
        // más fáciles de usar luego en las plantillas de documentos
        const enrichedUsers = aUsers.map(user => {
          const salaryRaw = user?.empInfo?.compInfoNav?.results?.[0]
                              ?.empPayCompRecurringNav?.results?.[0]?.paycompvalue; // Salario, viene anidado en 2 niveles
          user.paycompvalue = salaryRaw || 0;
          user.paycompValue = salaryRaw || 0; // Se guarda con las dos variantes de mayúscula por compatibilidad

          const nationalIdResults = user.empInfo?.personNav?.nationalIdNav?.results ?? [];
          const ccEntry           = nationalIdResults.find(i => i.cardType === "CC"); // Busca el documento tipo Cédula de Ciudadanía
          user.nationalId         = ccEntry?.nationalId ?? "";
          user.docCardType        = nationalIdResults[0]?.cardType ?? "";
          user.originalStartDate  = user.empInfo?.originalStartDate || null;
          user.nationalityCode    = nationalIdResults.find(i => i.country)?.country ?? "";
          user.docExpeditionDate  = ccEntry?.customDate1 || null; // Fecha de expedición del documento
          user.bloodType          = user.custom05Nav?.localeLabel || ""; // Grupo sanguíneo (campo custom de SF)
          user.addressLine1       = user.addressLine1 || "";
          user.hasDependents      = user.custom15 || "";
          user.dateOfBirth        = user.dateOfBirth || null;

          // Inicializar campos vacíos hasta que llegue EmpJob
          user.managerName      = "";
          user.managerEmail     = "";
          user.managerJobCode   = "";
          user.managerId        = "";
          user.paymentFrequency = ""; // se llenará desde EmpJob

          // Tratamiento (Sr./Sra./Srta.) según código de salutation de SuccessFactors
          user.salut = user.salutation === "3526" ? "Sra."
                    : user.salutation === "3525" ? "Sr."
                    : "Srta.";

          user.customLong1 = user.empInfo?.personNav?.customLong1 || "";

          // Estado civil: traduce el código numérico a texto, adaptado al género
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

        // ── Segunda llamada: manager + paymentFrequency desde EmpJob ──────
        try {
          const userIds   = enrichedUsers.map(u => u.userId).filter(Boolean);
          const chunkSize = 50;
          const managerMap = {};

          // ── Mapa de PayScaleArea ──────────────────────────────────────────
          const payScaleAreaMap = {};
          try {
            const psaData = await this._readOData(oComponentModel, "/PayScaleArea", {
              urlParameters: {
                "$select": "code,externalName_defaultValue"
              }
            });
            (psaData?.results || []).forEach(psa => {
              if (psa.code) payScaleAreaMap[psa.code] = psa.externalName_defaultValue 
                ? `${psa.externalName_defaultValue} (${psa.code})` 
                : psa.code; //Para que en el Area, me traiga el nombre y el código
            });
          } catch (e) {
            console.warn("No se pudo cargar PayScaleArea:", e);
          }
          // ─────────────────────────────────────────────────────────────────

          for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk     = userIds.slice(i, i + chunkSize);
            const filterIds = chunk.map(id => `userId eq '${id}'`).join(" or ");

            const empJobData = await this._readOData(oComponentModel, "/EmpJob", {
              urlParameters: {
                "$select": "userId,managerId,managerUserNav/userId,managerUserNav/displayName,managerUserNav/email,managerUserNav/jobCode,payGroup,location,locationNav/name,payScaleArea",
                "$filter": `(${filterIds})`,
                "$expand": "managerUserNav,payGroupNav,locationNav"
              }
            });

            const empJobResults = Array.isArray(empJobData?.results) ? empJobData.results : [];

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
                  managerName:      (job.managerUserNav?.displayName || "")
                    .trim(),
                  managerEmail:     job.managerUserNav?.email || "",
                  managerJobCode:   (job.managerUserNav?.jobCode || "").replace(/\s*\(\d+\)$/, ""),
                  paymentFrequency: PAY_GROUP_LABELS[job.payGroup] || (job.payGroup || ""),
                  planta:           job.locationNav?.name || job.location || "",
                  area:             payScaleAreaMap[job.payScaleArea] || job.payScaleArea || ""
                };
              }
            });
          }

          enrichedUsers.forEach(user => {
            const mgr = managerMap[user.userId] || {};
            user.managerId        = mgr.managerId        || "";
            user.managerName      = mgr.managerName      || "";
            user.managerEmail     = mgr.managerEmail     || "";
            user.managerJobCode   = mgr.managerJobCode   || "";
            user.paymentFrequency = mgr.paymentFrequency || "";
            user.planta           = mgr.planta           || "";
            user.area             = mgr.area             || ""
          });

        } catch (e) {
          console.warn("No se pudieron cargar los managers desde EmpJob:", e);
        }
        // ──────────────────────────────────────────────────────────────────

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
        "custom05Nav/localeLabel"
      ].join(",");

      const sExpand = [
        "manager",
        "empInfo/compInfoNav/empPayCompRecurringNav",
        "empInfo/jobInfoNav",
        "empInfo/personNav/personalInfoNav",
        "empInfo/personNav/nationalIdNav",
        "custom05Nav"
      ].join(",");

      const pFetch = this._withBusy(() => this._readOData(oComponentModel, "/User", {
        urlParameters: {
          "$select": sSelect,
          "$filter": `status ne 't' and empInfo/jobInfoNav/company eq '${sUserCompany}'`,
          "$expand": sExpand
        }
      })).then(async oData => {
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
          user.nationalId         = ccEntry?.nationalId ?? "";
          user.docCardType        = nationalIdResults[0]?.cardType ?? "";
          user.originalStartDate  = user.empInfo?.originalStartDate || null;
          user.nationalityCode    = nationalIdResults.find(i => i.country)?.country ?? "";
          user.docExpeditionDate  = ccEntry?.customDate1 || null;
          user.addressLine1       = user.addressLine1 || "";
          user.hasDependents      = user.custom15 || "";
          user.dateOfBirth        = user.dateOfBirth || null;

          // Inicializar campos vacíos hasta que llegue EmpJob
          user.managerName      = "";
          user.managerEmail     = "";
          user.managerJobCode   = "";
          user.managerId        = "";
          user.paymentFrequency = ""; // se llenará desde EmpJob

          aUsers.push(user);
        });

        // ── Segunda llamada: manager + paymentFrequency desde EmpJob ──────
        try {
          const userIds   = aUsers.map(u => u.userId).filter(Boolean);
          const chunkSize = 50;
          const managerMap = {};

          // ── Mapa de PayScaleArea ──────────────────────────────────────────
          const payScaleAreaMap = {};
          try {
            const psaData = await this._readOData(oComponentModel, "/PayScaleArea", {
              urlParameters: {
                "$select": "code,externalName_defaultValue"
              }
            });
            (psaData?.results || []).forEach(psa => {
              if (psa.code) payScaleAreaMap[psa.code] = psa.externalName_defaultValue 
                ? `${psa.externalName_defaultValue} (${psa.code})` 
                : psa.code; //Para que en el Area, me traiga el nombre y el código
            });
          } catch (e) {
            console.warn("No se pudo cargar PayScaleArea:", e);
          }
          // ─────────────────────────────────────────────────────────────────

          for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk     = userIds.slice(i, i + chunkSize);
            const filterIds = chunk.map(id => `userId eq '${id}'`).join(" or ");

            const empJobData = await this._readOData(oComponentModel, "/EmpJob", {
              urlParameters: {
                "$select": "userId,managerId,managerUserNav/userId,managerUserNav/displayName,managerUserNav/email,managerUserNav/jobCode,payGroup,location,locationNav/name,payScaleArea",
                "$filter": `(${filterIds})`,
                "$expand": "managerUserNav,payGroupNav,locationNav"
              }
            });

            const empJobResults = Array.isArray(empJobData?.results) ? empJobData.results : [];

            const PAY_GROUP_LABELS = {
              "Q2": "QUINCENAL",
              "M1": "MENSUAL",
              "S1": "SEMANAL"
            };

            empJobResults.forEach(job => {
              if (job.userId) {
                managerMap[job.userId] = {
                  managerId:        job.managerId || "",
                  managerName:      job.managerUserNav?.displayName || "",
                  managerEmail:     job.managerUserNav?.email || "",
                  managerJobCode:   (job.managerUserNav?.jobCode || "").replace(/\s*\(\d+\)$/, ""),
                  paymentFrequency: PAY_GROUP_LABELS[job.payGroup] || (job.payGroup || ""),
                  planta:           job.locationNav?.name || job.location || "",
                  area:             payScaleAreaMap[job.payScaleArea] || job.payScaleArea || ""
                };
              }
            });
          }

          aUsers.forEach(user => {
            const mgr = managerMap[user.userId] || {};
            user.managerId        = mgr.managerId        || "";
            user.managerName      = mgr.managerName      || "";
            user.managerEmail     = mgr.managerEmail     || "";
            user.managerJobCode   = mgr.managerJobCode   || "";
            user.paymentFrequency = mgr.paymentFrequency || "";
            user.planta           = mgr.planta           || "";
            user.area             = mgr.area             || ""
          });

        } catch (e) {
          console.warn("No se pudieron cargar los managers desde EmpJob (inactivos):", e);
        }
        // ──────────────────────────────────────────────────────────────────

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
      oViewStateModel.setProperty("/ShowDocuSignButton", this._shouldShowDocuSignButton());
      this._applyDialogPresentation();

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


    _shouldShowDocuSignButton: function () {
      return [
        "contratoTerminoFijo",
        "contratoTerminoIndef",
        "contratoAprendizajeLectivo",
        "contratoAprendizajeProductivo",
        "contratoIndefIntegral",
        "otroSiAlimentacion10",
        "otroSiAlimentacion11",
        "otroSiAlimentacion15",
        "otroSiRodamiento"
      ].indexOf(this._currentCategory) > -1;
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
      oViewStateModel?.setProperty("/ShowDocuSignButton", false);
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
    getTelefono:    function (user) { return formatHelpers.getTelefono(user); },
    getEmail:       function (user) { return formatHelpers.getEmail(user); },
    getNacionalidad: function (user) { return formatHelpers.getNacionalidad(user); },
    getSexo:        function (user) { return formatHelpers.getSexo(user); },
    getPaisName: function (code) { return formatHelpers.getPaisName(code); },
    getEstadoCivil:    function (user) { return formatHelpers.getEstadoCivil(user); },
    getGrupoSanguineo: function (user) { return formatHelpers.getGrupoSanguineo(user); },

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

        const sSearchText = this._normalizeSearchText([oCard.title, oCard.desc, oCard.aliases].join(" "));
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
    // Despacha al método específico según la categoría interna activa.
    //
    // Cada documento tiene su propia lógica en:
    //   gestordoccolombia/controller/functions/[nombreDocumento].js
    //
    // El parámetro sButtonId diferencia entre descarga PDF y Word
    // (los botones Word incluyen "wordDataInfo" en su ID).
    // ═══════════════════════════════════════════════════════════════════

    onDownloadPDF: function (oEvent) {
      const sCategory = this._currentCategory;
      const sButtonId = oEvent.getSource().getId();

      switch (sCategory) {
        case "kitRetiro": this.onDownloadPDFKitRetiro(sButtonId); break;
        case "otroSiRodamiento": this.onDownloadPDFOtroSiRodamiento(sButtonId); break;
        case "otroSiAlimentacion15": this.onDownloadPDFOtroSiAlimentacion15(sButtonId); break;
        case "otroSiAlimentacion11": this.onDownloadPDFOtroSiAlimentacion11(sButtonId); break;
        case "otroSiAlimentacion10": this.onDownloadPDFOtroSiAlimentacion10(sButtonId); break;
        case "beneficiosExtralegales": this.onDownloadPDFBeneficiosExtralegales(sButtonId); break;
        case "solicitudDeduccionesRetencion": this.onDownloadPDFRetencionFuente(sButtonId); break;
        case "compromisoEtica": this.onDownloadPDFCompromisoEtica(sButtonId); break;
        case "autorizacionDescuento": this.onDownloadPDFAutorizacionDescuento(sButtonId); break;
        case "datosPersonales": this.onDownloadPDFDatosPersonales(sButtonId); break;
        case "noDeclarante": this.onDownloadPDFNoDeclarante(sButtonId); break;
        case "protocoloRecibo": this.onDownloadPDFProtocoloRecibo(sButtonId); break;
        case "contratoIndefIntegral": this.onDownloadPDFContratoIndefIntegral(sButtonId); break;
        case "contratoTerminoFijo": this.onDownloadPDFContratoTerminoFijo(sButtonId); break;
        case "contratoTerminoIndef": this.onDownloadPDFContratoTerminoIndef(sButtonId); break;
        case "contratoAprendizajeLectivo": this.onDownloadPDFContratoAprendizajeLectivo(sButtonId); break;
        case "contratoAprendizajeProductivo": this.onDownloadPDFContratoAprendizajeProductivo(sButtonId); break;
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
    onDownloadPDFContratoAprendizajeProductivo: async function (sButtonId) { contratoAprendizajeProductivo.onDownloadPDFContratoAprendizajeProductivo(this, sButtonId); },

    onSendToDocusign: async function (oEvent) {
      if (this._currentCategory !== "contratoTerminoFijo" || this.sSelectedContract !== "Contrato Término Fijo") {
        MessageToast.show("Por ahora solo está disponible el envío a DocuSign para Contrato Término Fijo.");
        return;
      }

      const oButton = oEvent?.getSource?.();
      if (oButton?.setBusy) {
        oButton.setBusy(true);
      }

      try {
        await this._withBusy(async () => {
          const aDocuments = await contratoTerminoFijo.generateContratoTerminoFijoPdfDocuments(this);

          if (!Array.isArray(aDocuments) || aDocuments.length === 0) {
            MessageToast.show("Seleccione al menos un colaborador.");
            return;
          }

          for (let i = 0; i < aDocuments.length; i++) {
            const oDocument = aDocuments[i];
            const oPayload = await CpiService.buildTerminoFijoPayload(oDocument);
            const oCpiResponse = await CpiService.sendTerminoFijoToCPI(oPayload);
            console.log("Respuesta CPI DocuSign Contrato Término Fijo:", oCpiResponse);
          }

          MessageToast.show("Contrato enviado a DocuSign correctamente.");
        });
      } catch (oError) {
        console.error("No se pudo enviar el contrato a DocuSign:", oError);
        MessageToast.show("No se pudo enviar el contrato a DocuSign. Intentalo nuevamente.");
      } finally {
        if (oButton?.setBusy) {
          oButton.setBusy(false);
        }
      }
    },

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