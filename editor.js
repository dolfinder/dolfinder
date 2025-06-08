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
function analyzeDeckSimple(deck) {
	if (deck.length < 30) return "30장을 모두 채울 경우 분석할 수 있습니다다";

	let totalCost = 0;
	let typeCount = { MINION: 0, SPELL: 0, WEAPON: 0 };
	let legendaryCount = 0;
	let low = 0, mid = 0, high = 0;

	deck.forEach(card => {
		const cost = card.cost ?? 0;
		totalCost += cost;

		if (typeCount[card.type] !== undefined) typeCount[card.type]++;
		if (card.rarity === "LEGENDARY") legendaryCount++;

		if (cost <= 2) low++;
		else if (cost <= 5) mid++;
		else high++;
	});

	const avgCost = (totalCost / deck.length).toFixed(1);
	let analysis = `<strong>평균 마나 비용:</strong> ${avgCost}<br>`;
	analysis += `<strong>하수인:</strong> ${typeCount.MINION}, <strong>주문:</strong> ${typeCount.SPELL}, <strong>무기:</strong> ${typeCount.WEAPON}<br>`;
	analysis += `<strong>전설 카드 수:</strong> ${legendaryCount}장<br>`;
	analysis += `<strong>마나 구간 분포:</strong> 저(0~2): ${low}, 중(3~5): ${mid}, 고(6+): ${high}<br>`;

	// 비용/비율 조언
	if (avgCost >= 5) analysis += "평균 비용이 높아 후반 지향적입니다.<br>";
	if (low <= 5) analysis += "저비용 카드가 적어 초반 대응이 약할 수 있습니다.<br>";
	if (high >= 10) analysis += "고비용 카드가 많아 손패가 무거울 수 있습니다.<br>";
	if (typeCount.MINION < 10) analysis += "하수인이 적어 필드 장악이 어려울 수 있습니다.<br>";
	if (legendaryCount >= 5) analysis += "전설 카드가 많습니다.<br>";

	// 카드 종류별 조언
	if (typeCount.SPELL > typeCount.MINION * 1.5) {
		analysis += "주문 비중이 높아 콤보/제어 위주의 전략일 가능성이 있습니다.<br>";
	}
	if (typeCount.MINION >= 20) {
		analysis += "하수인이 많아 공격적인 템포 덱으로 구성되어 있습니다.<br>";
	}
	if (typeCount.WEAPON >= 3) {
		analysis += "무기 카드가 많아 전투 기반 전략을 지원합니다.<br>";
	}
	if ((typeCount.SPELL + typeCount.WEAPON) <= 4) {
		analysis += "주문과 무기가 부족해 하수인 외의 대응 수단이 적을 수 있습니다.<br>";
	}

	// 직업별 분석
	const nonNeutral = deck.find(c => c.cardClass !== "NEUTRAL");
	if (nonNeutral) {
		const job = nonNeutral.cardClass;
		analysis += `<strong>직업 분석:</strong> ${job}<br>`;
		const jobTips = {
			DRUID: "드루이드는 마나 가속과 대형 하수인을 중심으로 전개하는 덱이 많습니다.",
			HUNTER: "사냥꾼은 빠른 템포와 직접 피해로 상대를 압박하는 덱이 일반적입니다.",
			MAGE: "마법사는 강력한 주문과 광역기, 콤보 위주의 플레이가 많습니다.",
			PALADIN: "성기사는 버프와 강한 하수인 기반의 중속 덱이 많습니다.",
			PRIEST: "사제는 제어와 훔치기 중심의 운영이 특징입니다.",
			ROGUE: "도적은 콤보와 잠복, 치명적인 한 방 딜을 노리는 덱이 많습니다.",
			SHAMAN: "주술사는 진화, 토템, 다양한 혼합 전략이 존재합니다.",
			WARLOCK: "흑마법사는 자해와 카드 뽑기를 활용한 공격적인 덱 구성이 특징입니다.",
			WARRIOR: "전사는 방어력과 무기 활용, 느린 컨트롤 덱도 자주 사용됩니다.",
			DEMONHUNTER: "악마사냥꾼은 빠른 전개와 강한 하수인 기반 전투에 강합니다."
		};
		if (jobTips[job]) {
			analysis += jobTips[job] + "<br>";
		}
	}
	analysis += "최근 메타는 어둠의 선물과 연마 키워드를 가진 카드를 활용하는 것이 좋습니다!"
	return analysis;
}
document.getElementById("analyzeBtn").addEventListener("click", () => {
	const result = analyzeDeckSimple(deck);
	document.getElementById("analysisResult").innerHTML = result;
});