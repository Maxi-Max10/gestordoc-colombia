sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFKitRetiro(oController, sButtonId) {
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

            // Pre-cargar el QR como base64 (una sola vez fuera del loop)
            const qrBase64 = await _loadImageAsBase64("img/qr_encuesta_retiro.png");

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre     = `${user.firstName} ${user.lastName}`;
                const sCedula     = user.nationalId || "";
                const sCiudadWork = oController.getCiudadWork(user);
                const localDate   = oController.getLocalDate();
                const sCargo      = oController.resolveGender(user.title || "", user.gender);
                const sSalario    = oController.formatSalary(user.paycompvalue);
                const sIngreso    = user.hireDatesimpl ? oController.formatDateToSpanish(user.hireDatesimpl) : "XXXX";
                const sSalida     = user.endDate ? oController.formatDateToSpanish(user.endDate + "T12:00:00") : "XXXX";
                const sIdentif    = (user.gender === "F") ? "identificada" : "identificado";
                const sEmail      = oController.getEmail(user);
                const sTelefono   = oController.getTelefono(user);
                const sDireccion = (user.addressLine1 || "").replace(/\s+/g, " ").trim();

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName: user.firstName,
                        lastName:  user.lastName,
                        sNombre, sCedula, sCiudadWork, localDate, sCargo,
                        sSalario, sIngreso, sSalida, sIdentif, sEmail, sTelefono, sDireccion
                    });
                    continue;
                }

                const STYLE = `font-family:Arial,sans-serif;font-size:9.5pt;line-height:1.2;padding:0px 60px 20px 80px;color:#000;`;

                const htmlPagina1 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    <p style="margin:0 0 16px 0;">${sCiudadWork ? sCiudadWork + ", " : ""}${localDate}</p>

                    <p style="margin:0;">Señor(a):</p>
                    <p style="font-weight:bold;margin:0;">${sNombre}</p>
                    <p style="font-weight:bold;margin:0 0 16px 0;">${sCiudadWork}</p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        Con referencia al retiro de la empresa, a continuación, se relaciona lista documentos
                        entregados en la fecha:
                    </p>

                    <ol style="margin:0 0 24px 20px;line-height:1.8;">
                        <li>Aprobación para envío de documentación, datos de notificación y pago de liquidación final</li>
                        <li>Certificación laboral</li>
                        <li>Comunicación plazo máximo para realización exámenes de egreso</li>
                        <li>Exámenes médicos post – ocupacionales</li>
                        <li>Paz y salvo de Seguridad social y parafiscales</li>
                        <li>Formato Paz y Salvo</li>
                        <li>Encuesta de retiro</li>
                    </ol>

                    <img src="${qrBase64}" style="width:130px;height:130px;display:block;margin:0 0 20px 0;" />

                    <p style="margin:0 0 60px 0;">Cordialmente,</p>

                    <p style="font-weight:bold;border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
                        Gestión Personas
                    </p>

                </div>`;

                const htmlPagina2 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    <p style="margin:0 0 4px 0;">${sCiudadWork ? sCiudadWork + ", " : ""}${localDate}</p>

                    <p style="margin:0;">Señor:</p>
                    <p style="font-weight:bold;margin:0;">${sNombre}</p>
                    <p style="font-weight:bold;margin:0 0 16px 0;">${sCiudadWork}</p>

                    <p style="text-align:justify;margin:0 0 14px 0;">
                        Pensando en su comodidad, tenemos disponible para usted las siguientes opciones (Marque X):
                    </p>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
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

                    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
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

                    <p style="text-align:justify;margin:0 0 14px 0;">
                        En caso contrario de no aceptación de los puntos 1 o 2, deberá dirigirse personalmente a las
                        instalaciones de la empresa, para recibir los documentos o reclamar el pago de su liquidación
                        de prestaciones sociales.
                    </p>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
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

                    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
                            <td>
                                <strong>Datos de notificación:</strong>
                                <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                                    <tr>
                                        <td style="padding:3px 0;width:55%;">Ciudad de Residencia:</td>
                                        <td>&nbsp ${sCiudadWork}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:3px 0;">Dirección (incluir el barrio/sector):</td>
                                        <td>&nbsp ${sDireccion}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:3px 0;">Teléfono:</td>
                                        <td>&nbsp${sTelefono}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:3px 0;">Correo Electrónico:</td>
                                        <td>&nbsp${sEmail}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <p style="text-align:justify;margin:0 0 40px 0;">
                        Declaró que comprendí la información contenida en esta comunicación y en señal a lo anterior
                        firmo de recibido y enterado.
                    </p>

                    <p style="border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
                        <strong>${sNombre}</strong><br>
                        <strong>C.C. ${sCedula}</strong>
                    </p>

                </div>`;

                const htmlPagina3 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    <p style="font-weight:bold;text-align:center;letter-spacing:1px;margin:0 0 28px 0;">
                        EL ÁREA DE GESTIÓN DE PERSONAS
                    </p>

                    <p style="text-align:center;letter-spacing:6px;margin:0 0 40px 0;">
                        C E R T I F I C A
                    </p>

                    <p style="text-align:justify;line-height:1.7;margin:0 0 24px 0;">
                        Que, <strong>${sNombre}</strong> ${sIdentif} con cédula de ciudadanía número
                        <strong>${sCedula},</strong> trabajó en la empresa con contrato a término indefinido, desde
                        <strong>${sIngreso}</strong> hasta el <strong>${sSalida}</strong>
                    </p>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
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
                            <td style="padding:4px 0;">${sSalario}</td>
                        </tr>
                    </table>

                    <p style="text-align:justify;margin:0 0 60px 0;">
                        La anterior se expide en Ciudad de Bogotá el ${localDate} de
                    </p>

                    <div style="text-align:center;">
                        <p style="border-top:1.5px solid #000;width:260px;margin:0 auto;padding-top:6px;">
                            <strong>${sNombre}</strong><br>
                            <strong>Gestión Personas</strong>
                        </p>
                    </div>

                </div>`;

                const contentBlocks = [htmlPagina1, htmlPagina2, htmlPagina3];

                const existingPdfBytes = await fetch("pdf/hojaDiaco.pdf").then(res => res.arrayBuffer());
                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width               = "794px";
                    div.style.padding             = "0px";
                    div.style.marginTop           = "-40px";
                    div.style.backgroundColor     = "transparent";
                    div.style.background          = "none";
                    div.style.fontSize            = "12px";
                    div.style.color               = "#000000";
                    div.style.webkitFontSmoothing = "antialiased";
                    div.style.textRendering       = "geometricPrecision";
                    div.style.boxSizing           = "border-box";
                    div.style.position            = "absolute";
                    div.style.top                 = "-9999px";
                    div.style.left                = "-9999px";
                    div.innerHTML                 = blockHtml;
                    document.body.appendChild(div);

                    const realHeight = div.scrollHeight;

                    const canvas = await html2canvasRef(div, {
                        scale:        4,
                        useCORS:      true,
                        backgroundColor: null,
                        logging:      false,
                        height:       realHeight,
                        windowHeight: realHeight
                    });
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img     = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);
                    newPage.drawPage(templatePageImage);

                    const maxH = height - 100;
                    let imgW = width * 0.95;
                    let imgH = (img.height * imgW) / img.width;

                    if (imgH > maxH) {
                        imgH = maxH;
                        imgW = (img.width * imgH) / img.height;
                    }

                    newPage.drawImage(img, {
                        x:      (width - imgW) / 2,
                        y:      height - imgH - 100,
                        width:  imgW,
                        height: imgH
                    });
                }

                pdfDoc.removePage(0);
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Kit de Retiro`);

                const pdfBytes = await pdfDoc.save();
                // En vez de solo disparar la descarga, abrí en pestaña nueva
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");  // ← abre en pestaña nueva con título correcto
                URL.revokeObjectURL(url);
            }

            MessageToast.show(
                aUsers.length > 1
                    ? `${aUsers.length} documentos generados correctamente.`
                    : "Documento generado correctamente."
            );

        } catch (error) {
            console.error("Error generando el Kit de Retiro:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Kit_Retiro.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Kit_Retiro.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const sCertFecha   = data.localDate; // ya viene formateado desde oController.getLocalDate()

        const variables = {
            "[[Nombre]]":      data.sNombre,
            "[[Cedula]]":      data.sCedula,
            "[[CiudadWork]]":  data.sCiudadWork,
            "[[Fecha]]":       data.localDate,
            "[[Cargo]]":       data.sCargo,
            "[[Salario]]":     data.sSalario,
            "[[FechaIngreso]]": data.sIngreso,
            "[[FechaSalida]]": data.sSalida,
            "[[Identificado]]": data.sIdentif,
            "[[CiudadFecha]]": data.sCiudadWork ? `${data.sCiudadWork}, ${data.localDate}` : data.localDate,
            "[[FechaCert]]":   sCertFecha,
        };

        const targets = ["word/document.xml", "word/header1.xml", "word/header2.xml", "word/footer1.xml", "word/footer2.xml"];

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
        link.download = `${data.firstName}_${data.lastName}_Kit_Retiro.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        MessageToast.show("Documento Word generado correctamente.");
    }

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
                resolve("");
            };
            img.src = sPath;
        });
    }

    return { onDownloadPDFKitRetiro };
});