sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
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

            const localDate = _formatDate(new Date());

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre = `${user.firstName} ${user.lastName}`;
                const sCedula = user.nationalId || "";

                // ── HTML del bloque de firma ──────────────────────────────────
                const htmlFirma = `
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
                    </div>
                `;

                // ── Word ──────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName: user.firstName,
                        lastName:  user.lastName,
                        sNombre,
                        sCedula,
                        localDate
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const existingPdfBytes = await fetch("pdf/plantillaEtica.pdf")
                    .then(res => res.arrayBuffer());

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                // Renderizar bloque de firma
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
                div.innerHTML             = htmlFirma;
                document.body.appendChild(div);

                const canvas = await html2canvasRef(div, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null
                });
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

                pdfDoc.removePage(0);

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

    // ─── Word con JSZip + plantilla ───────────────────────────────────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Compromiso_Etica.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Compromiso_Etica.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]":    data.sNombre,
            "[[Cedula]]":    data.sCedula,
            "[[localDate]]": data.localDate
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
        link.href     = URL.createObjectURL(blob);
        link.download = `${data.firstName}_${data.lastName}_Compromiso_Etica.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
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
            const script  = document.createElement("script");
            script.src    = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload  = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    function _formatDate(date) {
        const d = new Date(date);
        // Solo corregir timezone si el input es un string ISO (hireDate, empEndDate)
        if (typeof date === "string") {
            d.setDate(d.getDate() + 1);
        }
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
    }

    return {
        onDownloadPDFCompromisoEtica
    };
});