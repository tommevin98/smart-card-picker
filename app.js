const form = document.getElementById("cardForm");
const cardGrid = document.getElementById("cardGrid");
const highlightBox = document.getElementById("cardHighlight");
const systemDate = document.getElementById("systemDate");

let cards = JSON.parse(localStorage.getItem("cards")) || [];
let editingIndex = null;

// ----- Monthly reset logic -----
function resetPaidStatusIfNewMonth() {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
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

// ----- Push notification -----
function checkDueNotifications() {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  if (Notification.permission === "granted") {
    const today = new Date();
    const todayDay = today.getDate();

    cards.forEach((card) => {
      const paid = getPaidStatus(card);
      const daysUntilDue = (card.dueDate - todayDay + 31) % 31;

      if (!paid && daysUntilDue === 5) {
        new Notification("💳 Credit Card Due Soon", {
          body: `${card.name} is due in 5 days (${card.dueDate}th)!`,
        });
      }
    });
  }
}

function formatDateLabel(date) {
  const now = new Date();
  const currentDay = now.getDate();
  return date >= currentDay
    ? `${date}th of this month`
    : `${date}th of next month`;
}

function getPaidStatus(card) {
  const today = new Date();
  const key = card.name + "_paid";
  const lastPaid = localStorage.getItem(key);
  return lastPaid === today.getFullYear() + "-" + today.getMonth();
}

function markAsPaid(index) {
  const card = cards[index];
  const today = new Date();
  const key = card.name + "_paid";
  localStorage.setItem(key, today.getFullYear() + "-" + today.getMonth());
  renderCards();
}

function renderCards() {
  const today = new Date();
  const todayDay = today.getDate();
  const todayString = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  systemDate.textContent = "📅 Today is: " + todayString;

  cardGrid.innerHTML = "";
  let bestCard = null;
  let maxDays = -1;

  cards.forEach((card, index) => {
    const days = (card.statementDate - todayDay + 31) % 31;
    if (days > maxDays) {
      maxDays = days;
      bestCard = { name: card.name, days };
    }

    const cardEl = document.createElement("div");
    cardEl.className = "card";

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

    const cardIcons = document.createElement("div");
    cardIcons.className = "card-icons";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => editCard(index);
    cardIcons.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = () => deleteCard(index);
    cardIcons.appendChild(deleteBtn);

    cardHeader.appendChild(cardLeft);
    cardHeader.appendChild(cardIcons);

    const due = document.createElement("p");
    const dueLabel = formatDateLabel(card.dueDate);

    const paid = getPaidStatus(card);
    const overdue = !paid && card.dueDate < todayDay;

    due.textContent = overdue
      ? `Due: ${dueLabel} (Overdue)`
      : `Due: ${dueLabel}`;

    const paidBtn = document.createElement("button");
    paidBtn.textContent = "✅ Mark as Paid";
    paidBtn.style.marginTop = "8px";
    paidBtn.onclick = () => markAsPaid(index);

    cardEl.appendChild(cardHeader);
    cardEl.appendChild(due);
    if (!paid) cardEl.appendChild(paidBtn);

    cardGrid.appendChild(cardEl);
  });

  if (bestCard) {
    highlightBox.style.display = "block";
    highlightBox.innerHTML = `<strong>${bestCard.name}</strong><br>Longest credit period – statement in ${bestCard.days} days.`;
  } else {
    highlightBox.style.display = "none";
  }
}

form.onsubmit = function (e) {
  e.preventDefault();
  const name = document.getElementById("cardName").value.trim();
  const statementDate = parseInt(document.getElementById("statementDate").value);
  const dueDate = parseInt(document.getElementById("dueDate").value);
  const imageInput = document.getElementById("cardImage");
  const file = imageInput.files[0];

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
    reader.onload = () => {
      saveCard(reader.result);
    };
    reader.readAsDataURL(file);
  } else {
    const existingImage = (editingIndex !== null && cards[editingIndex])
      ? cards[editingIndex].image
      : "";
    saveCard(existingImage);
  };

function deleteCard(index) {
  if (confirm("Delete this card?")) {
    cards.splice(index, 1);
    localStorage.setItem("cards", JSON.stringify(cards));
    renderCards();
  }
}

function editCard(index) {
  const card = cards[index];
  document.getElementById("cardName").value = card.name;
  document.getElementById("statementDate").value = card.statementDate;
  document.getElementById("dueDate").value = card.dueDate;
  editingIndex = index;
}

// Run on page load
resetPaidStatusIfNewMonth();
renderCards();
checkDueNotifications();
}
