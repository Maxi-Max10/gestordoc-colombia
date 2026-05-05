sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFKitRetiro(oController, sButtonId) {
        try {
            await oController._ensurePdfToolkit();

            const PDFLibRef = window.PDFLib || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas || oController._html2canvasRef;

            if (!PDFLibRef || !html2canvasRef) {
                throw new Error("No se pudieron cargar las bibliotecas PDF/Canvas requeridas.");
            }

            const aUsers = oController.getSelectedUsers();
            if (aUsers.length === 0) {
                MessageToast.show("Seleccione al menos un colaborador.");
                return;
            }

            const localDate = _formatDate(new Date());

            // Pre-cargar el QR como base64 (una sola vez fuera del loop)
            const qrBase64 = await _loadImageAsBase64("img/qr_encuesta_retiro.png");

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre     = `${user.firstName} ${user.lastName}`;
                const sCedula     = user.nationalId || "";
                const sCargo      = user.title || "";
                const sCiudadWork = user.division || "";
                const sSalario    = _formatSalary(user.paycompValue);
                const sIngreso    = user.hireDate   ? _formatDate(new Date(user.hireDate))   : "XXXX";
                const sSalida     = user.empEndDate ? _formatDate(new Date(user.empEndDate)) : "XXXX";
                const sIdentif    = (user.gender === "F") ? "identificada" : "identificado";

                // Ciudad: buscar el campo correcto de SSFF
                const sCity = user.location || user.city || user.addressLine1 || "";

                const htmlRaw = `

<!-- ═══════════════════ PÁGINA 1 — Lista de documentos ═══════════════════ -->
<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 16px 0;">${sCity ? sCity + ", " : ""}${localDate}</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0;">Señor(a):</p>
<p style="font-size:11pt;font-family:Arial,sans-serif;font-weight:bold;margin:0;">${sNombre}</p>
<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 16px 0;">Ciudad</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;margin:0 0 16px 0;">
    Con referencia al retiro de la empresa, a continuación, se relaciona lista documentos
    entregados en la fecha:
</p>

<ol style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 24px 20px;line-height:1.8;">
    <li>Aprobación para envío de documentación, datos de notificación y pago de liquidación final</li>
    <li>Certificación laboral</li>
    <li>Comunicación plazo máximo para realización exámenes de egreso</li>
    <li>Exámenes médicos post – ocupacionales</li>
    <li>Paz y salvo de Seguridad social y parafiscales</li>
    <li>Formato Paz y Salvo</li>
    <li>Encuesta de retiro</li>
</ol>

<img src="${qrBase64}" style="width:130px;height:130px;display:block;margin:0 0 20px 0;" />

<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 60px 0;">Cordialmente,</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;font-weight:bold;
   border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
    Gestión Personas
</p>

<!--PAGEBREAK-->

<!-- ═══════════════════ PÁGINA 2 — Aprobación y datos de notificación ═══════════════════ -->
<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 4px 0;">${sCity ? sCity + ", " : ""}${localDate}</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0;">Señor:</p>
<p style="font-size:11pt;font-family:Arial,sans-serif;font-weight:bold;margin:0;">${sNombre}</p>
<p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 16px 0;">Ciudad</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;margin:0 0 14px 0;">
    Pensando en su comodidad, tenemos disponible para usted las siguientes opciones (Marque X):
</p>

<table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
    <tr>
        <td style="width:24px;vertical-align:top;font-weight:bold;">1.</td>
        <td style="text-align:justify;">
            <strong>Envío de documentos de retiro a correo electrónico:</strong>
            Recibir, revisar y aprobar a través de su correo electrónico, los documentos de su
            paquete de egreso. Una vez dicha documentación de egreso haya sido aprobada por usted,
            deberá imprimirla, firmarla en señal de aceptación y enviarla escaneada al correo
            electrónico <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span><br><br>
            <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
        </td>
    </tr>
</table>

<table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
    <tr>
        <td style="width:24px;vertical-align:top;font-weight:bold;">2.</td>
        <td style="text-align:justify;">
            <strong>Pago de liquidación de prestaciones sociales, por medio de transferencia electrónica:</strong>
            Una vez nómina, haya recibido los documentos de egreso firmados en señal de aceptación,
            realizaremos el pago de su liquidación final de prestaciones sociales dentro de los tres (3)
            días hábiles siguientes, directamente a la cuenta bancaria Davivienda matriculada con la
            empresa, por medio de transferencia electrónica.<br><br>
            <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
        </td>
    </tr>
</table>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;margin:0 0 14px 0;">
    En caso contrario de no aceptación de los puntos 1 o 2, deberá dirigirse personalmente a las
    instalaciones de la empresa, para recibir los documentos o reclamar el pago de su liquidación
    de prestaciones sociales.
</p>

<table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
    <tr>
        <td style="width:24px;vertical-align:top;font-weight:bold;">3.</td>
        <td style="text-align:justify;">
            <strong>Cesantías años anteriores consignadas en Fondo privado:</strong>
            Confirmo que SI ___ NO ___, deseo retirar mis cesantías de años anteriores consignadas
            por esta compañía en mi cuenta del Fondo de Cesantías _________________________.
            (En caso afirmativo la compañía solicitará al fondo la consignación en su cuenta bancaria
            de nómina, en caso negativo puede solicitar a la compañía posteriormente cuando lo requiera
            al correo electrónico <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span>).
        </td>
    </tr>
</table>

<table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
    <tr>
        <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
        <td>
            <strong>Datos de notificación:</strong>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                <tr>
                    <td style="padding:3px 0;width:55%;">Ciudad de Residencia:</td>
                    <td style="border-bottom:1px solid #000;width:45%;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">Dirección (incluir el barrio/sector):</td>
                    <td style="border-bottom:1px solid #000;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">Teléfono:</td>
                    <td style="border-bottom:1px solid #000;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">Correo Electrónico:</td>
                    <td style="border-bottom:1px solid #000;">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;margin:0 0 24px 0;">
    Declaró que comprendí la información contenida en esta comunicación y en señal a lo anterior
    firmo de recibido y enterado.
</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;
   border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
    <strong>${sNombre}</strong><br>
    <strong>C.C. ${sCedula}</strong>
</p>

<!--PAGEBREAK-->

<!-- ═══════════════════ PÁGINA 3 — Certificación laboral ═══════════════════ -->
<p style="font-size:11pt;font-family:Arial,sans-serif;font-weight:bold;
   text-align:center;letter-spacing:1px;margin:0 0 28px 0;">
    EL ÁREA DE GESTIÓN DE PERSONAS
</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;
   text-align:center;letter-spacing:6px;margin:0 0 40px 0;">
    C E R T I F I C A
</p>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;
   line-height:1.7;margin:0 0 24px 0;">
    Que, <strong>${sNombre}</strong> ${sIdentif} con cédula de ciudadanía número
    <strong>${sCedula},</strong> trabajó en la empresa con contrato a término indefinido, desde
    <strong>${sIngreso}</strong> hasta el <strong>${sSalida}</strong>
</p>

<table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:28px;">
    <tr>
        <td style="padding:4px 0;font-weight:bold;width:40%;">Ultimo cargo desempeñado:</td>
        <td style="padding:4px 0;">${sCargo}</td>
    </tr>
    <tr>
        <td style="padding:4px 0;font-weight:bold;">Ciudad de trabajo:</td>
        <td style="padding:4px 0;">${sCiudadWork}</td>
    </tr>
    <tr>
        <td style="padding:4px 0;font-weight:bold;">Salario:</td>
        <td style="padding:4px 0;text-align:right;">${sSalario}</td>
    </tr>
</table>

<p style="font-size:11pt;font-family:Arial,sans-serif;text-align:justify;margin:0 0 60px 0;">
    La anterior se expide en Ciudad de Bogotá el ${_getDayMonth()} de
    ${_numToWords(new Date().getFullYear())} (${new Date().getFullYear()}).
</p>

<div style="text-align:center;">
    <p style="font-size:11pt;font-family:Arial,sans-serif;
       border-top:1.5px solid #000;width:260px;margin:0 auto;padding-top:6px;">
        <strong>${sNombre}</strong><br>
        <strong>Gestión Personas</strong>
    </p>
</div>

<!--PAGEBREAK-->

<!-- ═══════════════════ PÁGINA 4 — En blanco (solo membrete) ═══════════════════ -->
<p style="margin:0;">&nbsp;</p>

`;

                // ── Generar PDF ───────────────────────────────────────────────
                const contentBlocks = htmlRaw.split("<!--PAGEBREAK-->");

                const existingPdfBytes = await fetch("pdf/hojaDiaco.pdf").then(res => res.arrayBuffer());
                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (const blockHtml of contentBlocks) {
                    const div = document.createElement("div");
                    div.style.width           = "794px";
                    div.style.height          = "760px";
                    div.style.padding         = "40px";
                    div.style.backgroundColor = "white";
                    div.style.fontSize        = "12px";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                    const canvas = await html2canvasRef(div, {
                        scale: 2,
                        useCORS: true
                    });
                    const imgData = canvas.toDataURL("image/png");

                    document.body.removeChild(div);

                    const img     = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);
                    newPage.drawPage(templatePageImage);

                    const imgWidth  = width * 0.9;
                    const imgHeight = (img.height * imgWidth) / img.width;

                    newPage.drawImage(img, {
                        x:      (width - imgWidth) / 2,
                        y:      height - imgHeight - 130,
                        width:  imgWidth,
                        height: imgHeight
                    });
                }

                pdfDoc.removePage(0);

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Kit_Retiro`;

                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const link = document.createElement("a");
                link.href     = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
            }

            const mensaje = aUsers.length > 1
                ? `${aUsers.length} documentos generados correctamente.`
                : "Documento generado correctamente.";
            MessageToast.show(mensaje);

        } catch (error) {
            console.error("Error generando el Kit de Retiro:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function _formatDate(date) {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
    }

    function _loadImageAsBase64(sPath) {
        return new Promise(function (resolve, reject) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width  = img.width;
                canvas.height = img.height;
                canvas.getContext("2d").drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = function () {
                // Si no carga el QR, continuar sin él (no romper el documento)
                resolve("");
            };
            img.src = sPath;
        });
    }

    function _formatSalary(value) {
        if (!value) return "";
        return "$ " + Number(value).toLocaleString("es-CO");
    }

    function _getDayMonth() {
        const d = new Date();
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getDate()} de ${months[d.getMonth()]}`;
    }

    function _numToWords(year) {
        const map = {
            2020: "dos mil veinte",
            2021: "dos mil veintiuno",
            2022: "dos mil veintidós",
            2023: "dos mil veintitrés",
            2024: "dos mil veinticuatro",
            2025: "dos mil veinticinco",
            2026: "dos mil veintiséis",
            2027: "dos mil veintisiete",
            2028: "dos mil veintiocho",
            2029: "dos mil veintinueve",
            2030: "dos mil treinta"
        };
        return map[year] || String(year);
    }

    return {
        onDownloadPDFKitRetiro
    };

});