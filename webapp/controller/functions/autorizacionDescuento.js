sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFAutorizacionDescuento(oController, sButtonId) {
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

                const sNombre           = `${user.firstName} ${user.lastName}`;
                const sCedula           = user.nationalId || "";
                const sIdentificado     = (user.gender === "F") ? "identificada" : "identificado";
                const sCiudadFirma = user.ciudadFirma || "";
                const localDate    = oController.getLocalDate();

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "templates/word/Autorizacion_Descuento.docx",
                        fileName:     `${user.firstName}_${user.lastName}Autorizacion_Descuento.docx`,
                        data: {
                            sNombre, sCedula, sIdentificado, sCiudadFirma, localDate
                        }
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                        <p style="text-align:center;font-weight:bold;font-size:15pt;margin:0 0 40px 0;">
                            AUTORIZACIÓN DE DESCUENTO
                        </p>

                        <p style="text-align:justify;margin:0 0 16px 0;">
                            Yo, <strong>${sNombre}</strong> ${sIdentificado} con cédula de ciudadanía N.° <strong>${sCedula}</strong> 
                            en calidad de empleado, autorizo al pagador DIACO S.A., para descontar del valor de mis
                            salarios, primas, prestaciones sociales o liquidación final, la suma de cien ($100) pesos
                            diarios por concepto de servicio de alimentación de acuerdo al reporte enviado a nómina mensualmente.
                        </p>

                        <p style="text-align:justify;margin:0 0 40px 0;">
                            En caso de retiro de la empresa, autorizo a Diaco S.A. a descontar el saldo existente a la
                            fecha de mi retiro de mi liquidación final de prestaciones sociales, lo cual incluye, primas
                            y extralegales, cesantías, intereses de cesantías, sueldo y cualquier otro devengo incluido
                            en mi liquidación.
                        </p>

                        <p style="margin:0 0 24px 0;">
                            <strong>Ciudad y fecha:</strong> ${sCiudadFirma}, ${localDate}&nbsp;</span>
                        </p>

                        <p style="margin:0 0 24px 0;">
                            <strong>Firma:</strong> 
                        </p>

                        <p style="margin:0;">
                            <strong>C.C. No</strong>: ${sCedula}&nbsp;</span>
                        </p>

                    </div>`
                ;

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
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Autorización de Descuento`);

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Autorizacion_Descuento.pdf`;
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
            console.error("Error generando Autorizacion de Descuento:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return { onDownloadPDFAutorizacionDescuento};
});