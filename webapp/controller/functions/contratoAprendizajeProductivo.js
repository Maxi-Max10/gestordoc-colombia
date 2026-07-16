sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"
], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFContratoAprendizajeProductivo(oController, sButtonId, mOptions) {
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

                const sNombre      = `${user.firstName} ${user.lastName}`;
                const sCedula      = user.nationalId || "";
                const sCiudadExpedicion = user.docExpeditionCity || "";
                const sFechaNacimiento = user.dateOfBirth 
                    ? oController.formatDateRaw(user.dateOfBirth) 
                    : "";
                const sDireccion = (user.addressLine1 || "").replace(/\s+/g, " ").trim();
                const sTelefono    = user.personalPhone || "";               
                const sfechaContratacion = oController.formatDateRaw(user.originalStartDate);
                const sfechaBaja = oController.formatDateRaw(user.endDateBaja);
                const sInstitucion = await oController._getInstitucionFormacion(user.userId);
                const sCargo      = oController.resolveGender(user.title || "", user.gender);
                const sNit = oController.sManualNit || "";

                /*
                 ── Fecha de terminación: inicio + 13 meses y 19 días ────────
                const dFechaInicio = new Date(user.originalStartDate);
                const dFechaFin = new Date(dFechaInicio);
                dFechaFin.setMonth(dFechaFin.getMonth() + 6);
                dFechaFin.setDate(dFechaFin.getDate() + 0);
                const sfechaTerminacion = oController.formatDateRaw(dFechaFin);
                const sfechaTerminacionLarga = oController.formatDateToWords(dFechaFin);
                */

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await wordGenerator.generateWord({
                        templatePath: "templates/word/Contrato_Aprendizaje_Productivo.docx",
                        fileName:     `${user.firstName}_${user.lastName}Contrato_Aprendizaje_Productivo.docx`,
                        boldPlaceholders: ["[[Nombre]]", "[[Cedula]]", "[[CiudadExpedicion]]"],
                        boldParagraphContains: "Entre los suscritos",
                        signatureGapBefore: 720,
                        data: {
                            sNombre, sCedula, sCiudadExpedicion ,sFechaNacimiento, sDireccion, sTelefono, sfechaContratacion, sfechaBaja, sCargo, sInstitucion, sNit
                        }
                    });
                    continue;
                }

                // ══════════════════════════════════════════════════════════════
                // PÁGINAS HTML — CONTRATO APRENDIZAJE LECTIVO
                // Estructura según PDF de referencia
                // ══════════════════════════════════════════════════════════════
                const STYLE = `font-family:Arial,sans-serif;font-size:9pt;line-height:1.2;padding:25px 24px 20px 24px;color:#000;`;
                const HEADER = `
                    <div style="
                        width:100%;
                        text-align:center;
                        font-weight:bold;
                        line-height:1.2;
                        margin-bottom:30px;
                    ">
                        <div style="font-size:11pt; text-decoration:underline;text-underline-offset: 2px;">
                            CONTRATO DE APRENDIZAJE
                        </div>
                    </div>
                `;

                // ── Helpers (mismos del indefinido) ───────────────────────────────────────────
                function _itemContrato(letra, texto) {
                    return `
                        <div style="
                            display:flex;
                            align-items:flex-start;
                            margin:0 0 9px 0;
                            font-size:9pt;
                            line-height:1.25;
                        ">

                            <div style="
                                width:28px;
                                font-weight:bold;
                                padding-top:1px;
                                flex-shrink:0;
                            ">
                                ${letra}
                            </div>

                            <div style="
                                flex:1;
                                text-align:justify;
                            ">
                                ${texto}
                            </div>

                        </div>
                    `;
                }

                function _tituloContrato(numero, titulo, texto) {
                    return `
                        <div style="margin:18px 0 12px 0;text-align:justify;">
                            <strong>${numero}</strong>
                            <strong>${titulo}</strong>
                            ${texto}
                        </div>
                    `;
                }

                function _paragrafoContrato(titulo, texto) {
                    return `
                        <div style="text-align:justify;margin:14px 0 10px 0;">
                            <strong>${titulo}</strong> ${texto}
                        </div>
                    `;
                }

                function _bloqueContrato(contenido) {
                    return `
                        <div style="text-align:justify;margin:0 0 14px 0;">
                            ${contenido}
                        </div>
                    `;
                }

                function _bulletContrato(texto) {
                    return `
                        <div style="
                            display:flex;
                            align-items:flex-start;
                            margin:0 0 10px 28px;
                            line-height:1.25;
                        ">
                            <div style="
                                width:18px;
                                flex-shrink:0;
                                font-weight:bold;
                            ">
                                ●
                            </div>

                            <div style="
                                flex:1;
                                text-align:justify;
                            ">
                                ${texto}
                            </div>
                        </div>
                    `;
                }

                function _continuacionItemContrato(texto) {
                    return `
                        <div style="margin:0 0 14px 38px;text-align:justify;">
                            ${texto}
                        </div>
                    `;
                }

                // ── PÁGINA 1 — Tablas + intro + PRIMERA ───────────────────────────────────────
                const htmlPagina1 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:9.5pt;
                        margin:0 0 10px 0;
                        border:1px solid #000000;
                    ">
                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                width:45%;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                EMPRESA
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                DIACO S.A
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                NIT
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                891800111
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                DIRECCION
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                CALLE 93 B N° 18- 12
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                TELEFONO
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                6-003 900
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                REPRESENTANTE LEGAL
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                DANIEL EDUARDO NUNCIRA AGUDELO
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                CARGO
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">
                                GERENTE RELACIONES LABORALES Y SEGURIDAD EMPRESARIAL
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                CÉDULA
                            </td>
                            <td style="padding:1px 5px;">
                                74.371.977
                            </td>
                        </tr>
                    </table>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:9.5pt;
                        margin:0 0 10px 0;
                        border:1px solid #000000;
                    ">
                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                width:45%;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                NOMBRE APRENDIZ
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sNombre}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                CÉDULA O TARJETA IDENTIDAD
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sCedula}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                FECHA NACIMIENTO
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sFechaNacimiento}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                DIRECCION
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sDireccion}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                TELEFONO
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sTelefono}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                FECHA INICIACIÓN CONTRATO
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sfechaContratacion}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                FECHA TERMINACIÓN CONTRATO
                            </td>
                            <td style="padding:1px 5px;">${sfechaBaja}</td> 
                        </tr>
                    </table>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:9.5pt;
                        margin:0 0 14px 0;
                        border:1px solid #000000;
                    ">
                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                border-bottom:1px solid #000000;
                                padding:1px 5px;
                                width:45%;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                INSTITUCIÓN DE FORMACION:
                            </td>
                            <td style="border-bottom:1px solid #000000;padding:1px 5px;">${sInstitucion}</td>
                        </tr>

                        <tr>
                            <td style="
                                border-right:1px solid #000000;
                                padding:1px 5px;
                                font-weight:bold;
                                background-color:#DCEEFF;
                            ">
                                NIT:
                            </td>
                            <td style="padding:1px 5px;">${sNit}</td>
                        </tr>
                    </table>

                    <div style="text-align:center;font-weight:bold;margin:10px 0 14px 0;font-size:10pt;">CLÁUSULAS</div>

                    ${_bloqueContrato(`
                        Entre los suscritos a saber, <strong>LAURA CRISTINA CERÓN MUÑOZ</strong>, identificado con la cédula de ciudadanía
                        No. <strong>52.705.312</strong> de Pasto - Nariño, actuando como Representante de la Empresa <strong>DIACO S.A.</strong> Sociedad
                        identificada con el número de NIT 891.800.111-5, quien para los efectos del presente Contrato se
                        denominará <strong>EMPRESA</strong>, y <strong>${sNombre}</strong> identificada con cédula de ciudadanía No.
                        <strong>${sCedula}</strong> Expedida en <strong>${sCiudadExpedicion}</strong>, quien para los efectos del presente contrato se
                        denominará el <strong>APRENDIZ</strong>, se suscribe el presente Contrato de Aprendizaje, el cual, conforme el
                        artículo 21 de la Ley 2466 de 2025 es considerado un contrato laboral especial a término fijo y de
                        acuerdo a las siguientes cláusulas:
                    `)}

                    ${_tituloContrato(
                        "PRIMERA:",
                        "OBJETO.",
                        `
                        El presente contrato tiene como objeto garantizar al <st
                        APRENDIZ la formación
                        profesional metódica y requerida dentro del plan de estudios del APRENDIZ en la especialidad de
                        <strong>${sCargo}</strong>, la cual se desarrollara en su etapa práctica por el ${sInstitucion}
                        o por la Institución Educativa donde el aprendiz adelanta sus estudios) y la <strong>EMPRESA</strong>,
                        proporcionara los medios para que el APRENDIZ adquiera formación profesional y metódica, dentro
                        de una relación de aprendizaje, la cual de ninguna manera implica subordinación laboral por parte de
                        la <strong>EMPRESA</strong> sobre el <strong>APRENDIZ</strong> pues este no es considerado para ningún efecto como un trabajador
                        de la <strong>EMPRESA</strong> y la subordinación se limita a las actividades propias del aprendizaje de acuerdo con
                        el literal b) del artículo 21 de la Ley 2466 de 2025.
                        `
                    )}

                </div>`;


                // ── PÁGINA 2 ──────────────────────────────────────────────────────────────────
                const htmlPagina2 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_bloqueContrato(`
                        En ese sentido, las partes suscriben el presente contrato de aprendizaje como una forma especial
                        dentro del Derecho Laboral mediante la cual una persona natural desarrolla formación teórica
                        práctica en una entidad de formación legalmente autorizada, a cambio de que esta le proporcione los
                        medios para adquirir formación profesional metódica y completa requerida en el oficio, actividad u
                        ocupación, bajo la tutela de una <strong>EMPRESA</strong>.
                    `)}

                    ${_paragrafoContrato(
                        "PARÁGRAFO:",
                        `
                        Este contrato no podrá utilizarse para sustituir trabajadores, funciones permanentes o
                        cargos estructurales dentro de la <strong>EMPRESA</strong>, conforme lo dispone expresamente el numeral 6 del
                        Artículo 21 de la Ley 2466 de 2025.
                        `
                    )}

                    ${_tituloContrato(
                        "SEGUNDA:",
                        "",
                        `De acuerdo con el artículo 21 de la Ley 2466 de 2025, el contrato de aprendizaje es
                        considerado un contrato laboral especial a término fijo, por lo que, este tendrá, un término de
                        duración de 6 meses, comprendidos entre <strong>${sfechaContratacion} fecha</strong> de iniciación del Contrato; y
                        el <strong>${sfechaBaja}</strong> de terminación de este, sin que pueda exceder de tres (3) años. Así las
                        cosas, se deja previsto que el contrato finalizará en la fecha de terminación indicada anteriormente,
                        sin que sea necesaria la presentación de un aviso previo o el cumplimiento de un requisito adicional`
                    )}


                    ${_tituloContrato(
                        "TERCERA.",
                        "- OBLIGACIONES.",
                        ""
                    )}

                    ${_itemContrato("1)", `
                        En virtud del presente contrato la <strong>EMPRESA</strong> deberá:
                    `)}

                    ${_itemContrato("a)", `
                        Facilitar al <strong>APRENDIZ</strong> los medios para que tanto en las fases Lectiva y Productiva, reciba Formación
                        Profesional Integral, metódica y completa en la ocupación u oficio materia del presente contrato.
                    `)}

                    ${_itemContrato("b)", `
                        Diligenciar y reportar al respectivo Centro de Formación Profesional Integral del SENA (o por la
                        Institución Educativa donde el aprendiz adelanta sus estudios) las evaluaciones y certificaciones del
                        <strong>APRENDIZ</strong> en su fase productiva del aprendizaje.
                    `)}

                    ${_itemContrato("c)", `
                        Reconocer mensualmente al <strong>APRENDIZ</strong> el apoyo de sostenimiento el cual de acuerdo con el literal
                        d) del artículo 21 de la Ley 2466 de 2025, se reconoce para garantizar el proceso de aprendizaje, de la
                        siguiente manera:
                    `)}

                    ${_itemContrato("d)", `
                        Si es formación tradicional, el aprendiz recibirá como mínimo en la fase lectiva el equivalente al
                        75% de un salario mínimo mensual legal vigente, y en la etapa práctica, el equivalente al 100% de un
                        salario mínimo mensual legal vigente.
                    `)}

                    ${_tituloContrato(
                        "",
                        "PARÁGRAFO PRIMERO:",
                        `
                        Este apoyo de sostenimiento no constituye salario en forma alguna ni es
                        considerado una contraprestación directa de un servicio a favor de la <strong>EMPRESA</strong>, esto, pues el
                        <strong>APRENDIZ</strong> se encuentra vinculado a la <strong>EMPRESA</strong> a través de un contrato de aprendizaje para
                        desarrollar una formación profesional metódica, lo cual no implica la prestación de servicios a favor
                        de la <strong>EMPRESA</strong>, por lo que, el apoyo de sostenimiento se da como un reconocimiento para garantizar
                        el proceso de aprendizaje y desarrollo de la formación profesional metódica. Adicionalmente, se
                        `
                    )}

                </div>`;


                // ── PÁGINA 3 ──────────────────────────────────────────────────────────────────
                const htmlPagina3 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_bloqueContrato(`
                        reitera que el <strong>APRENDIZ</strong> no es considerado para ningún efecto como trabajador de la <strong>EMPRESA</strong>,
                        siendo la naturaleza del vínculo que los une la de aprendizaje.
                    `)}

                    ${_tituloContrato(
                        "",
                        "PARÁGRAFO SEGUNDO:",
                        `
                        Este apoyo de sostenimiento no podrá ser regulado a través de convenios o
                        contratos colectivos o fallos arbítrales que recaigan sobre estos últimos.
                        `
                    )}

                    ${_itemContrato("a)", `
                        Durante la etapa práctica, se realizarán los aportes a seguridad social y los subsistemas que
                        apliquen de acuerdo con las normas que regulen la materia y en los términos que dichas
                        normas lo indiquen
                    `)}

                    ${_itemContrato("b)", `
                        Dar al aprendiz la dotación de seguridad industrial, cuando el desarrollo de la etapa productiva así
                        lo requiera, para la protección contra accidentes y enfermedades profesionales.
                    `)}

                    ${_itemContrato("c)", `
                        Proporcionar a <strong>EL APRENDIZ</strong> la información necesaria y los espacios físicos para realizar del proceso
                        de práctica y dar cumplimiento a los programas establecidos,
                    `)}

                    ${_itemContrato("d)", `
                        Designar una persona para que respalde y facilite las acciones de práctica de <strong>EL APRENDIZ.</strong>
                    `)}

                    ${_itemContrato("e)", `
                        Certificar el tiempo correspondiente a la etapa práctica de <strong>EL APRENDIZ,</strong> sin que este documento
                        se considere una certificación laboral.
                    `)}

                    ${_itemContrato("f)", `
                        Durante la fase práctica o la formación dual, se le reconocerán al <strong>APRENDIZ</strong> por expresa disposición
                        normativa (artículo 21 de la Ley 2466 de 2025) <em>"las prestaciones, auxilios y demás derechos propios
                        del contrato laboral"</em>, sin que esto configure la existencia de un contrato de trabajo, sino que, en
                        cumplimiento de la norma mencionada, se le realizarían estos reconocimientos.
                    `)}

                    ${_tituloContrato(
                        "2)",
                        "POR PARTE DEL APRENDIZ.",
                        `
                        - Por su parte se compromete en virtud del presente contrato a:
                        `
                    )}

                    ${_itemContrato("a)", `
                        Como estudiante, deberá concurrir puntualmente a las clases durante los periodos de
                        enseñanza para así recibir la Formación Profesional Integral a que se refiere el presente
                        Contrato, someterse a los reglamentos y normas establecidas por el respectivo Centro de
                        Formación del SENA (o de la Institución Educativa donde el aprendiz adelante sus estudios), y
                        poner toda diligencia y aplicación para lograr el mayor rendimiento en su formación.
                    `)}

                    ${_itemContrato("b)", `
                        Concurrir puntualmente al lugar asignado por la <strong>EMPRESA</strong> para desarrollar su formación en la
                        fase productiva, durante el periodo establecido para el mismo, en las actividades que se le
                        encomiende y que guarde relación con la Formación, cumpliendo con las indicaciones que le
                        señale la <strong>EMPRESA</strong> dentro de las actividades propias de aprendizaje.
                    `)}

                    ${_itemContrato("c)", `
                        Proporcionar la información necesaria para que la <strong>EMPRESA</strong> lo afilie bajo el cotizante
                        correspondiente al sistema de seguridad social en los subsistemas correspondientes de
                        acuerdo con la etapa en la que el <strong>APRENDIZ</strong> se encuentre y de acuerdo con las normas
                        vigentes que regulen la materia.
                    `)}

                    ${_itemContrato("d)", `
                        Poner toda la diligencia y aplicación para lograr el mayor rendimiento en su formación;
                    `)}

                    ${_itemContrato("e)", `
                        Cuando por algún motivo de fuerza mayor el <strong>APRENDIZ</strong> no pueda recibir su formación teórica,
                        en todo caso deberá cumplir su fase práctica con la <strong>EMPRESA</strong>,
                    `)}

                    ${_itemContrato("f)", `
                        Como estudiante en la ejecución de la etapa práctica o dual, al estar dentro de las instalaciones
                        de la <strong>EMPRESA</strong>, deberá acatar fielmente sus políticas institucionales, en especial las
                    `)}


                </div>`;


                // ── PÁGINA 4 ──────────────────────────────────────────────────────────────────
                const htmlPagina4 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_continuacionItemContrato( `
                        relacionadas con el Código de Ética, Código de Vestimenta, el Sistema de Seguridad de la
                        Información, Uso de la red de Internet y correo electrónico y uso de la tecnología y
                        herramientas de usuario, aspecto necesario para el desarrollo de sus actividades de
                        aprendizaje. Para este efecto el <strong>APRENDIZ</strong> autoriza desde ya expresamente a la <strong>EMPRESA</strong> para
                        que pueda monitorear el uso que éste haga de los sistemas de información, incluido el acceso a
                        la cuenta de correo electrónico suministrada por <strong>EMPRESA</strong> para el cumplimiento de la etapa
                        práctica del <strong>APRENDIZ</strong>, así como del registro de visitas a sitios de Internet.
                    `)}

                    ${_itemContrato("g)", `
                        Igualmente, y en cumplimiento del propósito antes dicho, el <strong>APRENDIZ</strong> se obliga a conocer y a
                        mantenerse actualizado sobre toda comunicación que al respecto publique la <strong>EMPRESA</strong>.
                    `)}

                    ${_itemContrato("h)", `
                        El <strong>APRENDIZ</strong> se obliga a mantener la confidencialidad sobre la información a que tenga acceso
                        con ocasión de su proceso de formación, contenida en estrategias de negocios, actividades de
                        negocios, ideas, investigaciones y desarrollos, "Know-how", secretos industriales, datos
                        técnico-industriales, conocimientos de marketing, de selección de personal, de organización
                        empresarial, programas de computador, fórmulas, listados y datos de clientes, listados de
                        proveedores, productos, información sobre precios y costos, planes y programas de negocios y
                        mercadeo, informes o análisis actuariales, proyecciones financieras, métodos, procedimientos,
                        manuales, reportes, prospectos, oportunidades de negocios, estudios de factibilidad, planes de
                        ventas y mercadeo, discusiones tendientes a la celebración de acuerdos y de eventuales
                        negocios, datos relativos a la <strong>EMPRESA</strong> en la que desarrolla su etapa práctica de aprendizaje o
                        a sus accionistas, así como a todos los demás datos utilizados por la <strong>EMPRESA</strong> para el
                        desarrollo de su objetivo, que no tenga el carácter de públicos cualquiera que sea la fuente en
                        que se encuentren. Los datos contenidos en las anteriores fuentes, así como cualesquiera otros
                        obtenidos con causa y con ocasión del contrato de Aprendizaje se denominarán para efectos de
                        este convenio <strong>LA INFORMACION CONFIDENCIAL.</strong>
                    `)}

                    ${_bloqueContrato(`



                        El <strong>APRENDIZ</strong> reconoce como de propiedad exclusiva de la <strong>EMPRESA</strong>; de sus clientes y/o demás
                        personas con las cuales la <strong>EMPRESA</strong> tiene relaciones comerciales <strong>LA INFORMACION CONFIDENCIAL</strong> a
                        que se refiere el literal anterior, y en consecuencia se obliga a: 1.1. Mantenerla en estricta
                        confidencialidad y a no divulgarla a terceros, en forma total o parcial, salvo que medie autorización
                        previa y escrita de la <strong>EMPRESA</strong>; 1.2. No utilizarla, copiarla, aplicarla o explotarla en ninguna forma ni
                        para ningún negocio con beneficio personal o de terceros. 1.3. Impedir que terceros tengan acceso a
                        la <strong>INFORMACION CONFIDENCIAL</strong>. En consecuencia, se obliga a custodiar diligentemente la
                        <strong>INFORMACION CONFIDENCIAL</strong> a su alcance y a utilizar todos los medios necesarios para evitar que la
                        misma llegue a manos de terceros o sea conocida por estos. 1.4. Devolver a la <strong>EMPRESA</strong>; a la
                        terminación del contrato de aprendizaje, cualquiera que sea su causa, el material, programas,
                        documentos, archivos y demás fuentes de <strong>INFORMACION CONFIDENCIAL</strong> que se encuentren en su
                        poder. Esta obligación deberá ser cumplida por el <strong>APRENDIZ</strong> aún después de terminado su contrato
                        de aprendizaje con la <strong>EMPRESA</strong>; cualquiera que sea la causa de terminación. En consecuencia, la
                        <strong>INFORMACION CONFIDENCIAL</strong> no podrá ser divulgada por el <strong>APRENDIZ</strong>, ya sea para beneficio propio,
                        de un futuro empleador, en caso de que se vincule laboralmente a otra empresa o con un tercero. <strong>EL
                        APRENDIZ</strong> será responsable por los perjuicios que el incumplimiento de la presente obligación cause
                        a la <strong>EMPRESA</strong>; o a un tercero. En el evento en que la <strong>EMPRESA</strong>; tuviese que asumir la responsabilidad
                    `)}

                </div>`;


                // ── PÁGINA 5 ──────────────────────────────────────────────────────────────────
                const htmlPagina5 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_bloqueContrato(`
                        por tal hecho ante un tercero, el <strong>APRENDIZ</strong> se obliga a pagar a la <strong>EMPRESA</strong> las sumas que a esta le
                        sean exigidas, incluyendo intereses y honorarios de abogados.
                    `)}

                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO:",
                        `
                        El <strong>APRENDIZ</strong> se obliga a dar estricto cumplimiento a las disposiciones y
                        reglamentaciones, de origen legal o institucional, expedidas y que se expidan en materia de control y
                        prevención de lavado de activos y demás actividades ilícitas, so pena de la imposición de las
                        sanciones contractuales, administrativas y penales a que hubiere lugar.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO.-",
                        `
                        El <strong>APRENDIZ</strong> se obliga a reportar a la Unidad de Cumplimiento todas
                        aquellas transacciones que de conformidad con las disposiciones sobre Control y Prevención de
                        Lavado de Activos y Financiación del Terrorismo y demás actividades ilícitas deban considerarse como
                        inusuales o sospechosas. Para tales efectos el <strong>APRENDIZ</strong> diligenciará el formato diseñado para tal fin,
                        el cual una vez estudiado por el Comité Evaluador y si es del caso, será entregado ante las
                        autoridades competentes.
                        `
                    )}

                    ${_bloqueContrato(`
                        El <strong>APRENDIZ</strong> mantendrá absoluta reserva en relación con dicho reporte, no pudiendo proporcionar
                        información sobre el mismo a cliente alguno de la <strong>EMPRESA</strong> o a un tercero.
                    `)}

                    ${_paragrafoContrato(
                        "PARÁGRAFO TERCERO.-",
                        `
                        El <strong>APRENDIZ</strong> conoce la Responsabilidad y Confidencialidad de los Activos de
                        Información de la <strong>EMPRESA</strong>, y en consecuencia se obliga a:
                        `
                    )}

                    ${_itemContrato("3.1.", `
                        Utilizar los Sistemas de Información
                        únicamente para propósitos aprobados con ocasión del desarrollo del Contrato de Aprendizaje.
                    `)}

                    ${_itemContrato("3.2.", `
                        Mantener confidencialmente sus identificaciones, password y claves de acceso físico, y softwares
                        oficiales instalados en su computadora personal o en la suministra por la <strong>EMPRESA</strong> para el
                        cumplimiento de la etapa práctica del contrato de aprendizaje.
                    `)}

                    ${_itemContrato("3.3.", `
                        Notificar inmediatamente al líder
                        del área en la que se encuentre ejecutando su etapa práctica cualquier incidente, violación,
                        utilización irregular de recursos, evidencias de que alguien irrumpa sistemas o plataformas de manera
                        ilegal.
                    `)}

                    ${_itemContrato("3.4.", `
                        Dar adecuado manejo a los recursos tecnológicos y solicitar los requerimientos de
                        seguridad física necesarios para cuidar la información.
                    `)}

                    ${_tituloContrato(
                        "CUARTA:",
                        "INCUMPLIMIENTOS.",
                        `
                        En atención a que el <strong>APRENDIZ</strong> debe ceñirse a las normas de
                        comportamiento de la <strong>EMPRESA</strong> en ejecución de sus actividades de aprendizaje, se contemplan como
                        incumplimientos al contrato los siguientes:
                        `
                    )}

                    ${_itemContrato("a)", `
                        La violación por parte del <strong>APRENDIZ</strong> de cualquiera de sus obligaciones legales, contractuales o
                        reglamentarias;
                    `)}

                    ${_itemContrato("b)", `
                        La no asistencia puntual a cumplir con su etapa práctica, sin excusa suficiente;
                    `)}

                    ${_itemContrato("c)", `
                        La revelación de secretos y datos reservados de la <strong>EMPRESA</strong>;
                    `)}

                    ${_itemContrato("d)", `
                        Presentarse a cumplir con su etapa práctica en estado de embriaguez o bajo la influencia de
                        narcóticos o sustancias psicoactivas;
                    `)}

                </div>`;


                // ── PÁGINA 6 ──────────────────────────────────────────────────────────────────
                const htmlPagina6 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_itemContrato("e)", `
                        El hecho que el <strong>APRENDIZ</strong> abandone las instalaciones durante el desarrollo de su contrato de
                        aprendizaje;
                    `)}

                    ${_itemContrato("f)", `
                        Omitir cualquier información de la que tenga conocimiento frente a lesiones e incidentes
                        incurridos en el desarrollo de las actividades académicas;
                    `)}

                    ${_itemContrato("g)", `
                        Negociar la información o material de propiedad de la <strong>EMPRESA</strong> con intención personal de
                        lucro, evento en el cual se iniciarán las acciones legales pertinentes.
                    `)}

                    ${_itemContrato("h)", `
                        Valerse del nombre de la <strong>EMPRESA</strong> para emprender, respaldar o acreditar negocios
                        particulares o actividades comerciales personales.
                    `)}

                    ${_itemContrato("i)", `
                        Retirar de las instalaciones donde funcione la empresa insumos, alimentos, mermas, bebidas,
                        inventarios, pertenencias, elementos, maquinas, útiles o papelería de propiedad de la
                        <strong>EMPRESA</strong> o elementos de los usuarios y/o terceros visitantes sin su autorización escrita.
                    `)}

                    ${_itemContrato("j)", `
                        El uso indebido de papelería, documentos o emblemas de la <strong>EMPRESA</strong> por parte del
                        <strong>APRENDIZ</strong>;
                    `)}

                    ${_itemContrato("k)", `
                        El incumplimiento de alguna de las cláusulas establecidas en el presente contrato.
                    `)}

                    ${_itemContrato("l)", `
                        La no entrega de los documentos o soportes que solicite la <strong>EMPRESA</strong> para adelantar el
                        contrato de aprendizaje.
                    `)}

                    ${_itemContrato("m)", `
                        El uso y publicación de la imagen de la <strong>EMPRESA,</strong> así como de sus comunicaciones,
                        documentos y cualquier otro tipo de material por cualquier medio.
                    `)}

                    ${_tituloContrato(
                        "QUINTA:",
                        "SUPERVISIÓN.",
                        `
                        Teniendo en cuenta la naturaleza de la relación de aprendizaje, la <strong>EMPRESA</strong>
                        podrá supervisar al <strong>APRENDIZ</strong> en el respectivo Centro de Formación del SENA (o en el Centro
                        Educativo donde estuviere adelantando los estudios el aprendiz), la asistencia, como el rendimiento
                        académico, a efectos de verificar y asegurar la real y efectiva utilización del tiempo en la etapa lectiva
                        por parte de este, sin que esto suponga la existencia de una relación jerárquica con algún
                        representante de la <strong>EMPRESA</strong> o la configuración de un contrato de trabajo. El SENA supervisará al
                        <strong>APRENDIZ</strong> en la <strong>EMPRESA</strong> para que sus actividades en cada periodo práctico correspondan al
                        programa de la especialidad para la cual se está formando.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO:",
                        `
                        La supervisión de la <strong>EMPRESA</strong> se desarrollará únicamente dentro del marco
                        del plan formativo del aprendiz y no supone subordinación que pueda considerarse laboral.
                        `
                    )}

                    ${_tituloContrato(
                        "SEXTA.",
                        "- SUSPENSIÓN.",
                        `
                        El presente contrato se podrá suspender temporalmente en los siguientes
                        casos: a) Licencia de maternidad. b) Incapacidades debidamente certificadas. c) Caso fortuito o fuerza
                        mayor debidamente certificado o constatado d) Vacaciones por parte de la <strong>EMPRESA</strong>, siempre y
                        cuando el aprendiz se encuentre desarrollando la etapa práctica. En caso de que se modifiquen los
                        acuerdos y/o normas que regulen las causales de suspensión del contrato de aprendizaje, estas
                        modificaciones se encuentran incorporadas al presente contrato de aprendizaje.
                        `
                    )}

                    ${_paragrafoContrato("PARÁGRAFO PRIMERO.-", "Esta suspensión debe constar por escrito.")}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO.-",
                        `
                        Durante la suspensión el contrato de aprendizaje se encuentra vigente, por
                        lo tanto, los efectos del contrato continúan para las partes en los aspectos indicados por la Ley,
                        excepto el pago del apoyo de sostenimiento por parte de la <strong>EMPRESA</strong>.
                        `
                    )}

                    ${_tituloContrato(
                        "SÉPTIMA.",
                        "- TERMINACIÓN.",
                        `
                        El presente contrato podrá darse por terminado en los siguientes casos:
                        `
                    )}

                    ${_itemContrato("a)", `Por mutuo acuerdo entre las partes.`)}

                </div>`;


                // ── PÁGINA 7 ──────────────────────────────────────────────────────────────────
                const htmlPagina7 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    

                    ${_itemContrato("b)", `Por el vencimiento del término de duración del presente Contrato de aprendizaje.`)}

                    ${_itemContrato("c)", `
                        La cancelación de la matrícula por parte del SENA de acuerdo con el reglamento previsto para
                        los aprendices, ocasionada por el bajo rendimiento o la configuración de faltas disciplinarias
                        cometidas en los periodos de Formación Profesional Integral en el SENA o en la <strong>EMPRESA.</strong>
                    `)}

                    ${_itemContrato("d)", `Por decisión unilateral, libre y voluntaria del <strong>APRENDIZ.</strong>`)}

                    ${_itemContrato("e)", `Por el incumplimiento de las obligaciones por parte del <strong>APRENDIZ.</strong>`)}

                    ${_itemContrato("f)", `
                        Por conclusión de la etapa de formación, según certificación de la institución educativa o del
                        SENA.
                    `)}

                    ${_itemContrato("g)", `Las demás que las normas aplicables establezcan.`)}

                    ${_tituloContrato(
                        "OCTAVA:",
                        "EXCLUSIÓN RELACIÓN LABORAL.",
                        `
                        El presente Contrato de aprendizaje por expresa
                        disposición legal corresponde a un contrato especial laboral a término fijo, por lo que la naturaleza de
                        la relación que une al <strong>APRENDIZ</strong> y a la <strong>EMPRESA</strong> es de carácter formativo y de aprendizaje. Así las
                        cosas, de ninguna manera el <strong>APRENDIZ</strong> es considerado un trabajador de la <strong>EMPRESA</strong> y esta relación
                        de aprendizaje no implica la existencia de un contrato de trabajo entre las partes.
                        `
                    )}

                    ${_bloqueContrato(`
                        El <strong>APRENDIZ</strong> declara bajo la gravedad de juramento que no ha suscrito previamente más de un
                        contrato de aprendizaje ni ha superado el término acumulado de 36 meses, conforme lo previsto en
                        el parágrafo 1 del Artículo 21 de la Ley 2466 de 2025. Así mismo, las partes declaran, que el aprendiz
                        no se encuentra ni ha estado vinculado mediante contrato de trabajo con la <strong>EMPRESA.</strong>
                    `)}

                    ${_tituloContrato(
                        "NOVENA:",
                        "PROTECCIÓN Y TRATAMIENTO DE DATOS PERSONALES:",
                        ""
                    )}

                    ${_tituloContrato(
                        "9.1.",
                        "AUTORIZACIÓN.",
                        `
                        En virtud de la Ley 1581 de 2012, <strong>EL APRENDIZ</strong> titular de los datos
                        voluntariamente suministrados para la constitución y ejecución del presente contrato autoriza
                        a <strong>DIACO S.A.</strong> para hacer uso de los mismos con fines laborales y los demás relacionados con el
                        giro ordinario de los negocios de esta empresa y que sean necesarios para la ejecución del
                        presente contrato. El titular declara conocer los derechos y condiciones del tratamiento de sus
                        datos.
                        `
                    )}

                    ${_tituloContrato(
                        "9.2.",
                        "",
                        `
                        Los datos personales que sean recopilados por <strong>DIACO S.A.</strong> serán tratados para las finalidades
                        que sean autorizados por los titulares de la información. Sin embargo, los datos también
                        podrán ser tratados para las siguientes finalidades:
                        `
                    )}

                    ${_bulletContrato(`
                        Efectuar todas las gestiones necesarias para el desarrollo del objeto Social de
                        <strong>DIACO S.A.</strong>, así como todo lo relacionado con el cumplimiento del objeto del contrato celebrado
                        entre la Compañía y el Titular de la información, incluida la ejecución y terminación de este.
                    `)}

                    ${_bulletContrato(`Realizar invitaciones a eventos y ofrecer nuevos productos o servicios.`)}

                    ${_bulletContrato(`
                        Gestionar solicitudes, quejas o reclamos promovidos por el Titular o para el
                        ejercicio de los derechos y deberes de <strong>DIACO</strong> frente a las diferentes
                        autoridades, incluido pero sin limitarse, la rama judicial.
                    `)}

                    ${_bulletContrato(`
                        El ofrecimiento de servicios por parte de proveedores estratégicos de
                        <strong>DIACO S.A.</strong>, a fin de brindar al titular de la información acceso a
                        servicios o facilidades de pago para la adquisición de productos ofrecidos por
                        <strong>DIACO S.A.</strong>
                    `)}

                    ${_bulletContrato(`Transmitir o transferir los datos a aliados, matriz, filiales o subordinadas.`)}

                    ${_bulletContrato(`
                        Consulta y reporte a centrales de riesgo, según sea el caso y las deudas que
                        llegare a tener con la compañía.
                    `)}

                </div>`;


                // ── PÁGINA 8 ──────────────────────────────────────────────────────────────────
                const htmlPagina8 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_bulletContrato(`Cumplimiento de régimenes tales como el SAGRILAFT y PTEE.`)}

                    ${_bloqueContrato(`
                        Los datos personales recopilados serán usados, almacenados, procesados, transferidos (nacional e
                        internacionalmente) y circulados para las finalidades descritas en la Política de Tratamiento de Datos
                        personales disponible en la página de <strong>DIACO S.A.</strong> a la cual se tiene acceso directo accediendo al
                        siguiente enlace www.diaco.com.co. Dada la naturaleza del contrato laboral y las condiciones bajo las
                        cuales ser llevará a cabo, <strong>DIACO S.A.</strong> tratará datos personales sensibles, tales como datos de salud,
                        raza, situación sentimental o genero, imagen, voz y/o video. Adicionalmente <strong>DIACO S.A.</strong> tendrá
                        acceso a los datos de su familia, tales como datos de sus hijos (para aspectos relacionados con
                        beneficios o celebraciones a los que estos puedan llegar a tener), conyuge o familiares (para aspectos
                        relacionados con beneficios o celebraciones a los que estos puedan llegar a tener, contacto de
                        emergencia, entre otros).
                    `)}

                    ${_tituloContrato(
                        "9.3.",
                        "DERECHOS DEL TITULAR.",
                        `
                        Como titular de la información, según el artículo 8 de la Ley 1581 de 2012, usted
                        tiene derecho a lo siguiente: a) Conocer, actualizar y rectificar sus datos
                        personales, b) Solicitar prueba de la autorización otorgada; c) Ser informado,
                        previa solicitud, respecto del uso que le ha dado a sus datos personales;
                        d) Presentar ante la Superintendencia de Industria y Comercio quejas
                        e) Revocar la autorización y/o solicitar la supresión del dato; y
                        f) Acceder en forma gratuita a sus datos personales que hayan sido objeto de Tratamiento.
                        `
                    )}

                    ${_tituloContrato(
                        "9.4.",
                        "TRATAMIENTO DE DATOS POR EL APRENDIZ.",
                        `
                        <strong>EL APRENDIZ</strong> tratará los datos personales que le transmita o
                        transfiera <strong>LA EMPRESA</strong> sólo para los fines relacionados con el presente contrato y
                        en cumplimiento de las obligaciones que fueron pactadas en el presente contrato.
                        Así mismo, <strong>EL APRENDIZ</strong> se obliga a respetar todas las obligaciones que
                        pudieran corresponderle en virtud del presente contrato con arreglo a la normativa en materia de
                        protección de datos y manifiesta cumplir con las medidas de seguridad idóneas para proteger
                        la información, su confidencialidad, seguridad y acceso restringido, y garantiza el
                        mantenimiento de estas medidas de seguridad, así como cualesquiera otras que le fueren
                        impuestas, de índole técnica, de comportamiento y organizativa, necesarias para garantizar la
                        seguridad de los datos de carácter personal y evitar su alteración, pérdida, Tratamiento o
                        acceso no autorizado.
                        `
                    )}

                    ${_bloqueContrato(`
                        Así mismo, <strong>EL APRENDIZ</strong> se compromete a cumplir con la Política de Tratamiento de Datos de
                        <strong>LA EMPRESA</strong>, disponible en el enlace antes informado. <strong>EL APRENDIZ</strong> conoce que, en caso de
                        incumplimiento de la presente, se le impondrán las medidas disciplinarias y económicas
                        respectivas, las que posiblemente pueden conllevar a la aplicación de la cláusula penal
                        expuesta en el presente, así como la terminación de este contrato laboral y cualquier otro
                        contrato que tenga con la compañía, sin perjuicio de las indemnizaciones de perjuicios a que
                        haya lugar y de las demás sanciones previstas en el presente contrato.
                    `)}

                    ${_tituloContrato(
                        "DÉCIMA:",
                        "POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN:",
                        `
                        <strong>EL APRENDÍZ</strong> declara que conoce y acepta
                        la Política de Seguridad de la Información de <strong>LA EMPRESA</strong> y acepta que en caso de incumplimiento el
                        presente contrato se terminará con justa causa y se le impondrá a título apremio una suma de dinero
                        correspondiente a veinticuatro (24) veces el valor estipulado en la cláusula segunda del presente
                        contrato, sin perjuicio de las indemnizaciones de perjuicios a que haya lugar y de las demás sanciones
                        previstas en el presente contrato.
                        `
                    )}

                </div>`;


                // ── PÁGINA 9 ──────────────────────────────────────────────────────────────────
                const htmlPagina9 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_tituloContrato(
                        "DÉCIMO PRIMERA:",
                        "COMPLIANCE.",
                        `A la firma del presente documento:`
                    )}

                    ${_bloqueContrato(`
                        Las PARTES se comprometen a cumplir todas las leyes y regulaciones vigentes, incluyendo la Ley 1778
                        de 2016, el FCPA, el UK Bribery Act y otras relacionadas con soborno, corrupción y conflictos de interés.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES no ofrecerán, recibirán ni autorizarán pagos o beneficios ilegales o corruptos,
                        ni participarán en actividades que busquen obtener ventajas ilícitas.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES se comprometen a no inducir a empleados, funcionarios o entidades políticas a obtener
                        ventajas indebidas ni a influir en sus acciones de forma ilícita.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES no utilizarán fondos provenientes de actividades ilícitas ni mantendrán relaciones con
                        entidades involucradas en criminalidad, corrupción o terrorismo.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES aseguran que ni ellas ni sus representantes están bajo investigación, condena, ni
                        sancionados por corrupción o actividades ilícitas.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES garantizarán que sus representantes no son funcionarios públicos y informarán sobre
                        cualquier cambio en este estatus.
                    `)}

                    ${_bloqueContrato(`
                        Las PARTES asumirán la responsabilidad por los actos indebidos de sus empleados, representantes o
                        subcontratados, garantizando el cumplimiento de las leyes y normativas aplicables.
                    `)}

                    ${_bloqueContrato(`
                        El incumplimiento de estas disposiciones será considerado una infracción grave, permitiendo a la
                        PARTE afectada rescindir el contrato sin penalidad y exigir indemnización por las pérdidas y daños
                        ocasionados.
                    `)}

                    ${_tituloContrato(
                        "DÉCIMO SEGUNDA:",
                        "DECLARACIÓN DE PROCEDENCIA LÍCITA DE ACTIVOS Y DE CARENCIA DE ANTECEDENTES O RIESGOS DE INVESTIGACIÓN POR ACTIVIDADES ILÍCITAS:",
                        `
                        <strong>LAS PARTES</strong> declaran, basadas en buena fe y tras indagaciones
                        razonables, que durante la vigencia del contrato:
                        `
                    )}

                    ${_itemContrato("i.", `
                        Los activos de su patrimonio, no provienen ni han sido utilizados para actividades ilícitas según
                        la Ley 190 de 1995, Ley 747 de 2002, Ley 1121 de 2006, Ley 30 de 1986 y demás normas
                        aplicables.
                    `)}

                    ${_itemContrato("ii.", `
                        No existen sanciones, investigaciones en curso, ni sentencias en firme contra ellas, sus
                        representantes legales, miembros de junta directiva, accionistas, socios o empleados por
                        actividades ilícitas, ni aparecen en listas nacionales o internacionales de prevención de lavado
                        de activos o actividades terroristas.
                    `)}

                    ${_itemContrato("iii.", `
                        En caso de nuevas disposiciones legales que tipifiquen conductas ilícitas, las PARTES se
                        comprometen a hacer las declaraciones necesarias conforme se requiera.
                    `)}

                    ${_bloqueContrato(`
                        Si en cualquier momento se constata que estas declaraciones no son válidas o se niegan a declarar
                        sobre nuevas conductas ilícitas, la PARTE cumplida podrá rescindir el contrato unilateralmente y sin
                        indemnización.
                    `)}

                </div>`;


                // ── PÁGINA 10 ──────────────────────────────────────────────────────────────────
                const htmlPagina10 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${_tituloContrato(
                        "DÉCIMO TERCERA:",
                        "PROGRAMA DE TRANSPARENCIA Y ÉTICA EMPRESARIAL.",
                        `
                        <strong>EL APRENDIZ</strong> reconoce
                        haber sido informado por <strong>DIACO S.A.</strong> sobre su obligación de cumplir con las normas de prevención del
                        Soborno Transnacional y Corrupción y se compromete a conocer el Programa implementado por
                        <strong>DIACO S.A.</strong>, disponible en su página web, así como las consecuencias de su incumplimiento. <strong>EL
                        APRENDIZ</strong> acepta que <strong>DIACO S.A.</strong> puede realizar procedimientos de Debida Diligencia para verificar
                        el cumplimiento de estas obligaciones. El incumplimiento de conductas definidas por la Ley
                        colombiana como Soborno Transnacional y Corrupción será considerado una falta grave, permitiendo
                        a <strong>DIACO S.A.</strong> terminar el contrato de manera unilateral, sin previo aviso ni indemnización, y hacer
                        exigibles las penalidades pactadas.
                        `
                    )}

                    ${_tituloContrato(
                        "DÉCIMO CUARTA:",
                        "CUMPLIMIENTO DE LAS OBLIGACIONES RELACIONADAS CON EL AUTOCONTROL Y LA GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM.",
                        `
                        <strong>EL APRENDIZ</strong> se compromete a dar
                        cumplimiento a las políticas y procedimientos establecidos por la Organización en materia de
                        autocontrol y gestión del riesgo integral de lavado y de activos, financiación del terrorismo y
                        financiación de la proliferación de armas de destrucción masiva (LA/FT/FPADM) desarrollados en el
                        correspondiente manual del sistema de autocontrol y gestión del riesgo integral de LA/FT/FPADM -
                        SAGRILAFT. Igualmente se compromete a dar estricto y cabal cumplimiento a las funciones y
                        responsabilidades asignadas frente al SAGRILAFT. Su incumplimiento dará lugar a la correspondiente
                        sanción según sea establecido en el reglamento interno de trabajo de la Organización y/o Código de ética.
                        `
                    )}

                    ${_tituloContrato(
                        "DÉCIMO QUINTA:",
                        "RESERVA DE LA INFORMACIÓN DEL SISTEMA DE AUTOCONTROL Y GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM.",
                        `
                        <strong>EL APRENDIZ</strong> se compromete a guardar reserva de la
                        información y documentos que tenga conocimiento de los clientes, proveedores, accionistas y
                        empleados producto de la aplicación de las políticas y procedimientos del sistema de autocontrol y
                        gestión del riesgo integral de LA/FT/FPADM. De la misma forma, se compromete a guardar reserva de
                        la información reportada a las autoridades competentes en virtud de los procedimientos establecidos
                        en el mencionado sistema.
                        `
                    )}

                    ${_tituloContrato(
                        "DÉCIMO SEXTA:",
                        "OBLIGACIÓN DE REPORTAR SEÑALES DE ALERTA, SITUACIONES U OPERACIONES INUSUALES.",
                        `
                        <strong>EL APRENDIZ</strong> se obliga a reportar de forma inmediata al Oficial de
                        Cumplimiento de la Organización todas las situaciones inusuales que evidencie y que pueden
                        involucrar situaciones de lavado de activos, financiación del terrorismo y financiación de la
                        proliferación de armas de destrucción masiva LA/FT/FPADM según lo establecido en el
                        manual del sistema de autocontrol y gestión del riesgo integral de LA/FT/FPADM.
                        `
                    )}

                    ${_tituloContrato(
                        "DECIMO SÉPTIMA:",
                        "VIGENCIA.",
                        `
                        Para los efectos de Ley, el presente contrato rige a partir del <strong>16 DE
                        ENERO DEL 2026 AL 15 DE JULIO DEL 2026</strong> prevista como terminación de la etapa
                        productiva que se describe en la cláusula segunda de este contrato.
                        `
                    )}

                    ${_bloqueContrato(`
                        Para efectos de lo anterior, firman el dieciséis (16) de enero del año 2026 en Tuta Boyacá
                    `)}

                    <!-- Firmas -->
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-top:70px;
                        padding:0 20px;
                    ">

                        <!-- EMPLEADOR -->
                        <div style="width:40%;">

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                            ">

                                <div style="
                                    font-weight:bold;
                                    min-height:18px;
                                ">
                                    LAURA CRISTINA CERÓN MUÑOZ
                                </div>

                                <div style="
                                    margin-top:2px;
                                    font-weight:bold;
                                ">
                                    C.C.No. 52.705.312
                                </div>

                            </div>

                        </div>

                        <!-- TRABAJADOR -->
                        <div style="width:40%;">

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                            ">

                                <div style="
                                    font-weight:bold;
                                    min-height:18px;
                                ">
                                    ${sNombre}
                                </div>

                                <div style="
                                    margin-top:2px;
                                    font-weight:bold;
                                ">
                                    CC.No. ${sCedula}
                                </div>

                            </div>

                        </div>

                    </div>

                </div>`;


                // ── Array final ───────────────────────────────────────────────────────────────
                const contentBlocks = [
                    htmlPagina1,
                    htmlPagina2,
                    htmlPagina3,
                    htmlPagina4,
                    htmlPagina5,
                    htmlPagina6,
                    htmlPagina7,
                    htmlPagina8,
                    htmlPagina9,
                    htmlPagina10,
                ];

                // ── Carga plantilla de fondo ───────────────────────────────────
                const existingPdfBytes = await fetch("templates/pdf/hojaDiaco.pdf")
                    .then(res => res.arrayBuffer());

                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width           = "720px";
                    div.style.height          = "820px";
                    div.style.padding = "20px 40px 40px 40px";
                    div.style.backgroundColor = "transparent";
                    div.style.background      = "none";
                    div.style.fontSize        = "12px";
                    div.style.boxSizing       = "border-box";
                    div.style.position        = "absolute";
                    div.style.top             = "-9999px";
                    div.style.left            = "-9999px";
                    div.innerHTML             = blockHtml;
                    document.body.appendChild(div);

                    const canvas = await html2canvasRef(div, {
                        scale:           2,
                        useCORS:         true,
                        backgroundColor: null
                    });
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img     = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);
                    newPage.drawPage(templatePageImage);

                    const imgWidth  = width * 0.88;
                    const imgHeight = (img.height * imgWidth) / img.width;

                    newPage.drawImage(img, {
                        x:      (width - imgWidth) / 2,
                        y:      height - imgHeight - 70,
                        width:  imgWidth,
                        height: imgHeight
                    });

                    if (pageIndex === contentBlocks.length - 1) {
                        newPage.drawText("[[FIRMA_EMPLEADO]]", {
                            x: width * 0.63,
                            y: 110,
                            size: 6,
                            color: PDFLibRef.rgb(1, 1, 1)
                        });
                    }
                }

                pdfDoc.removePage(0);
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Contrato Aprendizaje Productivo`);

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Contrato_Aprendizaje_Productivo.pdf`;
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
            console.error("Error generando Contrato Indefinido:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }
    
    return {onDownloadPDFContratoAprendizajeProductivo};
});
