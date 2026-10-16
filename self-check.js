(function () {
  const modal = document.getElementById("selfCheckModal");
  if (!modal) return;

  const result = modal.querySelector(".check-result");

  function addRow(label, valueText, ok, criteria) {
    const row = document.createElement("div");
    row.className = "check-row";

    const name = document.createElement("span");
    name.textContent = label;

    const value = document.createElement("strong");
    value.textContent = valueText;

    const badge = document.createElement("em");
    badge.className = ok ? "is-ok" : "is-no";
    badge.textContent = (ok ? "충족" : "미충족") + " (" + criteria + ")";

    row.append(name, value, badge);
    result.appendChild(row);
  }

  function addNote(text, className) {
    const p = document.createElement("p");
    p.className = className || "check-note";
    p.textContent = text;
    result.appendChild(p);
  }

  function addSummary(pass, okText, noText) {
    addNote(pass ? okText : noText, "check-summary " + (pass ? "is-ok" : "is-no"));
  }

  function average(list) {
    return list.reduce(function (sum, v) { return sum + v; }, 0) / list.length;
  }

  /* ---------- 등급 (KAI) ---------- */

  function setupGrades() {
    const SEMESTERS = ["1학년 1학기", "1학년 2학기", "2학년 1학기", "2학년 2학기", "3학년 1학기"];
    const SUBJECTS = [
      { name: "국어", core: true },
      { name: "영어", core: true },
      { name: "수학", core: true },
      { name: "사회" },
      { name: "과학" },
      { name: "한국사" },
      { name: "전문교과1" },
      { name: "전문교과2" },
      { name: "전문교과3" },
      { name: "전문교과4" }
    ];
    const NONE = "none";
    const tbody = modal.querySelector(".grade-table tbody");

    function syncSelect(select) {
      select.classList.toggle("is-none", select.value === NONE);
      select.classList.remove("is-empty");
    }

    function gradeSelect(subjectLabel, semester, initial) {
      const select = document.createElement("select");
      select.className = "grade-select";
      select.setAttribute("aria-label", subjectLabel + " " + semester);

      [["", "-"]]
        .concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return [String(n), String(n)]; }))
        .concat([[NONE, "없음"]])
        .forEach(function (pair) {
          const option = document.createElement("option");
          option.value = pair[0];
          option.textContent = pair[1];
          select.appendChild(option);
        });

      select.value = initial;
      syncSelect(select);
      return select;
    }

    function addSemesterCells(row, subjectLabel, initial) {
      SEMESTERS.forEach(function (semester) {
        const td = document.createElement("td");
        td.appendChild(gradeSelect(subjectLabel, semester, initial));
        row.appendChild(td);
      });
    }

    SUBJECTS.forEach(function (subject) {
      const row = document.createElement("tr");
      if (subject.core) row.dataset.core = "true";

      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = subject.name;
      row.appendChild(th);

      addSemesterCells(row, subject.name, "");
      tbody.appendChild(row);
    });

    modal.querySelector("[data-add-subject]").addEventListener("click", function () {
      const row = document.createElement("tr");
      row.className = "is-custom";

      const th = document.createElement("th");
      th.scope = "row";

      const name = document.createElement("input");
      name.type = "text";
      name.className = "grade-name";
      name.placeholder = "과목명";
      name.setAttribute("aria-label", "과목명");

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "grade-remove";
      remove.setAttribute("aria-label", "과목 삭제");
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        row.remove();
        result.hidden = true;
      });

      const cell = document.createElement("div");
      cell.className = "grade-name-cell";
      cell.append(name, remove);
      th.appendChild(cell);
      row.appendChild(th);
      addSemesterCells(row, "추가 과목", NONE);
      tbody.appendChild(row);
      name.focus();
    });

    tbody.addEventListener("change", function (e) {
      if (e.target.classList.contains("grade-select")) syncSelect(e.target);
      result.hidden = true;
    });

    function values(rows) {
      const list = [];
      rows.forEach(function (row) {
        row.querySelectorAll(".grade-select").forEach(function (select) {
          if (select.value !== "" && select.value !== NONE) list.push(Number(select.value));
        });
      });
      return list;
    }

    return function () {
      const rows = Array.from(tbody.rows);
      const empty = Array.from(tbody.querySelectorAll(".grade-select")).filter(function (select) {
        return select.value === "";
      });

      if (empty.length) {
        empty.forEach(function (select) { select.classList.add("is-empty"); });
        addNote("빈칸이 " + empty.length + "개 있어요. 등급을 고르거나, 듣지 않은 학기는 '없음'으로 표시해 주세요.", "check-warn");
        return;
      }

      const coreRows = rows.filter(function (row) { return row.dataset.core; });
      const missing = coreRows.filter(function (row) { return values([row]).length === 0; });

      if (missing.length) {
        const names = missing.map(function (row) { return row.cells[0].textContent; }).join(", ");
        addNote(names + " 등급이 한 학기 이상 있어야 계산할 수 있어요.", "check-warn");
        return;
      }

      const core = values(coreRows);
      const all = values(rows);
      const coreMax = Number(modal.dataset.coreMax);
      const allMax = Number(modal.dataset.allMax);
      const coreAvg = average(core);
      const allAvg = average(all);

      addRow("국·영·수 평균 (" + core.length + "칸)", coreAvg.toFixed(2) + "등급", coreAvg <= coreMax, coreMax + "등급 이내");
      addRow("전과목 평균 (" + all.length + "칸)", allAvg.toFixed(2) + "등급", allAvg <= allMax, allMax + "등급 이내");
      addSummary(coreAvg <= coreMax && allAvg <= allMax, "성적 기준은 충족해요.", "성적 기준에 아직 못 미쳐요.");
      addNote("'없음' 칸은 빼고, 입력한 등급을 단순 평균한 값이에요. 성적 외 조건(출결, 자격증 등)은 위 입사 조건에서 따로 확인하세요.");
    };
  }

  /* ---------- 석차 (삼성디스플레이) ---------- */

  function setupRanks() {
    const rows = Array.from(modal.querySelectorAll(".rank-table tbody tr"));
    const topMax = Number(modal.dataset.topMax);

    modal.querySelector(".rank-table").addEventListener("input", function (e) {
      e.target.classList.remove("is-empty");
      result.hidden = true;
    });

    function read(row, field) {
      const input = row.querySelector('[data-field="' + field + '"]');
      const n = Number(input.value);
      return { input: input, value: input.value === "" || !Number.isInteger(n) || n < 1 ? null : n };
    }

    return function () {
      modal.querySelectorAll(".rank-input.is-empty").forEach(function (input) {
        input.classList.remove("is-empty");
      });

      const data = rows.map(function (row) {
        return { label: row.cells[0].textContent, rank: read(row, "rank"), total: read(row, "total") };
      });

      const bad = [];
      data.forEach(function (d) {
        if (d.rank.value === null) bad.push(d.rank.input);
        if (d.total.value === null) bad.push(d.total.input);
      });

      if (bad.length) {
        bad.forEach(function (input) { input.classList.add("is-empty"); });
        addNote("석차와 전체 인원을 1 이상의 정수로 모두 입력해 주세요.", "check-warn");
        return;
      }

      const over = data.filter(function (d) { return d.rank.value > d.total.value; });
      if (over.length) {
        over.forEach(function (d) { d.rank.input.classList.add("is-empty"); });
        addNote("석차가 전체 인원보다 클 수 없어요. 다시 확인해 주세요.", "check-warn");
        return;
      }

      const percents = data.map(function (d) {
        const pct = (d.rank.value / d.total.value) * 100;
        addRow(d.label + " (" + d.rank.value + "등 / " + d.total.value + "명)", "상위 " + pct.toFixed(1) + "%", pct <= topMax, topMax + "% 이내");
        return pct;
      });

      const avg = average(percents);
      addRow("1학년 평균", "상위 " + avg.toFixed(1) + "%", avg <= topMax, topMax + "% 이내");
      addSummary(avg <= topMax, "상위 " + topMax + "% 기준에 들어가요.", "상위 " + topMax + "% 기준에 아직 못 미쳐요.");
      addNote("이 진단은 정확하지 않아요. 실제로는 교과별 석차 등을 따지므로, 정확한 사항은 담임 선생님이나 취업부 선생님께 꼭 문의하세요.", "check-caution");
    };
  }

  const runCheck = modal.dataset.mode === "rank" ? setupRanks() : setupGrades();

  document.querySelector("[data-open-self-check]").addEventListener("click", function () {
    modal.showModal();
  });

  modal.querySelector("[data-close-self-check]").addEventListener("click", function () {
    modal.close();
  });

  modal.addEventListener("click", function (e) {
    const box = modal.getBoundingClientRect();
    const outside = e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom;
    if (e.target === modal && outside) modal.close();
  });

  modal.querySelector("[data-run-self-check]").addEventListener("click", function () {
    result.replaceChildren();
    result.hidden = false;
    runCheck();
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
