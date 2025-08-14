// api/news.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Função de tradução básica para termos comuns
function basicTranslation(text) {
    const translations = {
        'League of Legends': 'League of Legends',
        'Worlds': 'Mundial',
        'Championship': 'Campeonato',
        'Esports': 'Esports',
        'Teams': 'Equipes',
        'Team': 'Equipe',
        'Players': 'Jogadores',
        'Player': 'Jogador',
        'Match': 'Partida',
        'Game': 'Jogo',
        'Tournament': 'Torneio',
        'Finals': 'Finais',
        'Semifinals': 'Semifinais',
        'Quarterfinals': 'Quartas de Final',
        'Season': 'Temporada',
        'Split': 'Split',
        'Playoff': 'Playoff',
        'Playoffs': 'Playoffs',
        'Victory': 'Vitória',
        'Defeat': 'Derrota',
        'Win': 'Vitória',
        'Loss': 'Derrota',
        'Draft': 'Draft',
        'Pick': 'Escolha',
        'Ban': 'Banimento',
        'Champion': 'Campeão',
        'Champions': 'Campeões',
        'Skin': 'Skin',
        'Skins': 'Skins',
        'Update': 'Atualização',
        'Patch': 'Patch',
        'Release': 'Lançamento',
        'New': 'Novo',
        'Latest': 'Mais recente',
        'Announces': 'anuncia',
        'Reveals': 'revela',
        'Launches': 'lança',
        'Sets': 'define',
        'September': 'setembro',
        'October': 'outubro',
        'November': 'novembro',
        'December': 'dezembro',
        'January': 'janeiro',
        'February': 'fevereiro',
        'March': 'março',
        'April': 'abril',
        'May': 'maio',
        'June': 'junho',
        'July': 'julho',
        'August': 'agosto',
        'LPL': 'LPL',
        'LCK': 'LCK',
        'LCS': 'LCS',
        'LEC': 'LEC',
        'MSI': 'MSI',
        'Riot Games': 'Riot Games',
        'T1': 'T1',
        'Gen.G': 'Gen.G',
        'DRX': 'DRX',
        'KT Rolster': 'KT Rolster',
        'Hanwha Life Esports': 'Hanwha Life Esports',
        'FPX': 'FPX',
        'Keria': 'Keria',
        'Faker': 'Faker',
        'Viper': 'Viper',
        'Milkyway': 'Milkyway',
        'LazyFeel': 'LazyFeel',
        'Suspends': 'suspende',
        'Indefinitely': 'indefinidamente',
        'Over': 'por',
        'Allegations': 'alegações',
        'Dominance': 'domínio',
        'After': 'após',
        'Sweep': 'varredura',
        'Historic': 'histórico',
        'First': 'primeiro',
        'Korean': 'coreano',
        'Launch': 'lançamento',
        'Attends': 'participa',
        'State': 'estado',
        'Banquet': 'banquete',
        'Making': 'fazendo',
        'History': 'história',
        'reflects': 'reflete',
        'upcoming': 'próximo',
        'milestone': 'marco'
    };

    let translatedText = text;
    for (const [english, portuguese] of Object.entries(translations)) {
        const regex = new RegExp(english, 'gi');
        translatedText = translatedText.replace(regex, portuguese);
    }
    return translatedText;
}

