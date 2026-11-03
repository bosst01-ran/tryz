const symbols = ["●", "○", "■", "◆"];
const MAX_MISTAKES = 3;
const MAX_PACKETS = symbols.length * 2;

let shapes = [];
let sequence = [];
let selected = [];
let answer = [];
let previousArrangement = "";

let showCount = 4;
let mistakes = 0;
let round = 1;
let step = 0;
let phase = "ready";
let timer = null;

const number = document.getElementById("number");
const shown = document.getElementById("shown");
const instruction = document.getElementById("instruction");
const progress = document.getElementById("progress");
const packets = document.getElementById("packets");
const message = document.getElementById("message");
const slots = document.getElementById("slots");

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeRandomShapes() {
  let arrangement = [];
  let signature = "";

  // Each of the four symbols can appear at most twice.
  // Avoid repeating the exact same arrangement in consecutive rounds.
  do {
    arrangement = [];

    for (let i = 0; i < showCount; i++) {
      const choices = symbols.filter(
        symbol => arrangement.filter(item => item === symbol).length < 2
      );
      arrangement.push(choices[Math.floor(Math.random() * choices.length)]);
    }

    signature = arrangement.join("");
  } while (signature === previousArrangement);

  previousArrangement = signature;
  return arrangement.map((symbol, index) => ({
    number: index + 1,
    symbol
  }));
}

function updateStats() {
  document.getElementById("round").textContent = round;
  document.getElementById("mistakes").textContent = `${mistakes}/${MAX_MISTAKES}`;
}

function resetSlots(packetNumbers = []) {
  slots.innerHTML = "";
  for (let i = 0; i < 2; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";

    const label = document.createElement("small");
    label.className = "slot-number";
    label.textContent = packetNumbers[i] ? `#${packetNumbers[i]}` : "";

    const value = document.createElement("span");
    value.className = "slot-shape";

    slot.append(label, value);
    slots.appendChild(slot);
  }
}

function startGame() {
  clearTimeout(timer);
  showCount = 4;
  mistakes = 0;
  round = 1;
  previousArrangement = "";
  updateStats();
  newRound();
}

function newRound() {
  clearTimeout(timer);

  shapes = makeRandomShapes();
  sequence = Array.from({ length: showCount }, (_, index) => index + 1);
  selected = [];
  answer = [];
  step = 0;
  phase = "show";

  updateStats();
  resetSlots();
  instruction.textContent = "MEMORIZE THE PACKETS";
  message.textContent = "Watch the shapes carefully.";
  packets.innerHTML = "";
  progress.innerHTML = Array.from({ length: showCount }, () => "<span></span>").join("");

  showNext();
}

function showNext() {
  if (phase !== "show") return;

  if (step >= sequence.length) {
    timer = setTimeout(startInput, 700);
    return;
  }

  const packetNumber = sequence[step];
  const packet = shapes[packetNumber - 1];

  number.textContent = "#" + packetNumber;
  shown.textContent = packet.symbol;

  [...progress.children].forEach((bar, index) => {
    bar.classList.toggle("active", index <= step);
  });

  step++;
  timer = setTimeout(showNext, 1000);
}

function startInput() {
  phase = "input";
  selected = [];

  const first = Math.floor(Math.random() * showCount) + 1;
  let second = Math.floor(Math.random() * showCount) + 1;
  while (second === first) {
    second = Math.floor(Math.random() * showCount) + 1;
  }

  // Player answers in reverse order: second packet, then first packet.
  answer = [second, first];

  instruction.textContent = "SELECT THE SHAPES BELOW";
  number.textContent = "INPUT";
  shown.textContent = "?";
  message.textContent = `Mistakes: ${mistakes}/${MAX_MISTAKES}`;
  packets.innerHTML = "";

  // Show the requested packet numbers inside the two answer boxes.
  // The order is already reversed: second packet first, then first packet.
  resetSlots(answer);

  // Input always has the same four original shape buttons.
  symbols.forEach(symbol => {
    const button = document.createElement("button");
    button.className = "packet";
    button.type = "button";
    button.textContent = symbol;
    button.setAttribute("aria-label", `Choose ${symbol}`);
    button.onclick = () => selectShape(symbol);
    packets.appendChild(button);
  });

}

function selectShape(symbol) {
  if (phase !== "input") return;

  const expectedPacketNumber = answer[selected.length];
  const expectedShape = shapes[expectedPacketNumber - 1].symbol;

  if (symbol !== expectedShape) {
    mistakes++;
    updateStats();

    if (mistakes >= MAX_MISTAKES) {
      gameOver();
    } else {
      phase = "waiting";
      message.textContent = `Wrong! Mistakes: ${mistakes}/${MAX_MISTAKES}`;
      timer = setTimeout(newRound, 1000);
    }
    return;
  }

  selected.push({ packetNumber: expectedPacketNumber, symbol });
  updateSlots();

  if (selected.length === 2) {
    phase = "correct";

    instruction.textContent = "CORRECT!";
    number.textContent = "SUCCESS";
    shown.textContent = "✓";

    if (showCount >= MAX_PACKETS) {
      message.textContent = "You completed all 8 packets! Press START to play again.";
      phase = "gameover";
      return;
    }

    showCount++;
    round++;
    message.textContent = `Next round: ${showCount} packets!`;
    updateStats();
    timer = setTimeout(newRound, 1300);
  }
}

function updateSlots() {
  for (let i = 0; i < 2; i++) {
    const slot = slots.children[i];
    const value = slot.querySelector(".slot-shape");
    const item = selected[i];
    value.textContent = item ? item.symbol : "";
    slot.classList.toggle("filled", !!item);
  }
}

function gameOver() {
  clearTimeout(timer);
  phase = "gameover";
  instruction.textContent = "GAME OVER";
  number.textContent = "FINISHED";
  shown.textContent = "✕";
  message.textContent = `You reached Round ${round}. Press START to play again.`;
  packets.innerHTML = "";
  progress.innerHTML = "";
  resetSlots();
}

document.getElementById("start").onclick = () => {
  if (phase === "ready" || phase === "gameover") startGame();
};

document.getElementById("reset").onclick = () => {
  clearTimeout(timer);
  phase = "ready";
  showCount = 4;
  mistakes = 0;
  round = 1;
  step = 0;
  shapes = [];
  sequence = [];
  selected = [];
  answer = [];
  previousArrangement = "";

  updateStats();
  resetSlots();
  packets.innerHTML = "";
  progress.innerHTML = "";
  instruction.textContent = "PACKET MEMORY GAME";
  number.textContent = "READY";
  shown.textContent = "★";
  message.textContent = "Press START to play.";
};

document.getElementById("undo").onclick = () => {
  if (phase !== "input" || selected.length === 0) return;
  selected.pop();
  updateSlots();
};

updateStats();
resetSlots();
