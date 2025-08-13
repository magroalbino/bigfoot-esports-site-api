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
                content: "A Riot Games anunciou que as novas skins do T1, campeão mundial, serão lançadas em setembro.",
                source: "Inven Global",
                date: new Date().toISOString(),
                translated: true
            },
            {
                title: "Gen.G Garante Vaga Direta nos Playoffs da LCK",
                url: "https://www.invenglobal.com/lol/articles/19556/geng-clinch-direct-playoffs-entry",
                content: "A equipe Gen.G conquistou uma sequência impressionante de vitórias consecutivas.",
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
        const content = news.content ? `<div class="news-card-content-wrapper"><p class="news-card-content">${window.AppUtils.sanitizeHtml(news.content.substring(0, 100))}</p></div>` : '';
        
        return `
            <div class="news-card" id="news-card-${index}" style="cursor: pointer;">
                <div class="news-card-header">
                    <div class="news-card-source">
                        ${window.AppUtils.sanitizeHtml(news.source)}
                        ${translationBadge}
                    </div>
                    <h3 class="news-card-title">${window.AppUtils.sanitizeHtml(news.title)}</h3>
                    <div class="news-card-date">${date}</div>
                </div>
                ${content}
                <div class="news-card-footer">
                    <a href="${window.AppUtils.sanitizeHtml(news.url)}" target="_blank" class="news-card-source-link">
                        Fonte: ${window.AppUtils.sanitizeHtml(news.source)}
                    </a>
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
        modalTitle.textContent = window.AppUtils.sanitizeHtml(news.title);
        modalSource.textContent = window.AppUtils.sanitizeHtml(news.source);
        modalDate.textContent = new Date(news.date).toLocaleString('pt-BR');
        // Preservar quebras de linha convertendo-as em <p> para melhor formatação
        const paragraphs = window.AppUtils.sanitizeHtml(news.content).split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
        modalContent.innerHTML = paragraphs;
        modalSourceLink.href = window.AppUtils.sanitizeHtml(news.url);
        modalSourceLink.textContent = `Fonte: ${window.AppUtils.sanitizeHtml(news.source)}`;
        
        modal.style.display = 'flex';
    }
}

    hideModal() {
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.style.display = 'none';
        }
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
                    <strong>Erro:</strong> ${message}
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
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
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
        } else {
            this.autoRefresh = true;
            this.startAutoRefresh();
            if (btn) {
                btn.textContent = '⏰ Auto: ON';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        }
    }
}
