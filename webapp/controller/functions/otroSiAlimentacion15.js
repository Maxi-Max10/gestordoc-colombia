sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast,wordGenerator ) {
    "use strict";

    // ── Helper: convierte un recurso (imagen/pdf) a base64 (data URL) ──────
    async function _toBase64(sUrl) {
        const oResponse = await fetch(sUrl);
        if (!oResponse.ok) {
            throw new Error(`No se pudo cargar el archivo (status ${oResponse.status}): ${sUrl}`);
        }
        const oBlob = await oResponse.blob();
        return await new Promise((resolve, reject) => {
            const oReader = new FileReader();
            oReader.onloadend = () => resolve(oReader.result);
            oReader.onerror   = reject;
            oReader.readAsDataURL(oBlob);
        });
    }

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
                    empresaNombre: "CYRGO S.A.S",
                    templatePDF:   "templates/pdf/Cyrgo.pdf",
                    firmaImagen:   "img/firma_Daniel_Cyrgo.jpg"
                } : {
                    repNombre:     "LAURA CRISTINA CERÓN MUÑOZ",
                    repCC:         "52.705.312",
                    repGenero:     "identificada",
                    empresaNombre: "DIACO S.A.",
                    templatePDF:   "",
                    firmaImagen:   ""
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

                // ── Firma (solo Cyrgo) ──────────────────────────────────────
                let firmaBase64 = "";
                if (isCyrgo && empresaData.firmaImagen) {
                    try {
                        firmaBase64 = await _toBase64(empresaData.firmaImagen);
                    } catch (eFirma) {
                        console.warn("No se pudo cargar la firma de Cyrgo, se continúa sin imagen:", eFirma.message);
                    }
                }

                // ── PDF ───────────────────────────────────────────────────────

                // ── PDF: contenido común de firmas ─────────────────────────
                const sFirmaEmpleador = isCyrgo
                    ? `
                        <div style="height:80px;display:flex;align-items:flex-end;">
                            ${firmaBase64 ? `<img src="${firmaBase64}" style="height:75px;">` : ""}
                        </div>
                        <div style="border-top:1.5px solid #000;padding-top:6px;">
                            <strong>${empresaData.repNombre}</strong><br>
                            C.C. No. ${empresaData.repCC}<br>
                            ${empresaData.empresaNombre}
                        </div>
                    `
                    : `
                        <div style="height:80px;"></div>
                        <div style="border-top:1.5px solid #000;padding-top:6px;">
                            <strong>${empresaData.repNombre}</strong><br>
                            C.C. No. ${empresaData.repCC}<br>
                        </div>
                    `;

                const sCuerpoComun = `
                    <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 4px 0;margin-bottom: 20px;">
                        OTRO SI AL CONTRATO DE TRABAJO
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">En ${sCiudadFirma}, a los ${localDateLong}, 
                    se reunieron por una parte <strong>${sNombre}</strong> ${sIdentificado} N.° <strong>${sCedula}</strong> 
                    como aparece al pie de su firma y quien en adelante se denominará <strong>EL TRABAJADOR</strong>, y por la otra, <strong>${empresaData.repNombre}</strong> ${empresaData.repGenero} con la C.C. No. 
                    <strong>${empresaData.repCC}</strong> y quien actúa en representación de <strong>${empresaData.empresaNombre}</strong>, quien en 
                    adelante se denominará <strong>EL EMPLEADOR</strong>, con el fin de suscribir un acuerdo provisto de las siguientes cláusulas.</p>

                    <p style="text-align:justify;margin:0 0 10px 0;">
                        <strong>PRIMERA:</strong> El empleador de mera liberalidad y como parte de su política de bienestar otorga al trabajador un 
                        auxilio de alimentación.
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        Con esta finalidad, las partes han convenido que por cada día laborado el trabajador recibe un valor de
                        <strong>QUINCE MIL PESOS 00/100 MCTE. ($15.000,00)</strong>, por día trabajado, por medio de una tarjeta recargable con la cual 
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
                `;

                // ── HTML específico Diaco ───────────────────────────────────
                const htmlDiaco = `
                <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">
                    ${sCuerpoComun}
                    <p style="margin:0 0 120px 0;">
                        En constancia se firma en la ciudad de ${sCiudadFirma} a los ${localDateLong}.
                    </p>
                    <div style="width:100%;display:flex;gap:20px;align-items:flex-end;">
                        <div style="flex:1;">
                            ${sFirmaEmpleador}
                        </div>
                        <div style="flex:1;">
                            <div style="border-top:1.5px solid #000;padding-top:6px;">
                                <strong>${sNombre}</strong><br>
                                <strong>C.C. No.</strong> ${sCedula}
                            </div>
                        </div>
                    </div>
                </div>`;

                // ── HTML específico Cyrgo ───────────────────────────────────
                const htmlCyrgo = `
                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">
                        ${sCuerpoComun}
                        <p style="margin:0 0 80px 0;">
                            En constancia se firma en la ciudad de ${sCiudadFirma} a los ${localDateLong}.
                        </p>
                        <div style="width:100%;display:flex;gap:20px;align-items:flex-start;">
                            <div style="flex:1;">
                                ${sFirmaEmpleador}
                            </div>
                            <div style="flex:1;">
                                <div style="height:80px;"></div>
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>${sNombre}</strong><br>
                                    C.C. No. ${sCedula}
                                </div>
                            </div>
                        </div>
                    </div>`;
                
                const htmlRaw = isCyrgo ? htmlCyrgo : htmlDiaco;

                const A4_WIDTH  = 595.28;
                const A4_HEIGHT = 841.89;
                
                // Insertar en DOM y esperar layout completo antes de capturar
                const div = document.createElement("div");
                div.style.position        = "absolute";
                div.style.top             = "-9999px";
                div.style.left            = "-9999px";
                div.style.width           = "794px";
                div.style.padding         = "60px 56px";
                div.style.backgroundColor = isCyrgo ? "transparent" : "#ffffff";
                div.style.boxSizing       = "border-box";
                div.innerHTML             = htmlRaw;
                document.body.appendChild(div);

                // Dos frames para que el navegador calcule el layout completo
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                const totalHeight = div.scrollHeight;

                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: isCyrgo ? null : "#ffffff",
                    width:           794,
                    height:          totalHeight,
                    windowWidth:     794,
                    scrollY:         0
                });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                // ── Crear o cargar documento según empresa ────────────────────
                let pdfDoc, templatePageImage, signaturePage, pageWidth, pageHeight;
                pageWidth  = A4_WIDTH;
                pageHeight = A4_HEIGHT;

                if (isCyrgo && empresaData.templatePDF) {
                    const pdfResponse = await fetch(empresaData.templatePDF);
                    if (!pdfResponse.ok) {
                        throw new Error(`No se pudo cargar la plantilla PDF de Cyrgo (status ${pdfResponse.status}): ${empresaData.templatePDF}`);
                    }
                    const existingPdfBytes = await pdfResponse.arrayBuffer();
                    pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                    const [templatePage] = pdfDoc.getPages();
                    templatePageImage = await pdfDoc.embedPage(templatePage);
                } else {
                    // Diaco (o Cyrgo sin plantilla configurada): fondo blanco
                    pdfDoc = await PDFLibRef.PDFDocument.create();
                }

                const img = await pdfDoc.embedPng(imgData);   // ← ESTA LÍNEA, aquí

                if (isCyrgo) {
                    const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    signaturePage = newPage;
                    newPage.drawPage(templatePageImage, {
                        x: 0, y: 0, width: pageWidth, height: pageHeight
                    });
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
                    const MARGIN   = 36;
                    const maxDrawW = pageWidth - MARGIN * 2;
                    const maxDrawH = pageHeight - MARGIN * 2;

                    let drawW = maxDrawW;
                    let drawH = (img.height * drawW) / img.width;
                    if (drawH > maxDrawH) {
                        drawH = maxDrawH;
                        drawW = (img.width * drawH) / img.height;
                    }

                    const pg = pdfDoc.addPage([pageWidth, pageHeight]);
                    signaturePage = pg;
                    pg.drawImage(img, {
                        x: (pageWidth - drawW) / 2,
                        y: pageHeight - drawH - MARGIN,
                        width:  drawW,
                        height: drawH
                    });
                }

                signaturePage.drawText("[[FIRMA_EMPLEADO]]", {
                    x: pageWidth * 0.51,
                    y: isCyrgo ? 136 : 142,
                    size: 6,
                    color: PDFLibRef.rgb(1, 1, 1)
                });

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