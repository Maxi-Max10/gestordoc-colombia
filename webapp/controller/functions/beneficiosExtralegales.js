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

                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 4px 0;">
                        CONOCIMIENTO Y DECLARACIÓN PLAN DE BENEFICIOS EXTRALEGALES
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        El suscrito <strong>${sNombre}</strong> ${sIdentificado} como <strong>${sCedula}</strong> 
                        aparece al pie de mi firma, por  medio del presente escrito me permito manifestar lo siguiente: 
                    </p>

                    <p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 16px 0;">${sCity ? sCity + ", " : ""}${localDate}</p>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">1.</td>
                            <td style="text-align:justify;">
                                Que es de mi conocimiento que DIACO S.A., ha implementado un Plan de Beneficios Extralegales, que 
                                busca garantizar al bienestar y mejoramiento del nivel de vida de sus trabajadores.
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">2.</td>
                            <td style="text-align:justify;">
                                Que luego de haberme informado y conocido el contenido del Plan de Beneficios Extralegales, así como  
                                las implicaciones de acceder al mismo, he decidido de manera unilateral, libre y voluntaria acogerme a  su contenido integral.
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">3.</td>
                            <td style="text-align:justify;">
                                La presente declaración de voluntad tiene efectos desde la fecha de su firma, por lo que soy consciente  
                                que la aplicación del Plan de Beneficios Extralegales es a futuro y no retroactiva. 
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
                            <td style="text-align:justify;">
                                Que declaro que los beneficios allí contenidos son de carácter unilateral, extralegal, por lo que entiendo  que DIACO S.A., 
                                se reserva el derecho de modificar, ajustar y/o suprimir los auxilios aquí incluidos  cuando resulte necesario 
                                para la empresa sin que ello se entienda como una desmejora en las  condiciones laborales. 
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">5.</td>
                            <td style="text-align:justify;">
                                Soy plenamente conocedor que los beneficios reconocidos en el Plan de Beneficios Extralegales resultan ser 
                                incompatibles con cualquier otra fuente de derechos, tales como convenciones colectivas, pactos  
                                colectivos, etc., por lo que con esta aceptación entiendo de forma clara que no cuento con otra fuente  de derechos extralegales.
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">6.</td>
                            <td style="text-align:justify;">
                                Ahora bien, en el caso que en mi calidad de trabajador me convierta en beneficiario de una fuente de  
                                beneficios colectivos distinta al plan ofrecido por la empresa o renuncie expresamente al mismo, 
                                para acceder a otro, automáticamente dejará de aplicar el Plan de Beneficios Extralegales que hoy en día 
                                accedo, en tanto que no es viable que coexistan dos fuentes sobre un mismo trabajador. 
                            </td>
                        </tr>
                    </table>

                    <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                        <tr>
                            <td style="width:24px;vertical-align:top;font-weight:bold;">7.</td>
                            <td style="text-align:justify;">
                                Que reconozco y ratifico que los beneficios del Plan que no tienen incidencia salarial, sin importar la  denominación
                                 adoptada, NO constituyen salario para ningún efecto y en consecuencia, no han sido ni  serán tenidos en cuenta para
                                  efectos de calcular el valor de vacaciones, indemnizaciones, prestaciones  sociales y, en general, para el pago de cualquier
                                   otra acreencia de carácter laboral o en materia de  seguridad social y aportes parafiscales.  
                            </td>
                        </tr>
                    </table>

                    <p style="font-size:11pt;font-family:Arial,sans-serif;margin:0 0 60px 0;">Cordialmente,</p>
                
                    <p style="font-size:11pt;font-family:Arial,sans-serif;
                    border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
                        <strong>${sNombre}</strong><br>
                        <p>NOMBRE TRABAJADOR</p>
                        <strong>C.C. ${sCedula}</strong>
                    </p>

                    <!--PAGEBREAK-->


                `;

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName:   user.firstName,
                        lastName:    user.lastName,
                        sNombre,
                        sCedula,
                        sCargo,
                        sCiudadWork,
                        sSalario,
                        sIngreso,
                        sSalida,
                        sIdentif,
                        sCity,
                        localDate
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
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
                    div.style.backgroundColor = "transparent";
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

    // ─── Word con JSZip + plantilla Kit_Retiro.docx ──────────────────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Kit_Retiro.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Kit_Retiro.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const sCiudadFecha = data.sCity ? `${data.sCity}, ${data.localDate}` : data.localDate;
        const sCertFecha   = `${_getDayMonth()} de ${_numToWords(new Date().getFullYear())} (${new Date().getFullYear()})`;

        const variables = {
            "[[Nombre]]":      data.sNombre,
            "[[Cedula]]":      data.sCedula,
            "[[Cargo]]":       data.sCargo,
            "[[CiudadWork]]":  data.sCiudadWork,
            "[[Salario]]":     data.sSalario,
            "[[FechaIngreso]]": data.sIngreso,
            "[[FechaSalida]]": data.sSalida,
            "[[Identificado]]": data.sIdentif,
            "[[CiudadFecha]]": sCiudadFecha,
            "[[FechaCert]]":   sCertFecha
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
        link.href = URL.createObjectURL(blob);
        link.download = `${data.firstName}_${data.lastName}_Kit_Retiro.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
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
            const script    = document.createElement("script");
            script.src      = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload   = () => resolve(window.JSZip);
            script.onerror  = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

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