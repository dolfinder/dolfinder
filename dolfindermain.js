const cardGrid = document.getElementById('cardGrid');
const jobButtons = document.querySelectorAll('.job-tabs button');
const modal = document.getElementById('cardModal');
const modalClose = document.getElementById('modalClose');
const previewContainer = document.getElementById('modalPreview');

const searchInput = document.getElementById('searchInput');
const rarityFilter = document.getElementById('rarityFilter');
const costFilter = document.getElementById('costFilter');
const typeFilter = document.getElementById('typeFilter');

let allCards = [];
let selectedJob = null;

const classMap = {
  '드루 이드': 'DRUID',
  '마법사': 'MAGE',
  '전사': 'WARRIOR',
  '사제': 'PRIEST',
  '도적': 'ROGUE',
  '성기사': 'PALADIN',
  '흑마법사': 'WARLOCK',
  '사냥꾼': 'HUNTER',
  '주술사': 'SHAMAN',
  '중립': 'NEUTRAL'
};

const classMapReversed = {
  'DRUID': '드루 이드',
  'MAGE': '마법사',
  'WARRIOR': '전사',
  'PRIEST': '사제',
  'ROGUE': '도적',
  'PALADIN': '성기사',
  'WARLOCK': '흑마법사',
  'HUNTER': '사냥꾼',
  'SHAMAN': '주술사',
  'NEUTRAL': '중립'
};

fetch('https://api.hearthstonejson.com/v1/latest/koKR/cards.collectible.json')
  .then(res => res.json())
  .then(data => {
    allCards = data;
    renderCards(data.slice(0, 20));
  });

function renderCards(cards) {
  cardGrid.innerHTML = '';
  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = `https://art.hearthstonejson.com/v1/render/latest/koKR/256x/${card.id}.png`;
    img.alt = card.name;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = card.name;

    cardEl.addEventListener("click", () => {
      showCardModal(card);
    });

    cardEl.appendChild(img);
    cardEl.appendChild(title);
    cardGrid.appendChild(cardEl);
  });
}

function showCardModal(card) {
  const {
    id, name, cardClass, rarity, cost,
    type, attack, health, text, flavor, set
  } = card;

  const imageUrl = `https://art.hearthstonejson.com/v1/render/latest/koKR/512x/${id}.png`;
  const isMinionOrWeapon = ['MINION', 'WEAPON'].includes(type);
  const className = classMapReversed[cardClass] || cardClass;

  const detailHTML = `
    <img src="${imageUrl}" alt="${name}">
    <div class="card-details">
      <h2>${name}</h2>
      <p><strong>직업:</strong> ${className}</p>
      <p><strong>타입:</strong> ${type}</p>
      <p><strong>마나:</strong> ${cost}</p>
      ${isMinionOrWeapon ? `<p><strong>공격력 / 체력:</strong> ${attack} / ${health}</p>` : ""}
      <p><strong>희귀도:</strong> ${rarity}</p>
      ${text ? `<p><strong>효과:</strong> ${text}</p>` : ""}
      ${set ? `<p><strong>세트:</strong> ${set}</p>` : ""}
      ${flavor ? `<p class="flavor">"${flavor}"</p>` : ""}
    </div>
  `;

  previewContainer.innerHTML = detailHTML;
  modal.classList.remove("hidden");
}

function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedRarity = rarityFilter.value;
  const selectedCost = costFilter.value;
  const selectedType = typeFilter.value;

  const filtered = allCards.filter(card => {
    const matchesClass = selectedJob ? card.cardClass === selectedJob : true;
    const matchesKeyword = card.name?.toLowerCase().includes(keyword);
    const matchesRarity = selectedRarity ? card.rarity === selectedRarity : true;
    const matchesType = selectedType ? card.type === selectedType : true;

    let matchesCost = true;
    if (selectedCost === '7') {
      matchesCost = card.cost >= 7;
    } else if (selectedCost !== '') {
      matchesCost = card.cost === parseInt(selectedCost);
    }

    return matchesClass && matchesKeyword && matchesRarity && matchesCost && matchesType;
  });

  renderCards(filtered);
}

searchInput.addEventListener('input', applyFilters);
rarityFilter.addEventListener('change', applyFilters);
costFilter.addEventListener('change', applyFilters);
typeFilter.addEventListener('change', applyFilters);

jobButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    jobButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedJob = classMap[btn.textContent];
    applyFilters();
  });
});

modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});

previewContainer.addEventListener('mousemove', function (e) {
  const card = previewContainer.querySelector('img');
  const bounds = previewContainer.getBoundingClientRect();
  const x = e.clientX - bounds.left;
  const y = e.clientY - bounds.top;

  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  const rotateY = (x - centerX) / 20;
  const rotateX = -(y - centerY) / 20;

  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  previewContainer.style.setProperty('--mouse-x', `${(x / bounds.width) * 100}%`);
  previewContainer.style.setProperty('--mouse-y', `${(y / bounds.height) * 100}%`);
});

previewContainer.addEventListener('mouseleave', function () {
  const card = previewContainer.querySelector('img');
  card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  previewContainer.style.setProperty('--mouse-x', `50%`);
  previewContainer.style.setProperty('--mouse-y', `50%`);
});
