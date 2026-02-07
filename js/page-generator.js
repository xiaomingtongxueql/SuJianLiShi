/**
 * 页面生成器
 * 从JSON数据自动生成详情页HTML
 */

class PageGenerator {
    constructor() {
        this.template = null;
    }

    /**
     * 加载模板文件
     */
    async loadTemplate() {
        try {
            const response = await fetch('templates/detail-standard.html');
            this.template = await response.text();
            return true;
        } catch (e) {
            console.error('无法加载模板文件', e);
            return false;
        }
    }

    /**
     * 生成知识图谱HTML
     */
    generateGraph(graph, isChina) {
        if (!graph || graph.length === 0) {
            return '<div class="text-center text-gray-400 text-sm py-8">暂无关联节点</div>';
        }

        let html = '';
        // 绘制连线
        html += `<div class="absolute left-1/2 top-[25%] bottom-[25%] w-px -translate-x-1/2 bg-gold"></div>`;
        
        // 绘制节点
        graph.forEach(node => {
            const isCore = node.type === 'core';
            const nodeSize = isCore ? 'w-5 h-5' : 'w-3 h-3';
            const nodeBg = isCore ? (isChina ? 'bg-gold' : 'bg-blue') : 'bg-white';
            const nodeBorder = isCore ? 'border-white' : (isChina ? 'border-gold' : 'border-blue');
            
            html += `
                <a href="${node.url || '#'}" class="absolute top-[${node.top}%] left-[${node.left}%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform z-10">
                    <div class="${nodeSize} rounded-full ${nodeBg} border-2 ${nodeBorder} shadow-sm mb-1"></div>
                    <span class="text-[10px] ${isCore ? 'font-bold text-gray-800' : 'text-gray-500'} bg-white/80 px-1 rounded backdrop-blur-sm whitespace-nowrap">${node.label}</span>
                </a>
            `;
        });

        return html;
    }

    /**
     * 生成核心词列表HTML
     */
    generateKeywords(keywords, isChina) {
        if (!keywords || keywords.length === 0) {
            return '<div class="text-center text-gray-400 text-sm py-4">暂无核心词</div>';
        }

        return keywords.map(kw => `
            <a href="${kw.url || '#'}" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                <div class="flex items-center gap-3">
                    <span class="w-2 h-2 ${isChina ? 'bg-gold' : 'bg-blue'} rounded-full"></span>
                    <span class="text-sm text-gray-600 font-bold group-hover:text-primary font-serif">${kw.text}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3 h-3 text-gray-300 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"></i>
            </a>
        `).join('');
    }

    /**
     * 生成考点解析HTML
     */
    generateExamPoints(points) {
        if (!points || points.length === 0) return '';
        
        return points.map(point => `
            <div class="bg-yellow-50 border-l-4 border-gold p-4">
                <h4 class="font-bold text-primary mb-2">${point.title}</h4>
                <p class="text-stone text-sm">${point.content}</p>
            </div>
        `).join('');
    }

    /**
     * 生成历史回响HTML
     */
    generateImpact(impacts) {
        if (!impacts || impacts.length === 0) return '';
        
        const cards = impacts.map(impact => `
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gold hover:shadow-md transition-all">
                <div class="text-gold font-bold mb-2 text-lg">${impact.title}</div>
                <p class="text-sm text-gray-500 leading-6">${impact.content}</p>
            </div>
        `).join('');
        return `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${cards}</div>`;
    }

