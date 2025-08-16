class NewsSystem {
    constructor() {
        this.apiUrl = '/api/news';
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.refreshIntervalTime = 90000; // 1.5 minutos para detectar novas notícias mais rapidamente
        this.lastNewsCount = 0;
        this.lastNewsIds = new Set(); // Para rastrear notícias únicas
        this.lastNewsTitles = new Set(); // Para rastrear títulos únicos
        this.maxNews = 10; // Máximo de notícias a exibir
        this.init();
    }

    init() {
        console.log('NewsSystem: Inicializando sistema aprimorado...');
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
                console.log('Botão refresh clicado - forçando atualização');
                this.loadNews(true); // Forçar atualização
            });
        }

        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => {
                console.log('Botão auto-refresh clicado');
                this.toggleAutoRefresh();
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    // Gerar ID único mais robusto para cada notícia
    generateNewsId(news) {
        const combined = (news.title + news.url + news.date).replace(/[^\w]/g, '');
        return btoa(encodeURIComponent(combined)).substring(0, 20);
    }

    // Gerar hash do título para comparação
    generateTitleHash(title) {
        return title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    }

    async loadNews(forceRefresh = false) {
        console.log('NewsSystem: Carregando notícias...', forceRefresh ? '(forçado)' : '');
        this.showLoading();
        this.hideError();

        try {
            const url = forceRefresh ? `${this.apiUrl}?t=${Date.now()}` : this.apiUrl;
            console.log(`Fazendo fetch para: ${url}`);
            
            const response = await fetch(url, {
                cache: forceRefresh ? 'no-cache' : 'default',
                headers: {
                    'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=60'
                }
            });
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('Detalhes do erro:', errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('Dados recebidos:', data);

            if (data.success && data.news) {
                console.log(`Processando ${data.news.length} notícias`);
                
                // Processar notícias e adicionar IDs únicos
                const processedNews = data.news.map(news => ({
                    ...news,
                    id: this.generateNewsId(news),
                    titleHash: this.generateTitleHash(news.title)
                }));
                
                // Verificar se há novas notícias comparando por título e ID
                const newNewsIds = new Set(processedNews.map(n => n.id));
                const newNewsTitles = new Set(processedNews.map(n => n.titleHash));
                
                const hasNewNews = processedNews.some(news => 
                    !this.lastNewsIds.has(news.id) && 
                    !this.lastNewsTitles.has(news.titleHash)
                );
                
                if (hasNewNews && this.lastNewsIds.size > 0) {
                    const newCount = processedNews.filter(news => 
                        !this.lastNewsIds.has(news.id) && 
                        !this.lastNewsTitles.has(news.titleHash)
                    ).length;
                    this.showNewNewsNotification(newCount);
                }
                
                // Atualizar IDs e títulos conhecidos
                this.lastNewsIds = newNewsIds;
                this.lastNewsTitles = newNewsTitles;
                this.lastNewsCount = processedNews.length;
                
                // Manter apenas as notícias mais recentes
                const recentNews = this.sortAndLimitNews(processedNews);
                
                this.displayNews(recentNews);
                this.updateStats(recentNews.length, data.timestamp);
                
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

    sortAndLimitNews(news) {
        // Ordenar por data (mais recentes primeiro) e depois por título
        const sorted = news.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            // Primeiro ordenar por data
            if (dateB.getTime() !== dateA.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }
            
            // Se as datas são iguais, ordenar por título
            return a.title.localeCompare(b.title);
        });
        
        // Limitar ao número máximo de notícias
        return sorted.slice(0, this.maxNews);
    }

    showNewNewsNotification(count) {
        // Remover notificação existente se houver
        const existingNotification = document.querySelector('.new-news-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar nova notificação visual para novas notícias
        const notification = document.createElement('div');
        notification.className = 'new-news-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🔔</span>
                <span class="notification-text">${count} nova${count > 1 ? 's' : ''} notícia${count > 1 ? 's' : ''} encontrada${count > 1 ? 's' : ''}!</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
            z-index: 1000;
            animation: slideInNotification 0.4s ease-out;
            font-family: 'Poppins', sans-serif;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Remover automaticamente após 8 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutNotification 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
        
        console.log(`Notificação exibida para ${count} nova(s) notícia(s)`);
    }

    loadFallbackNews() {
        console.log('Carregando notícias fallback...');
        const fallbackNews = [
            {
                title: "Sistema de Notícias Temporariamente Indisponível",
                content: "O sistema está passando por manutenção para melhorar a detecção automática de novas notícias e a qualidade da extração de conteúdo. Durante este período, algumas notícias mais recentes podem não estar sendo exibidas. Recomendamos verificar diretamente o site do Inven Global para as últimas atualizações sobre League of Legends. O sistema será restaurado em breve com melhorias significativas.",
                url: "https://www.invenglobal.com/lol",
                image: "https://www.invenglobal.com/img/ig-logo-light.png",
                source: "Sistema",
                date: new Date().toISOString(),
                translated: false
            }
        ];
        
        const processedNews = fallbackNews.map(news => ({
            ...news,
            id: this.generateNewsId(news),
            titleHash: this.generateTitleHash(news.title)
        }));
        
        this.displayNews(processedNews);
        this.updateStats(processedNews.length, new Date().toISOString());
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

        // Adicionar event listeners para cada card
        news.forEach((item, index) => {
            const card = document.getElementById(`news-card-${index}`);
            if (card) {
                card.addEventListener('click', (e) => {
                    // Não abrir modal se clicou no link da fonte
                    if (e.target.classList.contains('news-card-source-link') || 
                        e.target.closest('.news-card-source-link')) {
                        return;
                    }
                    this.showModal(item);
                });
            }
        });

        // Lazy loading aprimorado para imagens
        this.setupLazyLoading();

        console.log('Notícias inseridas no DOM com sucesso');
    }

    createNewsCard(news, index) {
        const date = new Date(news.date);
        const isToday = this.isToday(date);
        const isRecent = this.isRecent(date);
        
        const formattedDate = isToday ? 
            `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` :
            date.toLocaleString('pt-BR');
            
        const translationBadge = news.translated ? '<span class="translation-badge">🌐 Traduzido</span>' : '';
        const recentBadge = isToday ? '<span class="recent-badge">🔥 Hoje</span>' : (isRecent ? '<span class="recent-badge">📅 Recente</span>' : '');

        let firstSentence = '';
        if (news.content) {
            const content = this.sanitizeHtml(news.content);
            // Melhor extração da primeira frase
            const sentenceMatch = content.match(/^[^.!?]*[.!?]/);
            if (sentenceMatch) {
                firstSentence = sentenceMatch[0].trim();
            } else {
                // Se não encontrar uma frase completa, pegar até 180 caracteres
                firstSentence = content.substring(0, 180) + (content.length > 180 ? '...' : '');
            }
        }

        // Usar imagem da notícia ou imagem padrão melhorada
        const imageUrl = this.validateImageUrl(news.image) || 'https://www.invenglobal.com/img/ig-logo-light.png';
        
        const preview = firstSentence ? 
            `<div class="news-card-content-wrapper">
                <p class="news-card-content">${firstSentence}</p>
            </div>` : '';

        return `
            <div class="news-card ${isToday ? 'news-card-today' : ''}" id="news-card-${index}" style="cursor: pointer;" data-news-id="${news.id || index}">
                <div class="news-card-image-container">
                    <img 
                        class="news-card-image lazy-load" 
                        data-src="${this.sanitizeHtml(imageUrl)}" 
                        alt="${this.sanitizeHtml(news.title)}"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='https://www.invenglobal.com/img/ig-logo-light.png';"
                    />
                    <div class="news-card-image-overlay"></div>
                    ${recentBadge ? `<div class="news-card-badge">${recentBadge}</div>` : ''}
                </div>
                <div class="news-card-body">
                    <div class="news-card-header">
                        <div class="news-card-source">
                            ${this.sanitizeHtml(news.source)}
                            ${translationBadge}
                        </div>
                        <h3 class="news-card-title">${this.sanitizeHtml(news.title)}</h3>
                        <div class="news-card-date">
                            <span class="date-icon">📅</span>
                            ${formattedDate}
                        </div>
                    </div>
                    ${preview}
                    <div class="news-card-footer">
                        <a href="${this.sanitizeHtml(news.url)}" target="_blank" class="news-card-source-link" onclick="event.stopPropagation();">
                            <span class="link-icon">🔗</span>
                            Fonte: ${this.sanitizeHtml(news.source)}
                        </a>
                        <div class="news-card-read-more">
                            <span class="read-icon">📖</span>
                            <span>Ler completa</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Verificar se a data é hoje
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    // Verificar se a data é recente (últimos 2 dias)
    isRecent(date) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        return date >= twoDaysAgo;
    }

    // Validar URL da imagem
    validateImageUrl(url) {
        if (!url) return null;
        
        try {
            new URL(url);
            return url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ? url : null;
        } catch {
            return null;
        }
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('.lazy-load');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        
                        if (src) {
                            // Adicionar loading placeholder
                            img.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            
                            img.src = src;
                            img.classList.remove('lazy-load');
                            img.classList.add('loaded');
                            
                            img.onload = () => {
                                img.style.opacity = '1';
                                img.style.backgroundColor = 'transparent';
                            };
                            
                            img.onerror = () => {
                                img.src = 'https://www.invenglobal.com/img/ig-logo-light.png';
                                img.style.opacity = '1';
                                img.style.backgroundColor = 'transparent';
                                console.warn('Falha ao carregar imagem:', src);
                            };
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback para navegadores sem IntersectionObserver
            images.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.classList.remove('lazy-load');
                    img.classList.add('loaded');
                }
            });
        }
    }

    showModal(news) {
        const modal = document.getElementById('newsModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalSource = document.getElementById('modalSource');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');
        const modalSourceLink = document.getElementById('modalSourceLink');
        const modalImage = document.getElementById('modalImage');

        if (!modal || !modalTitle || !modalSource || !modalDate || !modalContent || !modalSourceLink) {
            console.warn('Elementos do modal não encontrados');
            return;
        }

        modalTitle.textContent = news.title;
        modalSource.textContent = news.source;
        
        const date = new Date(news.date);
        const isToday = this.isToday(date);
        modalDate.textContent = isToday ? 
            `Hoje, ${date.toLocaleTimeString('pt-BR')}` : 
            date.toLocaleString('pt-BR');
            
        modalContent.innerHTML = this.processFullContent(news.content);
        modalSourceLink.href = news.url;
        modalSourceLink.textContent = `Ler artigo original no ${news.source}`;
        modalSourceLink.target = '_blank';

        // Adicionar imagem ao modal se existir
        if (modalImage && this.validateImageUrl(news.image)) {
            modalImage.src = news.image;
            modalImage.style.display = 'block';
            modalImage.alt = news.title;
            modalImage.onerror = () => {
                modalImage.style.display = 'none';
            };
        } else if (modalImage) {
            modalImage.style.display = 'none';
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll da página
        setTimeout(() => modal.classList.add('modal-show'), 10);
    }

    processFullContent(content) {
        if (!content) return '<p>Conteúdo não disponível.</p>';

        let processedContent = this.sanitizeHtml(content);
        
        // Dividir em parágrafos mantendo títulos
        let paragraphs = processedContent
            .split(/\n\s*\n|\n/)
            .map(p => p.trim())
            .filter(p => p.length > 15); // Filtrar parágrafos muito curtos

        if (paragraphs.length === 0) {
            // Fallback: dividir por pontos se não há quebras de linha
            paragraphs = processedContent
                .split(/\.\s+/)
                .map(p => p.trim())
                .filter(p => p.length > 30)
                .map(p => p.endsWith('.') ? p : p + '.');
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
            
            // Detectar se é um título (começa com ##)
            if (cleanParagraph.startsWith('## ')) {
                const titleText = cleanParagraph.substring(3);
                return `<h3 class="content-subtitle">${titleText}</h3>`;
            }
            
            return cleanParagraph ? `<p class="content-paragraph">${cleanParagraph}</p>` : '';
        }).filter(p => p.length > 0);

        return htmlParagraphs.length > 0 ? htmlParagraphs.join('') : '<p>Conteúdo não disponível.</p>';
    }

    hideModal() {
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.classList.remove('modal-show');
            document.body.style.overflow = ''; // Restaurar scroll da página
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
            // Animação no contador
            const currentCount = parseInt(newsCountEl.textContent) || 0;
            if (count !== currentCount) {
                this.animateCounter(newsCountEl, currentCount, count);
            }
        }

        if (timestamp && lastUpdateEl) {
            const date = new Date(timestamp);
            lastUpdateEl.textContent = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    animateCounter(element, start, end) {
        const duration = 1000;
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    showLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Buscando as últimas notícias do Inven Global...</p>
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
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
                    <span class="error-icon">⚠️</span>
                    <div class="error-content">
                        <strong>Erro ao carregar notícias</strong>
                        <p>${message}</p>
                    </div>
                    <button class="retry-btn">🔄 Tentar Novamente</button>
                </div>
            `;
            const retryBtn = errorContainer.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.loadNews(true));
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
                console.log('Auto-refresh executado - verificando novas notícias');
                this.loadNews();
            }, this.refreshIntervalTime);
            console.log(`Auto-refresh iniciado (${this.refreshIntervalTime / 1000} segundos)`);
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
                btn.innerHTML = '⏰ Auto: <span style="color: #f44336;">OFF</span>';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-warning');
            }
            console.log('Auto-refresh desativado');
        } else {
            this.autoRefresh = true;
            this.startAutoRefresh();
            if (btn) {
                btn.innerHTML = '⏰ Auto: <span style="color: #4CAF50;">ON</span>';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-secondary');
            }
            console.log('Auto-refresh ativado');
        }
    }
}

// Tornar disponível globalmente
window.NewsSystem = NewsSystem;

// Inicializar sistema quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado - inicializando NewsSystem');
    window.newsSystem = new NewsSystem();
});

// Fallback para inicialização imediata se DOM já estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.newsSystem) {
            console.log('Inicializando NewsSystem via DOMContentLoaded');
            window.newsSystem = new NewsSystem();
        }
    });
} else {
    if (!window.newsSystem) {
        console.log('Inicializando NewsSystem imediatamente');
        window.newsSystem = new NewsSystem();
    }
}
