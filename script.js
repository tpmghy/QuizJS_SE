// ▼▼▼ この部分はビルド時にNetlifyの環境変数で置き換えられます ▼▼▼
const API_URL = '__API_URL__';
const SECRET_KEY = '__SECRET_KEY__';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
 *  パスワード認証
 * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
 */
const CORRECT_PASSWORD = 'your_password_here'; 
const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password-input');
const passwordSubmitBtn = document.getElementById('password-submit-btn');
const passwordError = document.getElementById('password-error');
const quizAppContainer = document.getElementById('quiz-app-container');
function checkPassword() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        passwordContainer.style.display = 'none';
        quizAppContainer.style.display = 'flex';
        initializePage();
    } else {
        passwordError.textContent = 'パスワードが違います。';
        passwordInput.value = '';
        passwordInput.focus();
    }
}
passwordSubmitBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') checkPassword();
});

/**
 * =================================================================
 *  HTML要素の取得
 * =================================================================
 */
// --- スタート画面 ---
const startContainer = document.getElementById('start-container');
const startButton = document.getElementById('start-btn');
const historyButton = document.getElementById('history-btn');
const largeCategorySelect = document.getElementById('group-large-select');
const mediumCategorySelect = document.getElementById('group-medium-select');
const smallCategorySelect = document.getElementById('group-small-select');
const mediumCategoryWrapper = document.getElementById('medium-category-wrapper');
const smallCategoryWrapper = document.getElementById('small-category-wrapper');
const progressButton = document.getElementById('progress-btn');
// --- 進捗管理画面 ---
const progressContainer = document.getElementById('progress-container');
const progressList = document.getElementById('progress-list');
const backToStartFromProgressButton = document.getElementById('back-to-start-from-progress-btn');
// --- 動画学習画面 ---
const videoContainer = document.getElementById('video-container');
const videoTitle = document.getElementById('video-title');
const youtubePlayer = document.getElementById('youtube-player');
const proceedToQuizButton = document.getElementById('proceed-to-quiz-btn');
const backToStartFromVideoButton = document.getElementById('back-to-start-from-video-btn');
// --- クイズ画面 ---
const quizContainer = document.getElementById('quiz-container');
const questionElement = document.getElementById('question');
const choiceButtons = document.querySelectorAll('.choice-btn');
const feedbackElement = document.getElementById('feedback');
const currentGroupElement = document.getElementById('current-group');
// --- 結果画面 ---
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const resultGroupNameElement = document.getElementById('result-group-name');
const reviewButton = document.getElementById('review-btn');
const backToStartButton = document.getElementById('back-to-start-btn');
// --- 解答一覧画面 ---
const reviewContainer = document.getElementById('review-container');
const reviewList = document.getElementById('review-list');
const restartButton = document.getElementById('restart-btn');
const reviewGroupNameElement = document.getElementById('review-group-name');
const saveReviewImageButton = document.getElementById('save-review-image-btn');
// --- 学習履歴画面 ---
const historyContainer = document.getElementById('history-container');
const historyList = document.getElementById('history-list');
const backToStartFromHistoryButton = document.getElementById('back-to-start-from-history-btn');

/**
 * =================================================================
 *  ゲームの状態を管理する変数
 * =================================================================
 */
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let currentGroupName = '';
let userAnswers = [];
let categoryTree = {};

/**
 * =================================================================
 *  ヘルパー関数の定義 (localStorage操作)
 * =================================================================
 */
function getProgressData() {
    return JSON.parse(localStorage.getItem('quizProgress')) || {};
}
function updateProgressData(smallCode, dataToUpdate) {
    if (!smallCode || smallCode === 'all') return;
    try {
        const progressData = getProgressData();
        if (!progressData[smallCode]) {
            progressData[smallCode] = { videoViews: 0, correct: 0, total: 0 };
        }
        if (dataToUpdate.video) {
            progressData[smallCode].videoViews++;
        }
        if (dataToUpdate.score !== undefined) {
            progressData[smallCode].correct = dataToUpdate.score;
        }
        if (dataToUpdate.total !== undefined) {
            progressData[smallCode].total = dataToUpdate.total;
        }
        localStorage.setItem('quizProgress', JSON.stringify(progressData));
    } catch (e) {
        console.error('進捗データの保存に失敗しました:', e);
    }
}

/**
 * =================================================================
 *  メインの関数定義
 * =================================================================
 */
