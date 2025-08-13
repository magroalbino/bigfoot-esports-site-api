// api/news.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('API chamada recebida');
    
    // Por enquanto, vamos retornar sempre as notícias estáticas traduzidas
    const staticNews = getStaticNews();
    
    console.log(`Retornando ${staticNews.length} notícias`);
    
    res.status(200).json({
      success: true,
      news: staticNews,
      timestamp: new Date().toISOString(),
      total: staticNews.length,
      note: 'Dados estáticos em português'
    });

  } catch (error) {
    console.error('Erro na API:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Notícias estáticas traduzidas
function getStaticNews() {
  return [
    {
      title: "Riot Games Define Lançamento das Skins do T1 para Setembro",
      url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
      content: "A Riot Games anunciou que as novas skins do T1, campeão mundial, serão lançadas em setembro. As skins celebram a vitória histórica da equipe no Mundial de 2023 e incluem efeitos especiais únicos para cada campeão escolhido pelos jogadores.",
      source: "Inven Global",
      date: new Date().toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O jogador LazyFeel do DRX se tornou o primeiro jogador profissional de League of Legends a participar de um banquete oficial entre Coreia do Sul e Vietnã, marcando um momento histórico para os esports na região.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "Uma parceria histórica entre a LCK e o Ministério dos Veteranos celebra o 80º aniversário da libertação da Coreia com um evento especial no LoL PARK, unindo esports e história nacional.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Tudo Sobre a 3ª Temporada de League of Legends",
      url: "https://www.invenglobal.com/lol/articles/19560/everything-to-know-about-league-of-legends-season-3",
      content: "Um guia completo sobre as mudanças, novos recursos e expectativas para a terceira temporada de League of Legends, incluindo atualizações de gameplay e novos campeões.",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Gen.G Garante Vaga Direta nos Playoffs com Sequência de Quatro Vitórias na 4ª Rodada da LCK",
      url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry-with-four-game-streak-in-lck-round-4",
      content: "A equipe Gen.G conquistou uma sequência impressionante de quatro vitórias consecutivas, garantindo sua classificação direta para os playoffs da LCK e se posicionando como forte candidata ao título.",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString(),
      translated: true
    },
    {
      title: "Viper Reflete Sobre o Marco de 500 Jogos na LCK",
      url: "https://www.invenglobal.com/lol/articles/19553/viper-reflects-on-upcoming-500-game-lck-milestone",
      content: "O lendário ADC Viper está prestes a alcançar a marca histórica de 500 jogos na LCK, refletindo sobre sua jornada e os momentos mais marcantes de sua carreira no cenário competitivo coreano.",
      source: "Inven Global",
      date: new Date(Date.now() - 18000000).toISOString(),
      translated: true
    },
    {
      title: "Datas de Lançamento do Riftbound: Spiritforged",
      url: "https://www.invenglobal.com/lol/articles/19551/riftbound-spiritforged-release-dates",
      content: "A Riot Games revelou as datas oficiais de lançamento do novo modo de jogo Riftbound: Spiritforged, trazendo uma experiência única que combina elementos tradicionais do LoL com mecânicas inovadoras.",
      source: "Inven Global",
      date: new Date(Date.now() - 21600000).toISOString(),
      translated: true
    },
    {
      title: "Canyon Após Derrotar o T1: 'Estou feliz com a vitória de hoje, mas no final temos que vencer no Mundial'",
      url: "https://www.invenglobal.com/lol/articles/19550/canyon-after-defeating-t1-im-happy-about-todays-win-but-in-the-end-we-have-to-win-at-worlds",
      content: "O jungler Canyon do DWG KIA celebra a vitória contra o T1, mas mantém o foco no objetivo maior: conquistar o título mundial. Suas declarações revelam a mentalidade vencedora da equipe.",
      source: "Inven Global",
      date: new Date(Date.now() - 25200000).toISOString(),
      translated: true
    }
  ];
}

// Parser para RSS com conteúdo
async function parseRSS(xmlText, sourceName) {
  try {
    const news = [];
    
    // Regex para extrair informações do RSS
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
    const titleRegex = /<title[^>]*>(.*?)<\/title>/s;
    const linkRegex = /<link[^>]*>(.*?)<\/link>/s;
    const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/s;
    const descriptionRegex = /<description[^>]*>(.*?)<\/description>/s;
    const contentRegex = /<content:encoded[^>]*>(.*?)<\/content:encoded>/s;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && news.length < 10) {
      const itemContent = match[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const dateMatch = pubDateRegex.exec(itemContent);
      const descriptionMatch = descriptionRegex.exec(itemContent);
      const contentMatch = contentRegex.exec(itemContent);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        let content = '';
        
        if (contentMatch) {
          content = contentMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
        } else if (descriptionMatch) {
          content = descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
        }

        // Limpar HTML do conteúdo
        content = content
          .replace(/<[^>]*>/g, '') // Remove tags HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
          .substring(0, 300); // Limita a 300 caracteres

        news.push({
          title: title,
          url: linkMatch[1].trim(),
          content: content,
          source: sourceName,
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
        });
      }
    }

    return news;
  } catch (error) {
    console.error('Erro ao fazer parse do RSS:', error);
    return [];
  }
}

// Parser para JSON com conteúdo
async function parseJSON(data, sourceName) {
  try {
    const news = [];
    
    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles.slice(0, 10)) {
        let content = article.description || article.summary || article.content || '';
        
        // Limpar HTML do conteúdo
        content = content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
          .substring(0, 300);

        news.push({
          title: article.title || article.headline,
          url: article.url || article.link,
          content: content,
          source: sourceName,
          date: article.publishedAt || article.date || new Date().toISOString()
        });
      }
    }

    return news;
  } catch (error) {
    console.error('Erro ao fazer parse do JSON:', error);
    return [];
  }
}

