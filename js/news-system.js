createNewsCard(news) {
        const date = new Date(news.date).toLocaleString('pt-BR');
        const translationBadge = news.translated ? '<span class="translation-badge">🌐 Traduzido</span>' : '';
        const content = news.content ? `<p class="news-card-content">${news.content}</p>` : '';
        
        return `
            <div class="news-card">
                <div class="news-card-header">
                    <div class="news-card-source">
                        ${news.source}
                        ${translationBadge}
                    </div>
                    <h3 classclass NewsSystem {
    constructor() {
        this.apiUrl = '/api/news';
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.init();
    }

    init() {
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
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadNews();
        });

        document.getElementById('autoRefreshBtn').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });
    }

    async loadNews() {
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();

            if (data.success) {
                this.displayNews(data.news);
                this.updateStats(data.news.length, data.timestamp);
            } else {
                this.showError('Erro ao carregar notícias: ' + data.error);
            }
        } catch (error) {
            this.showError('Erro de conexão: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayNews(news) {
        const container = document.getElementById('newsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!news || news.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = news.map(item => this.createNewsCard(item)).join('');
    }

    createNewsCard(news) {
        const date = new Date(news.date).toLocaleString('pt-BR');
        return `
            <div class="news-card">
                <div class="news-card-header">
                    <div class="news-card-source">${news.source}</div>
                    <h3 class="news-card-title">${news.title}</h3>
                    <div class="news-card-date">${date}</div>
                </div>
                <div class="news-card-footer">
                    <a href="${news.url}" target="_blank" class="news-card-link">
                        Ler mais →
                    </a>
                </div>
            </div>
        `;
    }

    updateStats(count, timestamp) {
        document.getElementById('newsCount').textContent = count;
        
        if (timestamp) {
            const date = new Date(timestamp);
            document.getElementById('lastUpdate').textContent = 
                date.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
        }
    }

    showLoading() {
        document.getElementById('loadingContainer').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }

    hideLoading() {
        document.getElementById('loadingContainer').innerHTML = '';
    }

    showError(message) {
        document.getElementById('errorContainer').innerHTML = `
            <div class="error">
                <strong>Erro:</strong> ${message}
            </div>
        `;
    }

    hideError() {
        document.getElementById('errorContainer').innerHTML = '';
    }

    startAutoRefresh() {
        if (this.autoRefresh) {
            this.refreshInterval = setInterval(() => {
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
            btn.textContent = '⏰ Auto: OFF';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        } else {
            this.autoRefresh = true;
            this.startAutoRefresh();
            btn.textContent = '⏰ Auto: ON';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        }
    }
}
