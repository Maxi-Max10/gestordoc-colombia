sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFDatosPersonales(oController, sButtonId) {
        try {
            await oController._ensurePdfToolkit();

            const PDFLibRef      = window.PDFLib      || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas  || oController._html2canvasRef;

            if (!PDFLibRef || !html2canvasRef) {
                throw new Error("No se pudieron cargar las bibliotecas PDF/Canvas requeridas.");
            }

            const aUsers = oController.getSelectedUsers();
            if (aUsers.length === 0) {
                MessageToast.show("Seleccione al menos un colaborador.");
                return;
            }

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                /* DEBUG: revisar datos del usuario antes de generar documento
                console.log(
                    "country:", user.country,
                    "email:", user.email,
                    "custom03:", user.custom03,
                    "addressLine1:", user.addressLine1,
                    "custom10:", user.custom10,
                    "businessPhone:", user.businessPhone
                );
                */

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre      = `${user.firstName} ${user.lastName}`;
                const sCedula      = user.nationalId || "";
                const sCiudadWork  = oController.getCiudadWork(user);
                const localDate    = oController.getLocalDate();
                const sCargo      = oController.resolveGender(user.title || "", user.gender);
                const sPais = oController.getPaisName(user.country);
                const sTelefono   = oController.getTelefono(user);
                const sEmail      = oController.getEmail(user);
                const sNacional   = oController.getNacionalidad(user);
                const sSexo       = oController.getSexo(user);
                const sEstadoCivil = oController.getEstadoCivil(user);
                const sGrupoSangre = oController.getGrupoSanguineo(user);
                const sDireccion = (user.addressLine1 || "").replace(/\s+/g, " ").trim();
                const sFechaExpedicion = user.docExpeditionDate || "";
                const sJefeNombre = user.managerName || "";
                const sDocCardType = user.docCardType || "";
                const sFechaNacimiento = user.dateOfBirth 
                    ? oController.formatDateRaw(user.dateOfBirth) 
                    : "";

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName: user.firstName,
                        lastName:  user.lastName,
                        sNombre,
                        sCedula
                    });
                    continue;
                }

                // ── PDF — sin plantilla de fondo ──────────────────────────────
                const htmlPagina1 = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <title>Formato DIACO</title>

                    <style>
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                            font-family: Arial, Helvetica, sans-serif;
                            color: #000;
                        }

                        body {
                            background: #fff;
                            padding: 12px;
                        }

                        /* ── Contenedor principal con borde grueso exterior ── */
                        .form-outer {
                            width: 760px;
                            margin-left: 10px;   /* valores correctos para alineacion del borde izquierdo general de la tabla con la plantilla */
                            margin-right: auto;
                            border: 2px solid #000;
                        }

                        /* ── Todas las filas comparten borde fino ── */
                        .row {
                            display: flex;
                            border-top: 1px solid #000;
                            min-height: 26px;
                        }

                        .row:first-child {
                            border-top: none;
                        }

                        .cell {
                            padding: 4px 7px;
                            font-size: 10px;
                            line-height: 1.45;
                            vertical-align: top;
                            flex-shrink: 0;
                        }

                        .cell + .cell {
                            border-left: 1px solid #000;
                        }

                        .cell-full { width: 100%; }
                        .cell-45   { width: 45%; }
                        .cell-55   { width: 55%; }
                        .cell-50   { width: 50%; }
                        .cell-30   { width: 30%; }
                        .cell-70   { width: 70%; }
                        .cell-65   { width: 65%; }
                        .cell-35   { width: 35%; }

                        /* Fila de sección azul */
                        .section-header {
                            background: #0070a8;
                            color: #fff;
                            text-align: center;
                            font-weight: bold;
                            font-size: 10.5px;
                            padding: 4px 8px;
                            border-top: 1px solid #000;
                            line-height: 1.4;
                        }

                        .section-header span {
                            display: block;
                            font-weight: normal;
                            font-size: 12px;
                            color: #fff;
                        }

                        strong {
                            font-weight: bold;
                        }

                        /* Underline para campos de texto */
                        .underline {
                            border-bottom: 1px solid #000;
                            display: block;
                            min-height: 14px;
                            margin-top: 3px;
                        }

                        /* Checkboxes cuadrados, visibles */
                        input[type="checkbox"] {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 10px;
                            height: 10px;
                            border: 1px solid #000;
                            background: #fff;
                            display: inline-block;
                            vertical-align: middle;
                            margin: 0 1px;
                            flex-shrink: 0;
                        }

                        input[type="checkbox"]:checked {
                            background: #000;
                        }

                        /* Divisor vertical interno dentro de una celda */
                        .sub-row {
                            display: flex;
                            width: 100%;
                        }

                        .sub-cell {
                            padding: 4px 6px;
                            font-size: 10px;
                            line-height: 1.45;
                        }

                        .sub-cell + .sub-cell {
                            border-left: 1px solid #000;
                        }

                        /* Altura de filas compactas */
                        .h-auto { min-height: 26px; }
                        .h-tall  { min-height: 52px; }
                        .h-dep   { min-height: 70px; }

                        .label-block {
                            display: block;
                            margin-bottom: 2px;
                        }
                    </style>
                    </head>
                    <body>

                    <div class="form-outer">

                        <!-- Fecha -->
                        <div class="row h-auto" style="border-top:none;">
                            <div class="cell cell-full" style="min-height:28px;">
                                <strong>Fecha de diligenciamiento:</strong> ${localDate}
                            </div>
                        </div>

                        <!-- Sección Datos Personales -->
                        <div class="section-header">INFORMACIÓN GENERAL – DATOS PERSONALES</div>

                        <!-- Nombre + Documento -->
                        <div class="row">
                            <div class="cell cell-45" style="min-height:62px;">
                                <strong>Nombre Completo:</strong> ${sNombre}
                                <span class="underline" style="margin-top:10px;"></span>
                                <span class="underline" style="margin-top:10px;"></span>
                            </div>
                            <div class="cell cell-55" style="min-height:62px;">
                                <strong>Documento de Identificación</strong>
                                <strong>
                                    &nbsp; C.C. <input type="checkbox" ${sDocCardType === "CC" ? "checked" : ""}>
                                    &nbsp; C.E. <input type="checkbox" ${sDocCardType === "CE" ? "checked" : ""}>
                                </strong>
                                <br>
                                <strong>No.</strong> ${sCedula}
                                <br>
                                <div style="display:flex; align-items:center; gap:4px; margin-top:4px;">
                                    <strong style="white-space:nowrap; font-size:10px;">Fecha de expedición del documento:</strong> ${sFechaExpedicion}
                                </div>
                            </div>
                        </div>

                        <!-- Cargo -->
                        <div class="row h-tall">
                            <div class="cell cell-full">
                                <strong>Cargo desempeñado dentro de la Compañía:</strong> ${sCargo}
                                <span class="underline" style="margin-top:16px;"></span>
                            </div>
                        </div>

                        <!-- Ciudad / País + Jefe inmediato -->
                        <div class="row">
                            <div class="cell cell-45" style="padding:0;">
                                <div class="sub-row" style="min-height:26px;">
                                    <div class="sub-cell" style="width:62%; padding:4px 7px;"><strong>Ciudad:</strong> ${sCiudadWork}</div>
                                    <div class="sub-cell" style="width:38%; padding:4px 7px;"><strong>País:</strong> ${sPais}</div>
                                </div>
                            </div>
                            <div class="cell cell-55">
                                <strong>Nombre del jefe inmediato:</strong> ${sJefeNombre}
                            </div>
                        </div>

                        <div style="display:flex; border-top:1px solid #000;">
    
                            <!-- Columna izquierda -->
                            <div style="width:45%;">
                                <div class="row">
                                    <div class="cell cell-full">
                                        <strong>Dirección de residencia:</strong> ${sDireccion}
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="cell cell-full">
                                        <strong>Teléfono:</strong> ${sTelefono}
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="cell cell-full">
                                        <strong>Correo Electrónico:</strong> ${sEmail}
                                    </div>
                                </div>
                            </div>

                            <!-- Columna derecha -->
                            <div class="cell" style="
                                width:55%;
                                border-left:1px solid #000;
                            ">
                                <strong>Planta a la que pertenece:</strong>
                            </div>

                        </div>

                        <!-- Fecha nacimiento + Estado Civil -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Fecha de nacimiento:</strong> ${sFechaNacimiento}</div>
                            <div class="cell cell-55"><strong>Estado Civil:</strong> ${sEstadoCivil}</div>
                        </div>

                        <!-- Nacionalidad + RH -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Nacionalidad:</strong> ${sNacional}</div>
                            <div class="cell cell-55"><strong>RH y grupo sanguíneo:</strong> ${sGrupoSangre}</div>
                        </div>

                        <!-- Sexo + Dependientes -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Sexo:</strong> ${sSexo}</div>
                            <div class="cell cell-55" style="padding:0;">
                                <div class="sub-row" style="align-items:center; min-height:26px;">
                                    <div class="sub-cell" style="width:40%; padding:4px 7px; white-space:nowrap;">
                                        <strong>Dependientes:</strong>
                                    </div>
                                    <div class="sub-cell" style="padding:4px 7px;">
                                        SI <input type="checkbox">
                                        &nbsp;&nbsp;
                                        NO <input type="checkbox">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sección Dependientes -->
                        <div class="section-header">
                            INFORMACIÓN DEPENDIENTES
                            <span>Si este espacio no es suficiente, por favor adicione la información en documento aparte</span>
                        </div>

                        <!-- Macro: cada dependiente -->

                        <!-- DEP 1 -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>
                        <div class="row" style="border-top:none;">
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Tipo de vínculo:</strong>
                                <br><br>
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                <strong>
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>No.</strong>
                                <br><br>
                                <strong>Fecha de expedición del documento:</strong>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-50"><strong>Fecha de nacimiento:</strong></div>
                            <div class="cell cell-50"><strong>Teléfono de contacto</strong></div>
                        </div>

                        <!-- DEP 2 -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>
                        <div class="row" style="border-top:none;">
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Tipo de vínculo:</strong>
                                <br><br>
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                <strong>
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>No.</strong>
                                <br><br>
                                <strong>Fecha de expedición del documento:</strong>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-50"><strong>Fecha de nacimiento:</strong></div>
                            <div class="cell cell-50"><strong>Teléfono de contacto</strong></div>
                        </div>

                        <!-- DEP 3 -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>
                        <div class="row" style="border-top:none;">
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Tipo de vínculo:</strong>
                                <br><br>
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                <strong>
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>
                                <br><br>
                                <strong>No.</strong>
                                <br><br>
                                <strong>Fecha de expedición del documento:</strong>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-50"><strong>Fecha de nacimiento:</strong></div>
                            <div class="cell cell-50"><strong>Teléfono de contacto</strong></div>
                        </div>

                        <!-- DEP 4 (parcial) -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>
                        <div class="row" style="border-top:none;">
                            <div class="cell cell-50" style="padding:6px 7px; min-height:26px;">
                                <strong>Tipo de vínculo:</strong>
                            </div>
                            <div class="cell cell-50" style="padding:6px 7px; min-height:26px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <strong>
                                <input type="checkbox">
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>
                            </div>
                        </div>

                    </div>

                    </body>
                    </html>
                `;

                const htmlPagina2 = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

                    <style>
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                            font-family: Arial, Helvetica, sans-serif;
                            color: #000;
                        }

                        body {
                            background: #fff;
                            padding: 12px;
                        }

                        .form-outer {
                            width: 760px;
                            margin-left: 10px;
                            margin-right: auto;
                            border: 2px solid #000;
                        }

                        .row {
                            display: flex;
                            border-top: 1px solid #000;
                            min-height: 26px;
                        }

                        .row:first-child {
                            border-top: none;
                        }

                        .cell {
                            padding: 4px 7px;
                            font-size: 10px;
                            line-height: 1.45;
                            vertical-align: top;
                            flex-shrink: 0;
                        }

                        .cell + .cell {
                            border-left: 1px solid #000;
                        }

                        .cell-full { width: 100%; }
                        .cell-50   { width: 50%; }
                        .cell-35   { width: 35%; }
                        .cell-65   { width: 65%; }

                        .section-header {
                            background: #0070a8;
                            color: #fff;
                            text-align: center;
                            font-weight: bold;
                            font-size: 10.5px;
                            padding: 4px 8px;
                            border-top: 1px solid #000;
                            line-height: 1.4;
                        }

                        .section-header span {
                            display: block;
                            font-weight: normal;
                            font-size: 12px;
                            color: #fff;
                        }

                        strong {
                            font-weight: bold;
                        }

                        .underline {
                            border-bottom: 1px solid #000;
                            display: block;
                            min-height: 14px;
                            margin-top: 3px;
                        }

                        input[type="checkbox"] {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 10px;
                            height: 10px;
                            border: 1px solid #000;
                            background: #fff;
                            display: inline-block;
                            vertical-align: middle;
                            margin: 0 1px;
                            flex-shrink: 0;
                        }

                        input[type="checkbox"]:checked {
                            background: #000;
                        }

                        .h-dep {
                            min-height: 70px;
                        }
                    </style>
                    </head>

                    <body>

                    <div class="form-outer">

                        <!-- RESTO DEPENDIENTE 4 -->
                        <!-- CONTINUACIÓN DEPENDIENTE 4 -->
                        <div class="row" style="border-top:none;">

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>

                                <br><br>

                                <strong>Cual:</strong>

                            </div>

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">

                                <strong>No.</strong>

                                <br><br>

                                <strong>Fecha de expedición del documento:</strong>

                            </div>

                        </div>

                        <div class="row">
                            <div class="cell cell-50">
                                <strong>Fecha de nacimiento:</strong>
                            </div>

                            <div class="cell cell-50">
                                <strong>Teléfono de contacto</strong>
                            </div>
                        </div>

                        <!-- DEPENDIENTE 5 -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>

                        <div class="row" style="border-top:none;">

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Tipo de vínculo:</strong>

                                <br><br>
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>

                                <br><br>

                                <strong>Cual:</strong>
                            </div>

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>

                                <input type="checkbox">
                                <strong>
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>

                                <br><br>

                                <strong>No.</strong>

                                <br><br>

                                <strong>Fecha de expedición del documento:</strong>
                            </div>

                        </div>

                        <div class="row">
                            <div class="cell cell-50">
                                <strong>Fecha de nacimiento:</strong>
                            </div>

                            <div class="cell cell-50">
                                <strong>Teléfono de contacto</strong>
                            </div>
                        </div>

                        <!-- DEPENDIENTE 6 -->
                        <div class="row">
                            <div class="cell cell-full" style="padding:4px 7px; min-height:32px;">
                                <strong>Nombre y Apellidos:</strong>
                                <span class="underline" style="margin-top:6px;"></span>
                            </div>
                        </div>

                        <div class="row" style="border-top:none;">

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Tipo de vínculo:</strong>

                                <br><br>
                                <strong>
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                </strong>

                                <br><br>

                                <strong>Cual:</strong>
                            </div>

                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>

                                <input type="checkbox">
                                <strong>
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                                </strong>
                                
                                <br><br>

                                <strong>No.</strong>

                                <br><br>

                                <strong>Fecha de expedición del documento:</strong>
                            </div>

                        </div>

                        <div class="row">
                            <div class="cell cell-50">
                                <strong>Fecha de nacimiento:</strong>
                            </div>

                            <div class="cell cell-50">
                                <strong>Teléfono de contacto</strong>
                            </div>
                        </div>

                        </div> <!-- ← CIERRE FORM-OUTER -->


                        <!-- TEXTO SUELTO -->
                        <div style="
                            font-size:12px;
                            margin-top:20px;
                            margin-bottom:12px;
                            font-weight:bold;
                            margin-left:10px;
                        ">
                            Si tiene más dependientes, por favor allegue la información solicitada en hoja aparte.
                        </div>


                        <!-- NUEVA TABLA -->
                        <div class="form-outer">

                            <!-- INFORMACIÓN DE PAGOS -->
                            <div class="section-header">
                                INFORMACIÓN DE PAGOS
                            </div>

                            <div class="row">

                                <div class="cell" style="width:55%;">
                                    <strong>Entidad Bancaria:</strong>
                                </div>

                            <div class="cell" style="width:45%;">

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:35px;
                                ">

                                    <div>
                                        <strong>Ahorros</strong>
                                        <input type="checkbox">
                                    </div>

                                    <div>
                                        <strong>Corriente</strong>
                                        <input type="checkbox">
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div class="row">
                            <div class="cell cell-full">
                                <strong>No. De Cuenta:</strong>
                            </div>
                        </div>

                        <!-- INFORMACIÓN DE HUELLA -->

                        <div class="section-header">
                            INFORMACIÓN DE HUELLA
                        </div>

                        <div class="row" style="min-height:150px;">

                            <div class="cell" style="
                                width:22%;
                                display:flex;
                                align-items:center;
                                font-weight:bold;
                                padding-right:0;
                            ">
                                Huella Dactilar:
                            </div>

                            <div class="cell" style="
                                width:78%;
                                border-left:none;
                                display:flex;
                                flex-direction:column;
                                align-items:flex-start;
                                justify-content:center;
                                padding-left:0;
                            ">

                                <div style="
                                    width:95px;
                                    height:95px;
                                    border:1.5px solid #f4a460;
                                    margin-bottom:8px;
                                "></div>

                                <strong style="margin-left:6px;">
                                    Índice Derecho
                                </strong>

                            </div>

                        </div>

                        </div> <!-- ← SOLO ESTE cierre de form-outer -->

                        <!-- TEXTO LEGAL -->
                        <div style="
                            width:760px;
                            margin-left:10px;
                            margin-top:20px;
                            margin-bottom:12px;
                            font-size:10px;
                            font-weight:normal;
                        ">

                            Dando cumplimiento a lo dispuesto en la Ley 1582 de 2012,
                            "Por la cual se dictan disposiciones generales para la protección
                            de datos personales" y de conformidad con lo señalado en el
                            Decreto 1377 de 2013 y demás normas aplicables al Régimen de
                            protección de datos personales en Colombia, con la firma de este
                            documento manifiesto que he sido informado por <strong>DIACO S.A.</strong>, de lo siguiente:

                            <br><br>

                            <strong>1.</strong>
                            &nbsp;
                            <strong>DIACO S.A.</strong> actuará como responsable del Tratamiento de datos personales
                            de los cuales soy titular y que, conjunta o separadamente podrá recolectar,
                            usar y tratar mis datos personales conforme a la Política de Tratamiento de
                            Datos Personales de <strong>DIACO S.A.</strong> disponible en la página web de la Compañía.

                            <br><br>

                            <strong>2.</strong>
                            &nbsp;
                            Que me ha sido informada la(s) finalidad(es) de la recolección de los datos personales,
                            en razón al proceso de selección y/o la relación laboral, las cuales son las siguientes:

                        </div>

                        <!-- CAJA FINAL -->
                        <div style="
                            width:730px;
                            margin-left:28px;
                            margin-top:10px;
                            border:1px solid #000;
                            font-size:10px;
                            line-height:1.45;
                        ">

                            <!-- FILA 1 -->
                            <div style="
                                padding:6px 8px;
                                border-bottom:1px solid #000;
                            ">
                                Efectuar todas las gestiones necesarias para el desarrollo del objeto Social de <strong>DIACO S.A.</strong>,
                                en todo lo relacionado con el cumplimiento del objeto del contrato celebrado entre la Compañía
                                y el Titular de la información.
                            </div>

                            <!-- FILA 2 -->
                            <div style="
                                padding:6px 8px;
                            ">
                                Incluir la información del colaborador al Sistema físico y digital de Información de la Compañía.
                            </div>

                        </div>

                    </div>

                    </body>
                    </html>
                `;

                const htmlPagina3 = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

                    <style>
                        *{
                            box-sizing:border-box;
                            margin:0;
                            padding:0;
                            font-family:Arial, Helvetica, sans-serif;
                            color:#000;
                        }

                        body{
                            background:#fff;
                            padding:12px;
                        }

                        .form-outer{
                            width:760px;
                            margin-left:10px;
                            margin-right:auto;
                            border:2px solid #000;
                        }

                        .row{
                            display:flex;
                            border-top:1px solid #000;
                            min-height:26px;
                        }

                        .row:first-child{
                            border-top:none;
                        }

                        .cell{
                            padding:4px 7px;
                            font-size:10px;
                            line-height:1.45;
                            vertical-align:top;
                            flex-shrink:0;
                        }

                        .cell + .cell{
                            border-left:1px solid #000;
                        }

                        .cell-full{ width:100%; }
                        .cell-50{ width:50%; }
                        .cell-65{ width:65%; }
                        .cell-35{ width:35%; }

                        strong{
                            font-weight:bold;
                        }

                        input[type="checkbox"]{
                            -webkit-appearance:none;
                            appearance:none;
                            width:10px;
                            height:10px;
                            border:1px solid #000;
                            background:#fff;
                            display:inline-block;
                            vertical-align:middle;
                            margin:0 1px;
                            flex-shrink:0;
                        }

                        input[type="checkbox"]:checked{
                            background:#000;
                        }

                    </style>
                    </head>

                    <body>

                        <!-- CONTINUACIÓN FINALIDADES -->
                        <div style="
                            width:730px;
                            margin-left:28px;
                            border:1px solid #000;
                            font-size:10px;
                            line-height:1.45;
                        ">

                            <!-- FILA VACÍA SUPERIOR -->
                            <div style="
                                height:18px;
                                border-bottom:1px solid #000;
                            "></div>

                            <div style="
                                padding:6px 8px;
                                border-bottom:1px solid #000;
                            ">
                                Incluir la información de Dependientes dentro al Sistema físico y digital de Información de la Compañía.
                            </div>

                            <div style="
                                padding:6px 8px;
                                border-bottom:1px solid #000;
                            ">
                                Incluir información de pagos dentro al Sistema físico y digital de Información de la Compañía.
                            </div>

                            <div style="
                                padding:6px 8px;
                                border-bottom:1px solid #000;
                            ">
                                Utilizar la imagen del titular de la información (reproducción videográfica – foto impresión)
                                dentro de las campañas corporativas y los procesos internos de <strong>DIACO S.A.</strong>
                            </div>

                            <div style="
                                padding:6px 8px;
                                border-bottom:1px solid #000;
                            ">
                                Gestionar solicitudes, quejas o reclamos promovidos por el Titular de la Información
                                o por autoridades judiciales mediante orden judicial.
                            </div>

                            <div style="
                                padding:6px 8px;
                            ">
                                Compartir, en caso de ser necesario, sus datos personales, incluyendo en este punto,
                                la transferencia y transmisión de sus datos personales a terceros países con aliados
                                estratégicos para los fines relacionados con la transacción comercial.
                            </div>

                        </div>

                        <!-- TEXTO LEGAL -->
                        <div style="
                            width:760px;
                            margin-left:10px;
                            margin-top:16px;
                            font-size:10px;
                            line-height:1.45;
                        ">

                            <strong>3.</strong>
                            &nbsp;
                            Que la Política de Datos Personales y Privacidad de <strong>DIACO S.A.</strong>,
                            puede ser consultada en la página web

                            <br><br>

                            <strong>4.</strong>
                            &nbsp;
                            Es de carácter facultativo o voluntario responder pregunta que versen sobre Datos Sensibles
                            o sobre menores de edad.

                            <br><br>

                            <strong>5.</strong>
                            &nbsp;
                            Mis derechos como titular de los datos son los previstos en la Constitución y la ley,
                            especialmente el derecho a conocer, actualizar, rectificar y suprimir mi información personal,
                            así como el derecho a revocar el consentimiento otorgado para el tratamiento de datos personales.

                            <br><br>

                            <strong>6.</strong>
                            &nbsp;
                            Los derechos mencionados anteriormente, pueden ser ejercidos a través de petición enviada al correo
                            electrónico de <strong>DIACO S.A.</strong>,
                            <a href="mailto:diaco@diaco.com.co"
                                style="color:#00a2ff; text-decoration:underline;">
                                diaco@diaco.com.co
                            </a>
                            y observando la Política de Tratamiento de Datos Personales de <strong>DIACO S.A.</strong>

                            <br><br>

                            <strong>7.</strong>
                            &nbsp;
                            Mediante el correo electrónico de <strong>DIACO S.A.</strong>,
                            <a href="mailto:diaco@diaco.com.co"
                                style="color:#00a2ff; text-decoration:underline;">
                                diaco@diaco.com.co
                            </a>
                            podré radicar cualquier tipo de requerimiento relacionado con el tratamiento de mis datos personales.

                            <br><br>

                            <strong>8.</strong>
                            &nbsp;
                            <strong>DIACO S.A.</strong>
                            garantizará la confidencialidad, libertad, seguridad, veracidad, transparencia,
                            acceso y circulación restringida de mis datos y se reservará el derecho de modificar
                            su Política de Tratamiento de Datos Personales en cualquier momento. Cualquier cambio
                            será informado y publicado oportunamente en la página web.

                            <br><br>

                            <strong>9.</strong>
                            &nbsp;
                            Teniendo en cuenta lo anterior, autorizo de manera voluntaria, previa, explícita,
                            informada e inequívoca a <strong>DIACO S.A.</strong>,
                            para tratar mis datos personales de acuerdo con su Política de Tratamiento de Datos Personales
                            para los fines relacionados con su objeto y en especial para fines legales, contractuales,
                            misionales descritos en la Política de Tratamiento de Datos Personales de <strong>DIACO S.A.</strong>

                            <br><br>

                            <strong>10.</strong>
                            &nbsp;
                            La información obtenida para el Tratamiento de mis datos personales la he suministrado
                            de forma voluntaria y es verídica.

                        </div>

                        <!-- TABLA FIRMA -->
                        <div class="form-outer" style="margin-top:24px;">

                            <!-- NOMBRE -->
                            <div class="row">

                                <div class="cell" style="width:38%;">
                                        <strong>Nombre del Representante legal o Persona Titular de los datos:</strong>
                                </div>

                                <div class="cell" style="width:62%;"> ${sNombre}</div>

                            </div>

                            <!-- FIRMA -->
                            <div class="row" style="min-height:95px;">

                                <div class="cell cell-full">
                                    <strong>Firma:</strong>
                                </div>

                            </div>

                            <!-- DOCUMENTO -->
                            <div class="row">

                                <div class="cell" style="width:55%;">
                                    <strong>Documento de Identificación:</strong>
                                    <strong>
                                        &nbsp;
                                        C.C. <input type="checkbox" ${sDocCardType === "CC" ? "checked" : ""}>
                                        &nbsp;
                                        C.E. <input type="checkbox" ${sDocCardType === "CE" ? "checked" : ""}>
                                        &nbsp;
                                        T.I  <input type="checkbox" ${sDocCardType === "TI" ? "checked" : ""}>
                                        &nbsp;
                                        R.C. <input type="checkbox" ${sDocCardType === "RC" ? "checked" : ""}>
                                    </strong>

                                </div>

                                <div class="cell" style="width:45%;">
                                    <strong>No. De Documento:</strong> ${sCedula}
                                </div>

                            </div>

                        </div>

                    </body>
                    </html>
                `;

                const contentBlocks = [htmlPagina1, htmlPagina2, htmlPagina3];

                // ── PDF ───────────────────────────────────────────────────────
                const existingPdfBytes = await fetch("pdf/plantillaDatosPersonales.pdf")
                    .then(res => res.arrayBuffer());

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width           = "794px";
                    div.style.height          = "1400px";
                    div.style.padding         = "10px";
                    div.style.backgroundColor = "transparent";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.style.left            = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                    const canvas  = await html2canvasRef(div, { scale: 2, useCORS: true, backgroundColor: null});
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);

                    // Dibujar plantilla
                    newPage.drawPage(templatePageImage);

                    // Contenido HTML encima
                    const imgWidth  = width * 0.88; //Dejar asi 
                    const imgHeight = (img.height * imgWidth) / img.width;

                    newPage.drawImage(img, {
                    x: (width - imgWidth) / 2 -10,
                    y: height - imgHeight - 130,
                    width: imgWidth,
                    height: imgHeight
                });

                if (pageIndex === 2) {

                    const linkUrl = "https://www.diaco.com.co/";

                    // Texto real para poner el enlace
                    newPage.drawText("https://www.diaco.com.co/", {
                        x: 373,
                        y: 511,
                        size: 7,
                        color: PDFLibRef.rgb(0, 0.64, 1)
                    });

                    // LINK REAL
                    const linkAnnotation = pdfDoc.context.register(
                        pdfDoc.context.obj({
                            Type: 'Annot',
                            Subtype: 'Link',
                            Rect: [355, 312, 515, 325],
                            Border: [0, 0, 0],
                            A: pdfDoc.context.obj({
                                S: 'URI',
                                URI: PDFLibRef.PDFString.of(linkUrl)
                            })
                        })
                    );

                    const annots = pdfDoc.context.obj([linkAnnotation]);

                    newPage.node.set(
                        PDFLibRef.PDFName.of('Annots'),
                        annots
                    );
                }

                }
                pdfDoc.removePage(0);
                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Datos_Personales.pdf`;
                const blob     = new Blob([pdfBytes], { type: "application/pdf" });
                const link     = document.createElement("a");
                link.href      = URL.createObjectURL(blob);
                link.download  = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
            }

            if (!sButtonId.includes("wordDataInfo")) {
                MessageToast.show(
                    aUsers.length > 1
                        ? `${aUsers.length} documentos generados correctamente.`
                        : "Documento generado correctamente."
                );
            }

        } catch (error) {
            console.error("Error generando Datos Personales:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    // ─── Word con JSZip + plantilla ──────────────────────────────────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Datos_Personales.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Datos_Personales.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]": data.sNombre,
            "[[Cedula]]": data.sCedula
        };

        const targets = [
            "word/document.xml",
            "word/header1.xml",
            "word/header2.xml",
            "word/footer1.xml",
            "word/footer2.xml"
        ];

        for (const path of targets) {
            if (zip.files[path]) {
                let xml = await zip.files[path].async("string");
                for (const [key, value] of Object.entries(variables)) {
                    xml = xml.split(key).join(_escXml(value));
                    const frag = new RegExp(
                        "\\[\\[" +
                        key.slice(2, -2).split("").map(c => c + "(?:<[^>]*>)*").join("") +
                        "\\]\\]", "g"
                    );
                    xml = xml.replace(frag, _escXml(value));
                }
                zip.file(path, xml);
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href  = URL.createObjectURL(blob);
        link.download = `${data.firstName}_${data.lastName}_Datos_Personales.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        MessageToast.show("Documento Word generado correctamente.");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function _escXml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function _ensureJSZip() {
        if (window.JSZip) return Promise.resolve(window.JSZip);
        return new Promise((resolve, reject) => {
            const script   = document.createElement("script");
            script.src     = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload  = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    return { onDownloadPDFDatosPersonales };
});