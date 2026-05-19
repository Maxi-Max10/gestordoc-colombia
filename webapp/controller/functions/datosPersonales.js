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

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre = `${user.firstName} ${user.lastName}`;
                const sCedula = user.nationalId || "";

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
                                <strong>Fecha de diligenciamiento:</strong>
                            </div>
                        </div>

                        <!-- Sección Datos Personales -->
                        <div class="section-header">INFORMACIÓN GENERAL – DATOS PERSONALES</div>

                        <!-- Nombre + Documento -->
                        <div class="row">
                            <div class="cell cell-45" style="min-height:62px;">
                                <strong>Nombre Completo:</strong>
                                <span class="underline" style="margin-top:10px;"></span>
                                <span class="underline" style="margin-top:10px;"></span>
                            </div>
                            <div class="cell cell-55" style="min-height:62px;">
                                <strong>Documento de Identificación</strong>
                                &nbsp; C.C. <input type="checkbox">
                                &nbsp; C.E. <input type="checkbox">
                                <br>
                                <strong>No.</strong>
                                <br>
                                <div style="display:flex; align-items:center; gap:4px; margin-top:4px;">
                                    <strong style="white-space:nowrap; font-size:10px;">Fecha de expedición del documento:</strong>
                                    <span class="underline" style="flex:1; margin-top:0;"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Cargo -->
                        <div class="row h-tall">
                            <div class="cell cell-full">
                                <strong>Cargo desempeñado dentro de la Compañía:</strong>
                                <span class="underline" style="margin-top:16px;"></span>
                            </div>
                        </div>

                        <!-- Ciudad / País + Jefe inmediato -->
                        <div class="row">
                            <div class="cell cell-45" style="padding:0;">
                                <div class="sub-row" style="min-height:26px;">
                                    <div class="sub-cell" style="width:62%; padding:4px 7px;"><strong>Ciudad</strong></div>
                                    <div class="sub-cell" style="width:38%; padding:4px 7px;"><strong>País</strong></div>
                                </div>
                            </div>
                            <div class="cell cell-55">
                                <strong>Nombre del jefe inmediato:</strong>
                            </div>
                        </div>

                        <!-- Dirección + Planta -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Dirección de residencia:</strong></div>
                            <div class="cell cell-55"><strong>Planta a la que pertenece:</strong></div>
                        </div>

                        <!-- Teléfono -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Teléfono:</strong></div>
                            <div class="cell cell-55"></div>
                        </div>

                        <!-- Correo -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Correo Electrónico:</strong></div>
                            <div class="cell cell-55"></div>
                        </div>

                        <!-- Fecha nacimiento + Estado Civil -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Fecha de nacimiento:</strong></div>
                            <div class="cell cell-55"><strong>Estado Civil:</strong></div>
                        </div>

                        <!-- Nacionalidad + RH -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Nacionalidad:</strong></div>
                            <div class="cell cell-55"><strong>RH y grupo sanguíneo:</strong></div>
                        </div>

                        <!-- Sexo + Dependientes -->
                        <div class="row">
                            <div class="cell cell-45"><strong>Sexo:</strong></div>
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
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
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
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
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
                                Cónyuge <input type="checkbox">
                                Hijo <input type="checkbox">
                                Padre <input type="checkbox">
                                Madre <input type="checkbox">
                                Otro <input type="checkbox">
                                <br><br>
                                <strong>Cual:</strong>
                            </div>
                            <div class="cell cell-50 h-dep" style="padding:6px 7px;">
                                <strong>Documento de Identificación C.C.</strong>
                                <input type="checkbox">
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
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
                                <input type="checkbox">
                                C.E. <input type="checkbox">
                                TI <input type="checkbox">
                                RC <input type="checkbox">
                            </div>
                        </div>

                    </div>

                    </body>
                    </html>
                `;

                const contentBlocks = [htmlPagina1];

                // ── PDF ───────────────────────────────────────────────────────
                const existingPdfBytes = await fetch("pdf/plantillaDatosPersonales.pdf")
                    .then(res => res.arrayBuffer());

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (const blockHtml of contentBlocks) {
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