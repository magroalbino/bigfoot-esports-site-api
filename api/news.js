// api/news.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Função de tradução básica para termos comuns
function basicTranslation(text) {
    const translations = {
        'League of Legends': 'League of Legends',
        'Worlds': 'Mundial',
        // ... (mantém o dicionário de traduções existente)
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
        
        // Seletores específicos para o conteúdo do Inven Global
        const contentSelectors = [
            '.article-content', // Seletor principal para o corpo do artigo
            '.content-body',
            '.post-content',
            'article',
            '.entry-content',
            '.article-body'
        ];
        
        let content = '';
        for (const selector of contentSelectors) {
            const elements = $(selector).find('p, h1, h2, h3, h4, h5, h6, li');
            if (elements.length > 0) {
                content = elements
                    .map((i, el) => $(el).text().trim())
                    .get()
                    .filter(text => text.length > 0 && !text.includes('Advertisement') && !text.includes('Subscribe'))
                    .join('\n\n');
                break;
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
        
        for (let i = 0; i < newsItems.length; i++) {
            const item = newsItems.eq(i);
            const titleElement = item.find('h1, h2, h3, h4, .title, .headline').first();
            const linkElement = item.find('a[href*="/articles/"]').first();
            const imageElement = item.find('img').first();
            const dateElement = item.find('time, .date, .published').first();
            
            const title = titleElement.text().trim() || linkElement.text().trim();
            let url = linkElement.attr('href');
            const image = imageElement.attr('src') || imageElement.attr('data-src');
            let date = dateElement.attr('datetime') || dateElement.text().trim() || new Date().toISOString();
            
            if (title && url) {
                const fullUrl = url.startsWith('http') ? url : `https://www.invenglobal.com${url}`;
                // Validar se o URL é um artigo válido
                if (!fullUrl.includes('/articles/')) {
                    console.warn(`URL inválido ignorado: ${fullUrl}`);
                    continue;
                }
                
                const content = await scrapeNewsContent(fullUrl);
                
                // Tentar converter a data para ISO
                try {
                    date = new Date(date).toISOString();
                } catch (e) {
                    console.warn(`Data inválida para ${title}, usando data atual: ${date}`);
                    date = new Date().toISOString();
                }
                
                news.push({
                    title: await translateText(title),
                    url: fullUrl,
                    content,
                    source: 'Inven Global',
                    date,
                    translated: true,
                    image: image && (image.startsWith('http') ? image : `https://www.invenglobal.com${image}`)
                });
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
    const news = [
        {
            title: "Equipe LPL FPX Suspende Milkyway Indefinidamente por Alegações de Vazamento de Pick-Ban",
            url: "https://www.invenglobal.com/articles/19568/lpl-team-fpx-suspends-milkyway-indefinitely-over-pick-ban-leak-allegations",
            content: "...",
            source: "Inven Global",
            date: new Date('2025-08-13T12:00:00Z').toISOString(),
            translated: true,
            image: "https://www.invenglobal.com/assets/images/placeholder.jpg" // Placeholder
        },
        // ... (mantém as notícias estáticas existentes)
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
        
        let news = await scrapeInvenGlobalNews();
        
        // Filtrar notícias a partir de 13/08/2025
        const cutoffDate = new Date('2025-08-13T00:00:00Z');
        news = news.filter(item => {
            const newsDate = new Date(item.date);
            return newsDate >= cutoffDate;
        });

        if (news.length === 0) {
            console.log('API /api/news: Nenhuma notícia recente encontrada, retornando notícias estáticas');
            news = getStaticNews();
        }

        return res.status(200).json({
            success: true,
            news,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API /api/news: Erro ao processar requisição:', error);
        return res.status(500).json({
            success: false,
            error: `Erro interno do servidor: ${error.message}`
        });
    }
}
