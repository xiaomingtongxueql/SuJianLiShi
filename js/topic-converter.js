/**
 * 词条转换工具
 * 从现有词条HTML提取数据并转换为统一格式
 */

class TopicConverter {
    /**
     * 从现有词条HTML提取数据
     */
    static extractFromHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        const data = {
            id: '',
            title: '',
            definition: '',
            examPoints: [],
            relatedLinks: [],
            cat: 'china',
            video: null
        };

        // 提取标题
        const titleEl = doc.querySelector('h1');
        if (titleEl) {
            data.title = titleEl.textContent.trim();
            data.id = this.slugify(data.title);
        }

        // 提取定义
        const definitionSection = Array.from(doc.querySelectorAll('section')).find(s => {
            const h2 = s.querySelector('h2');
            return h2 && h2.textContent.includes('定义');
        });
        if (definitionSection) {
            const p = definitionSection.querySelector('p');
            if (p) {
                data.definition = p.textContent.trim();
            }
        }

        // 提取考点
        const examSection = Array.from(doc.querySelectorAll('section')).find(s => {
            const h2 = s.querySelector('h2');
            return h2 && (h2.textContent.includes('考点') || h2.textContent.includes('解析'));
        });
        if (examSection) {
            const examItems = examSection.querySelectorAll('.bg-yellow-50, [class*="exam"]');
            examItems.forEach(item => {
                const title = item.querySelector('h4')?.textContent.trim() || '';
                const content = item.querySelector('p')?.textContent.trim() || '';
                if (title || content) {
                    data.examPoints.push({ title, content });
                }
            });
        }

        // 提取关联词
        const relatedSection = Array.from(doc.querySelectorAll('section')).find(s => {
            const h2 = s.querySelector('h2');
            return h2 && (h2.textContent.includes('关联') || h2.textContent.includes('相关'));
        });
        if (relatedSection) {
            const links = relatedSection.querySelectorAll('a');
            links.forEach(link => {
                data.relatedLinks.push({
                    text: link.textContent.trim(),
                    url: link.getAttribute('href') || '#'
                });
            });
        }

        return data;
    }

    /**
     * 将标题转换为ID（slug）
     */
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_');
    }

    /**
     * 从现有词条文件生成新格式的详情页
     */
    static async convertTopicFile(filename) {
        try {
            const response = await fetch(filename);
            const html = await response.text();
            const data = this.extractFromHTML(html);
            
            // 使用PageGenerator生成新页面
            const generator = new PageGenerator();
            await generator.loadTemplate();
            const normalizedData = generator.normalizeTopicData(data);
            const newHTML = generator.replaceTemplate(normalizedData);
            
            return { data, newHTML };
        } catch (e) {
            console.error('转换失败:', e);
            throw e;
        }
    }
}

// 导出
window.TopicConverter = TopicConverter;
