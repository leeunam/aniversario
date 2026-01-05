const screen = document.getElementById('screen');
const overlay = document.getElementById('overlay');
const barFill = document.getElementById('barFill');
const topHeader = document.querySelector('.top');

/* ===== Som suave (Duolingo-ish) ===== */
let audioCtx;
function clickSound() {
  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.type = 'sine';
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.06);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start(t);
    o.stop(t + 0.12);
  } catch (_) {}
}

/* ===== Conteúdo ===== */
const CARDS = [
  {
    id: 1,
    title: 'O que você me ensinou',
    body: 'Ser uma pessoa que aproveita mais o momento presente (e o dinheiro… com responsabilidade).',
  },
  {
    id: 2,
    title: 'Coisas que só você faz',
    body: 'Você organiza evento e pessoas muito rápido. De algum jeito… as pessoas te obedecem. É assustador e lindo.',
  },
  {
    id: 3,
    title: 'O que eu nunca falei',
    body: 'Durante muito tempo eu não me achava suficiente, por não ser alto, bonito ou presente o bastante.\n\nHoje eu entendo que amor não é ser perfeito é escolher aprender com a pessoa ao seu lado. E ontem, hoje e amanhã eu escolho você.',
  },
  {
    id: 4,
    title: 'O que eu imagino pra nós',
    body: 'Morar fora do país\ne aprender a dançar ou tocar algo pra gente fazer um collab (ou passar vergonha juntos kkk)',
  },
  {
    id: 5,
    title: '?????',
    body:
      'Como parabenizar alguém que significa tanto para mim?\n\n' +
      'Meu verdadeiro amor, minha companheira: de jogo, estudos, drama e paz, em resumo o meu lar. \n' +
      'Além de esposa, melhor amiga, você consegue me confrontar, me melhora e me fazer crescer.\n\n' +
      'É tão bom crescer ao seu lado, e que bom que é você - porque só poderia ser você. Aquela que nasceu com a chave pro meu coração, a qual prometo partilhar a vida e te dar todo meu amor.\n\n' +
      'Eu te amo meu amor. Feliz 19 anos, que seja um ano leve e cheio de conquistas.',
  },
];

/* ===== Fase 1 (opções) ===== */
const PHASE1 = [
  {
    title: 'Se no cinema você tivesse me dado o bolo, eu teria…',
    options: [
      {
        key: 'A',
        label: 'Te chamado no direct e marcado um jantar',
        resultTitle: 'É, eu iria ter insistido ainda mais',
        resultText:
          'Eu iria perdoar teu bolo e insistiria, afinal eu sentia que você era a mulher dos meus sonhos.',
      },
      {
        key: 'B',
        label: 'Pedido teu WhatsApp pra conversar mais antes de outro rolê',
        resultTitle: 'O conceito de estratégia',
        resultText:
          'Eu ia garantir mais conversa, as vezes nós só precisavamos nos conhecer mais',
      },
      {
        key: 'C',
        label: 'Te chamado pra jogar um Roblox de leve com teus amigos',
        resultTitle: '"apesar de eu não ser fã de Roblox..."',
        resultText:
          'Eu ia entrar no teu mundo primeiro… depois a gente criava o nosso.',
      },
    ],
  },
  {
    title: 'Mas e se no jantar na sua casa seus pais me reprovassem, eu…',
    options: [
      {
        key: 'A',
        label: 'Iria de novo (com um presente pra cada um da família)',
        resultTitle: 'Se o bico doce falhasse ia ter que apelar.',
        resultText: 'Tentaria conquistar os sogros a todo custo.',
      },
      {
        key: 'B',
        label: 'Chamaria sua família pra conhecer meus pais',
        resultTitle: 'Seria tipo uma união de clans',
        resultText: 'Eu faria ponte. Pra ficar contigo, eu uno os lados.',
      },
      {
        key: 'C',
        label: 'Levaria 5kg de picanha e faria um churrasco aí mesmo',
        resultTitle: 'Conquistar pelo estomago',
        resultText:
          'Essa seria a carta na manga, se no churrasco te conheci, no churrasco iriamos nos unir.',
      },
    ],
  },
];

