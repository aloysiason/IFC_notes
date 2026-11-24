const form = document.getElementById("pricing-form");
const optionStyleSelect = document.getElementById("option-style");
const payoffTypeSelect = document.getElementById("payoff-type");
const barrierFields = document.getElementById("barrier-fields");
const summaryCards = document.getElementById("summary-cards");
const treeView = document.getElementById("tree-view");
const detailView = document.getElementById("detail-view");
const warningBanner = document.getElementById("warning-banner");
const presetButtons = document.querySelectorAll(".preset-btn");

const EPSILON = 1e-10;

const presets = {
  "euro-call": {
    optionStyle: "european",
    payoffType: "call",
    steps: 2,
    spot: 100,
    strike: 110,
    upFactor: 1.1752,
    downFactor: 0.8857,
    grossRate: 1.0304,
    barrierDirection: "up",
    barrierMode: "out",
    barrierLevel: 120,
    barrierExercise: "european",
  },
  "american-put": {
    optionStyle: "american",
    payoffType: "put",
    steps: 3,
    spot: 100,
    strike: 100,
    upFactor: 1.1,
    downFactor: 0.9,
    grossRate: 1.0513,
    barrierDirection: "down",
    barrierMode: "out",
    barrierLevel: 82,
    barrierExercise: "american",
  },
  "barrier-up-out": {
    optionStyle: "barrier",
    payoffType: "call",
    steps: 3,
    spot: 100,
    strike: 105,
    upFactor: 1.1,
    downFactor: 0.9,
    grossRate: 1.0513,
    barrierDirection: "down",
    barrierMode: "out",
    barrierLevel: 95,
    barrierExercise: "european",
  },
};

const defaultExample = {
  optionStyle: "european",
  payoffType: "call",
  steps: 1,
  spot: 100,
  strike: 110,
  upFactor: 1.2712,
  downFactor: 0.8521,
  grossRate: 1.0618,
  barrierDirection: "down",
  barrierMode: "out",
  barrierLevel: 95,
  barrierExercise: "european",
};

function formatNumber(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return Number(value).toFixed(digits);
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return Number(value).toFixed(4);
}

function payoffAt(price, strike, type) {
  if (type === "call") {
    return Math.max(price - strike, 0);
  }

  return Math.max(strike - price, 0);
}

function buildStockTree({ steps, spot, upFactor, downFactor }) {
  return Array.from({ length: steps + 1 }, (_, time) =>
    Array.from({ length: time + 1 }, (_, downMoves) => {
      const upMoves = time - downMoves;
      return spot * upFactor ** upMoves * downFactor ** downMoves;
    }),
  );
}

function createTriangle(steps, fillValue = null) {
  return Array.from({ length: steps + 1 }, (_, time) =>
    Array.from({ length: time + 1 }, () => fillValue),
  );
}

function createBarrierStateTrees(steps) {
  return {
    primary: createTriangle(steps),
    alternate: createTriangle(steps),
  };
}

function checkBarrierBreach(price, level, direction) {
  return direction === "up" ? price >= level : price <= level;
}

function validateInputs(inputs) {
  const warnings = [];
  const labelMap = {
    spot: "期初价格 S0",
    strike: "行权价 X",
    upFactor: "上涨因子 U",
    downFactor: "下跌因子 D",
  };

  if (!Number.isInteger(inputs.steps) || inputs.steps < 1 || inputs.steps > 25) {
    throw new Error("期数 N 需要是 1 到 25 之间的整数。");
  }

  ["spot", "strike", "upFactor", "downFactor"].forEach((key) => {
    if (!(inputs[key] > 0)) {
      throw new Error(`${labelMap[key]} 必须大于 0。`);
    }
  });

  if (Math.abs(inputs.upFactor - inputs.downFactor) < EPSILON) {
    throw new Error("上涨因子 U 不能与下跌因子 D 相同。");
  }

  if (inputs.upFactor <= inputs.downFactor) {
    throw new Error("请保证上涨因子 U 大于下跌因子 D。");
  }

  if (!Number.isFinite(inputs.grossRate)) {
    throw new Error("请输入有效的每期复利因子 R。");
  }

  if (!(inputs.grossRate > 0)) {
    throw new Error("每期复利因子 R 必须大于 0。");
  }

  inputs.riskNeutralProb =
    (inputs.grossRate - inputs.downFactor) / (inputs.upFactor - inputs.downFactor);

  if (inputs.riskNeutralProb < -EPSILON || inputs.riskNeutralProb > 1 + EPSILON) {
    throw new Error(
      "当前参数下风险中性概率 p 不在 [0, 1] 内，不满足常见无套利条件 D < R < U。",
    );
  }

  if (inputs.optionStyle === "barrier" && !(inputs.barrierLevel > 0)) {
    throw new Error("障碍价 H 必须大于 0。");
  }

  if (inputs.optionStyle === "barrier" && inputs.steps > 12) {
    warnings.push(
      "障碍期权在这里按离散节点监控并额外跟踪状态；期数较大时表格会变长，但结果仍可用于教学演示。",
    );
  }

  return warnings;
}

