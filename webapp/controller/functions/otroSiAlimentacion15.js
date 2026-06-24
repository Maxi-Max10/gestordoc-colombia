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
                const localDateLong = oController.formatDateToWords(new Date());
                const sCiudadFirma = user.ciudadFirma || "";

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "pdf/Otro_Si_Alimentacion_15.docx",
                        fileName:     `${user.firstName}_${user.lastName}Otro_Si_Alimentacion_15.docx`,
                        data: {
                            sNombre, sCedula, sIdentificado ,sCiudadFirma, localDateLong
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
                    como aparece al pie de su firma y quien en adelante se denominará <strong>EL TRABAJADOR</strong>, y por la otra, <strong>LAURA CRISTINA 
                    CERÓN MUÑOZ</strong> identificada con la C.C. No. 52.705.312 y quien actúa en representación de <strong>DIACO S.A.</strong>, quien en 
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

                    <p style="margin:0 0 60px 0;">
                        <mark style="background-color:#ea80fc;padding:0;">En constancia se firma en la ciudad de ${sCiudadFirma} a los ${localDateLong}.</mark>
                    </p>

                    <div style="width:100%;display:table;">
                        <div style="display:table-row;">
                            <div style="display:table-cell;width:50%;vertical-align:top;padding-right:20px;">
                                <div style="border-top:1.5px solid #000;padding-top:6px;">
                                    <strong>LAURA CRISTINA CERÓN MUÑOZ</strong><br>
                                    C.C. No. 52.705.312<br>
                                    Representante Legal
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

                const pdfDoc = await PDFLibRef.PDFDocument.create();
                const img    = await pdfDoc.embedPng(imgData);

                // Página cuya altura se ajusta exactamente al contenido — sin cortes
                const PAGE_W = 595;
                const MARGIN = 36;
                const drawW  = PAGE_W - MARGIN * 2;
                const drawH  = (img.height * drawW) / img.width;
                const PAGE_H = drawH + MARGIN * 2;

                const pg = pdfDoc.addPage([PAGE_W, PAGE_H]);
                pg.drawImage(img, {
                    x:      MARGIN,
                    y:      MARGIN,
                    width:  drawW,
                    height: drawH
                });

                pg.drawText("[[FIRMA_EMPLEADO]]", {
                    x: PAGE_W * 0.60,
                    y: 94,
                    size: 10,
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

    // ─── Word con JSZip + plantilla OtroSi_Alimentacion_15.000.docx ──────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Otro_Si_Alimentacion_15.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Otro_Si_Alimentacion_15.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]": data.sNombre,
            "[[Cedula]]": data.sCedula,
            "[[Identificado]]": data.sIdentificado,
            "[[Fecha]]": data.localDateLong,
            "[[CiudadWork]]": data.sCiudadWork
        };

        const targets = [
            "word/document.xml",
            "word/header1.xml",
            "word/header2.xml",
            "word/footer1.xml",
            "word/footer2.xml"
        ];

        for (const path of targets) {
            if (zip.files[path]) {
                let xml = await zip.files[path].async("string");
                for (const [key, value] of Object.entries(variables)) {
                    xml = xml.split(key).join(_escXml(value));
                    const frag = new RegExp(
                        "\\[\\[" +
                        key.slice(2, -2).split("").map(c => c + "(?:<[^>]*>)*").join("") +
                        "\\]\\]", "g"
                    );
                    xml = xml.replace(frag, _escXml(value));
                }
                zip.file(path, xml);
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href  = URL.createObjectURL(blob);
        link.download = `${data.firstName}_${data.lastName}_Otro_Si_Alimentacion_15.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        MessageToast.show("Documento Word generado correctamente.");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function _escXml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function _ensureJSZip() {
        if (window.JSZip) return Promise.resolve(window.JSZip);
        return new Promise((resolve, reject) => {
            const script   = document.createElement("script");
            script.src     = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload  = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    return {
        onDownloadPDFOtroSiAlimentacion15,
        generatePdfDocuments: function (oController) {
            return onDownloadPDFOtroSiAlimentacion15(oController, "pdfDataInfo", {
                returnPdfDocuments: true,
                throwErrors: true
            });
        }
    };
});