/* ===== Imagens dos cards (opcional) ===== */
function cardImgSrc(id) {
  return `assets/card-${id}.png`;
}

/* ===== Modal final ===== */
const modal = document.createElement('div');
modal.className = 'modal hidden';
modal.innerHTML = `
  <div class="letter" role="dialog" aria-modal="true">
    <div class="letterHeader"><h2>A última carta</h2></div>
    <div id="letterBody" class="letterBody"></div>
    <div class="letterFooter">
      <button id="closeLetter" class="closeX">✕</button>
    </div>
  </div>
`;
document.body.appendChild(modal);
const letterBody = modal.querySelector('#letterBody');
const closeLetterBtn = modal.querySelector('#closeLetter');

closeLetterBtn.addEventListener('click', () => {
  clickSound();
  modal.classList.add('hidden');
  // volta pro grid com todas desbloqueadas
  state.maxUnlocked = 5;
  state.openedCardId = null;
  render();
});

function openLetter(text) {
  letterBody.textContent = text;
  modal.classList.remove('hidden');
}

/* ===== Estado ===== */
const state = {
  phase: 0, // 0 start, 1 phase1, 2 cards
  step: 0,
  openedCardId: null,
  maxUnlocked: 1,
  lastSequenceTriggered: false,
};

/* ===== Render helpers ===== */
function setScreen(html) {
  screen.innerHTML = `<div class="screen">${html}</div>`;
}

function setHeaderVisible(isVisible) {
  if (!topHeader) return;
  topHeader.style.display = isVisible ? '' : 'none';
}

/* ===== Overlay Loading ===== */
function runOverlayUnlock(durationMs) {
  overlay.classList.remove('hidden');
  barFill.style.width = '0%';

  return new Promise((resolve) => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / durationMs);
      barFill.style.width = `${Math.floor(p * 100)}%`;
      if (p < 1) requestAnimationFrame(tick);
      else {
        overlay.classList.add('hidden');
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

/* ===== Última carta: sempre com loading 3s + modal ===== */
function openLastCardWithLoading() {
  return runOverlayUnlock(3_000).then(() => {
    openLetter(CARDS.find((c) => c.id === 5).body);
  });
}

/* ===== Tela Start ===== */
function renderStart() {
  setHeaderVisible(true);

  setScreen(`
    <div class="center" style="min-height: 360px;">
      <div class="stack">
        <div style="display:grid; gap:10px; justify-items:center;">
          <div style="font-size:30px;">🎁</div>
          <p class="bigTitle" style="font-size:22px; margin:0;">Pronta pra um joguinho rápido?</p>
        </div>

        <button id="startBtn" class="btnGame btnPrimary"><span>▶</span><span>Começar</span></button>

        <p class="smallHint" style="margin-top:6px;">Sem respostas erradas, apenas diferentes caminhos para o mesmo destino.</p>
      </div>
    </div>
  `);

  document.getElementById('startBtn').addEventListener('click', () => {
    clickSound();
    state.phase = 1; // começa no jogo de opções
    state.step = 0;
    render();
  });
}

/* ===== Fase 1 (opções) ===== */
function renderPhase1(step) {
  setHeaderVisible(false);

  const s = PHASE1[step];
  if (!s) {
    state.phase = 2;
    render();
    return;
  }

  setScreen(`
    <p class="q">${escapeHtml(s.title)}</p>
    <div class="choices" id="choices">
      ${s.options
        .map(
          (opt) => `
        <button class="choice" data-key="${opt.key}">
          <div class="tag">${escapeHtml(opt.key)}</div>
          <div style="width:100%;">${escapeHtml(opt.label)}</div>
        </button>
      `
        )
        .join('')}
    </div>
    <div class="noteCenter">Escolhe uma. A única regra do jogo é continuar — e seguir teu coração.</div>
  `);

  const choicesEl = document.getElementById('choices');
  const buttons = screen.querySelectorAll('.choice');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      clickSound();

      const key = btn.dataset.key;
      const chosen = s.options.find((o) => o.key === key);

      buttons.forEach((b) => {
        if (b === btn) b.classList.add('selected');
        else b.classList.add('dim');
      });
      choicesEl.classList.add('closing');

      setTimeout(() => {
        renderFeedback(
          chosen.resultTitle,
          chosen.resultText,
          'Continuar ▶',
          () => {
            state.step++;
            render();
          }
        );
      }, 520);
    });
  });
}

