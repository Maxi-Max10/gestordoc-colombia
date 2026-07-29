sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
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

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre     = `${user.firstName} ${user.lastName}`;
                const sCedula     = user.nationalId || "";
                const sIdentif    = (user.gender === "F") ? "identificada" : "identificado";
                const localDate   = oController.getLocalDate();
                const sCiudadExpedicion = user.docExpeditionCity || "";

                // ── Word ──────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "templates/word/Beneficios_Extralegales.docx",
                        fileName:     `${user.firstName}_${user.lastName}_Beneficios_Extralegales.docx`,
                        data: {
                            sNombre, sCedula, sIdentif, localDate, sCiudadExpedicion
                        }
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                    <div style="
                        font-family:Arial,sans-serif;
                        font-size:10pt;
                        line-height:1.2;
                        color:#000;
                        width:100%;
                        height:100%;
                        position:relative;
                        box-sizing:border-box;
                        border:1px solid #666;
                        padding:40px;
                    ">

                        <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 20px 0;">
                            CONOCIMIENTO Y DECLARACIÓN PLAN DE BENEFICIOS EXTRALEGALES
                        </p>

                        <p style="text-align:justify;margin:0 0 16px 0;">
                            El suscrito, ${sNombre} ${sIdentif} como ${sCedula} 
                            aparece al pie de mi firma, por medio del presente escrito me permito manifestar lo siguiente:
                        </p>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">1.</td>
                                <td style="text-align:justify;">
                                    Que es de mi conocimiento que <strong>DIACO S.A.</strong>, ha implementado un Plan de Beneficios Extralegales, que 
                                    busca garantizar al bienestar y mejoramiento del nivel de vida de sus trabajadores.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">2.</td>
                                <td style="text-align:justify;">
                                    Que luego de haberme informado y conocido el contenido del Plan de Beneficios Extralegales, así como 
                                    las implicaciones de acceder al mismo, he decidido de manera unilateral, libre y voluntaria acogerme a su contenido integral.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">3.</td>
                                <td style="text-align:justify;">
                                    La presente declaración de voluntad tiene efectos desde la fecha de su firma, por lo que soy consciente 
                                    que la aplicación del Plan de Beneficios Extralegales es a futuro y no retroactiva.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
                                <td style="text-align:justify;">
                                    Que declaro que los beneficios allí contenidos son de carácter unilateral, extralegal, por lo que entiendo que <strong>DIACO S.A.,</strong> 
                                    se reserva el derecho de modificar, ajustar y/o suprimir los auxilios aquí incluidos cuando resulte necesario 
                                    para la empresa sin que ello se entienda como una desmejora en las condiciones laborales.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
                            <tr>
                                <td style="width:24px;vertical-align:top;font-weight:bold;">5.</td>
                                <td style="text-align:justify;">
                                    Soy plenamente conocedor que los beneficios reconocidos en el Plan de Beneficios Extralegales resultan ser 
                                    incompatibles con cualquier otra fuente de derechos, tales como convenciones colectivas, pactos 
                                    colectivos, etc., por lo que con esta aceptación entiendo de forma clara que no cuento con otra fuente de derechos extralegales.
                                </td>
                            </tr>
                        </table>

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
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

                        <table style="font-size:10pt;font-family:Arial,sans-serif;width:100%;border-collapse:collapse;margin-bottom:14px;">
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

                        <p style="font-size:10pt;font-family:Arial,sans-serif;margin:0 0 60px 0;">Cordialmente,</p>

                        <div style="border-top:1.5px solid #000;width:260px;margin-bottom:0;"></div>
                        
                        <div style="padding-top:6px;margin-bottom:40px;">
                            <p style="font-size:10pt;font-family:Arial,sans-serif;margin:0;">${sNombre}</p>
                            <p style="font-size:10pt;font-family:Arial,sans-serif;margin:0; font-weight:bold;">NOMBRE TRABAJADOR</p>
                            <p style="font-size:10pt;font-family:Arial,sans-serif;margin:0;">C.C. ${sCedula} de ${sCiudadExpedicion}</p>
                        </div>

                        <p style="font-size:9pt;font-family:Arial,sans-serif;margin:0;position:absolute;right:15px;bottom:15px;color:#555;">
                            Pág. <strong>1 de 1</strong>
                        </p>

                    </div>
                `;

                // Crear el div fuera de pantalla y dejar que el navegador
                // calcule su altura real ANTES de hacer la captura
                const div = document.createElement("div");
                div.style.position        = "absolute";
                div.style.top             = "-9999px";
                div.style.left            = "-9999px";
                div.style.width           = "816px";
                div.style.height          = "1056px";
                div.style.padding         = "32px";
                div.style.backgroundColor = "#ffffff";
                div.style.boxSizing       = "border-box";
                div.innerHTML             = htmlRaw;
                document.body.appendChild(div);

                // Esperar dos frames para que el layout esté completamente calculado
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));


                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: "#ffffff",
                    width:           816,
                    height:          1056,
                    windowWidth:     816,
                    scrollY:         0
                });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                const pdfDoc = await PDFLibRef.PDFDocument.create();
                const img    = await pdfDoc.embedPng(imgData);

                // Página carta fija: 8.5 × 11 pulgadas a 72 puntos por pulgada.
                const PAGE_W = 612;
                const PAGE_H = 792;
                const pg = pdfDoc.addPage([PAGE_W, PAGE_H]);
                pg.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: PAGE_W,
                    height: PAGE_H
                });
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Beneficios Extralegales`);

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

    return { onDownloadPDFBeneficiosExtralegales };
});