    /**
     * 将词条数据转换为统一格式（兼容朝代数据格式）
     */
    normalizeTopicData(topicData) {
        // 判断是否为词条数据（有definition字段）
        const isTopic = topicData.definition !== undefined;
        
        if (!isTopic) {
            return topicData; // 已经是标准格式，直接返回
        }

        // 转换词条数据为标准格式
        const normalized = {
            ...topicData,
            // 基础信息
            title: topicData.title || topicData.name,
            display: topicData.display || '概念词条',
            cat: topicData.cat || 'china', // 默认中国史
            intro: topicData.definition || topicData.intro || topicData.desc,
            desc: topicData.definition || topicData.desc,
            
            // 从关联词生成图谱节点
            graph: topicData.graph || this.generateGraphFromRelated(topicData.relatedLinks || topicData.related || []),
            
            // 从关联词生成核心词列表
            keywords: topicData.keywords || this.generateKeywordsFromRelated(topicData.relatedLinks || topicData.related || []),
            
            // 考点解析（从examPoints转换）
            examPoints: topicData.examPoints || this.convertExamPoints(topicData.examPoints || []),
            
            // 历史回响（如果有）
            impacts: topicData.impacts || [],
            
            // 视频（如果有）
            video: topicData.video || null,
            
            // 章节内容：将定义和考点转换为章节
            section1: topicData.section1 || {
                title: '核心定义',
                icon: 'book-open',
                content: this.formatSectionContent(topicData.definition || '')
            },
            section2: topicData.section2 || (topicData.examPoints && topicData.examPoints.length > 0 ? {
                title: '考点解析',
                icon: 'edit-3',
                content: this.generateExamPointsContent(topicData.examPoints)
            } : null),
            section3: topicData.section3 || null
        };

        return normalized;
    }

    /**
     * 从关联词生成图谱节点
     */
    generateGraphFromRelated(relatedLinks) {
        if (!relatedLinks || relatedLinks.length === 0) {
            return [];
        }

        // 将关联词转换为图谱节点
        return relatedLinks.map((link, index) => {
            const isString = typeof link === 'string';
            const label = isString ? link : (link.text || link.label || '');
            const url = isString ? '#' : (link.url || link.href || '#');
            
            // 计算节点位置（垂直分布）
            const total = relatedLinks.length;
            const top = 20 + (index * (60 / Math.max(1, total - 1)));
            const left = 50; // 居中
            
            return {
                label: label,
                top: top,
                left: left,
                type: index === 0 ? 'core' : 'sub', // 第一个为核心节点
                url: url
            };
        });
    }

    /**
     * 从关联词生成核心词列表
     */
    generateKeywordsFromRelated(relatedLinks) {
        if (!relatedLinks || relatedLinks.length === 0) {
            return [];
        }

        return relatedLinks.map(link => {
            if (typeof link === 'string') {
                return { text: link, url: '#' };
            }
            return {
                text: link.text || link.label || '',
                url: link.url || link.href || '#'
            };
        });
    }

    /**
     * 转换考点数据格式
     */
    convertExamPoints(examPoints) {
        if (!examPoints || examPoints.length === 0) {
            return [];
        }

        return examPoints.map(point => {
            if (typeof point === 'string') {
                return { title: point, content: '' };
            }
            if (point.title && point.content) {
                return point;
            }
            // 兼容旧格式：{text: "...", desc: "..."}
            return {
                title: point.title || point.text || '',
                content: point.content || point.desc || ''
            };
        });
    }

    /**
     * 格式化章节内容
     */
    formatSectionContent(content) {
        if (!content) return '';
        
        return `
            <div class="space-y-6">
                <p class="text-stone leading-7">${content}</p>
            </div>
        `;
    }