function collectInputs() {
  return {
    optionStyle: optionStyleSelect.value,
    payoffType: payoffTypeSelect.value,
    steps: Number(document.getElementById("steps").value),
    spot: Number(document.getElementById("spot").value),
    strike: Number(document.getElementById("strike").value),
    upFactor: Number(document.getElementById("up-factor").value),
    downFactor: Number(document.getElementById("down-factor").value),
    grossRate: Number(document.getElementById("growth-factor").value),
    barrierDirection: document.getElementById("barrier-direction").value,
    barrierMode: document.getElementById("barrier-mode").value,
    barrierLevel: Number(document.getElementById("barrier-level").value),
    barrierExercise: document.getElementById("barrier-exercise").value,
  };
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    warningBanner.classList.add("is-hidden");
    warningBanner.innerHTML = "";
    return;
  }

  warningBanner.classList.remove("is-hidden");
  warningBanner.innerHTML = warnings.map((warning) => `<div>${warning}</div>`).join("");
}

function priceVanilla(inputs, stockTree) {
  const values = createTriangle(inputs.steps, 0);
  const details = createTriangle(inputs.steps, null);
  const exerciseStyle = inputs.optionStyle;

  for (let downMoves = 0; downMoves <= inputs.steps; downMoves += 1) {
    const price = stockTree[inputs.steps][downMoves];
    const intrinsic = payoffAt(price, inputs.strike, inputs.payoffType);

    values[inputs.steps][downMoves] = intrinsic;
    details[inputs.steps][downMoves] = {
      time: inputs.steps,
      node: downMoves,
      stock: price,
      state: "到期",
      continuation: null,
      intrinsic,
      value: intrinsic,
      delta: null,
      bond: null,
      decision: "到期支付",
      formulas: [`到期节点价值 = max(收益, 0) = ${formatNumber(intrinsic)}`],
    };
  }

  for (let time = inputs.steps - 1; time >= 0; time -= 1) {
    for (let downMoves = 0; downMoves <= time; downMoves += 1) {
      const stock = stockTree[time][downMoves];
      const stockUp = stockTree[time + 1][downMoves];
      const stockDown = stockTree[time + 1][downMoves + 1];
      const valueUp = values[time + 1][downMoves];
      const valueDown = values[time + 1][downMoves + 1];
      const continuation =
        (inputs.riskNeutralProb * valueUp +
          (1 - inputs.riskNeutralProb) * valueDown) /
        inputs.grossRate;
      const intrinsic = payoffAt(stock, inputs.strike, inputs.payoffType);
      const earlyExercise =
        exerciseStyle === "american" && intrinsic > continuation + EPSILON;
      const value =
        exerciseStyle === "american" ? Math.max(intrinsic, continuation) : continuation;
      const delta =
        Math.abs(stockUp - stockDown) < EPSILON
          ? null
          : (valueUp - valueDown) / (stockUp - stockDown);
      const bond =
        delta === null ? null : (valueDown - delta * stockDown) / inputs.grossRate;
      const formulas = [
        `继续持有价值 = (${formatNumber(inputs.riskNeutralProb)} × ${formatNumber(valueUp)} + ${formatNumber(1 - inputs.riskNeutralProb)} × ${formatNumber(valueDown)}) / ${formatNumber(inputs.grossRate)} = ${formatNumber(continuation)}`,
        `复制组合标的数量 m = (${formatNumber(valueUp)} - ${formatNumber(valueDown)}) / (${formatNumber(stockUp)} - ${formatNumber(stockDown)}) = ${formatNumber(delta)}`,
        `无风险资产 B = (${formatNumber(valueDown)} - ${formatNumber(delta)} × ${formatNumber(stockDown)}) / ${formatNumber(inputs.grossRate)} = ${formatNumber(bond)}`,
      ];

      if (exerciseStyle === "american") {
        formulas.push(
          `节点价值 = max(继续持有 ${formatNumber(continuation)}, 立即行权 ${formatNumber(intrinsic)}) = ${formatNumber(value)}`,
        );
      }

      values[time][downMoves] = value;
      details[time][downMoves] = {
        time,
        node: downMoves,
        stock,
        state: exerciseStyle === "american" ? "美式节点" : "欧式节点",
        stockUp,
        stockDown,
        valueUp,
        valueDown,
        continuation,
        intrinsic,
        value,
        delta,
        bond,
        decision: earlyExercise ? "提前行权" : "继续持有",
        formulas,
      };
    }
  }

  return {
    modeLabel: inputs.optionStyle === "american" ? "美式期权" : "欧式期权",
    exerciseLabel: inputs.optionStyle === "american" ? "允许提前行权" : "仅到期行权",
    rootPrice: values[0][0],
    rootStateLabel: "普通节点",
    values,
    details,
  };
}

