sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
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

            const localDate = _formatDateLong(new Date());

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre           = `${user.firstName} ${user.lastName}`;
                const sCedula           = user.nationalId || "";
                const sIdentificado     = (user.gender === "F") ? "identificada" : "identificado";
                const sCiudadFirma      = user.location || user.city || "Bucaramanga";

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName:          user.firstName,
                        lastName:           user.lastName,
                        sNombre,
                        sCedula,
                        sIdentificado,
                        sCiudadFirma,
                        localDate
                    });
                    continue;
                }

                // ── PDF ───────────────────────────────────────────────────────
                const htmlRaw = `
                    <div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;color:#000;width:100%;box-sizing:border-box;">

                        <p style="text-align:center;font-weight:bold;font-size:13pt;margin:0 0 40px 0;">
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

    // ─── Word con JSZip + plantilla Autorizacion_Descuento.docx ──────────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Autorizacion_Descuento.docx").then(res => {
        if (!res.ok) throw new Error(`No se pudo cargar Autorizacion_Descuento.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]":           data.sNombre,
            "[[Cedula]]":           data.sCedula,
            "[[Identificado]]":     data.sIdentificado,
            "[[CiudadFirma]]":      data.sCiudadFirma,
            "[[Fecha]]":            data.localDate
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
        link.download = `${data.firstName}_${data.lastName}_Autorizacion_Descuento.docx`;
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
            const script    = document.createElement("script");
            script.src      = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload   = () => resolve(window.JSZip);
            script.onerror  = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    function _formatDateLong(date) {
        const d      = new Date(date);
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${_dayToWords(d.getDate())} (${d.getDate()}) de ${months[d.getMonth()]} de ${d.getFullYear()}`;
    }

    function _dayToWords(day) {
        const words = [
            "","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez",
            "once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho",
            "diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro",
            "veinticinco","veintiséis","veintisiete","veintiocho","veintinueve","treinta",
            "treinta y uno"
        ];
        return words[day] || String(day);
    }

    function _formatSalary(value) {
        if (!value) return "$ 0";
        return "$ " + Number(value).toLocaleString("es-CO");
    }

    function _salaryToWords(value) {
        const n = Math.round(Number(value) || 0);
        if (n === 0) return "CERO PESOS M/CTE";

        const unidades = ["","UN","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
                          "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS",
                          "DIECISIETE","DIECIOCHO","DIECINUEVE"];
        const decenas  = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA",
                          "SESENTA","SETENTA","OCHENTA","NOVENTA"];
        const centenas = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
                          "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];

        function grupo(n) {
            let s = "";
            const c = Math.floor(n / 100);
            const r = n % 100;
            if (c > 0) { s += (c === 1 && r === 0) ? "CIEN" : centenas[c]; if (r > 0) s += " "; }
            if (r > 0) {
                if (r < 20) { s += unidades[r]; }
                else {
                    const d = Math.floor(r / 10), u = r % 10;
                    if (r >= 21 && r <= 29) {
                        s += ["","VEINTIÚN","VEINTIDÓS","VEINTITRÉS","VEINTICUATRO","VEINTICINCO",
                              "VEINTISÉIS","VEINTISIETE","VEINTIOCHO","VEINTINUEVE"][u];
                    } else { s += decenas[d]; if (u > 0) s += " Y " + unidades[u]; }
                }
            }
            return s;
        }

        const millones = Math.floor(n / 1000000);
        const miles    = Math.floor((n % 1000000) / 1000);
        const resto    = n % 1000;
        let resultado  = "";
        if (millones > 0) { resultado += (millones === 1) ? "UN MILLÓN" : grupo(millones) + " MILLONES"; if (miles > 0 || resto > 0) resultado += " "; }
        if (miles > 0)    { resultado += (miles === 1)    ? "MIL"       : grupo(miles)    + " MIL";      if (resto > 0)              resultado += " "; }
        if (resto > 0)    { resultado += grupo(resto); }
        return resultado + " PESOS M/CTE";
    }

    return { onDownloadPDFAutorizacionDescuento};
});