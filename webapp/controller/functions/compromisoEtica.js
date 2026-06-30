sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFCompromisoEtica(oController, sButtonId) {
        try {
            await oController._ensurePdfToolkit();

            const PDFLibRef      = window.PDFLib || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas || oController._html2canvasRef;

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

                const sNombre = `${user.firstName} ${user.lastName}`;
                const sCedula = user.nationalId || "";
                const localDate    = oController.getLocalDate();

                // ── Empresa ───────────────────────────────────────────────────
                const isCyrgo = user.company === "CO24";

                // ── Word ──────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    const isCyrgoWord = user.company === "CO24";
                    await wordGenerator.generateWord({
                        templatePath: isCyrgoWord
                            ? "pdf/Compromiso_Etica_Cyrgo.docx"
                            : "pdf/Compromiso_Etica.docx",
                        fileName: `${user.firstName}_${user.lastName}_Compromiso_Etica.docx`,
                        data: { sNombre, sCedula, localDate }
                    });
                    continue;
                }

            
                function _buildHtmlDiaco() {
                    return `
                    <div style="font-size:14pt;font-family:Arial,sans-serif;padding:0;margin:0;">

                        <p style="margin:0 0 5px 0;color:#E8601C;font-weight:bold;margin-bottom:20px;">Firma</p>

                        <p style="margin:0 0 4px 0;">
                            <span style="color:#E8601C;font-weight:bold;">Nombre del empleado:</span>
                            <span style="color:#E8601C;"> ${sNombre}</span>
                        </p>
                        <p style="margin:0 0 4px 0;">
                            <span style="color:#E8601C;font-weight:bold;">Número de cedula:</span>
                            <span style="color:#E8601C;"> ${sCedula}</span>
                        </p>
                        <p style="margin:0;">
                            <span style="color:#E8601C;font-weight:bold;">Fecha firma del documento:</span>
                            <span style="color:#E8601C;"> ${localDate}</span>
                        </p>
                    </div>`;
                }

                function _buildHtmlCyrgo() {
                    return `
                    <div style="font-size:14pt;font-family:Arial,sans-serif;padding:0;margin:0;">

                        <p style="margin:0 0 5px 0;color:#104574;font-weight:bold;margin-bottom:20px;">Firma</p>

                        <p style="margin:0 0 4px 0;">
                            <span style="color:#265680;font-weight:bold;">Nombre del empleado:</span>
                            <span style="color:#265680;"> ${sNombre}</span>
                        </p>
                        <p style="margin:0 0 4px 0;">
                            <span style="color:#265680;font-weight:bold;">Número de cedula:</span>
                            <span style="color:#265680;"> ${sCedula}</span>
                        </p>
                        <p style="margin:0;">
                            <span style="color:#265680;font-weight:bold;">Fecha firma del documento:</span>
                            <span style="color:#265680;"> ${localDate}</span>
                        </p>
                    </div>`;
                }

                // ── PDF — con plantilla de fondo ──────────────────────────────
                const htmlPagina1 = isCyrgo ? _buildHtmlCyrgo() : _buildHtmlDiaco();
                const contentBlocks = [htmlPagina1];

                // ── Carga plantilla de fondo ───────────────────────────────────
               const templateFile = isCyrgo
                    ? "templates/pdf/plantillaEticaCyrgo.pdf"
                    : "templates/pdf/plantillaEtica.pdf";

                const existingPdfBytes = await fetch(templateFile)
                .then(res => {
                    if (!res.ok) throw new Error(`No se pudo cargar ${templateFile} (${res.status})`);
                    return res.arrayBuffer();
                });

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                // Renderizar bloque de firma
                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width           = "794px";
                    div.style.height          = "160px";
                    div.style.padding         = "40px";
                    div.style.backgroundColor = "transparent";
                    div.style.background      = "none";
                    div.style.fontSize        = "14px";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                const canvas  = await html2canvasRef(div, { scale: 2, useCORS: true, backgroundColor: null });
                const imgData = canvas.toDataURL("image/png");
                document.body.removeChild(div);

                // Crear página con plantilla + bloque de firma
                const img     = await pdfDoc.embedPng(imgData);
                const newPage = pdfDoc.addPage([width, height]);
                newPage.drawPage(templatePageImage);

                const imgWidth  = width * 0.85;
                const imgHeight = (img.height * imgWidth) / img.width;

                newPage.drawImage(img, {
                    x:      50,
                    y:      height * 0.14,   // ← si queda muy arriba/abajo
                    width:  imgWidth,
                    height: imgHeight
                });
            }

                pdfDoc.removePage(0);
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Compromiso con la Ética`);

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const link = document.createElement("a");
                link.href     = URL.createObjectURL(blob);
                link.download = `${user.firstName}_${user.lastName}_Compromiso_Etica`;
                link.click();
                URL.revokeObjectURL(link.href);
            }

            const mensaje = aUsers.length > 1
                ? `${aUsers.length} documentos generados correctamente.`
                : "Documento generado correctamente.";
            MessageToast.show(mensaje);

        } catch (error) {
            console.error("Error generando Compromiso con la Ética:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return {
        onDownloadPDFCompromisoEtica
    };
});