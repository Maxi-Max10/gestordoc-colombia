sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    /**
     * WordGenerator — Kit de Retiro
     *
     * Estrategia: carga Kit_Retiro.docx (plantilla real con diseño),
     * reemplaza marcadores [[Variable]] dentro del XML interno del ZIP,
     * y genera la descarga. El diseño queda intacto porque nunca
     * reconstruimos el documento desde cero.
     */
    return {

        // ─── Punto de entrada desde kitRetiro.js ────────────────────────────
        onDownloadWord: async function (oController) {
            try {
                const aUsers = oController.getSelectedUsers();
                if (!aUsers.length) {
                    MessageToast.show("Seleccione al menos un colaborador.");
                    return;
                }

                // Cargamos JSZip una sola vez
                const JSZip = await _ensureJSZip();

                // Cargamos la plantilla una sola vez (fetch al servidor)
                const templateBytes = await _loadTemplate("pdf/Kit_Retiro.docx");

                for (let i = 0; i < aUsers.length; i++) {
                    const user = aUsers[i];
                    if (aUsers.length > 1) {
                        MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                    }
                    await _generateForUser(JSZip, templateBytes, user);
                }

                const msg = aUsers.length > 1
                    ? `${aUsers.length} documentos generados correctamente.`
                    : "Documento generado correctamente.";
                MessageToast.show(msg);

            } catch (err) {
                console.error("Error generando Word:", err);
                MessageToast.show("Error generando el documento: " + err.message);
            }
        }
    };

    // ─── Genera y descarga un .docx por usuario ──────────────────────────────
    async function _generateForUser(JSZip, templateBytes, user) {
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = _buildVariables(user);

        // Los archivos de contenido relevantes en un .docx
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
                xml = _replaceVariables(xml, variables);
                zip.file(path, xml);
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        _triggerDownload(blob, `${user.firstName}_${user.lastName}_Kit_Retiro.docx`);
    }

    // ─── Construye el mapa de reemplazos ─────────────────────────────────────
    function _buildVariables(user) {
        const localDate    = _formatDate(new Date());
        const sNombre      = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        const sCedula      = user.nationalId  || "";
        const sCargo       = user.title       || "";
        const sCiudadWork  = user.division    || "";
        const sSalario     = _formatSalary(user.paycompValue);
        const sIngreso     = user.hireDate    ? _formatDate(new Date(user.hireDate))   : "XXXX";
        const sSalida      = user.empEndDate  ? _formatDate(new Date(user.empEndDate)) : "XXXX";
        const sIdentif     = (user.gender === "F") ? "identificada" : "identificado";
        const sCity        = user.location || user.city || user.addressLine1 || "";
        const sCiudadFecha = sCity ? `${sCity}, ${localDate}` : localDate;
        const sCertFecha   = `${_getDayMonth()} de ${_numToWords(new Date().getFullYear())} (${new Date().getFullYear()})`;

        return {
            "[[Nombre]]":      sNombre,
            "[[Cedula]]":      sCedula,
            "[[Cargo]]":       sCargo,
            "[[CiudadWork]]":  sCiudadWork,
            "[[Salario]]":     sSalario,
            "[[FechaIngreso]]": sIngreso,
            "[[FechaSalida]]": sSalida,
            "[[Identificado]]": sIdentif,
            "[[CiudadFecha]]": sCiudadFecha,
            "[[FechaCert]]":   sCertFecha,
            // Variables de wordGenerator original — compatibilidad total
            "[[SegundoNombre]]":  user.secondName    || "",
            "[[Apellido]]":       user.lastName       || "",
            "[[Documento]]":      sCedula,
            "[[Nacionalidad]]":   user.nationality    || "",
            "[[EstadoCivil]]":    user.maritalStatus  || "",
            "[[Departamento]]":   user.state          || "",
            "[[Municipio]]":      user.custom10       || "",
            "[[CorreoTrabajo]]":  user.email          || "",
            "[[Telefono]]":       user.businessPhone  || "",
            "[[TipoTrabajo]]":    user.title          || "",
            "[[hireDate]]":       user.hireDate       || "",
            "[[HireDatePost]]":   user.HireDatePost   || "",
            "[[HireDateEnd]]":    localDate,
            "[[SueldoNumeros]]":  user.paycompValue   || "",
            "[[SueldoLetras]]":   _convertNumberToWords(user.paycompValue || 0),
            "[[Department]]":     user.department     || "",
            "[[Division]]":       user.division       || "",
            "[[Custom03]]":       user.custom03       || ""
        };
    }

    // ─── Reemplaza marcadores en el XML ──────────────────────────────────────
    // IMPORTANTE: Word puede fragmentar "[[Variable]]" en múltiples <w:r> runs.
    // Primero consolidamos el texto plano del XML para hacer el reemplazo seguro,
    // luego restauramos la estructura.
    function _replaceVariables(xml, variables) {
        // Enfoque simple y robusto: reemplazar en el texto plano del XML.
        // Los marcadores que Word no fragmenta (la mayoría) se reemplazan directo.
        // Para mayor robustez, también eliminamos los tags XML entre los corchetes.
        for (const [key, value] of Object.entries(variables)) {
            // 1. Reemplazo directo (marcador no fragmentado)
            xml = xml.split(key).join(_escapeXml(value));

            // 2. Reemplazo con posibles tags XML dentro del marcador
            //    Ejemplo: [[Nom<w:rPr/>bre]] → reemplazar el patrón con tags intercalados
            const escaped = key.replace(/\[\[/, "\\[\\[").replace(/\]\]/, "\\]\\]");
            const fragmented = new RegExp(
                "\\[\\[" +
                key.slice(2, -2).split("").map(c => c + "(?:<[^>]*>)*").join("") +
                "\\]\\]",
                "g"
            );
            xml = xml.replace(fragmented, _escapeXml(value));
        }
        return xml;
    }

    function _escapeXml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ─── Carga la plantilla .docx como ArrayBuffer ───────────────────────────
    function _loadTemplate(path) {
        return fetch(path).then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar la plantilla: ${path} (${res.status})`);
            return res.arrayBuffer();
        });
    }

    // ─── Carga JSZip dinámicamente (igual que _ensurePdfToolkit) ─────────────
    function _ensureJSZip() {
        if (window.JSZip) return Promise.resolve(window.JSZip);
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload  = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    // ─── Descarga del blob ────────────────────────────────────────────────────
    function _triggerDownload(blob, fileName) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // ─── Helpers de fecha / texto ─────────────────────────────────────────────
    function _formatDate(date) {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
    }

    function _formatSalary(value) {
        if (!value) return "";
        return "$ " + Number(value).toLocaleString("es-CO");
    }

    function _getDayMonth() {
        const d = new Date();
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getDate()} de ${months[d.getMonth()]}`;
    }

    function _numToWords(year) {
        const map = {
            2020:"dos mil veinte",2021:"dos mil veintiuno",2022:"dos mil veintidós",
            2023:"dos mil veintitrés",2024:"dos mil veinticuatro",2025:"dos mil veinticinco",
            2026:"dos mil veintiséis",2027:"dos mil veintisiete",2028:"dos mil veintiocho",
            2029:"dos mil veintinueve",2030:"dos mil treinta"
        };
        return map[year] || String(year);
    }

    function _convertNumberToWords(num) {
        if (isNaN(num) || num < 0) return "CERO PESOS CON 00/100";
        const numToWords = (n) => {
            const u = ["","UN","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE"];
            const d = ["DIEZ","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
            const c = ["CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
                       "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
            if (n === 0)   return "CERO";
            if (n < 10)    return u[n];
            if (n < 100)   return d[Math.floor(n/10)-1] + (n%10 ? " Y " + u[n%10] : "");
            if (n < 1000)  return c[Math.floor(n/100)-1] + (n%100 ? " " + numToWords(n%100) : "");
            if (n < 1e6)   return numToWords(Math.floor(n/1000)) + " MIL" + (n%1000 ? " " + numToWords(n%1000) : "");
            return String(n);
        };
        const pesos = Math.floor(num);
        const cents = Math.round((num - pesos) * 100);
        return `${numToWords(pesos)} PESOS CON ${String(cents).padStart(2,"0")}/100`;
    }

});