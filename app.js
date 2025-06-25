
const form = document.getElementById("cardForm");
const cardGrid = document.getElementById("cardGrid");
const highlightBox = document.getElementById("cardHighlight");
const systemDate = document.getElementById("systemDate");
const formContainer = document.getElementById("formContainer");
const showFormBtn = document.getElementById("showFormBtn");

let cards = JSON.parse(localStorage.getItem("cards")) || [];
let editingIndex = null;

showFormBtn.onclick = () => {
  formContainer.style.display = "block";
  showFormBtn.style.display = "none";
};

function resetPaidStatusIfNewMonth() {
  const now = new Date();
  const currentMonthKey = now.getFullYear() + "-" + now.getMonth();
  const lastResetMonth = localStorage.getItem("lastResetMonth");
  if (currentMonthKey !== lastResetMonth) {
    Object.keys(localStorage).forEach((key) => {
      if (key.endsWith("_paid")) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem("lastResetMonth", currentMonthKey);
  }
}

function getPaidStatus(card) {
  const now = new Date();
  return localStorage.getItem(card.name + "_paid") === now.getFullYear() + "-" + now.getMonth();
}

function markAsPaid(index) {
  const now = new Date();
  localStorage.setItem(cards[index].name + "_paid", now.getFullYear() + "-" + now.getMonth());
  renderCards();
}

function formatSuffix(n) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th";
  }
}

function formatDateLabel(date) {
  const now = new Date();
  return date >= now.getDate()
    ? `${date}${formatSuffix(date)} of this month`
    : `${date}${formatSuffix(date)} of next month`;
}

function renderCards() {
  const now = new Date();
  systemDate.textContent = "📅 Today is: " + now.toDateString();
  cardGrid.innerHTML = "";
  let bestCard = null, maxDays = -1;

  cards.forEach((card, i) => {
    const daysUntilStmt = (card.statementDate - now.getDate() + 31) % 31;
    if (daysUntilStmt > maxDays) {
      bestCard = card;
      maxDays = daysUntilStmt;
    }

    const cardEl = document.createElement("div");
    cardEl.className = "card";

    const cardDueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDate);
    if (!getPaidStatus(card) && cardDueDate < now) {
      cardEl.classList.add("overdue");
    }

    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    const cardLeft = document.createElement("div");
    cardLeft.className = "card-left";

    if (card.image) {
      const logo = document.createElement("img");
      logo.src = card.image;
      cardLeft.appendChild(logo);
    }

    const name = document.createElement("strong");
    name.textContent = card.name;
    cardLeft.appendChild(name);
    cardHeader.appendChild(cardLeft);

    const icons = document.createElement("div");
    icons.className = "card-icons";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => editCard(i);
    icons.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = () => deleteCard(i);
    icons.appendChild(deleteBtn);

    cardHeader.appendChild(icons);
    cardEl.appendChild(cardHeader);

    const dueP = document.createElement("p");
    dueP.textContent = `Due: ${formatDateLabel(card.dueDate)}`;
    cardEl.appendChild(dueP);

    if (!getPaidStatus(card)) {
      const paidBtn = document.createElement("button");
      paidBtn.textContent = "✅ Mark as Paid";
      paidBtn.onclick = () => markAsPaid(i);
      cardEl.appendChild(paidBtn);
    }

    cardGrid.appendChild(cardEl);
  });

  if (bestCard) {
    highlightBox.style.display = "block";
    highlightBox.innerHTML = `<strong>Use ${bestCard.name}</strong><br>Longest credit period – statement in ${maxDays} days.`;
  } else {
    highlightBox.style.display = "none";
  }

  if (cards.length === 0) {
    formContainer.style.display = "block";
    showFormBtn.style.display = "none";
  } else {
    formContainer.style.display = "none";
    showFormBtn.style.display = "block";
  }
}

form.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById("cardName").value.trim();
  const statementDate = parseInt(document.getElementById("statementDate").value);
  const dueDate = parseInt(document.getElementById("dueDate").value);
  const file = document.getElementById("cardImage").files[0];

  const saveCard = (image = "") => {
    const newCard = { name, statementDate, dueDate, image };
    if (editingIndex !== null) {
      cards[editingIndex] = newCard;
      editingIndex = null;
    } else {
      cards.push(newCard);
    }
    localStorage.setItem("cards", JSON.stringify(cards));
    form.reset();
    renderCards();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => saveCard(reader.result);
    reader.readAsDataURL(file);
  } else {
    saveCard(editingIndex !== null && cards[editingIndex] ? cards[editingIndex].image : "");
  }
};

function deleteCard(i) {
  if (confirm("Delete this card?")) {
    cards.splice(i, 1);
    localStorage.setItem("cards", JSON.stringify(cards));
    renderCards();
  }
}

function editCard(i) {
  const c = cards[i];
  document.getElementById("cardName").value = c.name;
  document.getElementById("statementDate").value = c.statementDate;
  document.getElementById("dueDate").value = c.dueDate;
  editingIndex = i;
}

resetPaidStatusIfNewMonth();
renderCards();
