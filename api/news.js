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

// Notícias mais recentes atualizadas com base no Inven Global
export function getRecentNews() {
    console.log('getRecentNews: Carregando as 5 notícias mais recentes...');
    const news = [
        {
            title: "cvMax sobre Vitória 2-0 Contra DRX, Marco de ShowMaker e Debate Rise vs Legend Group",
            url: "https://www.invenglobal.com/articles/19580/dk-coach-kim-dae-ho-on-20-win-over-drx-showmakers-milestone-and-rise-vs-legend-group-debate",
            content: "A Dplus KIA derrotou a DRX por 2-0 para alcançar 15-10 na temporada. Com a vitória de hoje, Heo 'ShowMaker' Su também atingiu 400 kills na LCK, e o resultado ajudou a equipe a consolidar ainda mais sua posição de primeiro lugar. O treinador cvMax comentou sobre a performance da equipe e o marco histórico de ShowMaker, que se tornou um dos poucos jogadores a atingir essa marca impressionante na liga coreana. A discussão também abordou o debate entre os grupos Rise e Legend, e as perspectivas da equipe para os próximos jogos. ShowMaker continua sendo uma peça fundamental para o sucesso da Dplus KIA, demonstrando consistência e habilidade excepcionais ao longo de sua carreira na LCK.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Inven Global",
            date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
            translated: true
        },
        {
            title: "Busca da T1 pelo 2º Lugar: kkOma Fala sobre Foco, Crescimento de Doran e Yunara de Gumayusi",
            url: "https://www.invenglobal.com/articles/19576/t1s-push-for-2nd-place-kkoma-talks-focus-dorans-growth-and-gumayusis-yunara",
            content: "Após a vitória por 2-0 da T1 sobre a Hanwha Life Esports, o técnico principal Kim 'kkOma' Jeong-gyun e o top laner Choi 'Doran' Hyeon-joon participaram da entrevista pós-jogo. Eles refletiram sobre a vitória, falaram sobre o foco da equipe e reiteraram sua determinação para defender o segundo lugar. A discussão também tocou na contínua ausência da muito aguardada Yunara de Gumayusi. kkOma descreveu o resultado como profundamente satisfatório, especialmente dado o peso da partida. Ele observou que, embora a equipe tenha enfrentado momentos difíceis, conseguiram manter a compostura, virar o jogo e terminar forte. Doran também comentou sobre seu desenvolvimento pessoal e como tem se adaptado às demandas da equipe.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Inven Global",
            date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
            translated: true
        },
        {
            title: "Nongshim RedForce Sofre 7ª Derrota Consecutiva em 2025 LCK Enquanto Gen.G Domina em Vitórias de 24 Minutos",
            url: "https://www.invenglobal.com/lol",
            content: "A queda da Nongshim RedForce continua. A Nongshim perdeu por 0-2 para a Gen.G em uma partida da 4ª rodada da LCK 2025 no LoL Park em Jonggak, Seul, no dia 14. Apáticos durante toda a série, eles perderam tanto o Jogo 1 quanto o Jogo 2 em performances dominantes da Gen.G que duraram aproximadamente 24 minutos cada. Esta marca a sétima derrota consecutiva da equipe, levantando questões sobre sua forma atual e estratégia. A Gen.G mostrou por que são considerados uma das equipes mais fortes da liga, com uma execução precisa e controle de jogo exemplar. A Nongshim RedForce precisará encontrar uma maneira de quebrar essa sequência negativa se quiser competir pelos playoffs.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Inven Global",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
            translated: true
        },
        {
            title: "Técnico da Gen.G Kim Enfatiza Foco nos Playoffs Após Vitória 2-0 Sobre Nongshim RedForce",
            url: "https://www.invenglobal.com/lol",
            content: "A Gen.G garantiu uma vitória por 2-0 contra a Nongshim RedForce na 4ª rodada da LCK 2025 no LoL Park em Jonggak, Seul, no dia 14. A vitória dominante durou menos de uma hora no total em ambos os jogos. O técnico Kim da Gen.G enfatizou a importância de manter o foco nos playoffs que se aproximam, apesar das vitórias convincentes. Ele destacou que a equipe não pode se acomodar com essas performances e deve continuar melhorando para enfrentar os desafios dos playoffs. A Gen.G continua demonstrando sua força como uma das principais contendoras ao título da LCK, mas o técnico mantém os pés no chão e foca nos objetivos de longo prazo da equipe.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Inven Global",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
            translated: true
        },
        {
            title: "Equipe LPL FPX Suspende Milkyway Indefinidamente Por Alegações de Vazamento de Pick-Ban",
            url: "https://www.invenglobal.com/lol",
            content: "A equipe profissional chinesa de LPL, FPX Esports Club, suspendeu indefinidamente seu jogador Cai 'milkyway' Zi-Jun. A suspensão veio após alegações de que ele estava envolvido em manipulação de resultados e vazamento de informações confidenciais de pick-ban para terceiros. Esta é uma das situações mais sérias envolvendo integridade competitiva na LPL recentemente. A FPX declarou que está cooperando totalmente com as investigações da Riot Games e da liga, e que tomará todas as medidas necessárias para manter a integridade da competição. O caso destaca a importância da integridade competitiva no cenário profissional de League of Legends e as sérias consequências para jogadores que violam as regras estabelecidas.",
            image: "https://www.invenglobal.com/img/ig-logo-light.png",
            source: "Inven Global",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
            translated: true
        }
    ];

    console.log(`getRecentNews: Retornando ${news.length} notícias atualizadas`);
    return news;
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
