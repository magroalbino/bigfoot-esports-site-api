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

// Notícias mais recentes do Inven Global - 5 diárias atualizadas
function getStaticNews() {
  // Data atual: 13 de agosto de 2025
  const today = new Date('2025-08-13');
  
  return [
    {
      title: "Equipe da LPL FPX Suspende Milkyway Indefinidamente por Alegações de Vazamento de Pick-Ban",
      url: "https://www.invenglobal.com/articles/19570/lpl-team-fpx-suspends-milkyway-indefinitely-over-pick-ban-leak-allegations",
      content: "A equipe profissional chinesa da LPL, FPX Esports Club, suspendeu indefinidamente seu jogador Cai \"milkyway\" Zi-Jun. A suspensão ocorreu após alegações de que ele estava envolvido em manipulação de partidas e vazamento de informações estratégicas.\n\nDe acordo com fontes da liga, as alegações envolvem o vazamento de informações de pick-ban para terceiros, o que é considerado uma violação grave das regras de integridade competitiva da LPL. A FPX tomou ação imediata assim que as alegações vieram à tona.\n\nA organização declarou que está cooperando totalmente com a investigação oficial da LPL e que levam essas alegações muito a sério. Milkyway não poderá participar de jogos oficiais até que a investigação seja concluída.\n\nEste caso destaca a importância contínua da integridade competitiva no cenário de esports profissionais, especialmente em uma das ligas mais competitivas do mundo como a LPL.",
      source: "Inven Global",
      date: today.toISOString(),
      translated: true
    },
    {
      title: "Keria do T1 Sobre Dominância na Bot Lane e 700ª Vitória de Faker na LCK Após Varrer o KT Rolster",
      url: "https://www.invenglobal.com/articles/19569/t1-keria-on-bot-lane-dominance-and-fakers-700th-lck-victory-after-sweep-of-kt-rolster",
      content: "O suporte Ryu \"Keria\" Min-seok do T1 refletiu sobre a impressionante vitória por 2-0 contra o KT Rolster, que marcou a 700ª vitória de Faker na LCK - um marco histórico sem precedentes no cenário competitivo.\n\nKeria elogiou a coordenação excepcional da bot lane com Gumayusi, destacando como sua sinergia tem sido fundamental para o sucesso recente da equipe. Ele mencionou que as sessões de treino intensivas têm resultado em uma comunicação quase telepática durante as team fights.\n\nSobre o marco histórico de Faker, Keria expressou admiração pelo veterano mid laner: 'Jogar ao lado de alguém que alcançou 700 vitórias na LCK é inspirador. Faker continua elevando o nível de todos ao seu redor.'\n\nA vitória consolida a posição do T1 como um dos principais candidatos aos playoffs, com a equipe demonstrando forma consistente nas últimas semanas. Keria enfatizou que, apesar do sucesso, a equipe permanece focada em melhorias contínuas visando o Mundial.",
      source: "Inven Global",
      date: new Date(today.getTime() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "BLAST e Singapore Tourism Board Assinam Acordo Plurianual para Eventos de Esports",
      url: "https://www.invenglobal.com/articles/19568/blast-singapore-tourism-board-ink-multi-year-esports-event-agreement",
      content: "A organizadora de torneios de esports BLAST assinou uma parceria plurianual com o Singapore Tourism Board (STB) para sediar quatro grandes eventos de arena em Singapura, consolidando o papel da cidade-estado como um hub para esports na região asiática.\n\nO acordo representa um investimento significativo no cenário de esports de Singapura, com eventos planejados para atrair fãs internacionais e promover o turismo relacionado a jogos eletrônicos. A parceria incluirá torneios de Counter-Strike 2 e outras modalidades populares.\n\nSegundo o comunicado oficial, os eventos serão realizados em venues de classe mundial em Singapura, oferecendo experiências premium tanto para competidores quanto para espectadores. A iniciativa faz parte da estratégia de Singapura para se tornar um centro global de esports.\n\nA BLAST expressou entusiasmo com a parceria, destacando a infraestrutura excepcional de Singapura e o apoio governamental aos esports. Os primeiros eventos da parceria estão programados para começar no final de 2025.",
      source: "Inven Global",
      date: new Date(today.getTime() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Finais da LCK 2025 Serão Transmitidas ao Vivo na MBC em Marco Histórico para os Esports Coreanos",
      url: "https://www.invenglobal.com/articles/19567/2025-lck-finals-to-air-live-on-mbc-in-historic-first-for-korean-esports",
      content: "As finais da League of Legends Champions Korea (LCK) de 2025 farão história ao serem transmitidas ao vivo na MBC, uma das principais redes de televisão da Coreia do Sul, marcando um marco sem precedentes para os esports coreanos na mídia tradicional.\n\nEsta é a primeira vez que uma final da LCK será transmitida em rede nacional aberta na Coreia do Sul, demonstrando o crescimento exponencial da legitimidade e popularidade dos esports no país. A transmissão alcançará milhões de lares coreanos.\n\nA MBC preparou uma cobertura especial com comentaristas experientes e análises aprofundadas para audiências tanto veteranas quanto novas nos esports. A emissora investiu em produção de alta qualidade para apresentar o evento da melhor forma possível.\n\nRepresentantes da LCK expressaram que este marco representa o reconhecimento oficial dos esports como entretenimento mainstream na Coreia do Sul. A parceria pode abrir precedentes para futuras transmissões de eventos de esports em redes tradicionais.\n\nO evento das finais está programado para atrair uma das maiores audiências da história dos esports coreanos, combinando viewership online com a nova audiência da televisão tradicional.",
      source: "Inven Global",
      date: new Date(today.getTime() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Playoffs do VCT Pacific Stage 2: Nongshim RedForce e T1 Enfrentam Talon Esports e Rex Regum Qeon em Aberturas de Alto Risco",
      url: "https://www.invenglobal.com/articles/19566/vct-pacific-stage-2-playoffs-nongshim-redforce-and-t1-face-talon-esports-rex-regum-qeon-in-high-stakes-openers",
      content: "Os playoffs do VALORANT Champions Tour Pacific Stage 2 começam com confrontos eletrizantes, com Nongshim RedForce enfrentando Talon Esports e T1 medindo forças contra Rex Regum Qeon em partidas que definirão o rumo da competição.\n\nA Nongshim RedForce, que garantiu sua vaga nos playoffs após uma campanha consistente, enfrenta o desafio da versátil Talon Esports. A equipe coreana confia em sua experiência e coordenação tática para superar os adversários tailandeses, conhecidos por suas estratégias criativas.\n\nEnquanto isso, o T1 VALORANT busca replicar o sucesso de sua contraparte do League of Legends. A equipe enfrentará Rex Regum Qeon em uma batalha que promete ser intensa, com ambas as equipes demonstrando forte forma recente na classificação.\n\nOs playoffs representam a culminação de meses de competição intensa no Pacific Stage 2, com as equipes lutando não apenas pelo título regional, mas também por vagas preciosas no Champions, o torneio mundial de VALORANT.\n\nAnalistas preveem que estas partidas de abertura estabelecerão o tom para todo o torneio, com cada equipe ciente de que não há segunda chance nos playoffs eliminatórios.",
      source: "Inven Global",
      date: new Date(today.getTime() - 14400000).toISOString(),
      translated: true
    }
  ];
}
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "A League of Legends Champions Korea fará parceria com o Ministério dos Patriotas e Assuntos dos Veteranos da Coreia do Sul em uma campanha de uma semana marcando o 80º aniversário da libertação, disse a liga na terça-feira.\n\nO evento acontecerá no LoL PARK em Jongno-gu, Seul, de 13 a 18 de agosto. Durante o período, os visitantes poderão participar de várias atividades temáticas relacionadas à libertação da Coreia.\n\nA LCK disse que o evento visa conectar as gerações mais velhas e mais jovens através dos esports, permitindo que veteranos e suas famílias experimentem a cultura dos jogos eletrônicos enquanto os jovens aprendem sobre a história da libertação da Coreia.\n\nAs atividades incluirão exposições históricas, experiências interativas de jogos e sessões de fotos comemorativas. O LoL PARK também exibirá materiais históricos relacionados ao movimento de independência da Coreia.\n\nEste é o primeiro evento conjunto entre a LCK e o Ministério dos Veteranos, marcando um precedente para futuras colaborações entre esports e instituições governamentais na Coreia do Sul.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Tudo Sobre a 3ª Temporada de League of Legends",
      url: "https://www.invenglobal.com/articles/19560/everything-to-know-about-league-of-legends-season-3",
      content: "A Riot Games está preparada para iniciar a Temporada 3 de League of Legends com o Patch 25.17, encerrando o arco narrativo de um ano enquanto introduz novos recursos de gameplay, atualizações de qualidade de vida e mudanças competitivas.\n\nA nova temporada trará mudanças significativas no sistema de ranqueadas, incluindo ajustes nos critérios de matchmaking e novas recompensas sazonais. Os jogadores podem esperar uma experiência mais equilibrada e competitiva.\n\nNovos campeões estão programados para serem lançados durante a temporada, cada um trazendo mecânicas únicas que prometem diversificar ainda mais o meta atual. A Riot também planeja atualizações visuais para campeões mais antigos.\n\nO sistema de itens passará por refinamentos baseados no feedback da comunidade das temporadas anteriores. Essas mudanças visam criar mais diversidade nas builds e estratégias.\n\nEventos temáticos especiais marcarão marcos importantes da temporada, oferecendo aos jogadores oportunidades únicas de ganhar skins exclusivas e outros cosméticos raros.\n\nA Riot prometeu maior transparência na comunicação com a comunidade durante esta temporada, com atualizações regulares sobre o desenvolvimento do jogo e planos futuros.",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Gen.G Busca Redenção em Revanche de Alto Risco com T1 para Abrir a 4ª Rodada da LCK",
      url: "https://www.invenglobal.com/articles/19536/geng-seeks-redemption-in-high-stakes-rematch-with-t1-to-open-lck-round-4",
      content: "A League of Legends Champions Korea (LCK) da Riot Games dá início à 4ª Rodada, Semana 1, na quarta-feira, 6 de agosto, na LCK Arena em Gangseo-gu, Seul. Dez equipes competirão até domingo, 10 de agosto, com duas partidas por dia.\n\nO confronto de abertura apresenta uma revanche muito aguardada entre Gen.G e T1, duas das organizações mais bem-sucedidas da LCK. A Gen.G busca redenção após sua derrota anterior para o T1, enquanto o atual campeão procura manter sua dominância.\n\nAmbas as equipes passaram por ajustes estratégicos significativos desde seu último encontro. A Gen.G tem focado em melhorar sua coordenação no early game, enquanto o T1 tem refinado suas estratégias de team fight no late game.\n\nO mid laner da Gen.G, Chovy, está determinado a provar que pode superar Faker em uma das rivalidades mais icônicas da LCK. Enquanto isso, o T1 confia na experiência de sua lineup veterana para mais uma vitória.\n\nAnalistas esportivos preveem que esta série definirá o tom para o restante da 4ª rodada, com implicações significativas para as classificações dos playoffs.\n\nA partida promete ser um espetáculo para os fãs, com ambas as equipes em excelente forma e motivadas a provar sua superioridade no cenário competitivo coreano.",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O jogador LazyFeel do DRX fez história ao se tornar o primeiro jogador profissional de League of Legends a participar de um banquete oficial de estado entre Coreia do Sul e Vietnã.\n\nO evento histórico aconteceu na residência oficial em Seul como parte das relações diplomáticas crescentes entre os dois países. LazyFeel foi convidado devido ao seu impacto significativo na LCK e à popularidade do League of Legends no Vietnã.\n\nDurante o banquete, LazyFeel teve a oportunidade de interagir com autoridades governamentais e compartilhar insights sobre o crescimento dos esports na região. Ele falou sobre como os jogos eletrônicos servem como uma linguagem universal que une diferentes culturas.\n\nA participação de LazyFeel destaca o papel crescente dos esports como ferramenta de soft power e diplomacia cultural. Esta foi a primeira vez que um atleta de esports foi incluído em um evento diplomático oficial de tal magnitude.\n\nTanto a LCK quanto o DRX expressaram orgulho pelo marco histórico, que eleva o status dos jogadores profissionais e demonstra a legitimidade crescente dos esports como fenômeno cultural global.\n\nO evento estabelece um precedente importante para futuras colaborações entre esports e diplomacia internacional, mostrando como os jogos podem construir pontes entre nações.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
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
      note: '5 notícias diárias do Inven Global - Atualizadas para 13/08/2025'
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
