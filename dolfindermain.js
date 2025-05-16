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

    // rarity에 따라 클래스 추가 (전설 카드에 LEGENDARY 클래스 붙이기)
    if (card.rarity === 'LEGENDARY') {
      cardEl.classList.add('LEGENDARY');
    }

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = `https://art.hearthstonejson.com/v1/render/latest/koKR/256x/${card.id}.png`;
    img.alt = card.name;

    cardEl.addEventListener("click", () => {
      showCardModal(card);
    });

    cardEl.appendChild(img);
    cardGrid.appendChild(cardEl);
  });
}

function showCardModal(card) {
  const imageUrl = `https://art.hearthstonejson.com/v1/render/latest/koKR/512x/${card.id}.png`;
  const className = classMapReversed[card.cardClass] || card.cardClass;

  const rarityMap = {
    'FREE': '무료',
    'COMMON': '일반',
    'RARE': '희귀',
    'EPIC': '영웅',
    'LEGENDARY': '전설'
  };

  const rarityDescriptions = {
    'COMMON': {
      badge: '🟦 일반(Common)',
      short: '전장의 기본. 가장 많이 쓰이고, 가장 많이 싸운다.',
      long: '쉽게 얻을 수 있지만, 전장에서 가장 먼저 마주치게 되는 전우이자 적.'
    },
    'RARE': {
      badge: '🟪 희귀(Rare)',
      short: '한 발짝 더 깊은 전략, 조금 더 특별한 힘.',
      long: '보통 이상의 성능을 가진 카드. 덱의 색깔을 바꾸는 핵심 요소가 되기도 한다.'
    },
    'EPIC': {
      badge: '🟣 에픽(Epic)',
      short: '눈에 띄는 강력함, 예측 불가능한 전투의 열쇠.',
      long: '등장 자체가 전략. 단 하나로 전세를 뒤집을 수도 있는 강한 능력의 카드.'
    },
    'LEGENDARY': {
      badge: '🟨 전설(Legendary)',
      short: '하나의 이름, 하나의 이야기. 그리고 승리를 부르는 유일한 존재.',
      long: '카드팩에 단 한 장만 존재할 수 있는 유일무이한 존재.\n그 카드 하나에 담긴 전설은 당신의 덱을 정의합니다.'
    }
  };

  const rarity = (card.rarity || '').toUpperCase();
  const rarityKorean = rarityMap[rarity] || rarity;
  const desc = rarityDescriptions[rarity];

  // 모달 열기
  modal.classList.remove('hidden');

  // .modal-content에 등급 클래스 적용
  const modalContent = modal.querySelector('.modal-content');
  modalContent.classList.remove('FREE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY');
  if (rarity) {
    modalContent.classList.add(rarity);
  }

  const wrapper = document.createElement('div');
  wrapper.className = `card-image-wrapper ${rarity}`;

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = card.name;

  wrapper.appendChild(img);

  const infoHTML = `
    <div class="card-details">
      <h2>${card.name}</h2>
      <p><strong>직업:</strong> ${className}</p>
      <p><strong>타입:</strong> ${card.type}</p>
      <p><strong>마나:</strong> ${card.cost}</p>
      ${['MINION', 'WEAPON'].includes(card.type) ? `<p><strong>공격력 / 체력:</strong> ${card.attack} / ${card.health}</p>` : ""}
      <p><strong>희귀도:</strong> ${rarityKorean}</p>
      ${card.text ? `<p><strong>효과:</strong> ${card.text}</p>` : ""}
      ${card.set ? `<p><strong>세트:</strong> ${card.set}</p>` : ""}
      ${card.flavor ? `<p class="flavor">"${card.flavor}"</p>` : ""}
      ${desc ? `
        <div class="rarity-desc-box ${rarity}">
          <div class="rarity-badge">${desc.badge}</div>
          <div class="rarity-short">${desc.short}</div>
          <div class="rarity-long">${desc.long}</div>
        </div>` : ''}
    </div>
  `;

  previewContainer.innerHTML = '';
  previewContainer.appendChild(wrapper);
  previewContainer.insertAdjacentHTML('beforeend', infoHTML);

  // 카드 회전 효과
  wrapper.addEventListener('mousemove', (e) => {
    const bounds = wrapper.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const rotateY = (x - bounds.width / 2) / 20;
    const rotateX = -(y - bounds.height / 2) / 20;

    img.style.transform = `scale(1.1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  wrapper.addEventListener('mouseleave', () => {
    img.style.transform = 'scale(1.1) rotateX(0deg) rotateY(0deg)';
  });
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