// Função de tradução usando API gratuita
async function translateText(text) {
  if (!text || text.length === 0) return text;
  
  try {
    // Usar MyMemory API (gratuita)
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

    if (!response.ok) throw new Error('Translation API failed');

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    
    throw new Error('Invalid translation response');
    
  } catch (error) {
    console.error('Erro na tradução:', error);
    
    // Fallback: tradução básica manual para termos comuns do LoL
    return basicTranslation(text);
  }
}

// Tradução básica manual para termos comuns
function basicTranslation(text) {
  const translations = {
    // Termos do LoL
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

// Notícias estáticas para fallback (já em português)
function getStaticNews() {
  return [
    {
      title: "Riot Games Define Lançamento das Skins do T1 para Setembro",
      url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
      content: "A Riot Games anunciou que as novas skins do T1, campeão mundial, serão lançadas em setembro. As skins celebram a vitória histórica da equipe no Mundial de 2023 e incluem efeitos especiais únicos para cada campeão escolhido pelos jogadores.",
      source: "Inven Global",
      date: new Date().toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O jogador LazyFeel do DRX se tornou o primeiro jogador profissional de League of Legends a participar de um banquete oficial entre Coreia do Sul e Vietnã, marcando um momento histórico para os esports na região.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "Uma parceria histórica entre a LCK e o Ministério dos Veteranos celebra o 80º aniversário da libertação da Coreia com um evento especial no LoL PARK, unindo esports e história nacional.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Tudo Sobre a 3ª Temporada de League of Legends",
      url: "https://www.invenglobal.com/lol/articles/19560/everything-to-know-about-league-of-legends-season-3",
      content: "Um guia completo sobre as mudanças, novos recursos e expectativas para a terceira temporada de League of Legends, incluindo atualizações de gameplay e novos campeões.",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Gen.G Garante Vaga Direta nos Playoffs com Sequência de Quatro Vitórias na 4ª Rodada da LCK",
      url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry-with-four-game-streak-in-lck-round-4",
      content: "A equipe Gen.G conquistou uma sequência impressionante de quatro vitórias consecutivas, garantindo sua classificação direta para os playoffs da LCK e se posicionando como forte candidata ao título.",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString(),
      translated: true
    },
    {
      title: "Viper Reflete Sobre o Marco de 500 Jogos na LCK",
      url: "https://www.invenglobal.com/lol/articles/19553/viper-reflects-on-upcoming-500-game-lck-milestone",
      content: "O lendário ADC Viper está prestes a alcançar a marca histórica de 500 jogos na LCK, refletindo sobre sua jornada e os momentos mais marcantes de sua carreira no cenário competitivo coreano.",
      source: "Inven Global",
      date: new Date(Date.now() - 18000000).toISOString(),
      translated: true
    },
    {
      title: "Datas de Lançamento do Riftbound: Spiritforged",
      url: "https://www.invenglobal.com/lol/articles/19551/riftbound-spiritforged-release-dates",
      content: "A Riot Games revelou as datas oficiais de lançamento do novo modo de jogo Riftbound: Spiritforged, trazendo uma experiência única que combina elementos tradicionais do LoL com mecânicas inovadoras.",
      source: "Inven Global",
      date: new Date(Date.now() - 21600000).toISOString(),
      translated: true
    },
    {
      title: "Canyon Após Derrotar o T1: 'Estou feliz com a vitória de hoje, mas no final temos que vencer no Mundial'",
      url: "https://www.invenglobal.com/lol/articles/19550/canyon-after-defeating-t1-im-happy-about-todays-win-but-in-the-end-we-have-to-win-at-worlds",
      content: "O jungler Canyon do DWG KIA celebra a vitória contra o T1, mas mantém o foco no objetivo maior: conquistar o título mundial. Suas declarações revelam a mentalidade vencedora da equipe.",
      source: "Inven Global",
      date: new Date(Date.now() - 25200000).toISOString(),
      translated: true
    },
    {
      title: "Faker Destaca Crescimento do T1 Apesar da Derrota por 1-2 para o Gen.G, Promete Retorno Mais Forte",
      url: "https://www.invenglobal.com/lol/articles/19549/faker-spotlights-t1s-growth-despite-12-setback-to-geng-vows-stronger-comeback",
      content: "Mesmo após a derrota para o Gen.G, Faker mantém o otimismo e destaca o crescimento contínuo da equipe. O lendário mid laner promete que o T1 voltará mais forte nas próximas partidas.",
      source: "Inven Global",
      date: new Date(Date.now() - 28800000).toISOString(),
      translated: true
    },
    {
      title: "Hanwha Life Esports Consegue Vitória de 2-0 Sobre a Nongshim RedForce e Garante Vaga nos Playoffs da LCK",
      url: "https://www.invenglobal.com/lol/articles/19543/hanwha-life-esports-clinches-20-sweep-over-nongshim-redforce-to-secure-lck-playoff-berth",
      content: "A Hanwha Life Esports demonstrou superioridade tática ao vencer por 2-0 a Nongshim RedForce, garantindo oficialmente sua classificação para os playoffs da LCK em uma performance dominante.",
      source: "Inven Global",
      date: new Date(Date.now() - 32400000).toISOString(),
      translated: true
    }
  ];
}
