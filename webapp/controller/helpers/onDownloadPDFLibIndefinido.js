/**
 * onDownloadPDFLibIndefinido.js
 * Genera el PDF del Contrato Indefinido (Salario Integral) usando pdf-lib nativo.
 * Reemplaza el enfoque html2canvas página a página.
 *
 * Dependencias esperadas en el contexto SAP UI5 / CDN:
 *   window.PDFLib  (pdf-lib UMD) — debe estar cargado ANTES de llamar a generarPDFIndefinido
 *
 * Exporta (vía sap.ui.define): { generarPDFIndefinido }
 *
 * "datos" es el mismo objeto que ya construye View1.controller.js:
 * {
 *   sNombre, sCedula, sCargo, sCiudadWork, sDireccion, localDate,
 *   sSalario, sSalarioLetras, sPeriodoPago, sfechaContratacion,
 *   sCompRemunerativo, sCompRemunerativoLetras,
 *   sFactorPrestacional, sFactorPrestacionalLetras
 * }
 */
sap.ui.define([], function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────────────────
   * CONSTANTES DE PÁGINA  (tamaño carta en puntos: 612 × 792)
   * ──────────────────────────────────────────────────────────────────────── */
  const PW = 612;   // page width
  const PH = 792;   // page height
  const ML = 85;    // margin left
  const MR = 85;    // margin right
  const MT = 110;    // margin top
  const MB = 50;    // margin bottom
  const CW = PW - ML - MR;  // content width

  /* Tamaños base (pt). */
  const SZ_BASE  = 9;
  const SZ_TITLE = 12.5;
  const SZ_SMALL = 6;

  const PARA_GAP   = 4;
  const CLAUSE_GAP = 8;

  const CELL_BG = { r: 0.863, g: 0.933, b: 1 }; // #DCEEFF

  /* ─────────────────────────────────────────────────────────────────────────
   * CLASE "CURSOR"
   * ──────────────────────────────────────────────────────────────────────── */
  class DocCursor {
    constructor(pdfDoc, fonts, templatePage) {
      this.doc    = pdfDoc;
      this.fonts  = fonts;
      this.templatePage = templatePage;
      this.pages  = [];
      this.page   = null;
      this.y      = 0;
      this._newPage();
    }

    _newPage() {
      const page = this.doc.addPage([PW, PH]);
      if (this.templatePage) {
          page.drawPage(this.templatePage, {
              x: 0,
              y: 0,
              width: PW,
              height: PH
          });
      }
      this.pages.push(page);
      this.page = page;
      this.y = PH - MT;
      this._drawHeader();
      this._drawVersionFooter();
    }

    forcePageBreak() {
          this._newPage();
      }

    _drawHeader() {
      const text = "CONTRATO DE TRABAJO A TÉRMINO INDEFINIDO (EMPLEADOS DE DIRECCIÓN,\nCONFIANZA Y MANEJO CON SALARIO INTEGRAL)";
      const lines = text.split("\n");
      const sz = SZ_TITLE;
      let y = this.y;
      for (const line of lines) {
        const w = this.fonts.bold.widthOfTextAtSize(line, sz);
        this.page.drawText(line, {
          x: ML + (CW - w) / 2,
          y,
          size: sz,
          font: this.fonts.bold,
          color: window.PDFLib.rgb(0, 0, 0),
        });
        y -= sz * 1.3;
      }
      this.y = y - 10;
    }

    _drawVersionFooter() {
      this.page.drawText("Versión: 23 de julio de 2025", {
        x: 50,
        y: 120,
        size: SZ_SMALL,
        font: this.fonts.reg,
        color: window.PDFLib.rgb(0, 0, 0),
      });
    }

    ensureSpace(needed) {
      if (this.y - needed < MB + 20) {
        this._newPage();
      }
    }

    drawMixed(segments, { extraGapAfter = PARA_GAP, indent = 0, size = SZ_BASE } = {}) {
      const maxW = CW - indent;

      const words = [];
      for (const seg of segments) {
        const font = seg.bold ? this.fonts.bold : this.fonts.reg;
        const parts = seg.text.split(/\s+/).filter(Boolean);
        for (const w of parts) words.push({ w, font });
      }

      if (!words.length) return;

      const lines = [];
      let lineWords = [];
      let lineWidth = 0;

      for (let i = 0; i < words.length; i++) {
        const { w, font } = words[i];
        const ww = font.widthOfTextAtSize(w, size);
        const space = lineWords.length ? this.fonts.reg.widthOfTextAtSize(" ", size) : 0;
        if (lineWords.length && lineWidth + space + ww > maxW) {
          lines.push(lineWords);
          lineWords = [{ w, font }];
          lineWidth = ww;
        } else {
          lineWords.push({ w, font });
          lineWidth += space + ww;
        }
      }
      if (lineWords.length) lines.push(lineWords);

      for (const line of lines) {
        this.ensureSpace(size * 1.3 + 2);
        let x = ML + indent;
        const isLast = line === lines[lines.length - 1];
        let extraSpace = 0;
        if (!isLast && line.length > 1) {
          const totalTextW = line.reduce((s, item, idx) => {
            const sp = idx > 0 ? this.fonts.reg.widthOfTextAtSize(" ", size) : 0;
            return s + sp + item.font.widthOfTextAtSize(item.w, size);
          }, 0);
          extraSpace = (maxW - totalTextW) / (line.length - 1);
          if (extraSpace > size * 0.8) extraSpace = 0;
        }

        for (let i = 0; i < line.length; i++) {
          const { w, font } = line[i];
          this.page.drawText(w, {
            x,
            y: this.y,
            size,
            font,
            color: window.PDFLib.rgb(0, 0, 0),
          });
          const ww = font.widthOfTextAtSize(w, size);
          const gap = i < line.length - 1
            ? this.fonts.reg.widthOfTextAtSize(" ", size) + extraSpace
            : 0;
          x += ww + gap;
        }
        this.y -= size * 1.3;
      }
      this.y -= extraGapAfter;
    }

    drawPara(text, opts = {}) {
      const { bold = false, ...rest } = opts;
      this.drawMixed([{ text, bold }], rest);
    }

    space(pts) {
      this.y -= pts;
      if (this.y < MB + 20) this._newPage();
    }

    drawLine(x1, x2, y, thickness = 0.5) {
      this.page.drawLine({
        start: { x: x1, y },
        end:   { x: x2, y },
        thickness,
        color: window.PDFLib.rgb(0, 0, 0),
      });
    }

    drawRect(x, y, w, h, color) {
      this.page.drawRectangle({
        x, y, width: w, height: h,
        color: window.PDFLib.rgb(color.r, color.g, color.b),
        borderWidth: 0,
      });
    }

    drawBorderRect(x, y, w, h) {
      this.page.drawRectangle({
        x, y, width: w, height: h,
        borderColor: window.PDFLib.rgb(0, 0, 0),
        borderWidth: 0.5,
        color: window.PDFLib.rgb(1, 1, 1),
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * HELPERS SEMÁNTICOS
   * ──────────────────────────────────────────────────────────────────────── */
  function clausula(cur, numero, titulo, texto) {
    cur.space(CLAUSE_GAP);
    const segs = [];
    if (numero) segs.push({ text: numero + " ", bold: true });
    if (titulo) segs.push({ text: titulo + " ", bold: true });
    if (texto)  segs.push({ text: texto.trim(), bold: false });
    cur.drawMixed(segs, { extraGapAfter: 4 });
  }

  function item(cur, letra, texto) {
    const letraW = cur.fonts.bold.widthOfTextAtSize(letra + "  ", SZ_BASE);
    const indent = letraW + 2;
    const maxW = CW - indent;

    cur.ensureSpace(SZ_BASE * 1.3 + 2);
    cur.page.drawText(letra, {
      x: ML,
      y: cur.y,
      size: SZ_BASE,
      font: cur.fonts.bold,
      color: window.PDFLib.rgb(0, 0, 0),
    });

    const words = texto.trim().split(/\s+/).filter(Boolean);
    let lines = [];
    let current = [];
    let lineW = 0;

    for (const word of words) {
      const font = cur.fonts.reg;
      const ww = font.widthOfTextAtSize(word, SZ_BASE);
      const sp = current.length ? font.widthOfTextAtSize(" ", SZ_BASE) : 0;
      const limit = maxW;
      if (current.length && lineW + sp + ww > limit) {
        lines.push(current);
        current = [word];
        lineW = ww;
      } else {
        current.push(word);
        lineW += sp + ww;
      }
    }
    if (current.length) lines.push(current);

    for (let li = 0; li < lines.length; li++) {
      if (li > 0) {
        cur.ensureSpace(SZ_BASE * 1.3 + 2);
      }
      let x = ML + indent;
      const lineWords = lines[li];
      const isLast = li === lines.length - 1;
      let extraSp = 0;
      if (!isLast && lineWords.length > 1) {
        const tw = lineWords.reduce((s, w, i) => {
          const sp2 = i > 0 ? cur.fonts.reg.widthOfTextAtSize(" ", SZ_BASE) : 0;
          return s + sp2 + cur.fonts.reg.widthOfTextAtSize(w, SZ_BASE);
        }, 0);
        const cand = (maxW - tw) / (lineWords.length - 1);
        extraSp = cand < SZ_BASE * 0.8 ? cand : 0;
      }
      for (let wi = 0; wi < lineWords.length; wi++) {
        const word = lineWords[wi];
        cur.page.drawText(word, {
          x,
          y: cur.y,
          size: SZ_BASE,
          font: cur.fonts.reg,
          color: window.PDFLib.rgb(0, 0, 0),
        });
        const ww = cur.fonts.reg.widthOfTextAtSize(word, SZ_BASE);
        const gap = wi < lineWords.length - 1
          ? cur.fonts.reg.widthOfTextAtSize(" ", SZ_BASE) + extraSp
          : 0;
        x += ww + gap;
      }
      cur.y -= SZ_BASE * 1.3;
    }
    cur.y -= 3;
  }

  function paragrafo(cur, titulo, texto) {
    cur.space(6);
    cur.drawMixed([
      { text: titulo + " ", bold: true },
      { text: texto.trim(), bold: false },
    ], { extraGapAfter: PARA_GAP });
  }

  function bloque(cur, texto, indent = 0) {
    cur.drawPara(texto.trim(), {
        extraGapAfter: PARA_GAP,
        indent
    });
  }

  function bullet(cur, texto) {
    const bul = "-";
    const bulW = cur.fonts.bold.widthOfTextAtSize(bul + "  ", SZ_BASE);
    const indent = bulW + 6;

    cur.ensureSpace(SZ_BASE * 1.3 + 2);
    cur.page.drawText(bul, {
      x: ML + 14,
      y: cur.y,
      size: SZ_BASE,
      font: cur.fonts.bold,
      color: window.PDFLib.rgb(0, 0, 0),
    });

    const maxW = CW - indent - 14;
    const words = texto.trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let cur2 = [];
    let lw = 0;
    for (const w of words) {
      const ww = cur.fonts.reg.widthOfTextAtSize(w, SZ_BASE);
      const sp = cur2.length ? cur.fonts.reg.widthOfTextAtSize(" ", SZ_BASE) : 0;
      if (cur2.length && lw + sp + ww > maxW) {
        lines.push(cur2);
        cur2 = [w]; lw = ww;
      } else {
        cur2.push(w); lw += sp + ww;
      }
    }
    if (cur2.length) lines.push(cur2);

    for (let li = 0; li < lines.length; li++) {
      if (li > 0) cur.ensureSpace(SZ_BASE * 1.3 + 2);
      let x = ML + 14 + indent;
      const ln = lines[li];
      ln.forEach((w) => {
        cur.page.drawText(w, {
          x, y: cur.y, size: SZ_BASE,
          font: cur.fonts.reg, color: window.PDFLib.rgb(0, 0, 0),
        });
        x += cur.fonts.reg.widthOfTextAtSize(w + " ", SZ_BASE);
      });
      cur.y -= SZ_BASE * 1.3;
    }
    cur.y -= 6;
  }

  function drawTableRow(cur, label, value, rowH) {
    const colW = CW * 0.45;
    const x1 = ML;
    const x2 = ML + colW;
    const y  = cur.y;

    cur.page.drawRectangle({ x: x1, y: y - rowH, width: colW, height: rowH,
      color: window.PDFLib.rgb(CELL_BG.r, CELL_BG.g, CELL_BG.b),
      borderColor: window.PDFLib.rgb(0,0,0), borderWidth: 0.5 });
    cur.page.drawRectangle({ x: x2, y: y - rowH, width: CW - colW, height: rowH,
      color: window.PDFLib.rgb(1,1,1),
      borderColor: window.PDFLib.rgb(0,0,0), borderWidth: 0.5 });

    cur.page.drawText(label, { x: x1 + 3, y: y - rowH + (rowH - SZ_BASE) / 2,
      size: SZ_BASE, font: cur.fonts.bold, color: window.PDFLib.rgb(0,0,0) });

    const maxValW = CW - colW - 6;
    let val = value || "";
    while (val.length > 0 && cur.fonts.reg.widthOfTextAtSize(val, SZ_BASE) > maxValW) {
      val = val.slice(0, -1);
    }
    cur.page.drawText(val, { x: x2 + 3, y: y - rowH + (rowH - SZ_BASE) / 2,
      size: SZ_BASE, font: cur.fonts.reg, color: window.PDFLib.rgb(0,0,0) });

    cur.y -= rowH;
  }

  function itemContinuation(cur, texto) {
      cur.drawMixed([
          { text: texto, bold: false }
      ], {
          indent: 18
      });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * FUNCIÓN PRINCIPAL
   * ──────────────────────────────────────────────────────────────────────── */
  async function generarPDFIndefinido(datos) {
    if (!window.PDFLib) {
      throw new Error("PDFLib no está cargado en window. Carga la librería antes de llamar a generarPDFIndefinido.");
    }
    const { PDFDocument, StandardFonts } = window.PDFLib;

    const {
      sNombre            = "",
      sCedula            = "",
      sCargo             = "",
      sCiudadWork        = "",
      sDireccion         = "",
      localDate          = "",
      sSalario           = "",
      sSalarioLetras     = "",
      sPeriodoPago       = "",
      sfechaContratacion = "",
      sCompRemunerativo        = "",
      sCompRemunerativoLetras  = "",
      sFactorPrestacional      = "",
      sFactorPrestacionalLetras = "",
    } = datos;

    const pdfDoc = await PDFDocument.create();

    // Cargar plantilla
    const plantillaBytes = await fetch("pdf/hojaDiaco.pdf")
        .then(r => r.arrayBuffer());

    // Embebe la única página del PDF
    const [templatePage] = await pdfDoc.embedPdf(plantillaBytes);

    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fonts = {
        reg: fontReg,
        bold: fontBold
    };

    const cur = new DocCursor(
        pdfDoc,
        fonts,
        templatePage
    );

    /* ── TABLA DE DATOS (página 1) ─────────────────────────────────────── */
    const ROW_H = 13;
    const rows = [
      ["EMPLEADOR",                        "DIACO S.A."],
      ["TRABAJADOR",                        sNombre],
      ["DOCUMENTO DE IDENTIDAD",            sCedula],
      ["CARGO",                             sCargo],
      ["LUGAR DE CELEBRACIÓN Y FECHA",      (sCiudadWork ? sCiudadWork + ", " : "") + localDate],
      ["LUGAR DONDE PRESTARÁ EL SERVICIO",  sCiudadWork],
      ["SALARIO BASICO",                    sSalario],
      ["PERÍODO DE PAGO",                   sPeriodoPago],
      ["FECHA DE INICIACIÓN DE LABORES",    sfechaContratacion],
      ["PERIODO DE PRUEBA",                 "Dos (2) meses"],
      ["DURACIÓN DEL CONTRATO",             "TÉRMINO INDEFINIDO"],
    ];
    cur.space(6);
    for (const [lbl, val] of rows) {
      cur.ensureSpace(ROW_H + 2);
      drawTableRow(cur, lbl, val, ROW_H);
    }
    cur.space(35);

    /* ── PÁRRAFO INTRODUCTORIO ─────────────────────────────────────────── */
    cur.drawMixed([
      { text: "Entre los suscritos a saber:", bold: false },
      { text: "DIACO S.A.", bold: true },
      { text: ", sociedad legalmente constituida, con domicilio en Bogotá, representada en este contrato por ", bold: false },
      { text: "LAURA CRISTINA CERÓN MUÑOZ", bold: true },
      { text: ", identificada con la cédula de ciudadanía número ", bold: false },
      { text: "52.705.312", bold: true },
      { text: " y quien para todos los efectos del presente contrato de trabajo se denominará ", bold: false },
      { text: "EL EMPLEADOR", bold: true },
      { text: ", y ", bold: false },
      { text: sNombre, bold: true },
      { text: ", identificado(a) con la cédula de ciudadanía número ", bold: false },
      { text: sCedula, bold: true },
      { text: " expedida en ", bold: false },
      { text: sCiudadWork, bold: true },
      { text: ", domiciliada en ", bold: false },
      { text: sDireccion, bold: true },
      { text: " obrando en nombre propio y quien para efectos del presente contrato se denominará ", bold: false },
      { text: "EL TRABAJADOR", bold: true },
      { text: ", hemos celebrado un contrato de trabajo según las siguientes cláusulas:", bold: false },
    ]);

    cur.space(20);

    /* CLÁUSULA 1 — OBLIGACIONES GENERALES */
    clausula(cur, "1.", "OBLIGACIONES GENERALES:", "EL EMPLEADOR contrata los servicios personales de EL TRABAJADOR, y éste se obliga a:");

    cur.space(10);

    item(cur, "a.", `Poner al servicio de EL EMPLEADOR toda su capacidad normal de trabajo, en forma exclusiva, en el desempeño de las funciones o labores propias, anexas o complementarias a los trabajos de una empresa metalúrgica, de conformidad con los reglamentos, órdenes e instrucciones que le impartan los representantes de EL EMPLEADOR, todo lo cual forma parte integrante del presente contrato, observando en su desempeño el cuidado y diligencia necesarios, especialmente como ${sCargo}, pudiendo EL EMPLEADOR cambiarlo de función cuando lo considere necesario.`);

    item(cur, "b.",`El servicio antedicho lo prestará EL TRABAJADOR en las dependencias donde EL EMPLEADOR tiene o tuviere sus actividades, pero se obliga a aceptar cualquier otro`);

    /* PAGINA 2 ----------------------------------------------------------------*/
    cur.forcePageBreak(); 

    itemContinuation(cur, 'empleo, cargo u oficio a donde lo promueva EL EMPLEADOR bajo su dependencia, y que sea capaz de desempeñar, especialmente cuando estos traslados se originen por la modernización de equipos, adopción de nuevas tecnologías y procesos o la implantación de nuevos sistemas, siempre que el cambio no implique desmejora de la remuneración básica de EL TRABAJADOR');
    
    item(cur, "c.", `A trabajar la jornada máxima legal establecida y de acuerdo con el horario y turno que EL EMPLEADOR le señale de conformidad con lo dispuesto en el literal d) del artículo 161 de C.S.T norma que fue adicionada por el artículo 51 de la ley 789 de 2002.`);

    item(cur, "d.", `EL TRABAJADOR cumplirá su jornada de trabajo en los turnos y horarios que determine EL EMPLEADOR dentro de un esquema de jornada de trabajo flexible. Por acuerdo expreso entre las partes la jornada diaria de trabajo podrá repartirse en la forma que resulte más adecuada conforme lo determine EL EMPLEADOR, teniendo en cuenta que los tiempos de descanso dentro de las secciones determinadas no se computan dentro de la jornada y que el presente contrato de trabajo se desarrollará dentro del marco de una jornada de trabajo flexible.`);

    item(cur, "e.", `A guardar en el desempeño de sus funciones y fuera de ellas, discreción, sigilo, lealtad, confidencia y estricta reserva de todo lo que llegue a su conocimiento en razón de su oficio, especialmente los secretos profesionales, industriales o comerciales de la Empresa, o que sean de naturaleza reservada, o aquellos asuntos cuya comunicación puedan causar perjuicio a EL EMPLEADOR.`);

    item(cur, "f.", `Responder por todos y cada uno de los elementos de trabajo que le entregue EL EMPLEADOR para el desempeño de su cargo;`);

    item(cur, "g.", `Devolver oportunamente los equipos, valores, documentos, carpetas y demás elementos de trabajo que le entregue EL EMPLEADOR para el desempeño de su cargo;`);

    item(cur, "h.", `Entregar oportunamente de conformidad con las instrucciones y los procedimientos establecidos, todos los equipos, valores, documentos, sumas de dinero y demás, que con destino a este reciba de terceros en ejercicio de su cargo;`);

    item(cur, "i.", `Consagrar toda su actividad en el desempeño de sus funciones, absteniéndose de ejecutar labores u ocupaciones que puedan entorpecer dicho desempeño o menoscabar su rendimiento personal, así como todas aquellas que emanen de la naturaleza de la labor contratada;`);

    item(cur, "j.", `Conservar y restituir en buen estado, salvo el deterioro natural, los instrumentos, máquinas, útiles y demás elementos que se le hayan facilitado.`);

    item(cur, "k.", `Guardar rigurosamente la moral con sus superiores y demás compañeros de trabajo;`);

    item(cur, "l.", `Comunicar oportunamente a EL EMPLEADOR las observaciones que estime conducentes a evitarle daños y perjuicios;`);

    /* PAGINA 3 ----------------------------------------------------------------*/
    cur.forcePageBreak(); 
    
    item(cur, "m.", `Prestar la colaboración posible en caso de siniestro o de riesgos inminentes que amenacen las personas y las cosas de EL EMPLEADOR;`);

    item(cur, "n.", `Observar las medidas preventivas higiénicas prescritas en el reglamento de higiene y seguridad industrial que para tal efecto se expida según las normas vigentes o las autoridades del ramo;`);

    item(cur, "o.", `Observar con suma diligencia y cuidado las instrucciones y órdenes preventivas de accidentes o enfermedades profesionales;`);

    item(cur, "p.", `Registrar en las oficinas del EMPLEADOR, su dirección, número de teléfono y domicilio y dar aviso inmediato de cualquier cambio que ocurra;`);

    item(cur, "q.", `Utilizar los elementos que EL EMPLEADOR le suministre para la realización de su trabajo;`);

    item(cur, "r.", `Avisar oportunamente a su superior inmediato sobre cualquier deficiencia que tengan los instrumentos, máquinas, equipos o implementos de labor con el fin de evitar accidentes, daños o costos adicionales.`);

    /* CLÁUSULA 2 — REMUNERACIÓN */
    clausula(cur, "2.", "REMUNERACIÓN:",
      `Por los servicios que preste EL TRABAJADOR, EL EMPLEADOR reconocerá un salario integral básico por valor de ${sSalario} (${sSalarioLetras}), pagaderos por quincenas vencidas, y en el lugar donde presta sus servicios, el cual con base en lo previsto en el Artículo 132 del CST, subrogado por el Artículo 18 de la Ley 50 de 1990, está compuesto de la siguiente manera:`);

    bloque(cur, `- Un componente remunerativo por la suma de ${sCompRemunerativoLetras} (${sCompRemunerativo}) que corresponde a la remuneración ordinaria.`, 20);

    bloque(cur, `- Un componente o factor prestacional del 30%, es decir la suma de ${sFactorPrestacionalLetras} (${sFactorPrestacional}) Este segundo componente compensa de antemano los siguientes derechos:`, 20);

    bloque(cur, "Prestaciones sociales", 20);
    bloque(cur, "    - Cesantía: 8.33% mensual.", 40);
    bloque(cur, "    - Prima de Servicios: 8.33% mensual.", 40);
    bloque(cur, "    - Intereses a la Cesantía: 1% mensual.", 40);

    bloque(cur, `La remuneración mensual ha sido pactada entre las partes como SALARIO INTEGRAL, de conformidad con el
      artículo 18 de la Ley 50 de 1990 y dentro del mismo quedan comprendidos el pago de auxilio de cesantías, los
      intereses sobre las cesantías, las primas de servicio, el recargo por trabajo nocturno, el trabajo en dominicales
      y festivos, recargo de`
    );

    /* PAGINA 4 -------------------------------------------------------------------------------------*/
    cur.forcePageBreak(); 

    bloque(cur, ` horas extras, disponibilidad, la incidencia prestacional de los viáticos en la liquidación de
      cualquier derecho, los suministros en especie, los subsidios de cualquier tipo, las primas, bonificaciones, la
      compensación en dinero de descansos compensatorios, excepto el disfrute de las vacaciones`
    );
    
    paragrafo(cur, "PARÁGRAFO PRIMERO:", `Se conviene expresamente que el 82.5% de los ingresos que reciba EL TRABAJADOR por concepto de cualquier modalidad fija o variable de salario, constituye remuneración ordinaria y el 17.5% restante está destinado a remunerar descansos en días dominicales y festivos de que tratan los capítulos I y II del título VII del Código Sustantivo del Trabajo.`);

    paragrafo(cur, "PARÁGRAFO SEGUNDO:", `Se deja previsto que EL EMPLEADOR tiene la facultad de modificar las fechas y periodos de pago de manera unilateral siempre que no sea mayor de un mes, debiendo notificar de manera oportuna a EL TRABAJADOR.`);

    /* CLÁUSULA 3 — PAGOS NO CONSTITUTIVOS DE SALARIO */
    clausula(cur, "3.", "PAGOS NO CONSTITUTIVOS DE SALARIO:",
      `EL TRABAJADOR y EL EMPLEADOR, acuerdan expresamente que no constituyen salario los pagos o reconocimientos que se le hagan al primero por concepto de beneficios o auxilios habituales u ocasionales acordados convencional o contractualmente u otorgados en forma extralegal por EL EMPLEADOR, tales como la alimentación, habitación o vestuario, las primas o bonificaciones extralegales de vacaciones, de servicios, auxilios o becas para estudios, auxilios por muerte de familiares o por calamidad doméstica, auxilios o reconocimientos por medicamentos o consultas médicas u odontológicas, o cualquier otro beneficio similar a los anteriormente enunciados, de acuerdo con lo consagrado en el artículo 15 de la ley 50 de 1990.`);

    bloque(cur, `Las partes acuerdan que la realización del pago del auxilio que pueda recibir EL TRABAJADOR como resultado de su participación en el Programa Metas, Programa Ideas o en el Programa GSP, no constituyen salario para ningún afecto legal de conformidad con el artículo 128 del CST, subrogado por el artículo 15 de la ley 50 de 1990, debido a que se debe a mera liberalidad de la compañía.`);

    bloque(cur, `PARÁGRAFO: Por tratarse de un beneficio extralegal, unilateral y de mera liberalidad por parte del empleador, EL EMPLEADOR podrá eliminar, suspender, ajustar y/o modificar el valor y condiciones para su reconocimiento también de manera unilateral y en cualquier momento, bastando únicamente la previa comunicación que de ello haga a EL TRABAJADOR.`);

    /* PAGINA 5 -------------------------------------------------------------------------------------*/
    cur.forcePageBreak(); 

    /* CLÁUSULA 4 — DURACIÓN */
    clausula(cur, "4.", "DURACIÓN:",
      `El presente contrato de trabajo se ha pactado a término indefinido; no obstante, tendrá vigencia mientras subsistan las causas que le dieron origen, de acuerdo con las disposiciones legales sobre el particular. De igual forma terminará por las causas contempladas en la ley.`);

    clausula(cur, "", "PARÁGRAFO:",
      `En cumplimiento del deber general de las partes de ejecutar el contrato de trabajo de buena fe, EL TRABAJADOR entiende que en caso de dar por terminado de manera unilateral el contrato de trabajo actualmente vigente, debe dar previo aviso a EL EMPLEADOR sobre dicha decisión, con una antelación no inferior a treinta (30) días calendario a la fecha de terminación del contrato.`);

    /* CLÁUSULA 5 — PERÍODO DE PRUEBA */
    clausula(cur, "5.", "PERÍODO DE PRUEBA:",
      `Los dos primeros meses del presente contrato, contados desde la fecha en que se comienzan las labores, se consideran como PERÍODO DE PRUEBA en el que EL EMPLEADOR podrá apreciar las aptitudes de EL TRABAJADOR y éste la conveniencia de las condiciones de trabajo. Por lo tanto, durante este período, el contrato puede darse por terminado unilateralmente en cualquier momento, sin previo aviso y sin indemnización alguna.`);

    /* CLÁUSULA 6 — POLIFUNCIONALIDAD */
    clausula(cur, "6.", "POLIFUNCIONALIDAD – IUS VARIANDI FUNCIONAL:",
      `Como parte esencial de las funciones que EL TRABAJADOR presta a su EMPLEADOR, podrán dársele órdenes e instrucciones para que preste servicios a otras empresas con las cuales EL EMPLEADOR esté vinculado a cualquier título, sin que ello implique retribuciones, salarios u honorarios diferentes a los acordados entre las partes.`);

    bloque(cur, `Queda expresamente previsto que la característica de la estructura de cargos de la empresa es la polifuncionalidad en virtud de la cual el trabajador puede ser asignado a las tareas que, según el plan de trabajo y los objetivos de la misma, entre las actividades propias del nivel que le corresponde y en la medida en que se requiera deberá realizar las labores afines, conexas, anexas o complementarias a aquellas inicialmente acordadas.`);

    bloque(cur, `EL TRABAJADOR reconoce y acepta que la característica de la estructura de cargos de la empresa es la poliasignación, en virtud de la cual el trabajador puede ser asignado a las tareas que el empleador determine según el plan de trabajo y los objetivos empresariales y de acuerdo con el nivel funcional que le corresponde a EL TRABAJADOR.`);

    bloque(cur, `De la misma forma, EL TRABAJADOR reconoce y acepta la posibilidad de desarrollar sus funciones directamente para EL EMPLEADOR o para cualquier otra empresa o sociedad que`);

    /* PAGINA 6 -------------------------------------------------------------------------------------*/
    cur.forcePageBreak(); 

    bloque(cur, `aquel designe de acuerdo con los convenios de colaboración (o de cualquier otra naturaleza) que EL EMPLEADOR haya celebrado para tal fin. De esa manera, para las partes es claro que las relaciones que se establezcan entre el trabajador y los terceros en virtud de la poliasignación mencionada en esta cláusula no se derivará vínculo laboral alguno, toda vez que la subordinación se mantiene en cabeza del empleador DIACO S.A. y será ejercida en virtud del contrato de trabajo celebrado entre esta y EL TRABAJADOR.`);

    bloque(cur, `Se deja expresa constancia que, en atención a lo anteriormente expuesto, se entenderán como funciones de EL TRABAJADOR aquellas que le fueran asignadas en desarrollo del contrato suscrito entre las partes, así como aquellas de soporte y apoyo que deba prestar en las empresas con las cuales existan convenios de colaboración.`);

    /* CLÁUSULA 7 — FALTAS GRAVES */
    clausula(cur, "7.", "FALTAS GRAVES:",
      `Constituyen faltas graves y como tal pueden llegar a constituir justas causas para dar por terminado unilateralmente el contrato de trabajo por parte de EL EMPLEADOR, además de las enumeradas en el artículo 62, literal a) del CST, las que se califiquen como graves en el Reglamento Interno de Trabajo y las siguientes que se consideran graves:`);

    item(cur, "i.",    `La violación por parte de EL TRABAJADOR de cualquiera de sus obligaciones legales, contractuales o reglamentarias.`);
    item(cur, "ii.",   `La ejecución por parte de EL TRABAJADOR de labores remuneradas al servicio de terceros, inclusive en los periodos en que EL TRABAJADOR se encuentre incapacitado, a menos que exista permiso previo escrito de EL EMPLEADOR.`);
    item(cur, "iii.",  `Pelear, insultar, calumniar o indisponer con falsedades a los compañeros de trabajo, o a quienes tengan en la Empresa las funciones de supervisores o jefes.`);
    item(cur, "iv.",   `Abandonar el sitio de trabajo sin permiso de EL EMPLEADOR.`);
    item(cur, "v.",    `Engañar a la EMPRESA, hacer uso de los permisos o licencias con fines diferentes a lo solicitado, presentar incapacidades sin estar enfermo, y/o documentos o informes falsos para obtener beneficios o evitarse perjuicios con EL EMPLEADOR.`);
    item(cur, "vi.",   `Hacer un trabajo distinto al asignado o accionar máquinas, herramientas o equipos sin previa autorización de sus jefes inmediatos o mediatos.`);
    item(cur, "vii.",  `Hacer préstamos a usurarios, colectas, jugar dinero, cobrar comisiones o efectuar ventas de mercancía sin permiso dentro de la EMPRESA.`);
    item(cur, "viii.", `Dormir dentro de las horas de trabajo.`);
    item(cur, "ix.",   `Presentarse a las instalaciones de la Empresa alicorado, drogado, o bajo el efecto de sustancias enervantes o alucinógenas, ingerirlas o encontrarse en ese estado dentro de ella.`);
    
    /* PAGINA 8 -------------------------------------------------------------------------------------*/
    cur.forcePageBreak(); 
    
    item(cur, "x.",    `Alterar o burlar los controles ordenados o dispuestos por EL EMPLEADOR.`);
    item(cur, "xi.",   `Violar las reglas o sistemas de seguridad establecidos por la EMPRESA.`);
    item(cur, "xii.",  `Entrar en sitios prohibidos sin autorización.`);
    item(cur, "xiii.", `Desplazar objetos de propiedad de la EMPRESA o de sus trabajadores o visitantes del sitio donde se encuentren sin permiso de su propietario.`);
    item(cur, "xiv.",  `El retardo injustificado en la hora de entrada al trabajo, por dos (2) veces en un periodo de treinta (30) días.`);
    item(cur, "xv.",   `La falta al trabajo durante un día, sin excusa suficiente, hasta por primera vez.`);
    item(cur, "xvi.",  `Intimidar o amenazar a los compañeros para que pertenezcan o se retiren de determinado grupo o asociación de carácter político, religioso, sindical o cultural, o para que tomen partido contra determinada proposición que fuere de interés para la Empresa o sus trabajadores.`);
    item(cur, "xvii.", `Producir lesiones personales o daños de consideración en la materia prima, herramientas, maquinarias, implementos de seguridad y otros de trabajo, por negligencia o descuido.`);
    item(cur, "xviii.",`Cualquier delito o contravención en que incurra EL TRABAJADOR en perjuicio de los intereses de EL EMPLEADOR o contra su vida, honra y bienes, o contra sus representantes o compañeros de trabajo, sin perjuicio de las acciones penales respectivas.`);
    item(cur, "xix.",  `La ejecución deficiente de las labores encomendadas a EL TRABAJADOR a juicio de EL EMPLEADOR.`);
    item(cur, "xx.",   `La revelación de cualquier secreto o acto reservado relacionado con los negocios de EL EMPLEADOR.`);
    item(cur, "xxi.",  `Las desavenencias con sus compañeros de trabajo que lleguen a crear dificultades para la buena marcha de la empresa a juicio de EL EMPLEADOR.`);
    item(cur, "xxii.", `Retener, sustraer o apropiarse de documentos o elementos de trabajo de propiedad de EL EMPLEADOR.`);
    item(cur, "xxiii.",`Presentar cuentas, recibos de gastos, facturas, informes o cualquier otro documento ficticio, modificado, adulterado o reportar como cumplidas actividades o tareas no efectuadas.`);
    item(cur, "xxiv.", `Negarse a la aplicación de cualquier tipo de pruebas de alcoholemia, que de manera aleatoria practique la empresa, a efectos de llevar un control preventivo de riesgos y accidentes en el lugar de trabajo.`);

    bloque(cur, `Las demás que las partes establezcan como faltas graves, en concordancia con lo establecido en el artículo 62, literal a, numeral 6° del CST.`);

    paragrafo(cur, "PARÁGRAFO PRIMERO: RESPONSABILIDAD.", `EL TRABAJADOR se obliga con EL EMPLEADOR a cumplir todas las responsabilidades que le sean asignadas respecto a:`);

    item(cur, "a.", `Funciones específicas del cargo determinadas en este documento y en los manuales de perfil del cargo, así como, las demás que le sean encomendadas conforme la naturaleza de la labor y la marcha operacional del servicio.`);
    item(cur, "b.", `Manejo adecuado de la información, cumplimiento de las políticas y directrices adoptadas por EL EMPLEADOR para garantizar un manejo apropiado y seguro de la información personal y los datos propios de la operación que ostentan el carácter de confidencial o reservado.`);
    item(cur, "c.", `Manejo adecuado de la carga, considerándose esta como materia prima, insumos, producto terminado, repuestos, entre otros, a los que tenga acceso y relación por el cargo que desempeña.`);
    item(cur, "d.", `Manejo adecuado y diligente de los recursos y dineros que le sean asignados por EL EMPLEADOR para la ejecución de sus funciones.`);
    item(cur, "e.", `Desarrollo de actividades y conductas seguras establecidas por EL EMPLEADOR para el bienestar y cuidado integral de la salud de LOS TRABAJADORES, en general el cumplimiento de los lineamientos establecidos por EL EMPLEADOR en el marco de implementación del Sistema de Gestión de Seguridad y Salud en el Trabajo. El incumplimiento de estas obligaciones constituye una falta grave, que, desde ahora, acuerdan LAS PARTES, es considerada una mala conducta y es causal para poner en ejecución las medidas disciplinarias establecidas en el reglamento interno de trabajo y en la normatividad laboral aplicable, en forma inmediata al conocimiento que tenga EL EMPLEADOR de la violación.`);

    paragrafo(cur, "PARÁGRAFO SEGUNDO:",
      `EL TRABAJADOR, a la firma del presente documento, manifiesta bajo la gravedad de juramento que no se encuentra vinculado a investigaciones ni sanciones relacionadas con lavado de activos y financiación del terrorismo y que tampoco se encuentra incluido en ninguna lista restrictiva por conductas relacionadas con este tipo de conductas delictivas. Por lo anterior, EL TRABAJADOR acepta que en el caso de que, en las verificaciones adelantadas por EL EMPLEADOR, se presente alguna coincidencia en listas restrictivas relacionada con lavado de activos y financiación del terrorismo, el presente contrato de trabajo se terminará de inmediato, sin que se genere ningún tipo de indemnización a favor de EL TRABAJADOR.`);

    /* CLÁUSULA 8 — CONFLICTO DE INTERÉS */
    clausula(cur, "8.", "CONFLICTO DE INTERÉS:",
      `EL TRABAJADOR se compromete a actuar siempre con lealtad, objetividad y transparencia en el ejercicio de sus funciones, evitando situaciones que puedan afectar su independencia o generar un conflicto entre sus intereses personales y los de EL EMPLEADOR.`);

    bloque(cur, `En caso de mantener o establecer cualquier tipo de relación personal, familiar, comercial o de otra índole con otro trabajador, proveedor, cliente o tercero vinculado con EL EMPLEADOR, que pudiera dar lugar a un potencial conflicto de interés, EL TRABAJADOR se compromete a reportar dicha situación de forma inmediata al área de Gestión de Personas, para que esta evalúe y determine las medidas que correspondan.`);

    bloque(cur, `La omisión en el deber de informar oportunamente una posible situación de conflicto de interés podrá considerarse una falta grave para todos los efectos legales.`);

    /* CLÁUSULA 9 — JORNADA LABORAL */
    clausula(cur, "9.", "JORNADA LABORAL Y HORARIO:",
      `EL TRABAJADOR se obliga a laborar la jornada máxima legal vigente en los turnos y dentro de las horas señalados por EL EMPLEADOR, pudiendo hacer éste ajustes o cambios de horario cuando lo estime conveniente.`);

    bloque(cur, `Las partes pactan desde ahora, la posibilidad de que EL EMPLEADOR disponga la organización de trabajo, de forma permanente o temporal, en los términos y condiciones de la Jornada Flexible contemplada en el Artículo 161 del C.S.T. adicionado por el Artículo 48 de la Ley 789 de 2002.`);

    bloque(cur, `Por el acuerdo expreso o tácito de las partes, podrán repartirse las horas de la jornada ordinaria en la forma prevista en el artículo 164 del Código Sustantivo del Trabajo, modificado por el artículo 23 de la Ley 50 de 1990. Igualmente se deja constancia que EL EMPLEADOR podrá disponer de la organización de turnos de trabajo, de conformidad con lo establecido en el artículo 165 del Código Sustantivo del Trabajo.`);

    paragrafo(cur, "PARÁGRAFO PRIMERO:", `EL EMPLEADOR no reconocerá a EL TRABAJADOR recargos adicionales al salario pactado, cuando EL TRABAJADOR no haya sido previamente autorizado expresamente y por escrito por un superior jerárquico, salvo cuando la necesidad de tal trabajo se presente de manera imprevista, caso en el cual, deberá ejecutarse y darse aviso inmediato al respectivo superior jerárquico.`);

    paragrafo(cur, "PARÁGRAFO SEGUNDO:", `Teniendo en cuenta las funciones y responsabilidades del cargo que desempeña EL TRABAJADOR, las partes ratifican que este tiene la calidad de DIRECCIÓN, CONFIANZA Y/O MANEJO quedando en consecuencia excluido de la regulación sobre jornada máxima legal de trabajo de conformidad con lo establecido en el texto vigente del artículo 162 del Código Sustantivo del Trabajo.`);

    /* CLÁUSULAS 10 – 12 */
    clausula(cur, "10.", "IUS VARIANDI TEMPORAL:",
      `En razón de las actividades que desempeña EL TRABAJADOR en el cargo mencionado, el horario de trabajo es esencialmente flexible, de lo cual EL TRABAJADOR manifiesta estar plenamente enterado y consciente, a fin de estar en disposición de adecuarse a la programación previamente divulgada.`);

    clausula(cur, "11.", "IUS VARIANDI GEOGRÁFICO:",
      `El lugar para el desempeño de las funciones será el que corresponda a la ubicación geográfica de la empresa, y originalmente estará asignado a la ciudad arriba indicada. Por lo tanto, queda claro que debido a que la actividad de la empresa requiere de una asignación flexible y eficiente del recurso humano, EL TRABAJADOR se compromete a asumir los eventuales cambios que se lleguen a requerir sobre el particular, para lo cual bastará la notificación oportuna y previa que haga EL EMPLEADOR, sobre las razones que hacen necesario su traslado.`);

    paragrafo(cur, "PARÁGRAFO:", `Ésta es una característica que las partes hacen explícita como un supuesto para el logro de los objetivos de la empresa, y como tal el trabajador declara conocerla suficientemente y estar en disposición de adaptarse personal y familiarmente a la misma, pues dicha flexibilidad es una condición esencial para la celebración de este contrato y/o la asignación del cargo que se le confía.`);

    clausula(cur, "12.", "PRINCIPALES FUNCIONES:",
      `Las principales funciones a desempeñar por EL TRABAJADOR y a las que se obliga expresamente son las propias del cargo arriba mencionado, las cuales se encuentran establecidas en el Manual de Funciones que para tales efectos tiene establecido EL EMPLEADOR; y por lo tanto, las que a juicio de EL EMPLEADOR, éste deba cumplir, de conformidad con las órdenes e instrucciones que le sean entregadas, y de acuerdo con lo previsto en el artículo 58, numeral 1° del Código Sustantivo del Trabajo, que para todos los efectos se entenderán como parte integrante del presente contrato.`);

    /* CLÁUSULA 13 — CONFIDENCIALIDAD */
    clausula(cur, "13.", "CONFIDENCIALIDAD:",
      `EL TRABAJADOR se obliga a no divulgar, directa o indirectamente, de manera total o parcial cualquier información, concepto, dato y/o documentación verbal, escrita, fotografías y/o videos obtenidos de LA EMPRESA por razón, con ocasión, o como consecuencia de la ejecución del presente contrato, y a no hacer un uso indebido de la misma, inclusive, con posterioridad a la terminación del contrato por cualquier causa.`);

    bloque(cur, `Asimismo, se abstendrá de revelar o divulgar información a terceros, o utilizarla para fines propios diferentes de los que constituyen el objeto del presente contrato de trabajo, sin autorización previa y escrita de LA EMPRESA, u orden legítima de autoridad competente. Lo mismo es aplicable a la información, concepto, dato, documentación, información verbal o escrita, fotografías y/o videos que, aunque no hayan sido adquiridos directamente de LA EMPRESA, fuera obtenida en ejecución o desarrollo del presente Contrato.`);

    paragrafo(cur, "PARÁGRAFO PRIMERO:", `En el evento en que EL TRABAJADOR incumpla la obligación a que se refiere esta cláusula, se configurará la causal de terminación del contrato de trabajo en los términos de los numerales 6º y 8º del literal a) del artículo 7 del decreto 2351 de 1965, sin perjuicio de las acciones civiles y penales que pueda interponer la sociedad DIACO S.A. con posterioridad a la desvinculación.`);

    paragrafo(cur, "PARÁGRAFO SEGUNDO:", `Las partes acuerdan que los documentos confidenciales de propiedad de la empresa, tales como los estados financieros, documentos sobre clientes y proyectos trabajados, estrategias empresariales, proyecciones y presupuestos, información de nómina y cualquier otro tipo de información, solo podrán ser entregados a terceros por parte de EL TRABAJADOR previa autorización otorgada por el jefe inmediato o la persona que la compañía haya autorizado para tal fin.`);

    bloque(cur, `EL TRABAJADOR se hará responsable por cualquier violación a la obligación de confidencialidad pactada en el presente contrato frente a la información que fuere suministrada por EL EMPLEADOR a EL TRABAJADOR en virtud del cumplimiento del objeto del presente CONTRATO. Las partes pactan como cláusula penal de apremio una suma equivalente a veinte cuatro (24) veces la suma expuesta en la cláusula segunda del presente.`);

    bloque(cur, `Ninguna de LAS PARTES comunicará o divulgará con respecto a los términos de este contrato a ningún tercero sin el consentimiento expreso por escrito de la otra parte, excepto si:`);

    item(cur, "a)", `En relación con aquella información que sea de dominio público al momento de la firma del CONTRATO;`);
    item(cur, "b)", `Información que era conocida antes de la firma de este CONTRATO, siempre que LA(S) PARTE(s) tenga(n) conocimiento efectivo de que dicha información no está sujeta a ninguna obligación legal o contractual de confidencialidad;`);
    item(cur, "c)", `Información que, aunque sea confidencial a la fecha de firma del CONTRATO, será de conocimiento público durante su vigencia, sin culpa o intención de ninguna de LAS PARTES o de un tercero que se haya visto obligado a conservar dicha Información Confidencial; o información en virtud de la cual exista una obligación legal, reglamentaria y/o judicial de revelar, en cuyo caso la Información Confidencial deberá ser proporcionada exclusivamente a aquellas personas que, en virtud de dicha obligación, deban recibirla.`);

    bloque(cur, `Lo mismo es aplicable a la información, concepto dato y/o documentación verbal o escrita que, aunque no haya sido adquirida directamente de EL EMPLEADOR, fuera obtenida en ejecución del presente contrato. EL TRABAJADOR será responsable de los perjuicios que cause por el incumplimiento de esta obligación.`);

    /* CLÁUSULAS 14 – 19 */
    clausula(cur, "14.", "DESCUENTOS:",
      `EL TRABAJADOR autoriza desde ahora a EL EMPLEADOR para que de sus salarios, prestaciones sociales e indemnizaciones, le descuente, durante vigencia del contrato o al momento de la terminación del mismo, por cualquier causa, las sumas de dinero que por cualquier motivo le llegare a adeudar, especialmente aquellas sumas que llegue a deber por razón del manejo de dinero o bienes que se le confíen en razón de sus funciones de dirección, confianza o manejo.`);

    clausula(cur, "15.", "INFORMACIÓN:",
      `Es obligación de EL TRABAJADOR informar por escrito y de inmediato al EMPLEADOR cualquier cambio en su dirección de residencia y teléfono además de cualquier información que sea requerida por EL EMPLEADOR.`);

    clausula(cur, "16.", "OTRAS NORMAS:",
      `Ambas partes declaran que en el presente contrato se entienden incorporados los preceptos legales y las disposiciones de EL EMPLEADOR que regulen las relaciones de trabajo. Adicionalmente, EL TRABAJADOR se obliga a cumplir el reglamento interno de trabajo y el reglamento de Higiene y Seguridad Industrial, los cuales declara conocer. De igual forma es obligación de EL TRABAJADOR conocer y acatar los Reglamentos Internos de Trabajo y de Higiene y Seguridad Industrial que en el futuro se aprueben.`);

    clausula(cur, "17.", "",
      `Las partes acuerdan que en virtud del contrato de servicios que tiene celebrado la sociedad DIACO S.A. con las sociedades vinculadas a ésta, EL TRABAJADOR desarrollará como parte de sus funciones, actividades relacionadas con éstas últimas entidades y que tienen por objeto el cumplimiento del contrato mencionado, sin que por ello se entienda que surge relación laboral o de ninguna otra índole entre ella y EL TRABAJADOR, teniendo en cuenta que tales actividades se cumplen en ejercicio del contrato de trabajo suscrito entre el colaborador y la sociedad DIACO S.A. y dentro de la jornada en él convenida.`);

    clausula(cur, "18.", "INTERPRETACIÓN:",
      `Este contrato ha sido redactado estrictamente de acuerdo con la ley y la jurisprudencia y será interpretado de buena fe y en consonancia con el Código Sustantivo del Trabajo cuyo objeto definitivo es su artículo 1ro. es lograr la justicia en las relaciones entre EMPLEADORES Y TRABAJADORES, dentro de un espíritu de coordinación económica y equilibrio social.`);

    clausula(cur, "19.", "",
      `El presente contrato reemplaza en su integridad y deja sin efecto alguno, cualquier otro contrato verbal o escrito celebrado entre las partes con anterioridad. Las modificaciones que se acuerden al presente contrato se anotarán a continuación de su texto.`);

    /* CLÁUSULA 20 — PROTECCIÓN DE DATOS */
    clausula(cur, "20.", "PROTECCIÓN Y TRATAMIENTO DE DATOS PERSONALES:", "");

    clausula(cur, "20.1.", "AUTORIZACIÓN.",
      `En virtud de la Ley 1581 de 2012, EL TRABAJADOR titular de los datos voluntariamente suministrados para la constitución y ejecución del presente contrato autoriza a DIACO S.A. para hacer uso de los mismos con fines laborales y los demás relacionados con el giro ordinario de los negocios de esta empresa y que sean necesarios para la ejecución del presente contrato. El titular declara conocer los derechos y condiciones del tratamiento de sus datos.`);

    clausula(cur, "20.2.", "",
      `Los datos personales que sean recopilados por DIACO S.A. serán tratados para las finalidades que sean autorizados por los titulares de la información. Sin embargo, los datos también podrán ser tratados para las siguientes finalidades:`);

    bullet(cur, `Efectuar todas las gestiones necesarias para el desarrollo del objeto social de DIACO S.A., así como todo lo relacionado con el cumplimiento del objeto del contrato celebrado entre la Compañía y el Titular de la información, incluida la ejecución y terminación de este.`);
    bullet(cur, `Realizar invitaciones a eventos y ofrecer nuevos productos o servicios.`);
    bullet(cur, `Gestionar solicitudes, quejas o reclamos promovidos por el Titular o para el ejercicio de los derechos y deberes de DIACO frente a las diferentes autoridades, incluido pero sin limitarse, la rama judicial.`);
    bullet(cur, `El ofrecimiento de servicios por parte de proveedores estratégicos de DIACO S.A., a fin de brindar al titular de la información acceso a servicios o facilidades de pago para la adquisición de productos ofrecidos por DIACO S.A.`);
    bullet(cur, `Transmitir o transferir los datos a aliados, matriz, filiales o subordinadas.`);
    bullet(cur, `Consulta y reporte a centrales de riesgo, según sea el caso y las deudas que llegare a tener con la compañía.`);
    bullet(cur, `Cumplimiento de regímenes tales como el SAGRILAFT y PTEE.`);

    bloque(cur, `Los datos personales recopilados serán usados, almacenados, procesados, transferidos (nacional e internacionalmente) y circulados para las finalidades descritas en la Política de Tratamiento de Datos personales disponible en la página de DIACO S.A. a la cual se tiene acceso directo accediendo al siguiente enlace www.diaco.com.co. Dada la naturaleza del contrato laboral y las condiciones bajo las cuales se llevará a cabo, DIACO S.A. tratará datos personales sensibles, tales como datos de salud, raza, situación sentimental o género, imagen, voz y/o video. Adicionalmente DIACO S.A. tendrá acceso a los datos de su familia, tales como datos de sus hijos (para aspectos relacionados con beneficios o celebraciones a los que estos puedan llegar a tener), cónyuge o familiares (para aspectos relacionados con beneficios o celebraciones a los que estos puedan llegar a tener, contacto de emergencia, entre otros).`);

    clausula(cur, "20.3.", "DERECHOS DEL TITULAR.",
      `Como titular de la información, según el artículo 8 de la Ley 1581 de 2012, usted tiene derecho a lo siguiente: a) Conocer, actualizar y rectificar sus datos personales, b) Solicitar prueba de la autorización otorgada; c) Ser informado, previa solicitud, respecto del uso que le ha dado a sus datos personales; d) Presentar ante la Superintendencia de Industria y Comercio quejas; e) Revocar la autorización y/o solicitar la supresión del dato; y f) Acceder en forma gratuita a sus datos personales que hayan sido objeto de Tratamiento.`);

    clausula(cur, "20.4.", "TRATAMIENTO DE DATOS POR EL TRABAJADOR.",
      `EL TRABAJADOR tratará los datos personales que le transmita o transfiera EL EMPLEADOR sólo para los fines relacionados con el presente contrato y en cumplimiento de las obligaciones que fueron pactadas en el presente contrato. Así mismo, EL TRABAJADOR se obliga a respetar todas las obligaciones que pudieran corresponderle en virtud del presente contrato con arreglo a la normativa en materia de protección de datos y manifiesta cumplir con las medidas de seguridad idóneas para proteger la información, su confidencialidad, seguridad y acceso restringido, y garantiza el mantenimiento de estas medidas de seguridad, así como cualesquiera otras que le fueren impuestas, de índole técnica, de comportamiento y organizativa, necesarias para garantizar la seguridad de los datos de carácter personal y evitar su alteración, pérdida, tratamiento o acceso no autorizado.`);

    bloque(cur, `Así mismo, EL TRABAJADOR se compromete a cumplir con la Política de Tratamiento de Datos de EL EMPLEADOR, disponible en el enlace antes informado. EL TRABAJADOR conoce que, en caso de incumplimiento de la presente, se le impondrán las medidas disciplinarias y económicas respectivas, las que posiblemente pueden conllevar a la aplicación de la cláusula penal expuesta en el presente, así como la terminación de este contrato laboral y cualquier otro contrato que tenga con la compañía, sin perjuicio de las indemnizaciones de perjuicios a que haya lugar y de las demás sanciones previstas en el presente contrato.`);

    /* CLÁUSULAS 21 – 30 */
    clausula(cur, "21.", "FECHA DE INICIACIÓN:",
      `Se deja constancia que EL TRABAJADOR inició sus labores el día ${sfechaContratacion}, fecha ésta que las partes consideran como la del comienzo de la vigencia del presente contrato.`);

    clausula(cur, "22.", "DÉCIMA: POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN:",
      `EL TRABAJADOR declara que conoce y acepta la Política de Seguridad de la Información de EL EMPLEADOR y acepta que en caso de incumplimiento el presente contrato se terminará con justa causa y se le impondrá a título apremio una suma de dinero correspondiente a veinticuatro (24) veces el valor estipulado en la cláusula segunda del presente contrato, sin perjuicio de las indemnizaciones de perjuicios a que haya lugar y de las demás sanciones previstas en el presente contrato.`);

    clausula(cur, "23.", "COMPLIANCE.",
      `A la firma del presente documento:`);

    bloque(cur, `Las PARTES se comprometen a cumplir todas las leyes y regulaciones vigentes, incluyendo la Ley 1778 de 2016, el FCPA, el UK Bribery Act y otras relacionadas con soborno, corrupción y conflictos de interés.`);
    bloque(cur, `Las PARTES no ofrecerán, recibirán ni autorizarán pagos o beneficios ilegales o corruptos, ni participarán en actividades que busquen obtener ventajas ilícitas.`);
    bloque(cur, `Las PARTES se comprometen a no inducir a empleados, funcionarios o entidades políticas a obtener ventajas indebidas ni a influir en sus acciones de forma ilícita.`);
    bloque(cur, `Las PARTES no utilizarán fondos provenientes de actividades ilícitas ni mantendrán relaciones con entidades involucradas en criminalidad, corrupción o terrorismo.`);
    bloque(cur, `Las PARTES aseguran que ni ellas ni sus representantes están bajo investigación, condena, ni sancionados por corrupción o actividades ilícitas.`);
    bloque(cur, `Las PARTES garantizarán que sus representantes no son funcionarios públicos y informarán sobre cualquier cambio en este estatus.`);
    bloque(cur, `Las PARTES asumirán la responsabilidad por los actos indebidos de sus empleados, representantes o subcontratados, garantizando el cumplimiento de las leyes y normativas aplicables.`);

    clausula(cur, "24.", "DECLARACIÓN DE PROCEDENCIA LÍCITA DE ACTIVOS Y DE CARENCIA DE ANTECEDENTES O RIESGOS DE INVESTIGACIÓN POR ACTIVIDADES ILÍCITAS:",
      `EL TRABAJADOR, LAS PARTES declaran, basadas en buena fe y tras indagaciones razonables, que durante la vigencia del contrato:`);

    item(cur, "i.",   `Los activos de su patrimonio, no provienen ni han sido utilizados para actividades ilícitas según la Ley 190 de 1995, Ley 747 de 2002, Ley 1121 de 2006, Ley 30 de 1986 y demás normas aplicables.`);
    item(cur, "ii.",  `No existen sanciones, investigaciones en curso, ni sentencias en firme contra ellas, sus representantes legales, miembros de junta directiva, accionistas, socios o empleados por actividades ilícitas, ni aparecen en listas nacionales o internacionales de prevención de lavado de activos o actividades terroristas.`);
    item(cur, "iii.", `En caso de nuevas disposiciones legales que tipifiquen conductas ilícitas, las PARTES se comprometen a hacer las declaraciones necesarias conforme se requiera.`);

    bloque(cur, `Si en cualquier momento se constata que estas declaraciones no son válidas o se niegan a declarar sobre nuevas conductas ilícitas, la PARTE cumplida podrá rescindir el contrato unilateralmente y sin indemnización.`);

    clausula(cur, "25.", "PROGRAMA DE TRANSPARENCIA Y ÉTICA EMPRESARIAL:",
      `EL EMPLEADO reconoce haber sido informado por DIACO S.A. sobre su obligación de cumplir con las normas de prevención del Soborno Transnacional y Corrupción y se compromete a conocer el Programa implementado por DIACO S.A., disponible en su página web, así como las consecuencias de su incumplimiento. EL EMPLEADO acepta que DIACO S.A. puede realizar procedimientos de Debida Diligencia para verificar el cumplimiento de estas obligaciones. El incumplimiento de conductas definidas por la Ley colombiana como Soborno Transnacional y Corrupción será considerado una falta grave, permitiendo a DIACO S.A. terminar el contrato de manera unilateral, sin previo aviso ni indemnización, y hacer exigibles las penalidades pactadas.`);

    clausula(cur, "26.", "CUMPLIMIENTO DE LAS OBLIGACIONES RELACIONADAS CON EL AUTOCONTROL Y LA GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM:",
      `EL EMPLEADO se compromete a dar cumplimiento a las políticas y procedimientos establecidos por la Organización en materia de autocontrol y gestión del riesgo integral de lavado y de activos, financiación del terrorismo y financiación de la proliferación de armas de destrucción masiva (LA/FT/FPADM) desarrollados en el correspondiente manual del sistema de autocontrol y gestión del riesgo integral de LA/FT/FPADM - SAGRILAFT. Igualmente se compromete a dar estricto y cabal cumplimiento a las funciones y responsabilidades asignadas frente al SAGRILAFT. Su incumplimiento dará lugar a la correspondiente sanción según sea establecido en el reglamento interno de trabajo de la Organización y/o Código de ética.`);

    clausula(cur, "27.", "RESERVA DE LA INFORMACIÓN DEL SISTEMA DE AUTOCONTROL Y GESTIÓN DEL RIESGO INTEGRAL DE LA/FT/FPADM:",
      `EL EMPLEADO se compromete a guardar reserva de la información y documentos que tenga conocimiento de los clientes, proveedores, accionistas y empleados producto de la aplicación de las políticas y procedimientos del sistema de autocontrol y gestión del riesgo integral de LA/FT/FPADM. De la misma forma, se compromete a guardar reserva de la información reportada a las autoridades competentes en virtud de los procedimientos establecidos en el mencionado sistema.`);

    clausula(cur, "28.", "OBLIGACIÓN DE REPORTAR SEÑALES DE ALERTA, SITUACIONES U OPERACIONES INUSUALES:",
      `EL EMPLEADO se obliga a reportar de forma inmediata al Oficial de Cumplimiento de la Organización todas las situaciones inusuales que evidencie y que pueden involucrar situaciones de lavado de activos, financiación del terrorismo y financiación de la proliferación de armas de destrucción masiva LA/FT/FPADM según lo establecido en el manual del sistema de autocontrol y gestión del riesgo integral de LA/FT/FPADM.`);

    clausula(cur, "29.", "COMPROMISO DE CUMPLIMIENTO PROGRAMA DE NORMAS EN DERECHO A LA COMPETENCIA:",
      `EL EMPLEADO se compromete a cumplir en su totalidad lo establecido en el Decreto 2153 de 1992, Ley 256 de 1996, Ley 155 de 1959, Ley 1340 de 2009, y todas las normas y regulaciones aplicables al régimen de protección de libre competencia. Asimismo, declara que se compromete a que todas las actividades que en virtud de esta relación contractual se ejecuten serán realizadas de conformidad con los más elevados estándares de transparencia, integridad, legalidad y respetando el Código de Ética, y todas las demás políticas internas de la compañía.`);

    bloque(cur, `Adicionalmente, EL EMPLEADO declara que no ha sido sancionado, ni está siendo investigado por la Superintendencia de Industria y Comercio por algún tipo de restricción de la competencia, y en ese mismo orden de ideas que no es parte de ningún proceso por restricción de la competencia o competencia desleal.`);

    clausula(cur, "30.", "ADOPCIÓN MEDIDAS CONTRA EL ACOSO SEXUAL (LEY 2365 DE 2024):",
      `EL TRABAJADOR conoce que, en virtud de la Ley 2365 de 2024, EL EMPLEADOR adoptó las medidas y obligaciones allí indicadas, por lo cual, cuenta con un protocolo interno de prevención de acoso sexual, con un órgano competente para conocer de estas situaciones, con un procedimiento que se debe seguir en caso de que se presenten quejas de presunto acoso sexual, así como las demás previstas en dicha norma. Así mismo, EL TRABAJADOR conoce que todas las obligaciones y prohibiciones que surjan en torno al acoso sexual se encuentran incorporadas al contrato de trabajo, considerándose una falta grave el incumplimiento de estas.`);

    paragrafo(cur, "PARÁGRAFO:", `La Ley 2365 de 2024 se aplica a trabajadores, contratistas, agentes, pasantes y aprendices.`);

    /* CIERRE — párrafo y firmas */
    cur.space(16);
    bloque(cur, `Del presente documento se han extendido dos ejemplares del mismo contenido, uno para EL EMPLEADOR y otro para EL TRABAJADOR, los cuales firmamos ante testigos en la ciudad de BOGOTÁ el día 20 DE ABRIL DE 2026.`);

    cur.space(50);
    cur.ensureSpace(100);

    const col1X = ML;
    const col2X = ML + CW * 0.55;
    const lineY = cur.y;
    const lineW = CW * 0.38;

    cur.page.drawLine({ start: { x: col1X, y: lineY }, end: { x: col1X + lineW, y: lineY },
      thickness: 0.8, color: window.PDFLib.rgb(0,0,0) });
    cur.page.drawLine({ start: { x: col2X, y: lineY }, end: { x: col2X + lineW, y: lineY },
      thickness: 0.8, color: window.PDFLib.rgb(0,0,0) });

    cur.y -= 10;

    const drawFirmaText = (x, text, bold = true) => {
      const font = bold ? cur.fonts.bold : cur.fonts.reg;
      cur.page.drawText(text, { x, y: cur.y, size: SZ_BASE, font, color: window.PDFLib.rgb(0,0,0) });
    };

    drawFirmaText(col1X, "LAURA CRISTINA CERÓN MUÑOZ");
    drawFirmaText(col2X, sNombre);
    cur.y -= SZ_BASE * 1.4;
    drawFirmaText(col1X, "C.C.No. 52.705.312");
    drawFirmaText(col2X, "C.C.No. " + sCedula);

    cur.space(50);
    cur.ensureSpace(60);
    const testY = cur.y;

    cur.page.drawLine({ start: { x: col1X, y: testY }, end: { x: col1X + lineW, y: testY },
      thickness: 0.8, color: window.PDFLib.rgb(0,0,0) });
    cur.page.drawLine({ start: { x: col2X, y: testY }, end: { x: col2X + lineW, y: testY },
      thickness: 0.8, color: window.PDFLib.rgb(0,0,0) });
    cur.y -= 10;
    drawFirmaText(col1X, "TESTIGO");
    drawFirmaText(col2X, "TESTIGO");

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  return { generarPDFIndefinido };
});