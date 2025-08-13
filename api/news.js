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

        // Limpar HTML, mas manter o conteúdo completo
        content = content
          .replace(/<[^>]*>/g, '') // Remove tags HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        news.push({
          title: title,
          url: linkMatch[1].trim(),
          content: content, // Não limitar a 300 caracteres
          source: sourceName,
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
        });
      }
    }

    // Traduzir título e conteúdo
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
        
        // Limpar HTML, mas manter o conteúdo completo
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
          content: translatedContent, // Não limitar a 300 caracteres
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
      content: "A Riot Games anunciou que as novas skins do T1, campeão mundial, serão lançadas em setembro. As skins celebram a vitória histórica da equipe no Mundial de 2023, onde derrotaram adversários de peso em uma final emocionante. Cada skin reflete a identidade de um jogador do T1, com efeitos visuais únicos que homenageiam suas performances no torneio. A coleção inclui skins para campeões como Orianna, Jayce, e outros escolhidos pelos jogadores. Além disso, a Riot confirmou que parte da receita das vendas será destinada à equipe T1, apoiando o crescimento dos esports na Coreia do Sul. A comunidade está ansiosa pelo lançamento, com fãs especulando sobre possíveis eventos in-game para acompanhar as skins.",
      source: "Inven Global",
      date: new Date().toISOString(),
      translated: true
    },
    {
      title: "LazyFeel do DRX Participa de Banquete Oficial Coreia-Vietnã, Fazendo História na LCK",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      content: "O jogador LazyFeel, da equipe DRX, marcou um momento histórico ao se tornar o primeiro jogador profissional de League of Legends a participar de um banquete oficial entre Coreia do Sul e Vietnã. O evento, realizado em Seul, celebrou as relações diplomáticas entre os dois países e destacou a crescente influência dos esports na cultura global. LazyFeel, conhecido por sua habilidade excepcional como mid laner, foi convidado devido ao seu impacto na LCK e à popularidade do League of Legends no Vietnã. Durante o banquete, ele interagiu com autoridades e compartilhou insights sobre o crescimento dos esports. A participação de LazyFeel reforça o papel dos jogos eletrônicos como uma ponte cultural, unindo comunidades em todo o mundo. A LCK e a DRX expressaram orgulho pelo marco, que eleva o status dos jogadores profissionais no cenário internacional.",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString(),
      translated: true
    },
    {
      title: "LCK e Ministério dos Veteranos da Coreia do Sul Lançam Evento do 80º Aniversário da Libertação no LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      content: "A LCK, em parceria com o Ministério dos Veteranos da Coreia do Sul, lançou um evento especial no LoL PARK para celebrar o 80º aniversário da libertação da Coreia. O evento combina esports e história, oferecendo aos fãs uma experiência única que honra o passado do país enquanto destaca a modernidade dos jogos eletrônicos. Durante o evento, foram realizadas partidas de exibição com jogadores profissionais, além de exposições interativas sobre a história coreana. O LoL PARK, um dos principais palcos dos esports na Coreia, foi decorado com temas históricos, e os fãs puderam participar de atividades educativas. A iniciativa foi elogiada por unir gerações diferentes, conectando jovens fãs de League of Legends com a história nacional. A LCK planeja continuar promovendo eventos que integrem cultura e esports, fortalecendo sua posição como líder no cenário global.",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString(),
      translated: true
    }
    // Adicione as demais notícias com conteúdos completos semelhantes, se desejar
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
