// ▼▼▼ この部分はビルド時にNetlifyの環境変数で置き換えられます ▼▼▼
const API_URL = '__API_URL__';
const SECRET_KEY = '__SECRET_KEY__';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


/**
 * =================================================================
 *  パスワード認証
 * =================================================================
 */
// ▼▼▼ 正しいパスワードをここに設定してください ▼▼▼
const CORRECT_PASSWORD = '2025'; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password-input');
const passwordSubmitBtn = document.getElementById('password-submit-btn');
const passwordError = document.getElementById('password-error');
const quizAppContainer = document.getElementById('quiz-app-container');

function checkPassword() {
    const enteredPassword = passwordInput.value;
    if (enteredPassword === CORRECT_PASSWORD) {
        // パスワードが正しければ、認証画面を非表示にし、クイズアプリを表示
        passwordContainer.style.display = 'none';
        quizAppContainer.style.display = 'flex'; // .containerはflexboxなのでflexを指定
        
        // クイズアプリの初期化処理を実行
        initializePage();
    } else {
        // パスワードが間違っていれば、エラーメッセージを表示
        passwordError.textContent = 'パスワードが違います。';
        passwordInput.value = ''; // 入力欄をクリア
        passwordInput.focus(); // 再度入力欄にフォーカス
    }
}

// 認証ボタンがクリックされた時の処理
passwordSubmitBtn.addEventListener('click', checkPassword);

// パスワード入力欄でEnterキーが押された時の処理
passwordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        checkPassword();
    }
});


/**
 * =================================================================
 *  HTML要素の取得 (クイズアプリ本体)
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
 *  関数の定義
 * =================================================================
 */

/**
 * APIからクイズデータを非同期で取得する関数
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

/**
 * クイズの初期化と開始を行う関数
 */
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    historyContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    showQuestion();
}

/**
 * 現在の問題と選択肢を画面に表示する関数
 */
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

/**
 * ユーザーの回答を判定し、次の問題へ進むボタンを表示する関数
 */
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

/**
 * 最終的なクイズの結果を画面に表示する関数
 */
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultGroupNameElement.textContent = currentGroupName;
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
}

/**
 * 解答一覧を生成して表示する関数
 */
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

/**
 * 解答一覧画面を画像として保存する関数
 */
async function saveReviewAsImage() {
    saveReviewImageButton.disabled = true;
    saveReviewImageButton.textContent = '画像生成中...';
    reviewList.style.maxHeight = 'none';
    reviewList.style.overflowY = 'visible';
    try {
        const canvas = await html2canvas(reviewContainer, { backgroundColor: '#ffffff', windowWidth: document.documentElement.offsetWidth, windowHeight: document.documentElement.offsetHeight, scrollX: -window.scrollX, scrollY: -window.scrollY, scale: 2 });
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

/**
 * 学習履歴を生成して表示する関数
 */
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

/**
 * スタート画面（カテゴリ選択画面）に戻る関数
 */
function showStartScreen() {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    historyContainer.style.display = 'none';
    startContainer.style.display = 'block';
}


/**
 * =================================================================
 *  イベントリスナーの設定 (クイズアプリ本体)
 * =================================================================
 */
startButton.addEventListener('click', () => {
    startContainer.style.display = 'none';
    const large = largeCategorySelect.value;
    const medium = mediumCategorySelect.value;
    const small = smallCategorySelect.value;
    const params = { large };
    if (medium && medium !== 'all') params.medium = medium;
    if (small && small !== 'all') params.small = small;
    let nameParts = [];
    if (large && large !== 'all') nameParts.push(largeCategorySelect.options[largeCategorySelect.selectedIndex].text);
    if (medium && medium !== 'all') nameParts.push(mediumCategorySelect.options[mediumCategorySelect.selectedIndex].text);
    if (small && small !== 'all') nameParts.push(smallCategorySelect.options[smallCategorySelect.selectedIndex].text);
    currentGroupName = nameParts.length > 0 ? nameParts.join(' > ') : 'すべての問題';
    fetchQuizData(params);
});

reviewButton.addEventListener('click', showReview);
backToStartButton.addEventListener('click', showStartScreen);
saveReviewImageButton.addEventListener('click', saveReviewAsImage);
restartButton.addEventListener('click', showStartScreen);
historyButton.addEventListener('click', showHistory);
backToStartFromHistoryButton.addEventListener('click', showStartScreen);

largeCategorySelect.addEventListener('change', (e) => {
    const selectedLarge = e.target.value;
    mediumCategorySelect.innerHTML = '';
    smallCategorySelect.innerHTML = '';
    mediumCategoryWrapper.style.display = 'none';
    smallCategoryWrapper.style.display = 'none';
    if (selectedLarge === 'all' || !categoryTree[selectedLarge]) { return; }
    const mediumCats = Object.keys(categoryTree[selectedLarge]);
    if (mediumCats.length > 0) {
        mediumCategorySelect.appendChild(new Option('すべての中分類', 'all'));
        mediumCats.forEach(medium => { mediumCategorySelect.appendChild(new Option(medium, medium)); });
        mediumCategoryWrapper.style.display = 'block';
    }
});

mediumCategorySelect.addEventListener('change', (e) => {
    const selectedLarge = largeCategorySelect.value;
    const selectedMedium = e.target.value;
    smallCategorySelect.innerHTML = '';
    smallCategoryWrapper.style.display = 'none';
    if (selectedMedium === 'all' || !categoryTree[selectedLarge] || !categoryTree[selectedLarge][selectedMedium]) { return; }
    const smallCats = categoryTree[selectedLarge][selectedMedium];
    if (smallCats.length > 0) {
        smallCategorySelect.appendChild(new Option('すべての小分類', 'all'));
        smallCats.forEach(small => { smallCategorySelect.appendChild(new Option(small, small)); });
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
        
        Object.keys(categoryTree).forEach(large => {
            largeCategorySelect.appendChild(new Option(large, large));
        });

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
    const large = params.get('large');
    const medium = params.get('medium');
    const small = params.get('small');

    if (large && medium && small) {
        startContainer.style.display = 'none';
        currentGroupName = `${large} > ${medium} > ${small}`;
        fetchQuizData({ large, medium, small });
    } else {
        initializeCategorySelector();
    }
}

// ページ読み込み時のメイン処理は、パスワード認証が成功した後に呼び出されるため、
// ここでの自動実行は不要です。
// initializePage();