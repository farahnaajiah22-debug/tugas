let mode = "formula";


/* ========================================= */
/* GANTI MODE */
/* ========================================= */

function switchMode(next) {

  mode = next;


  document
    .getElementById("formulaMode")
    .classList
    .toggle(
      "active",
      next === "formula"
    );


  document
    .getElementById("argumentMode")
    .classList
    .toggle(
      "active",
      next === "argument"
    );


  document
    .getElementById("formulaBox")
    .classList
    .toggle(
      "hidden",
      next !== "formula"
    );


  document
    .getElementById("argumentBox")
    .classList
    .toggle(
      "hidden",
      next !== "argument"
    );


  document.getElementById(
    "executeText"
  ).textContent =
    next === "formula"
      ? "⚡ Generate Tabel Kebenaran"
      : "⚡ Evaluasi Argumen";

}


/* ========================================= */
/* INSERT SYMBOL */
/* ========================================= */

function insertSymbol(symbol) {

  const input =
    document.getElementById(
      "formulaInput"
    );


  const start =
    input.selectionStart ??
    input.value.length;


  const end =
    input.selectionEnd ??
    input.value.length;


  input.value =
    input.value.slice(0, start) +
    symbol +
    input.value.slice(end);


  input.focus();


  input.setSelectionRange(
    start + symbol.length,
    start + symbol.length
  );

}


/* ========================================= */
/* PRESET */
/* ========================================= */

function preset(type) {

  switchMode("argument");


  const premise1 =
    document.getElementById(
      "premise1"
    );


  const premise2 =
    document.getElementById(
      "premise2"
    );


  const conclusion =
    document.getElementById(
      "conclusion"
    );


  if (type === "modus") {

    premise1.value =
      "p -> q";

    premise2.value =
      "~q";

    conclusion.value =
      "~p";

  }


  if (type === "fallacy") {

    premise1.value =
      "p -> q";

    premise2.value =
      "q";

    conclusion.value =
      "p";

  }


  if (type === "disjunctive") {

    premise1.value =
      "p | q";

    premise2.value =
      "~p";

    conclusion.value =
      "q";

  }


  execute();

}


/* ========================================= */
/* MENCARI VARIABEL */
/* ========================================= */

function varsFrom(text) {

  return [
    ...new Set(
      (
        text.match(
          /[p-z]/gi
        ) || []
      ).map(
        x => x.toLowerCase()
      )
    )
  ].sort();

}


/* ========================================= */
/* NORMALISASI */
/* ========================================= */

function norm(text) {

  return text

    .replaceAll(
      "→",
      "->"
    )

    .replaceAll(
      "∨",
      "|"
    )

    .replaceAll(
      "∧",
      "&"
    )

    .replaceAll(
      "¬",
      "~"
    )

    .replaceAll(
      "↔",
      "<->"
    )

    .replace(
      /\s+/g,
      ""
    );

}


/* ========================================= */
/* IMPLIKASI */
/* ========================================= */

function implication(a, b) {

  return !a || b;

}


/* ========================================= */
/* EVALUASI EKSPRESI */
/* ========================================= */

function evalExpr(expr, env) {

  expr = norm(expr);


  function parse(s) {

    s = s.trim();


    /*
      Hilangkan kurung luar
    */

    while (
      s.startsWith("(") &&
      s.endsWith(")") &&
      balanced(
        s.slice(
          1,
          -1
        )
      )
    ) {

      s =
        s
          .slice(
            1,
            -1
          )
          .trim();

    }


    /*
      BIKONDISIONAL
    */

    let position =
      findOperator(
        s,
        "<->"
      );


    if (position !== -1) {

      return (
        parse(
          s.slice(
            0,
            position
          )
        ) ===
        parse(
          s.slice(
            position + 3
          )
        )
      );

    }


    /*
      IMPLIKASI
    */

    position =
      findOperator(
        s,
        "->"
      );


    if (position !== -1) {

      return implication(

        parse(
          s.slice(
            0,
            position
          )
        ),

        parse(
          s.slice(
            position + 2
          )
        )

      );

    }


    /*
      OR
    */

    position =
      findOperator(
        s,
        "|"
      );


    if (position !== -1) {

      return (

        parse(
          s.slice(
            0,
            position
          )
        )

        ||

        parse(
          s.slice(
            position + 1
          )
        )

      );

    }


    /*
      AND
    */

    position =
      findOperator(
        s,
        "&"
      );


    if (position !== -1) {

      return (

        parse(
          s.slice(
            0,
            position
          )
        )

        &&

        parse(
          s.slice(
            position + 1
          )
        )

      );

    }


    /*
      NOT
    */

    if (
      s.startsWith("~")
    ) {

      return !parse(
        s.slice(1)
      );

    }


    /*
      VARIABEL
    */

    if (
      env[s] !== undefined
    ) {

      return env[s];

    }


    return false;

  }


  return parse(expr);

}