/* ===== Feedback ===== */
function renderFeedback(title, text, buttonLabel, onNext) {
  setHeaderVisible(false);

  setScreen(`
    <div class="feedback">
      <div style="display:grid; gap:14px; width:min(420px,100%);">
        <div class="feedbackCard">
          <div class="okLine">
            <div class="okDot">✓</div>
            <div>${escapeHtml(title)}</div>
          </div>
          <p class="note" style="margin:0; white-space:pre-line; text-align:center;">${escapeHtml(
            text
          )}</p>
        </div>

        <button id="nextBtn" class="btnGame btnPrimary">${escapeHtml(
          buttonLabel
        )}</button>
      </div>
    </div>
  `);

  document.getElementById('nextBtn').addEventListener('click', () => {
    clickSound();
    onNext();
  });
}

/* ===== Cards ===== */
function renderCards() {
  setHeaderVisible(false);

  setScreen(`
    <div class="cardsHeader">
      <p class="cardsTitle">Junto contigo, eu posso dizer que…</p>
    </div>

    <div class="grid">
      ${CARDS.map((c) => {
        const locked = c.id > state.maxUnlocked;
        const isLast = c.id === 5;
        const isFlipped = state.openedCardId === c.id;

        return `
          <div class="flipWrap ${locked ? 'lockedCard' : ''} ${
          isLast ? 'mystery' : ''
        }" data-id="${c.id}">
            <div class="flipCard ${isFlipped ? 'isFlipped' : ''}">
              <div class="face front">
                <div class="frontTitle">${escapeHtml(
                  isLast ? '?????' : c.title
                )}</div>

                <div class="art">
                  <img src="${cardImgSrc(
                    c.id
                  )}" alt="" onerror="this.style.display='none'"/>
                  ${isLast ? `<div class="qmarks">?????</div>` : ``}
                </div>

                <div class="tapToFlip">toque para virar</div>
                <div class="flipIcon">↻</div>
              </div>

              <div class="face back">
                <div class="backTitle">${escapeHtml(
                  isLast ? 'A última carta' : c.title
                )}</div>
                <p class="backBody">${escapeHtml(c.body)}</p>
              </div>
            </div>
            ${
              locked
                ? `<div class="lockText"><span>🔒 bloqueado</span></div>`
                : ``
            }
          </div>
        `;
      }).join('')}
    </div>
  `);

  screen.querySelectorAll('.flipWrap').forEach((w) => {
    w.addEventListener('click', () => {
      const id = Number(w.dataset.id);
      onCardTap(id);
    });
  });
}

/* ===== Clique nas cartas ===== */
function onCardTap(id) {
  // Se última já desbloqueou: SEM flip, sempre abre modal com loading
  if (id === 5 && state.maxUnlocked >= 5) {
    clickSound();
    openLastCardWithLoading();
    return;
  }

  // Se está bloqueada: não faz nada
  if (id > state.maxUnlocked) return;

  clickSound();

  const wasOpen = state.openedCardId === id;

  // toggle abre/fecha
  state.openedCardId = wasOpen ? null : id;

  // abriu: libera próxima
  if (!wasOpen) {
    state.maxUnlocked = Math.min(5, Math.max(state.maxUnlocked, id + 1));
  }

  // Gatilho final: quando FECHAR a carta 4 (segunda vez tocando)
  if (id === 4 && wasOpen && !state.lastSequenceTriggered) {
    state.lastSequenceTriggered = true;

    // garante que a 5 ficará liberada após a sequência
    state.openedCardId = null;
    renderCards();

    openLastCardWithLoading().then(() => {
      state.maxUnlocked = 5;
      renderCards();
    });

    return;
  }

  renderCards();
}

/* ===== Utils ===== */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ===== Router ===== */
function render() {
  if (state.phase === 0) return renderStart();
  if (state.phase === 1) return renderPhase1(state.step);
  return renderCards();
}

render();
