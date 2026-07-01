sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast,wordGenerator ) {
    "use strict";

    async function onDownloadPDFOtroSiAlimentacion15(oController, sButtonId, mOptions) {
        const oOptions = mOptions || {};
        const bReturnPdfDocuments = !!oOptions.returnPdfDocuments;
        const aGeneratedPdfDocuments = [];

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
                const localDate    = oController.getLocalDate();
                const localDateLong = oController.formatDateToWords(new Date());
                const sSalario    = oController.formatSalary(user.paycompvalue);
                const sSalarioLetras  = user.payCompValueWord || "";
                const sCiudadFirma = user.ciudadFirma || "";

                // ── Datos según empresa ───────────────────────────────────────
                const isCyrgo = user.company === "CO24";
                const empresaData = isCyrgo ? {
                    repNombre:     "DANIEL EDUARDO NUNCIRA AGUDELO",
                    repCC:         "79.553.641",
                    repGenero:     "identificado",
                    repCargo:      "Representante Legal",
                    empresaNombre: "CYRGO S.A.S",
                } : {
                    repNombre:     "LAURA CRISTINA CERÓN MUÑOZ",
                    repCC:         "52.705.312",
                    repGenero:     "identificada",
                    repCargo:      "Representante Legal",
                    empresaNombre: "DIACO S.A.",
                };

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    const wordTemplatePath = isCyrgo
                        ? "templates/word/Otro_Si_Alimentacion_15_Cyrgo.docx"
                        : "templates/word/Otro_Si_Alimentacion_15.docx";

                    await wordGenerator.generateWord({
                        templatePath: wordTemplatePath,
                        fileName:     `${user.firstName}_${user.lastName}_Otro_Si_Alimentacion_15.docx`,
                        data: {
                            sNombre, sCedula, localDate, localDateLong, sSalario, sSalarioLetras, sCiudadFirma
                        }
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 4px 0;margin-bottom: 20px;">
                        OTRO SI AL CONTRATO DE TRABAJO
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;"><span style="background-color:#ea80fc;">En ${sCiudadFirma}, a los ${localDateLong}, 
                    se reunieron por una parte</span> <strong>${sNombre}</strong> ${sIdentificado} con cédula de ciudadanía N.° <strong>${sCedula}</strong> 
                    como aparece al pie de su firma y quien en adelante se denominará <strong>EL TRABAJADOR</strong>, y por la otra, <strong>${empresaData.repNombre}</strong> ${empresaData.repGenero} con la C.C. No. 
                    ${empresaData.repCC} y quien actúa en representación de <strong>${empresaData.empresaNombre}</strong>, quien en 
                    adelante se denominará <strong>EL EMPLEADOR</strong>, con el fin de suscribir un acuerdo provisto de las siguientes cláusulas.</p>

                    <p style="text-align:justify;margin:0 0 10px 0;">
                        <strong>PRIMERA:</strong> El empleador de mera liberalidad y como parte de su política de bienestar otorga al trabajador un 
                        auxilio de alimentación.
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        Con esta finalidad, las partes han convenido que por cada día laborado el trabajador recibe un valor de
                        <strong>${sSalarioLetras} (${sSalario})</strong>, por día trabajado, por medio de una tarjeta recargable con la cual 
                        podrá acceder a comprar alimentos en los establecimientos que tengan y acepten el convenio con la entidad expendedora de las tarjeta.
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        <strong>SEGUNDA:</strong> Las partes convienen y así lo hacen constar que el beneficio extralegal que mediante este acuerdo se otorga, en 
                        tanto constituye un subsidio de alimentación que no tiene por finalidad retribuir de manera directa el servicio, no constituye salario 
                        para ningún efecto legal conforme a lo estipulado en el artículo 15 de la Ley 50 de 1990.
                    </p>

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        <strong>TERCERA:</strong> Las partes declaran y así lo hacen constar que el presente beneficio, en tanto deriva de la mera liberalidad
                         de la empresa, podrá ser modificado o eliminado de manera unilateral por la compañía cuando las necesidades así lo ameriten, 
                         sin que por ello se entienda desmejora en las condiciones del trabajador.
                    </p>

                    <p style="text-align:justify;margin:0 0 20px 0;">
                        Ratifico que, desde el primer pago recibido por concepto de auxilio de alimentación, este fue pactado como no salarial por las partes.
                    </p>

                    <p style="margin:0 0 60px 0;">
                        <mark style="background-color:#ea80fc;padding:0;">En constancia se firma en la ciudad de ${sCiudadFirma} a los ${localDateLong}.</mark>
                    </p>

                    <div style="width:100%;display:table;">
                        <div style="display:table-row;">
                            <div style="display:table-cell;width:50%;vertical-align:top;padding-right:20px;">
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>${empresaData.repNombre}</strong><br>
                                    C.C. No. ${empresaData.repCC}<br>
                                    ${empresaData.repCargo}
                                </div>
                            </div>
                            <div style="display:table-cell;width:50%;vertical-align:top;">
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>${sNombre}</strong><br>
                                    <mark style="background-color:#ea80fc;padding:0;"> C.C. </mark>${sCedula}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>`;

                // Insertar en DOM y esperar layout completo antes de capturar
                const div = document.createElement("div");
                div.style.position        = "absolute";
                div.style.top             = "-9999px";
                div.style.left            = "-9999px";
                div.style.width           = "794px";
                div.style.padding         = "60px 56px";
                div.style.backgroundColor = "#ffffff";
                div.style.boxSizing       = "border-box";
                div.innerHTML             = htmlRaw;
                document.body.appendChild(div);

                // Dos frames para que el navegador calcule el layout completo
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                const totalHeight = div.scrollHeight;

                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: "#ffffff",
                    width:           794,
                    height:          totalHeight,
                    windowWidth:     794,
                    scrollY:         0
                });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                // ── Crear o cargar documento según empresa ────────────────────
                let pdfDoc, templatePageImage, pageWidth, pageHeight;

                if (isCyrgo) {
                    const existingPdfBytes = await fetch("templates/pdf/PlantillaCyrgo.pdf")
                        .then(res => res.arrayBuffer());
                    pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                    const [templatePage] = pdfDoc.getPages();
                    const { width, height } = templatePage.getSize();
                    pageWidth         = width;
                    pageHeight        = height;
                    templatePageImage = await pdfDoc.embedPage(templatePage);
                } else {
                    pdfDoc    = await PDFLibRef.PDFDocument.create();
                    pageWidth = 595;
                }

                const img = await pdfDoc.embedPng(imgData);

                if (isCyrgo) {
                    const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    newPage.drawPage(templatePageImage);
                    const imgWidth  = pageWidth * 0.88;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    newPage.drawImage(img, {
                        x:      (pageWidth - imgWidth) / 2,
                        y:      pageHeight - imgHeight - 70,
                        width:  imgWidth,
                        height: imgHeight
                    });
                    pdfDoc.removePage(0);
                } else {
                    const MARGIN = 36;
                    const drawW  = pageWidth - MARGIN * 2;
                    const drawH  = (img.height * drawW) / img.width;
                    const PAGE_H = drawH + MARGIN * 2;
                    const pg     = pdfDoc.addPage([pageWidth, PAGE_H]);
                    pg.drawImage(img, {
                        x:      MARGIN,
                        y:      MARGIN,
                        width:  drawW,
                        height: drawH
                    });
                }

                const pdfBytes = await pdfDoc.save();
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Otro Si Al Contrato 15.000 Alimentación`);

                const fileName = `${user.firstName}_${user.lastName}_OtroSi_Alimentacion_15.000.pdf`;
                const blob     = new Blob([pdfBytes], { type: "application/pdf" });
                if (bReturnPdfDocuments) {
                    aGeneratedPdfDocuments.push({ user, fileName, blob, pdfBytes });
                    continue;
                }

                const link     = document.createElement("a");
                link.href      = URL.createObjectURL(blob);
                link.download  = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
            }

            if (bReturnPdfDocuments) {
                return aGeneratedPdfDocuments;
            }

            if (!sButtonId.includes("wordDataInfo")) {
                MessageToast.show(
                    aUsers.length > 1
                        ? `${aUsers.length} documentos generados correctamente.`
                        : "Documento generado correctamente."
                );
            }

        } catch (error) {
            if (oOptions.throwErrors) {
                throw error;
            }
            console.error("Error generando Otro Sí - Alimentacion 15.000:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return {onDownloadPDFOtroSiAlimentacion15};
});