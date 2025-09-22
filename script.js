// ▼▼▼ この部分はビルド時にNetlifyの環境変数で置き換えられます ▼▼▼
const API_URL = '__API_URL__';
const SECRET_KEY = '__SECRET_KEY__';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * =================================================================
 *  HTML要素の取得
 * =================================================================
 * 画面上の各パーツをJavaScriptで操作できるように、変数に格納します。
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

// --- 結果画面の要素 ---
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const retryButton = document.getElementById('retry-btn');


/**
 * =================================================================
 *  ゲームの状態を管理する変数
 * =================================================================
 */
let quizData = []; // APIから取得したクイズデータを格納する配列
let currentQuestionIndex = 0; // 現在表示している問題の番号
let score = 0; // 正解数


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
    // クイズ画面を表示し、読み込み中メッセージを出す
    quizContainer.style.display = 'block';
    questionElement.textContent = 'クイズを読み込み中...';
    feedbackElement.textContent = ''; // 前回のフィードバックを消去
    
    try {
        // APIに送る基本のURLを作成
        let url = `${API_URL}?key=${SECRET_KEY}`;
        
        // もしユーザーが 'all' 以外のグループを選んでいたら、
        // URLの末尾にグループを指定するパラメータを追加する
        if (group !== 'all') {
            // encodeURIComponentは、日本語などの文字化けを防ぐおまじない
            url += `&group=${encodeURIComponent(group)}`;
        }

        // 作成したURLを使って、APIにデータをリクエスト
        const response = await fetch(url);
        
        // APIからの応答がエラーだった場合、エラーを発生させる
        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }
        
        // 応答をJSON形式に変換して、quizDataに保存
        quizData = await response.json();
        
        // API側からエラーメッセージが返された場合（例：認証失敗）、エラーを発生させる
        if (quizData.error) {
            throw new Error(quizData.message);
        }
        
        // 取得した問題が0件だった場合、エラーを発生させる
        if (quizData.length === 0) {
            throw new Error('該当する問題がありませんでした。カテゴリを確認してください。');
        }

        // データ取得が成功したら、クイズを開始する
        startQuiz();

    } catch (error) {
        // データ取得中に何かエラーが起きたら、その内容をコンソールと画面に表示する
        console.error('クイズデータの取得に失敗しました:', error);
        questionElement.textContent = `クイズの読み込みに失敗しました: ${error.message}`;
    }
}

/**
 * クイズの初期化と開始を行う関数
 */
function startQuiz() {
    // 変数を初期状態に戻す
    currentQuestionIndex = 0;
    score = 0;
    
    // 画面の表示を切り替える
    startContainer.style.display = 'none';    // スタート画面を隠す
    resultContainer.style.display = 'none';   // 結果画面を隠す
    quizContainer.style.display = 'block';    // クイズ画面を表示する

    // 最初の問題を表示する
    showQuestion();
}

/**
 * 現在の問題と選択肢を画面に表示する関数
 */
function showQuestion() {
    const currentQuestion = quizData[currentQuestionIndex];
    questionElement.textContent = `第${currentQuestionIndex + 1}問: ${currentQuestion.question}`;
    feedbackElement.textContent = ''; // フィードバック欄を空にする
    feedbackElement.style.backgroundColor = 'transparent'; // 背景色を元に戻す
    
    // 4つの選択肢ボタンに、それぞれテキストを設定し、クリックイベントを割り当てる
    choiceButtons.forEach((button, index) => {
        button.textContent = currentQuestion.choices[index];
        button.onclick = () => checkAnswer(index); // クリックされたらcheckAnswer関数を呼ぶ
        button.disabled = false; // ボタンを押せるようにする
        button.style.backgroundColor = ''; // ボタンの背景色を元に戻す
        button.style.borderColor = '#ddd'; // ボタンの枠線の色を元に戻す
    });
}

/**
 * ユーザーの回答を判定する関数
 * @param {number} selectedIndex - ユーザーがクリックした選択肢の番号 (0-3)
 */
function checkAnswer(selectedIndex) {
    // 一度回答したら、すべてのボタンを無効化する
    choiceButtons.forEach(button => button.disabled = true);

    const currentQuestion = quizData[currentQuestionIndex];

    // ユーザーの選択が正解だった場合
    if (selectedIndex === currentQuestion.answerIndex) {
        score++;
        feedbackElement.textContent = `正解！🎉\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#e6ffed'; // 背景を薄い緑に
        choiceButtons[selectedIndex].style.borderColor = '#28a745'; // 枠線を緑に
    } 
    // 不正解だった場合
    else {
        const correctAnswerText = currentQuestion.choices[currentQuestion.answerIndex];
        feedbackElement.textContent = `不正解...😢 正解は「${correctAnswerText}」\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#ffebee'; // 背景を薄い赤に
        choiceButtons[selectedIndex].style.borderColor = '#dc3545'; // 選択したボタンの枠線を赤に
        choiceButtons[currentQuestion.answerIndex].style.backgroundColor = '#d1e7dd'; // 正解のボタンをハイライト
    }
    
    // 3.5秒待ってから次の処理へ進む
    setTimeout(() => {
        currentQuestionIndex++;
        // まだ次の問題がある場合
        if (currentQuestionIndex < quizData.length) {
            showQuestion(); // 次の問題を表示
        } 
        // 全ての問題が終わった場合
        else {
            showResult(); // 結果を表示
        }
    }, 3500);
}

/**
 * 最終的なクイズの結果を画面に表示する関数
 */
function showResult() {
    quizContainer.style.display = 'none';   // クイズ画面を隠す
    resultContainer.style.display = 'block';// 結果画面を表示する
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
}

/**
 * スタート画面（カテゴリ選択画面）に戻る関数
 */
function showStartScreen() {
    resultContainer.style.display = 'none'; // 結果画面を隠す
    quizContainer.style.display = 'none';   // クイズ画面を隠す
    startContainer.style.display = 'block'; // スタート画面を表示する
}


/**
 * =================================================================
 *  イベントリスナーの設定
 * =================================================================
 * どのボタンがクリックされたら、どの関数を実行するかを定義します。
 */

// 「クイズ開始！」ボタンがクリックされた時の処理
startButton.addEventListener('click', () => {
    // スタート画面を隠す
    startContainer.style.display = 'none';
    const selectedGroup = groupSelect.value; // ドロップダウンで選択されている値を取得
    fetchQuizData(selectedGroup); // そのグループ名でクイズデータを取得開始
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
    // スタートボタンとセレクトボックスを一旦無効化しておく
    groupSelect.disabled = true;
    startButton.disabled = true;
    
    // デフォルトの選択肢の後に「読み込み中...」を追加
    const loadingOption = new Option('カテゴリを読み込み中...', '', true, true);
    loadingOption.disabled = true;
    groupSelect.appendChild(loadingOption);
    
    try {
        const url = `${API_URL}?key=${SECRET_KEY}&action=get_groups`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('カテゴリの取得に失敗しました');
        
        const groups = await response.json();
        
        // 読み込み中... の選択肢を削除
        groupSelect.removeChild(loadingOption);
        
        // 取得したグループ名で選択肢を生成
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });

    } catch (error) {
        console.error(error);
        // エラーが起きた場合、読み込み中...をエラーメッセージに書き換える
        loadingOption.textContent = '読み込みに失敗';
    } finally {
        // 成功・失敗にかかわらず、操作できるようにする
        groupSelect.disabled = false;
        startButton.disabled = false;
    }
}

// ページの読み込みが始まったら、この初期化処理を一番最初に実行する
initializePage();