// Função de tradução usando API MyMemory
async function translateText(text) {
    if (!text || text.length === 0) return text;
    try {
        const encodedText = encodeURIComponent(text);
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|pt`,
            {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
                },
                timeout: 5000
            }
        );

        if (!response.ok) throw new Error(`Translation API failed: ${response.status}`);

        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
        throw new Error('Invalid translation response');
    } catch (error) {
        console.error('Erro na tradução:', error);
        return basicTranslation(text);
    }
}

// Função para fazer scraping do conteúdo completo de uma notícia
async function scrapeNewsContent(url) {
    try {
        console.log(`Scraping conteúdo de: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) throw new Error(`Falha ao acessar ${url}: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Seletores específicos para o Inven Global
        let content = '';
        
        // Tentar diferentes seletores para o conteúdo do artigo
        const contentSelectors = [
            '.article-content p',
            '.content-body p',
            '.post-content p',
            'article p',
            '.entry-content p',
            '.article-body p'
        ];
        
        for (const selector of contentSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                content = elements
                    .map((i, el) => $(el).text().trim())
                    .get()
                    .filter(text => text.length > 20) // Filtrar parágrafos muito curtos
                    .join('\n\n');
                break;
            }
        }
        
        // Se não encontrou conteúdo com os seletores específicos, tentar uma abordagem mais geral
        if (!content) {
            const allParagraphs = $('p');
            const paragraphTexts = allParagraphs
                .map((i, el) => $(el).text().trim())
                .get()
                .filter(text => text.length > 50); // Filtrar parágrafos muito curtos
            
            if (paragraphTexts.length > 0) {
                content = paragraphTexts.slice(0, 10).join('\n\n'); // Pegar os primeiros 10 parágrafos
            }
        }
        
        if (!content) {
            console.warn(`Nenhum conteúdo encontrado em: ${url}`);
            content = 'Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.';
        }

        // Limpar conteúdo
        content = content
            .replace(/[\n\s]+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();

        return await translateText(content);
    } catch (error) {
        console.error(`Erro ao fazer scraping de ${url}:`, error);
        return 'Conteúdo não disponível devido a um erro de extração.';
    }
}

// Função para extrair notícias diretamente da página do Inven Global LoL
async function scrapeInvenGlobalNews() {
    try {
        console.log('Fazendo scraping da página do Inven Global LoL...');
        const response = await fetch('https://www.invenglobal.com/lol', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error(`Falha ao acessar Inven Global: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const news = [];
        const newsItems = $('.news-item, .article-item, .post-item, .content-item').slice(0, 5);
        
        // Se não encontrou com seletores específicos, tentar uma abordagem mais geral
        if (newsItems.length === 0) {
            // Procurar por links que parecem ser notícias
            const newsLinks = $('a').filter((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                return href && href.includes('/articles/') && text.length > 10;
            }).slice(0, 5);
            
            for (let i = 0; i < newsLinks.length; i++) {
                const link = newsLinks.eq(i);
                const title = link.text().trim();
                const url = link.attr('href');
                
                if (title && url) {
                    const fullUrl = url.startsWith('http') ? url : `https://www.invenglobal.com${url}`;
                    const content = await scrapeNewsContent(fullUrl);
                    
                    news.push({
                        title: await translateText(title),
                        url: fullUrl,
                        content,
                        source: 'Inven Global',
                        date: new Date().toISOString(), // Data atual como fallback
                        translated: true
                    });
                }
            }
        } else {
            // Processar itens de notícias encontrados
            for (let i = 0; i < newsItems.length; i++) {
                const item = newsItems.eq(i);
                const titleElement = item.find('h1, h2, h3, h4, .title, .headline').first();
                const linkElement = item.find('a').first();
                
                const title = titleElement.text().trim() || linkElement.text().trim();
                const url = linkElement.attr('href');
                
                if (title && url) {
                    const fullUrl = url.startsWith('http') ? url : `https://www.invenglobal.com${url}`;
                    const content = await scrapeNewsContent(fullUrl);
                    
                    news.push({
                        title: await translateText(title),
                        url: fullUrl,
                        content,
                        source: 'Inven Global',
                        date: new Date().toISOString(),
                        translated: true
                    });
                }
            }
        }
        
        return news;
    } catch (error) {
        console.error('Erro ao fazer scraping do Inven Global:', error);
        return [];
    }
}

