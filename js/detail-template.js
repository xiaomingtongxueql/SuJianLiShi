/**
 * 详情页模板工具
 * 用于生成统一的历史事件详情页
 */

// 视频嵌入组件
function createVideoEmbed(video) {
    if (!video || !video.bvid) {
        return `
            <div class="absolute inset-0 flex items-center justify-center text-gray-300 flex-col bg-gray-50">
                <i data-lucide="play-circle" class="w-16 h-16 mb-2 text-gray-200"></i>
                <span class="text-sm font-serif text-gray-400">[ 视频资源待添加 ]</span>
            </div>
        `;
    }
    
    const { bvid, aid, cid } = video;
    return `
        <iframe 
            src="https://player.bilibili.com/player.html?isOutside=true&aid=${aid}&bvid=${bvid}&cid=${cid || ''}&p=1&high_quality=1&danmaku=0" 
            scrolling="no" 
            border="0" 
            frameborder="no" 
            framespacing="0" 
            allowfullscreen="true"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        </iframe>
    `;
}

// 知识图谱渲染
function renderKnowledgeGraph(graph, isChina, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // 如果没有图谱数据，显示默认节点
    const graphData = (graph && graph.length > 0) ? graph : [];
    
    if (graphData.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 text-sm py-8">暂无关联节点</div>';
        return;
    }
    
    // 绘制连线（简单实现）
    graphData.forEach((node, i) => {
        if (i > 0) {
            const line = document.createElement('div');
            line.className = 'absolute bg-gray-200';
            line.style.width = '2px';
            line.style.height = '40px';
            line.style.top = (Math.min(graphData[i-1].top, node.top) + Math.abs(graphData[i-1].top - node.top) / 2) + '%';
            line.style.left = '50%';
            line.style.transform = 'translateX(-50%)';
            container.appendChild(line);
        }
    });
    
    // 绘制节点
    graphData.forEach(node => {
        const nodeEl = document.createElement('a');
        nodeEl.href = node.url || '#';
        nodeEl.className = 'absolute flex flex-col items-center cursor-pointer group transition-transform hover:scale-110 z-10';
        nodeEl.style.top = node.top + '%';
        nodeEl.style.left = node.left + '%';
        nodeEl.style.transform = 'translate(-50%, -50%)';
        
        const isCore = node.type === 'core';
        const nodeSize = isCore ? 'w-5 h-5' : 'w-3 h-3';
        const nodeBg = isCore ? (isChina ? 'bg-gold' : 'bg-blue') : 'bg-white';
        const nodeBorder = isCore ? 'border-white' : (isChina ? 'border-gold' : 'border-blue');
        
        nodeEl.innerHTML = `
            <div class="${nodeSize} rounded-full ${nodeBg} border-2 ${nodeBorder} shadow-sm mb-1"></div>
            <span class="text-[10px] ${isCore ? 'font-bold text-gray-800' : 'text-gray-500'} bg-white/80 px-1 rounded backdrop-blur-sm whitespace-nowrap">${node.label}</span>
        `;
        
        container.appendChild(nodeEl);
    });
}

// 核心词列表渲染
function renderKeywords(keywords, isChina, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!keywords || keywords.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">暂无核心词</div>';
        return;
    }
    
    keywords.forEach(kw => {
        const el = document.createElement('a');
        el.href = kw.url || '#';
        el.className = 'flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group';
        
        el.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="w-2 h-2 rounded-full ${isChina ? 'bg-gold' : 'bg-blue'}"></span>
                <span class="text-sm text-gray-600 font-bold group-hover:text-primary font-serif">${kw.text}</span>
            </div>
            <i data-lucide="arrow-right" class="w-3 h-3 text-gray-300 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"></i>
        `;
        
        container.appendChild(el);
    });
    
    lucide.createIcons();
}

// 正文核心词高亮（将核心词转换为可点击链接）
function highlightKeywords(text, keywords) {
    if (!keywords || keywords.length === 0) return text;
    
    let highlighted = text;
    keywords.forEach(kw => {
        const regex = new RegExp(kw.text, 'g');
        highlighted = highlighted.replace(regex, `<a href="${kw.url}" class="text-gold hover:text-earth underline font-bold">${kw.text}</a>`);
    });
    
    return highlighted;
}

// 从URL参数获取事件ID并加载数据
async function loadEventData() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    
    if (!eventId) {
        console.error('缺少事件ID参数');
        return null;
    }
    
    try {
        const response = await fetch('data/history.json');
        const json = await response.json();
        const event = json.events.find(e => e.id === eventId);
        return event || null;
    } catch (e) {
        console.error('加载数据失败', e);
        return null;
    }
}

// 导出函数供详情页使用
window.DetailTemplate = {
    createVideoEmbed,
    renderKnowledgeGraph,
    renderKeywords,
    highlightKeywords,
    loadEventData
};
