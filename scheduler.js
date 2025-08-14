const cron = require('node-cron');
const fetch = require('node-fetch');
const handler = require('./api/news').default;

// Agendar para rodar todos os dias à meia-noite
cron.schedule('0 0 * * *', async () => {
    console.log('Executando atualização diária de notícias...');
    try {
        await handler({ method: 'GET' }, {
            setHeader: () => {},
            status: (code) => ({ json: (data) => console.log('Notícias atualizadas:', data) })
        });
    } catch (error) {
        console.error('Erro na atualização diária:', error);
    }
});

console.log('Agendador de notícias iniciado.');