/* ========================================= */
/* CARI OPERATOR */
/* ========================================= */

function findOperator(
  expression,
  operator
) {

  let depth = 0;


  for (
    let i =
      expression.length -
      operator.length;

    i >= 0;

    i--
  ) {

    const char =
      expression[i];


    if (
      char === ")"
    ) {

      depth++;

    }


    else if (
      char === "("
    ) {

      depth--;

    }


    if (
      depth === 0 &&
      expression.slice(
        i,
        i + operator.length
      ) === operator
    ) {

      return i;

    }

  }


  return -1;

}


/* ========================================= */
/* CEK KURUNG */
/* ========================================= */

function balanced(text) {

  let count = 0;


  for (
    const char of text
  ) {

    if (
      char === "("
    ) {

      count++;

    }


    if (
      char === ")"
    ) {

      count--;

    }


    if (
      count < 0
    ) {

      return false;

    }

  }


  return count === 0;

}


/* ========================================= */
/* MEMBUAT SEMUA BARIS */
/* ========================================= */

function rowsFor(vars) {

  return Array.from(

    {
      length:
        2 ** vars.length
    },

    (_, i) => {

      const env = {};


      vars.forEach(
        (
          variable,
          index
        ) => {

          env[variable] =
            Boolean(
              i &
              (
                1 <<
                (
                  vars.length -
                  1 -
                  index
                )
              )
            );

        }
      );


      return env;

    }

  );

}


/* ========================================= */
/* RENDER TABLE */
/* ========================================= */

function renderTable(
  rows,
  vars,
  values,
  critical = []
) {

  const tbody =
    document.querySelector(
      "#truthTable tbody"
    );


  tbody.innerHTML = "";


  rows.forEach(
    (
      env,
      index
    ) => {

      const tr =
        document.createElement(
          "tr"
        );


      if (
        critical.includes(index)
      ) {

        tr.className =
          "critical";

      }


      let html =
        `<td>#${index + 1}</td>`;


      vars.forEach(
        variable => {

          html +=
            `<td class="${
              env[variable]
                ? "true"
                : "false"
            }">
              ${
                env[variable]
                  ? "T"
                  : "F"
              }
            </td>`;

        }
      );


      html +=
        `<td class="${
          values[index]
            ? "true"
            : "false"
        }">
          <b>
            ${
              values[index]
                ? "T"
                : "F"
            }
          </b>
        </td>`;


      tr.innerHTML = html;


      tbody.appendChild(tr);

    }
  );


  /*
    HEADER DINAMIS
  */

  document
    .querySelector(
      "#truthTable thead"
    )
    .innerHTML =
      `
      <tr>

        <th>
          Row
        </th>

        ${
          vars
            .map(
              variable =>
                `<th>${variable}</th>`
            )
            .join("")
        }

        <th>
          Hasil
        </th>

      </tr>
      `;


  /*
    STATISTIK
  */

  document
    .getElementById(
      "rowCount"
    )
    .textContent =
      rows.length;


  document
    .getElementById(
      "variableCount"
    )
    .textContent =
      vars.length;

}


/* ========================================= */
/* HASIL ANALISIS */
/* ========================================= */

function setResult(
  valid,
  title,
  rule,
  formula,
  explanation
) {

  const card =
    document.getElementById(
      "resultCard"
    );


  card.className =
    "result " +
    (
      valid
        ? "valid"
        : "invalid"
    );


  document
    .getElementById(
      "resultIcon"
    )
    .textContent =
      valid
        ? "✓"
        : "✕";


  document
    .getElementById(
      "resultTitle"
    )
    .textContent =
      title;


  document
    .getElementById(
      "resultRule"
    )
    .textContent =
      rule;


  document
    .getElementById(
      "resultFormula"
    )
    .textContent =
      formula;


  document
    .getElementById(
      "resultExplanation"
    )
    .textContent =
      explanation;

}


/* ========================================= */
/* EXECUTE */
/* ========================================= */

function execute() {

  if (
    mode === "formula"
  ) {

    analyzeFormula();

  }

  else {

    analyzeArgument();

  }

}


/* ========================================= */
/* ANALISIS FORMULA */
/* ========================================= */

