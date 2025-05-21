/**
 * app.js - Lógica principal do aplicativo de quiz
 * 
 * Este arquivo contém a lógica principal do aplicativo, incluindo:
 * - Gerenciamento de telas e navegação
 * - Lógica do quiz (perguntas, respostas, pontuação)
 * - Timer e progresso
 * - Integração com o sistema de repetição espaçada
 */

// Variáveis globais
let currentUser = '';
let currentModule = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let quizStartTime = null;
let quizTimer = null;
let quizSeconds = 0;
let selectedDifficulty = 0;
let isReviewMode = false;
let reviewQuestions = [];

// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    moduleSelection: document.getElementById('module-selection-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

/**
 * Inicializa o aplicativo
 */
async function init() {
    try {
        // Carrega as questões
        await loadAllQuestions();
        console.log('Questões carregadas com sucesso');
        
        // Tenta carregar dados do usuário
        if (loadUserData()) {
            currentUser = getUsername();
            showModuleSelectionScreen();
        } else {
            showLoginScreen();
        }
        
        // Configura os event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Erro ao inicializar o aplicativo:', error);
        alert('Ocorreu um erro ao carregar o aplicativo. Por favor, recarregue a página.');
    }
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    document.getElementById('reset-progress-btn').addEventListener('click', resetAllProgress);
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Module selection
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', () => startQuiz(btn.dataset.module));
    });
    
    document.getElementById('start-review-btn').addEventListener('click', startSpacedRepetition);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Quiz
    document.getElementById('quit-quiz-btn').addEventListener('click', quitQuiz);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    
    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'selected' de todos os botões
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            
            // Adiciona a classe 'selected' ao botão clicado
            btn.classList.add('selected');
            
            // Armazena a dificuldade selecionada
            selectedDifficulty = parseInt(btn.dataset.difficulty);
            
            // Habilita o botão de próxima questão
            document.getElementById('next-question-btn').disabled = false;
        });
    });
    
    // Results
    document.getElementById('retry-module-btn').addEventListener('click', () => startQuiz(currentModule));
    document.getElementById('return-to-modules-btn').addEventListener('click', showModuleSelectionScreen);
    
    // Configura o salvamento automático
    window.addEventListener('beforeunload', saveUserData);
}

function resetAllProgress() {
  if (confirm('ATENÇÃO: Isso apagará todo o seu progresso em todos os módulos. Esta ação não pode ser desfeita. Deseja continuar?')) {
    try {
      // Remove todos os dados do localStorage
      clearUserData();
      
      // Feedback visual
      alert('Progresso resetado com sucesso! O aplicativo será recarregado.');
      
      // Recarrega a página para aplicar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao resetar progresso:", error);
      alert('Ocorreu um erro ao tentar resetar o progresso. Por favor, tente novamente.');
    }
  }
}
/**
 * Manipula o envio do formulário de login
 * @param {Event} event - Evento de submit
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    
    if (username) {
        currentUser = username;
        setUsername(username);
        showModuleSelectionScreen();
    }
}

/**
 * Manipula o logout do usuário
 */
function handleLogout() {
    if (confirm('Tem certeza que deseja sair? Seu progresso está salvo.')) {
        currentUser = '';
        showLoginScreen();
    }
}

/**
 * Mostra a tela de login
 */
function showLoginScreen() {
    hideAllScreens();
    screens.login.classList.remove('d-none');
    document.getElementById('username').value = currentUser;
}

/**
 * Mostra a tela de seleção de módulos
 */
function showModuleSelectionScreen() {
    hideAllScreens();
    screens.moduleSelection.classList.remove('d-none');
    
    // Atualiza o nome do usuário
    document.getElementById('user-display').textContent = currentUser;
    
    // Atualiza o progresso dos módulos
    updateModuleProgress();
}

/**
 * Atualiza o progresso exibido para cada módulo
 */
