sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/pdfGenerator" // ← Importo para usar funciones auxiliares
], function (MessageToast, pdfGenerator) { // ← AGREGADO: recibir pdfGenerator como parámetro
    "use strict";

    async function onDownloadPDFDesahucio(oController, sButtonId) {
        try {
            // tengo la fecha manual
            const sManualDate = oController._manualDesahucioDate;
            
            if (!sManualDate) {
                MessageToast.show("Por favor, ingrese la fecha de Desahucio.");
                return;
            }

            const sFormattedDate = oController.formatDateToSpanish(sManualDate);

            // me aseguro q PDF.js y html2canvas cargaron
            await oController._ensurePdfToolkit();
            const PDFLibRef = window.PDFLib || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas || oController._html2canvasRef;

            if (!PDFLibRef || !html2canvasRef) {
                throw new Error("No se pudieron cargar las bibliotecas PDF/Canvas requeridas.");
            }

            // obtengo los usuarios seleccionados
            const aUsers = oController.getSelectedUsers();
            if (aUsers.length === 0) {
                MessageToast.show("Seleccione al menos un colaborador.");
                return;
            }

            // proceso a cada usuario, y se les hace un documento individual
            for (let i = 0; i < aUsers.length; i++) {
                const oUser = aUsers[i];

                // para mostrar el progreso si hay múltiples usuarios
                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                // se geenra el HTML del documento
                const htmlRaw = `
                    <p><br></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>${sFormattedDate}</span></p>
                    <p><br></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>&nbsp;</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Señor(a):</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><span style="font-size:15px;">${oUser.firstName} ${oUser.lastName} ${oUser.secondLastName || ''}</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Sus Manos.&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Distinguido(a)&nbsp;</span><span style='font-size:16px;font-family:"Times New Roman",serif;'>${oUser.salut} ${oUser.lastName}</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;text-align:justify;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Por medio de la presente le informamos que a partir de la fecha, la empresa ha decidido rescindir el contrato de trabajo que se había acordado con usted, de acuerdo a lo establecido en el &nbsp;Artículo 75, 76, 80 y 86 del Código de Trabajo vigente.&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;text-align:justify;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Le invitamos a que dentro del plazo de 10 días que dispone el artículo 86 del Código de Trabajo, se presente usted personalmente a nuestras oficinas a retirar los valores que le puedan corresponder, de acuerdo con la legislación aplicable.&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Atentamente,&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>&nbsp;</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><strong><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Glenys Reyes Henriquez</span></strong></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:10.0pt;margin-left:-.05pt;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;border:none;'><strong><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Gerente de Gestión de Personas.</span></strong></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>&nbsp;</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>&nbsp;</span></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Firma &nbsp;___________________________________________&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Cédula No. &nbsp;_______________________________________&nbsp;</span></p>
                    <p style='margin-top:14.0pt;margin-right:0cm;margin-bottom:14.0pt;margin-left:0cm;text-indent:-.1pt;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;border:none;'><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Fecha &nbsp; ___________________________________________&nbsp;</span></p>
                `;

                // chequea qué botón se apretó para generar el Word o el PDF
                if (sButtonId === "container-gestordoccolombia---View1--wordDataInfo") {
                    // creo el Word
                    const header = `
                        <html xmlns:o='urn:schemas-microsoft-com:office:office'
                              xmlns:w='urn:schemas-microsoft-com:office:word'
                              xmlns='http://www.w3.org/TR/REC-html40'>
                        <head><meta charset='utf-8'><title>Documento Word</title></head><body>`;
                    const footer = "</body></html>";
                    const fullHTML = header + htmlRaw + footer;

                    const blob = new Blob(['\ufeff', fullHTML], {
                        type: "application/msword"
                    });

                    const fileName = `${oUser.firstName}_${oUser.lastName}_Carta_Desahucio.doc`;
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();

                    // limpio
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                } else {
                    // genero PDF
                    const contentBlocks = htmlRaw.split("<!--PAGEBREAK-->");
                    const existingPdfBytes = await fetch("pdf/hojaMetaldom.pdf").then(res => res.arrayBuffer());
                    const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                    const [templatePage] = pdfDoc.getPages();
                    const { width, height } = templatePage.getSize();
                    const templatePageImage = await pdfDoc.embedPage(templatePage);

                    for (const blockHtml of contentBlocks) {
                        const div = document.createElement("div");
                        
                        // simulo el tamaño de una hoja A4
                        div.style.width = "794px";
                        div.style.height = "760px";
                        div.style.padding = "40px";
                        div.style.backgroundColor = "white";
                        div.style.fontSize = "16px";
                        div.style.boxSizing = "border-box";
                        div.style.position = "absolute";
                        div.style.top = "-9999px";
                        div.innerHTML = blockHtml;
                        document.body.appendChild(div);

                        // capturo el div
                        const canvas = await html2canvasRef(div, {
                            scale: 2,
                            useCORS: true
                        });
                        const imgData = canvas.toDataURL("image/png");

                        // elimino del DOM
                        document.body.removeChild(div);

                        const img = await pdfDoc.embedPng(imgData);
                        const newPage = pdfDoc.addPage([width, height]);
                        newPage.drawPage(templatePageImage);

                        const imgWidth = width * 0.9;
                        const imgHeight = (img.height * imgWidth) / img.width;

                        newPage.drawImage(img, {
                            x: (width - imgWidth) / 2,
                            y: height - imgHeight - 130,
                            width: imgWidth,
                            height: imgHeight,
                        });
                    }

                    // quito la pagina de la plantilla original
                    pdfDoc.removePage(0);

                    // guardo y descargo PDF
                    const pdfBytes = await pdfDoc.save();
                    const fileName = `${oUser.firstName}_${oUser.lastName}_Carta_Desahucio.pdf`;

                    const blob = new Blob([pdfBytes], { type: "application/pdf" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    link.click();

                    // limpio
                    URL.revokeObjectURL(link.href);
                }
            }

            // mensaje para q sepas que salió todo joya
            const mensaje = aUsers.length > 1
                ? `${aUsers.length} documentos generados correctamente.`
                : "Documento generado correctamente.";
            MessageToast.show(mensaje);

        } catch (error) {
            console.error("Error generando el documento:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return {
        onDownloadPDFDesahucio
    };
});