// Notícias estáticas como fallback
export function getStaticNews() {
    console.log('getStaticNews: Gerando notícias estáticas...');
    const today = new Date('2025-08-14T00:00:00-03:00');
    const news = [
        {
            title: "Equipe LPL FPX Suspende Milkyway Indefinidamente por Alegações de Vazamento de Pick-Ban",
            url: "https://www.invenglobal.com/articles/19568/lpl-team-fpx-suspends-milkyway-indefinitely-over-pick-ban-leak-allegations",
            content: "A equipe profissional de jogos da LPL da China, FPX Esports Club, suspendeu indefinidamente seu jogador Cai 'milkyway' Zi-Jun. A suspensão veio após alegações de que ele estava envolvido em manipulação de partidas e vazamento de informações estratégicas durante o processo de pick-ban. O clube anunciou que está conduzindo uma investigação completa sobre as alegações e que tomará as medidas apropriadas com base nos resultados. Esta é uma situação séria que pode ter implicações significativas para a carreira do jogador e para a integridade competitiva da liga.",
            source: "Inven Global",
            date: new Date('2025-08-13T12:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "T1 Keria sobre Domínio na Bot Lane e 700ª Vitória LCK do Faker Após Varrer KT Rolster",
            url: "https://www.invenglobal.com/articles/19570/t1-keria-on-bot-lane-dominance-and-fakers-700th-lck-victory-after-sweep-of-kt-rolster",
            content: "O suporte da T1, Ryu 'Keria' Min-seok, participou da entrevista pós-partida após a equipe varrer o KT Rolster por 2-0 na Rodada 4 da temporada regular da LCK 2025, conquistando sua 17ª vitória. Ele refletiu sobre o domínio da dupla bot lane e o marco histórico de Faker alcançando 700 vitórias na LCK. Keria destacou a importância da comunicação e sinergia com seu ADC, bem como o papel fundamental que Faker continua desempenhando na equipe mesmo após tantos anos de carreira. A vitória consolida a posição da T1 como uma das principais candidatas aos playoffs.",
            source: "Inven Global",
            date: new Date('2025-08-13T10:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Finais da LCK 2025 Serão Transmitidas ao Vivo na MBC em Primeira Histórica para Esports Coreanos",
            url: "https://www.invenglobal.com/articles/19569/2025-lck-finals-to-air-live-on-mbc-in-historic-first-for-korean-esports",
            content: "A Liga dos Campeões da Coreia fará sua estreia na TV terrestre no próximo mês, com as Finais da LCK 2025 programadas para serem transmitidas ao vivo na emissora sul-coreana MBC. A melhor de cinco séries começa às 14h KST no domingo. Este é um marco histórico para os esports coreanos, representando o reconhecimento mainstream do League of Legends como um esporte legítimo. A transmissão na TV aberta deve aumentar significativamente a audiência e a exposição dos esports para o público geral coreano.",
            source: "Inven Global",
            date: new Date('2025-08-13T09:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Riot Games Define Lançamento em Setembro para Skins do Mundial da T1",
            url: "https://www.invenglobal.com/articles/19567/riot-games-sets-september-launch-for-t1-worlds-skins",
            content: "A Riot Games anunciou que lançará skins comemorativas para a T1, vencedores do Campeonato Mundial de League of Legends de 2024, em setembro. A notícia foi divulgada em uma atualização de desenvolvedor publicada em agosto. As skins celebrarão a conquista histórica da T1 e incluirão designs únicos para cada jogador da equipe campeã. Os fãs aguardam ansiosamente por esses itens colecionáveis que marcarão para sempre a vitória da T1 no cenário mundial.",
            source: "Inven Global",
            date: new Date('2025-08-13T08:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "LazyFeel da DRX Participa de Banquete de Estado Coreia-Vietnã, Fazendo História na LCK",
            url: "https://www.invenglobal.com/articles/19566/drxs-lazyfeel-attends-korea-vietnam-state-banquet-making-lck-history",
            content: "A organização de esports DRX anunciou na segunda-feira que seu jogador de League of Legends Trần Bảo Minh, conhecido no jogo como 'LazyFeel', participou do banquete de estado Coreia-Vietnã em 11 de agosto. Este evento marca um momento histórico para a LCK, sendo a primeira vez que um jogador profissional de League of Legends participa de um evento diplomático oficial de tal magnitude. A presença de LazyFeel simboliza o crescente reconhecimento dos esports como uma ponte cultural entre nações.",
            source: "Inven Global",
            date: new Date('2025-08-13T07:00:00Z').toISOString(),
            translated: true
        }
    ];
    console.log(`getStaticNews: Retornando ${news.length} notícias`);
    return news;
}

export default async function handler(req, res) {
    console.log('API /api/news: Recebida requisição');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        console.log('API /api/news: Respondendo a OPTIONS');
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        console.log('API /api/news: Método não permitido:', req.method);
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        console.log('API /api/news: Buscando notícias do Inven Global...');
        
        // Tentar fazer scraping direto da página
        let news = await scrapeInvenGlobalNews();
        
        // Filtrar notícias a partir de 13/08/2025
        const cutoffDate = new Date('2025-08-13T00:00:00Z');
        news = news.filter(item => {
            const newsDate = new Date(item.date);
            return newsDate >= cutoffDate;
        });

        if (news.length === 0) {
      
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)
