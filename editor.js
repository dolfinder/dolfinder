let allCards = [];
let filteredCards = [];
let deck = [];
let currentPage = 1;
const cardsPerPage = 10;
const API_URL = "https://api.hearthstonejson.com/v1/latest/koKR/cards.collectible.json";

// 카드 불러오기
fetch(API_URL)
	.then(res => res.json())
	.then(data => {
		allCards = data.filter(card => card.cardClass);
		filterCards();
		updateDeckListDropdown();
	});

document.getElementById('nameInput').addEventListener('input', filterCards);
document.getElementById('raritySelect').addEventListener('change', filterCards);
document.getElementById('costSelect').addEventListener('change', filterCards);
document.getElementById('typeSelect').addEventListener('change', filterCards);
document.getElementById('classSelect').addEventListener('change', filterCards);
document.getElementById('prevPage').addEventListener('click', () => {
	if (currentPage > 1) {
		currentPage--;
		showCards();
	}
});
document.getElementById('nextPage').addEventListener('click', () => {
	const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
	if (currentPage < totalPages) {
		currentPage++;
		showCards();
	}
});

function filterCards() {
	currentPage = 1;
	const nameKeyword = document.getElementById('nameInput').value.trim().toLowerCase();
	const selectedRarity = document.getElementById('raritySelect').value;
	const selectedCost = document.getElementById('costSelect').value;
	const selectedType = document.getElementById('typeSelect').value;
	const selectedClass = document.getElementById('classSelect').value;

	filteredCards = allCards.filter(c => {
		const matchName = !nameKeyword || (c.name && c.name.toLowerCase().includes(nameKeyword));
		const matchRarity = selectedRarity === "ALL" || c.rarity === selectedRarity;
		const matchType = selectedType === "ALL" ||
			(selectedType === "HERO" ? c.type === "HERO" && c.set !== "HERO_SKINS" : c.type === selectedType);
		const matchCost = selectedCost === "ALL" ||
			(selectedCost === "7" ? (c.cost ?? 0) >= 7 : (c.cost ?? 0) === Number(selectedCost));
		const matchClass = selectedClass === "ALL" || c.cardClass === selectedClass;

		return matchName && matchRarity && matchType && matchCost && matchClass;
	});

	showCards();
}

function showCards() {
	const cardList = document.getElementById('cardList');
	cardList.innerHTML = '';
	const start = (currentPage - 1) * cardsPerPage;
	const end = start + cardsPerPage;
	const pageCards = filteredCards.slice(start, end);

	if (pageCards.length === 0) {
		cardList.innerHTML = `<p>카드가 없습니다.</p>`;
		return;
	}

	pageCards.forEach(card => {
		const div = document.createElement('div');
		div.className = 'card';
		div.innerHTML = `<strong>${card.name}</strong><br><img src="https://art.hearthstonejson.com/v1/render/latest/koKR/256x/${card.id}.png" alt="${card.name}">`;
		div.onclick = () => addToDeck(card);
		cardList.appendChild(div);
	});

	document.getElementById('pageInfo').textContent = `${currentPage} / ${Math.ceil(filteredCards.length / cardsPerPage)}`;
}

function addToDeck(card) {
	const selectedClass = document.getElementById('classSelect').value;

	if (selectedClass === "ALL") {
		alert("덱에 카드를 추가하려면 직업을 먼저 선택해야 합니다.");
		return;
	}

	if (card.cardClass !== selectedClass && card.cardClass !== "NEUTRAL") {
		alert("해당 카드는 선택한 직업의 카드가 아닙니다.");
		return;
	}

	const firstNonNeutral = deck.find(c => c.cardClass !== "NEUTRAL");
	if (firstNonNeutral && card.cardClass !== "NEUTRAL" && card.cardClass !== firstNonNeutral.cardClass) {
		alert(`이미 ${firstNonNeutral.cardClass} 직업 카드가 있으므로 같은 직업 카드만 추가할 수 있습니다.`);
		return;
	}

	if (deck.length >= 30) {
		alert("덱은 최대 30장까지만 추가할 수 있습니다.");
		return;
	}

	const sameCards = deck.filter(c => c.id === card.id);
	const limit = card.rarity === "LEGENDARY" ? 1 : 2;

	if (sameCards.length < limit) {
		deck.push(card);
		updateDeck();
	} else {
		alert(`이 카드는 최대 ${limit}장까지만 추가할 수 있습니다.`);
	}

	document.getElementById('deckCount').textContent = `카드 수: ${deck.length} / 30`;
}