function analyzeFormula() {

  const expression =
    document
      .getElementById(
        "formulaInput"
      )
      .value;


  const vars =
    varsFrom(
      expression
    );


  if (
    !vars.length
  ) {

    return;

  }


  const rows =
    rowsFor(vars);


  const values =
    rows.map(
      row =>
        evalExpr(
          expression,
          row
        )
    );


  renderTable(
    rows,
    vars,
    values
  );


  const allTrue =
    values.every(
      value => value
    );


  const allFalse =
    values.every(
      value => !value
    );


  if (allTrue) {

    setResult(

      true,

      "TAUTOLOGI",

      "FORMULA",

      expression,

      "Pernyataan bernilai benar pada semua baris tabel kebenaran."

    );

    document
      .getElementById(
        "statusSmall"
      )
      .textContent =
      "TAUTOLOGI";

  }


  else if (allFalse) {

    setResult(

      false,

      "KONTRADIKSI",

      "FORMULA",

      expression,

      "Pernyataan bernilai salah pada semua baris tabel kebenaran."

    );

    document
      .getElementById(
        "statusSmall"
      )
      .textContent =
      "KONTRA";

  }


  else {

    setResult(

      true,

      "KONTINGENSI",

      "FORMULA",

      expression,

      "Pernyataan memiliki kombinasi nilai benar dan salah."

    );

    document
      .getElementById(
        "statusSmall"
      )
      .textContent =
      "KONT.";

  }

}


/* ========================================= */
/* ANALISIS ARGUMEN */
/* ========================================= */

function analyzeArgument() {

  const premise1 =
    norm(
      document
        .getElementById(
          "premise1"
        )
        .value
    );


  const premise2 =
    norm(
      document
        .getElementById(
          "premise2"
        )
        .value
    );


  const conclusion =
    norm(
      document
        .getElementById(
          "conclusion"
        )
        .value
    );


  const vars =
    varsFrom(
      premise1 +
      " " +
      premise2 +
      " " +
      conclusion
    );


  const rows =
    rowsFor(vars);


  /*
    Valid jika:
    Premis 1 DAN Premis 2
    benar
    DAN
    kesimpulan juga benar.
  */

  const values =
    rows.map(
      row => {

        const p1 =
          evalExpr(
            premise1,
            row
          );


        const p2 =
          evalExpr(
            premise2,
            row
          );


        const c =
          evalExpr(
            conclusion,
            row
          );


        return implication(
          p1 && p2,
          c
        );

      }
    );


  /*
    Cari counterexample
  */

  const critical =
    rows
      .map(
        (
          row,
          index
        ) => {

          const p1 =
            evalExpr(
              premise1,
              row
            );


          const p2 =
            evalExpr(
              premise2,
              row
            );


          const c =
            evalExpr(
              conclusion,
              row
            );


          if (
            p1 &&
            p2 &&
            !c
          ) {

            return index;

          }


          return -1;

        }
      )
      .filter(
        index =>
          index >= 0
      );


  renderTable(
    rows,
    vars,
    values,
    critical
  );


  const valid =
    critical.length === 0;


  /*
    Deteksi aturan
  */

  let rule =
    "ARGUMEN";


  if (
    premise1.includes("->") &&
    premise2 === "~q" &&
    conclusion === "~p"
  ) {

    rule =
      "MODUS TOLLENS";

  }


  else if (
    premise1.includes("->") &&
    premise2 === "q" &&
    conclusion === "p"
  ) {

    rule =
      "AFFIRMING THE CONSEQUENT";

  }


  else if (
    premise1.includes("|") &&
    premise2 === "~p" &&
    conclusion === "q"
  ) {

    rule =
      "DISJUNCTIVE SYLLOGISM";

  }


  /*
    Tampilkan hasil
  */

  if (valid) {

    setResult(

      true,

      "ARGUMEN VALID (SAH)",

      rule,

      `[${premise1}] ∧ [${premise2}] → [${conclusion}]`,

      "Tidak ditemukan counterexample. Tidak ada baris dengan semua premis benar tetapi konklusi salah."

    );


    document
      .getElementById(
        "statusSmall"
      )
      .textContent =
      "VALID";

  }


  else {

    setResult(

      false,

      "ARGUMEN INVALID",

      rule,

      `[${premise1}] ∧ [${premise2}] → [${conclusion}]`,

      "Ditemukan counterexample. Semua premis benar tetapi konklusi salah pada baris yang ditandai."

    );


    document
      .getElementById(
        "statusSmall"
      )
      .textContent =
      "INVALID";

  }

}


/* ========================================= */
/* JALANKAN SAAT HALAMAN DIBUKA */
/* ========================================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    analyzeArgument();

  }
);