    /**
     * 生成考点解析章节内容
     */
    generateExamPointsContent(examPoints) {
        if (!examPoints || examPoints.length === 0) {
            return '';
        }

        const points = this.convertExamPoints(examPoints);
        return `
            <div class="space-y-4">
                ${points.map(point => `
                    <div class="bg-yellow-50 border-l-4 border-gold p-4">
                        <h4 class="font-bold text-primary mb-2">${point.title}</h4>
                        <p class="text-stone text-sm">${point.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 替换模板变量
     */
    replaceTemplate(data) {
        if (!this.template) {
            throw new Error('模板未加载');
        }

        // 标准化数据（处理词条数据）
        const normalizedData = this.normalizeTopicData(data);

        const isChina = normalizedData.cat === 'china';
        const category = isChina ? '中国史' : (normalizedData.cat === 'world' ? '世界史' : '历史对照');

        let html = this.template;

        // 基础信息
        html = html.replace(/\{\{TITLE\}\}/g, normalizedData.title || '');
        html = html.replace(/\{\{DISPLAY_TIME\}\}/g, normalizedData.display || '');
        html = html.replace(/\{\{CATEGORY\}\}/g, category);
        html = html.replace(/\{\{INTRO\}\}/g, normalizedData.intro || normalizedData.desc || '');

        // 章节内容处理
        // 先替换占位符
        html = html.replace(/\{\{SECTION1_TITLE\}\}/g, normalizedData.section1?.title || '');
        html = html.replace(/\{\{SECTION1_CONTENT\}\}/g, normalizedData.section1?.content || '');
        html = html.replace(/\{\{ICON1\}\}/g, normalizedData.section1?.icon || 'book-open');
        
        html = html.replace(/\{\{SECTION2_TITLE\}\}/g, normalizedData.section2?.title || '');
        html = html.replace(/\{\{SECTION2_CONTENT\}\}/g, normalizedData.section2?.content || '');
        html = html.replace(/\{\{ICON2\}\}/g, normalizedData.section2?.icon || 'book-open');
        
        html = html.replace(/\{\{SECTION3_TITLE\}\}/g, normalizedData.section3?.title || '');
        html = html.replace(/\{\{SECTION3_CONTENT\}\}/g, normalizedData.section3?.content || '');
        html = html.replace(/\{\{ICON3\}\}/g, normalizedData.section3?.icon || 'book-open');

        // 移除空的section（如果title为空，移除整个section块）
        if (!normalizedData.section1?.title) {
            html = html.replace(/<!-- 核心叙事1 -->[\s\S]*?<\/section>/m, '');
        }
        if (!normalizedData.section2?.title) {
            html = html.replace(/<!-- 核心叙事2 -->[\s\S]*?<\/section>/m, '');
        }
        if (!normalizedData.section3?.title) {
            html = html.replace(/<!-- 核心叙事3 -->[\s\S]*?<\/section>/m, '');
        }

        // 知识图谱
        html = html.replace(/\{\{GRAPH_NODES\}\}/g, this.generateGraph(normalizedData.graph, isChina));

        // 核心词
        html = html.replace(/\{\{KEYWORDS_LIST\}\}/g, this.generateKeywords(normalizedData.keywords, isChina));
        html = html.replace(/\{\{KEYWORDS_JSON\}\}/g, JSON.stringify(normalizedData.keywords || []));

        // 考点解析
        html = html.replace(/\{\{EXAM_POINTS\}\}/g, this.generateExamPoints(normalizedData.examPoints || []));

        // 历史回响
        html = html.replace(/\{\{HISTORICAL_IMPACT\}\}/g, this.generateImpact(normalizedData.impacts || []));

        // 视频
        html = html.replace(/\{\{VIDEO_JSON\}\}/g, JSON.stringify(normalizedData.video || null));

        return html;
    }

    /**
     * 从事件ID生成页面
     */
    async generateFromEventId(eventId) {
        try {
            // 加载数据
            const response = await fetch('data/history.json');
            const json = await response.json();
            const event = json.events.find(e => e.id === eventId);

            if (!event) {
                throw new Error(`未找到事件: ${eventId}`);
            }

            // 加载模板
            if (!this.template) {
                await this.loadTemplate();
            }

            // 生成HTML
            const html = this.replaceTemplate(event);

            return html;
        } catch (e) {
            console.error('生成页面失败', e);
            throw e;
        }
    }

    /**
     * 保存生成的HTML到文件（浏览器环境无法直接保存，返回HTML字符串）
     */
    async generateAndDownload(eventId, filename) {
        const html = await this.generateFromEventId(eventId);
        
        // 创建下载链接
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${eventId}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 导出
window.PageGenerator = PageGenerator;