function priceBarrier(inputs, stockTree) {
  const values = createBarrierStateTrees(inputs.steps);
  const details = createBarrierStateTrees(inputs.steps);
  const isKnockOut = inputs.barrierMode === "out";
  const exerciseStyle = inputs.barrierExercise;

  function isReachable(stateKey, breachedNow) {
    if (isKnockOut) {
      return stateKey === "alternate" || !breachedNow;
    }

    return stateKey === "alternate" || !breachedNow;
  }

  function barrierStateLabel(stateKey) {
    if (isKnockOut) {
      return stateKey === "primary" ? "存活" : "已敲出";
    }

    return stateKey === "primary" ? "未触发" : "已触发";
  }

  function nextStateKey(currentState, nextPrice) {
    const nextBreached = checkBarrierBreach(
      nextPrice,
      inputs.barrierLevel,
      inputs.barrierDirection,
    );

    if (isKnockOut) {
      if (currentState === "alternate") {
        return "alternate";
      }

      return nextBreached ? "alternate" : "primary";
    }

    if (currentState === "alternate") {
      return "alternate";
    }

    return nextBreached ? "alternate" : "primary";
  }

  function intrinsicForState(stateKey, stock) {
    if (isKnockOut && stateKey === "alternate") {
      return 0;
    }

    if (!isKnockOut && stateKey === "primary") {
      return 0;
    }

    return payoffAt(stock, inputs.strike, inputs.payoffType);
  }

  for (let time = inputs.steps; time >= 0; time -= 1) {
    for (let downMoves = 0; downMoves <= time; downMoves += 1) {
      const stock = stockTree[time][downMoves];
      const breachedNow = checkBarrierBreach(
        stock,
        inputs.barrierLevel,
        inputs.barrierDirection,
      );

      ["primary", "alternate"].forEach((stateKey) => {
        const reachable = isReachable(stateKey, breachedNow);
        const stateLabel = barrierStateLabel(stateKey);

        if (!reachable) {
          values[stateKey][time][downMoves] = null;
          details[stateKey][time][downMoves] = {
            time,
            node: downMoves,
            stock,
            state: stateLabel,
            reachable: false,
          };
          return;
        }

        if (time === inputs.steps) {
          const terminalValue = intrinsicForState(stateKey, stock);
          values[stateKey][time][downMoves] = terminalValue;
          details[stateKey][time][downMoves] = {
            time,
            node: downMoves,
            stock,
            state: stateLabel,
            reachable: true,
            continuation: null,
            intrinsic: terminalValue,
            value: terminalValue,
            delta: null,
            bond: null,
            decision: "到期支付",
            formulas: [`到期状态价值 = ${formatNumber(terminalValue)}`],
          };
          return;
        }

        if (isKnockOut && stateKey === "alternate") {
          values[stateKey][time][downMoves] = 0;
          details[stateKey][time][downMoves] = {
            time,
            node: downMoves,
            stock,
            state: stateLabel,
            reachable: true,
            continuation: 0,
            intrinsic: 0,
            value: 0,
            delta: 0,
            bond: 0,
            decision: "已敲出",
            formulas: ["障碍已触发，期权失效，节点价值恒为 0。"],
          };
          return;
        }

        const stockUp = stockTree[time + 1][downMoves];
        const stockDown = stockTree[time + 1][downMoves + 1];
        const upState = nextStateKey(stateKey, stockUp);
        const downState = nextStateKey(stateKey, stockDown);
        const valueUp = values[upState][time + 1][downMoves];
        const valueDown = values[downState][time + 1][downMoves + 1];
        const continuation =
          (inputs.riskNeutralProb * valueUp +
            (1 - inputs.riskNeutralProb) * valueDown) /
          inputs.grossRate;
        const intrinsic = intrinsicForState(stateKey, stock);
        const canExerciseNow = exerciseStyle === "american" && intrinsic > EPSILON;
        const earlyExercise = canExerciseNow && intrinsic > continuation + EPSILON;
        const value = canExerciseNow ? Math.max(intrinsic, continuation) : continuation;
        const delta =
          Math.abs(stockUp - stockDown) < EPSILON
            ? null
            : (valueUp - valueDown) / (stockUp - stockDown);
        const bond =
          delta === null ? null : (valueDown - delta * stockDown) / inputs.grossRate;
        const formulas = [
          `继续持有价值 = (${formatNumber(inputs.riskNeutralProb)} × ${formatNumber(valueUp)} + ${formatNumber(1 - inputs.riskNeutralProb)} × ${formatNumber(valueDown)}) / ${formatNumber(inputs.grossRate)} = ${formatNumber(continuation)}`,
          `复制组合标的数量 m = (${formatNumber(valueUp)} - ${formatNumber(valueDown)}) / (${formatNumber(stockUp)} - ${formatNumber(stockDown)}) = ${formatNumber(delta)}`,
          `无风险资产 B = (${formatNumber(valueDown)} - ${formatNumber(delta)} × ${formatNumber(stockDown)}) / ${formatNumber(inputs.grossRate)} = ${formatNumber(bond)}`,
        ];

        if (exerciseStyle === "american") {
          formulas.push(
            `节点价值 = max(继续持有 ${formatNumber(continuation)}, 立即行权 ${formatNumber(intrinsic)}) = ${formatNumber(value)}`,
          );
        } else if (!isKnockOut && stateKey === "primary") {
          formulas.push("尚未触发敲入条件，当前状态下不能直接行权。");
        }

        values[stateKey][time][downMoves] = value;
        details[stateKey][time][downMoves] = {
          time,
          node: downMoves,
          stock,
          state: stateLabel,
          reachable: true,
          stockUp,
          stockDown,
          upState,
          downState,
          valueUp,
          valueDown,
          continuation,
          intrinsic,
          value,
          delta,
          bond,
          decision: earlyExercise
            ? "提前行权"
            : isKnockOut
              ? "继续持有 / 监控障碍"
              : stateKey === "primary"
                ? "等待触发"
                : "继续持有",
          formulas,
        };
      });
    }
  }

  const rootBreached = checkBarrierBreach(
    inputs.spot,
    inputs.barrierLevel,
    inputs.barrierDirection,
  );
  const rootState = rootBreached ? "alternate" : "primary";

  return {
    modeLabel: `障碍期权（${inputs.barrierDirection === "up" ? "向上" : "向下"}${inputs.barrierMode === "out" ? "敲出" : "敲入"}）`,
    exerciseLabel: inputs.barrierExercise === "american" ? "障碍美式" : "障碍欧式",
    rootPrice: values[rootState][0][0],
    rootStateLabel: barrierStateLabel(rootState),
    values,
    details,
    isKnockOut,
  };
}

