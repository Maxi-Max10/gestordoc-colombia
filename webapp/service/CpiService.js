sap.ui.define([], function () {
    "use strict";

    const CPI_DOCUSIGN_DESTINATION = "CPI_DOCUSIGN_DESTINATION";
    const CPI_TERM_FIJO_PATH = "cpi-term-fijo";
    const TERM_FIJO_DOCUMENT_TYPE = "CONTRATO_TERMINO_FIJO";
    const TERM_FIJO_CONTRACT_TYPE = "Contrato Término Fijo";

    async function buildTerminoFijoPayload(oDocument) {
        const oUser = oDocument?.user || {};
        const sDocumentBase64 = cleanPdfBase64(await _documentToBase64(oDocument?.blob || oDocument?.pdfBytes));

        return {
            documentType: TERM_FIJO_DOCUMENT_TYPE,
            contractType: TERM_FIJO_CONTRACT_TYPE,
            fileName: oDocument?.fileName || "Contrato_Termino_Fijo.pdf",
            fileExtension: "pdf",
            documentBase64: sDocumentBase64,
            employee: {
                userId: oUser.userId || "",
                firstName: oUser.firstName || "",
                lastName: oUser.lastName || "",
                fullName: _joinName(oUser.firstName, oUser.lastName),
                nationalId: oUser.nationalId || "",
                email: oUser.email || "",
                phone: oUser.businessPhone || "",
                gender: oUser.gender || "",
                nationality: oUser.nationality || "",
                maritalStatus: oUser.maritalStatus || "",
                address: oUser.addressLine1 || oUser.address || ""
            },
            contract: {
                title: TERM_FIJO_CONTRACT_TYPE,
                category: "contratoTerminoFijo",
                position: oUser.position || oUser.title || "",
                department: oUser.department || "",
                division: oUser.division || "",
                city: oUser.custom10 || oUser.state || oUser.country || "",
                hireDate: oUser.hireDate || "",
                hireDateRaw: oUser.hireDateRaw || oUser.hireDatesimpl || "",
                endDate: oUser.endDate || "",
                salary: oUser.paycompvalue || 0,
                salaryInWords: oUser.payCompValueWord || ""
            },
            metadata: {
                sourceApplication: "gestordoccolombia",
                destination: CPI_DOCUSIGN_DESTINATION,
                generatedAt: new Date().toISOString()
            }
        };
    }

    function getTerminoFijoCpiUrl() {
        if (_isLocalRuntime()) {
            return "/" + CPI_TERM_FIJO_PATH;
        }

        const sModuleRoot = _getModuleRootUrl();

        if (sModuleRoot) {
            return sModuleRoot + CPI_TERM_FIJO_PATH;
        }

        return "/" + CPI_TERM_FIJO_PATH;
    }

    async function sendTerminoFijoToCPI(payload) {
        const sUrl = getTerminoFijoCpiUrl();

        console.log("Enviando payload a CPI:", {
            url: sUrl,
            documentType: payload?.documentType,
            fileName: payload?.fileName,
            fileExtension: payload?.fileExtension,
            base64Length: payload?.documentBase64 ? payload.documentBase64.length : 0,
            base64Start: payload?.documentBase64 ? payload.documentBase64.substring(0, 30) : ""
        });

        const response = await fetch(sUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        console.log("Status CPI:", response.status);
        console.log("Respuesta CPI texto:", responseText);

        if (!response.ok) {
            const error = new Error("Error HTTP " + response.status + ": " + responseText);
            error.statusCode = response.status;
            error.responseText = responseText;
            throw error;
        }

        if (!responseText) {
            throw new Error("CPI respondió vacío. Verificar si la ruta de CPI está entrando al iFlow.");
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            throw new Error("La respuesta de CPI no es JSON. Respuesta recibida: " + responseText.substring(0, 500));
        }
    }

    function _getModuleRootUrl() {
        try {
            const sModuleRoot = sap.ui.require.toUrl("gestordoccolombia");

            if (sModuleRoot && sModuleRoot !== "gestordoccolombia") {
                return sModuleRoot.replace(/\/?$/, "/");
            }
        } catch (e) {
            return "";
        }

        return "";
    }

    function _isLocalRuntime() {
        const sHostName = window.location.hostname;
        return sHostName === "localhost" || sHostName === "127.0.0.1";
    }

    function cleanPdfBase64(base64Pdf) {
        if (base64Pdf === null || base64Pdf === undefined) {
            throw new Error("No existe el documento PDF para enviar a CPI.");
        }

        const cleanBase64 = String(base64Pdf)
            .trim()
            .replace(/^data:application\/pdf;base64,/i, "")
            .replace(/^data:[^;]+;base64,/i, "")
            .replace(/\s/g, "");

        if (!cleanBase64) {
            throw new Error("El Base64 del PDF esta vacio.");
        }

        if (cleanBase64.indexOf("JVBER") !== 0) {
            throw new Error("El Base64 no parece corresponder a un PDF valido. Debe iniciar con JVBER.");
        }

        return cleanBase64;
    }

    async function _documentToBase64(documentPdf) {
        if (typeof Blob !== "undefined" && documentPdf instanceof Blob) {
            return _blobToBase64(documentPdf);
        }

        if (typeof ArrayBuffer !== "undefined" && documentPdf instanceof ArrayBuffer) {
            return _arrayBufferToBase64(documentPdf);
        }

        if (typeof Uint8Array !== "undefined" && documentPdf instanceof Uint8Array) {
            return _arrayBufferToBase64(documentPdf);
        }

        return documentPdf;
    }

    function _blobToBase64(blob) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = function () {
                reject(reader.error || new Error("No se pudo convertir el PDF a Base64."));
            };
            reader.readAsDataURL(blob);
        });
    }

    function _arrayBufferToBase64(buffer) {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }

        return btoa(binary);
    }

    function _joinName(firstName, lastName) {
        return [firstName, lastName].filter(Boolean).join(" ");
    }

    return {
        CPI_DOCUSIGN_DESTINATION,
        CPI_TERM_FIJO_PATH,
        buildTerminoFijoPayload,
        sendTerminoFijoToCPI,
        cleanPdfBase64
    };
});
