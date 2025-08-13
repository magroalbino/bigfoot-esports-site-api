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
    // URLs das fontes de notícias sobre League of Legends
    const sources = [
      {
        name: 'Inven Global',
        url: 'https://www.invenglobal.com/lol/rss.xml',
        parser: 'rss'
      },
      {
        name: 'LoL Esports',
        url: 'https://lolesports.com/api/v3/news',
        parser: 'json'
      }
    ];

    const news = [];

    // Buscar notícias de cada fonte
    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
          },
          timeout: 5000
        });

        if (!response.ok) continue;

        if (source.parser === 'rss') {
          const text = await response.text();
          const rssNews = await parseRSS(text, source.name);
          news.push(...rssNews);
        } else if (source.parser === 'json') {
          const data = await response.json();
          const jsonNews = await parseJSON(data, source.name);
          news.push(...jsonNews);
        }
      } catch (error) {
        console.error(`Erro ao buscar ${source.name}:`, error);
        continue;
      }
    }

    // Se não conseguiu buscar notícias online, usar dados estáticos
    if (news.length === 0) {
      const staticNews = getStaticNews();
      news.push(...staticNews);
    }

    // Ordenar por data (mais recente primeiro)
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limitar a 20 notícias
    const limitedNews = news.slice(0, 20);

    res.status(200).json({
      success: true,
      news: limitedNews,
      timestamp: new Date().toISOString(),
      total: limitedNews.length
    });

  } catch (error) {
    console.error('Erro na API:', error);
    
    // Em caso de erro, retornar notícias estáticas
    const staticNews = getStaticNews();
    
    res.status(200).json({
      success: true,
      news: staticNews,
      timestamp: new Date().toISOString(),
      total: staticNews.length,
      note: 'Dados estáticos devido a erro na busca'
    });
  }
}

// Parser para RSS
async function parseRSS(xmlText, sourceName) {
  try {
    const news = [];
    
    // Regex simples para extrair informações do RSS
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
    const titleRegex = /<title[^>]*>(.*?)<\/title>/s;
    const linkRegex = /<link[^>]*>(.*?)<\/link>/s;
    const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/s;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && news.length < 10) {
      const itemContent = match[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const dateMatch = pubDateRegex.exec(itemContent);

      if (titleMatch && linkMatch) {
        news.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          url: linkMatch[1].trim(),
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

// Parser para JSON
async function parseJSON(data, sourceName) {
  try {
    const news = [];
    
    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles.slice(0, 10)) {
        news.push({
          title: article.title || article.headline,
          url: article.url || article.link,
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

// Notícias estáticas para fallback
function getStaticNews() {
  return [
    {
      title: "Riot Games Sets September Launch for T1 Worlds Skins",
      url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
      source: "Inven Global",
      date: new Date().toISOString()
    },
    {
      title: "DRX's LazyFeel Attends Korea–Vietnam State Banquet, Making LCK History",
      url: "https://www.invenglobal.com/lol/articles/19562/drxs-lazyfeel-attends-koreavietnam-state-banquet-making-lck-history",
      source: "Inven Global",
      date: new Date(Date.now() - 3600000).toISOString()
    },
    {
      title: "LCK and South Korea's Veterans Affairs Ministry Launch 80th Liberation Anniversary Event at LoL PARK",
      url: "https://www.invenglobal.com/lol/articles/19561/lck-and-south-koreas-veterans-affairs-ministry-launch-80th-liberation-anniversary-event-at-lol-park",
      source: "Inven Global",
      date: new Date(Date.now() - 7200000).toISOString()
    },
    {
      title: "Everything to Know About League of Legends Season 3",
      url: "https://www.invenglobal.com/lol/articles/19560/everything-to-know-about-league-of-legends-season-3",
      source: "Inven Global",
      date: new Date(Date.now() - 10800000).toISOString()
    },
    {
      title: "Gen.G Clinch Direct Playoffs Entry with Four-Game Streak in LCK Round 4",
      url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry-with-four-game-streak-in-lck-round-4",
      source: "Inven Global",
      date: new Date(Date.now() - 14400000).toISOString()
    },
    {
      title: "Viper reflects on upcoming 500-game LCK milestone",
      url: "https://www.invenglobal.com/lol/articles/19553/viper-reflects-on-upcoming-500-game-lck-milestone",
      source: "Inven Global",
      date: new Date(Date.now() - 18000000).toISOString()
    },
    {
      title: "Riftbound: Spiritforged Release Dates",
      url: "https://www.invenglobal.com/lol/articles/19551/riftbound-spiritforged-release-dates",
      source: "Inven Global",
      date: new Date(Date.now() - 21600000).toISOString()
    },
    {
      title: "Canyon after defeating T1: \"I'm happy about today's win, but in the end we have to win at Worlds.\"",
      url: "https://www.invenglobal.com/lol/articles/19550/canyon-after-defeating-t1-im-happy-about-todays-win-but-in-the-end-we-have-to-win-at-worlds",
      source: "Inven Global",
      date: new Date(Date.now() - 25200000).toISOString()
    },
    {
      title: "Faker Spotlights T1's Growth Despite 1–2 Setback to Gen.G, Vows Stronger Comeback",
      url: "https://www.invenglobal.com/lol/articles/19549/faker-spotlights-t1s-growth-despite-12-setback-to-geng-vows-stronger-comeback",
      source: "Inven Global",
      date: new Date(Date.now() - 28800000).toISOString()
    },
    {
      title: "Hanwha Life Esports Clinches 2–0 Sweep Over Nongshim RedForce to Secure LCK Playoff Berth",
      url: "https://www.invenglobal.com/lol/articles/19543/hanwha-life-esports-clinches-20-sweep-over-nongshim-redforce-to-secure-lck-playoff-berth",
      source: "Inven Global",
      date: new Date(Date.now() - 32400000).toISOString()
    }
  ];
}
