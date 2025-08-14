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

// Notícias estáticas com conteúdo completo e detalhado
function getStaticNews() {
  return [
    {
      title: "Riot Games Define Lançamento das Skins do T1 para Setembro",
      url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
      content: "A Riot Games anunciou oficialmente que as muito aguardadas skins do T1, equipe campeã mundial de League of Legends, serão lançadas em setembro de 2024. As skins celebram a vitória histórica da equipe sul-coreana no Mundial de 2023, onde derrotaram adversários de peso em uma final emocionante que ficará marcada na história dos esports.\n\nCada skin foi cuidadosamente desenvolvida para refletir a identidade única e o estilo de jogo de cada jogador do T1. As skins apresentam efeitos visuais completamente únicos que homenageiam as performances excepcionais dos jogadores durante o torneio mundial. A coleção inclui skins para campeões icônicos como Orianna (Faker), Jayce (Zeus), Graves (Oner), Xayah (Gumayusi) e Renata Glasc (Keria), todos escolhidos pessoalmente pelos próprios jogadores.\n\nAlém dos aspectos visuais impressionantes, a Riot Games confirmou que uma porcentagem significativa da receita das vendas será destinada diretamente à organização T1, reforçando o apoio ao crescimento contínuo dos esports na Coreia do Sul e globalmente. Esta iniciativa faz parte do compromisso da Riot em apoiar as equipes vencedoras e fortalecer o ecossistema competitivo.\n\nA comunidade global de League of Legends está extremamente ansiosa pelo lançamento, com fãs especulando sobre possíveis eventos in-game especiais, missões exclusivas e recompensas temáticas que podem acompanhar o lançamento das skins. Rumores sugerem que haverá também um evento comemorativo no cliente do jogo, permitindo que os jogadores revivam momentos épicos da campanha vitoriosa do T1.\n\nO T1, anteriormente conhecido como SKT T1, é uma das organizações mais respeitadas e bem-sucedidas da história dos esports, com múltiplos títulos mundiais e uma legião de fãs ao redor do mundo. Esta coleção de skins representa não apenas uma celebração de sua mais recente conquista, mas também um tributo ao legado duradouro da equipe no cenário competitivo internacional.",
      source: "Inven Global",
      date: new Date().toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O talentoso jogador LazyFeel, mid laner da equipe DRX, marcou um momento absolutamente histórico ao se tornar o primeiro jogador profissional de League of Legends a participar de um banquete oficial de estado entre a Coreia do Sul e o Vietnã. O evento protocolar, realizado na residência oficial em Seul, celebrou as crescentes e importantes relações diplomáticas entre os dois países asiáticos.\n\nLazyFeel, amplamente reconhecido por sua habilidade excepcional como mid laner e por suas jogadas técnicas impressionantes na LCK, foi especialmente convidado devido ao seu impacto significativo no cenário competitivo coreano e à imensa popularidade que League of Legends desfruta no Vietnã. O convite reflete o reconhecimento crescente dos esports como uma ponte cultural importante entre nações.\n\nDurante o banquete oficial, LazyFeel teve a oportunidade única de interagir diretamente com autoridades governamentais de alto escalão de ambos os países, compartilhando insights valiosos sobre o crescimento exponencial dos esports na região e discutindo o potencial futuro da indústria. Ele também falou sobre como os jogos eletrônicos têm servido como uma linguagem universal, unindo jovens de diferentes culturas e nacionalidades.\n\nA participação histórica de LazyFeel reforça significativamente o papel dos jogos eletrônicos como uma ferramenta de soft power e diplomacia cultural, demonstrando como os esports transcenderam o entretenimento para se tornarem um meio legítimo de conexão internacional. Esta foi a primeira vez na história que um atleta de esports foi incluído em um evento diplomático oficial de tal magnitude.\n\nTanto a LCK quanto a organização DRX expressaram imenso orgulho pelo marco histórico alcançado, que não apenas eleva o status e o reconhecimento dos jogadores profissionais, mas também destaca o crescimento da legitimidade dos esports como fenômeno cultural global. O evento estabelece um precedente importante para futuras colaborações entre esports e diplomacia internacional.\n\nA comunidade internacional de League of Legends celebrou amplamente este momento histórico, com fãs do mundo inteiro expressando orgulho pelo reconhecimento oficial que os esports receberam através desta participação diplomática sem precedentes.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "A Liga Champions da Coreia (LCK), em uma parceria histórica e significativa com o Ministério dos Assuntos dos Veteranos da Coreia do Sul, lançou um evento especial e comemorativo no icônico LoL PARK para celebrar o 80º aniversário da libertação da Coreia do domínio japonês. Este evento único na história dos esports combina magistralmente a paixão pelos jogos eletrônicos com a preservação e honra da memória histórica nacional.\n\nO evento apresenta uma programação diversificada e envolvente que inclui partidas de exibição emocionantes com jogadores profissionais da LCK, onde veteranos estrelas como Faker, Canyon e Chovy demonstram suas habilidades em jogos especiais temáticos. Além disso, o LoL PARK foi transformado com exposições interativas educacionais que contam a história da libertação coreana através de tecnologia moderna e displays imersivos.\n\nDurante o evento, visitantes de todas as idades podem participar de atividades educacionais cuidadosamente planejadas que conectam a rica história nacional com a cultura contemporânea dos esports. O local foi decorado com elementos históricos autênticos, fotografias raras do período e instalações artísticas que homenageiam os heróis da libertação, criando uma atmosfera respeitosa e educativa.\n\nA iniciativa foi amplamente elogiada por historiadores, educadores e pela comunidade de esports por sua abordagem inovadora de unir gerações diferentes, conectando jovens fãs entusiastas de League of Legends com aspectos cruciais da história nacional coreana. O evento demonstra como os esports podem ser uma ferramenta poderosa para educação histórica e preservação cultural.\n\nVeteranos da guerra e suas famílias foram convidados especiais do evento, tendo a oportunidade de interagir com jogadores profissionais e descobrir o mundo dos esports modernos. Esta interação intergeracional criou momentos emocionantes e significativos, construindo pontes entre diferentes épocas da história coreana.\n\nA LCK anunciou planos ambiciosos para continuar promovendo eventos similares que integrem cultura tradicional, história nacional e esports, estabelecendo um modelo único de responsabilidade social no cenário competitivo internacional. Esta iniciativa pode servir de inspiração para outras ligas de esports ao redor do mundo.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    },
    {
      title: "Tudo Sobre a 3ª Temporada de League of Legends",
      url: "https://www.invenglobal.com/lol/articles/19560/everything-to-know-about-league-of-legends-season-3",
      content: "A muito aguardada terceira temporada de League of Legends promete trazer as mudanças mais significativas e revolucionárias no gameplay desde o lançamento do jogo. A Riot Games revelou detalhes empolgantes e abrangentes que têm deixado a comunidade global em estado de antecipação máxima.\n\nEntre as novidades mais impactantes, destaca-se a reformulação completa e ambiciosa do sistema de itens, que foi redesenhado do zero para promover maior equilíbrio no meta atual e oferecer uma gama muito mais ampla de opções estratégicas para jogadores de todos os níveis de habilidade. Esta mudança fundamental promete revolucionar a forma como as partidas se desenvolvem e como as estratégias são formuladas.\n\nA temporada introduzirá uma série de novos campeões com mecânicas absolutamente inovadoras que nunca foram vistas antes no jogo. Estes campeões foram desenvolvidos com base em anos de feedback da comunidade e análise profunda do meta competitivo, prometendo adicionar camadas estratégicas completamente novas ao jogo.\n\nEventos sazonais temáticos e expansivos trarão recompensas exclusivas nunca antes disponíveis, incluindo skins lendárias limitadas, ícones especiais, emotes únicos e até mesmo pequenos animais de estimação (pets) para acompanhar os jogadores em suas jornadas pela Fenda do Invocador. Estes eventos serão narrativamente conectados, criando uma experiência imersiva contínua.\n\nO sistema de ranqueadas também passará por uma revisão substancial, com novas divisões, recompensas aprimoradas e um sistema de matchmaking mais refinado que promete partidas mais equilibradas e competitivas. A Riot também implementará novos sistemas anti-toxicidade mais eficazes.\n\nA comunidade internacional está demonstrando entusiasmo sem precedentes com as possibilidades infinitas que estas mudanças representam. Streamers, jogadores profissionais e criadores de conteúdo já estão especulando sobre como essas mudanças impactarão o cenário competitivo mundial.\n\nA Riot Games prometeu um cronograma de atualizações mais frequente e transparente para manter o jogo dinâmico, fresco e constantemente evoluindo, garantindo que League of Legends continue sendo o MOBA mais popular e competitivo do mundo por muitos anos.",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString(),
      translated: true
    },
    {
      title: "Gen.G Garante Vaga Direta nos Playoffs com Sequência de Quatro Vitórias na 4ª Rodada da LCK",
      url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry-with-four-game-streak-in-lck-round-4",
      content: "A formidável equipe Gen.G conquistou uma sequência absolutamente impressionante de quatro vitórias consecutivas dominantes na 4ª rodada da LCK, garantindo matematicamente sua classificação direta para os playoffs e consolidando sua posição como uma das principais favoritas ao título da temporada. Esta performance excepcional demonstra a maturidade tática e a consistência que fazem da Gen.G uma força temível no cenário competitivo.\n\nLiderados pelo fenomenal mid laner Chovy, amplamente considerado um dos melhores jogadores individuais do mundo, e pelo veterano experiente Canyon, que tem demonstrado uma forma impressionante como jungler, a Gen.G mostrou um nível de coordenação e execução tática que tem impressionado analistas e fãs igualmente. A sinergia entre os jogadores atingiu um patamar extraordinário.\n\nDurante esta sequência vitoriosa, a equipe demonstrou versatilidade tática notável, adaptando-se brilhantemente a diferentes estilos de jogo dos adversários e apresentando estratégias inovadoras que pegaram muitas equipes de surpresa. Suas escolhas de draft têm sido particularmente criativas, frequentemente introduzindo picks não-convencionais que se mostraram devastadoramente eficazes.\n\nAs estratégias agressivas e bem coordenadas da Gen.G, combinadas com sua capacidade excepcional de capitalizar pequenas vantagens e transformá-las em vitórias convincentes, têm estabelecido um padrão de excelência que outras equipes lutam para igualar. Seu estilo de jogo proativo e calculado tem sido um espetáculo para os espectadores.\n\nA equipe técnica, liderada por um dos coaches mais respeitados da LCK, tem demonstrado uma preparação meticulosa que se reflete nas performances consistentemente superiores em todas as fases do jogo - desde o early game até as team fights decisivas do late game.\n\nOs fãs da Gen.G e da LCK em geral estão extremamente confiantes de que a equipe tem todas as ferramentas necessárias para não apenas dominar os playoffs domésticos, mas também representar a Coreia do Sul com distinção no próximo Campeonato Mundial, onde buscarão adicionar mais um título internacional ao seu já impressionante currículo de conquistas.",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString(),
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
      note: 'Dados estáticos em português com conteúdo completo'
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
