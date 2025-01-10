document.addEventListener('DOMContentLoaded', function() {
    // 初始化按鈕綁定
    initializeQuiz();
    bindButtons();
    animateStats();
});

function initializeQuiz() {
    const startQuizBtn = document.getElementById('start-quiz');
    const quizContent = document.getElementById('quiz-content');
    const questionContainer = document.querySelector('.question-container');
    const optionsContainer = document.querySelector('.options-container');

    if (!startQuizBtn || !quizContent || !questionContainer || !optionsContainer) {
        console.error('Quiz elements not found:', {
            startQuizBtn: !!startQuizBtn,
            quizContent: !!quizContent,
            questionContainer: !!questionContainer,
            optionsContainer: !!optionsContainer
        });
        return;
    }

    startQuizBtn.addEventListener('click', function(e) {
        e.preventDefault();
        quizContent.classList.remove('hidden');
        this.style.display = 'none';
        showQuestion(0);
    });
}

function bindButtons() {
    // 塑膠減量計算按鈕
    document.querySelector('button:contains("計算環境效益")')?.addEventListener('click', calculatePlasticReduction);

    // 碳足跡計算按鈕
    document.querySelector('button:contains("計算碳足跡")')?.addEventListener('click', calculateTransportEmission);

    // 知識王開始按鈕
    document.querySelector('button:contains("開始測驗")')?.addEventListener('click', startQuiz);

    // 記憶遊戲開始按鈕
    document.querySelector('button:contains("開始遊戲")')?.addEventListener('click', startMemoryGame);

    // 修改產品詳情按鈕綁定方式
    document.querySelectorAll('.product-detail-btn').forEach(btn => {
        const productId = btn.dataset.product;
        btn.addEventListener('click', () => showProductDetails(productId));
    });

    // 綁定關閉模態框按鈕
    const closeModalBtn = document.querySelector('#close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }

    // 模態框點擊外部關閉
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }

    // 修改知識王開始按鈕綁定方式
    const quizButton = document.getElementById('start-quiz');
    if (quizButton) {
        quizButton.addEventListener('click', startQuiz);
    }
}

// 新增jQuery風格的選擇器輔助函數
function addjQuerySelectorSupport() {
    if (!document.querySelector.prototype?.contains) {
        // 擴展querySelector以支持jQuery風格的:contains選擇器
        const originalQuerySelector = Document.prototype.querySelector;
        Document.prototype.querySelector = function(selector) {
            if (selector.includes(':contains(')) {
                const match = selector.match(/:contains\("([^"]+)"\)/);
                if (match) {
                    const searchText = match[1];
                    const cleanSelector = selector.replace(/:contains\("([^"]+)"\)/, '');
                    const elements = this.querySelectorAll(cleanSelector || '*');
                    return Array.from(elements).find(el => 
                        el.textContent.includes(searchText)
                    );
                }
            }
            return originalQuerySelector.call(this, selector);
        };
    }
}

// 塑膠減量計算器
function calculatePlasticReduction() {
    const monthlyCount = parseFloat(document.getElementById('plastic-count').value);
    if (isNaN(monthlyCount) || monthlyCount < 0) {
        alert('請輸入有效的數字！');
        return;
    }

    const yearlyReduction = monthlyCount * 12;
    const weightReduction = yearlyReduction * 0.01; // 每個塑膠製品約10g
    const co2Reduction = weightReduction * 6; // 每公斤塑膠約產生6公斤CO2
    const waterSaved = weightReduction * 100; // 每公斤塑膠製造約需100公升水

    const resultElement = document.getElementById('calculation-result');
    resultElement.innerHTML = showCalculationResult({
        yearly: yearlyReduction.toFixed(0),
        weight: weightReduction.toFixed(2),
        co2: co2Reduction.toFixed(2),
        water: waterSaved.toFixed(2)
    });
    resultElement.classList.remove('hidden');
}

function showCalculationResult(result) {
    return `
        <div class="bg-green-50 p-4 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">
                您的環保貢獻 / Your Environmental Contribution
            </h4>
            <ul class="space-y-2">
                <li>
                    年度減少塑膠製品 / Annual plastic reduction: ${result.yearly} 個 pieces
                </li>
                <li>
                    減少塑膠垃圾 / Plastic waste reduced: ${result.weight} 公斤 kg
                </li>
                <li>
                    減少碳排放 / CO2 reduction: ${result.co2} 公斤 kg
                </li>
                <li>
                    節省用水 / Water saved: ${result.water} 公升 L
                </li>
            </ul>
        </div>
    `;
}

