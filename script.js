// ▼▼▼▼▼ ここから2箇所をあなたの情報に書き換えてください ▼▼▼▼▼

// ステップ2-3でコピーした、あなたのウェブアプリのURLを貼り付け
const API_URL = 'https://script.google.com/macros/s/AKfycbwnAXTx2Lb-3c5pb8_5fIzU6Nd_eeCbzN4nr_7wW1rf_C5EmlGkXLLXc-Q-nNgHpeNE3w/exec';

// ステップ2-1で設定した、あなたの秘密鍵を貼り付け
const SECRET_KEY = 'My3DQuizGameSecretKey777';

// ▲▲▲▲▲ ここまでを書き換えてください ▲▲▲▲▲


// --- これ以降のコードは変更不要です ---

const questionElement = document.getElementById('question');
const choiceButtons = document.querySelectorAll('.choice-btn');
const feedbackElement = document.getElementById('feedback');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const retryButton = document.getElementById('retry-btn');

let quizData = [];
let currentQuestionIndex = 0;
let score = 0;

async function fetchQuizData() {
    try {
        questionElement.textContent = 'クイズを読み込み中...';
        const response = await fetch(`${API_URL}?key=${SECRET_KEY}`);
        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }
        quizData = await response.json();
        if (quizData.error) {
            throw new Error(quizData.message);
        }
        startQuiz();
    } catch (error) {
        console.error('クイズデータの取得に失敗しました:', error);
        questionElement.textContent = 'クイズの読み込みに失敗しました。設定を確認してください。';
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    showQuestion();
}

function showQuestion() {
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

function checkAnswer(selectedIndex) {
    const currentQuestion = quizData[currentQuestionIndex];
    choiceButtons.forEach(button => button.disabled = true);

    if (selectedIndex === currentQuestion.answerIndex) {
        score++;
        feedbackElement.textContent = `正解！🎉\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#e6ffed';
        choiceButtons[selectedIndex].style.borderColor = '#28a745';
    } else {
        feedbackElement.textContent = `不正解...😢 正解は「${currentQuestion.choices[currentQuestion.answerIndex]}」\n解説: ${currentQuestion.explanation}`;
        feedbackElement.style.backgroundColor = '#ffebee';
        choiceButtons[selectedIndex].style.borderColor = '#dc3545';
        choiceButtons[currentQuestion.answerIndex].style.backgroundColor = '#d1e7dd'; // 正解をハイライト
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 3500); // 解説を読む時間を少し長めに
}

function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = quizData.length;
}

retryButton.addEventListener('click', startQuiz);

fetchQuizData();