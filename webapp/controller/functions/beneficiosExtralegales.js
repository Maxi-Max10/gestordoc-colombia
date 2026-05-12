sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFBeneficiosExtralegales(oController, sButtonId) {
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

            const localDate = _formatDateLong(new Date());

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre       = `${user.firstName} ${user.lastName}`;
                const sCedula       = user.nationalId || "";
                const sIdentificado = (user.gender === "F") ? "identificada" : "identificado";
                const sCiudadFirma  = user.location || user.city || "Bucaramanga";

                // ── Word ──────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName:   user.firstName,
                        lastName:    user.lastName,
                        sNombre,
                        sCedula,
                        sIdentificado,
                        sCiudadFirma,
                        localDate
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                    <div style="font-family:Arial,sans-serif;font-size:10pt;line-height:1.55;color:#000;width:100%;box-sizing:border-box; padding-bottom:80px; overflow: visible;">

                        <p style="text-align:center;font-weight:bold;font-size:11pt;margin:0 0 4px 0; margin-bottom: 20px;">
                            CONOCIMIENTO Y DECLARACIÓN PLAN DE BENEFICIOS EXTRALEGALES
                        </p>

                        <p style="text-align:justify;margin:0 0 16px 0;">
                            El suscrito <strong>${sNombre}</strong> ${sIdentificado} como <strong>${sCedula}</strong> 
                            aparece al pie de mi firma, por medio del presente escrito me permito manifestar lo siguiente:
                        </p>

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
                                    las implicaciones de acceder al mismo, he decidido de manera unilateral, libre y voluntaria acogerme a su contenido integral.
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
                                    Que declaro que los beneficios allí contenidos son de carácter unilateral, extralegal, por lo que entiendo que DIACO S.A., 
                                    se reserva el derecho de modificar, ajustar y/o suprimir los auxilios aquí incluidos cuando resulte necesario 
                                    para la empresa sin que ello se entienda como una desmejora en las condiciones laborales.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">5.</td>
                                <td style="text-align:justify;">
                                    Soy plenamente conocedor que los beneficios reconocidos en el Plan de Beneficios Extralegales resultan ser 
                                    incompatibles con cualquier otra fuente de derechos, tales como convenciones colectivas, pactos 
                                    colectivos, etc., por lo que con esta aceptación entiendo de forma clara que no cuento con otra fuente de derechos extralegales.
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

                        <table style="font-size:11pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:60px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">7.</td>
                                <td style="text-align:justify;">
                                    Que reconozco y ratifico que los beneficios del Plan que no tienen incidencia salarial, sin importar la denominación
                                    adoptada, NO constituyen salario para ningún efecto y en consecuencia, no han sido ni serán tenidos en cuenta para
                                    efectos de calcular el valor de vacaciones, indemnizaciones, prestaciones sociales y, en general, para el pago de cualquier
                                    otra acreencia de carácter laboral o en materia de seguridad social y aportes parafiscales.
                                </td>
                            </tr>
                        </table>

                        <div style="border-top:1px solid #000;width:260px;padding-top:6px;margin-bottom:10px; margin-bottom: 20px">
                            <p style="font-size:11pt;font-family:Arial,sans-serif;margin:0;"><strong>${sNombre}</strong></p>
                            <p style="font-size:11pt;font-family:Arial,sans-serif;margin:0;">NOMBRE TRABAJADOR</p>
                            <p style="font-size:11pt;font-family:Arial,sans-serif;margin:0;"><strong>C.C. ${sCedula}</strong> de ____________</p>
                        </div>

                        <div style="width:100%; margin-top:20px; padding-bottom:30px;text-align:right;font-size:9pt; font-family:Arial,sans-serif; color:#555; box-sizing:border-box;">
                            Pág. 1 de 1
                        </div>

                    </div>
                `;

                const div = document.createElement("div");
                div.style.width           = "714px";
                div.style.padding         = "40px";
                div.style.backgroundColor = "#ffffff";
                div.style.boxSizing       = "border-box";
                div.style.position        = "absolute";
                div.style.top             = "-9999px";
                div.style.left            = "-9999px";
                document.body.appendChild(div);
                div.innerHTML = htmlRaw;

                // Esperar un tick para que el navegador calcule el layout completo
                await new Promise(r => setTimeout(r, 50));

                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: "#ffffff",
                    windowWidth:     794,
                    height: div.scrollHeight,
                    windowHeight: div.scrollHeight,
                    scrollY:         0
                });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                const pdfDoc = await PDFLibRef.PDFDocument.create();
                const img    = await pdfDoc.embedPng(imgData);

                const PAGE_W = 595;
                const PAGE_H = 842;
                const MARGIN = 45;

                const drawW = PAGE_W - (MARGIN * 2);
                const drawH = (img.height * drawW) / img.width;

                const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

                page.drawImage(img, {
                    x: MARGIN,
                    y: PAGE_H - drawH - MARGIN,
                    width: drawW,
                    height: drawH
                });

                // Rectángulo negro sin relleno que enmarca el área de contenido
                const { rgb } = PDFLibRef;
                page.drawRectangle({
                    x:            MARGIN,
                    y:            MARGIN,
                    width:        PAGE_W - MARGIN * 2,
                    height:       PAGE_H - MARGIN * 2,
                    borderColor:  rgb(0, 0, 0),
                    borderWidth:  1,
                    color:        undefined,     // sin relleno
                    opacity:      0
                });
 

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Beneficios_Extralegales.pdf`;
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
            console.error("Error generando Beneficios Extralegales:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    // ─── Word con JSZip + plantilla Beneficios_Extralegales.docx ─────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Beneficios_Extralegales.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Beneficios_Extralegales.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]":       data.sNombre,
            "[[Cedula]]":       data.sCedula,
            "[[Identificado]]": data.sIdentificado,
            "[[CiudadFirma]]":  data.sCiudadFirma,
            "[[Fecha]]":        data.localDate
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
        link.download = `${data.firstName}_${data.lastName}_Beneficios_Extralegales.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        MessageToast.show("Documento Word generado correctamente.");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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
            const script  = document.createElement("script");
            script.src    = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    function _formatDateLong(date) {
        const d      = new Date(date);
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${_dayToWords(d.getDate())} (${d.getDate()}) de ${months[d.getMonth()]} de ${d.getFullYear()}`;
    }

    function _dayToWords(day) {
        const words = [
            "","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez",
            "once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho",
            "diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro",
            "veinticinco","veintiséis","veintisiete","veintiocho","veintinueve","treinta",
            "treinta y uno"
        ];
        return words[day] || String(day);
    }


    function _salaryToWords(value) {
        const n = Math.round(Number(value) || 0);
        if (n === 0) return "CERO PESOS M/CTE";

        const unidades = ["","UN","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
                          "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS",
                          "DIECISIETE","DIECIOCHO","DIECINUEVE"];
        const decenas  = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA",
                          "SESENTA","SETENTA","OCHENTA","NOVENTA"];
        const centenas = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
                          "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];

        function grupo(n) {
            let s = "";
            const c = Math.floor(n / 100);
            const r = n % 100;
            if (c > 0) { s += (c === 1 && r === 0) ? "CIEN" : centenas[c]; if (r > 0) s += " "; }
            if (r > 0) {
                if (r < 20) { s += unidades[r]; }
                else {
                    const d = Math.floor(r / 10), u = r % 10;
                    if (r >= 21 && r <= 29) {
                        s += ["","VEINTIÚN","VEINTIDÓS","VEINTITRÉS","VEINTICUATRO","VEINTICINCO",
                              "VEINTISÉIS","VEINTISIETE","VEINTIOCHO","VEINTINUEVE"][u];
                    } else { s += decenas[d]; if (u > 0) s += " Y " + unidades[u]; }
                }
            }
            return s;
        }

        const millones = Math.floor(n / 1000000);
        const miles    = Math.floor((n % 1000000) / 1000);
        const resto    = n % 1000;
        let resultado  = "";
        if (millones > 0) { resultado += (millones === 1) ? "UN MILLÓN" : grupo(millones) + " MILLONES"; if (miles > 0 || resto > 0) resultado += " "; }
        if (miles > 0)    { resultado += (miles === 1)    ? "MIL"       : grupo(miles)    + " MIL";      if (resto > 0)              resultado += " "; }
        if (resto > 0)    { resultado += grupo(resto); }
        return resultado + " PESOS M/CTE";
    }

    return { onDownloadPDFBeneficiosExtralegales };
});