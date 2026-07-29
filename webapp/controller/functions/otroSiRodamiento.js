sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFOtroSiRodamiento(oController, sButtonId, mOptions) {
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
                const sCiudadFirma = user.ciudadFirma || "";
                const localDate   = oController.getLocalDate();
                const sSalario    = oController.formatSalary(user.paycompvalue);
                const sSalarioLetras  = user.payCompValueWord || "" 

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "templates/word/Otro_Si_Rodamiento.docx",
                        fileName:     `${user.firstName}_${user.lastName}Otro_Si_Rodamiento.docx`,
                        data: {
                            sNombre, sCedula, sIdentificado ,sCiudadFirma, localDate, sSalario, sSalarioLetras
                        }
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                    <p style="text-align:center;font-weight:bold;font-size:15pt;margin:0 0 4px 0;">
                        OTRO SI AL CONTRATO DE TRABAJO
                    </p>
                    <p style="text-align:center;font-weight:normal;font-size:10.5pt;margin:0 0 28px 0;">
                        AUXILIO NO SALARIAL DE TRANSPORTE EXTRALEGAL
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        Siendo, el ${localDate}, se reunieron por una parte <strong>${sNombre}</strong>
                        ${sIdentificado} N.° ${sCedula} como aparece al pie de su firma y quien en adelante se denominará
                        EL TRABAJADOR, y por la otra, <strong>LAURA CRISTINA CERÓN MUÑOZ</strong> identificada con la C.C. No. 52.705.312
                        y quien actúa en representación de <strong>DIACO S.A.</strong>, quien en adelante
                        se denominará EL EMPLEADOR, con el fin de suscribir un acuerdo
                        provisto de las siguientes cláusulas.
                    </p>

                    <p style="text-align:justify;margin:0 0 10px 0;">
                        <strong>PRIMERA:</strong> EL EMPLEADOR por mera liberalidad, en consideración a la
                        necesidad que tiene EL TRABAJADOR de desplazarse a diferentes lugares en virtud del
                        cargo que desempeña, y con el objeto de proporcionar un instrumento que le permita
                        cumplir los fines de su cargo, otorga a EL TRABAJADOR un auxilio de transporte
                        extralegal.
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        En consecuencia, de lo anterior, las partes han convenido que EL TRABAJADOR reciba
                        un valor de <strong>UN MILLÓN CUATROCIENTOS SETENTA Y UN MIL DOCIENTOS SESENTA Y SIETE PESOS M/CTE ($1.471.267)</strong>, como monto fijo
                        mensual que será consignado a la cuenta de nómina del colaborador, con el ánimo de
                        reintegrar al trabajador el dinero que gaste en su movilización para la realización
                        del cargo que desempeña en Diaco S.A.
                    </p>

                    <p style="text-align:justify;margin:0 0 16px 0;">
                        <strong>SEGUNDA:</strong> Las partes convienen y así lo hacen constar que el
                        beneficio extralegal que mediante este acuerdo se otorga, no constituye salario para
                        ningún efecto legal conforme a lo estipulado en el artículo 15 de la Ley 50 de 1990,
                        en tanto constituye un auxilio de transporte que no tiene por finalidad retribuir de
                        manera directa el servicio prestado por el trabajador.
                    </p>

                    <p style="text-align:justify;margin:0 0 28px 0;">
                        <strong>TERCERA:</strong> Las partes declaran y así lo hacen constar que el presente
                        beneficio, en tanto deriva de la mera liberalidad del EL EMPLEADOR, podrá ser
                        modificado o eliminado de manera unilateral por EL EMPLEADOR cuando las necesidades
                        así lo ameriten, sin que por ello se entienda desmejora en las condiciones del
                        trabajador.
                    </p>

                    <p style="margin:0 0 60px 0;">
                        En constancia se firma en ${sCiudadFirma}, el ${localDate}.
                    </p>
                    <br>

                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="width:50%;padding-right:20px;vertical-align:top;">
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>LAURA CRISTINA CERÓN MUÑOZ</strong><br>
                                    C.C. No. 52.705.312<br>
                                    Representante Legal
                                </div>
                            </td>
                            <td style="width:50%;vertical-align:top;">
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>${sNombre}</strong><br>
                                    C.C. No. ${sCedula}
                                </div>
                            </td>
                        </tr>
                    </table>

                </div>`;

                const div = document.createElement("div");
                div.style.width           = "714px";
                div.style.padding         = "40px";
                div.style.backgroundColor = "#ffffff";
                div.style.boxSizing       = "border-box";
                div.style.position        = "absolute";
                div.style.top             = "-9999px";
                div.style.left            = "-9999px";
                div.style.webkitFontSmoothing = "antialiased";
                div.style.textRendering       = "optimizeLegibility";
                div.innerHTML = htmlRaw;
                document.body.appendChild(div);

                // fuerza reflow y evita que html2canvas mida antes de tiempo
                void div.offsetHeight;
                await new Promise(requestAnimationFrame);
                // Espera a que todas las fuentes estén listas antes de capturar
                await document.fonts.ready;

                const canvas = await html2canvasRef(div, {
                    scale:           2,
                    useCORS:         true,
                    backgroundColor: "#ffffff",
                    height:          div.scrollHeight,
                    windowHeight:    div.scrollHeight
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

                    if (p === totalPgs - 1) {
                        pg.drawText("[[FIRMA_EMPLEADO]]", {
                            x: PAGE_W * 0.50,
                            y: 155,
                            size: 10,
                            color: bReturnPdfDocuments
                                ? PDFLibRef.rgb(1, 1, 1)
                                : PDFLibRef.rgb(1, 0, 0)
                        });
                    }
                }

                const pdfBytes = await pdfDoc.save();
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Otro Si Al Contrato de Trabajo Rodamiento`);

                const fileName = `${user.firstName}_${user.lastName}_OtroSi_Rodamiento.pdf`;
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
            console.error("Error generando Otro Sí - Rodamiento:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return {onDownloadPDFOtroSiRodamiento};
});