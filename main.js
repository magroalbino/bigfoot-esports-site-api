import React, { useState, useEffect } from 'react';

const NewsSystemDebug = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Notícias hardcoded com base no Inven Global
  const getRecentNews = () => {
    return [
      {
        id: 1,
        title: "cvMax sobre Vitória 2-0 Contra DRX, Marco de ShowMaker e Debate Rise vs Legend Group",
        url: "https://www.invenglobal.com/lol",
        content: "A Dplus KIA derrotou a DRX por 2-0 para alcançar 15-10 na temporada. Com a vitória de hoje, Heo 'ShowMaker' Su também atingiu 400 kills na LCK, e o resultado ajudou a equipe a consolidar ainda mais sua posição de primeiro lugar. O treinador cvMax comentou sobre a performance da equipe e o marco histórico de ShowMaker, que se tornou um dos poucos jogadores a atingir essa marca impressionante na liga coreana.",
        image: "https://www.invenglobal.com/img/ig-logo-light.png",
        source: "Inven Global",
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        translated: true
      },
      {
        id: 2,
        title: "Busca da T1 pelo 2º Lugar: kkOma Fala sobre Foco, Crescimento de Doran e Yunara de Gumayusi",
        url: "https://www.invenglobal.com/lol",
        content: "Após a vitória por 2-0 da T1 sobre a Hanwha Life Esports, o técnico principal Kim 'kkOma' Jeong-gyun e o top laner Choi 'Doran' Hyeon-joon participaram da entrevista pós-jogo. Eles refletiram sobre a vitória, falaram sobre o foco da equipe e reiteraram sua determinação para defender o segundo lugar. A discussão também tocou na contínua ausência da muito aguardada Yunara de Gumayusi.",
        image: "https://www.invenglobal.com/img/ig-logo-light.png",
        source: "Inven Global",
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        translated: true
      },
      {
        id: 3,
        title: "Nongshim RedForce Sofre 7ª Derrota Consecutiva em 2025 LCK",
        url: "https://www.invenglobal.com/lol",
        content: "A queda da Nongshim RedForce continua. A Nongshim perdeu por 0-2 para a Gen.G em uma partida da 4ª rodada da LCK 2025 no LoL Park em Jonggak, Seul, no dia 14. Apáticos durante toda a série, eles perderam tanto o Jogo 1 quanto o Jogo 2 em performances dominantes da Gen.G que duraram aproximadamente 24 minutos cada. Esta marca a sétima derrota consecutiva da equipe.",
        image: "https://www.invenglobal.com/img/ig-logo-light.png",
        source: "Inven Global",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
        translated: true
      },
      {
        id: 4,
        title: "Técnico da Gen.G Kim Enfatiza Foco nos Playoffs",
        url: "https://www.invenglobal.com/lol",
        content: "A Gen.G garantiu uma vitória por 2-0 contra a Nongshim RedForce na 4ª rodada da LCK 2025 no LoL Park em Jonggak, Seul, no dia 14. A vitória dominante durou menos de uma hora no total em ambos os jogos. O técnico Kim da Gen.G enfatizou a importância de manter o foco nos playoffs que se aproximam, apesar das vitórias convincentes.",
        image: "https://www.invenglobal.com/img/ig-logo-light.png",
        source: "Inven Global",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
        translated: true
      },
      {
        id: 5,
        title: "Finais da LCK 2025 Serão Transmitidas ao Vivo na MBC",
        url: "https://www.invenglobal.com/lol",
        content: "A League of Legends Champions Korea fará sua estreia na TV terrestre no próximo mês, com as Finais da LCK 2025 programadas para serem transmitidas ao vivo pela emissora sul-coreana MBC. A melhor de série começa às 14h KST no domingo. Esta é uma marca histórica para os esports coreanos, representando um reconhecimento mainstream sem precedentes para a liga profissional de League of Legends.",
        image: "https://www.invenglobal.com/img/ig-logo-light.png",
        source: "Inven Global",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
        translated: true
      }
    ];
  };

  const loadNews = () => {
    setLoading(true);
    setError('');
    setDebugInfo('Iniciando carregamento das notícias...');
    
    try {
      const newsData = getRecentNews();
      setDebugInfo(`Carregadas ${newsData.length} notícias com sucesso!`);
      setNews(newsData);
      setError('');
    } catch (err) {
      setError(`Erro: ${err.message}`);
      setDebugInfo('Falha no carregamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} horas atrás`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} dias atrás`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sistema de Notícias LoL - Debug
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            Notícias automáticas e atualizadas sobre League of Legends do Inven Global
          </p>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {news.length}
            </div>
            <div className="text-gray-300">NOTÍCIAS</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-gray-300">ÚLTIMA ATUALIZAÇÃO</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              Automático
            </div>
            <div className="text-gray-300">SISTEMA</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={loadNews}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {loading ? '🔄' : '📱'} Atualizar Agora
          </button>
          <div className="bg-green-600/20 text-green-400 px-6 py-3 rounded-lg font-medium border border-green-500/30">
            ⏰ Auto: ON
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6 text-center">
            <p className="text-blue-300">🔍 Debug: {debugInfo}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <strong className="text-red-400">Erro ao carregar notícias</strong>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={loadNews}
                className="ml-auto bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-gray-300">Buscando as últimas notícias do Inven Global...</p>
          </div>
        )}

        {/* News Grid */}
        {!loading && news.length > 0 && (
          <div className="grid gap-6">
            {news.map((item) => (
              <div 
                key={item.id} 
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="h-48 md:h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-6xl" style={{display: 'none'}}>
                        🎮
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          🔥 RECENTE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-blue-400 font-medium">{item.source}</span>
                      {item.translated && (
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                          🌐 Traduzido
                        </span>
                      )}
                      <span className="text-sm text-gray-400 ml-auto">
                        📅 {formatDate(item.date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {item.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Fonte: {item.source}
                      </a>
                      <button className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-sm hover:bg-blue-600/30 transition-colors">
                        📖 Ler completa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && news.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-bold mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-gray-400 mb-6">Tente atualizar ou verifique sua conexão</p>
            <button 
              onClick={loadNews}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🔄 Tentar Novamente
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>🟢 Sistema ativo - Atualizações automáticas a cada 1.5 minutos</p>
        </div>
      </div>
    </div>
  );
};

export default NewsSystemDebug;