// 交通碳足跡計算器
function calculateTransportEmission() {
    const distance = parseFloat(document.getElementById('distance').value);
    const transportType = document.getElementById('transport-type').value;

    if (isNaN(distance) || distance < 0) {
        alert('請輸入有效的距離！');
        return;
    }

    // 發送請求到後端計算
    fetch('/api/calculate-emission', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            distance: distance,
            transportType: transportType
        })
    })
    .then(response => response.json())
    .then(data => {
        const resultElement = document.getElementById('transport-result');
        resultElement.innerHTML = `
            <div class="space-y-4">
                <h4 class="font-bold text-green-800">
                    您的通勤碳足跡分析
                    <span class="block text-sm">Your Commuting Carbon Footprint Analysis</span>
                </h4>
                <ul class="space-y-2">
                    <li class="flex flex-col text-green-700">
                        <span>每日碳排放(Daily Carbon Emissions)：${data.dailyEmission.toFixed(2)} kg CO2</span>
                    <li>每月碳排放(Monthly Carbon Emissions)：${data.monthlyEmission.toFixed(2)} kg CO2</li>
                    <li>每年碳排放(Yearly Carbon Emissions)：${data.yearlyEmission.toFixed(2)} kg CO2</li>
                    ${data.alternatives ? `
                    <li class="mt-4">
                        <p class="font-semibold">環保建議(Eco-Friendly Suggestions)：</p>
                        <p>${data.alternatives}</p>
                    </li>
                    ` : ''}
                </ul>
                <div class="relative pt-1">
                    <div class="mt-2">
                        <div class="relative w-full h-4 bg-gray-200 rounded">
                            <div class="absolute h-4 rounded bg-green-500" style="width: ${data.emissionScore}%"></div>
                        </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">環保指數(Eco-Friendly score)：${data.emissionScore}%</p>
                </div>
            </div>`;
        resultElement.classList.remove('hidden');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('計算時發生錯誤，請稍後再試！');
    });
}

// 數字動畫
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        let current = 0;
        const increment = target / 100;
        
        const updateCount = () => {
            if(current < target) {
                current += increment;
                stat.textContent = Math.ceil(current);
                requestAnimationFrame(updateCount);
            } else {
                stat.textContent = target;
            }
        };
        
        updateCount();
    });
}

// 環保知識題庫
const quizQuestions = [
    {
        question: "下列哪種物品的分解時間最長？\nWhich item takes the longest to decompose?",
        options: [
            "塑膠袋 / Plastic Bags",
            "鋁罐 / Aluminum Cans",
            "玻璃瓶 / Glass Bottles",
            "保麗龍 / Styrofoam"
        ],
        correct: 3,
        explanation: "保麗龍的分解時間可能超過500年。\nStyrofoam may take over 500 years to decompose."
    },
    {
        question: "哪種運輸方式的碳排放最低？\nWhich mode of transportation has the lowest carbon emissions?",
        options: ["機車 / Motorcycle", "腳踏車 / Bicycle", "公車 / Bus", "捷運 / MRT"],
        correct: 1,
        explanation: "腳踏車不需要燃料，是零碳排放的交通工具。\nBicycles do not require fuel and are zero-emission modes of transportation."
    },
    // 可以添加更多問題
];

// 開始測驗
function startQuiz() {
    const quizContent = document.getElementById('quiz-content');
    if (!quizContent) return;
    
    quizContent.classList.remove('hidden');
    const button = event.target;
    button.style.display = 'none';
    showQuestion(0);
}

// 顯示問題
function showQuestion(index) {
    const question = quizQuestions[index];
    const questionContainer = document.querySelector('.question-container');
    const optionsContainer = document.querySelector('.options-container');
    
    if (!questionContainer || !optionsContainer) {
        console.error('Quiz containers not found');
        return;
    }
    
    // 清空之前的內容
    questionContainer.innerHTML = '';
    optionsContainer.innerHTML = '';
    
    // 添加新問題
    const questionElement = document.createElement('p');
    questionElement.className = 'text-lg font-semibold mb-4';
    questionElement.textContent = question.question;
    questionContainer.appendChild(questionElement);
    
    // 添加選項
    question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.className = 'w-full text-left p-3 rounded border border-gray-300 hover:bg-gray-100 transition-colors duration-200 mb-2';
        button.textContent = option;
        button.onclick = () => checkAnswer(i, index);
        optionsContainer.appendChild(button);
    });
}

