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
        const currentDateEl = document.getElementById('currentDate');
        if (!currentDateEl) {
            console.warn('Elemento currentDate não encontrado');
            return;
        }
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDateEl.textContent = now.toLocaleDateString('pt-BR', options);
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        const autoRefreshBtn = document.getElementById('autoRefreshBtn');
        const closeModal = document.getElementById('closeModal');
        const modal = document.getElementById('newsModal');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Botão refresh clicado');
                this.loadNews();
            });
        } else {
            console.warn('Botão refreshBtn não encontrado');
        }

        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => {
                console.log('Botão auto-refresh clicado');
                this.toggleAutoRefresh();
            });
        } else {
            console.warn('Botão autoRefreshBtn não encontrado');
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        } else {
            console.warn('Elemento closeModal não encontrado');
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideModal();
                }
            });
        } else {
            console.warn('Elemento newsModal não encontrado');
        }

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
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('Detalhes do erro:', errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
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
                this.loadFallbackNews();
            }
        } catch (error) {
            console.error('Erro no fetch:', error);
            this.showError('Erro de conexão: ' + error.message);
            this.loadFallbackNews();
        } finally {
            this.hideLoading();
        }
    }

    loadFallbackNews() {
        console.log('Carregando notícias fallback...');
        // Importar getStaticNews dinamicamente ou assumir que está disponível globalmente
        const fallbackNews = typeof getStaticNews === 'function' ? getStaticNews() : [];
        if (fallbackNews.length > 0) {
            this.displayNews(fallbackNews);
            this.updateStats(fallbackNews.length, new Date().toISOString());
        } else {
            console.warn('Nenhuma notícia fallback disponível');
            this.showError('Nenhuma notícia disponível no momento');
        }
    }

    displayNews(news) {
        console.log('Exibindo notícias:', news.length);
        const container = document.getElementById('newsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) {
            console.error('Container newsContainer não encontrado');
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
        container.innerHTML = htmlContent;

        news.forEach((item, index) => {
            const card = document.getElementById(`news-card-${index}`);
            if (card) {
                card.addEventListener('click', () => this.showModal(item));
            }
        });

        console.log('Notícias inseridas no DOM');
    }

    createNewsCard(news, index) {
        const date = new Date(news.date).toLocaleString('pt-BR');
        const translationBadge = news.translated ? '<span class="translation-badge">🌐 Traduzido</span>' : '';

        let firstSentence = '';
        if (news.content) {
            const content = this.sanitizeHtml(news.content);
            const sentenceMatch = content.match(/^[^.!?]*[.!?]/);
            firstSentence = sentenceMatch ? sentenceMatch[0].trim() : content.substring(0, 100) + (content.length > 100 ? '...' : '');
        }

        const preview = firstSentence ? `<div class="news-card-content-wrapper"><p class="news-card-content">${firstSentence}</p></div>` : '';

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

    showModal(news) {
        const modal = document.getElementById('newsModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalSource = document.getElementById('modalSource');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');
        const modalSourceLink = document.getElementById('modalSourceLink');

        if (!modal || !modalTitle || !modalSource || !modalDate || !modalContent || !modalSourceLink) {
            console.warn('Elementos do modal não encontrados');
            return;
        }

        modalTitle.textContent = news.title;
        modalSource.textContent = news.source;
        modalDate.textContent = new Date(news.date).toLocaleString('pt-BR');
        modalContent.innerHTML = this.processFullContent(news.content);
        modalSourceLink.href = news.url;
        modalSourceLink.textContent = `Fonte: ${news.source}`;
        modalSourceLink.target = '_blank';

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('modal-show'), 10);
    }

    processFullContent(content) {
        if (!content) return '<p>Conteúdo não disponível.</p>';

        let processedContent = this.sanitizeHtml(content);
        let paragraphs = processedContent
            .split(/\n\s*\n|\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        if (paragraphs.length === 0) {
            paragraphs = [processedContent];
        }

        const htmlParagraphs = paragraphs.map(paragraph => {
            const cleanParagraph = paragraph
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .trim();
            return cleanParagraph ? `<p>${cleanParagraph}</p>` : '';
        }).filter(p => p.length > 0);

        return htmlParagraphs.length > 0 ? htmlParagraphs.join('') : '<p>Conteúdo não disponível.</p>';
    }

    hideModal() {
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    sanitizeHtml(text) {
        if (!text) return '';
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
                    <button class="retry-btn">🔄 Tentar Novamente</button>
                </div>
            `;
            const retryBtn = errorContainer.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.loadNews());
            }
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
            }, 300000);
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
window.newsSystem = new NewsSystem();
