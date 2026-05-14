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
                        *{
                            box-sizing:border-box;
                            margin:0;
                            padding:0;
                            font-family:Arial, Helvetica, sans-serif;
                            color:#000;
                        }

                        body{
                            background:transparent;
                            padding:0;
                            margin:0;
                        }

                        .container{
                            width:794px;
                            margin:auto;
                            background:transparent;
                            padding:8px;
                            border:none;
                        }

                        table{
                            width:100%;
                            border-collapse:collapse;
                        }

                        td{
                            border:1px solid #000;
                            padding:6px 8px;
                            font-size:10px;
                            vertical-align:top;
                            line-height:1.4;
                        }

                        .top-header td{
                            height:58px;
                        }

                        .logo{
                            width:140px;
                            text-align:center;
                            vertical-align:middle;
                        }

                        .logo h1{
                            font-size:28px;
                            color:#5f5f5f;
                            letter-spacing:1px;
                        }

                        .title{
                            text-align:center;
                            font-weight:bold;
                            font-size:10px;
                            line-height:1.25;
                        }

                        .restricted{
                            width:120px;
                            text-align:center;
                            font-weight:bold;
                            font-size:10px;
                        }

                        .section{
                            background:#0070a8;
                            color:#fff;
                            text-align:center;
                            font-weight:bold;
                            font-size:10px;
                            padding:3px;
                        }

                        .small-text{
                            font-size:8px;
                        }

                        .field{
                            height:22px;
                        }

                        .large-field{
                            height:55px;
                        }

                        .line{
                            border-bottom:1px solid #000;
                            width:100%;
                            height:20px;
                            margin-top:4px;
                        }

                        input[type="checkbox"]{
                            width:9px;
                            height:9px;
                            margin-left:2px;
                            transform:translateY(1px);
                        }

                        .dependiente td{
                            height:34px;
                        }

                        .spacer{
                            height:4px;
                        }

                        strong{
                            font-weight:bold;
                        }
                    </style>
                    </head>

                    <body>

                    <div class="container">

                    <!-- FECHA -->
                        <table style="margin-bottom:0;">
                            <tr>
                                <td style="
                                    border:1px solid #000;
                                    font-size:10px;
                                    padding:6px 8px;
                                    height:28px;
                                ">
                                    <strong>Fecha de diligenciamiento:</strong>
                                </td>
                            </tr>
                        </table>
                    <!-- TITULO -->
                        <table style="margin-top:-1px;">
                        <tr>
                            <td class="section">
                            INFORMACIÓN GENERAL – DATOS PERSONALES
                            </td>
                        </tr>
                        </table>

                        <!-- DATOS PERSONALES -->
                        <table style="margin-top:-1px;">

                        <tr>
                            <td width="45%">
                            <strong>Nombre Completo:</strong>
                            <div class="line"></div>
                            </td>

                            <td width="55%">
                            <strong>Documento de Identificación</strong>

                            C.C.
                            <input type="checkbox" class="checkbox">

                            C.E.
                            <input type="checkbox" class="checkbox">

                            <br>

                            <strong>No.</strong>

                            <br>

                            <div style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                                margin-top:4px;
                            ">
                                <strong style="white-space:nowrap;">
                                    Fecha de expedición del documento:
                                </strong>

                                <div class="line" style="
                                    flex:1;
                                    margin-top:0;
                                    height:14px;
                                "></div>
                            </div>
                            </td>
                            
                        </tr>

                        <tr>
                            <td colspan="2" class="large-field">
                                <strong>Cargo desempeñado dentro de la Compañía:</strong>

                                <div class="line" style="
                                    margin-top:8px;
                                    height:18px;
                                "></div>
                            </td>
                        </tr>

                        <td>
                            <table style="width:100%; border-collapse:collapse;">
                                <tr style="height:28px;">
                                    <td style="
                                        border:none;
                                        border-right:1px solid #000;
                                        width:70%;
                                        padding:4px 6px 4px 0;
                                    ">
                                        <strong>Ciudad</strong>
                                    </td>

                                    <td style="
                                        border:none;
                                        width:30%;
                                        padding:4px 0 4px 6px;
                                        text-align:left;
                                    ">
                                        <strong>País</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>

                        <td style="border-bottom:none;">
                            <strong>Nombre del jefe inmediato:</strong>
                        </td>

                    </tr>

                        <tr>
                            <td>
                            <strong>Dirección de residencia:</strong>
                            </td>

                            <td style="border-top:none; border-bottom:none;">
                                <strong>Planta a la que pertenece:</strong>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <strong>Teléfono:</strong>
                            </td>

                            <td style="border-top:none; border-bottom:none;"></td>
                        </tr>

                        <tr>
                            <td>
                            <strong>Correo Electrónico:</strong>
                            </td>

                            <td style="border-top:none; border-bottom:none;"></td>
                        </tr>

                        <tr>
                            <td>
                            <strong>Fecha de nacimiento:</strong>
                            </td>

                            <td>
                            <strong>Estado Civil:</strong>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <strong>Nacionalidad:</strong>
                            </td>

                            <td>
                            <strong>RH y grupo sanguíneo:</strong>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <strong>Sexo:</strong>
                            </td>

                            <td>
                                <table style="width:100%; border-collapse:collapse;">
                                    <tr>
                                        <td style="
                                            border:none;
                                            border-right:1px solid #000;
                                            width:10%;
                                            padding:0 6px 0 0;
                                        ">
                                            <strong>Dependientes</strong>
                                        </td>

                                        <td style="
                                            border:none;
                                            width:45%;
                                            padding:0 0 0 6px;
                                            white-space:nowrap;
                                        ">
                                            SI <input type="checkbox" class="checkbox">

                                            &nbsp;&nbsp;

                                            NO <input type="checkbox" class="checkbox">
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        </table >

                    <!-- DEPENDIENTES -->
                        <table style="margin-top:-1px;">
                        <tr>
                            <td class="section">
                            INFORMACIÓN DEPENDIENTES
                            <br>
                            <span class="small-text" style="color:#fff;">
                                Si este espacio no es suficiente, por favor adicione la información en documento aparte
                            </span>
                            </td>
                        </tr>
                        </table>

                        <table class="dependiente" style="margin-top:-1px;">

                            <!-- DEPENDIENTE 1 -->
                            <tr>
                                <tr>
                                    <td colspan="2" style="padding:0;">

                                        <!-- FILA NOMBRE -->
                                        <div style="
                                            border-bottom:1px solid #000;
                                            padding:6px 8px;
                                        ">
                                            <strong>Nombre y Apellidos:</strong>
                                        </div>

                                        <!-- CONTENIDO DIVIDIDO -->
                                        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                                            <colgroup><col style="width:calc(50% - 0.5px);"><col style="width:calc(50% + 0.5px);"></colgroup>
                                            <tr>

                                                <!-- IZQUIERDA -->
                                                <td style="
                                                    border:none;
                                                    border-right:1px solid #000;
                                                    padding:8px;
                                                    vertical-align:top;
                                                ">
                                                    <strong>Tipo de vínculo:</strong>

                                                    <br><br>

                                                    Cónyuge <input type="checkbox">
                                                    Hijo <input type="checkbox">
                                                    Padre <input type="checkbox">
                                                    Madre <input type="checkbox">
                                                    Otro <input type="checkbox">

                                                    <br><br>

                                                    <strong>Cual:</strong>
                                                </td>

                                                <!-- DERECHA -->
                                                <td style="
                                                    width:50%;
                                                    border:none;
                                                    padding:8px;
                                                    vertical-align:top;
                                                ">
                                                    <strong>Documento de Identificación C.C.</strong>
                                                    <input type="checkbox">

                                                    C.E.
                                                    <input type="checkbox">

                                                    TI
                                                    <input type="checkbox">

                                                    RC
                                                    <input type="checkbox">

                                                    <br><br>

                                                    <strong>No.</strong>

                                                    <br><br>

                                                    <strong>Fecha de expedición del documento:</strong>
                                                </td>

                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </tr>

                            <tr>
                                <td width="50%">
                                    <strong>Fecha de nacimiento:</strong>
                                </td>

                                <td width="50%">
                                    <strong>Teléfono de contacto</strong>
                                </td>
                            </tr>

                            <!-- DEPENDIENTE 2 -->
                            <tr>
                                <td colspan="2" style="padding:0;">
                                    <div style="border-bottom:1px solid #000; padding:6px 8px;">
                                        <strong>Nombre y Apellidos:</strong>
                                    </div>
                                    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                                        <colgroup><col style="width:calc(50% - 0.5px);"><col style="width:calc(50% + 0.5px);"></colgroup>
                                        <tr>
                                            <td style="border:none; border-right:1px solid #000; padding:8px; vertical-align:top;">
                                                <strong>Tipo de vínculo:</strong><br><br>
                                                Cónyuge <input type="checkbox">
                                                Hijo <input type="checkbox">
                                                Padre <input type="checkbox">
                                                Madre <input type="checkbox">
                                                Otro <input type="checkbox">
                                                <br><br>
                                                <strong>Cual:</strong>
                                            </td>
                                            <td style="border:none; padding:8px; vertical-align:top;">
                                                <strong>Documento de Identificación C.C.</strong>
                                                <input type="checkbox"> C.E. <input type="checkbox"> TI <input type="checkbox"> RC <input type="checkbox">
                                                <br><br>
                                                <strong>No.</strong>
                                                <br><br>
                                                <strong>Fecha de expedición del documento:</strong>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td width="50%"><strong>Fecha de nacimiento:</strong></td>
                                <td width="50%"><strong>Teléfono de contacto</strong></td>
                            </tr>

                            <!-- DEPENDIENTE 3 -->
                            <tr>
                                <td colspan="2" style="padding:0;">
                                    <div style="border-bottom:1px solid #000; padding:6px 8px;">
                                        <strong>Nombre y Apellidos:</strong>
                                    </div>
                                    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                                        <colgroup><col style="width:calc(50% - 0.5px);"><col style="width:calc(50% + 0.5px);"></colgroup>
                                        <tr>
                                            <td style="border:none; border-right:1px solid #000; padding:8px; vertical-align:top;">
                                                <strong>Tipo de vínculo:</strong><br><br>
                                                Cónyuge <input type="checkbox">
                                                Hijo <input type="checkbox">
                                                Padre <input type="checkbox">
                                                Madre <input type="checkbox">
                                                Otro <input type="checkbox">
                                                <br><br>
                                                <strong>Cual:</strong>
                                            </td>
                                            <td style="border:none; padding:8px; vertical-align:top;">
                                                <strong>Documento de Identificación C.C.</strong>
                                                <input type="checkbox"> C.E. <input type="checkbox"> TI <input type="checkbox"> RC <input type="checkbox">
                                                <br><br>
                                                <strong>No.</strong>
                                                <br><br>
                                                <strong>Fecha de expedición del documento:</strong>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td width="50%"><strong>Fecha de nacimiento:</strong></td>
                                <td width="50%"><strong>Teléfono de contacto</strong></td>
                            </tr>

                            <!-- DEPENDIENTE 4 -->
                            <tr>
                                <td colspan="2" style="padding:0;">
                                    <div style="border-bottom:1px solid #000; padding:6px 8px;">
                                        <strong>Nombre y Apellidos:</strong>
                                    </div>
                                    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                                        <colgroup><col style="width:calc(50% - 0.5px);"><col style="width:calc(50% + 0.5px);"></colgroup>
                                        <tr>
                                            <td style="border:none; border-right:1px solid #000; padding:8px; vertical-align:top;">
                                                <strong>Tipo de vínculo:</strong><br><br>
                                                Cónyuge <input type="checkbox">
                                                Hijo <input type="checkbox">
                                                Padre <input type="checkbox">
                                                Madre <input type="checkbox">
                                                Otro <input type="checkbox">
                                                <br><br>
                                                <strong>Cual:</strong>
                                            </td>
                                            <td style="border:none; padding:8px; vertical-align:top;">
                                                <strong>Documento de Identificación C.C.</strong>
                                                <input type="checkbox"> C.E. <input type="checkbox"> TI <input type="checkbox"> RC <input type="checkbox">
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>

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