// 檢查答案
function checkAnswer(selectedIndex, questionIndex) {
    const question = quizQuestions[questionIndex];
    const optionsContainer = document.querySelector('.options-container');
    const buttons = optionsContainer.querySelectorAll('button');
    
    buttons.forEach((button, index) => {
        button.disabled = true;
        if (index === question.correct) {
            button.classList.add('bg-green-200', 'border-green-500');
        }
        if (index === selectedIndex && selectedIndex !== question.correct) {
            button.classList.add('bg-red-200', 'border-red-500');
        }
    });

    // 顯示解釋
    setTimeout(() => {
        optionsContainer.insertAdjacentHTML('afterend', `
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                <p class="text-blue-800">${question.explanation}</p>
                ${questionIndex < quizQuestions.length - 1 ? `
                    <button onclick="showQuestion(${questionIndex + 1})" 
                            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        下一題 / Next Question
                    </button>
                ` : `
                    <button onclick="finishQuiz()" 
                            class="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        完成測驗 / Finish Quiz
                    </button>
                `}
            </div>
        `);
    }, 1000);
}

// 環保記憶遊戲
const memoryGameIcons = [
    { 
        icon: 'fa-leaf', 
        name: '綠葉leaf',
        description: '象徵自然生態的重要性，提醒我們每一片葉子都在淨化空氣，維持地球生態平衡。一棵成年樹每年可以吸收23公斤二氧化碳。\nSymbolizing the importance of natural ecology, it reminds us that every leaf purifies the air and maintains the ecological balance of the Earth. A mature tree can absorb 23 kilograms of carbon dioxide per year.',
        color: 'text-emerald-600'
    },
    { 
        icon: 'fa-seedling', 
        name: '幼苗',
        description: '代表生命的開始和希望，提醒我們永續發展需要從小處做起。種下一棵樹苗，就是為未來種下希望。Representing the beginning of life and hope, it reminds us that sustainable development starts with small actions. Planting a sapling is planting hope for the future.',
        color: 'text-lime-600'
    },
    { 
        icon: 'fa-tree', 
        name: '大樹',
        description: '象徵碳匯的重要性，一棵大樹每年可以吸收21.77公斤的二氧化碳，相當於一台冷氣機運轉8小時的排放量。Symbolizing the importance of carbon sinks, a mature tree can absorb 21.77 kilograms of carbon dioxide per year, equivalent to the emissions of an air conditioner running for 8 hours.',
        color: 'text-green-700'
    },
    { 
        icon: 'fa-solar-panel', 
        name: '太陽能',
        description: '清潔能源的代表，太陽能每年可以減少大量的碳排放。一片太陽能板一年可以減少約1噸的二氧化碳排放。A symbol of clean energy, solar power can significantly reduce carbon emissions every year. One solar panel can reduce approximately 1 ton of carbon dioxide emissions annually.',
        color: 'text-yellow-600'
    },
    { 
        icon: 'fa-wind', 
        name: '風力',
        description: '風力發電是重要的再生能源，不會產生溫室氣體。一座風力發電機每年可以為約1000個家庭提供電力。Wind power is an important renewable energy source that does not produce greenhouse gases. A single wind turbine can provide electricity for approximately 1,000 households each year.',
        color: 'text-sky-600'
    },
    { 
        icon: 'fa-recycle', 
        name: '資源回收',
        description: '資源回收可以減少垃圾量，節省原物料開採。回收一個寶特瓶可以節省約85%的能源製造新瓶。Recycling helps reduce waste and conserve raw materials. Recycling a plastic bottle can save about 85% of the energy required to make a new bottle.',
        color: 'text-teal-600'
    },
    { 
        icon: 'fa-bicycle', 
        name: '自行車',
        description: '零碳排放的交通工具，適合短程代步。騎自行車每公里可以減少約250克的碳排放，同時還能促進健康。A zero-emission mode of transportation, ideal for short-distance commuting. Riding a bicycle can reduce about 250 grams of carbon emissions per kilometer, while also promoting health.',
        color: 'text-indigo-600'
    },
    { 
        icon: 'fa-water', 
        name: '節水',
        description: '珍惜水資源，減少水資源浪費。一個水龍頭每分鐘流失6-8公升水，修復漏水能大幅節省用水。Conserve water resources and reduce waste. A leaking faucet can waste 6-8 liters of water per minute. Fixing leaks can significantly save water.',
        color: 'text-blue-600'
    }
];

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameTimer;
let gameStartTime;

