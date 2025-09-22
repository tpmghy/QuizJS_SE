// ▼▼▼ この部分はビルド時にNetlifyの環境変数で置き換えられます ▼▼▼
const API_URL = '__API_URL__';
const SECRET_KEY = '__SECRET_KEY__';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * =================================================================
 *  HTML要素の取得
 * =================================================================
 */
// --- スタート画面の要素 ---
const startContainer = document.getElementById('start-container');
const groupSelect = document.getElementById('group-select');
const startButton = document.getElementById('start-btn');

// --- クイズ画面の要素 ---
const quizContainer = document.getElementById('quiz-container');
const questionElement = document.getElementById('question');
const choiceButtons = document.querySelectorAll('.choice-btn');
const feedbackElement = document.getElementById('feedback');
const currentGroupElement = document.getElementById('current-group'); // ▼▼▼ 追加 ▼▼▼

// --- 結果画面の要素 ---
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const retryButton = document.getElementById('retry-btn');
const resultGroupNameElement = document.getElementById('result-group-name'); // ▼▼▼ 追加 ▼▼▼


/**
 * =================================================================
 *  ゲームの状態を管理する変数
 * =================================================================
 */
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let currentGroupName = ''; // ▼▼▼ 現在のグループ名を保存する変数を追加 ▼▼▼


/**
 * =================================================================
 *  関数の定義
 * =================================================================
 */

/**
 * APIからクイズデータを非同期で取得する関数
 * @param {string} group - ユーザーが選択したグループ名 ('all' は全問題)
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
    
    startContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'block';

    showQuestion();
}

/**
 * 現在の問題と選択肢を画面に表示する関数
 */
function showQuestion() {
    // ▼▼▼ 現在のカテゴリ名を表示する処理を追加 ▼▼▼
    currentGroupElement.textContent = `カテゴリ: ${currentGroupName}`;
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const currentQuestion = quizData[currentQuestionIndex];
    questionElement.textContent = `第${currentQuestionIndex + 1}問: ${currentQuestion.question}`;
    feedbackElement.textContent = '';
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
 * ユーザーの回答を判定する関数
 * @param {number} selectedIndex - ユーザーがクリックした選択肢の番号 (0-3)
 */
function checkAnswer(selectedIndex) {
    choiceButtons.forEach(button => button.disabled = true);

    const currentQuestion = quizData[currentQuestionIndex];

    if (selectedIndex === currentQuestion.answerIndex) {
        score++;
        feedbackElement.textContent = `正解！🎉\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#e6ffed';
        choiceButtons[selectedIndex].style.borderColor = '#28a745';
    } 
    else {
        const correctAnswerText = currentQuestion.choices[currentQuestion.answerIndex];
        feedbackElement.textContent = `不正解...😢 正解は「${correctAnswerText}」\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#ffebee';
        choiceButtons[selectedIndex].style.borderColor = '#dc3545';
        choiceButtons[currentQuestion.answerIndex].style.backgroundColor = '#d1e7dd';
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
        } 
        else {
            showResult();
        }
    }, 3500);
}

/**
 * 最終的なクイズの結果を画面に表示する関数
 */
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    // ▼▼▼ 挑戦したカテゴリ名を表示する処理を追加 ▼▼▼
    resultGroupNameElement.textContent = currentGroupName;
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
}

/**
 * スタート画面（カテゴリ選択画面）に戻る関数
 */
function showStartScreen() {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'none';
    startContainer.style.display = 'block';
}


/**
 * =================================================================
 *  イベントリスナーの設定
 * =================================================================
 */

// 「クイズ開始！」ボタンがクリックされた時の処理
startButton.addEventListener('click', () => {
    startContainer.style.display = 'none';
    const selectedGroupValue = groupSelect.value;

    // ▼▼▼ 選択されたグループの表示名を変数に保存 ▼▼▼
    // .valueだと 'all' になるが、.textだと 'すべての問題' という表示テキストが取れる
    currentGroupName = groupSelect.options[groupSelect.selectedIndex].text;
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    fetchQuizData(selectedGroupValue);
});

// 「カテゴリ選択に戻る」ボタン (結果画面) がクリックされた時の処理
retryButton.addEventListener('click', showStartScreen);


/**
 * =================================================================
 *  初期化処理
 * =================================================================
 */

/**
 * ページ読み込み時に実行される関数。
 * APIからグループ一覧を取得し、セレクトボックスを動的に生成する。
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
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
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