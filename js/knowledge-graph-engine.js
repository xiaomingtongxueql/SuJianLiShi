/**
 * Antigravity Knowledge Graph Engine v2.0
 * Obsidian-inspired SVG Relationship Renderer
 * FIXED: Now correctly uses node.group instead of node.type
 */

class KnowledgeGraphEngine {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('[KnowledgeGraphEngine] Container not found:', containerId);
            return;
        }

        this.options = {
            lineColor: options.lineColor || '#B5A642',
            nodeColor: options.nodeColor || '#B5A642',
            glowColor: options.glowColor || 'rgba(181, 166, 66, 0.4)',
            textColor: options.textColor || '#374151',
            ...options
        };

        this.nodes = [];
        this.edges = [];
        this.setupSVG();
    }

    setupSVG() {
        this.container.innerHTML = '';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.overflow = 'visible';

        // 定义发光滤镜
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood flood-color="${this.options.glowColor}" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
        `;
        this.svg.appendChild(defs);

        this.edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        this.svg.appendChild(this.edgeGroup);
        this.svg.appendChild(this.nodeGroup);
        this.container.appendChild(this.svg);

        // Add background click handler to navigate to full graph
        this.svg.style.cursor = 'pointer';
        this.svg.addEventListener('click', (e) => {
            // Only navigate if clicking on SVG background, not child elements
            if (e.target === this.svg) {
                const currentPath = encodeURIComponent(window.location.pathname.split('/').pop());
                console.log('[KnowledgeGraphEngine] Background clicked, navigating to graph_full.html?from=' + currentPath);
                window.location.href = `graph_full.html?from=${currentPath}`;
            }
        });
    }

    render(data) {
        if (!data || !data.nodes) {
            console.warn('[KnowledgeGraphEngine] No data or nodes provided');
            return;
        }
        this.nodes = data.nodes;
        this.edges = data.edges || [];

        console.log('[KnowledgeGraphEngine] Rendering', this.nodes.length, 'nodes and', this.edges.length, 'edges');

        // 预计算节点半径 (Static Sizing for Embedded View)
        this.nodes.forEach(node => {
            // Static rules: Core=8, Sub=5 (Small and tidy)
            let baseR = 5;
            if (this.isCore(node)) baseR = 8;

            node.baseRadius = baseR;
        });

        this.ensureCoordinates();
        this.drawEdges();
        this.drawNodes();
    }

    // 判断节点是否为核心节点 (兼容 type 和 group 属性)
    isCore(node) {
        return node.group === 'core' || node.type === 'core';
    }

    // 判断节点是否为次级节点
    isSub(node) {
        return node.group === 'sub' || node.type === 'sub';
    }

    ensureCoordinates() {
        // 使用 isCore 方法来兼容 group 和 type
        const centerNode = this.nodes.find(n => this.isCore(n)) || this.nodes[0];
        const otherNodes = this.nodes.filter(n => n !== centerNode);

        // 如果核心节点没有坐标，设为中心
        if (centerNode && (centerNode.x === undefined || centerNode.y === undefined)) {
            centerNode.x = 50;
            centerNode.y = 50;
        }

        // 如果其他节点没有坐标，环绕中心排列
        const radius = 30; // 30% view radius
        otherNodes.forEach((node, index) => {
            if (node.x === undefined || node.y === undefined) {
                const angle = (index / otherNodes.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
                node.x = 50 + radius * Math.cos(angle);
                node.y = 50 + radius * Math.sin(angle);
            }
        });
    }

    drawEdges() {
        this.edgeGroup.innerHTML = '';
        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);

            if (source && target) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${source.x}%`);
                line.setAttribute('y1', `${source.y}%`);
                line.setAttribute('x2', `${target.x}%`);
                line.setAttribute('y2', `${target.y}%`);
                line.setAttribute('stroke', this.options.lineColor);
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('stroke-opacity', '0.2');
                line.setAttribute('class', 'graph-edge');
                line.dataset.source = source.id;
                line.dataset.target = target.id;
                this.edgeGroup.appendChild(line);
            }
        });
    }

    drawNodes() {
        this.nodeGroup.innerHTML = '';
        this.nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'graph-node group');
            g.dataset.id = node.id;

            // 节点主体
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${node.x}%`);
            circle.setAttribute('cy', `${node.y}%`);

            // 使用预计算的 baseRadius
            circle.setAttribute('r', node.baseRadius);
            circle.setAttribute('fill', this.isCore(node) ? this.options.nodeColor : '#fff');
            circle.setAttribute('stroke', this.options.nodeColor);
            circle.setAttribute('stroke-width', '2');
            circle.style.filter = 'url(#nodeGlow)';
            circle.style.transition = 'all 0.3s ease';
            circle.style.pointerEvents = 'all';

            // 文字标签
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', `${node.x}%`);
            text.setAttribute('y', `${node.y + 5}%`); // 稍微调整垂直偏移，因为节点可能变大
            text.setAttribute('text-anchor', 'middle');
            // 字体大小也随节点大小微调
            const fontSize = Math.max(10, Math.min(14, node.baseRadius * 0.8));
            text.setAttribute('font-size', `${fontSize}px`);
            text.setAttribute('font-weight', this.isCore(node) ? 'bold' : 'normal');
            text.setAttribute('fill', this.options.textColor);
            text.textContent = node.label;
            text.style.pointerEvents = 'all';
            text.style.fontFamily = 'serif';

            g.appendChild(circle);
            g.appendChild(text);

            // 交互事件
            g.addEventListener('mouseenter', () => this.highlightConnections(node.id));
            g.addEventListener('mouseleave', () => this.resetHighlight());

            // 链接处理 - 直接在元素上添加点击事件
            if (node.url && node.url !== '#') {
                g.style.cursor = 'pointer';
                circle.style.cursor = 'pointer';
                text.style.cursor = 'pointer';

                const navigate = (e) => {
                    e.stopPropagation(); // Prevent background click from firing
                    console.log('[KnowledgeGraphEngine] Navigating to:', node.url);
                    window.location.href = node.url;
                };

                // 在所有元素上绑定点击事件
                g.onclick = navigate;
                circle.onclick = navigate;
                text.onclick = navigate;

                // Add touch support for mobile
                g.addEventListener('touchstart', (e) => {
                    // Prevent default to avoid double-firing if standard click also fires, 
                    // but might block scrolling if we are not careful. 
                    // Usually better to just let click handle it, but sometimes v-dom or specific mobile browsers need touchstart.
                    // However, for simple navigation, 'click' usually works on mobile if elements are sized right.
                    // Let's rely on standard normalization but ensure cursor pointer is forced.
                }, { passive: true });
            } else {
                g.style.cursor = 'default';
            }

            this.nodeGroup.appendChild(g);
        });
    }

    highlightConnections(nodeId) {
        const edges = this.edgeGroup.querySelectorAll('.graph-edge');
        edges.forEach(edge => {
            if (edge.dataset.source === nodeId || edge.dataset.target === nodeId) {
                edge.setAttribute('stroke-opacity', '1');
                edge.setAttribute('stroke-width', '2');
                edge.style.filter = 'url(#glow)';
            } else {
                edge.setAttribute('stroke-opacity', '0.05');
            }
        });

        const nodes = this.nodeGroup.querySelectorAll('.graph-node');
        nodes.forEach(nodeEl => {
            const id = nodeEl.dataset.id;
            const isConnected = this.edges.some(e =>
                (e.source === nodeId && e.target === id) ||
                (e.target === nodeId && e.source === id) ||
                id === nodeId
            );
            nodeEl.style.opacity = isConnected ? '1' : '0.2';

            // Highlight current node and connected nodes slightly larger
            if (isConnected) {
                const circle = nodeEl.querySelector('circle');
                const originalNode = this.nodes.find(n => n.id === id);
                // Enlarge slightly on hover (e.g. 1.2x)
                circle.setAttribute('r', originalNode.baseRadius * 1.2);
            }
        });
    }

    resetHighlight() {
        const edges = this.edgeGroup.querySelectorAll('.graph-edge');
        edges.forEach(edge => {
            edge.setAttribute('stroke-opacity', '0.2');
            edge.setAttribute('stroke-width', '1.5');
            edge.style.filter = 'none';
        });

        const nodeEls = this.nodeGroup.querySelectorAll('.graph-node');
        nodeEls.forEach(nodeEl => {
            nodeEl.style.opacity = '1';
            const circle = nodeEl.querySelector('circle');
            const nodeId = nodeEl.dataset.id;
            const originalNode = this.nodes.find(n => n.id === nodeId);
            // Restore base radius
            circle.setAttribute('r', originalNode.baseRadius);
        });
    }
}

window.KnowledgeGraphEngine = KnowledgeGraphEngine;
console.log('[KnowledgeGraphEngine] v2.0 loaded');
