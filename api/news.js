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
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translatedText = translatedText.replace(regex, portuguese);
    }
    return translatedText;
}

// Função de tradução usando API MyMemory com divisão em chunks
async function translateText(text) {
    if (!text || text.length === 0) return text;
    
    try {
        // Dividir texto em chunks menores para melhor tradução
        const maxChunkSize = 400;
        const chunks = [];
        
        if (text.length <= maxChunkSize) {
            chunks.push(text);
        } else {
            // Dividir por parágrafos primeiro
            const paragraphs = text.split(/\n\s*\n/);
            let currentChunk = '';
            
            for (const paragraph of paragraphs) {
                if ((currentChunk + paragraph).length <= maxChunkSize) {
                    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
                } else {
                    if (currentChunk) chunks.push(currentChunk);
                    currentChunk = paragraph;
                }
            }
            if (currentChunk) chunks.push(currentChunk);
        }

        const translatedChunks = [];
        
        for (const chunk of chunks) {
            const encodedText = encodeURIComponent(chunk);
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|pt`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
                    },
                    timeout: 10000
                }
            );

            if (!response.ok) throw new Error(`Translation API failed: ${response.status}`);

            const data = await response.json();
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                translatedChunks.push(data.responseData.translatedText);
            } else {
                translatedChunks.push(basicTranslation(chunk));
            }
            
            // Delay entre requisições para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return translatedChunks.join('\n\n');
    } catch (error) {
        console.error('Erro na tradução:', error);
        return basicTranslation(text);
    }
}

// Função melhorada para extrair a imagem principal do artigo
function extractArticleImage($, url) {
    const imageSelectors = [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        '.article-image img',
        '.featured-image img',
        '.hero-image img',
        '.post-thumbnail img',
        'article img:first-of-type',
        '.content img:first-of-type',
        '.article-content img:first-of-type',
        '.entry-content img:first-of-type',
        'img[src*="invenglobal"]'
    ];

    for (const selector of imageSelectors) {
        const element = $(selector);
        if (element.length > 0) {
            let imageSrc = '';
            if (selector.includes('meta')) {
                imageSrc = element.attr('content');
            } else {
                imageSrc = element.attr('src') || element.attr('data-src') || element.attr('data-lazy-src');
            }
            
            if (imageSrc) {
                // Converter URL relativa para absoluta
                if (imageSrc.startsWith('//')) {
                    imageSrc = 'https:' + imageSrc;
                } else if (imageSrc.startsWith('/')) {
                    const baseUrl = new URL(url);
                    imageSrc = baseUrl.origin + imageSrc;
                } else if (!imageSrc.startsWith('http')) {
                    const baseUrl = new URL(url);
                    imageSrc = baseUrl.origin + '/' + imageSrc;
                }
                
                // Verificar se é uma imagem válida
                if (imageSrc.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
                    return imageSrc;
                }
            }
        }
    }
    
    // Imagem padrão se não encontrar nenhuma
    return 'https://www.invenglobal.com/img/ig-logo-light.png';
}

// Função melhorada para extrair a data do artigo
function extractArticleDate($, url) {
    const dateSelectors = [
        'meta[property="article:published_time"]',
        'meta[property="article:published"]',
        'meta[name="DC.date.issued"]',
        'meta[name="publish_date"]',
        'time[datetime]',
        '.article-date',
        '.publish-date',
        '.post-date',
        '.date',
        '.published',
        '[class*="date"]'
    ];
    
    for (const selector of dateSelectors) {
        const element = $(selector);
        if (element.length > 0) {
            let dateValue = '';
            if (selector.includes('meta')) {
                dateValue = element.attr('content');
            } else if (selector === 'time[datetime]') {
                dateValue = element.attr('datetime');
            } else {
                dateValue = element.text().trim();
            }
            
            if (dateValue) {
                // Tentar parsear diferentes formatos de data
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString();
                }
                
                // Tentar parsear formato manual
                const dateMatch = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                    const [, month, day, year] = dateMatch;
                    const date = new Date(year, month - 1, day);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString();
                    }
                }
            }
        }
    }
    
    // Fallback para data atual
    return new Date().toISOString();
}

// Função melhorada para fazer scraping do conteúdo completo de uma notícia
async function scrapeNewsContent(url) {
    try {
        console.log(`Scraping conteúdo de: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 20000
        });
        
        if (!response.ok) throw new Error(`Falha ao acessar ${url}: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extrair imagem do artigo
        const imageUrl = extractArticleImage($, url);
        
        // Extrair data do artigo
        const articleDate = extractArticleDate($, url);
        
        // Seletores específicos para o Inven Global e sites similares
        let content = '';
        const contentSelectors = [
            '.article-content',
            '.article-body',
            '.post-content',
            '.entry-content',
            '.content-body',
            '.article-text',
            'article .content',
            '[class*="article"] [class*="content"]',
            '.post-body',
            'main article',
            '.single-content'
        ];
        
        for (const selector of contentSelectors) {
            const container = $(selector);
            if (container.length > 0) {
                // Remover elementos indesejados
                container.find('script, style, .advertisement, .ads, .social-share, .related-articles, .comments, .sidebar, .navigation, .footer, .header').remove();
                
                // Extrair todo o texto preservando parágrafos
                const textElements = container.find('p, h1, h2, h3, h4, h5, h6, div').map((i, el) => {
                    const $el = $(el);
                    const text = $el.text().trim();
                    
                    // Pular elementos muito curtos, vazios ou que são claramente não-conteúdo
                    if (text.length < 15 || 
                        text.includes('Advertisement') ||
                        text.includes('Subscribe') ||
                        text.includes('Follow us') ||
                        text.includes('Share') ||
                        text.includes('Read more') ||
                        text.match(/^(Tags?|Category|Categories):/i)) {
                        return null;
                    }
                    
                    // Adicionar marcação para títulos
                    if ($el.is('h1, h2, h3, h4, h5, h6')) {
                        return `\n## ${text}\n`;
                    }
                    
                    return text;
                }).get().filter(text => text && text.trim());
                
                if (textElements.length > 2) {
                    content = textElements.join('\n\n');
                    break;
                }
            }
        }
        
        // Fallback mais agressivo: extrair do body principal
        if (!content || content.length < 200) {
            console.log('Tentando fallback para extração de conteúdo...');
            const bodyText = $('body').text();
            const sentences = bodyText.split(/[.!?]+/).filter(sentence => {
                const trimmed = sentence.trim();
                return trimmed.length > 30 && 
                       !trimmed.includes('cookie') && 
                       !trimmed.includes('subscribe') &&
                       !trimmed.includes('advertisement') &&
                       !trimmed.includes('Follow') &&
                       !trimmed.includes('Share') &&
                       !trimmed.match(/^(Home|News|Sports|About|Contact)/i);
            });
            
            if (sentences.length > 5) {
                content = sentences.slice(0, 15).join('. ') + '.';
            }
        }
        
        if (!content || content.length < 100) {
            console.warn(`Conteúdo insuficiente encontrado em: ${url}`);
            content = 'Conteúdo não disponível para extração automática. Acesse o link da notícia para ler a íntegra.';
        }

        // Limpar e formatar conteúdo
        content = content
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();

        // Traduzir conteúdo
        const translatedContent = await translateText(content);
        
        return {
            content: translatedContent,
            image: imageUrl,
            date: articleDate
        };
        
    } catch (error) {
        console.error(`Erro ao fazer scraping de ${url}:`, error);
        return {
            content: 'Conteúdo não disponível devido a um erro de extração.',
            image: 'https://www.invenglobal.com/img/ig-logo-light.png',
            date: new Date().toISOString()
        };
    }
}