function updateModuleProgress() {
    // Atualiza o progresso de cada módulo
    document.querySelectorAll('.module-progress').forEach(element => {
        const module = element.dataset.module;
        const progress = calculateModuleProgress(module);
        element.textContent = `${progress}%`;
        
        // Atualiza a cor baseada no progresso
        if (progress >= 80) {
            element.classList.remove('bg-primary', 'bg-warning');
            element.classList.add('bg-success');
        } else if (progress >= 40) {
            element.classList.remove('bg-primary', 'bg-success');
            element.classList.add('bg-warning');
        } else {
            element.classList.remove('bg-warning', 'bg-success');
            element.classList.add('bg-primary');
        }
    });
    
    // Atualiza o progresso geral
    const overallProgress = calculateOverallProgress();
    document.getElementById('overall-progress').textContent = `${overallProgress}%`;
    document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;
    
    // Atualiza a cor do progresso geral
    const progressBar = document.getElementById('overall-progress-bar');
    if (overallProgress >= 80) {
        progressBar.className = 'progress-bar bg-success';
    } else if (overallProgress >= 40) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-primary';
    }
}

/**
 * Inicia o quiz para um módulo específico
 * @param {string} module - Nome do módulo
 */
function startQuiz(module) {
    currentModule = module;
    isReviewMode = false;
    
    // Para todos os módulos, carrega as questões normalmente
    if (questionsData[module] && questionsData[module].length > 0) {
        currentQuestions = questionsData[module];
        startQuizFlow();
    } else {
        alert(`Erro: Não foi possível carregar as questões do módulo ${module}.`);
        showModuleSelectionScreen();
    }
}

/**
 * Inicia o fluxo do quiz após carregar as questões
 */
function startQuizFlow() {
    // Reinicia as variáveis
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    // Embaralha as questões
    if (!isReviewMode) {
        shuffleArray(currentQuestions);
    }
    
    // Inicia o timer
    startTimer();
    
    // Mostra a tela do quiz
    showQuizScreen();
    
    // Carrega a primeira questão
    loadQuestion();
}

/**
 * Inicia o modo de revisão espaçada
 */
function startSpacedRepetition() {
    // Obtém as questões para revisão
    reviewQuestions = getQuestionsForReview();
    
    if (reviewQuestions.length === 0) {
        alert('Não há questões para revisar no momento. Continue praticando os módulos para adicionar questões à revisão.');
        return;
    }
    
    // Configura o modo de revisão
    isReviewMode = true;
    currentModule = 'Revisão';
    currentQuestions = reviewQuestions;
    
    // Inicia o fluxo do quiz
    startQuizFlow();
}

/**
 * Carrega a questão atual
 */
function loadQuestion() {
    // Verifica se ainda há questões
    if (currentQuestionIndex >= currentQuestions.length) {
        finishQuiz();
        return;
    }
    
    
    const question = currentQuestions[currentQuestionIndex];
    
    // Atualiza o título do módulo
    document.getElementById('quiz-title').textContent = isReviewMode ? 'Revisão Espaçada' : currentModule;
    
    // Atualiza o contador de questões
    document.getElementById('question-number').textContent = `${currentQuestionIndex + 1}/${currentQuestions.length}`;
    
    // Atualiza o texto da questão
    document.getElementById('question-text').textContent = question.question;
    
    // Limpa as opções anteriores
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Adiciona as novas opções - CORREÇÃO: Usando as classes corretas
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        // Usa a classe option-btn em vez de option
        optionElement.className = 'option-btn';
        
        // Adiciona o número da opção com a formatação correta
        const optionNumber = document.createElement('div');
        optionNumber.className = 'option-number';
        optionNumber.textContent = index;
        optionElement.appendChild(optionNumber);
        
        // Adiciona o texto da opção
        const optionText = document.createElement('span');
        optionText.textContent = option;
        optionElement.appendChild(optionText);
        
        // Adiciona o data-index para identificação
        optionElement.dataset.index = index;
        
        // Adiciona o evento de clique
        optionElement.addEventListener('click', () => selectOption(optionElement, index));
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Esconde a explicação
    document.getElementById('explanation-container').classList.add('d-none');
    
    // Reseta os botões de dificuldade
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Esconde os botões de dificuldade - CORREÇÃO: Usando o ID correto
    document.getElementById('spaced-repetition-container').classList.add('d-none');
}

