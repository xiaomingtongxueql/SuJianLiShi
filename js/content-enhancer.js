/**
 * 内容增强工具
 * 1. 核心词高亮和点击跳转
 * 2. 统一视频嵌入组件
 * 3. 移动端优化
 */

// ==========================================
// 1. 视频嵌入组件
// ==========================================
class VideoEmbed {
    /**
     * 创建B站视频嵌入
     * @param {Object} video - 视频配置 {bvid, aid, cid}
     * @param {Object} options - 选项 {width, height, autoplay}
     */
    static createBilibili(video, options = {}) {
        if (!video || !video.bvid) {
            return this.createPlaceholder();
        }
        
        const { bvid, aid, cid } = video;
        const { autoplay = false, danmaku = false } = options;
        
        return `
            <div style="position: relative; width: 100%; height: 100%;">
                <iframe 
                    src="https://player.bilibili.com/player.html?isOutside=true&aid=${aid}&bvid=${bvid}&cid=${cid || ''}&p=1&high_quality=1&danmaku=${danmaku ? 1 : 0}&autoplay=${autoplay ? 1 : 0}" 
                    scrolling="no" 
                    border="0" 
                    frameborder="no" 
                    framespacing="0" 
                    allowfullscreen="true"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                </iframe>
            </div>
        `;
    }
    
    /**
     * 创建占位符
     */
    static createPlaceholder(text = '视频资源待添加') {
        return `
            <div class="absolute inset-0 flex items-center justify-center text-gray-300 flex-col bg-gray-50">
                <i data-lucide="play-circle" class="w-16 h-16 mb-2 text-gray-200"></i>
                <span class="text-sm font-serif text-gray-400">[ ${text} ]</span>
            </div>
        `;
    }
    
    /**
     * 渲染视频到容器
     * @param {HTMLElement} container - 容器元素
     * @param {Object} video - 视频配置
     * @param {Object} options - 选项
     */
    static render(container, video, options = {}) {
        if (!container) return;
        
        let html = '';
        if (video && video.type === 'bilibili') {
            html = this.createBilibili(video, options);
        } else {
            html = this.createPlaceholder();
        }
        
        container.innerHTML = html;
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ==========================================
// 2. 核心词高亮和点击跳转
// ==========================================
class KeywordHighlighter {
    /**
     * 在文本中高亮核心词并添加链接
     * @param {string} text - 原始文本
     * @param {Array} keywords - 核心词数组 [{text, url}]
     * @param {Object} options - 选项 {color, hoverColor}
     */
    static highlight(text, keywords, options = {}) {
        if (!keywords || keywords.length === 0) return text;
        
        const { 
            color = 'text-gold', 
            hoverColor = 'hover:text-earth',
            className = 'underline font-bold cursor-pointer transition-colors'
        } = options;
        
        let highlighted = text;
        
        // 按长度排序，先匹配长词避免短词覆盖长词
        const sortedKeywords = [...keywords].sort((a, b) => b.text.length - a.text.length);
        
        sortedKeywords.forEach(kw => {
            // 避免重复替换（如果已经是链接）
            const regex = new RegExp(`(?<!<[^>]*)(?<!href="[^"]*")${this.escapeRegex(kw.text)}`, 'g');
            highlighted = highlighted.replace(regex, (match) => {
                return `<a href="${kw.url}" class="${color} ${hoverColor} ${className}" data-keyword="${kw.text}">${match}</a>`;
            });
        });
        
        return highlighted;
    }
    
    /**
     * 转义正则表达式特殊字符
     */
    static escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 处理整个元素的内容
     * @param {HTMLElement|string} element - 元素或选择器
     * @param {Array} keywords - 核心词数组
     * @param {Object} options - 选项
     */
    static processElement(element, keywords, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        // 只处理文本节点，避免破坏HTML结构
        const walker = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // 跳过已经在链接内的文本
            if (node.parentElement.tagName !== 'A') {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const parent = textNode.parentElement;
            const originalText = textNode.textContent;
            const highlighted = this.highlight(originalText, keywords, options);
            
            if (highlighted !== originalText) {
                const temp = document.createElement('div');
                temp.innerHTML = highlighted;
                
                // 替换文本节点
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, textNode);
                }
                parent.removeChild(textNode);
            }
        });
    }
    
    /**
     * 批量处理多个元素
     * @param {string} selector - CSS选择器
     * @param {Array} keywords - 核心词数组
     * @param {Object} options - 选项
     */
    static processSelector(selector, keywords, options = {}) {
        document.querySelectorAll(selector).forEach(el => {
            this.processElement(el, keywords, options);
        });
    }
}

// ==========================================
// 3. 移动端优化工具
// ==========================================
class MobileOptimizer {
    /**
     * 优化时间轴在移动端的显示
     */
    static optimizeTimeline() {
        // 检测移动端
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return;
        
        // 添加移动端特定的类
        const timeline = document.getElementById('timeline-container');
        if (timeline) {
            timeline.classList.add('mobile-timeline');
        }
        
        // 优化卡片点击区域
        document.querySelectorAll('.timeline-card').forEach(card => {
            card.style.minHeight = '120px'; // 确保点击区域足够大
        });
    }
    
    /**
     * 优化模态框在移动端的显示
     */
    static optimizeModal() {
        const modal = document.getElementById('bentoModal');
        if (!modal) return;
        
        // 移动端全屏显示
        if (window.innerWidth < 768) {
            modal.classList.add('mobile-modal');
        }
    }
    
    /**
     * 初始化移动端优化
     */
    static init() {
        this.optimizeTimeline();
        
        // 监听窗口大小变化
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.optimizeTimeline();
                this.optimizeModal();
            }, 250);
        });
    }
}

// ==========================================
// 4. 导出
// ==========================================
window.ContentEnhancer = {
    VideoEmbed,
    KeywordHighlighter,
    MobileOptimizer
};