function startMemoryGame() {
    const container = document.querySelector('.memory-game-container');
    const cardsGrid = container.querySelector('.grid');
    container.classList.remove('hidden');
    moves = 0;
    matchedPairs = 0;
    updateMovesText();
    
    // 創建卡片對
    const cards = [...memoryGameIcons, ...memoryGameIcons]
        .sort(() => Math.random() - 0.5)
        .map((item, index) => createCard(item, index));
    
    cardsGrid.innerHTML = cards.join('');
    
    // 開始計時
    gameStartTime = Date.now();
    startGameTimer();
    
    // 綁定卡片點擊事件
    document.querySelectorAll('.memory-card').forEach(card => {
        card.addEventListener('click', () => flipCard(card));
    });
    
    // 隱藏開始按鈕
    event.target.style.display = 'none';
}

function createCard(item, index) {
    return `
        <div class="memory-card bg-white border-2 border-purple-200 rounded-lg cursor-pointer h-24 flex items-center justify-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg'
             data-index="${index}" 
             data-value="${item.name}"
             data-description="${item.description}">
            <div class="card-inner w-full h-full relative transform-style-preserve-3d transition-transform duration-500">
                <div class="front absolute w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                    <i class="fas fa-question text-purple-400 text-3xl"></i>
                </div>
                <div class="back absolute w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                    <i class="fas ${item.icon} ${item.color} text-3xl transform hover:scale-110 transition-transform"></i>
                </div>
            </div>
        </div>
    `;
}

function flipCard(card) {
    if (flippedCards.length === 2 || card.classList.contains('matched')) return;
    
    card.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moves++;
        updateMovesText();
        
        if (flippedCards[0].dataset.value === flippedCards[1].dataset.value) {
            matchedPairs++;
            const iconName = flippedCards[0].dataset.value;
            const iconDescription = flippedCards[0].dataset.description;
            
            flippedCards.forEach(card => {
                card.classList.add('matched');
                const backside = card.querySelector('.back');
                backside.classList.add('bg-green-100');
                backside.querySelector('i').classList.add('text-green-600');
            });
            
            // 顯示配對成功訊息
            showMatchMessage(iconName, iconDescription);
            checkGameComplete();
        } else {
            setTimeout(() => {
                flippedCards.forEach(card => {
                    card.querySelector('.card-inner').style.transform = '';
                    card.classList.remove('flipped');
                });
            }, 1000);
        }
        
        flippedCards = [];
    }
}

function showMatchMessage(iconName, description) {
    const message = document.createElement('div');
    message.className = 'fixed bottom-8 right-8 z-50 animate-slide-up';
    message.innerHTML = `
        <div class="bg-white shadow-lg p-6 rounded-2xl max-w-md">
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <i class="fas fa-leaf text-green-600 text-2xl"></i>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-green-800 mb-2">
                        ${iconName}
                        <span class="block text-green-600 text-sm mt-1">配對成功！/ Match Success!</span>
                    </h3>
                    <div class="mt-2 p-3 bg-green-50 rounded-lg">
                        <p class="text-gray-700 text-sm leading-relaxed">${description}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideDown 0.5s ease-out, fadeOut 0.5s ease-out';
        setTimeout(() => message.remove(), 500);
    }, 5000); // 增加顯示時間到5秒，讓用戶有足夠時間閱讀
}

function updateMovesText() {
    document.getElementById('moves-count').textContent = moves;
}

function startGameTimer() {
    const timeElement = document.getElementById('time');
    gameTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timeElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function checkGameComplete() {
    if (matchedPairs === memoryGameIcons.length) {
        clearInterval(gameTimer);
        const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
        showAchievement(`恭喜完成！用時${timeSpent}秒，共${moves}次嘗試`);
    }
}

function showAchievement(text) {
    const popup = document.getElementById('achievement-popup');
    document.getElementById('achievement-text').textContent = text;
    popup.classList.remove('translate-y-full', 'opacity-0');
    
    setTimeout(() => {
        popup.classList.add('translate-y-full', 'opacity-0');
    }, 3000);
}

// 修改showProductDetails函數
function showProductDetails(productId) {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-details-content');
    
    if (!modal || !content || !productDetails[productId]) {
        console.error('無法顯示產品詳情');
        return;
    }

    const product = productDetails[productId];
    content.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">${product.title}</h2>
        ${product.description}
    `;
    modal.classList.remove('hidden');
}

// 修改closeProductModal函數
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 在初始化時添加jQuery風格選擇器支持
addjQuerySelectorSupport();