function updateDeck() {
	const list = document.getElementById('deckList');
	list.innerHTML = '';
	const cardCounts = {};
	deck.forEach(card => {
		cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
	});

	const uniqueCards = Array.from(new Set(deck.map(card => card.id)))
		.map(id => deck.find(card => card.id === id))
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));

	uniqueCards.forEach(card => {
		const count = cardCounts[card.id];
		const li = document.createElement('li');
		li.textContent = `${card.name} (비용: ${card.cost ?? 0})${count > 1 ? ` (${count}장)` : ''}`;
		li.onclick = () => {
			const index = deck.findIndex(c => c.id === card.id);
			if (index !== -1) {
				deck.splice(index, 1);
				updateDeck();
			}
			document.getElementById('deckCount').textContent = `카드 수: ${deck.length} / 30`;
		};
		list.appendChild(li);
	});

	const nonNeutral = deck.find(c => c.cardClass !== "NEUTRAL");
	const deckClassDisplay = document.getElementById('deckClass');
	if (deck.length === 0) {
		deckClassDisplay.textContent = "덱 직업: 없음";
	} else if (nonNeutral) {
		deckClassDisplay.textContent = `덱 직업: ${nonNeutral.cardClass}`;
	} else {
		deckClassDisplay.textContent = "덱 직업: 중립만 포함";
	}
	updateManaChart(deck);
}

// 덱 저장 - 여러 개 저장 가능
document.getElementById('saveDeckBtn').addEventListener('click', () => {
	const deckName = document.getElementById('deckNameInput').value.trim();
	if (!deckName) {
		alert("덱 이름을 입력해주세요.");
		return;
	}

	if (deck.length === 0) {
		alert("저장할 덱이 없습니다.");
		return;
	}

	const deckData = deck.map(card => ({
		id: card.id,
		name: card.name,
		cost: card.cost,
		cardClass: card.cardClass,
		rarity: card.rarity
	}));

	localStorage.setItem(`deck_${deckName}`, JSON.stringify(deckData));
	alert(`"${deckName}" 덱이 저장되었습니다.`);
	updateDeckListDropdown();
});

// 저장된 덱 불러오기
document.getElementById('loadDeckBtn').addEventListener('click', () => {
	const selectedDeck = document.getElementById('loadDeckSelect').value;
	if (!selectedDeck) {
		alert("불러올 덱을 선택해주세요.");
		return;
	}

	const saved = localStorage.getItem(`deck_${selectedDeck}`);
	if (!saved) {
		alert("선택한 덱을 찾을 수 없습니다.");
		return;
	}

	try {
		const deckData = JSON.parse(saved);
		deck = [];
		deckData.forEach(savedCard => {
			const matched = allCards.find(card => card.id === savedCard.id);
			if (matched) {
				deck.push(matched);
			}
		});
		updateDeck();
		document.getElementById('deckCount').textContent = `카드 수: ${deck.length} / 30`;
		alert(`"${selectedDeck}" 덱을 불러왔습니다.`);
	} catch (e) {
		alert("덱 데이터를 불러오지 못했습니다.");
		console.error(e);
	}
});

// 덱 목록 드롭다운 업데이트
function updateDeckListDropdown() {
	const select = document.getElementById('loadDeckSelect');
	select.innerHTML = '<option value="">저장된 덱 선택</option>';
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key.startsWith("deck_")) {
			const name = key.replace("deck_", "");
			const option = document.createElement("option");
			option.value = name;
			option.textContent = name;
			select.appendChild(option);
		}
	}
}
let manaChart;

function updateManaChart(deck) {
	const manaCounts = new Array(8).fill(0); // 0~6 + 7이상

	deck.forEach(card => {
		const cost = Math.min(card.cost ?? 0, 7);
		manaCounts[cost]++;
	});

	const ctx = document.getElementById('manaChart').getContext('2d');

	if (manaChart) manaChart.destroy(); // 기존 차트 제거

	manaChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: ['0', '1', '2', '3', '4', '5', '6', '7+'],
			datasets: [{
				label: '카드 수',
				data: manaCounts,
				backgroundColor: '#fca311',
				borderColor: '#b95b00',
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						color: '#fff'
					}
				},
				x: {
					ticks: {
						color: '#fff'
					}
				}
			},
			plugins: {
				legend: {
					labels: {
						color: '#fff'
					}
				}
			}
		}
	});
}
