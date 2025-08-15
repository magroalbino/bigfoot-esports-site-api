// news-system.js
class NewsSystem {
    constructor() {
        this.apiUrl = '/api/news';
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.refreshIntervalTime = 180000; // 3 minutos
        this.lastNews = []; // Armazenar notícias atuais
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
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            console.warn('Elemento #current-date não encontrado no HTML.');
        }
    }

    bindEvents() {
        console.log('NewsSystem: Ligando eventos...');
        const refreshBtn = document.getElementById('refresh-news-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Botão de atualizar notícias clicado');
                this.loadNews();
            });
        } else {
            console.warn('Botão #refresh-news-btn não encontrado.');
        }
    }

    startAutoRefresh() {
        if (!this.autoRefresh) {
            console.log('AutoRefresh desativado.');
            return;
        }
        console.log(`NewsSystem: AutoRefresh ativado a cada ${this.refreshIntervalTime / 1000} segundos.`);
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            console.log('AutoRefresh: Atualizando notícias...');
            this.loadNews();
        }, this.refreshIntervalTime);
    }

    async loadNews() {
        console.log('NewsSystem: Carregando notícias...');
        if (typeof this.showLoading === 'function') this.showLoading();
        if (typeof this.hideError === 'function') this.hideError();

        try {
            const response = await fetch(this.apiUrl);
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('Detalhes do erro:', errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('Dados recebidos:', data);

            if (data.success && data.news) {
                console.log(`Recebidas ${data.news.length} notícias`);
                this.updateNewsList(data.news);
                if (typeof this.displayNews === 'function') {
                    this.displayNews(this.lastNews);
                }
                if (typeof this.updateStats === 'function') {
                    this.updateStats(this.lastNews.length, data.timestamp);
                }
            } else {
                console.error('Resposta inválida:', data);
                if (typeof this.showError === 'function') {
                    this.showError('Erro ao carregar notícias: ' + (data.error || 'Resposta inválida'));
                }
                if (typeof this.loadFallbackNews === 'function') {
                    this.loadFallbackNews();
                }
            }
        } catch (error) {
            console.error('Erro no fetch:', error);
            if (typeof this.showError === 'function') {
                this.showError('Erro de conexão: ' + error.message);
            }
            if (typeof this.loadFallbackNews === 'function') {
                this.loadFallbackNews();
            }
        } finally {
            if (typeof this.hideLoading === 'function') this.hideLoading();
        }
    }

    updateNewsList(newNews) {
        if (this.lastNews.length === 0) {
            this.lastNews = newNews.slice(0, 5);
            return;
        }

        const newItems = newNews.filter(newItem => 
            !this.lastNews.some(oldItem => oldItem.url === newItem.url)
        );

        if (newItems.length > 0) {
            console.log(`Encontradas ${newItems.length} notícias novas`);
            this.lastNews = [...this.lastNews, ...newItems]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
            if (typeof this.showNewNewsNotification === 'function') {
                this.showNewNewsNotification(newItems.length);
            }
        }
    }

    createNewsCard(news, index) {
        const date = new Date(news.date).toLocaleString('pt-BR');
        const translationBadge = news.translated ? '<span class="translation-badge">🌐 Traduzido</span>' : '';
        const image = news.image ? `<img src="${this.sanitizeHtml(news.image)}" alt="${this.sanitizeHtml(news.title)}" class="news-card-image">` : '';

        let firstSentence = '';
        if (news.content) {
            const content = this.sanitizeHtml(news.content);
            const sentenceMatch = content.match(/^[^.!?]*[.!?]/);
            firstSentence = sentenceMatch ? sentenceMatch[0].trim() : content.substring(0, 150) + (content.length > 150 ? '...' : '');
        }

        const preview = firstSentence ? `<div class="news-card-content-wrapper"><p class="news-card-content">${firstSentence}</p></div>` : '';

        return `
            <div class="news-card" id="news-card-${index}" style="cursor: pointer;">
                ${image}
                <div class="news-card-header">
                    <div class="news-card-source">
                        ${this.sanitizeHtml(news.source)}
                        ${translationBadge}
                    </div>
                    <h3 class="news-card-title">${this.sanitizeHtml(news.title)}</h3>
                    <div class="news-card-date">${date}</div>
                </div>
                ${preview}
                <div class="news-card-footer">
                    <a href="${this.sanitizeHtml(news.url)}" target="_blank" class="news-card-source-link" onclick="event.stopPropagation();">
                        Fonte: ${this.sanitizeHtml(news.source)}
                    </a>
                    <div class="news-card-read-more">
                        <span>📖 Clique para ler a notícia completa</span>
                    </div>
                </div>
            </div>
        `;
    }

    addStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .news-card-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px 8px 0 0;
                margin-bottom: 10px;
            }
            ${typeof notificationStyles !== 'undefined' ? notificationStyles : ''}
        `;
        document.head.appendChild(styleElement);
    }
}

// Tornar disponível globalmente
window.NewsSystem = NewsSystem;
window.newsSystem = new NewsSystem();
window.newsSystem.addStyles();
