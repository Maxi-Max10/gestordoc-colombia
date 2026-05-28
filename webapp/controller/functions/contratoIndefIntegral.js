sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFContratoIndefIntegral(oController, sButtonId) {
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
                const sCedula      = user.nationalId   || "";
                const sCargo       = user.title        || "";
                const sCiudadWork  = user.division     || "";
                const sSalario     = _formatSalary(user.paycompvalue);
                const sHireDate    = _formatDateLong(user.hireDate);

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    await _generateWord({
                        firstName: user.firstName,
                        lastName:  user.lastName,
                        sNombre, sCedula, sCargo, sCiudadWork, sSalario, sHireDate
                    });
                    continue;
                }

                // ══════════════════════════════════════════════════════════════
                // PÁGINAS HTML — CONTRATO A TÉRMINO INDEFINIDO INTEGRAL
                // Estructura según PDF de referencia
                // ══════════════════════════════════════════════════════════════

                const STYLE = `font-family:Arial,sans-serif;font-size:9.5pt;line-height:1.2;padding:25px 24px 20px 24px;color:#000;`;
                const PJUST = `style="${STYLE}text-align:justify;margin:0 0 10px 0;"`;
                const HEADER = `
                    <div style="
                        width:100%;
                        text-align:center;
                        font-weight:bold;
                        line-height:1.2;
                        margin-bottom:30px;
                    ">

                        <div style="font-size:16pt;">
                            CONTRATO A INDEFINIDO INTEGRAL
                        </div>

                    </div>
                `;


                // ── Helpers de estructura jurídica ─────────────────────────────
                function _itemContrato(letra, texto) {
                    return `
                        <div style="
                            display:flex;
                            align-items:flex-start;
                            margin:0 0 3px 0;
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
                        <div style="
                            margin:18px 0 12px 0;
                            text-align:justify;
                        ">
                            <strong>${numero}</strong>
                            <strong>${titulo}</strong>
                            ${texto}
                        </div>
                    `;
                }

                function _paragrafoContrato(titulo, texto) {
                    return `
                        <div style="
                            text-align:justify;
                            margin:14px 0 10px 0;
                        ">
                            <strong>${titulo}</strong> ${texto}
                        </div>
                    `;
                }

                function _bloqueContrato(contenido) {
                    return `
                        <div style="
                            text-align:justify;
                            margin:0 0 14px 0;
                        ">
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
                        ">

                            <div style="
                                width:18px;
                                flex-shrink:0;
                                font-weight:bold;
                                line-height:1.4;
                            ">
                                ●
                            </div>

                            <div style="
                                flex:1;
                                text-align:justify;
                                line-height:1.4;
                            ">
                                ${texto}
                            </div>

                        </div>
                    `;
                }



                // ── PÁGINA 1 — Título + Tabla de datos + inicio cláusula 1 ────
                const htmlPagina1 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <table style="width:100%;border-collapse:collapse;font-size:9.5pt;margin:14px 0 16px 0;">
                        <tr><td style="border:1px solid #000;padding:1px 5px;width:45%;font-weight:bold;background-color:#DCEEFF;">EMPLEADOR</td><td style="border:1px solid #000;padding:1px 5px;">DIACO S.A.</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">TRABAJADOR</td><td style="border:1px solid #000;padding:1px 5px;">${sNombre}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">DOCUMENTO DE IDENTIDAD</td><td style="border:1px solid #000;padding:1px 5px;">${sCedula}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">CARGO</td><td style="border:1px solid #000;padding:1px 5px;">${sCargo}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">LUGAR DE CELEBRACIÓN Y FECHA</td><td style="border:1px solid #000;padding:1px 5px;"></td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">LUGAR DONDE PRESTARÁ EL SERVICIO</td><td style="border:1px solid #000;padding:1px 5px;">${sCiudadWork}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">SALARIO BASICO</td><td style="border:1px solid #000;padding:1px 5px;">${sSalario}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">PERÍODO DE PAGO</td><td style="border:1px solid #000;padding:1px 5px;">QUINCENAL</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">FECHA DE INICIACIÓN DE LABORES</td><td style="border:1px solid #000;padding:1px 5px;">${sHireDate}</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">PERIODO DE PRUEBA</td><td style="border:1px solid #000;padding:1px 5px;">Dos (2) meses</td></tr>
                        <tr><td style="border:1px solid #000;padding:1px 5px;font-weight:bold;background-color:#DCEEFF;">DURACIÓN DEL CONTRATO</td><td style="border:1px solid #000;padding:1px 5px;">TÉRMINO INDEFINIDO</td></tr>
                    </table>

                    <p ${PJUST}>
                        Entre los suscritos a saber: <strong>DIACO S.A.</strong>, sociedad legalmente constituida,
                        con domicilio en Bogotá, representada en este contrato por
                        <strong>LAURA CRISTINA CERÓN MUÑOZ</strong>, identificada con la cédula de ciudadanía
                        número <strong>52.705.312</strong> y quien para todos los efectos del presente contrato
                        de trabajo se denominará <strong>EL EMPLEADOR</strong>, y <strong>${sNombre}</strong>,
                        identificado(a) con la cédula de ciudadanía número <strong>${sCedula}</strong>
                        expedida en XXXXXXXXXXXXXX, domiciliada en XXXXXXXXXXXXXX obrando en nombre
                        propio y quien para efectos del presente contrato se denominará
                        <strong>EL TRABAJADOR</strong>, hemos celebrado un contrato de trabajo según las
                        siguientes cláusulas:
                    </p>

                    ${_tituloContrato(
                        "1.",
                        "OBLIGACIONES GENERALES:",
                        `
                        <strong>EL EMPLEADOR</strong> contrata los servicios personales de
                        <strong>EL TRABAJADOR</strong>, y éste se obliga a:
                        `
                    )}

                    ${_itemContrato("a.", `
                        Poner al servicio de <strong>EL EMPLEADOR</strong> toda su capacidad normal de trabajo,
                        en forma exclusiva, en el desempeño de las funciones o labores propias, anexas o
                        complementarias a los trabajos de una empresa metalúrgica, de conformidad con los
                        reglamentos, órdenes e instrucciones que le impartan los representantes de
                        <strong>EL EMPLEADOR</strong>, todo lo cual forma parte integrante del presente
                        contrato, observando en su desempeño el cuidado y diligencia necesarios,
                        especialmente como XXXXXXXXXXXXXX, pudiendo
                        <strong>EL EMPLEADOR</strong> cambiarlo de función cuando lo considere necesario.
                    `)}

                    ${_itemContrato("b.", `
                        El servicio antedicho lo prestará <strong>EL TRABAJADOR</strong> en las dependencias
                        donde <strong>EL EMPLEADOR</strong> tiene o tuviere sus actividades, pero se obliga
                        a aceptar cualquier otro
                    `)}

                </div>`;

               // ── PÁGINA 2 ──────────────────────────────────────────────────
                const htmlPagina2 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_bloqueContrato(`
                    empleo, cargo u oficio a donde lo promueva <strong>EL EMPLEADOR</strong> bajo su dependencia,
                    y que sea capaz de desempeñar, especialmente cuando estos traslados se originen por la
                    modernización de equipos, adopción de nuevas tecnologías y procesos o la implantación de
                    nuevos sistemas, siempre que el cambio no implique desmejora de la remuneración básica de
                    <strong>EL TRABAJADOR</strong>.
                `)}

                    ${_itemContrato("c.", `
                        A trabajar la jornada máxima legal establecida y de acuerdo con el horario y turno que
                        <strong>EL EMPLEADOR</strong> le señale de conformidad con lo dispuesto en el literal d)
                        del artículo 161 de C.S.T norma que fue adicionada por el artículo 51 de la ley 789 de 2002.
                    `)}

                    ${_itemContrato("d.", `
                        <strong>EL TRABAJADOR</strong> cumplirá su jornada de trabajo en los turnos y horarios
                        que determine <strong>EL EMPLEADOR</strong> dentro de un esquema de jornada de trabajo
                        flexible. Por acuerdo expreso entre las partes la jornada diaria de trabajo podrá repartirse
                        en la forma que resulte más adecuada conforme lo determine <strong>EL EMPLEADOR</strong>,
                        teniendo en cuenta que los tiempos de descanso dentro de las secciones determinadas no se
                        computan dentro de la jornada y que el presente contrato de trabajo se desarrollará dentro
                        del marco de una jornada de trabajo flexible.
                    `)}

                    ${_itemContrato("e.", `
                        A guardar en el desempeño de sus funciones y fuera de ellas, discreción, sigilo, lealtad,
                        confidencia y estricta reserva de todo lo que llegue a su conocimiento en razón de su oficio,
                        especialmente los secretos profesionales, industriales o comerciales de la Empresa, o que sean
                        de naturaleza reservada, o aquellos asuntos cuya comunicación puedan causar perjuicio a
                        <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("f.", `
                        Responder por todos y cada uno de los elementos de trabajo que le entregue
                        <strong>EL EMPLEADOR</strong> para el desempeño de su cargo;
                    `)}

                    ${_itemContrato("g.", `
                        Devolver oportunamente los equipos, valores, documentos, carpetas y demás elementos de
                        trabajo que le entregue <strong>EL EMPLEADOR</strong> para el desempeño de su cargo;
                    `)}

                    ${_itemContrato("h.", `
                        Entregar oportunamente de conformidad con las instrucciones y los procedimientos establecidos,
                        todos los equipos, valores, documentos, sumas de dinero y demás, que con destino a este reciba
                        de terceros en ejercicio de su cargo;
                    `)}

                    ${_itemContrato("i.", `
                        Consagrar toda su actividad en el desempeño de sus funciones, absteniéndose de ejecutar labores
                        u ocupaciones que puedan entorpecer dicho desempeño o menoscabar su rendimiento personal,
                        así como todas aquellas que emanen de la naturaleza de la labor contratada;
                    `)}

                    ${_itemContrato("j.", `
                        Conservar y restituir en buen estado, salvo el deterioro natural, los instrumentos, máquinas,
                        útiles y demás elementos que se le hayan facilitado.
                    `)}

                    ${_itemContrato("k.", `
                        Guardar rigurosamente la moral con sus superiores y demás compañeros de trabajo;
                    `)}

                    ${_itemContrato("l.", `
                        Comunicar oportunamente a <strong>EL EMPLEADOR</strong> las observaciones que estime
                        conducentes a evitarle daños y perjuicios;
                    `)}

                </div>`;



                // ── PÁGINA 3 ──────────────────────────────────────────────────
                const htmlPagina3 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_itemContrato("m.", `
                        Prestar la colaboración posible en caso de siniestro o de riesgos inminentes que amenacen
                        las personas y las cosas de <strong>EL EMPLEADOR</strong>;
                    `)}

                    ${_itemContrato("n.", `
                        Observar las medidas preventivas higiénicas prescritas en el reglamento de higiene y
                        seguridad industrial que para tal efecto se expida según las normas vigentes o las
                        autoridades del ramo;
                    `)}

                    ${_itemContrato("o.", `
                        Observar con suma diligencia y cuidado las instrucciones y órdenes preventivas de accidentes
                        o enfermedades profesionales;
                    `)}

                    ${_itemContrato("p.", `
                        Registrar en las oficinas del EMPLEADOR, su dirección, número de teléfono y domicilio
                        y dar aviso inmediato de cualquier cambio que ocurra;
                    `)}

                    ${_itemContrato("q.", `
                        Utilizar los elementos que <strong>EL EMPLEADOR</strong> le suministre para la realización
                        de su trabajo;
                    `)}

                    ${_itemContrato("r.", `
                        Avisar oportunamente a su superior inmediato sobre cualquier deficiencia que tengan los
                        instrumentos, máquinas, equipos o implementos de labor con el fin de evitar accidentes,
                        daños o costos adicionales.
                    `)}

                    ${_tituloContrato(
                        "2.",
                        "REMUNERACIÓN:",
                        `
                        Por los servicios que preste <strong>EL TRABAJADOR</strong>,
                        <strong>EL EMPLEADOR</strong> reconocerá un salario integral básico por valor de
                        <strong>VALOR EN LETRAS ($$$$$$$$)</strong>, pagaderos por quincenas vencidas,
                        y en el lugar donde presta sus servicios, el cual con base en lo previsto en el
                        Artículo 132 del CST, subrogado por el Artículo 18 de la Ley 50 de 1990,
                        está compuesto de la siguiente manera:
                        `
                    )}

                    <div style="margin-left:28px;margin-bottom:6px;text-align:justify;">
                        - Un componente remunerativo por la suma de
                        <strong>VALOR EN LETRAS M/CTE ($$$$$$)</strong>
                        que corresponde a la remuneración ordinaria.
                    </div>

                    <div style="margin-left:28px;margin-bottom:8px;text-align:justify;">
                        - Un componente o factor prestacional del 30%, es decir la suma de
                        <strong>VALOR EN LETRAS M/CTE ($$$$$$$$$$$$)</strong>.
                        Este segundo componente compensa de antemano los siguientes derechos:
                    </div>

                    <div style="margin-left:28px;margin-bottom:4px;">
                        Prestaciones sociales
                    </div>

                    <div style="margin-left:45px;margin-bottom:4px;">
                        - Cesantía: 8.33% mensual.
                    </div>

                    <div style="margin-left:45px;margin-bottom:4px;">
                        - Prima de Servicios: 8.33% mensual.
                    </div>

                    <div style="margin-left:45px;margin-bottom:10px;">
                        - Intereses a la Cesantía: 1% mensual.
                    </div>


                    ${_bloqueContrato(`
                        La remuneración mensual ha sido pactada entre las partes como
                        <strong>SALARIO INTEGRAL</strong>, de conformidad con el artículo 18
                        de la Ley 50 de 1990 y dentro del mismo quedan comprendidos el pago
                        de auxilio de cesantías, los intereses sobre las cesantías, las primas
                        de servicio, el recargo por trabajo nocturno, el trabajo en dominicales
                        y festivos, recargo de
                    `)}

                </div>`;


                // ── PÁGINA 4 ──────────────────────────────────────────────────
                const htmlPagina4 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación texto página 3 -->
                        ${_bloqueContrato(`
                            horas extras, disponibilidad, la incidencia prestacional de los viáticos en la liquidación
                            de cualquier derecho, los suministros en especie, los subsidios de cualquier tipo, las primas,
                            bonificaciones, la compensación en dinero de descansos compensatorios, excepto el disfrute
                            de las vacaciones.
                        `)}
                        
                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO:",
                        `
                        Se conviene expresamente que el 82.5% de los ingresos que reciba
                        <strong>EL TRABAJADOR</strong> por concepto de cualquier modalidad fija
                        o variable de salario, constituye remuneración ordinaria y el 17.5%
                        restante está destinado a remunerar descansos en días dominicales y
                        festivos de que tratan los capítulos I y II del título VII del Código
                        Sustantivo del Trabajo.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO:",
                        `
                        Se deja previsto que <strong>EL EMPLEADOR</strong> tiene la facultad
                        de modificar las fechas y periodos de pago de manera unilateral siempre
                        que no sea mayor de un mes, debiendo notificar de manera oportuna a
                        <strong>EL TRABAJADOR</strong>.
                        `
                    )}

                    ${_tituloContrato(
                        "3.",
                        "PAGOS NO CONSTITUTIVOS DE SALARIO:",
                        `
                        <strong>EL TRABAJADOR</strong> y <strong>EL EMPLEADOR</strong>,
                        acuerdan expresamente que no constituyen salario los pagos o reconocimientos
                        que se le hagan al primero por concepto de beneficios o auxilios habituales
                        u ocasionales acordados convencional o contractualmente u otorgados en forma
                        extralegal por <strong>EL EMPLEADOR</strong>, tales como la alimentación,
                        habitación o vestuario, las primas o bonificaciones extralegales de vacaciones,
                        de servicios, auxilios o becas para estudios, auxilios por muerte de familiares
                        o por calamidad doméstica, auxilios o reconocimientos por medicamentos o consultas
                        médicas u odontológicas, o cualquier otro beneficio similar a los anteriormente
                        enunciados, de acuerdo con lo consagrado en el artículo 15 de la ley 50 de 1990.
                        `
                    )}

                    ${_bloqueContrato(`
                        Las partes acuerdan que la realización del pago del auxilio que pueda recibir
                        <strong>EL TRABAJADOR</strong> como resultado de su participación en el Programa
                        Metas, Programa Ideas o en el Programa GSP, no constituyen salario para ningún
                        afecto legal de conformidad con el artículo 128 del CST, subrogado por el artículo
                        15 de la ley 50 de 1990, debido a que se debe a mera liberalidad de la compañía.
                    `)}

                    ${_bloqueContrato(`
                        <strong>PARÁGRAFO:</strong>
                        Por tratarse de un beneficio extralegal, unilateral y de mera liberalidad
                        por parte del empleador, <strong>EL EMPLEADOR</strong> podrá eliminar,
                        suspender, ajustar y/o modificar el valor y condiciones para su
                        reconocimiento también de manera unilateral y en cualquier momento,
                        bastando únicamente la previa comunicación que de ello haga a
                        EL TRABAJADOR.
                    `)}

                </div>`;



                // ── PÁGINA 5 ──────────────────────────────────────────────────
                const htmlPagina5 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_tituloContrato(
                        "4.",
                        "DURACIÓN:",
                        `
                        El presente contrato de trabajo se ha pactado a término indefinido;
                        no obstante, tendrá vigencia mientras subsistan las causas que le dieron
                        origen, de acuerdo con las disposiciones legales sobre el particular.
                        De igual forma terminará por las causas contempladas en la ley.
                        `
                    )}


                    ${_tituloContrato(
                        "",
                        "PARÁGRAFO:",
                        `
                        En cumplimiento del deber general de las partes de ejecutar el contrato
                        de trabajo de buena fe, <strong>EL TRABAJADOR</strong> entiende que
                        en caso de dar por terminado de manera unilateral el contrato de trabajo
                        actualmente vigente, debe dar previo aviso a <strong>EL EMPLEADOR</strong>
                        sobre dicha decisión, con una antelación no inferior a treinta (30)
                        días calendario a la fecha de terminación del contrato.
                        `
                    )}

                    ${_tituloContrato(
                        "5.",
                        "PERÍODO DE PRUEBA:",
                        `
                        Los dos primeros meses del presente contrato, contados desde la fecha
                        en que se comienzan las labores, se consideran como
                        PERÍODO DE PRUEBA en el que
                        EL EMPLEADOR podrá apreciar las aptitudes de
                        <strong>EL TRABAJADOR</strong> y éste la conveniencia de las condiciones
                        de trabajo. Por lo tanto, durante este período, el contrato puede darse
                        por terminado unilateralmente en cualquier momento, sin previo aviso
                        y sin indemnización alguna.
                        `
                    )}

                    ${_tituloContrato(
                        "6.",
                        "POLIFUNCIONALIDAD – IUS VARIANDI FUNCIONAL:",
                        `
                        Como parte esencial de las funciones que
                        <strong>EL TRABAJADOR</strong> presta a su
                        <strong>EMPLEADOR</strong>, podrán dársele órdenes e instrucciones
                        para que preste servicios a otras empresas con las cuales
                        <strong>EL EMPLEADOR</strong> esté vinculado a cualquier título,
                        sin que ello implique retribuciones, salarios u honorarios diferentes
                        a los acordados entre las partes.
                        `
                    )}

                    ${_bloqueContrato(
                        `
                        Queda expresamente previsto que la característica de la estructura
                        de cargos de la empresa es la polifuncionalidad en virtud de la cual
                        el trabajador puede ser asignado a las tareas que, según el plan de
                        trabajo y los objetivos de la misma, entre las actividades propias
                        del nivel que le corresponde y en la medida en que se requiera deberá
                        realizar las labores afines, conexas, anexas o complementarias a
                        aquellas inicialmente acordadas.
                        `
                    )}

                    ${_bloqueContrato(
                        `
                        <strong>EL TRABAJADOR</strong> reconoce y acepta que la característica
                        de la estructura de cargos de la empresa es la poliasignación, en virtud
                        de la cual el trabajador puede ser asignado a las tareas que el empleador
                        determine según el plan de trabajo y los objetivos empresariales y de acuerdo
                        con el nivel funcional que le corresponde a
                        <strong>EL TRABAJADOR</strong>.
                        `
                    )}

                    <!-- Continuación hacia página 6 -->
                    ${_bloqueContrato(`
                        De la misma forma, <strong>EL TRABAJADOR</strong> reconoce y acepta
                        la posibilidad de desarrollar sus funciones directamente para
                        <strong>EL EMPLEADOR</strong> o para cualquier otra empresa o sociedad que
                    `)}

                </div>`;

                // ── PÁGINA 6 ──────────────────────────────────────────────────
                const htmlPagina6 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 5 -->
                    ${_bloqueContrato(`
                        aquel designe de acuerdo con los convenios de colaboración
                        (o de cualquier otra naturaleza) que <strong>EL EMPLEADOR</strong>
                        haya celebrado para tal fin. De esa manera, para las partes es claro
                        que las relaciones que se establezcan entre el trabajador y los terceros
                        en virtud de la poliasignación mencionada en esta cláusula no se derivará
                        vínculo laboral alguno, toda vez que la subordinación se mantiene en cabeza
                        del empleador DIACO S.A. y será ejercida en virtud del contrato de trabajo
                        celebrado entre esta y <strong>EL TRABAJADOR</strong>.
                    `)}

                    ${_bloqueContrato(`
                        Se deja expresa constancia que, en atención a lo anteriormente expuesto,
                        se entenderán como funciones de <strong>EL TRABAJADOR</strong> aquellas
                        que le fueran asignadas en desarrollo del contrato suscrito entre las partes,
                        así como aquellas de soporte y apoyo que deba prestar en las empresas con
                        las cuales existan convenios de colaboración.
                    `)}

                    ${_tituloContrato(
                        "7.",
                        "FALTAS GRAVES:",
                        `
                        Constituyen faltas graves y como tal pueden llegar a constituir justas
                        causas para dar por terminado unilateralmente el contrato de trabajo por
                        parte de <strong>EL EMPLEADOR</strong>, además de las enumeradas en el
                        artículo 62, literal a) del CST, las que se califiquen como graves en el
                        Reglamento Interno de Trabajo y las siguientes que se consideran graves:
                        `
                    )}

                    ${_itemContrato("i.", `
                        La violación por parte de <strong>EL TRABAJADOR</strong> de cualquiera
                        de sus obligaciones legales, contractuales o reglamentarias.
                    `)}

                    ${_itemContrato("ii.", `
                        La ejecución por parte de <strong>EL TRABAJADOR</strong> de labores
                        remuneradas al servicio de terceros, inclusive en los periodos en que
                        <strong>EL TRABAJADOR</strong> se encuentre incapacitado, a menos que
                        exista permiso previo escrito de <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("iii.", `
                        Pelear, insultar, calumniar o indisponer con falsedades a los compañeros
                        de trabajo, o a quienes tengan en la Empresa las funciones de supervisores
                        o jefes.
                    `)}

                    ${_itemContrato("iv.", `
                        Abandonar el sitio de trabajo sin permiso de
                        <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("v.", `
                        Engañar a la EMPRESA, hacer uso de los permisos o licencias con fines
                        diferentes a lo solicitado, presentar incapacidades sin estar enfermo,
                        y/o documentos o informes falsos para obtener beneficios o evitarse
                        perjuicios con <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("vi.", `
                        Hacer un trabajo distinto al asignado o accionar máquinas, herramientas
                        o equipos sin previa autorización de sus jefes inmediatos o mediatos.
                    `)}

                    ${_itemContrato("vii.", `
                        Hacer préstamos a usurarios, colectas, jugar dinero, cobrar comisiones
                        o efectuar ventas de mercancía sin permiso dentro de la EMPRESA.
                    `)}

                    ${_itemContrato("viii.", `
                        Dormir dentro de las horas de trabajo.
                    `)}

                    ${_itemContrato("ix.", `
                        Presentarse a las instalaciones de la Empresa alicorado, drogado,
                        o bajo el efecto de sustancias enervantes o alucinógenas, ingerirlas
                        o encontrarse en ese estado dentro de ella.
                    `)}

                </div>`;

                // ── PÁGINA 7 ──────────────────────────────────────────────────
                const htmlPagina7 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_itemContrato("x.", `
                        Alterar o burlar los controles ordenados o dispuestos por
                        <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("xi.", `
                        Violar las reglas o sistemas de seguridad establecidos por la EMPRESA.
                    `)}

                    ${_itemContrato("xii.", `
                        Entrar en sitios prohibidos sin autorización.
                    `)}

                    ${_itemContrato("xiii.", `
                        Desplazar objetos de propiedad de la EMPRESA o de sus trabajadores
                        o visitantes del sitio donde se encuentren sin permiso de su propietario.
                    `)}

                    ${_itemContrato("xiv.", `
                        El retardo injustificado en la hora de entrada al trabajo, por dos (2)
                        veces en un periodo de treinta (30) días.
                    `)}

                    ${_itemContrato("xv.", `
                        La falta al trabajo durante un día, sin excusa suficiente,
                        hasta por primera vez.
                    `)}

                    ${_itemContrato("xvi.", `
                        Intimidar o amenazar a los compañeros para que pertenezcan
                        o se retiren de determinado grupo o asociación de carácter político,
                        religioso, sindical o cultural, o para que tomen partido contra
                        determinada proposición que fuere de interés para la Empresa
                        o sus trabajadores.
                    `)}

                    ${_itemContrato("xvii.", `
                        Producir lesiones personales o daños de consideración en la
                        materia prima, herramientas, maquinarias, implementos de
                        seguridad y otros de trabajo, por negligencia o descuido.
                    `)}

                    ${_itemContrato("xviii.", `
                        Cualquier delito o contravención en que incurra
                        <strong>EL TRABAJADOR</strong> en perjuicio de los intereses de
                        <strong>EL EMPLEADOR</strong> o contra su vida, honra y bienes,
                        o contra sus representantes o compañeros de trabajo, sin perjuicio
                        de las acciones penales respectivas.
                    `)}

                    ${_itemContrato("xix.", `
                        La ejecución deficiente de las labores encomendadas a
                        <strong>EL TRABAJADOR</strong> a juicio de
                        <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("xx.", `
                        La revelación de cualquier secreto o acto reservado relacionado
                        con los negocios de <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("xxi.", `
                        Las desavenencias con sus compañeros de trabajo que lleguen
                        a crear dificultades para la buena marcha de la empresa a juicio
                        de <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("xxii.", `
                        Retener, sustraer o apropiarse de documentos o elementos
                        de trabajo de propiedad de <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_itemContrato("xxiii.", `
                        Presentar cuentas, recibos de gastos, facturas, informes o
                        cualquier otro documento ficticio, modificado, adulterado o
                        reportar como cumplidas actividades o tareas no efectuadas.
                    `)}

                    ${_itemContrato("xxiv.", `
                        Negarse a la aplicación de cualquier tipo de pruebas de alcoholemia,
                        que de manera aleatoria practique la empresa, a efectos de llevar
                        un control preventivo de riesgos y accidentes en el lugar de trabajo.
                    `)}

                    ${_bloqueContrato(`
                        Las demás que las partes establezcan como faltas graves,
                        en concordancia con lo establecido en el artículo 62,
                        literal a, numeral 6° del CST.
                    `)}

                </div>`;

                // ── PÁGINA 8 ──────────────────────────────────────────────────
                const htmlPagina8 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO: RESPONSABILIDAD.",
                        `
                        <strong>EL TRABAJADOR</strong> se obliga con
                        <strong>EL EMPLEADOR</strong> a cumplir todas las
                        responsabilidades que le sean asignadas respecto a:
                        `
                    )}

                    ${_itemContrato("a.", `
                        Funciones específicas del cargo determinadas en este documento
                        y en los manuales de perfil del cargo, así como, las demás que
                        le sean encomendadas conforme la naturaleza de la labor y la
                        marcha operacional del servicio.
                    `)}

                    ${_itemContrato("b.", `
                        Manejo adecuado de la información, cumplimiento de las políticas
                        y directrices adoptadas por <strong>EL EMPLEADOR</strong> para
                        garantizar un manejo apropiado y seguro de la información personal
                        y los datos propios de la operación que ostentan el carácter de
                        confidencial o reservado.
                    `)}

                    ${_itemContrato("c.", `
                        Manejo adecuado de la carga, considerándose esta como materia prima,
                        insumos, producto terminado, repuestos, entre otros, a los que tenga
                        acceso y relación por el cargo que desempeña.
                    `)}

                    ${_itemContrato("d.", `
                        Manejo adecuado y diligente de los recursos y dineros que le sean
                        asignados por <strong>EL EMPLEADOR</strong> para la ejecución de
                        sus funciones.
                    `)}

                    ${_itemContrato("e.", `
                        Desarrollo de actividades y conductas seguras establecidas por
                        <strong>EL EMPLEADOR</strong> para el bienestar y cuidado integral
                        de la salud de <strong>LOS TRABAJADORES</strong>, en general el cumplimiento de los
                        lineamientos establecidos por <strong>EL EMPLEADOR</strong> en el
                        marco de implementación del Sistema de Gestión de Seguridad y Salud
                        en el Trabajo. El incumplimiento de estas obligaciones constituye
                        una falta grave, que, desde ahora, acuerdan <strong>LAS PARTES</strong>, es considerada
                        una mala conducta y es causal para poner en ejecución las medidas
                        disciplinarias establecidas en el reglamento interno de trabajo y en
                        la normatividad laboral aplicable, en forma inmediata al conocimiento
                        que tenga <strong>EL EMPLEADOR</strong> de la violación.
                    `)}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO:",
                        `
                        <strong>EL TRABAJADOR</strong>, a la firma del presente documento,
                        manifiesta bajo la gravedad de juramento que no se encuentra vinculado
                        a investigaciones ni sanciones relacionadas con lavado de activos y
                        financiación del terrorismo y que tampoco se encuentra incluido en
                        ninguna lista restrictiva por conductas relacionadas con este tipo
                        de conductas delictivas. Por lo anterior,
                        <strong>EL TRABAJADOR</strong> acepta que en el caso de que, en las
                        verificaciones adelantadas por <strong>EL EMPLEADOR</strong>, se
                        presente alguna coincidencia en listas restrictivas relacionada con
                        lavado de activos y financiación del terrorismo, el presente contrato
                        de trabajo se terminará de inmediato, sin que se genere ningún tipo
                        de indemnización a favor de <strong>EL TRABAJADOR</strong>.
                        `
                    )}

                    ${_tituloContrato(
                        "8.",
                        "CONFLICTO DE INTERÉS:",
                        `
                        EL TRABAJADOR se compromete a actuar siempre con
                        lealtad, objetividad y transparencia en el ejercicio de sus funciones,
                        evitando situaciones que puedan afectar su independencia o generar un
                        conflicto entre sus intereses personales y los
                        `
                    )}

                </div>`;

                // ── PÁGINA 9 ──────────────────────────────────────────────────
                const htmlPagina9 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación cláusula 8 -->
                    ${_bloqueContrato(`
                        de <strong>EL EMPLEADOR</strong>.
                    `)}

                    ${_bloqueContrato(`
                        En caso de mantener o establecer cualquier tipo de relación personal, familiar,
                        comercial o de otra índole con otro trabajador, proveedor, cliente o tercero
                        vinculado con <strong>EL EMPLEADOR</strong>, que pudiera dar lugar a un potencial
                        conflicto de interés, <strong>EL TRABAJADOR</strong> se compromete a reportar
                        dicha situación de forma inmediata al área de Gestión de Personas, para que esta
                        evalúe y determine las medidas que correspondan.
                    `)}

                    ${_bloqueContrato(`
                        La omisión en el deber de informar oportunamente una posible situación de
                        conflicto de interés podrá considerarse una falta grave para todos los efectos legales.
                    `)}

                    ${_tituloContrato(
                        "9.",
                        "JORNADA LABORAL Y HORARIO:",
                        `
                        <strong>EL TRABAJADOR</strong> se obliga a laborar la jornada máxima legal
                        vigente en los turnos y dentro de las horas señalados por
                        <strong>EL EMPLEADOR</strong>, pudiendo hacer éste ajustes o cambios de
                        horario cuando lo estime conveniente.
                        `
                    )}

                    ${_bloqueContrato(`
                        Las partes pactan desde ahora, la posibilidad de que
                        <strong>EL EMPLEADOR</strong> disponga la organización de trabajo, de forma
                        permanente o temporal, en los términos y condiciones de la Jornada Flexible
                        contemplada en el Artículo 161 del C.S.T. adicionado por el Artículo 48 de
                        la Ley 789 de 2002.
                    `)}

                    ${_bloqueContrato(`
                        Por el acuerdo expreso o tácito de las partes, podrán repartirse las horas
                        de la jornada ordinaria en la forma prevista en el artículo 164 del Código
                        Sustantivo del Trabajo, modificado por el artículo 23 de la Ley 50 de 1990.
                        Igualmente se deja constancia que <strong>EL EMPLEADOR</strong> podrá disponer
                        de la organización de turnos de trabajo, de conformidad con lo establecido en
                        el artículo 165 del Código Sustantivo del Trabajo.
                    `)}

                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO:",
                        `
                        <strong>EL EMPLEADOR</strong> no reconocerá a
                        <strong>EL TRABAJADOR</strong> recargos adicionales al salario pactado,
                        cuando <strong>EL TRABAJADOR</strong> no haya sido previamente autorizado
                        expresamente y por escrito por un superior jerárquico, salvo cuando la necesidad
                        de tal trabajo se presente de manera imprevista, caso en el cual, deberá
                        ejecutarse y darse aviso inmediato al respectivo superior jerárquico.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO:",
                        `
                        Teniendo en cuenta las funciones y responsabilidades del cargo que desempeña
                        <strong>EL TRABAJADOR</strong>, las partes ratifican que este tiene la calidad
                        de DIRECCIÓN, CONFIANZA Y/O MANEJO quedando en consecuencia excluido de la
                        regulación sobre jornada máxima legal de trabajo de conformidad con lo
                        establecido en el texto vigente del artículo 162 del Código Sustantivo del Trabajo.
                        `
                    )}

                    ${_tituloContrato(
                        "10.",
                        "IUS VARIANDI TEMPORAL:",
                        `
                        En razón de las actividades que desempeña
                        <strong>EL TRABAJADOR</strong>
                        `
                    )}

                </div>`;

                // ── PÁGINA 10 ─────────────────────────────────────────────────
                const htmlPagina10 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación cláusula 10 -->
                    ${_bloqueContrato(`
                        en el cargo mencionado, el horario de trabajo es esencialmente flexible,
                        de lo cual <strong>EL TRABAJADOR</strong> manifiesta estar plenamente
                        enterado y consciente, a fin de estar en disposición de adecuarse a la
                        programación previamente divulgada.
                    `)}

                    ${_tituloContrato(
                        "11.",
                        "IUS VARIANDI GEOGRÁFICO:",
                        `
                        El lugar para el desempeño de las funciones será el que corresponda
                        a la ubicación geográfica de la empresa, y originalmente estará
                        asignado a la ciudad arriba indicada. Por lo tanto, queda claro que
                        debido a que la actividad de la empresa requiere de una asignación
                        flexible y eficiente del recurso humano,
                        <strong>EL TRABAJADOR</strong> se compromete a asumir los eventuales
                        cambios que se lleguen a requerir sobre el particular, para lo cual
                        bastará la notificación oportuna y previa que haga
                        <strong>EL EMPLEADOR</strong>, sobre las razones que hacen necesario
                        su traslado.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO:",
                        `
                        Ésta es una característica que las partes hacen explícita como un
                        supuesto para el logro de los objetivos de la empresa, y como tal
                        el trabajador declara conocerla suficientemente y estar en disposición
                        de adaptarse personal y familiarmente a la misma, pues dicha flexibilidad
                        es una condición esencial para la celebración de este contrato y/o la
                        asignación del cargo que se le confía.
                        `
                    )}

                    ${_tituloContrato(
                        "12.",
                        "PRINCIPALES FUNCIONES:",
                        `
                        Las principales funciones a desempeñar por
                        <strong>EL TRABAJADOR</strong> y a las que se obliga expresamente
                        son las propias del cargo arriba mencionado, las cuales se encuentran
                        establecidas en el Manual de Funciones que para tales efectos tiene
                        establecido <strong>EL EMPLEADOR</strong>; y por lo tanto, las que
                        a juicio de <strong>EL EMPLEADOR</strong>, éste deba cumplir, de
                        conformidad con las órdenes e instrucciones que le sean entregadas,
                        y de acuerdo con lo previsto en el artículo 58, numeral 1° del
                        Código Sustantivo del Trabajo, que para todos los efectos se entenderán
                        como parte integrante del presente contrato.
                        `
                    )}

                    ${_tituloContrato(
                        "13.",
                        "CONFIDENCIALIDAD:",
                        `
                        <strong>EL TRABAJADOR</strong> se obliga a no divulgar, directa o
                        indirectamente, de manera total o parcial cualquier información,
                        concepto, dato y/o documentación verbal, escrita, fotografías y/o
                        videos obtenidos de LA EMPRESA por razón, con ocasión, o como
                        consecuencia de la ejecución del presente contrato, y a no hacer
                        un uso indebido de la misma, inclusive, con posterioridad a la
                        terminación del contrato por cualquier causa.
                        `
                    )}

                    ${_bloqueContrato(`
                        Asimismo, se abstendrá de revelar o divulgar información a terceros,
                        o utilizarla para fines propios diferentes de los que constituyen
                        el objeto del presente contrato de trabajo, sin autorización previa
                        y escrita de LA EMPRESA, u orden legítima de autoridad competente.
                        Lo mismo es aplicable a la información, concepto, dato, documentación,
                        información verbal o escrita, fotografías y/o videos que, aunque no
                        hayan sido adquiridos directamente de LA EMPRESA, fuera obtenida en
                        ejecución o desarrollo del presente Contrato.
                    `)}

                </div>`;

                // ── PÁGINA 11 ─────────────────────────────────────────────────
                const htmlPagina11 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_paragrafoContrato(
                        "PARÁGRAFO PRIMERO:",
                        `
                        En el evento en que <strong>EL TRABAJADOR</strong> incumpla la obligación
                        a que se refiere esta cláusula, se configurará la causal de terminación
                        del contrato de trabajo en los términos de los numerales 6º y 8º del
                        literal a) del artículo 7 del decreto 2351 de 1965, sin perjuicio de
                        las acciones civiles y penales que pueda interponer la sociedad
                        <strong>DIACO S.A.</strong> con posterioridad a la desvinculación.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO SEGUNDO:",
                        `
                        Las partes acuerdan que los documentos confidenciales de propiedad
                        de la empresa, tales como los estados financieros, documentos sobre
                        clientes y proyectos trabajados, estrategias empresariales,
                        proyecciones y presupuestos, información de nómina y cualquier otro
                        tipo de información, solo podrán ser entregados a terceros por parte
                        de <strong>EL TRABAJADOR</strong> previa autorización otorgada por el
                        jefe inmediato o la persona que la compañía haya autorizado para tal fin.
                        `
                    )}

                    ${_bloqueContrato(`
                        <strong>EL TRABAJADOR</strong> se hará responsable por cualquier
                        violación a la obligación de confidencialidad pactada en el presente
                        contrato frente a la información que fuere suministrada por
                        <strong>EL EMPLEADOR</strong> a <strong>EL TRABAJADOR</strong> en virtud
                        del cumplimiento del objeto del presente CONTRATO. Las partes pactan
                        como cláusula penal de apremio una suma equivalente a veinte cuatro (24)
                        veces la suma expuesta en la cláusula segunda del presente.
                    `)}

                    ${_bloqueContrato(`
                        Ninguna de LAS PARTES comunicará o divulgará con respecto a los términos
                        de este contrato a ningún tercero sin el consentimiento expreso por escrito
                        de la otra parte, excepto si:
                    `)}

                    ${_itemContrato("a)", `
                        En relación con aquella información que sea de dominio público al momento
                        de la firma del CONTRATO;
                    `)}

                    ${_itemContrato("b)", `
                        Información que era conocida antes de la firma de este CONTRATO, siempre
                        que LA(S) PARTE(s) tenga(n) conocimiento efectivo de que dicha información
                        no está sujeta a ninguna obligación legal o contractual de confidencialidad;
                    `)}

                    ${_itemContrato("c)", `
                        Información que, aunque sea confidencial a la fecha de firma del CONTRATO,
                        será de conocimiento público durante su vigencia, sin culpa o intención
                        de ninguna de LAS PARTES o de un tercero que se haya visto obligado a
                        conservar dicha Información Confidencial; o información en virtud de la
                        cual exista una obligación legal, reglamentaria y/o judicial de revelar,
                        en cuyo caso la Información Confidencial deberá ser proporcionada
                        exclusivamente a aquellas personas que, en virtud de dicha obligación,
                        deban recibirla, en cuyo caso la información confidencial deberá ser
                    `)}

                </div>`;
                
                // ── PÁGINA 12 ─────────────────────────────────────────────────
                const htmlPagina12 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación cláusula 13 -->
                    ${_bloqueContrato(`
                        proporcionada exclusivamente a aquellas personas que, en virtud de dicha
                        obligación legal, reglamentaria o judicial, deban recibirla.
                    `)}

                    ${_bloqueContrato(`
                        Lo mismo es aplicable a la información, concepto dato y/o documentación
                        verbal o escrita que, aunque no haya sido adquirida directamente de
                        <strong>EL EMPLEADOR</strong>, fuera obtenida en ejecución del presente
                        contrato. <strong>EL TRABAJADOR</strong> será responsable de los perjuicios
                        que cause por el incumplimiento de esta obligación.
                    `)}

                    ${_tituloContrato(
                        "14.",
                        "DESCUENTOS:",
                        `
                        <strong>EL TRABAJADOR</strong> autoriza desde ahora a
                        <strong>EL EMPLEADOR</strong> para que de sus salarios, prestaciones
                        sociales e indemnizaciones, le descuente, durante vigencia del contrato
                        o al momento de la terminación del mismo, por cualquier causa, las sumas
                        de dinero que por cualquier motivo le llegare a adeudar, especialmente
                        aquellas sumas que llegue a deber por razón del manejo de dinero o bienes
                        que se le confíen en razón de sus funciones de dirección, confianza o manejo.
                        `
                    )}

                    ${_tituloContrato(
                        "15.",
                        "INFORMACIÓN:",
                        `
                        Es obligación de <strong>EL TRABAJADOR</strong> informar por escrito
                        y de inmediato al <strong>EMPLEADOR</strong> cualquier cambio en su
                        dirección de residencia y teléfono además de cualquier información
                        que sea requerida por <strong>EL EMPLEADOR</strong>.
                        `
                    )}

                    ${_tituloContrato(
                        "16.",
                        "OTRAS NORMAS:",
                        `
                        Ambas partes declaran que en el presente contrato se entienden
                        incorporados los preceptos legales y las disposiciones de
                        <strong>EL EMPLEADOR</strong> que regulen las relaciones de trabajo.
                        Adicionalmente, <strong>EL TRABAJADOR</strong> se obliga a cumplir
                        el reglamento interno de trabajo y el reglamento de Higiene y Seguridad
                        Industrial, los cuales declara conocer. De igual forma es obligación
                        de <strong>EL TRABAJADOR</strong> conocer y acatar los Reglamentos
                        Internos de Trabajo y de Higiene y Seguridad Industrial que en el
                        futuro se aprueben.
                        `
                    )}

                    ${_tituloContrato(
                        "17.",
                        `
                        Las partes acuerdan que en virtud del contrato de servicios que tiene
                        celebrado la sociedad DIACO S.A. con las sociedades vinculadas a ésta,
                        `,
                        `
                        <strong>EL TRABAJADOR</strong> desarrollará como parte de sus funciones,
                        actividades relacionadas con éstas últimas entidades y que tienen por
                        objeto el cumplimiento del contrato mencionado, sin que por ello se
                        entienda que surge relación laboral o de ninguna otra índole entre ella
                        y <strong>EL TRABAJADOR</strong>, teniendo en cuenta que tales actividades
                        se cumplen en ejercicio del contrato de trabajo suscrito entre el colaborador
                        y la sociedad DIACO S.A. y dentro de la jornada en él convenida.
                        `
                    )}

                    ${_tituloContrato(
                        "18.",
                        "INTERPRETACIÓN:",
                        `
                        Este contrato ha sido redactado estrictamente de acuerdo con la ley y
                        la jurisprudencia y será interpretado de buena fe y en consonancia con
                        el Código Sustantivo del Trabajo cuyo objeto definitivo es su artículo
                        1ro. es lograr la justicia en las relaciones
                        `
                    )}

                </div>`;

                // ── PÁGINA 13 ──────────────────────────────────────────────────
                const htmlPagina13 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 12 -->
                    ${_bloqueContrato(`
                        entre EMPLEADORES Y TRABAJADORES, dentro de un espíritu de coordinación económica y
                        equilibrio social.
                    `)}

                    ${_tituloContrato(
                        "19.",
                        "",
                        `
                        El presente contrato reemplaza en su integridad y deja sin efecto alguno, cualquier otro
                        contrato verbal o escrito celebrado entre las partes con anterioridad. Las modificaciones
                        que se acuerden al presente contrato se anotarán a continuación de su texto.
                        `
                    )}

                    ${_tituloContrato(
                        "20.",
                        "PROTECCIÓN Y TRATAMIENTO DE DATOS PERSONALES:",
                        ""
                    )}

                    ${_tituloContrato(
                        "20.1.",
                        "AUTORIZACIÓN.",
                        `
                        En virtud de la Ley 1581 de 2012, <strong>EL TRABAJADOR</strong> titular de los
                        datos voluntariamente suministrados para la constitución y ejecución del presente
                        contrato autoriza a <strong>DIACO S.A.</strong> para hacer uso de los mismos con
                        fines laborales y los demás relacionados con el giro ordinario de los negocios de
                        esta empresa y que sean necesarios para la ejecución del presente contrato. El titular
                        declara conocer los derechos y condiciones del tratamiento de sus datos.
                        `
                    )}

                    ${_tituloContrato(
                        "20.2.",
                        "",
                        `
                        Los datos personales que sean recopilados por <strong>DIACO S.A.</strong> serán
                        tratados para las finalidades que sean autorizados por los titulares de la información.
                        Sin embargo, los datos también podrán ser tratados para las siguientes finalidades:
                        `
                    )}

                    ${_bulletContrato(`
                        Efectuar todas las gestiones necesarias para el desarrollo del objeto
                        social de <strong>DIACO S.A.</strong>, así como todo lo relacionado con el
                        cumplimiento del objeto del contrato celebrado entre la Compañía y
                        el Titular de la información, incluida la ejecución y terminación de
                        este.
                    `)}

                    ${_bulletContrato(`
                        Realizar invitaciones a eventos y ofrecer nuevos productos o
                        servicios.
                    `)}

                    ${_bulletContrato(`
                        Gestionar solicitudes, quejas o reclamos promovidos por el Titular o
                        para el ejercicio de los derechos y deberes de DIACO frente a las
                        diferentes autoridades, incluido pero sin limitarse, la rama judicial.
                    `)}

                    ${_bulletContrato(`
                        El ofrecimiento de servicios por parte de proveedores estratégicos
                        de <strong>DIACO S.A.</strong>, a fin de brindar al titular de la información acceso a
                        servicios o facilidades de pago para la adquisición de productos
                        ofrecidos por <strong>DIACO S.A.</strong>
                    `)}

                    ${_bulletContrato(`
                        Transmitir o transferir los datos a aliados, matriz, filiales o
                        subordinadas.
                    `)}

                    ${_bulletContrato(`
                        Consulta y reporte a centrales de riesgo, según sea el caso y las
                    `)}

                </div>`;

                // ── PÁGINA 14 ──────────────────────────────────────────────────
                const htmlPagina14 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 13 -->
                    <div style="margin-left:46px;margin-bottom:10px;text-align:justify;line-height:1.4;">
                        deudas que llegare a tener con la compañía.
                    </div>

                    ${_bulletContrato(`
                        Cumplimiento de régimenes tales como el SAGRILAFT y PTEE.
                    `)}

                    ${_bloqueContrato(`
                        Los datos personales recopilados serán usados, almacenados, procesados, transferidos
                        (nacional e internacionalmente) y circulados para las finalidades descritas en la Política de
                        Tratamiento de Datos personales disponible en la página de <strong>DIACO S.A.</strong> a la cual se tiene
                        acceso directo accediendo al siguiente enlace www.diaco.com.co. Dada la naturaleza del
                        contrato laboral y las condiciones bajo las cuales se llevará a cabo, <strong>DIACO S.A.</strong> tratará datos
                        personales sensibles, tales como datos de salud, raza, situación sentimental o género,
                        imagen, voz y/o video. Adicionalmente <strong>DIACO S.A.</strong> tendrá acceso a los datos de su familia,
                        tales como datos de sus hijos (para aspectos relacionados con beneficios o celebraciones a
                        los que estos puedan llegar a tener), cónyuge o familiares (para aspectos relacionados con
                        beneficios o celebraciones a los que estos puedan llegar a tener, contacto de emergencia,
                        entre otros).
                    `)}

                    ${_tituloContrato(
                        "20.3.",
                        "DERECHOS DEL TITULAR.",
                        `
                        Como titular de la información, según el artículo 8 de la Ley
                        1581 de 2012, usted tiene derecho a lo siguiente:
                        a) Conocer, actualizar y rectificar sus datos personales,
                        b) Solicitar prueba de la autorización otorgada;
                        c) Ser informado, previa solicitud, respecto del uso que le ha dado a sus datos personales;
                        d) Presentar ante la Superintendencia de Industria y Comercio quejas;
                        e) Revocar la autorización y/o solicitar la supresión del dato; y
                        f) Acceder en forma gratuita a sus datos personales que hayan sido objeto de Tratamiento.
                        `
                    )}

                    ${_tituloContrato(
                        "20.4.",
                        "TRATAMIENTO DE DATOS POR EL TRABAJADOR.",
                        `
                        <strong>EL TRABAJADOR</strong> tratará los datos personales que le transmita o transfiera
                        <strong>EL EMPLEADOR</strong> sólo para los fines relacionados con el presente contrato y en
                        cumplimiento de las obligaciones que fueron pactadas en el presente contrato. Así mismo,
                        <strong>EL TRABAJADOR</strong> se obliga a respetar todas las obligaciones que pudieran corresponderle
                        en virtud del presente contrato con arreglo a la normativa en materia de protección de datos
                        y manifiesta cumplir con las medidas de seguridad idóneas para proteger la información, su
                        confidencialidad, seguridad y acceso restringido, y garantiza el mantenimiento de estas
                        medidas de seguridad, así como cualesquiera otras que le fueren impuestas, de índole técnica,
                        de comportamiento y organizativa, necesarias para garantizar la seguridad de los datos de
                        carácter personal y evitar su alteración, pérdida, tratamiento o acceso no autorizado.
                        `
                    )}

                    ${_bloqueContrato(`
                        Así mismo, <strong>EL TRABAJADOR</strong> se compromete a cumplir con la Política de Tratamiento de
                    `)}

                </div>`;

                // ── PÁGINA 15 ──────────────────────────────────────────────────
                const htmlPagina15 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 14 -->
                    ${_bloqueContrato(`
                        Datos de <strong>EL EMPLEADOR</strong>, disponible en el enlace antes informado.
                        <strong>EL TRABAJADOR</strong> conoce que, en caso de incumplimiento de la presente,
                        se le impondrán las medidas disciplinarias y económicas respectivas, las que posiblemente
                        pueden conllevar a la aplicación de la cláusula penal expuesta en el presente, así como
                        la terminación de este contrato laboral y cualquier otro contrato que tenga con la compañía,
                        sin perjuicio de las indemnizaciones de perjuicios a que haya lugar y de las demás sanciones
                        previstas en el presente contrato.
                    `)}

                    ${_tituloContrato(
                        "21.",
                        "FECHA DE INICIACIÓN:",
                        `
                        Se deja constancia que <strong>EL TRABAJADOR</strong> inició sus labores el día
                        20 de abril del año 2026, fecha ésta que las partes consideran como la del
                        comienzo de la vigencia del presente contrato.
                        `
                    )}

                    ${_tituloContrato(
                        "22.",
                        "DÉCIMA: POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN:",
                        `
                        <strong>EL TRABAJADOR</strong> declara que conoce y acepta la Política de Seguridad
                        de la Información de <strong>EL EMPLEADOR</strong> y acepta que en caso de incumplimiento
                        el presente contrato se terminará con justa causa y se le impondrá a título apremio una
                        suma de dinero correspondiente a veinticuatro (24) veces el valor estipulado en la cláusula
                        segunda del presente contrato, sin perjuicio de las indemnizaciones de perjuicios a que haya
                        lugar y de las demás sanciones previstas en el presente contrato.
                        `
                    )}

                    ${_tituloContrato(
                        "23.",
                        "COMPLIANCE.",
                        `
                        A la firma del presente documento:
                        `
                    )}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> se comprometen a cumplir todas las leyes y regulaciones vigentes,
                        incluyendo la Ley 1778 de 2016, el FCPA, el UK Bribery Act y otras relacionadas con soborno,
                        corrupción y conflictos de interés.
                    `)}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> no ofrecerán, recibirán ni autorizarán pagos o beneficios ilegales
                        o corruptos, ni participarán en actividades que busquen obtener ventajas ilícitas.
                    `)}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> se comprometen a no inducir a empleados, funcionarios o entidades
                        políticas a obtener ventajas indebidas ni a influir en sus acciones de forma ilícita.
                    `)}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> no utilizarán fondos provenientes de actividades ilícitas ni
                        mantendrán relaciones con entidades involucradas en criminalidad, corrupción o terrorismo.
                    `)}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> aseguran que ni ellas ni sus representantes están bajo investigación,
                        condena, ni sancionados por corrupción o actividades ilícitas.
                    `)}

                </div>`;

                // ── PÁGINA 16 ──────────────────────────────────────────────────
                const htmlPagina16 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 15 -->
                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> garantizarán que sus representantes no son funcionarios públicos
                        y informarán sobre cualquier cambio en este estatus.
                    `)}

                    ${_bloqueContrato(`
                        Las <strong>PARTES</strong> asumirán la responsabilidad por los actos indebidos de sus empleados,
                        representantes o subcontratados, garantizando el cumplimiento de las leyes y normativas
                        aplicables.
                    `)}

                    ${_tituloContrato(
                        "24.",
                        "DECLARACIÓN DE PROCEDENCIA LÍCITA DE ACTIVOS Y DE CARENCIA DE ANTECEDENTES O RIESGOS DE INVESTIGACIÓN POR ACTIVIDADES ILÍCITAS:",
                        `
                        <strong>EL TRABAJADOR</strong>, <strong>LAS PARTES</strong> declaran, basadas en buena fe y tras
                        indagaciones razonables, que durante la vigencia del contrato:
                        `
                    )}

                    ${_itemContrato("i.", `
                        Los activos de su patrimonio, no provienen ni han sido utilizados para actividades
                        ilícitas según la Ley 190 de 1995, Ley 747 de 2002, Ley 1121 de 2006, Ley 30 de 1986
                        y demás normas aplicables.
                    `)}

                    ${_itemContrato("ii.", `
                        No existen sanciones, investigaciones en curso, ni sentencias en firme contra ellas, sus
                        representantes legales, miembros de junta directiva, accionistas, socios o empleados
                        por actividades ilícitas, ni aparecen en listas nacionales o internacionales de
                        prevención de lavado de activos o actividades terroristas.
                    `)}

                    ${_itemContrato("iii.", `
                        En caso de nuevas disposiciones legales que tipifiquen conductas ilícitas, las
                        <strong>PARTES</strong> se comprometen a hacer las declaraciones necesarias conforme
                        se requiera.
                    `)}

                    ${_bloqueContrato(`
                        Si en cualquier momento se constata que estas declaraciones no son válidas o se niegan a
                        declarar sobre nuevas conductas ilícitas, la <strong>PARTE</strong> cumplida podrá rescindir
                        el contrato unilateralmente y sin indemnización.
                    `)}

                    ${_tituloContrato(
                        "25.",
                        "PROGRAMA DE TRANSPARENCIA Y ÉTICA EMPRESARIAL:",
                        `
                        <strong>EL EMPLEADO</strong> reconoce haber sido informado por <strong>DIACO S.A.</strong>
                        sobre su obligación de cumplir con las normas de prevención del Soborno Transnacional
                        y Corrupción y se compromete a conocer el Programa implementado por
                        <strong>DIACO S.A.</strong>, disponible en su página web, así como las consecuencias
                        de su incumplimiento. <strong>EL EMPLEADO</strong> acepta que <strong>DIACO S.A.</strong>
                        puede realizar procedimientos de Debida Diligencia para verificar el cumplimiento de
                        estas obligaciones. El incumplimiento de conductas definidas por la Ley colombiana
                        como Soborno Transnacional y Corrupción será considerado una falta grave, permitiendo
                        a <strong>DIACO S.A.</strong> terminar el contrato de manera unilateral, sin previo aviso
                        ni indemnización, y hacer exigibles las penalidades pactadas.
                        `
                    )}

                </div>`;

                // ── PÁGINA 17 ──────────────────────────────────────────────────
                const htmlPagina17 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    ${_tituloContrato(
                        "26.",
                        "CUMPLIMIENTO DE LAS OBLIGACIONES RELACIONADAS CON EL AUTOCONTROL Y LA GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM:",
                        `
                        <strong>EL EMPLEADO</strong> se compromete a dar cumplimiento a las políticas
                        y procedimientos establecidos por la Organización en materia de autocontrol y
                        gestión del riesgo integral de lavado y de activos, financiación del terrorismo
                        y financiación de la proliferación de armas de destrucción masiva (LA/FT/FPADM)
                        desarrollados en el correspondiente manual del sistema de autocontrol y gestión
                        del riesgo integral de LA/FT/FPADM - SAGRILAFT. Igualmente se compromete a dar
                        estricto y cabal cumplimiento a las funciones y responsabilidades asignadas frente
                        al SAGRILAFT. Su incumplimiento dará lugar a la correspondiente sanción según sea
                        establecido en el reglamento interno de trabajo de la Organización y/o Código de ética.
                        `
                    )}

                    ${_tituloContrato(
                        "27.",
                        "RESERVA DE LA INFORMACIÓN DEL SISTEMA DE AUTOCONTROL Y GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM:",
                        `
                        <strong>EL EMPLEADO</strong> se compromete a guardar reserva de la información y
                        documentos que tenga conocimiento de los clientes, proveedores, accionistas y empleados
                        producto de la aplicación de las políticas y procedimientos del sistema de autocontrol
                        y gestión del riesgo integral de LA/FT/FPADM. De la misma forma, se compromete a guardar
                        reserva de la información reportada a las autoridades competentes en virtud de los
                        procedimientos establecidos en el mencionado sistema.
                        `
                    )}

                    ${_tituloContrato(
                        "28.",
                        "OBLIGACIÓN DE REPORTAR SEÑALES DE ALERTA, SITUACIONES U OPERACIONES INUSUALES:",
                        `
                        <strong>EL EMPLEADO</strong> se obliga a reportar de forma inmediata al Oficial de
                        Cumplimiento de la Organización todas las situaciones inusuales que evidencie y que
                        pueden involucrar situaciones de lavado de activos, financiación del terrorismo y
                        financiación de la proliferación de armas de destrucción masiva LA/FT/FPADM según lo
                        establecido en el manual del sistema de autocontrol y gestión del riesgo integral de
                        LA/FT/FPADM.
                        `
                    )}

                    ${_tituloContrato(
                        "29.",
                        "COMPROMISO DE CUMPLIMIENTO PROGRAMA DE NORMAS EN DERECHO A LA COMPETENCIA:",
                        `
                        <strong>EL EMPLEADO</strong> se compromete a cumplir en su totalidad lo establecido
                        en el Decreto 2153 de 1992, Ley 256 de 1996, Ley 155 de 1959, Ley 1340 de 2009, y todas
                        las normas y regulaciones aplicables al régimen de protección de libre competencia.
                        Asimismo, declara que se compromete a que todas las actividades que en virtud de esta
                        relación contractual se ejecuten serán realizadas de conformidad con los más elevados
                        estándares de transparencia, integridad, legalidad y respetando el Código de Ética,
                        y todas las demás políticas internas de la compañía.
                        `
                    )}

                </div>`;

                // ── PÁGINA 18 ──────────────────────────────────────────────────
                const htmlPagina18 = `
                <div style="${STYLE}width:100%;box-sizing:border-box;">

                    ${HEADER}

                    <!-- Continuación página 17 -->
                    ${_bloqueContrato(`
                        Adicionalmente, <strong>EL EMPLEADO</strong> declara que no ha sido sancionado, ni está siendo
                        investigado por la Superintendencia de Industria y Comercio por algún tipo de restricción de
                        la competencia, y en ese mismo orden de ideas que no es parte de ningún proceso por
                        restricción de la competencia o competencia desleal.
                    `)}

                    ${_tituloContrato(
                        "30.",
                        "ADOPCIÓN MEDIDAS CONTRA EL ACOSO SEXUAL (LEY 2365 DE 2024):",
                        `
                        <strong>EL TRABAJADOR</strong> conoce que, en virtud de la Ley 2365 de 2024,
                        <strong>EL EMPLEADOR</strong> adoptó las medidas y obligaciones allí indicadas,
                        por lo cual, cuenta con un protocolo interno de prevención de acoso sexual, con
                        un órgano competente para conocer de estas situaciones, con un procedimiento
                        que se debe seguir en caso de que se presenten quejas de presunto acoso sexual,
                        así como las demás previstas en dicha norma. Así mismo,
                        <strong>EL TRABAJADOR</strong> conoce que todas las obligaciones y prohibiciones
                        que surjan en torno al acoso sexual se encuentran incorporadas al contrato de
                        trabajo, considerándose una falta grave el incumplimiento de estas.
                        `
                    )}

                    ${_paragrafoContrato(
                        "PARÁGRAFO:",
                        `
                        La Ley 2365 de 2024 se aplica a trabajadores, contratistas, agentes,
                        pasantes y aprendices.
                        `
                    )}

                    <p ${PJUST} style="margin-top:24px;">
                        Del presente documento se han extendido dos ejemplares del mismo contenido,
                        uno para <strong>EL EMPLEADOR</strong> y otro para
                        <strong>EL TRABAJADOR</strong>, los cuales firmamos ante testigos en la ciudad
                        de <strong>BOGOTÁ</strong> el día <strong>20 DE ABRIL DE 2026</strong>.
                    </p>

                    <!-- Firmas -->
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-top:50px;
                        padding:0 20px;
                    ">

                        <!-- EMPLEADOR -->
                        <div style="width:40%;">

                            <div style="
                                font-weight:bold;
                                margin-bottom:70px;
                            ">
                                EMPLEADOR
                            </div>

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                                font-weight:bold;
                            ">
                                LAURA CRISTINA CERÓN MUÑOZ
                            </div>

                            <div style="margin-top:2px;">
                                XXXXXXXXXXXXXXXXXXXXXXX
                            </div>

                            <div style="margin-top:2px;font-weight:bold;">
                                C.C. No. 52.705.312
                            </div>

                        </div>

                        <!-- TRABAJADOR -->
                        <div style="width:40%;">

                            <div style="
                                font-weight:bold;
                                margin-bottom:70px;
                            ">
                                TRABAJADOR
                            </div>

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                                min-height:18px;
                            ">
                                &nbsp;
                            </div>

                            <div style="margin-top:2px;">
                                &nbsp;
                            </div>

                            <div style="margin-top:2px;font-weight:bold;">
                                C.C. No. XXXXXXXXXXXXXXX
                            </div>

                        </div>

                    </div>

                    <!-- Testigos -->
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-top:70px;
                        padding:0 20px;
                    ">

                        <div style="width:40%;">

                            <div style="
                                font-weight:bold;
                                margin-bottom:70px;
                            ">
                                TESTIGO
                            </div>

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                                min-height:18px;
                            ">
                                &nbsp;
                            </div>

                        </div>

                        <div style="width:40%;">

                            <div style="
                                font-weight:bold;
                                margin-bottom:70px;
                            ">
                                TESTIGO
                            </div>

                            <div style="
                                border-top:1px solid #000;
                                padding-top:6px;
                                min-height:18px;
                            ">
                                &nbsp;
                            </div>

                        </div>

                    </div>

                </div>`;

                // ── PÁGINA 10 ─────────────────────────────────────────────────
                const htmlBlanco = `<div style="${STYLE}width:100%;box-sizing:border-box;"><p style="margin:0;">&nbsp;</p></div>`;


                // ── Array final — página 19 es la única en blanco ─────────────
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
                    htmlPagina11,
                    htmlPagina12,
                    htmlPagina13,
                    htmlPagina14,
                    htmlPagina15,
                    htmlPagina16,
                    htmlPagina17, 
                    htmlPagina18,
                    htmlBlanco    //página en blanco
                ];

                // ── Carga plantilla de fondo ───────────────────────────────────
                const existingPdfBytes = await fetch("pdf/hojaDiaco.pdf")
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
                }

                pdfDoc.removePage(0);

                const pdfBytes = await pdfDoc.save();
                const fileName = `${user.firstName}_${user.lastName}_Contrato_Indefinido.pdf`;
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
            console.error("Error generando Contrato Indefinido:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    // ─── Word ─────────────────────────────────────────────────────────────────
    async function _generateWord(data) {
        const JSZip         = await _ensureJSZip();
        const templateBytes = await fetch("pdf/Contrato_Indefinido.docx").then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar Contrato_Indefinido.docx (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        const variables = {
            "[[Nombre]]":     data.sNombre,
            "[[Cedula]]":     data.sCedula,
            "[[Cargo]]":      data.sCargo,
            "[[Ciudad]]":     data.sCiudadWork,
            "[[Salario]]":    data.sSalario,
            "[[FechaInicio]]":data.sHireDate
        };

        const targets = ["word/document.xml","word/header1.xml","word/header2.xml","word/footer1.xml","word/footer2.xml"];

        for (const path of targets) {
            if (zip.files[path]) {
                let xml = await zip.files[path].async("string");
                for (const [key, value] of Object.entries(variables)) {
                    xml = xml.split(key).join(_escXml(value));
                    const frag = new RegExp("\\[\\[" + key.slice(2,-2).split("").map(c => c + "(?:<[^>]*>)*").join("") + "\\]\\]","g");
                    xml = xml.replace(frag, _escXml(value));
                }
                zip.file(path, xml);
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href  = URL.createObjectURL(blob);
        link.download = `${data.firstName}_${data.lastName}_Contrato_Indefinido.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        MessageToast.show("Documento Word generado correctamente.");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function _escXml(str) {
        return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
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

    function _formatSalary(value) {
        if (!value) return "";
        return "$ " + Number(value).toLocaleString("es-CO");
    }

    function _formatDateLong(dateInput) {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        const months = ["enero","febrero","marzo","abril","mayo","junio",
                        "julio","agosto","septiembre","octubre","noviembre","diciembre"];
        return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
    }

    return { onDownloadPDFContratoIndefIntegral };
});
