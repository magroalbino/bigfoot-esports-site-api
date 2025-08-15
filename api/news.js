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

// Função para extrair a imagem principal do artigo
function extractArticleImage($, url) {
    // Tentar diferentes seletores para imagens
    const imageSelectors = [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        '.article-image img',
        '.featured-image img',
        '.post-thumbnail img',
        'article img:first-of-type',
        '.content img:first-of-type',
        '.article-content img:first-of-type'
    ];

    for (const selector of imageSelectors) {
        const element = $(selector);
        if (element.length > 0) {
            let imageSrc = '';
            if (selector.includes('meta')) {
                imageSrc = element.attr('content');
            } else {
                imageSrc = element.attr('src') || element.attr('data-src');
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
                return imageSrc;
            }
        }
    }
    
    // Imagem padrão se não encontrar nenhuma
    return 'https://www.invenglobal.com/img/ig-logo-light.png';
}

// Função para fazer scraping do conteúdo completo de uma notícia
async function scrapeNewsContent(url) {
    try {
        console.log(`Scraping conteúdo de: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        if (!response.ok) throw new Error(`Falha ao acessar ${url}: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extrair imagem do artigo
        const imageUrl = extractArticleImage($, url);
        
        // Extrair data do artigo
        let articleDate = new Date().toISOString();
        const dateSelectors = [
            'meta[property="article:published_time"]',
            'meta[name="DC.date.issued"]',
            'time[datetime]',
            '.article-date',
            '.publish-date',
            '.post-date'
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
                    const parsedDate = new Date(dateValue);
                    if (!isNaN(parsedDate.getTime())) {
                        articleDate = parsedDate.toISOString();
                        break;
                    }
                }
            }
        }
        
        // Seletores específicos para o Inven Global - melhorados
        let content = '';
        const contentSelectors = [
            '.article-content',
            '.post-content',
            '.entry-content',
            '.article-body',
            '.content-body',
            'article .content',
            '[class*="article"] [class*="content"]'
        ];
        
        for (const selector of contentSelectors) {
            const container = $(selector);
            if (container.length > 0) {
                // Remover elementos indesejados
                container.find('script, style, .advertisement, .social-share, .related-articles, .comments').remove();
                
                // Extrair parágrafos e preservar estrutura
                const paragraphs = container.find('p, h1, h2, h3, h4, h5, h6').map((i, el) => {
                    const $el = $(el);
                    const text = $el.text().trim();
                    
                    // Pular parágrafos muito curtos ou vazios
                    if (text.length < 20) return null;
                    
                    // Adicionar marcação para títulos
                    if ($el.is('h1, h2, h3, h4, h5, h6')) {
                        return `\n## ${text}\n`;
                    }
                    
                    return text;
                }).get().filter(text => text && text.trim());
                
                if (paragraphs.length > 0) {
                    content = paragraphs.join('\n\n');
                    break;
                }
            }
        }
        
        // Fallback: tentar extrair todo o texto do corpo principal
        if (!content) {
            const bodyText = $('body').text();
            const sentences = bodyText.split(/[.!?]+/).filter(sentence => 
                sentence.trim().length > 50 && 
                !sentence.includes('cookie') && 
                !sentence.includes('subscribe') &&
                !sentence.includes('advertisement')
            );
            
            if (sentences.length > 3) {
                content = sentences.slice(0, 10).join('. ') + '.';
            }
        }
        
        if (!content) {
            console.warn(`Nenhum conteúdo encontrado em: ${url}`);
            content = 'Conteúdo não disponível. Acesse o link da notícia para ler a íntegra.';
        }

        // Limpar e formatar conteúdo
        content = content
            .replace(/[\n\s]+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
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

// Função para extrair notícias diretamente da página do Inven Global LoL
async function scrapeInvenGlobalNews() {
    try {
        console.log('Fazendo scraping da página do Inven Global LoL...');
        const response = await fetch('https://www.invenglobal.com/lol', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        if (!response.ok) throw new Error(`Falha ao acessar Inven Global: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const news = [];
        
        // Procurar por links de artigos mais especificamente
        const articleLinks = new Set();
        
        // Tentar diferentes seletores para encontrar links de artigos
        $('a[href*="/articles/"]').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            
            if (href && text && text.length > 20 && !text.includes('READ MORE')) {
                articleLinks.add({
                    url: href.startsWith('http') ? href : `https://www.invenglobal.com${href}`,
                    title: text
                });
            }
        });
        
        // Converter Set para Array e pegar os primeiros 6 artigos
        const articles = Array.from(articleLinks).slice(0, 6);
        
        console.log(`Encontrados ${articles.length} artigos para processar`);
        
        for (const article of articles) {
            try {
                console.log(`Processando: ${article.title}`);
                
                const articleData = await scrapeNewsContent(article.url);
                
                news.push({
                    title: await translateText(article.title),
                    url: article.url,
                    content: articleData.content,
                    image: articleData.image,
                    source: 'Inven Global',
                    date: articleData.date,
                    translated: true
                });
                
                // Delay entre requisições
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Erro ao processar artigo ${article.url}:`, error);
            }
        }
        
        // Ordenar por data (mais recentes primeiro)
        news.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return news;
    } catch (error) {
        console.error('Erro ao fazer scraping do Inven Global:', error);
        return [];
    }
}

// Cache simples em memória para armazenar notícias
let newsCache = {
    data: null,
    timestamp: null,
    ttl: 180000 // 3 minutos
};

// Notícias estáticas como fallback
export function getStaticNews() {
    console.log('getStaticNews: Gerando notícias estáticas...');
    const today = new Date();
    const news = [
        {
            title: "Equipe LPL FPX Suspende Milkyway Indefinidamente por Alegações de Vazamento de Pick-Ban",
            url: "https://www.invenglobal.com/articles/19568/lpl-team-fpx-suspends-milkyway-indefinitely-over-pick-ban-leak-allegations",
            content: "A equipe profissional de jogos da LPL da China, FPX Esports Club, suspendeu indefinidamente seu jogador Cai 'milkyway' Zi-Jun. A suspensão veio após alegações de que ele estava envolvido em manipulação de partidas e vazamento de informações estratégicas durante o processo de pick-ban. O clube anunciou que está conduzindo uma investigação completa sobre as alegações e que tomará as medidas apropriadas com base nos resultados. Esta é uma situação séria que pode ter implicações significativas para a carreira do jogador e para a integridade competitiva da liga. A FPX declarou em comunicado oficial que leva muito a sério qualquer questão relacionada à integridade competitiva e que cooperará totalmente com as autoridades da liga para resolver esta situação. O jogador permanecerá suspenso até que a investigação seja concluída.",
            image: "https://www.invenglobal.com/img/article/19568.jpg",
            source: "Inven Global",
            date: new Date('2025-08-14T12:00:00Z').toISOString(),
            translated: true
        },
        {
            title: "T1 Keria sobre Domínio na Bot Lane e 700ª Vitória LCK do Faker Após Varrer KT Rolster",
            url: "https://www.invenglobal.com/articles/19570/t1-keria-on-bot-lane-dominance-and-fakers-700th-lck-victory-after-sweep-of-kt-rolster",
            content: "O suporte da T1, Ryu 'Keria' Min-seok, participou da entrevista pós-partida após a equipe varrer o KT Rolster por 2-0 na Rodada 4 da temporada regular da LCK 2025, conquistando sua 17ª vitória. Ele refletiu sobre o domínio da dupla bot lane e o marco histórico de Faker alcançar 700 vitórias na LCK. Keria destacou a importância da comunicação e sinergia com seu ADC, bem como o papel fundamental que Faker continua desempenhando na equipe mesmo após tantos anos de carreira. A vitória consolida a posição da T1 como uma das principais candidatas aos playoffs. Durante a entrevista, Keria mencionou que a equipe está focada em manter a consistência e que cada vitória os aproxima mais de seus objetivos para a temporada. Ele também elogiou o desempenho de Faker, dizendo que é uma honra jogar ao lado de uma lenda viva dos esports.",
            image: "https://www.invenglobal.com/img/article/19570.jpg",
            source: "Inven Global",
            date: new Date('2025-08-14T10:30:00Z').toISOString(),
            translated: true
        },
        {
            title: "Finais da LCK 2025 Serão Transmitidas ao Vivo na MBC em Primeira Histórica para Esports Coreanos",
            url: "https://www.invenglobal.com/articles/19569/2025-lck-finals-to-air-live-on-mbc-in-historic-first-for-korean-esports",
            content: "A Liga dos Campeões da Coreia fará sua estreia na TV terrestre no próximo mês, com as Finais da LCK 2025 programadas para serem transmitidas ao vivo na emissora sul-coreana MBC. A melhor de cinco séries começa às 14h KST no domingo. Este é um marco histórico para os esports coreanos, representando o reconhecimento mainstream do League of Legends como um esporte legítimo. A transmissão na TV aberta deve aumentar significativamente a audiência e a exposição dos esports para o público geral coreano. A decisão da MBC de transmitir as finais reflete o crescimento contínuo dos esports na Coreia do Sul e marca um momento decisivo para a legitimação dos jogos eletrônicos como entretenimento mainstream. Espera-se que milhões de telespectadores assistam à transmissão, estabelecendo um novo recorde de audiência para eventos de esports no país.",
            image: "https://www.invenglobal.com/img/article/19569.jpg",
            source: "Inven Global",
            date: new Date('2025-08-14T09:15:00Z').toISOString(),
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
        console.log('API /api/news: Verificando cache...');
        
        // Verificar se existe cache válido
        const now = Date.now();
        if (newsCache.data && newsCache.timestamp && (now - newsCache.timestamp) < newsCache.ttl) {
            console.log('API /api/news: Retornando dados do cache');
            return res.status(200).json({
                success: true,
                news: newsCache.data,
                timestamp: new Date().toISOString(),
                cached: true
            });
        }
        
        console.log('API /api/news: Buscando notícias do Inven Global...');
        
        // Tentar fazer scraping direto da página
        let news = await scrapeInvenGlobalNews();
        
        if (news.length === 0) {
            console.log('API /api/news: Nenhuma notícia encontrada, retornando notícias estáticas');
            news = getStaticNews();
        }
        
        // Atualizar cache
        newsCache.data = news;
        newsCache.timestamp = now;

        // Retornar resposta de sucesso
        return res.status(200).json({
            success: true,
            news,
            timestamp: new Date().toISOString(),
            cached: false
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
        
        return res.status(500).json({
            success: false,
            error: `Erro interno do servidor: ${error.message}`
        });
    }
}
