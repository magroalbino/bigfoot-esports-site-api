// Inicializar o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new NewsSystem();
});

// Utilitários globais
window.AppUtils = {
    formatDate: (date) => {
        return new Date(date).toLocaleString('pt-BR');
    },
    
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },
    
    sanitizeHtml: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
