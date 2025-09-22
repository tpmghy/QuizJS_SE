// ▼▼▼ この部分はビルド時にNetlifyの環境変数で置き換えられます ▼▼▼
const API_URL = '__API_URL__';
const SECRET_KEY = '__SECRET_KEY__';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * =================================================================
 *  HTML要素の取得
 * =================================================================
 */
// --- スタート画面 ---
const startContainer = document.getElementById('start-container');
const groupSelect = document.getElementById('group-select');
const startButton = document.getElementById('start-btn');

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


/**
 * =================================================================
 *  関数の定義
 * =================================================================
 */

/**
 * APIからクイズデータを非同期で取得する関数
 */
async function fetchQuizData(group) {
    quizContainer.style.display = 'block';
    questionElement.textContent = 'クイズを読み込み中...';
    feedbackElement.textContent = '';
    
    try {
        let url = `${API_URL}?key=${SECRET_KEY}`;
        if (group !== 'all') {
            url += `&group=${encodeURIComponent(group)}`;
        }
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
    feedbackElement.innerHTML = ''; // innerHTMLにすることで、ボタンも確実に消去
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

    // ▼▼▼ ここからが大きな変更点 ▼▼▼

    // フィードバックのテキスト部分を作成
    const feedbackText = document.createElement('p');
    if (isCorrect) {
        score++;
        feedbackText.innerHTML = `正解！🎉<br>解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#e6ffed';
        choiceButtons[selectedIndex].style.borderColor = '#28a745';
    } 
    else {
        const correctAnswerText = currentQuestion.choices[currentQuestion.answerIndex];
        feedbackText.innerHTML = `不正解...😢 正解は「${correctAnswerText}」<br>解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#ffebee';
        choiceButtons[selectedIndex].style.borderColor = '#dc3545';
        choiceButtons[currentQuestion.answerIndex].style.backgroundColor = '#d1e7dd';
    }

    // まずテキストをフィードバックエリアに追加
    feedbackElement.innerHTML = ''; // 中身を一旦空にする
    feedbackElement.appendChild(feedbackText);

    // 「次に進む」ボタンを作成
    const nextButton = document.createElement('button');
    nextButton.className = 'next-btn';

    // これが最後の問題かどうかを判定
    const isLastQuestion = currentQuestionIndex === quizData.length - 1;
    nextButton.textContent = isLastQuestion ? '結果を見る' : '次の問題へ';

    // ボタンがクリックされた時の処理を定義
    nextButton.addEventListener('click', () => {
        if (isLastQuestion) {
            showResult(); // 最後の問題なら結果表示
        } else {
            currentQuestionIndex++;
            showQuestion(); // そうでなければ次の問題へ
        }
    });

    // 作成したボタンをフィードバックエリアに追加
    feedbackElement.appendChild(nextButton);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
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
        let answerHTML = `
            <p class="review-question">Q${index + 1}. ${answer.question} ${resultMark}</p>
            <p class="review-user-answer">あなたの回答: ${answer.userChoice}</p>
        `;
        if (!answer.isCorrect) {
            answerHTML += `<p class="review-correct-answer">正解: ${answer.correctAnswer}</p>`;
        }
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
    try {
        const canvas = await html2canvas(reviewContainer, {
            backgroundColor: '#ffffff',
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            scale: 2
        });
        const imageUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        downloadLink.download = `quiz_review_${formattedDate}.png`;
        downloadLink.href = imageUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('画像の生成に失敗しました:', error);
        alert('画像の保存に失敗しました。');
    } finally {
        saveReviewImageButton.disabled = false;
        saveReviewImageButton.textContent = '解答を画像で保存';
    }
}

/**
 * スタート画面（カテゴリ選択画面）に戻る関数
 */
function showStartScreen() {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    startContainer.style.display = 'block';
}

/**
 * =================================================================
 *  イベントリスナーの設定
 * =================================================================
 */
startButton.addEventListener('click', () => {
    startContainer.style.display = 'none';
    const selectedGroupValue = groupSelect.value;
    currentGroupName = groupSelect.options[groupSelect.selectedIndex].text;
    fetchQuizData(selectedGroupValue);
});
reviewButton.addEventListener('click', showReview);
backToStartButton.addEventListener('click', showStartScreen);
saveReviewImageButton.addEventListener('click', saveReviewAsImage);
restartButton.addEventListener('click', showStartScreen);

/**
 * =================================================================
 *  初期化処理
 * =================================================================
 */
async function initializePage() {
    groupSelect.disabled = true;
    startButton.disabled = true;
    const loadingOption = new Option('カテゴリを読み込み中...', '', true, true);
    loadingOption.disabled = true;
    groupSelect.appendChild(loadingOption);
    try {
        const url = `${API_URL}?key=${SECRET_KEY}&action=get_groups`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('カテゴリの取得に失敗しました');
        const groups = await response.json();
        groupSelect.removeChild(loadingOption);
        groups.forEach(group => {
            const option = new Option(group, group);
            groupSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        loadingOption.textContent = '読み込みに失敗';
    } finally {
        groupSelect.disabled = false;
        startButton.disabled = false;
    }
}

// ページの読み込みが始まったら、この初期化処理を一番最初に実行する
initializePage();