async function fetchQuizData(params) {
    quizContainer.style.display = 'block';
    questionElement.textContent = 'クイズを読み込み中...';
    feedbackElement.textContent = '';
    try {
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}?key=${SECRET_KEY}&${query}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`APIエラー: ${response.status}`);
        quizData = await response.json();
        if (quizData.error) throw new Error(quizData.message);
        if (quizData.length === 0) throw new Error('該当する問題がありませんでした。');
        startQuiz();
    } catch (error) {
        console.error('クイズデータの取得に失敗しました:', error);
        questionElement.textContent = `クイズの読み込みに失敗しました: ${error.message}`;
    }
}
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startContainer.style.display = 'none';
    videoContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    historyContainer.style.display = 'none';
    progressContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    showQuestion();
}
function showQuestion() {
    currentGroupElement.textContent = `カテゴリ: ${currentGroupName}`;
    const currentQuestion = quizData[currentQuestionIndex];
    questionElement.textContent = `第${currentQuestionIndex + 1}問: ${currentQuestion.question}`;
    feedbackElement.innerHTML = '';
    feedbackElement.style.backgroundColor = 'transparent';
    choiceButtons.forEach((button, index) => {
        button.textContent = currentQuestion.choices[index];
        button.onclick = () => checkAnswer(index);
        button.disabled = false;
        button.style.backgroundColor = '';
        button.style.borderColor = '#ddd';
    });
}
function checkAnswer(selectedIndex) {
    choiceButtons.forEach(button => button.disabled = true);
    const currentQuestion = quizData[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.answerIndex;
    userAnswers.push({
        question: currentQuestion.question,
        userChoice: currentQuestion.choices[selectedIndex],
        correctAnswer: currentQuestion.choices[currentQuestion.answerIndex],
        isCorrect: isCorrect
    });
    try {
        const historyData = JSON.parse(localStorage.getItem('quizHistory')) || {};
        const questionId = currentQuestion.id;
        if (!historyData[questionId]) {
            historyData[questionId] = { question: currentQuestion.question, correct: 0, incorrect: 0 };
        }
        if (isCorrect) {
            historyData[questionId].correct++;
        } else {
            historyData[questionId].incorrect++;
        }
        localStorage.setItem('quizHistory', JSON.stringify(historyData));
    } catch (e) { console.error('学習履歴の保存に失敗しました:', e); }
    const feedbackText = document.createElement('p');
    if (isCorrect) {
        score++;
        feedbackText.innerHTML = `正解！🎉<br>解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#e6ffed';
        choiceButtons[selectedIndex].style.borderColor = '#28a745';
    } else {
        const correctAnswerText = currentQuestion.choices[currentQuestion.answerIndex];
        feedbackText.innerHTML = `不正解...😢 正解は「${correctAnswerText}」<br>解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#ffebee';
        choiceButtons[selectedIndex].style.borderColor = '#dc3545';
        choiceButtons[currentQuestion.answerIndex].style.backgroundColor = '#d1e7dd';
    }
    feedbackElement.innerHTML = '';
    feedbackElement.appendChild(feedbackText);
    const nextButton = document.createElement('button');
    nextButton.className = 'next-btn';
    const isLastQuestion = currentQuestionIndex === quizData.length - 1;
    nextButton.textContent = isLastQuestion ? '結果を見る' : '次の問題へ';
    nextButton.addEventListener('click', () => {
        if (isLastQuestion) { showResult(); } else { currentQuestionIndex++; showQuestion(); }
    });
    feedbackElement.appendChild(nextButton);
}
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultGroupNameElement.textContent = currentGroupName;
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
    const smallCode = smallCategorySelect.value;
    updateProgressData(smallCode, { score: score, total: quizData.length });
}
function showReview() {
    resultContainer.style.display = 'none';
    reviewContainer.style.display = 'block';
    reviewGroupNameElement.textContent = currentGroupName;
    reviewList.innerHTML = '';
    userAnswers.forEach((answer, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        const resultMark = answer.isCorrect ? '<span class="mark correct">正解 ✓</span>' : '<span class="mark incorrect">不正解 ✗</span>';
        let answerHTML = `<p class="review-question">Q${index + 1}. ${answer.question} ${resultMark}</p><p class="review-user-answer">あなたの回答: ${answer.userChoice}</p>`;
        if (!answer.isCorrect) { answerHTML += `<p class="review-correct-answer">正解: ${answer.correctAnswer}</p>`; }
        reviewItem.innerHTML = answerHTML;
        reviewList.appendChild(reviewItem);
    });
}
async function saveReviewAsImage() {
    saveReviewImageButton.disabled = true;
    saveReviewImageButton.textContent = '画像生成中...';
    reviewList.style.maxHeight = 'none';
    reviewList.style.overflowY = 'visible';
    try {
        const canvas = await html2canvas(reviewContainer, { backgroundColor: '#ffffff', scale: 2 });
        const imageUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        downloadLink.download = `quiz_review_${formattedDate}.png`;
        downloadLink.href = imageUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) { console.error('画像の生成に失敗しました:', error); alert('画像の保存に失敗しました。'); }
    finally {
        reviewList.style.maxHeight = '400px';
        reviewList.style.overflowY = 'auto';
        saveReviewImageButton.disabled = false;
        saveReviewImageButton.textContent = '解答を画像で保存';
    }
}
function showHistory() {
    startContainer.style.display = 'none';
    historyContainer.style.display = 'block';
    historyList.innerHTML = '';
    const historyData = JSON.parse(localStorage.getItem('quizHistory')) || {};
    const questionIds = Object.keys(historyData);
    if (questionIds.length === 0) { historyList.innerHTML = '<p>まだ学習履歴はありません。</p>'; return; }
    questionIds.forEach(id => {
        const record = historyData[id];
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        let historyHTML = `<p class="history-question">${record.question}</p><div class="history-stats"><span class="history-correct">正解: ${record.correct}回</span><span class="history-incorrect">不正解: ${record.incorrect}回</span></div>`;
        historyItem.innerHTML = historyHTML;
        historyList.appendChild(historyItem);
    });
}
function showStartScreen() {
    startContainer.style.display = 'block';
    videoContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    historyContainer.style.display = 'none';
    progressContainer.style.display = 'none';
    youtubePlayer.src = '';
}
function handleStartButtonClick() {
    const largeCode = largeCategorySelect.value;
    const mediumCode = mediumCategorySelect.value;
    const smallCode = smallCategorySelect.value;
    let nameParts = [];
    let videoId = null;
    if (largeCode && largeCode !== 'all') {
        nameParts.push(categoryTree[largeCode].name);
        if (mediumCode && mediumCode !== 'all') {
            nameParts.push(categoryTree[largeCode].children[mediumCode].name);
            if (smallCode && smallCode !== 'all') {
                const smallCatData = categoryTree[largeCode].children[mediumCode].children[smallCode];
                nameParts.push(smallCatData.name);
                videoId = smallCatData.videoId;
            }
        }
    }
    currentGroupName = nameParts.length > 0 ? nameParts.join(' > ') : 'すべての問題';
    const params = { l: largeCode };
    if (mediumCode && mediumCode !== 'all') params.m = mediumCode;
    if (smallCode && smallCode !== 'all') params.s = smallCode;
    startContainer.style.display = 'none';
    if (videoId) {
        showVideoScreen(videoId, params);
        updateProgressData(smallCode, { video: true });
    } else {
        fetchQuizData(params);
    }
}
function showVideoScreen(videoId, quizParams) {
    videoTitle.textContent = `学習動画: ${currentGroupName}`;
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}`;
    videoContainer.style.display = 'block';
    const newButton = proceedToQuizButton.cloneNode(true);
    proceedToQuizButton.parentNode.replaceChild(newButton, proceedToQuizButton);
    newButton.addEventListener('click', () => {
        videoContainer.style.display = 'none';
        youtubePlayer.src = '';
        fetchQuizData(quizParams);
    });
}
function showProgress() {
    startContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    progressList.innerHTML = '';
    const progressData = getProgressData();
    for (const largeCode in categoryTree) {
        const largeCat = categoryTree[largeCode];
        const largeHeader = document.createElement('h3');
        largeHeader.className = 'progress-large-cat';
        largeHeader.textContent = largeCat.name;
        progressList.appendChild(largeHeader);
        for (const mediumCode in largeCat.children) {
            const mediumCat = largeCat.children[mediumCode];
            const mediumHeader = document.createElement('h4');
            mediumHeader.className = 'progress-medium-cat';
            mediumHeader.textContent = mediumCat.name;
            progressList.appendChild(mediumHeader);
            for (const smallCode in mediumCat.children) {
                const smallCat = mediumCat.children[smallCode];
                const record = progressData[smallCode] || { videoViews: 0, correct: 0, total: 0 };
                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                const scoreText = record.total > 0 ? `${record.correct} / ${record.total}` : '未挑戦';
                const scoreClass = record.total > 0 && record.correct === record.total ? 'perfect' : '';
                progressItem.innerHTML = `
                    <p class="progress-small-cat">${smallCat.name}</p>
                    <div class="progress-stats">
                        <span class="progress-video-views">視聴回数: ${record.videoViews}</span>
                        <span class="progress-score ${scoreClass}">クイズ: ${scoreText}</span>
                    </div>
                `;
                progressList.appendChild(progressItem);
            }
        }
    }
}

/**
 * =================================================================
 *  イベントリスナーの設定
 * =================================================================
 */
startButton.addEventListener('click', handleStartButtonClick);
reviewButton.addEventListener('click', showReview);
backToStartButton.addEventListener('click', showStartScreen);
saveReviewImageButton.addEventListener('click', saveReviewAsImage);
restartButton.addEventListener('click', showStartScreen);
historyButton.addEventListener('click', showHistory);
backToStartFromHistoryButton.addEventListener('click', showStartScreen);
backToStartFromVideoButton.addEventListener('click', showStartScreen);
progressButton.addEventListener('click', showProgress);
backToStartFromProgressButton.addEventListener('click', showStartScreen);
largeCategorySelect.addEventListener('change', (e) => {
    const selectedLargeCode = e.target.value;
    mediumCategorySelect.innerHTML = '';
    smallCategorySelect.innerHTML = '';
    mediumCategoryWrapper.style.display = 'none';
    smallCategoryWrapper.style.display = 'none';
    if (selectedLargeCode === 'all' || !categoryTree[selectedLargeCode]) return;
    const mediumCats = categoryTree[selectedLargeCode].children;
    if (Object.keys(mediumCats).length > 0) {
        mediumCategorySelect.appendChild(new Option('すべての中分類', 'all'));
        for (const mediumCode in mediumCats) {
            mediumCategorySelect.appendChild(new Option(mediumCats[mediumCode].name, mediumCode));
        }
        mediumCategoryWrapper.style.display = 'block';
    }
});
mediumCategorySelect.addEventListener('change', (e) => {
    const selectedLargeCode = largeCategorySelect.value;
    const selectedMediumCode = e.target.value;
    smallCategorySelect.innerHTML = '';
    smallCategoryWrapper.style.display = 'none';
    if (selectedMediumCode === 'all' || !categoryTree[selectedLargeCode] || !categoryTree[selectedLargeCode].children[selectedMediumCode]) return;
    const smallCats = categoryTree[selectedLargeCode].children[selectedMediumCode].children;
    if (Object.keys(smallCats).length > 0) {
        smallCategorySelect.appendChild(new Option('すべての小分類', 'all'));
        for (const smallCode in smallCats) {
            smallCategorySelect.appendChild(new Option(smallCats[smallCode].name, smallCode));
        }
        smallCategoryWrapper.style.display = 'block';
    }
});

/**
 * =================================================================
 *  初期化処理
 * =================================================================
 */
async function initializeCategorySelector() {
    largeCategorySelect.disabled = true;
    startButton.disabled = true;
    const loadingOption = new Option('カテゴリを読み込み中...', '', true, true);
    largeCategorySelect.add(loadingOption, 1);
    try {
        const url = `${API_URL}?key=${SECRET_KEY}&action=get_category_tree`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('カテゴリの取得に失敗しました');
        categoryTree = await response.json();
        largeCategorySelect.removeChild(loadingOption);
        for (const largeCode in categoryTree) {
            largeCategorySelect.appendChild(new Option(categoryTree[largeCode].name, largeCode));
        }
    } catch (error) {
        console.error(error);
        loadingOption.textContent = '読み込みに失敗';
    } finally {
        largeCategorySelect.disabled = false;
        startButton.disabled = false;
    }
}
function initializePage() {
    const params = new URLSearchParams(window.location.search);
    const l = params.get('l');
    const m = params.get('m');
    const s = params.get('s');
    if (l && m && s) {
        startContainer.style.display = 'none';
        const tempUrl = `${API_URL}?key=${SECRET_KEY}&action=get_category_tree`;
        fetch(tempUrl).then(res => res.json()).then(tree => {
            categoryTree = tree;
            if (tree[l] && tree[l].children[m] && tree[l].children[m].children[s]) {
                const nameL = tree[l].name;
                const nameM = tree[l].children[m].name;
                const nameS = tree[l].children[m].children[s].name;
                currentGroupName = `${nameL} > ${nameM} > ${nameS}`;
                const videoId = tree[l].children[m].children[s].videoId;
                if (videoId) {
                    showVideoScreen(videoId, { l, m, s });
                    updateProgressData(s, { video: true });
                } else {
                    fetchQuizData({ l, m, s });
                }
            }
        });
    } else {
        initializeCategorySelector();
    }
}
// パスワード認証成功後にinitializePageが呼ばれる