// scheduler.js
const cron = require('node-cron');
const fetch = require('node-fetch');

// Função para chamar a API /api/news
async function updateNews() {
    console.log('Executando atualização diária de notícias...');
    try {
        const response = await fetch('http://localhost:3000/api/news', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
            }
        });
        const data = await response.json();
        console.log('Notícias atualizadas:', data);
    } catch (error) {
        console.error('Erro na atualização diária:', error);
    }
}

// Agendar para rodar todos os dias à meia-noite
cron.schedule('0 0 * * *', updateNews);

console.log('Agendador de notícias iniciado.');
