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
        'August': 'agosto'
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
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
            }
        });
        if (!response.ok) throw new Error(`Falha ao acessar ${url}: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Seletor para o conteúdo principal do artigo (ajuste conforme o HTML do Inven Global)
        const contentElement = $('.article-content, .post-content, article p');
        let content = contentElement
            .map((i, el) => $(el).text().trim())
            .get()
            .filter(text => text.length > 0)
            .join('\n\n');
        
        if (!content) {
            console.warn(`Nenhum conteúdo encontrado em: ${url}`);
            content = 'Conteúdo não disponível.';
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

// Parser para RSS com scraping do conteúdo completo
async function parseRSS(xmlText, sourceName) {
    try {
        const news = [];
        const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
        const titleRegex = /<title[^>]*>(.*?)<\/title>/s;
        const linkRegex = /<link[^>]*>(.*?)<\/link>/s;
        const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/s;

        let match;
        while ((match = itemRegex.exec(xmlText)) !== null && news.length < 5) {
            const itemContent = match[1];
            const titleMatch = titleRegex.exec(itemContent);
            const linkMatch = linkRegex.exec(itemContent);
            const dateMatch = pubDateRegex.exec(itemContent);

            if (titleMatch && linkMatch) {
                const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                const url = linkMatch[1].trim();
                const content = await scrapeNewsContent(url); // Scraping do conteúdo completo
                
                news.push({
                    title: await translateText(title),
                    url,
                    content,
                    source: sourceName,
                    date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
                    translated: true
                });
            }
        }

        return news;
    } catch (error) {
        console.error('Erro ao fazer parse do RSS:', error);
        return [];
    }
}

// Parser para JSON com scraping do conteúdo completo
async function parseJSON(data, sourceName) {
    try {
        const news = [];
        if (data.articles && Array.isArray(data.articles)) {
            for (const article of data.articles.slice(0, 5)) {
                const content = await scrapeNewsContent(article.url || article.link);
                news.push({
                    title: await translateText(article.title || article.headline),
                    url: article.url || article.link,
                    content,
                    source: sourceName,
                    date: article.publishedAt || article.date || new Date().toISOString(),
                    translated: true
                });
            }
        }
        return news;
    } catch (error) {
        console.error('Erro ao fazer parse do JSON:', error);
        return [];
    }
}

// Notícias estáticas como fallback (baseadas em)[](https://www.invenglobal.com/latest)
export function getStaticNews() {
    console.log('getStaticNews: Gerando notícias estáticas...');
    const today = new Date();
    const news = [
        {
            title: "BLAST e Singapore Tourism Board Assinam Acordo Plurianual para Eventos de Esports",
            url: "https://www.invenglobal.com/articles/19568/blast-singapore-tourism-board-ink-multi-year-esports-event-agreement",
            content: "Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.",
            source: "Inven Global",
            date: new Date('2025-08-13T12:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Nexon Revela Woochi the Wayfarer, um RPG de Ação da Era Joseon Baseado em Jeon Woo-chi",
            url: "https://www.invenglobal.com/articles/19570/nexon-reveals-woochi-the-wayfarer-a-joseon-era-action-rpg-based-on-jeon-woo-chi",
            content: "Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.",
            source: "Inven Global",
            date: new Date('2025-08-08T10:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Neowiz Acelera Desenvolvimento da Sequência de Lies of P e Inicia Recrutamento de Pessoal",
            url: "https://www.invenglobal.com/articles/19569/neowiz-accelerates-development-of-lies-of-p-sequel-begins-recruiting-core-personnel",
            content: "Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.",
            source: "Inven Global",
            date: new Date('2025-08-08T09:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Viper Reflete Sobre o Marco de 500 Jogos na LCK",
            url: "https://www.invenglobal.com/articles/19567/viper-reflects-on-upcoming-500-game-lck-milestone",
            content: "Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.",
            source: "Inven Global",
            date: new Date('2025-08-08T08:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "Arsenal Renova Acordo com Konami eFootball, Nomeando Martin Ødegaard como Embaixador",
            url: "https://www.invenglobal.com/articles/19566/arsenal-renews-konami-efootball-deal-as-martin-odegaard-named-ambassador",
            content: "Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.",
            source: "Inven Global",
            date: new Date('2025-08-08T07:00:00Z').toISOString(),
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
        const response = await fetch('https://www.invenglobal.com/rss.xml', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
            }
        });
        if (!response.ok) throw new Error(`Falha ao acessar RSS: ${response.status}`);

        const xmlText = await response.text();
        const news = await parseRSS(xmlText, 'Inven Global');

        if (news.length === 0) {
            console.warn('Nenhuma notícia encontrada no RSS. Usando fallback.');
            const staticNews = getStaticNews();
            return res.status(200).json({
                success: true,
                news: staticNews,
                timestamp: new Date().toISOString(),
                total: staticNews.length,
                note: 'Notícias estáticas (fallback) do Inven Global'
            });
        }

        console.log(`API /api/news: Retornando ${news.length} notícias`);
        res.status(200).json({
            success: true,
            news: news.slice(0, 5), // Limitar a 5 notícias
            timestamp: new Date().toISOString(),
            total: news.length,
            note: 'Notícias diárias do Inven Global'
        });
    } catch (error) {
        console.error('API /api/news: Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
}
