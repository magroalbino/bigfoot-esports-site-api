// api/news.js

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

// Função de tradução usando API gratuita
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

    if (!response.ok) throw new Error('Translation API failed');

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

// Parser para RSS com conteúdo completo
async function parseRSS(xmlText, sourceName) {
  try {
    const news = [];
    
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

        content = content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        news.push({
          title: title,
          url: linkMatch[1].trim(),
          content: content,
          source: sourceName,
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
        });
      }
    }

    for (const item of news) {
      item.title = await translateText(item.title);
      item.content = await translateText(item.content);
      item.translated = true;
    }

    return news;
  } catch (error) {
    console.error('Erro ao fazer parse do RSS:', error);
    return [];
  }
}

// Parser para JSON com conteúdo completo
async function parseJSON(data, sourceName) {
  try {
    const news = [];
    
    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles.slice(0, 10)) {
        let content = article.content || article.description || article.summary || '';
        
        content = content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        const translatedContent = await translateText(content);
        const translatedTitle = await translateText(article.title || article.headline);

        news.push({
          title: translatedTitle,
          url: article.url || article.link,
          content: translatedContent,
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

// Notícias estáticas com conteúdo completo
function getStaticNews() {
  return [
    {
      title: "Riot Games Define Lançamento das Skins do T1 para Setembro",
      url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
      content: "A Riot Games anunciou que as novas skins do T1, campeão mundial, serão lançadas em setembro. As skins celebram a vitória histórica da equipe no Mundial de 2023, onde derrotaram adversários de peso em uma final emocionante.\n\nCada skin reflete a identidade de um jogador do T1, com efeitos visuais únicos que homenageiam suas performances no torneio. A coleção inclui skins para campeões como Orianna, Jayce, e outros escolhidos pelos jogadores. Além disso, a Riot confirmou que parte da receita das vendas será destinada à equipe T1, apoiando o crescimento dos esports na Coreia do Sul. A comunidade está ansiosa pelo lançamento, com fãs especulando sobre possíveis eventos in-game para acompanhar as skins.",
      source: "Inven Global",
      date: new Date().toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O jogador LazyFeel, da equipe DRX, marcou um momento histórico ao se tornar o primeiro jogador profissional de League of Legends a participar de um banquete oficial entre Coreia do Sul e Vietnã. O evento, realizado em Seul, celebrou as relações diplomáticas entre os dois países.\n\nLazyFeel, conhecido por sua habilidade como mid laner, foi convidado devido ao seu impacto na LCK e à popularidade do League of Legends no Vietnã. Durante o banquete, ele interagiu com autoridades e compartilhou insights sobre o crescimento dos esports. A participação de LazyFeel reforça o papel dos jogos eletrônicos como uma ponte cultural, unindo comunidades em todo o mundo. A LCK e a DRX expressaram orgulho pelo marco, que eleva o status dos jogadores profissionais.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "A LCK, em parceria com o Ministério dos Veteranos da Coreia do Sul, lançou um evento especial no LoL PARK para celebrar o 80º aniversário da libertação da Coreia. O evento combina esports e história, oferecendo aos fãs uma experiência única.\n\nDurante o evento, foram realizadas partidas de exibição com jogadores profissionais, além de exposições interativas sobre a história coreana. O LoL PARK foi decorado com temas históricos, e os fãs puderam participar de atividades educativas. A iniciativa foi elogiada por unir gerações, conectando jovens fãs de League of Legends com a história nacional. A LCK planeja continuar promovendo eventos que integrem cultura e esports.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Tudo Sobre a 3ª Temporada de League of Legends",
      url: "https://www.invenglobal.com/lol/articles/19560/everything-to-know-about-league-of-legends-season-3",
      content: "A terceira temporada de League of Legends traz mudanças significativas no gameplay, novos campeões e atualizações no sistema de ranqueadas. A Riot Games revelou detalhes empolgantes para os fãs.\n\nEntre as novidades, destaca-se a reformulação do sistema de itens, que promete equilibrar o meta e oferecer mais opções estratégicas. Novos campeões com mecânicas inovadoras serão introduzidos, e eventos sazonais trarão recompensas exclusivas. A comunidade está animada com as possibilidades, e a Riot prometeu atualizações frequentes para manter o jogo dinâmico e competitivo.",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Gen.G Garante Vaga Direta nos Playoffs com Sequência de Quatro Vitórias na 4ª Rodada da LCK",
      url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry-with-four-game-streak-in-lck-round-4",
      content: "A equipe Gen.G conquistou uma sequência impressionante de quatro vitórias consecutivas na 4ª rodada da LCK, garantindo sua classificação direta para os playoffs. A performance dominante colocou a equipe como favorita ao título.\n\nLiderados por jogadores como Chovy e Canyon, a Gen.G demonstrou consistência e trabalho em equipe excepcional. Suas estratégias agressivas e escolhas de draft inovadoras surpreenderam os adversários. Os fãs estão confiantes de que a equipe pode chegar ao Mundial com força total, buscando repetir o sucesso de temporadas anteriores.",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString(),
      translated: true
    },
    {
      title: "Viper Reflete Sobre o Marco de 500 Jogos na LCK",
      url: "https://www.invenglobal.com/lol/articles/19553/viper-reflects-on-upcoming-500-game-lck-milestone",
      content: "O lendário ADC Viper, da Hanwha Life Esports, está prestes a alcançar a marca de 500 jogos na LCK, um feito impressionante em sua carreira. Ele compartilhou reflexões sobre sua jornada no cenário competitivo.\n\nViper destacou momentos marcantes, como sua vitória no Mundial e partidas memoráveis contra rivais como T1 e Gen.G. Ele agradeceu aos fãs pelo apoio e prometeu continuar evoluindo como jogador. A LCK celebrou o marco com uma homenagem especial, reconhecendo Viper como um dos maiores ADCs da história.",
      source: "Inven Global",
      date: new Date(Date.now() - 18000000).toISOString(),
      translated: true
    },
    {
      title: "Datas de Lançamento do Riftbound: Spiritforged",
      url: "https://www.invenglobal.com/lol/articles/19551/riftbound-spiritforged-release-dates",
      content: "A Riot Games revelou as datas oficiais de lançamento do novo modo de jogo Riftbound: Spiritforged, que promete uma experiência única no universo de League of Legends. O modo combina elementos tradicionais com mecânicas inovadoras.\n\nRiftbound: Spiritforged introduz mapas dinâmicos, objetivos cooperativos e recompensas exclusivas. A Riot também confirmou eventos temáticos e skins relacionadas ao modo. Os jogadores estão ansiosos para explorar as novidades, que devem atrair tanto veteranos quanto novatos ao jogo.",
      source: "Inven Global",
      date: new Date(Date.now() - 21600000).toISOString(),
      translated: true
    },
    {
      title: "Canyon Após Derrotar o T1: 'Estou feliz com a vitória de hoje, mas no final temos que vencer no Mundial'",
      url: "https://www.invenglobal.com/lol/articles/19550/canyon-after-defeating-t1-im-happy-about-todays-win-but-in-the-end-we-have-to-win-at-worlds",
      content: "O jungler Canyon, da DWG KIA, celebrou a vitória contra o T1 em uma série disputada, mas manteve o foco no objetivo final: o título mundial. Suas declarações refletem a mentalidade vencedora da equipe.\n\nCanyon destacou a importância do trabalho em equipe e da adaptação ao meta atual. Ele elogiou a performance de seus companheiros e prometeu intensificar os treinos para o Mundial. A DWG KIA está entre as favoritas para representar a LCK no torneio internacional, com expectativas altas dos fãs.",
      source: "Inven Global",
      date: new Date(Date.now() - 25200000).toISOString(),
      translated: true
    },
    {
      title: "Faker Destaca Crescimento do T1 Apesar da Derrota por 1-2 para o Gen.G, Promete Retorno Mais Forte",
      url: "https://www.invenglobal.com/lol/articles/19549/faker-spotlights-t1s-growth-despite-12-setback-to-geng-vows-stronger-comeback",
      content: "Faker, o lendário mid laner do T1, manteve o otimismo após a derrota por 1-2 contra o Gen.G, destacando o crescimento contínuo da equipe. Ele prometeu que o T1 voltará mais forte nas próximas partidas.\n\nApesar do resultado, Faker elogiou a resiliência de seus companheiros e apontou melhorias no jogo coletivo. A derrota serviu como aprendizado, e o T1 está focado em ajustes estratégicos para os playoffs. Os fãs continuam apoiando Faker e a equipe, confiantes em mais uma campanha memorável.",
      source: "Inven Global",
      date: new Date(Date.now() - 28800000).toISOString(),
      translated: true
    },
    {
      title: "Hanwha Life Esports Consegue Vitória de 2-0 Sobre a Nongshim RedForce e Garante Vaga nos Playoffs da LCK",
      url: "https://www.invenglobal.com/lol/articles/19543/hanwha-life-esports-clinches-20-sweep-over-nongshim-redforce-to-secure-lck-playoff-berth",
      content: "A Hanwha Life Esports demonstrou superioridade tática ao vencer por 2-0 a Nongshim RedForce, garantindo oficialmente sua classificação para os playoffs da LCK. A equipe brilhou com jogadas coordenadas.\n\nLiderados por Viper e Zeka, a Hanwha Life Esports dominou as duas partidas com drafts criativos e execuções precisas. A vitória reforça o potencial da equipe para competir pelo título da LCK. Os fãs estão entusiasmados com a possibilidade de ver a Hanwha Life no Mundial.",
      source: "Inven Global",
      date: new Date(Date.now() - 32400000).toISOString(),
      translated: true
    }
  ];
}

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
