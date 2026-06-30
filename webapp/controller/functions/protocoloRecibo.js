sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFProtocoloRecibo(oController, sButtonId) {
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
                const localDate    = oController.getLocalDate();
                const sPlanta      = user.planta || "";
                const sArea = user.area || "";

                // ── Empresa ───────────────────────────────────────────────────
                const isCyrgo = user.company === "CO24";


                function _buildHtmlDiaco() {
                    return `
                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        Yo, <strong>${sNombre}</strong> identificado con documento de identidad N° <strong>${sCedula}</strong> declaro que he recibido 
                        la socialización del contenido del Reglamento Interno de Trabajo, Comité de convivencia Laboral y Política de Alcohol, Tabaco y Drogas.
                    </p>

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        Entiendo que Diaco S.A. podrá actualizar, corregir o alterar los contenidos en dichos documentos, los cuales serán debidamente 
                        divulgados, a través de los canales de comunicación internos, que declaro conocer.
                    </p>

                    <p style="text-align:justify;margin:0 0 80px 0;">
                        Las reglas contenidas en el Reglamento Interno de Trabajo, el Comité de convivencia Laboral y la Política de Alcohol, Tabaco y Drogas, 
                        integran mi contrato individual de trabajo con Diaco S.A., para todos los efectos, de modo que el incumplimiento de dichas reglas 
                        permitirá a la empresa aplicar las medidas establecidas en la legislación vigente, para los casos de incumplimiento de las normas 
                        laborales contractuales.
                    </p>

                    <div style="width:100%;margin-bottom:40px;text-align:center;">
                        <div style="display:inline-block;margin-left:200px;text-align:center;">
                            <div style="border-top:1.5px solid #000;width:180px;padding-top:6px;">
                                Firma
                            </div>
                        </div>
                    </div>

                    <div style="width:100%;border:1px solid #000;border-collapse:collapse;display:table;margin-top:20px;">
                        <div style="display:table-row;">
                            <div style="display:table-cell;width:33%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Fecha:</strong> ${localDate}
                            </div>
                            <div style="display:table-cell;width:33%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Planta:</strong> ${sPlanta}
                            </div>
                            <div style="display:table-cell;width:34%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Área:</strong> ${sArea}
                            </div>
                        </div>
                    </div>

                </div>`;
                }

                function _buildHtmlCyrgo() {
                    return `
                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        Código de Ética Gerdau y Cartilla de la Seguridad de la Información
                    </p>

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        Yo, ${sNombre} identificado con documento de identidad N° ${sCedula} declaro que he recibido el
                        Código de Ética Gerdau y la Cartilla de la Seguridad de la Información,
                        de la cual <strong>CYRGO S.A.S.</strong> forma parte; y conozco las normas y
                        directrices de la Empresa.
                    </p>

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        Entiendo que GERDAU podrá actualizar, corregir o alterar los contenidos
                        en dichos documentos, los cuales serán debidamente divulgados, a
                        través de los canales de comunicación internos, que declaro conocer.
                    </p>

                    <p style="text-align:justify;margin:0 0 80px 0;">
                        Las reglas contenidas en el Código de Ética Gerdau y en la Cartilla de la
                        Seguridad de la Información integran mi contrato individual de trabajo
                        con <strong>CYRGO S.A.S.</strong>, para todos los efectos, de modo que el
                        incumplimiento de dichas reglas permitirá a la empresa aplicar las
                        medidas establecidas en la legislación vigente, para los casos de
                        incumplimiento de las normas laborales contractuales.
                    </p>

                    <div style="width:100%;margin-bottom:50px;">
                        <div style="width:60%;margin-left:200px;">
                            <div style="border-top:1.5px solid #000;"></div>
                            <div style="padding-top:10px;text-align:left;">
                                Ciudad, fecha
                            </div>
                        </div>
                    </div>

                    <div style="width:100%;margin-bottom:40px;">
                        <div style="width:60%;margin-left:200px;">
                            <div style="border-top:1.5px solid #000;"></div>
                            <div style="padding-top:10px;text-align:center;font-weight:bold;">
                                Firma
                            </div>
                        </div>
                    </div>

                    <div style="width:100%;border:1px solid #000;border-collapse:collapse;display:table;margin-top:20px;">
                        <div style="display:table-row;">
                            <div style="display:table-cell;width:33%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Fecha:</strong> ${localDate}
                            </div>
                            <div style="display:table-cell;width:33%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Planta:</strong> ${sPlanta}
                            </div>
                            <div style="display:table-cell;width:34%;border:1px solid #000;padding:8px 10px;vertical-align:top;">
                                <strong>Área:</strong> ${sArea}
                            </div>
                        </div>
                    </div>

                </div>`;
                }


                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "pdf/Protocolo_Recibo.docx",
                        fileName:     `${user.firstName}_${user.lastName}_Protocolo_Recibo.docx`,
                        data: {
                            sNombre, sCedula, localDate, sPlanta, sArea
                        }
                    });
                    continue;
                }

                // ── PDF — con plantilla de fondo ──────────────────────────────
                const htmlPagina1 = isCyrgo ? _buildHtmlCyrgo() : _buildHtmlDiaco();
                const contentBlocks = [htmlPagina1];

                // ── Carga plantilla de fondo ───────────────────────────────────
               const templateFile = isCyrgo
                    ? "pdf/plantilaProtocoloReciboCyrgo.pdf"
                    : "pdf/plantilaProtocoloRecibo.pdf";

                const existingPdfBytes = await fetch(templateFile)
                    .then(res => res.arrayBuffer());

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width           = "680px";
                    div.style.height          = "1400px";
                    div.style.padding         = "10px";
                    div.style.backgroundColor = "transparent";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.style.left            = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                    const canvas  = await html2canvasRef(div, { scale: 2, useCORS: true, backgroundColor: null });
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img     = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);

                    // Dibujar plantilla de fondo
                    newPage.drawPage(templatePageImage);

                    // Contenido HTML encima
                    const imgWidth  = width * 0.78;
                    const imgHeight = (img.height * imgWidth) / img.width;

                    newPage.drawImage(img, {
                        x:      (width - imgWidth) / 2,
                        y:      height - imgHeight - 210,  // 160 = espacio que ocupa el header de la plantilla
                        width:  imgWidth,
                        height: imgHeight
                    });
                }

                pdfDoc.removePage(0);
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Protocolo Recibo`);

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Protocolo_Recibo.pdf`;
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
            console.error("Error generando Protocolo de Recibo:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return { onDownloadPDFProtocoloRecibo };
});