// Função para selecionar uma opção
function selectOption(optionElement, index) {
    // Verifica se já foi selecionada uma opção - CORREÇÃO: Usando a classe correta
    if (document.querySelector('.option-btn.selected')) {
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = index === question.correctIndex;
    
    // Marca a opção selecionada
    optionElement.classList.add('selected');
    
    // Adiciona a classe de correto ou incorreto
    if (isCorrect) {
        optionElement.classList.add('correct');
        correctAnswers++;
    } else {
        optionElement.classList.add('incorrect');
        incorrectAnswers++;
        
        // Destaca a opção correta - CORREÇÃO: Usando a classe correta
        const options = document.querySelectorAll('.option-btn');
        options[question.correctIndex].classList.add('correct');
    }
    
    // Mostra a explicação
    const explanationContainer = document.getElementById('explanation-container');
    explanationContainer.classList.remove('d-none');
    document.getElementById('explanation-text').textContent = question.explanation;
    
    // Mostra os botões de dificuldade - CORREÇÃO: Usando o ID correto
    document.getElementById('spaced-repetition-container').classList.remove('d-none');
    
    // Atualiza o progresso do usuário
    if (isReviewMode) {
        updateReviewProgress(question, isCorrect);
    } else {
        updateQuestionProgress(currentModule, question, isCorrect);
    }
}

// Função para avançar para a próxima questão
function nextQuestion() {
    // Verifica se foi selecionada uma opção - CORREÇÃO: Usando a classe correta
    if (!document.querySelector('.option-btn.selected')) {
        alert('Por favor, selecione uma opção antes de continuar.');
        return;
    }
    
    // Verifica se foi selecionada uma dificuldade - CORREÇÃO: Usando o ID correto
    if (document.getElementById('spaced-repetition-container').classList.contains('d-none') === false && 
        !document.querySelector('.difficulty-btn.selected')) {
        alert('Por favor, avalie a dificuldade da questão antes de continuar.');
        return;
    }
    
    // Atualiza a dificuldade da questão
    if (isReviewMode) {
        updateQuestionDifficulty(currentQuestions[currentQuestionIndex], selectedDifficulty);
    }
    
    // Avança para a próxima questão
    currentQuestionIndex++;
    loadQuestion();
}

/**
 * Finaliza o quiz
 */
function finishQuiz() {
    // Para o timer
    stopTimer();
    
    // Calcula a pontuação
    const totalQuestions = correctAnswers + incorrectAnswers;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Atualiza os elementos da tela de resultados
    
    document.getElementById('results-score').textContent = `${score}%`;
    document.getElementById('results-correct').textContent = correctAnswers;
    document.getElementById('results-incorrect').textContent = incorrectAnswers;
    document.getElementById('results-time').textContent = formatTime(quizSeconds);
    
    // Mostra a tela de resultados
    showResultsScreen();
}

/**
 * Abandona o quiz atual
 */
function quitQuiz() {
    if (confirm('Tem certeza que deseja abandonar o quiz? Seu progresso será perdido.')) {
        stopTimer();
        showModuleSelectionScreen();
    }
}

/**
 * Inicia o timer do quiz
 */
function startTimer() {
    quizStartTime = new Date();
    quizSeconds = 0;
    
    quizTimer = setInterval(() => {
        quizSeconds++;
        document.getElementById('timer').innerHTML = `<i class="fas fa-clock me-1"></i>${formatTime(quizSeconds)}`;
    }, 1000);
}

/**
 * Para o timer do quiz
 */
function stopTimer() {
    clearInterval(quizTimer);
}

/**
 * Formata o tempo em minutos e segundos
 * @param {number} seconds - Tempo em segundos
 * @returns {string} Tempo formatado
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

/**
 * Esconde todas as telas
 */
function hideAllScreens() {
    Object.values(screens).forEach(screen => screen.classList.add('d-none'));
}

/**
 * Mostra a tela do quiz
 */
function showQuizScreen() {
    hideAllScreens();
    screens.quiz.classList.remove('d-none');
}

/**
 * Mostra a tela de resultados
 */
function showResultsScreen() {
    hideAllScreens();
    screens.results.classList.remove('d-none');
}

/**
 * Embaralha um array
 * @param {Array} array - Array a ser embaralhado
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
