sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFNoDeclarante(oController, sButtonId) {
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
                const sCiudadFirma = user.ciudadFirma || "";
                const localDate    = oController.getLocalDate();

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "pdf/Manifestación_No_Declarante.docx",
                        fileName:     `${user.firstName}_${user.lastName}Manifestación_No_Declarante.docx`,
                        data: {
                            sNombre, sCedula, sCiudadFirma, localDate
                        }
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="margin:0 0 36px 0;">
                        Ciudad y Fecha: ${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}
                    </p>

                    <p style="margin:0;">Señores</p>
                    <p style="margin:0;"><strong>RECURSOS HUMANOS</strong></p>
                    <p style="margin:0;"><strong>DIACO S.A.</strong></p>
                    <p style="margin:0 0 36px 0;">${sCiudadFirma}</p>

                    <p style="margin:0 0 20px 0;text-align:justify;">
                        <strong>Asunto:</strong> Manifestación de la calidad de <strong>NO Declarante</strong> en el Impuesto de Renta.
                    </p>

                    <p style="margin:0 0 14px 0;">Cordial saludo:</p>

                    <p style="text-align:justify;margin:0 0 14px 0;">
                        Me permito manifestar bajo la gravedad del juramento y actuando en mi calidad de empleado de la Compañía, que 
                        <strong>NO</strong> tengo la calidad de Declarante del Impuesto sobre la Renta, por lo tanto 
                        solicito no aplicar descuento de Retención en la Fuente por concepto de pagos laborales.
                    </p>

                    <p style="text-align:justify;margin:0 0 14px 0;">
                        De igual forma me comprometo a actualizar la información, en el caso de que mis condiciones como declarante de Renta llegaran a cambiar.
                    </p>

                    <p style="text-align:justify;margin:0 0 36px 0;">
                        Lo anterior en cumplimiento de lo previsto por parágrafo tercero del artículo 14 de la Ley 1607 de 2012, que 
                        adicionó al artículo 384 al Estatuto Tributario y en concordancia con lo establecido por el parágrafo cuarto 
                        del artículo tercero del Decreto 0099 de 2013.
                    </p>

                    <p style="margin:0 0 60px 0;">Atentamente,</p>

                    <p style="margin:0 0 8px 0;">Firma: ___________________________</p>
                    <p style="margin:0 0 8px 0;">Nombre: ${sNombre}</p>
                    <p style="margin:0;">C.C.: ${sCedula}</p>

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
                div.innerHTML             = htmlRaw;
                document.body.appendChild(div);

                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: "#ffffff"
                });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                const pdfDoc  = await PDFLibRef.PDFDocument.create();
                const img     = await pdfDoc.embedPng(imgData);

                const PAGE_W  = 595;
                const PAGE_H  = 842;
                const MARGIN  = 40;
                const drawW   = PAGE_W - MARGIN * 2;
                const drawH   = (img.height * drawW) / img.width;
                const sliceH  = PAGE_H - MARGIN * 2;
                const totalPgs = Math.ceil(drawH / sliceH);

                for (let p = 0; p < totalPgs; p++) {
                    const pg = pdfDoc.addPage([PAGE_W, PAGE_H]);
                    pg.drawImage(img, {
                        x:      MARGIN,
                        y:      PAGE_H - MARGIN - drawH + p * sliceH,
                        width:  drawW,
                        height: drawH
                    });
                }

                const pdfBytes = await pdfDoc.save();
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Manifestación No Declarante`);

                const fileName = `${user.firstName}_${user.lastName}_Manifestacion_No_Declarante.pdf`;
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
            console.error("Error generando Manifestación No Declarante:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }
    
    return { onDownloadPDFNoDeclarante };
});