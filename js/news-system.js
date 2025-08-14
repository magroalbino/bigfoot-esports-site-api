class NewsSystem {
    constructor() {
        this.apiUrl = '/api/news';
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        console.log('NewsSystem: Inicializando...');
        this.updateCurrentDate();
        this.bindEvents();
        this.loadNews();
        this.startAutoRefresh();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('pt-BR', options);
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        const autoRefreshBtn = document.getElementById('autoRefreshBtn');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Botão refresh clicado');
                this.loadNews();
            });
        }

        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => {
                console.log('Botão auto-refresh clicado');
                this.toggleAutoRefresh();
            });
        }

        // Evento para fechar o modal
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Fechar o modal ao clicar fora do conteúdo
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideModal();
                }
            });
        }

        // Fechar modal com tecla ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    async loadNews() {
        console.log('NewsSystem: Carregando notícias...');
        this.showLoading();
        this.hideError();

        try {
            console.log(`Fazendo fetch para: ${this.apiUrl}`);
            const response = await fetch(this.apiUrl);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Detalhes do erro:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Dados recebidos:', data);

            if (data.success && data.news) {
                console.log(`Exibindo ${data.news.length} notícias`);
                this.displayNews(data.news);
                this.updateStats(data.news.length, data.timestamp);
            } else {
                console.error('Resposta inválida:', data);
                this.showError('Erro ao carregar notícias: ' + (data.error || 'Resposta inválida'));
            }
        } catch (error) {
            console.error('Erro no fetch:', error);
            this.showError('Erro de conexão: ' + error.message);
            
            // Fallback para notícias estáticas
            this.loadFallbackNews();
        } finally {
            this.hideLoading();
        }
    }

    loadFallbackNews() {
        console.log('Carregando notícias fallback...');
        const fallbackNews = [
            {
                title: "Riot Games Define Lançamento das Skins do T1 para Setembro",
                url: "https://www.invenglobal.com/lol/articles/19564/riot-games-sets-september-launch-for-t1-worlds-skins",
                content: "A Riot Games anunciou oficialmente que as muito aguardadas skins do T1, equipe campeã mundial de League of Legends, serão lançadas em setembro de 2024. As skins celebram a vitória histórica da equipe sul-coreana no Mundial de 2023, onde derrotaram adversários de peso em uma final emocionante que ficará marcada na história dos esports.\n\nCada skin foi cuidadosamente desenvolvida para refletir a identidade única e o estilo de jogo de cada jogador do T1. As skins apresentam efeitos visuais completamente únicos que homenageiam as performances excepcionais dos jogadores durante o torneio mundial.\n\nA comunidade global de League of Legends está extremamente ansiosa pelo lançamento, com fãs especulando sobre possíveis eventos in-game especiais que podem acompanhar o lançamento das skins.",
                source: "Inven Global",
                date: new Date().toISOString(),
                translated: true
            },
            {
                title: "Gen.G Garante Vaga Direta nos Playoffs da LCK",
                url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry",
                content: "A formidável equipe Gen.G conquistou uma sequência absolutamente impressionante de quatro vitórias consecutivas dominantes na 4ª rodada da LCK, garantindo matematicamente sua classificação direta para os playoffs.\n\nLiderados pelo fenomenal mid laner Chovy e pelo veterano experiente Canyon, a Gen.G mostrou um nível de coordenação e execução tática que tem impressionado analistas e fãs igualmente.\n\nOs fãs estão extremamente confiantes de que a equipe tem todas as ferramentas necessárias para dominar os playoffs domésticos e representar a Coreia do Sul no próximo Campeonato Mundial.",
                source: "Inven Global",
                date: new Date(Date.now() - 3600000).toISOString(),
                translated: true
            }
        ];
        
        this.displayNews(fallbackNews);
        this.updateStats(fallbackNews.length, new Date().toISOString());
    }

    displayNews(news) {
        console.log('Exibindo notícias:', news.length);
        const container = document.getElementById('newsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) {
            console.error('Container newsContainer não encontrado!');
            return;
        }

        if (!news || news.length === 0) {
            console.log('Nenhuma notícia para exibir');
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        
        const htmlContent = news.map((item, index) => this.createNewsCard(item, index)).join('');
        console.log('HTML gerado:', htmlContent.substring(0, 200) + '...');
        
        container.innerHTML = htmlContent;
        
        // Adicionar eventos de clique para abrir o modal
        news.forEach((item, index) => {
            const card = document.getElementById(`news-card-${index}`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showModal(item);
                });
            }
        });
        
        console.log('Notícias inseridas no DOM');
    }

    createNewsCard(news, index) {
        const date = new Date(news.date).toLocaleString('pt-BR');
        const translationBadge = news.translated ? '<span class="translation-badge">🌐 Traduzido</span>' : '';
        // Extrair apenas o primeiro parágrafo do conteúdo para preview
        const firstParagraph = news.content ? this.sanitizeHtml(news.content.split('\n')[0]) : '';
        const preview = firstParagraph.length > 150 ? firstParagraph.substring(0, 150) + '...' : firstParagraph;
        const content = preview ? `<div class="news-card-content-wrapper"><p class="news-card-content">${preview}</p></div>` : '';
        
        return `
            <div class="news-card" id="news-card-${index}" style="cursor: pointer;">
                <div class="news-card-header">
                    <div class="news-card-source">
                        ${this.sanitizeHtml(news.source)}
                        ${translationBadge}
                    </div>
                    <h3 class="news-card-title">${this.sanitizeHtml(news.title)}</h3>
                    <div class="news-card-date">${date}</div>
                </div>
                ${content}
                <div class="news-card-footer">
                    <a href="${this.sanitizeHtml(news.url)}" target="_blank" class="news-card-source-link" onclick="event.stopPropagation();">
                        Fonte: ${this.sanitizeHtml(news.source)}
                    </a>
                    <div class="news-card-read-more">
                        <span>Clique para ler mais...</span>
                    </div>
                </div>
            </div>
        `;
    }

    showModal(news) {
        const modal = document.getElementById('newsModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalSource = document.getElementById('modalSource');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');
        const modalSourceLink = document.getElementById('modalSourceLink');

        if (modal && modalTitle && modalSource && modalDate && modalContent && modalSourceLink) {
            modalTitle.textContent = news.title;
            modalSource.textContent = news.source;
            modalDate.textContent = new Date(news.date).toLocaleString('pt-BR');
            
            // Processar o conteúdo completo preservando parágrafos
            const fullContent = this.processFullContent(news.content);
            modalContent.innerHTML = fullContent;
            
            modalSourceLink.href = news.url;
            modalSourceLink.textContent = `Fonte: ${news.source}`;
            modalSourceLink.target = '_blank';
            
            modal.style.display = 'flex';
            // Adicionar classe para animação suave
            setTimeout(() => {
                modal.classList.add('modal-show');
            }, 10);
        }
    }

    processFullContent(content) {
        if (!content) return '<p>Conteúdo não disponível.</p>';
        
        // Limpar e sanitizar o conteúdo
        let processedContent = this.sanitizeHtml(content);
        
        // Dividir em parágrafos baseado em quebras de linha duplas ou simples
        let paragraphs = processedContent
            .split(/\n\s*\n|\n/) // Dividir por quebras duplas ou simples
            .map(p => p.trim()) // Remover espaços extras
            .filter(p => p.length > 0); // Remover parágrafos vazios
        
        // Se não há parágrafos definidos, criar um parágrafo único
        if (paragraphs.length === 0) {
            paragraphs = [processedContent];
        }
        
        // Converter cada parágrafo em elemento HTML
        const htmlParagraphs = paragraphs.map(paragraph => {
            // Remover possíveis tags HTML residuais e limpar
            const cleanParagraph = paragraph
                .replace(/<[^>]*>/g, '') // Remove qualquer tag HTML
                .replace(/&nbsp;/g, ' ') // Converte &nbsp; para espaço
                .replace(/&amp;/g, '&') // Decodifica &amp;
                .replace(/&lt;/g, '<') // Decodifica &lt;
                .replace(/&gt;/g, '>') // Decodifica &gt;
                .replace(/&quot;/g, '"') // Decodifica &quot;
                .trim();
            
            return cleanParagraph ? `<p>${cleanParagraph}</p>` : '';
        }).filter(p => p.length > 0);
        
        return htmlParagraphs.length > 0 ? htmlParagraphs.join('') : '<p>Conteúdo não disponível.</p>';
    }

    hideModal() {
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    sanitizeHtml(text) {
        if (!text) return '';
        
        // Criar um elemento temporário para sanitização
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    }

    updateStats(count, timestamp) {
        const newsCountEl = document.getElementById('newsCount');
        const lastUpdateEl = document.getElementById('lastUpdate');
        
        if (newsCountEl) {
            newsCountEl.textContent = count;
        }
        
        if (timestamp && lastUpdateEl) {
            const date = new Date(timestamp);
            lastUpdateEl.textContent = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    showLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Carregando notícias...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.innerHTML = '';
        }
    }

    showError(message) {
        console.error('Erro exibido:', message);
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error">
                    <strong>❌ Erro:</strong> ${message}
                    <button onclick="newsSystem.loadNews()" class="retry-btn">🔄 Tentar Novamente</button>
                </div>
            `;
        }
    }

    hideError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }

    startAutoRefresh() {
        if (this.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                console.log('Auto-refresh executado');
                this.loadNews();
            }, 300000); // 5 minutos
            console.log('Auto-refresh iniciado (5 minutos)');
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Auto-refresh parado');
        }
    }

    toggleAutoRefresh() {
        const btn = document.getElementById('autoRefreshBtn');
        
        if (this.autoRefresh) {
            this.autoRefresh = false;
            this.stopAutoRefresh();
            if (btn) {
                btn.textContent = '⏰ Auto: OFF';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            }
            console.log('Auto-refresh desativado');
        } else {
            this.autoRefresh = true;
            this.startAutoRefresh();
            if (btn) {
                btn.textContent = '⏰ Auto: ON';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
            console.log('Auto-refresh ativado');
        }
    }
}

// Tornar disponível globalmente
window.NewsSystem = NewsSystem;
