sap.ui.define([], function () {
    "use strict";

    const CPI_DOCUSIGN_DESTINATION = "CPI_DOCUSIGN_DESTINATION";
    const CPI_TERM_FIJO_PATH = "cpi-term-fijo";
    const DOCUMENT_TYPES = {
        CONTRATO_TERMINO_FIJO: "CONTRATO_TERMINO_FIJO",
        CONTRATO_TERMINO_INDEFINIDO: "CONTRATO_TERMINO_INDEFINIDO",
        CONTRATO_APRENDIZAJE_LECTIVO: "CONTRATO_APRENDIZAJE_LECTIVO",
        CONTRATO_APRENDIZAJE_PRODUCTIVO: "CONTRATO_APRENDIZAJE_PRODUCTIVO",
        CONTRATO_INDEFINIDO_INTEGRAL: "CONTRATO_INDEFINIDO_INTEGRAL",
        OTRO_SI_ALIMENTACION_10000: "OTRO_SI_ALIMENTACION_10000",
        OTRO_SI_ALIMENTACION_11500: "OTRO_SI_ALIMENTACION_11500",
        OTRO_SI_ALIMENTACION_15000: "OTRO_SI_ALIMENTACION_15000",
        OTRO_SI_RODAMIENTO: "OTRO_SI_RODAMIENTO"
    };
    const TERM_FIJO_DOCUMENT_TYPE = DOCUMENT_TYPES.CONTRATO_TERMINO_FIJO;
    const PERSONAL_EMAIL_TYPE = "4083";

    const DOCUMENT_CONFIGS = {
        [DOCUMENT_TYPES.CONTRATO_TERMINO_FIJO]: _createDocumentConfig("Contrato Término Fijo", "Por favor revisa y firma el contrato a término fijo."),
        [DOCUMENT_TYPES.CONTRATO_TERMINO_INDEFINIDO]: _createDocumentConfig("Contrato Término Indefinido", "Por favor revisa y firma el contrato a término indefinido."),
        [DOCUMENT_TYPES.CONTRATO_APRENDIZAJE_LECTIVO]: _createDocumentConfig("Contrato de Aprendizaje - Etapa Lectiva", "Por favor revisa y firma el contrato de aprendizaje en etapa lectiva."),
        [DOCUMENT_TYPES.CONTRATO_APRENDIZAJE_PRODUCTIVO]: _createDocumentConfig("Contrato de Aprendizaje - Etapa Productiva", "Por favor revisa y firma el contrato de aprendizaje en etapa productiva."),
        [DOCUMENT_TYPES.CONTRATO_INDEFINIDO_INTEGRAL]: _createDocumentConfig("Contrato Indefinido Integral", "Por favor revisa y firma el contrato indefinido integral."),
        [DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_10000]: _createDocumentConfig("Otro Sí Alimentación $10.000", "Por favor revisa y firma el otro sí de alimentación por $10.000."),
        [DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_11500]: _createDocumentConfig("Otro Sí Alimentación $11.500", "Por favor revisa y firma el otro sí de alimentación por $11.500."),
        [DOCUMENT_TYPES.OTRO_SI_ALIMENTACION_15000]: _createDocumentConfig("Otro Sí Alimentación $15.000", "Por favor revisa y firma el otro sí de alimentación por $15.000."),
        [DOCUMENT_TYPES.OTRO_SI_RODAMIENTO]: _createDocumentConfig("Otro Sí Auxilio de Rodamiento", "Por favor revisa y firma el otro sí de auxilio de rodamiento.")
    };

    function _createDocumentConfig(contractType, emailBlurb) {
        return {
            contractType,
            emailSubject: "Firma requerida - " + contractType,
            emailBlurb,
            anchorString: "[[FIRMA_EMPLEADO]]",
            status: "sent"
        };
    }

    async function buildTerminoFijoPayload(oDocument) {
        return buildDocusignPayload(oDocument, TERM_FIJO_DOCUMENT_TYPE);
    }

    async function buildDocusignPayload(oDocument, sDocumentType) {
        const oConfig = DOCUMENT_CONFIGS[sDocumentType];

        if (!oConfig) {
            throw new Error("No existe configuración de DocuSign para el documento " + sDocumentType + ".");
        }

        const oUser = oDocument?.user || {};
        const sPersonalEmail = oUser.personalEmail
            || oUser.primaryEmail
            || oUser.emailPersonal
            || oUser.privateEmail
            || await _getPersonalEmail(oUser.userId);
        const sWorkEmail = oUser.email
            || oUser.businessEmail
            || oUser.defaultEmail
            || "";
        const sDocumentBase64 = cleanPdfBase64(await _documentToBase64(oDocument?.blob || oDocument?.pdfBytes));

        return {
            documentType: sDocumentType,
            contractType: oConfig.contractType,
            fileName: oDocument?.fileName || "Documento.pdf",
            fileExtension: "pdf",
            documentBase64: sDocumentBase64,
            employee: {
                userId: oUser.userId || "",
                firstName: oUser.firstName || "",
                lastName: oUser.lastName || "",
                fullName: _joinName(oUser.firstName, oUser.lastName),
                nationalId: oUser.nationalId || "",
                email: sPersonalEmail || sWorkEmail,
                personalEmail: sPersonalEmail,
                workEmail: sWorkEmail,
                phone: oUser.businessPhone || "",
                gender: oUser.gender || "",
                nationality: oUser.nationality || "",
                maritalStatus: oUser.maritalStatus || "",
                address: oUser.addressLine1 || oUser.address || ""
            },
            contract: {
                title: oConfig.contractType,
                category: sDocumentType,
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
            docusign: {
                emailSubject: oConfig.emailSubject,
                emailBlurb: oConfig.emailBlurb,
                anchorString: oConfig.anchorString,
                status: oConfig.status || "sent"
            },
            metadata: {
                sourceApplication: "gestordoccolombia",
                destination: CPI_DOCUSIGN_DESTINATION,
                generatedAt: new Date().toISOString()
            }
        };
    }

    async function _getPersonalEmail(sUserId) {
        if (!sUserId) {
            return "";
        }

        const sEscapedUserId = String(sUserId).replace(/'/g, "''");
        const sFilter = "personIdExternal eq '" + sEscapedUserId +
            "' and emailType eq '" + PERSONAL_EMAIL_TYPE + "'";
        const sUrl = "/odata/v2/PerEmail?$select=emailAddress&$filter=" +
            encodeURIComponent(sFilter) + "&$top=1&$format=json";
        const oResponse = await fetch(sUrl, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!oResponse.ok) {
            throw new Error("No se pudo consultar el email personal del colaborador " + sUserId + ".");
        }

        const oData = await oResponse.json();
        return oData?.d?.results?.[0]?.emailAddress || "";
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
            signerEmail: payload?.employee?.email,
            personalEmail: payload?.employee?.personalEmail,
            workEmail: payload?.employee?.workEmail,
            documentType: payload?.documentType,
            contractType: payload?.contractType,
            emailSubject: payload?.docusign?.emailSubject,
            anchorString: payload?.docusign?.anchorString,
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
        DOCUMENT_TYPES,
        buildDocusignPayload,
        buildTerminoFijoPayload,
        sendTerminoFijoToCPI,
        cleanPdfBase64
    };
});