// Função melhorada para extrair notícias do Inven Global
async function scrapeInvenGlobalNews() {
    try {
        console.log('Fazendo scraping da página do Inven Global LoL...');
        const response = await fetch('https://www.invenglobal.com/lol', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 20000
        });
        
        if (!response.ok) throw new Error(`Falha ao acessar Inven Global: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const news = [];
        const articleLinks = new Set();
        
        // Múltiplos seletores para capturar diferentes tipos de links de artigos
        const selectors = [
            'a[href*="/articles/"]',
            'a[href*="/lol/article/"]',
            '.article-link',
            '.news-link',
            '.post-link'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, el) => {
                const $el = $(el);
                let href = $el.attr('href');
                
                if (!href) return;
                
                // Construir URL absoluta
                if (href.startsWith('/')) {
                    href = 'https://www.invenglobal.com' + href;
                } else if (!href.startsWith('http')) {
                    href = 'https://www.invenglobal.com/' + href;
                }
                
                // Extrair título do artigo
                let title = $el.text().trim();
                
                // Se não encontrou título no link, tentar elementos próximos
                if (!title || title.length < 10) {
                    title = $el.find('h1, h2, h3, h4, h5, h6').text().trim() ||
                           $el.siblings('h1, h2, h3, h4, h5, h6').text().trim() ||
                           $el.parent().find('h1, h2, h3, h4, h5, h6').text().trim() ||
                           $el.attr('title') ||
                           $el.attr('alt');
                }
                
                // Verificar se é um artigo válido
                if (href.includes('/articles/') && 
                    title && 
                    title.length > 20 && 
                    !title.toLowerCase().includes('read more') &&
                    !title.toLowerCase().includes('continue reading') &&
                    !title.toLowerCase().includes('click here')) {
                    
                    articleLinks.add({
                        url: href,
                        title: title.substring(0, 200) // Limitar tamanho do título
                    });
                }
            });
        });
        
        // Também tentar capturar da seção de notícias principais
        $('.news-item, .article-item, .post-item, .content-item').each((i, el) => {
            const $el = $(el);
            const link = $el.find('a').first();
            const titleEl = $el.find('h1, h2, h3, h4, h5, h6').first();
            
            if (link.length && titleEl.length) {
                let href = link.attr('href');
                const title = titleEl.text().trim();
                
                if (href && title && title.length > 20) {
                    if (href.startsWith('/')) {
                        href = 'https://www.invenglobal.com' + href;
                    }
                    
                    if (href.includes('/articles/')) {
                        articleLinks.add({
                            url: href,
                            title: title.substring(0, 200)
                        });
                    }
                }
            }
        });
        
        // Converter Set para Array e pegar os artigos mais recentes
        const articles = Array.from(articleLinks).slice(0, 8);
        
        console.log(`Encontrados ${articles.length} artigos para processar`);
        
        if (articles.length === 0) {
            console.warn('Nenhum artigo encontrado na página principal');
            return [];
        }
        
        for (const article of articles) {
            try {
                console.log(`Processando: ${article.title.substring(0, 50)}...`);
                
                const articleData = await scrapeNewsContent(article.url);
                
                // Só adicionar se conseguiu extrair conteúdo útil
                if (articleData.content.length > 100) {
                    news.push({
                        title: await translateText(article.title),
                        url: article.url,
                        content: articleData.content,
                        image: articleData.image,
                        source: 'Inven Global',
                        date: articleData.date,
                        translated: true
                    });
                }
                
                // Delay entre requisições para evitar sobrecarga
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (error) {
                console.error(`Erro ao processar artigo ${article.url}:`, error);
            }
        }
        
        // Ordenar por data (mais recentes primeiro)
        news.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`Processamento concluído: ${news.length} notícias extraídas`);
        return news;
        
    } catch (error) {
        console.error('Erro ao fazer scraping do Inven Global:', error);
        return [];
    }
}

// Cache aprimorado
let newsCache = {
    data: null,
    timestamp: null,
    ttl: 120000 // 2 minutos
};

// Notícias estáticas como fallback melhoradas
export function getStaticNews() {
    console.log('getStaticNews: Gerando notícias estáticas...');
    const today = new Date();
    const news = [
        {
            title: "Sistema de Notícias em Manutenção",
            url: "https://www.invenglobal.com/lol",
            content: "O sistema de extração de notícias está temporariamente indisponível para manutenção. Durante este período, as notícias mais recentes podem não estar sendo exibidas. Recomendamos verificar diretamente o site do Inven Global para as últimas atualizações sobre League of Legends. O sistema será restaurado em breve com melhorias na detecção automática de novas matérias e na qualidade da tradução. Agradecemos pela compreensão.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Sistema",
            date: today.toISOString(),
            translated: false
        }
    ];
    console.log(`getStaticNews: Retornando ${news.length} notícias de fallback`);
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
        console.log('API /api/news: Verificando cache...');
        
        // Verificar se existe cache válido
        const now = Date.now();
        const forceRefresh = req.query.t; // Parâmetro para forçar atualização
        
        if (!forceRefresh && newsCache.data && newsCache.timestamp && (now - newsCache.timestamp) < newsCache.ttl) {
            console.log('API /api/news: Retornando dados do cache');
            return res.status(200).json({
                success: true,
                news: newsCache.data,
                timestamp: new Date().toISOString(),
                cached: true
            });
        }
        
        console.log('API /api/news: Buscando notícias atualizadas do Inven Global...');
        
        // Tentar fazer scraping direto da página
        let news = await scrapeInvenGlobalNews();
        
        if (news.length === 0) {
            console.log('API /api/news: Nenhuma notícia encontrada, retornando notícias estáticas');
            news = getStaticNews();
        }
        
        // Atualizar cache
        newsCache.data = news;
        newsCache.timestamp = now;

        console.log(`API /api/news: Retornando ${news.length} notícias`);

        // Retornar resposta de sucesso
        return res.status(200).json({
            success: true,
            news,
            timestamp: new Date().toISOString(),
            cached: false,
            totalFound: news.length
        });
        
    } catch (error) {
        console.error('API /api/news: Erro ao processar requisição:', error);
        
        // Em caso de erro, tentar retornar do cache se existir
        if (newsCache.data) {
            return res.status(200).json({
                success: true,
                news: newsCache.data,
                timestamp: new Date().toISOString(),
                cached: true,
                warning: 'Dados do cache devido a erro na atualização'
            });
        }
        
        // Se não há cache, retornar notícias estáticas
        return res.status(200).json({
            success: true,
            news: getStaticNews(),
            timestamp: new Date().toISOString(),
            cached: false,
            warning: 'Dados estáticos devido a erro no sistema'
        });
    }
}