const productDetails = {
    'organic-cotton': {
        title: '有機棉製品Organic Cotton Products',
        description: `
            <div class="space-y-6">
                <div>
                    <h3 class="text-xl font-bold mb-3">產品特點(Product Features)</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-600">
                        <li>100% 有機認證棉花製成，無農藥殘留(Made from 100% organically certified cotton, free from pesticide residues)</li>
                        <li>採用環保染劑，無化學污染(Uses eco-friendly dyes, free from chemical pollution.)</li>
                        <li>可生物降解包裝，減少環境負擔(Biodegradable packaging reduces environmental impact.)</li>
                        <li>生產過程節水70%，減少水資源浪費(The production process saves 70% of water, reducing water waste.)</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-3">環境效益(Environmental Benefits)</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-600">
                        <li>相比傳統棉製品減少90%用水量(Uses 90% less water compared to traditional cotton products)</li>
                        <li>生產過程減少62%碳排放(Reduces carbon emissions by 62% during the production process.)</li>
                        <li>零農藥污染，保護土壤和水源(Zero pesticide pollution, protecting soil and water resources.)</li>
                        <li>可完全生物降解，不會產生微塑料污染(Fully biodegradable, without generating microplastic pollution.)</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-3">使用建議</h3>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <ul class="list-disc list-inside space-y-2 text-green-700">
                            <li>建議使用中性清潔劑手洗，水溫不超過30度(Hand wash with neutral detergent, water temperature not exceeding 30°C.)</li>
                            <li>自然陰乾，避免曝曬，可延長使用壽命(Air dry in the shade, avoid direct sunlight, to extend the product's lifespan.)</li>
                            <li>建議定期更換，舊品可做回收再製(Regular replacement is recommended. Old items can be recycled and remade.)</li>
                        </ul>
                    </div>
                </div>
                <div class="border-t pt-6">
                    <h3 class="text-xl font-bold mb-3">環保認證(Environmental Certification)</h3>
                    <div class="flex items-center space-x-4">
                        <img src="/static/images/cert1.jpg" class="h-16 rounded" alt="GOTS認證">
                        <div class="text-gray-600">
                            <p class="font-semibold">全球有機紡織品標準認證 (GOTS)</p>
                            <p>確保從原料到成品的全程有機標準(Ensures organic standards throughout the entire process, from raw materials to finished products.)</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    'bamboo-utensils': {
        title: '竹製餐具組Bamboo Cutlery Set',
        description: `
            <div class="space-y-6">
                <div>
                    <h3 class="text-xl font-bold mb-3">產品特點(Product Features)</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-600">
                        <li>天然抗菌，安全衛生(Natural antibacterial, safe and hygienic.)</li>
                        <li>輕巧耐用，適合隨身攜帶(Lightweight and durable, perfect for carrying on the go.)</li>
                        <li>完全可生物降解，零環境負擔(Fully biodegradable, with zero environmental impact.)</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-3">環境效益(Environmental Benefits)</h3>
                    <ul class="list-disc list-inside space-y-2 text-gray-600">
                        <li>取代一次性塑膠餐具(Replace single-use plastic cutlery)</li>
                        <li>竹子生長快速，3-5年可收成，極具永續性(Bamboo grows quickly and can be harvested in 3-5 years, making it highly sustainable.)</li>
                        <li>竹林可吸收大量二氧化碳，有助減緩溫室效應(Bamboo forests absorb large amounts of carbon dioxide, helping to mitigate the greenhouse effect.)</li>
                        <li>自然分解，不會造成土壤和海洋污染(Naturally decomposes, causing no soil or ocean pollution.)</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-3">使用與保養指南(Usage and Care Instructions)</h3>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <ul class="list-disc list-inside space-y-2 text-green-700">
                            <li>使用後立即清洗，避免長期浸泡(Clean immediately after use, avoid prolonged soaking.)</li>
                            <li>自然風乾，避免陽光直射(Air dry naturally, avoid direct sunlight.)</li>
                        </ul>
                    </div>
                </div>
                <div class="border-t pt-6">
                    <h3 class="text-xl font-bold mb-3">環保認證(Environmental Certification)</h3>
                    <div class="flex items-center space-x-4">
                        <img src="/static/images/cert2.jpg" class="h-16 rounded" alt="FSC認證">
                        <div class="text-gray-600">
                            <p class="font-semibold">森林管理委員會認證 (FSC)</p>
                            <p>確保原材料來自永續經營的竹林(Ensure that raw materials come from sustainably managed bamboo forests.)</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};