function buildSummaryCards(inputs, result, warnings) {
  const cards = [
    { label: "期权价格 V₀", value: formatCurrency(result.rootPrice) },
    { label: "风险中性概率 p", value: formatNumber(inputs.riskNeutralProb) },
    { label: "复利因子 R", value: formatNumber(inputs.grossRate) },
    { label: "产品类别", value: result.modeLabel },
    { label: "根节点状态", value: result.rootStateLabel },
    { label: "行权规则", value: result.exerciseLabel },
  ];

  if (inputs.optionStyle === "barrier") {
    cards.push({
      label: "障碍设定",
      value: `${inputs.barrierDirection === "up" ? "Up" : "Down"}-${inputs.barrierMode === "out" ? "Out" : "In"} @ ${formatNumber(inputs.barrierLevel, 2)}`,
    });
  }

  if (warnings.length) {
    cards.push({ label: "课堂提示", value: "请结合无套利条件解释参数设定" });
  }

  summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <small>${card.label}</small>
          <strong>${card.value}</strong>
        </article>
      `,
    )
    .join("");
}

function renderTree(inputs, stockTree, result) {
  const columns = [];

  for (let time = 0; time <= inputs.steps; time += 1) {
    const nodeCards = [];

    for (let downMoves = 0; downMoves <= time; downMoves += 1) {
      const stock = stockTree[time][downMoves];

      if (inputs.optionStyle === "barrier") {
        const primaryDetail = result.details.primary[time][downMoves];
        const alternateDetail = result.details.alternate[time][downMoves];
        const primaryLabel = result.isKnockOut ? "存活价值" : "未触发价值";
        const alternateLabel = result.isKnockOut ? "敲出价值" : "已触发价值";
        const primaryValue =
          primaryDetail && primaryDetail.reachable !== false ? primaryDetail.value : null;
        const alternateValue =
          alternateDetail && alternateDetail.reachable !== false ? alternateDetail.value : null;

        nodeCards.push(`
          <article class="node-card">
            <div class="node-title">
              <span>节点 (${time}, ${downMoves})</span>
              <span>${time === inputs.steps ? "终端" : "中间节点"}</span>
            </div>
            <strong class="node-price">S = ${formatCurrency(stock)}</strong>
            <div class="node-metric">
              <span class="metric-label">${primaryLabel}</span>
              <span class="metric-value">${formatCurrency(primaryValue)}</span>
            </div>
            <div class="node-metric">
              <span class="metric-label">${alternateLabel}</span>
              <span class="metric-value">${formatCurrency(alternateValue)}</span>
            </div>
          </article>
        `);
      } else {
        const detail = result.details[time][downMoves];
        nodeCards.push(`
          <article class="node-card">
            <div class="node-title">
              <span>节点 (${time}, ${downMoves})</span>
              <span>${detail.decision}</span>
            </div>
            <strong class="node-price">S = ${formatCurrency(stock)}</strong>
            <div class="node-metric">
              <span class="metric-label">期权价值</span>
              <span class="metric-value">${formatCurrency(detail.value)}</span>
            </div>
            <div class="node-metric">
              <span class="metric-label">m</span>
              <span class="metric-value">${formatNumber(detail.delta)}</span>
            </div>
            <div class="node-metric">
              <span class="metric-label">B</span>
              <span class="metric-value">${formatNumber(detail.bond)}</span>
            </div>
          </article>
        `);
      }
    }

    columns.push(`
      <section class="tree-column" style="margin-top:${time * 22}px">
        <h4>第 ${time} 期</h4>
        <small>${time === inputs.steps ? "到期节点" : "反向递推层"}</small>
        ${nodeCards.join("")}
      </section>
    `);
  }

  treeView.innerHTML = columns.join("");
}

function stateChip(label, alternate = false) {
  return `<span class="state-chip${alternate ? " alt" : ""}">${label}</span>`;
}

function renderDetails(inputs, result) {
  const sections = [];

  for (let time = inputs.steps; time >= 0; time -= 1) {
    const rows = [];

    for (let downMoves = 0; downMoves <= time; downMoves += 1) {
      if (inputs.optionStyle === "barrier") {
        ["primary", "alternate"].forEach((stateKey) => {
          const detail = result.details[stateKey][time][downMoves];
          if (!detail || detail.reachable === false) {
            return;
          }

          rows.push(`
            <tr>
              <td>${detail.time}</td>
              <td>${detail.node}</td>
              <td>${formatCurrency(detail.stock)}</td>
              <td>${stateChip(detail.state, stateKey === "alternate")}</td>
              <td>${formatCurrency(detail.value)}</td>
              <td>${formatCurrency(detail.continuation)}</td>
              <td>${formatCurrency(detail.intrinsic)}</td>
              <td>${formatNumber(detail.delta)}</td>
              <td>${formatNumber(detail.bond)}</td>
              <td>${detail.upState ? stateChip(detail.upState === "primary" ? (result.isKnockOut ? "存活" : "未触发") : (result.isKnockOut ? "已敲出" : "已触发"), detail.upState === "alternate") : "—"}</td>
              <td>${detail.downState ? stateChip(detail.downState === "primary" ? (result.isKnockOut ? "存活" : "未触发") : (result.isKnockOut ? "已敲出" : "已触发"), detail.downState === "alternate") : "—"}</td>
              <td>${detail.decision}</td>
              <td>
                <div class="formula-stack">
                  ${(detail.formulas || []).map((formula) => `<div>${formula}</div>`).join("")}
                </div>
              </td>
            </tr>
          `);
        });
      } else {
        const detail = result.details[time][downMoves];

        rows.push(`
          <tr>
            <td>${detail.time}</td>
            <td>${detail.node}</td>
            <td>${formatCurrency(detail.stock)}</td>
            <td>${stateChip(detail.state)}</td>
            <td>${formatCurrency(detail.value)}</td>
            <td>${formatCurrency(detail.continuation)}</td>
            <td>${formatCurrency(detail.intrinsic)}</td>
            <td>${formatNumber(detail.delta)}</td>
            <td>${formatNumber(detail.bond)}</td>
            <td>—</td>
            <td>—</td>
            <td>${detail.decision}</td>
            <td>
              <div class="formula-stack">
                ${(detail.formulas || []).map((formula) => `<div>${formula}</div>`).join("")}
              </div>
            </td>
          </tr>
        `);
      }
    }

    sections.push(`
      <details class="period-card">
        <summary>
          <strong>第 ${time} 期</strong>
          <span>${time === inputs.steps ? "终端支付" : "从这一层向前复制定价"}</span>
        </summary>
        <div class="period-table-wrap">
          ${
            rows.length
              ? `
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>t</th>
                      <th>节点</th>
                      <th>标的价格 S</th>
                      <th>状态</th>
                      <th>节点价值 V</th>
                      <th>继续持有</th>
                      <th>立即行权</th>
                      <th>m</th>
                      <th>B</th>
                      <th>上分支状态</th>
                      <th>下分支状态</th>
                      <th>决策</th>
                      <th>计算说明</th>
                    </tr>
                  </thead>
                  <tbody>${rows.join("")}</tbody>
                </table>
              `
              : '<div class="detail-empty">这一期没有可展示的状态节点。</div>'
          }
        </div>
      </details>
    `);
  }

  detailView.innerHTML = sections.join("");
}

function runPricing() {
  try {
    const inputs = collectInputs();
    const warnings = validateInputs(inputs);
    const stockTree = buildStockTree(inputs);
    const result =
      inputs.optionStyle === "barrier"
        ? priceBarrier(inputs, stockTree)
        : priceVanilla(inputs, stockTree);

    renderWarnings(warnings);
    buildSummaryCards(inputs, result, warnings);
    renderTree(inputs, stockTree, result);
    renderDetails(inputs, result);
  } catch (error) {
    renderWarnings([error.message]);
    summaryCards.innerHTML = "";
    treeView.innerHTML = "";
    detailView.innerHTML =
      '<div class="detail-empty">请先修正输入参数，再重新计算。</div>';
  }
}

function syncBarrierFields() {
  const shouldShow = optionStyleSelect.value === "barrier";
  barrierFields.classList.toggle("is-hidden", !shouldShow);
}

function applyPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) {
    return;
  }

  optionStyleSelect.value = preset.optionStyle;
  payoffTypeSelect.value = preset.payoffType;
  document.getElementById("steps").value = preset.steps;
  document.getElementById("spot").value = preset.spot;
  document.getElementById("strike").value = preset.strike;
  document.getElementById("up-factor").value = preset.upFactor;
  document.getElementById("down-factor").value = preset.downFactor;
  document.getElementById("growth-factor").value = preset.grossRate;
  document.getElementById("barrier-direction").value = preset.barrierDirection;
  document.getElementById("barrier-mode").value = preset.barrierMode;
  document.getElementById("barrier-level").value = preset.barrierLevel;
  document.getElementById("barrier-exercise").value = preset.barrierExercise;
  syncBarrierFields();
  runPricing();
}

function applyDefaultExample() {
  optionStyleSelect.value = defaultExample.optionStyle;
  payoffTypeSelect.value = defaultExample.payoffType;
  document.getElementById("steps").value = defaultExample.steps;
  document.getElementById("spot").value = defaultExample.spot;
  document.getElementById("strike").value = defaultExample.strike;
  document.getElementById("up-factor").value = defaultExample.upFactor;
  document.getElementById("down-factor").value = defaultExample.downFactor;
  document.getElementById("growth-factor").value = defaultExample.grossRate;
  document.getElementById("barrier-direction").value = defaultExample.barrierDirection;
  document.getElementById("barrier-mode").value = defaultExample.barrierMode;
  document.getElementById("barrier-level").value = defaultExample.barrierLevel;
  document.getElementById("barrier-exercise").value = defaultExample.barrierExercise;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runPricing();
});

optionStyleSelect.addEventListener("change", () => {
  syncBarrierFields();
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
  });
});

applyDefaultExample();
syncBarrierFields();
runPricing();
