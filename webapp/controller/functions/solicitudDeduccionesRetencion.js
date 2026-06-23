sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFRetencionFuente(oController, sButtonId) {
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

                const sNombre      = `${user.firstName} ${user.lastName}`;
                const sCedula      = user.nationalId || "";
                const sCiudadWork  = oController.getCiudadWork(user);
                const localDate    = oController.getLocalDate();
                const sCiudadExpedicion = user.docExpeditionCity || "";

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "pdf/Solicitud_Deducciones_Retencion.docx",
                        fileName:     `${user.firstName}_${user.lastName}_Solicitud_Deducciones_Retencion.docx`,
                        data: {
                            sNombre, sCedula, sCiudadWork, localDate
                        }
                    });
                    continue;
                }

                const STYLE = `font-family:Arial,sans-serif;font-size:10pt;line-height:1.6;color:#000;width:100%;box-sizing:border-box;`;

                // ── PDF — sin plantilla de fondo ──────────────────────────────
                const htmlPagina1 = `
                    <div style="${STYLE}">
                        <p style="text-align:center;font-weight:bold;font-size:11pt;margin:0 0 16px 0;">
                            SOLICITUD PARA DEDUCCIONES DE RETENCIÓN EN LA FUENTE Y CONDICION DE<br>DECLARANTE DE RENTA
                        </p>

                        <p style="margin:0 0 8px 0;">Ciudad y Fecha: ${sCiudadWork ? sCiudadWork + ", " : ""}${localDate}</p>
                        <p style="margin:0;">Señores:</p>
                        <p style="margin:0;">Sección Nómina</p>
                        <p style="margin:0;">DIACO S.A.</p>
                        <p style="margin:0 0 16px 0;">${sCiudadWork}</p>

                        <p style="text-align:justify;margin:0 0 16px 0;">
                            Yo <strong>${sNombre}</strong>, con cédula número <strong>${sCedula}</strong>
                            de <strong>${sCiudadExpedicion}</strong> atendiendo lo dispuesto en la Ley 1607 de 2012 y el decreto 0099
                            de 2013, manifiesto bajo la gravedad de juramento:
                        </p>

                        <p style="margin:0 0 10px 0;">1. Que me acojo a las siguientes deducciones (marcar con una X uno o varios ítems):</p>

                        <!-- a) -->
                        <p style="margin:0 0 4px 0;">
                            &nbsp;&nbsp;&nbsp;&nbsp;a) &nbsp;<strong>Intereses y/o corrección monetaria por crédito de vivienda</strong> &nbsp;&nbsp;&nbsp;___
                        </p>
                        <p style="margin:0 0 4px 20px;">Favor aplicar el ___ % del valor total deducible.</p>
                        <p style="margin:0 0 2px 20px;text-align:justify;">
                            &#10148; Cuando el certificado de intereses de vivienda está a nombre del empleado y su
                            cónyuge y se va a tomar el 100% del derecho, se debe adjuntar la autorización del
                            cónyuge que cede el derecho.
                        </p>
                        <p style="margin:0 0 12px 20px;text-align:justify;">
                            &#10148; Adjuntar el certificado tributario de crédito hipotecario con los pagos realizados en el año anterior.
                        </p>

                        <!-- b) -->
                        <p style="margin:0 0 4px 0;">
                            &nbsp;&nbsp;&nbsp;&nbsp;b) &nbsp;<strong>Pagos de póliza de salud o Medicina pre-pagada</strong> &nbsp;&nbsp;&nbsp;___
                        </p>
                        <p style="margin:0 0 2px 20px;text-align:justify;">
                            &#10148; Si el empleado solicita una deducción por Salud pre-pagada o póliza de salud para
                            padres o hermanos, éstos deben relacionarse y adjuntarse la documentación requerida como dependiente.
                        </p>
                        <p style="margin:0 0 12px 20px;text-align:justify;">
                            &#10148; Adjuntar Certificado anual de los pagos realizados en el año anterior.
                        </p>

                        <!-- c) -->
                        <p style="margin:0 0 4px 0;">
                            &nbsp;&nbsp;&nbsp;&nbsp;c) &nbsp;<strong>Dependientes</strong> &nbsp;&nbsp;&nbsp;___
                        </p>
                        <p style="margin:0 20px 12px 20px;text-align:justify;">
                            Certifico que soy la única persona que está solicitando la deducción por los dependientes aquí relacionados
                        </p>

                    <!-- Tabla dependientes -->
                        <table style="width:100%;border-collapse:collapse;font-size:9.5pt;margin-bottom:8px;">
                            <thead>
                                <tr>
                                    <th style="border:1px solid #000;padding:4px 6px;text-align:center;width:14%;background-color:#cccccc;">Cantidad</th>
                                    <th style="border:1px solid #000;padding:4px 6px;text-align:center;width:28%;background-color:#cccccc;">Tipo</th>
                                    <th style="border:1px solid #000;padding:4px 6px;text-align:center;width:22%;background-color:#cccccc;">Nombre y Apellido</th>
                                    <th style="border:1px solid #000;padding:4px 6px;text-align:center;width:18%;background-color:#cccccc;">No. Identificación</th>
                                    <th style="border:1px solid #000;padding:4px 6px;text-align:center;width:18%;background-color:#cccccc;">* Tipo de identificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">Hijos hasta 18 años</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">Hijos entre 18 y 23 años a quienes los padres financian la educación</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">Hijos mayores de 23 años</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">Cónyuge o compañera permanente, padres o hermanos</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                    <td style="border:1px solid #000;padding:4px 6px;">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>

                        <p style="font-size:8.5pt;margin:0 0 12px 0;">
                            *UN: NUIP - TI: tarjeta de identidad – CC: Cédula de Ciudadanía – CE: Cédula Extranjería
                        </p>
                    </div>`;

                    const htmlPagina2 = `
                    <div style="${STYLE}">
                        <p style="margin:0 0 2px 0;text-align:justify;">
                            &#10148; El beneficio por dependientes no es acumulable, es decir, es igual el beneficio
                            obtenido por uno o varios dependientes.
                        </p>
                        <p style="margin:0 0 8px 0;">&#10148; Adjuntar la documentación necesaria en cada caso:</p>

                        <p style="margin:0 0 1px 20px;">Hijos hasta 18 años: Registro Civil</p>
                        <p style="margin:0 0 1px 20px;">Hijos entre 18 y 23 años a quienes los padres financian la educación: Registro civil y certificado de estudios.</p>
                        <p style="margin:0 0 1px 20px;">Hijos Mayores de 23 años: certificado de medicina legal</p>
                        <p style="margin:0 0 16px 20px;text-align:justify;">
                            Cónyuge o compañera permanente, Padres o Hermanos: Si es por dependencia económica
                            certificado de contador Público y si es por factores físicos o sicológicos certificado de medicina Legal.
                        </p>

                        <p style="margin:0 0 6px 0;">
                            <strong>2.</strong> Que soy declarante del impuesto de renta (Marcar con una X) &nbsp;&nbsp; SI___ &nbsp;&nbsp; NO___
                        </p>
                        <p style="text-align:justify;margin:0 0 4px 0;">
                            Si selecciona que es declarante del impuesto de renta puede (si así lo desea) solicitar un valor
                            adicional de retención en la fuente al calculado por el sistema de nómina:
                        </p>
                        <p style="margin:0 0 20px 0; text-align:center">Valor <strong>adicional Mensual</strong> solicitado: $____________</p>

                        <p style="text-align:justify;margin:0 0 40px 0;">
                            <strong>3.</strong> Me comprometo a comunicar cualquier cambio que pueda modificar los beneficios obtenidos.
                        </p>

                        <p style="margin:0 0 6px 20px;">Firma: ____________________________________</p>
                        <p style="margin:0 0 6px 20px;">Nombre: ${sNombre}</p>
                        <p style="margin:0 0 0 20px;">C.C.:${sCedula}</p>
                    </div>`;

                // Crear PDF en blanco y renderizar cada página
                const pdfDoc = await PDFLibRef.PDFDocument.create();

                for (const blockHtml of [htmlPagina1, htmlPagina2]) {
                    const div = document.createElement("div");
                    div.style.width           = "794px";
                    div.style.height          = "1020px";
                    div.style.padding         = "40px 90px";
                    div.style.backgroundColor = "#ffffff";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.style.left            = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                    const canvas  = await html2canvasRef(div, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img       = await pdfDoc.embedPng(imgData);
                    const page      = pdfDoc.addPage([595, 842]);
                    const imgWidth  = 595 * 0.9;
                    const imgHeight = (img.height * imgWidth) / img.width;

                    page.drawImage(img, {
                        x:      (595 - imgWidth) / 2,
                        y:      842 - imgHeight - 30,
                        width:  imgWidth,
                        height: imgHeight
                    });
                }

                const pdfBytes = await pdfDoc.save();
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Solicitud Deducciones Retención`);

                const fileName = `${user.firstName}_${user.lastName}_Solicitud_Deducciones_Retencion.pdf`;
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
            console.error("Error generando Retención en la Fuente:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return { onDownloadPDFRetencionFuente };
});