let cards = JSON.parse(localStorage.getItem('cards')) || [];
let editingIndex = null;

function getToday() {
  return new Date().getDate();
}

function saveCards() {
  localStorage.setItem('cards', JSON.stringify(cards));
}

function showCards() {
  const container = document.getElementById('card-list');
  container.innerHTML = '';
  const today = getToday();

  cards.forEach((card, index) => {
    const dueIn = card.dueDate - today;
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    const icons = document.createElement('div');
    icons.className = 'card-icons';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.onclick = () => editCard(index);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = () => deleteCard(index);

    icons.appendChild(editBtn);
    icons.appendChild(deleteBtn);

    const header = document.createElement('div');
    header.className = 'card-header';

    if (card.image) {
      const img = document.createElement('img');
      img.src = card.image;
      header.appendChild(img);
    }

    const nameEl = document.createElement('strong');
    nameEl.textContent = card.name;
    header.appendChild(nameEl);

    const dueEl = document.createElement('p');
    dueEl.textContent = `Due: ${card.dueDate} (${dueIn >= 0 ? dueIn + " days" : "Overdue"})`;

    cardEl.appendChild(icons);
    cardEl.appendChild(header);
    cardEl.appendChild(dueEl);
    container.appendChild(cardEl);
  });
}

function recommendCard() {
  const today = getToday();
  let bestCard = null;
  let maxDays = -1;

  cards.forEach(card => {
    let daysTillStatement = (card.statementDate - today + 31) % 31;
    if (daysTillStatement > maxDays) {
      maxDays = daysTillStatement;
      bestCard = card;
    }
  });

  const recDiv = document.getElementById('recommendation');
  if (bestCard) {
    recDiv.innerHTML = `
      <strong>💳 Use <span style="color:#29e58f">${bestCard.name}</span></strong><br/>
      Longest credit period – statement in ${maxDays} days.
    `;
  } else {
    recDiv.textContent = 'Please add cards to get recommendations.';
  }
}

document.getElementById('cardForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('cardName').value;
  const statementDate = parseInt(document.getElementById('statementDate').value);
  const dueDate = parseInt(document.getElementById('dueDate').value);
  const imageInput = document.getElementById('cardImage');

  const processCard = (imageData) => {
    const newCard = { name, statementDate, dueDate, image: imageData || null };

    if (editingIndex !== null) {
      cards[editingIndex] = newCard;
      editingIndex = null;
    } else {
      cards.push(newCard);
    }

    saveCards();
    showCards();
    recommendCard();
    document.getElementById('cardForm').reset();
  };

  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function () {
      processCard(reader.result);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    const existingImage = editingIndex !== null ? cards[editingIndex].image : null;
    processCard(existingImage);
  }
});

function editCard(index) {
  const card = cards[index];
  document.getElementById('cardName').value = card.name;
  document.getElementById('statementDate').value = card.statementDate;
  document.getElementById('dueDate').value = card.dueDate;
  editingIndex = index;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCard(index) {
  if (confirm("Are you sure you want to delete this card?")) {
    cards.splice(index, 1);
    saveCards();
    showCards();
    recommendCard();
  }
}

showCards();
recommendCard();
