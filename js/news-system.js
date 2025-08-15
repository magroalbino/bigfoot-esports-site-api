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
        }
    }

    startAutoRefresh() {
        if (!this.autoRefresh) return;
        console.log(`NewsSystem: AutoRefresh ativado a cada ${this.refreshIntervalTime / 1000} segundos.`);
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            console.log('AutoRefresh: Atualizando notícias...');
            this.loadNews();
        }, this.refreshIntervalTime);
    }

    showLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'block';
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    hideError() {
        const errorEl = document.getElementById('error-message');
        if (errorEl) errorEl.style.display = 'none';
    }

    async loadNews() {
        console.log('NewsSystem: Carregando notícias...');
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.news) {
                this.updateNewsList(data.news);
                this.displayNews(this.lastNews);
            } else {
                this.showError('Erro ao carregar notícias.');
            }
        } catch (error) {
            console.error('Erro no fetch:', error);
            this.showError('Erro de conexão: ' + error.message);
        } finally {
            this.hideLoading();
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
            this.lastNews = [...this.lastNews, ...newItems]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
        }
    }

    displayNews(newsList) {
        const container = document.getElementById('news-container');
        if (!container) return;
        container.innerHTML = '';

        if (newsList.length === 0) {
            container.innerHTML = '<p>Nenhuma notícia disponível no momento.</p>';
            return;
        }

        newsList.forEach((news, index) => {
            const cardHTML = this.createNewsCard(news, index);
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
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
                </div>
            </div>
        `;
    }

    sanitizeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));
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
        `;
        document.head.appendChild(styleElement);
    }
}

// Tornar disponível globalmente
window.NewsSystem = NewsSystem;
window.newsSystem = new NewsSystem();
window.newsSystem.addStyles();
