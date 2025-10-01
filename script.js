// script.js

/**
 * =================================================================
 *  パスワード認証
 * =================================================================
 */
const CORRECT_PASSWORD = 'quiz1234'; // ★★★ 必ず実際のパスワードに変更してください ★★★
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
const startContainer = document.getElementById('start-container');
const videoContainer = document.getElementById('video-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const reviewContainer = document.getElementById('review-container');
const historyContainer = document.getElementById('history-container');
const historyButton = document.getElementById('history-btn');
const dashboardList = document.getElementById('dashboard-list');
const videoTitle = document.getElementById('video-title');
const youtubePlayer = document.getElementById('youtube-player');
const proceedToQuizButton = document.getElementById('proceed-to-quiz-btn');
const backToStartFromVideoButton = document.getElementById('back-to-start-from-video-btn');
const questionElement = document.getElementById('question');
const choiceButtons = document.querySelectorAll('.choice-btn');
const feedbackElement = document.getElementById('feedback');
const currentGroupElement = document.getElementById('current-group');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const resultGroupNameElement = document.getElementById('result-group-name');
const reviewButton = document.getElementById('review-btn');
const backToStartButton = document.getElementById('back-to-start-btn');
const reviewList = document.getElementById('review-list');
const restartButton = document.getElementById('restart-btn');
const reviewGroupNameElement = document.getElementById('review-group-name');
const saveReviewImageButton = document.getElementById('save-review-image-btn');
const historyList = document.getElementById('history-list');
const backToStartFromHistoryButton = document.getElementById('back-to-start-from-history-btn');


/**
 * =================================================================
 *  ゲームの状態を管理する変数
 * =================================================================
 */
let allQuizData = [];
let allMasterData = [];
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let currentGroupName = '';
let userAnswers = [];
let categoryMap = {}; // ★ 変更点: categoryTreeからcategoryMapに変更


/**
 * =================================================================
 *  ヘルパー関数の定義 (localStorage操作)
 * =================================================================
 */
function getProgressData() {
    try {
        return JSON.parse(localStorage.getItem('quizProgress')) || {};
    } catch (e) { return {}; }
}

function updateProgressData(categoryCode, dataToUpdate) { // ★ 引数をsmallCodeから変更
    if (!categoryCode) return;
    try {
        const progressData = getProgressData();
        if (!progressData[categoryCode]) {
            progressData[categoryCode] = { videoViews: 0, correct: 0, total: 0 };
        }
        if (dataToUpdate.video) {
            progressData[categoryCode].videoViews++;
        }
        if (dataToUpdate.score !== undefined) {
            progressData[categoryCode].correct = dataToUpdate.score;
        }
        if (dataToUpdate.total !== undefined) {
            progressData[categoryCode].total = dataToUpdate.total;
        }
        localStorage.setItem('quizProgress', JSON.stringify(progressData));
    } catch (e) { console.error('進捗データの保存に失敗しました:', e); }
}


/**
 * =================================================================
 *  メインの関数定義
 * =================================================================
 */

// ★ 修正: master_data.csvからカテゴリのマップ（連想配列）を生成する
function buildCategoryMap(masterData) {
    console.log('buildCategoryMap - masterData:', masterData); // デバッグ用
    const map = {};
    masterData.forEach(row => {
        console.log('Processing row:', row); // デバッグ用
        if (row.category_code) {
            map[row.category_code] = {
                name: row.category_name,
                videoId: row.video_id || '' // video_idが空でも空文字列として設定
            };
        }
    });
    console.log('Final categoryMap:', map); // デバッグ用
    return map;
}

// ★ 修正: 指定カテゴリの問題を準備し、クイズを開始する
function prepareAndStartQuiz(params) {
    // 1段階のcategory_codeを使って問題を絞り込む
    const filteredData = allQuizData.filter(row => row.category_code === params.c);

    if (filteredData.length === 0) {
        alert('該当する問題データが見つかりませんでした。ダッシュボードに戻ります。');
        showStartScreen();
        return;
    }

    quizData = filteredData.map(row => {
        const correctAnswer = row.correct_answer;
        const choices = [
            row.correct_answer, row.incorrect_1, row.incorrect_2, row.incorrect_3
        ].filter(Boolean);

        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        const answerIndex = choices.findIndex(choice => choice === correctAnswer);
        
        return {
            id: row.id,
            question: row.question,
            choices,
            answerIndex,
            explanation: row.explanation
        };
    });

    startQuiz();
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    startContainer.style.display = 'none';
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
        if (currentQuestion.choices[index] !== undefined) {
            button.textContent = currentQuestion.choices[index];
            button.style.display = 'block';
            button.onclick = () => checkAnswer(index);
            button.disabled = false;
            button.style.backgroundColor = '';
            button.style.borderColor = '#ddd';
        } else {
            button.style.display = 'none';
        }
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
        isCorrect ? historyData[questionId].correct++ : historyData[questionId].incorrect++;
        localStorage.setItem('quizHistory', JSON.stringify(historyData));
    } catch (e) { console.error('学習履歴の保存に失敗しました:', e); }

    const feedbackText = document.createElement('p');
    if (isCorrect) {
        score++;
        feedbackText.innerHTML = `正解！🎉<br>解説: ${currentQuestion.explanation || ''}`;
        feedbackElement.style.backgroundColor = '#e6ffed';
        choiceButtons[selectedIndex].style.borderColor = '#28a745';
    } else {
        const correctAnswerText = currentQuestion.choices[currentQuestion.answerIndex];
        feedbackText.innerHTML = `不正解...😢 正解は「${correctAnswerText}」<br>解説: ${currentQuestion.explanation || ''}`;
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
    nextButton.onclick = () => isLastQuestion ? showResult() : (currentQuestionIndex++, showQuestion());
    feedbackElement.appendChild(nextButton);
}

function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultGroupNameElement.textContent = currentGroupName;
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
    const categoryCode = document.body.dataset.currentCategoryCode; // ★ 修正
    updateProgressData(categoryCode, { score: score, total: quizData.length });
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
    try {
        const canvas = await html2canvas(reviewContainer, { backgroundColor: '#ffffff', scale: 2 });
        const imageUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const formattedDate = new Date().toLocaleDateString('sv-SE').replace(/-/g, '');
        downloadLink.download = `quiz_review_${formattedDate}.png`;
        downloadLink.href = imageUrl;
        downloadLink.click();
    } catch (error) { console.error('画像の生成に失敗しました:', error); }
    finally {
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
        historyItem.innerHTML = `<p class="history-question">${record.question}</p><div class="history-stats"><span class="history-correct">正解: ${record.correct}回</span><span class="history-incorrect">不正解: ${record.incorrect}回</span></div>`;
        historyList.appendChild(historyItem);
    });
}

