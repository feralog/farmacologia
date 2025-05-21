/**
 * data.js - Gerenciamento de dados e carregamento das questões
 * 
 * Este arquivo é responsável por:
 * - Carregar os dados das questões de cada módulo
 * - Gerenciar o armazenamento local dos dados do usuário
 * - Fornecer funções para acessar e manipular os dados
 */

// Objeto para armazenar as questões de todos os módulos
const questionsData = {
    AINES_E_AIES: [],
    Anestesicos_Gerais: [],
    Anestesicos_Locais: [],
    ATIPICOS: [],
    Opioides: [] // Corrigido: nome padronizado para "Opioides"
};

// Objeto para armazenar os dados do usuário
let userData = {
    username: '',
    progress: {
        AINES_E_AIES: {},
        Anestesicos_Gerais: {},
        Anestesicos_Locais: {},
        ATIPICOS: {},
        Opioides: {} // Corrigido: nome padronizado para "Opioides"
    },
    lastSession: null
};

/**
 * Carrega as questões de todos os módulos
 * @returns {Promise} Promise que resolve quando todos os dados são carregados
 */
function loadAllQuestions() {
    return Promise.all([
        fetch('./questoes_AINES_E_AIES.json')
            .then(response => response.json())
            .then(data => {
                questionsData.AINES_E_AIES = data;
                initializeQuestionProgress('AINES_E_AIES');
            })
            .catch(error => {
                console.error('Erro ao carregar AINES_E_AIES:', error);
                alert('Erro ao carregar questões de AINES E AIES. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_Anestesicos_Gerais.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Anestesicos_Gerais = data;
                initializeQuestionProgress('Anestesicos_Gerais');
            })
            .catch(error => {
                console.error('Erro ao carregar Anestesicos_Gerais:', error);
                alert('Erro ao carregar questões de Anestésicos Gerais. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_Anestesicos_Locais.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Anestesicos_Locais = data;
                initializeQuestionProgress('Anestesicos_Locais');
            })
            .catch(error => {
                console.error('Erro ao carregar Anestesicos_Locais:', error);
                alert('Erro ao carregar questões de Anestésicos Locais. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_ATIPICOS.json')
            .then(response => response.json())
            .then(data => {
                questionsData.ATIPICOS = data;
                initializeQuestionProgress('ATIPICOS');
            })
            .catch(error => {
                console.error('Erro ao carregar ATIPICOS:', error);
                alert('Erro ao carregar questões de Antipsicóticos Atípicos. Verifique o console para mais detalhes.');
            }),
        // Corrigido: adicionado o carregamento de Opioides dentro do Promise.all
        fetch('./questoes_Opioides.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Opioides = data;
                initializeQuestionProgress('Opioides');
            })
            .catch(error => {
                console.error('Erro ao carregar Opioides:', error);
                alert('Erro ao carregar questões de Opioides. Verifique o console para mais detalhes.');
            })
    ]);
}

/**
 * Inicializa o progresso para as questões de um módulo específico
 * @param {string} module - Nome do módulo
 */
function initializeQuestionProgress(module) {
    // Para cada questão no módulo, verifica se já existe progresso
    questionsData[module].forEach((question, index) => {
        const questionId = `${module}_${index}`;
        
        // Se não existir progresso para esta questão, inicializa
        if (!userData.progress[module][questionId]) {
            userData.progress[module][questionId] = {
                seen: 0,
                correct: 0,
                incorrect: 0,
                lastSeen: null,
                nextReview: null,
                difficulty: 3, // Dificuldade média por padrão
                easeFactor: 2.5, // Fator de facilidade inicial (padrão do Anki)
                interval: 1 // Intervalo inicial em horas
            };
        }
    });
}

/**
 * Salva os dados do usuário no localStorage
 */
function saveUserData() {
    // Atualiza a data da última sessão
    userData.lastSession = new Date().toISOString();
    
    // Salva no localStorage
    localStorage.setItem('farmacologiaQuizData', JSON.stringify(userData));
}

/**
 * Carrega os dados do usuário do localStorage
 * @returns {boolean} True se os dados foram carregados com sucesso, false caso contrário
 */
function loadUserData() {
    const savedData = localStorage.getItem('farmacologiaQuizData');
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Verifica se os dados têm a estrutura esperada
            if (parsedData.username && parsedData.progress) {
                userData = parsedData;
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }
    
    return false;
}

/**
 * Define o nome de usuário
 * @param {string} username - Nome de usuário
 */
function setUsername(username) {
    userData.username = username;
    saveUserData();
}

/**
 * Obtém o nome de usuário atual
 * @returns {string} Nome de usuário
 */
function getUsername() {
    return userData.username;
}

/**
 * Obtém as questões de um módulo específico
 * @param {string} module - Nome do módulo
 * @returns {Array} Array de questões
 */
function getQuestions(module) {
    return questionsData[module] || [];
}

/**
 * Atualiza o progresso de uma questão
 * @param {string} module - Nome do módulo
 * @param {Object} question - Objeto da questão
 * @param {boolean} isCorrect - Se a resposta foi correta
 */
function updateQuestionProgress(module, question, isCorrect) {
    const index = questionsData[module].findIndex(q => q.question === question.question);
    
    if (index === -1) {
        console.error('Questão não encontrada:', question);
        return;
    }
    
    const questionId = `${module}_${index}`;
    
    // Se não existir progresso para esta questão, inicializa
    if (!userData.progress[module][questionId]) {
        userData.progress[module][questionId] = {
            seen: 0,
            correct: 0,
            incorrect: 0,
            lastSeen: null,
            nextReview: null,
            difficulty: 3,
            easeFactor: 2.5,
            interval: 1
        };
    }
    
    // Atualiza o progresso
    userData.progress[module][questionId].seen++;
    
    if (isCorrect) {
        userData.progress[module][questionId].correct++;
    } else {
        userData.progress[module][questionId].incorrect++;
    }
    
    userData.progress[module][questionId].lastSeen = new Date().toISOString();
    
    // Salva os dados
    saveUserData();
}

/**
 * Atualiza a dificuldade de uma questão
 * @param {Object} question - Objeto da questão
 * @param {number} difficulty - Nível de dificuldade (1-5)
 */
function updateQuestionDifficulty(question, difficulty) {
    // Encontra o módulo e o índice da questão
    let foundModule = null;
    let foundIndex = -1;
    
    for (const module in questionsData) {
        const index = questionsData[module].findIndex(q => q.question === question.question);
        
        if (index !== -1) {
            foundModule = module;
            foundIndex = index;
            break;
        }
    }
    
    if (!foundModule || foundIndex === -1) {
        console.error('Questão não encontrada:', question);
        return;
    }
    
    const questionId = `${foundModule}_${foundIndex}`;
    
    // Atualiza a dificuldade
    userData.progress[foundModule][questionId].difficulty = difficulty;
    
    // Calcula o próximo intervalo de revisão
    const now = new Date();
    const interval = calculateNextInterval(userData.progress[foundModule][questionId]);
    const nextReview = new Date(now.getTime() + interval * 60 * 60 * 1000); // Converte horas para milissegundos
    
    userData.progress[foundModule][questionId].interval = interval;
    userData.progress[foundModule][questionId].nextReview = nextReview.toISOString();
    
    // Salva os dados
    saveUserData();
}

/**
 * Calcula o próximo intervalo de revisão
 * @param {Object} questionProgress - Objeto de progresso da questão
 * @returns {number} Próximo intervalo em horas
 */
function calculateNextInterval(questionProgress) {
    // Implementação simplificada do algoritmo SM-2 (usado pelo Anki)
    const { difficulty, easeFactor, interval } = questionProgress;
    
    // Ajusta o fator de facilidade com base na dificuldade
    const newEaseFactor = easeFactor + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02));
    
    // Garante que o fator de facilidade não seja menor que 1.3
    const adjustedEaseFactor = Math.max(1.3, newEaseFactor);
    
    // Calcula o novo intervalo
    let newInterval;
    
    if (questionProgress.seen <= 1) {
        newInterval = 1; // Primeira revisão: 1 hora
    } else if (questionProgress.seen === 2) {
        newInterval = 6; // Segunda revisão: 6 horas
    } else {
        newInterval = Math.round(interval * adjustedEaseFactor);
    }
    
    // Atualiza o fator de facilidade
    questionProgress.easeFactor = adjustedEaseFactor;
    
    return newInterval;
}

/**
 * Obtém as questões para revisão
 * @returns {Array} Array de questões para revisão
 */
function getQuestionsForReview() {
    const now = new Date();
    const reviewQuestions = [];
    
    // Para cada módulo
    for (const module in userData.progress) {
        // Para cada questão no módulo
        for (const questionId in userData.progress[module]) {
            const progress = userData.progress[module][questionId];
            
            // Se a questão já foi vista e está pronta para revisão
            if (progress.seen > 0 && progress.nextReview && new Date(progress.nextReview) <= now) {
                const [moduleId, indexStr] = questionId.split('_');
                const index = parseInt(indexStr);
                
                // Adiciona a questão à lista de revisão
                if (questionsData[moduleId] && questionsData[moduleId][index]) {
                    reviewQuestions.push(questionsData[moduleId][index]);
                }
            }
        }
    }
    
    return reviewQuestions;
}

/**
 * Atualiza o progresso de uma questão na revisão
 * @param {Object} question - Objeto da questão
 * @param {boolean} isCorrect - Se a resposta foi correta
 */
function updateReviewProgress(question, isCorrect) {
    // Encontra o módulo e o índice da questão
    let foundModule = null;
    let foundIndex = -1;
    
    for (const module in questionsData) {
        const index = questionsData[module].findIndex(q => q.question === question.question);
        
        if (index !== -1) {
            foundModule = module;
            foundIndex = index;
            break;
        }
    }
    
    if (!foundModule || foundIndex === -1) {
        console.error('Questão não encontrada:', question);
        return;
    }
    
    // Atualiza o progresso
    updateQuestionProgress(foundModule, question, isCorrect);
}

/**
 * Calcula o progresso de um módulo específico
 * @param {string} module - Nome do módulo
 * @returns {number} Porcentagem de progresso (0-100)
 */
function calculateModuleProgress(module) {
    const questions = questionsData[module];
    
    if (!questions || questions.length === 0) {
        return 0;
    }
    
    let totalCorrect = 0;
    
    // Para cada questão no módulo
    questions.forEach((question, index) => {
        const questionId = `${module}_${index}`;
        const progress = userData.progress[module][questionId];
        
        // Se a questão já foi respondida corretamente pelo menos uma vez
        if (progress && progress.correct > 0) {
            totalCorrect++;
        }
    });
    
    return Math.round((totalCorrect / questions.length) * 100);
}

/**
 * Calcula o progresso geral
 * @returns {number} Porcentagem de progresso (0-100)
 */
function calculateOverallProgress() {
    let totalQuestions = 0;
    let totalCorrect = 0;
    
    // Para cada módulo
    for (const module in questionsData) {
        const questions = questionsData[module];
        
        if (questions && questions.length > 0) {
            totalQuestions += questions.length;
            
            // Para cada questão no módulo
            questions.forEach((question, index) => {
                const questionId = `${module}_${index}`;
                const progress = userData.progress[module][questionId];
                
                // Se a questão já foi respondida corretamente pelo menos uma vez
                if (progress && progress.correct > 0) {
                    totalCorrect++;
                }
            });
        }
    }
    
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
}

/**
 * Limpa todos os dados do usuário
 */
function clearUserData() {
    localStorage.removeItem('farmacologiaQuizData');
    
    // Reinicia o objeto de dados do usuário
    userData = {
        username: '',
        progress: {
            AINES_E_AIES: {},
            Anestesicos_Gerais: {},
            Anestesicos_Locais: {},
            ATIPICOS: {},
            Opioides: {} // Corrigido: nome padronizado para "Opioides"
        },
        lastSession: null
    };
}