function showStartScreen() {
    [videoContainer, quizContainer, resultContainer, reviewContainer, historyContainer].forEach(c => c.style.display = 'none');
    startContainer.style.display = 'block';
    if (youtubePlayer.src) youtubePlayer.src = '';
    showDashboard();
}

// ★ 修正: 引数を1段階のカテゴリコードに変更
function handleStartFromDashboard(categoryCode, actionType) {
    const category = categoryMap[categoryCode];
    currentGroupName = category.name;
    const videoId = category.videoId;
    const params = { c: categoryCode }; // ★ URLパラメータを `c` に変更
    document.body.dataset.currentCategoryCode = categoryCode; // ★ 修正
    startContainer.style.display = 'none';

    if (actionType === 'watch' && videoId) {
        showVideoScreen(videoId, params);
        updateProgressData(categoryCode, { video: true });
    } else {
        prepareAndStartQuiz(params);
    }
}

function showVideoScreen(videoId, quizParams) {
    videoTitle.textContent = `学習動画: ${currentGroupName}`;
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}`;
    videoContainer.style.display = 'block';
    
    const newButton = proceedToQuizButton.cloneNode(true);
    proceedToQuizButton.parentNode.replaceChild(newButton, proceedToQuizButton);
    newButton.addEventListener('click', () => {
        if (youtubePlayer.src) youtubePlayer.src = '';
        prepareAndStartQuiz(quizParams);
    });
}

// ★ 修正: 1段階のカテゴリをダッシュボードに表示
function showDashboard() {
    dashboardList.innerHTML = '';
    const progressData = getProgressData();
    const categoryCodes = Object.keys(categoryMap);

    if (categoryCodes.length === 0) {
        dashboardList.innerHTML = '<p>表示できるカテゴリがありません。master_data.csvの内容を確認してください。</p>';
        return;
    }

    categoryCodes.forEach(categoryCode => {
        const category = categoryMap[categoryCode];
        const record = progressData[categoryCode] || { videoViews: 0, correct: 0, total: 0 };
        const item = document.createElement('div');
        item.className = 'dashboard-item';
        const scoreText = record.total > 0 ? `${record.correct} / ${record.total}` : '未挑戦';
        const scoreClass = record.total > 0 && record.correct === record.total ? 'perfect' : '';
        item.innerHTML = `
            <div class="dashboard-cat-name">${category.name}</div>
            <div class="dashboard-progress">
                <span>視聴: ${record.videoViews}回</span>
                <span class="score ${scoreClass}">テスト: ${scoreText}</span>
            </div>
        `;
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'dashboard-buttons';
        const watchButton = document.createElement('button');
        watchButton.textContent = '動画';
        watchButton.className = 'dashboard-watch-btn';
        watchButton.disabled = !category.videoId;
        watchButton.onclick = () => handleStartFromDashboard(categoryCode, 'watch');
        const quizButton = document.createElement('button');
        quizButton.textContent = 'テスト';
        quizButton.className = 'dashboard-quiz-btn';
        quizButton.onclick = () => handleStartFromDashboard(categoryCode, 'quiz');
        buttonContainer.append(watchButton, quizButton);
        item.appendChild(buttonContainer);
        dashboardList.appendChild(item);
    });
}


/**
 * =================================================================
 *  イベントリスナーの設定
 * =================================================================
 */
reviewButton.addEventListener('click', showReview);
backToStartButton.addEventListener('click', showStartScreen);
saveReviewImageButton.addEventListener('click', saveReviewAsImage);
restartButton.addEventListener('click', showStartScreen);
historyButton.addEventListener('click', showHistory);
backToStartFromHistoryButton.addEventListener('click', showStartScreen);
backToStartFromVideoButton.addEventListener('click', showStartScreen);


/**
 * =================================================================
 *  初期化処理
 * =================================================================
 */
// 一時的な解決策：CSVデータを直接埋め込み
const masterDataCsv = `category_code,category_name,video_id
EN-GR-BE,英語-文法-be動詞,T5tygeUoHts
EN-GR-GV,英語-文法-一般動詞,T5tygeUoHts
EN-VC-N1,英語-語彙-名詞,T5tygeUoHts
MA-AL-EQ,数学-代数-方程式,T5tygeUoHts
MA-GE-ALL,数学-幾何-全範囲,
JP-CL-ALL,国語-古文-全範囲,`;

const quizDataCsv = `id,category_code,question,correct_answer,incorrect_1,incorrect_2,incorrect_3,explanation,large_code,medium_code,small_code
Q0001,EN-GR-BE,I ( ) a student. の（ ）に入るのは？,am,is,are,be,「わたしは生徒です。」主語が I（わたし）のときは am を使います。,,,
Q0002,EN-GR-BE,You ( ) very kind. の（ ）に入るのは？,are,is,am,be,「あなたはとても親切です。」主語が You（あなた）のときは are を使います。,,,
Q0003,EN-GR-BE,He ( ) a great soccer player. の（ ）に入るのは？,is,am,are,be,「彼はすごいサッカー選手です。」主語が He（彼）で「１人」なので is を使います。,,,
Q0004,EN-GR-BE,We ( ) good friends. の（ ）に入るのは？,are,is,am,be,「わたしたちは良い友達です。」主語が We（わたしたち）で「２人以上」なので are を使います。,,,
Q0005,EN-GR-BE,This book ( ) interesting. の（ ）に入るのは？,is,am,are,be,「この本は面白いです。」主語が This book（この本）で「１つ」のものなので is を使います。,,,
Q0006,EN-GR-BE,My parents ( ) in Tokyo. の（ ）に入るのは？,are,is,am,be,「私の両親は東京にいます。」主語が My parents（私の両親）で「２人以上」なので are を使います。,,,
Q0007,EN-GR-BE,「be動詞」の仲間ではないものは次のうちどれ？,do,am,is,are,"be動詞の仲間は is, am, are の３つです。do は一般動詞です。",,,
Q0008,EN-GR-BE,She ( ) happy now. の（ ）に入るのは？,is,am,are,be,「彼女は今、幸せです。」主語が She（彼女）で「１人」なので is を使います。,,,
Q0009,EN-GR-BE,Taro and I ( ) classmates. の（ ）に入るのは？,are,is,am,be,「太郎とわたしはクラスメイトです。」主語が Taro and I（太郎とわたし）で「２人」なので are を使います。,,,
Q0010,MA-AL-EQ,x + 5 = 10 の解は？,5,20,15,55,,,,`;

async function initializePage() {
    dashboardList.innerHTML = '<p>データを読み込み中...</p>';
    
    try {
        // CSVファイルの代わりに埋め込まれたデータを使用
        allQuizData = Papa.parse(quizDataCsv, { header: true, skipEmptyLines: true }).data;
        allMasterData = Papa.parse(masterDataCsv, { header: true, skipEmptyLines: true }).data;
        
        console.log('allMasterData after parsing:', allMasterData);
        
        if (allMasterData.length === 0) {
            throw new Error("master_data.csvが空か、正しく読み込めませんでした。");
        }

        categoryMap = buildCategoryMap(allMasterData);
        console.log('categoryMap after build:', categoryMap);

        const params = new URLSearchParams(window.location.search);
        const c = params.get('c');

        if (c && categoryMap[c]) {
            startContainer.style.display = 'none';
            handleStartFromDashboard(c, 'quiz');
        } else {
            showDashboard();
        }

    } catch (error) {
        console.error("初期化エラー:", error);
        startContainer.innerHTML = `<h2>エラー</h2><p>データの読み込みに失敗しました。CSVファイルと文字コード(UTF-8)を確認してください。</p>`;
    }
}