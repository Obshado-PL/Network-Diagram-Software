// ============================================================
// MikroTik Network Diagram Tool - Application Logic
// ============================================================

(function () {
    'use strict';

    // ======================== CONSTANTS ========================
    const PORT_HEIGHT = 14;
    const PORT_GAP = 4;
    const GROUP_GAP = 14;
    const BODY_PADDING = 12;
    const LABEL_HEIGHT = 24;
    const GRID_SIZE = 20;
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5;
    const MAX_UNDO = 50;

    const NS = 'http://www.w3.org/2000/svg';

    // ======================== STATE ========================
    const state = {
        devices: [],
        connections: [],
        textboxes: [],
        nextId: 1,
        tool: 'select',
        selectedDeviceIds: new Set(),
        selectedConnectionId: null,
        selectedTextboxId: null,
        pendingConnection: null,
        isDragging: false,
        dragStart: null,
        isPanning: false,
        panStart: null,
        isSelecting: false,
        selectionStart: null,
        viewBox: { x: -200, y: -100, w: 1920, h: 1080 },
        zoom: 1,
        undoStack: [],
        redoStack: [],
    };

    // ======================== DOM REFS ========================
    let svg, devicesLayer, connectionsLayer, tempLineLayer, selectionLayer, textboxesLayer;
    let deviceList, connectionTableBody, connectionCount;

    // ======================== INIT ========================
    document.addEventListener('DOMContentLoaded', () => {
        svg = document.getElementById('canvas');
        devicesLayer = document.getElementById('devices-layer');
        textboxesLayer = document.getElementById('textboxes-layer');
        connectionsLayer = document.getElementById('connections-layer');
        tempLineLayer = document.getElementById('temp-line-layer');
        selectionLayer = document.getElementById('selection-layer');
        deviceList = document.getElementById('device-list');
        connectionTableBody = document.getElementById('connection-table-body');
        connectionCount = document.getElementById('connection-count');

        buildSidebar();
        setupToolbar();
        setupCanvasEvents();
        setupKeyboard();
        setupContextMenu();
        setupConnectionPanel();
        setupLogo();
        updateViewBox();
        loadFromLocalStorage();
        updateStatusBar();
    });

    // ======================== SIDEBAR ========================
    function buildSidebar() {
        deviceList.innerHTML = '';
        SIDEBAR_CATEGORIES.forEach(cat => {
            cat.subcategories.forEach(sub => {
                const devices = getDevicesBySubcategory(sub.id);
                if (devices.length === 0) return;

                const catDiv = document.createElement('div');
                catDiv.className = 'device-category';

                const header = document.createElement('div');
                header.className = 'category-header';
                header.innerHTML = `<span class="arrow">&#9660;</span>${sub.label} (${devices.length})`;
                header.addEventListener('click', () => {
                    header.classList.toggle('collapsed');
                    itemsDiv.classList.toggle('collapsed');
                });

                const itemsDiv = document.createElement('div');
                itemsDiv.className = 'category-items';

                devices.forEach(device => {
                    const item = document.createElement('div');
                    item.className = 'device-item';
                    item.draggable = true;
                    item.dataset.modelId = device.modelId;
                    item.title = device.description;

                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'device-icon';
                    iconDiv.innerHTML = createMiniDeviceSVG(device);

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'device-info';
                    infoDiv.innerHTML = `
                        <div class="device-name">${device.name}</div>
                        <div class="device-model">${device.ports.length} ports</div>
                    `;

                    item.appendChild(iconDiv);
                    item.appendChild(infoDiv);
                    itemsDiv.appendChild(item);

                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', device.modelId);
                        e.dataTransfer.effectAllowed = 'copy';
                    });
                });

                catDiv.appendChild(header);
                catDiv.appendChild(itemsDiv);
                deviceList.appendChild(catDiv);
            });
        });

        // Search
        document.getElementById('device-search').addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.device-item').forEach(item => {
                const name = item.querySelector('.device-name').textContent.toLowerCase();
                const model = item.dataset.modelId.toLowerCase();
                const match = !q || name.includes(q) || model.includes(q);
                item.style.display = match ? '' : 'none';
            });
            document.querySelectorAll('.device-category').forEach(cat => {
                const visible = cat.querySelectorAll('.device-item[style=""], .device-item:not([style])');
                cat.style.display = visible.length > 0 ? '' : 'none';
            });
        });
    }

    function createMiniDeviceSVG(device) {
        if (device.category === 'utilities') {
            return `<svg viewBox="0 0 28 18" xmlns="${NS}">
                <path d="M6,13 C3,13 2,9 5,7 C5,3 9,2 11,5 C13,2 17,2 18,5 C21,3 25,5 23,9 C26,10 25,13 22,13 Z"
                    fill="#1a2440" stroke="#4488aa" stroke-width="1"/>
                <circle cx="14" cy="9" r="3" fill="none" stroke="#88bbdd" stroke-width="0.6"/>
                <ellipse cx="14" cy="9" rx="1.5" ry="3" fill="none" stroke="#88bbdd" stroke-width="0.4"/>
                <line x1="11" y1="9" x2="17" y2="9" stroke="#88bbdd" stroke-width="0.4"/>
            </svg>`;
        }
        const isRouter = device.category === 'routers';
        if (isRouter) {
            // Router icon: circle with 4 arrows pointing outward
            return `<svg viewBox="0 0 28 18" xmlns="${NS}">
                <circle cx="14" cy="9" r="6" fill="#1a1a2e" stroke="#0099CC" stroke-width="1.2"/>
                <line x1="14" y1="3" x2="14" y2="1" stroke="#0099CC" stroke-width="1" stroke-linecap="round"/>
                <line x1="14" y1="15" x2="14" y2="17" stroke="#0099CC" stroke-width="1" stroke-linecap="round"/>
                <line x1="8" y1="9" x2="3" y2="9" stroke="#0099CC" stroke-width="1" stroke-linecap="round"/>
                <line x1="20" y1="9" x2="25" y2="9" stroke="#0099CC" stroke-width="1" stroke-linecap="round"/>
                <polyline points="12,2 14,0.5 16,2" fill="none" stroke="#0099CC" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="12,16 14,17.5 16,16" fill="none" stroke="#0099CC" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="4,7 2.5,9 4,11" fill="none" stroke="#0099CC" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="24,7 25.5,9 24,11" fill="none" stroke="#0099CC" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
                <text x="14" y="11" text-anchor="middle" font-size="5" fill="#0099CC" font-weight="bold" font-family="Arial">R</text>
            </svg>`;
        } else {
            // Switch icon: rectangle with multiple port lines along bottom
            return `<svg viewBox="0 0 28 18" xmlns="${NS}">
                <rect x="2" y="3" width="24" height="10" rx="2" fill="#1a1a2e" stroke="#4CAF50" stroke-width="1.2"/>
                <rect x="2" y="3" width="24" height="3" rx="2" fill="#4CAF50" opacity="0.3"/>
                <rect x="2" y="5" width="24" height="1" fill="#4CAF50" opacity="0.3"/>
                <rect x="5" y="8" width="2.5" height="3" rx="0.5" fill="none" stroke="#4CAF50" stroke-width="0.6"/>
                <rect x="9" y="8" width="2.5" height="3" rx="0.5" fill="none" stroke="#4CAF50" stroke-width="0.6"/>
                <rect x="13" y="8" width="2.5" height="3" rx="0.5" fill="none" stroke="#4CAF50" stroke-width="0.6"/>
                <rect x="17" y="8" width="2.5" height="3" rx="0.5" fill="none" stroke="#4CAF50" stroke-width="0.6"/>
                <rect x="21" y="8" width="2.5" height="3" rx="0.5" fill="none" stroke="#4CAF50" stroke-width="0.6"/>
                <line x1="6.25" y1="13" x2="6.25" y2="15" stroke="#4CAF50" stroke-width="0.7"/>
                <line x1="10.25" y1="13" x2="10.25" y2="15" stroke="#4CAF50" stroke-width="0.7"/>
                <line x1="14.25" y1="13" x2="14.25" y2="15" stroke="#4CAF50" stroke-width="0.7"/>
                <line x1="18.25" y1="13" x2="18.25" y2="15" stroke="#4CAF50" stroke-width="0.7"/>
                <line x1="22.25" y1="13" x2="22.25" y2="15" stroke="#4CAF50" stroke-width="0.7"/>
                <circle cx="5" cy="5" r="0.8" fill="#4CAF50"/>
            </svg>`;
        }
    }

    // ======================== TOOLBAR ========================
    function setupToolbar() {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => setTool(btn.dataset.tool));
        });

        document.getElementById('btn-undo').addEventListener('click', undo);
        document.getElementById('btn-redo').addEventListener('click', redo);
        document.getElementById('btn-zoom-in').addEventListener('click', () => zoomBy(1.2));
        document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(0.8));
        document.getElementById('btn-zoom-fit').addEventListener('click', zoomFit);
        document.getElementById('btn-save').addEventListener('click', saveToFile);
        document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('btn-export').addEventListener('click', exportPDF);
        document.getElementById('btn-clear').addEventListener('click', clearCanvas);

        document.getElementById('file-input').addEventListener('change', loadFromFile);
    }

    function setTool(tool) {
        state.tool = tool;
        cancelPendingConnection();
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        svg.className.baseVal = `tool-${tool}`;
    }

    // ======================== SVG DEVICE RENDERING ========================

    function calculateDeviceWidth(catalog) {
        let totalWidth = BODY_PADDING;
        const groups = groupPortsByGroup(catalog.ports);
        const groupKeys = Object.keys(groups);
        groupKeys.forEach((key, gi) => {
            groups[key].forEach(port => {
                totalWidth += getPortWidth(port.type) + PORT_GAP;
            });
            if (gi < groupKeys.length - 1) totalWidth += GROUP_GAP;
        });
        totalWidth += BODY_PADDING;
        // Minimum width to fit the label
        return Math.max(140, totalWidth);
    }

    function groupPortsByGroup(ports) {
        const groups = {};
        ports.forEach(p => {
            const g = p.group || 'default';
            if (!groups[g]) groups[g] = [];
            groups[g].push(p);
        });
        return groups;
    }

    // Shorten port label for display: "SFP28-1" -> "1", "E1" -> "1", "QSFP28-2" -> "Q2"
    function shortPortLabel(port) {
        const t = port.type;
        const lbl = port.label;
        const numMatch = lbl.match(/(\d+)$/);
        if (!numMatch) return lbl;
        const num = numMatch[1];
        // SFP/QSFP types: show full label
        if (t.startsWith('qsfp') || t.startsWith('sfp')) return lbl;
        // Ethernet types: just the number
        return num;
    }

    function renderDeviceSVG(instance) {
        const catalog = getDeviceCatalogEntry(instance.modelId);
        if (!catalog) return null;

        // Use cloud renderer for utilities
        if (catalog.category === 'utilities') {
            return renderCloudSVG(instance, catalog);
        }

        const bodyWidth = calculateDeviceWidth(catalog);
        const isRouter = catalog.category === 'routers';
        const accentColor = isRouter ? '#0099CC' : '#4CAF50';
        const bodyRx = isRouter ? 6 : 3;

        // Layout measurements
        const bodyTop = LABEL_HEIGHT;
        const bodyHeight = 56;
        const portAreaTop = bodyTop + bodyHeight - PORT_HEIGHT - 6; // ports sit inside the body near the bottom
        const portLabelHeight = 20; // space below body for port labels
        const totalHeight = bodyTop + bodyHeight + portLabelHeight;

        const g = document.createElementNS(NS, 'g');
        g.classList.add('canvas-device');
        g.dataset.instanceId = instance.instanceId;
        g.setAttribute('transform', `translate(${instance.x}, ${instance.y})`);

        // Selection rect
        const selRect = document.createElementNS(NS, 'rect');
        selRect.setAttribute('x', -4);
        selRect.setAttribute('y', -4);
        selRect.setAttribute('width', bodyWidth + 8);
        selRect.setAttribute('height', totalHeight + 8);
        selRect.setAttribute('rx', 6);
        selRect.setAttribute('fill', 'transparent');
        selRect.setAttribute('stroke', 'transparent');
        selRect.setAttribute('stroke-width', 2);
        selRect.classList.add('device-selection-rect');
        g.appendChild(selRect);

        // ---- DEVICE BODY ----
        // Main body with subtle gradient effect (two overlapping rects)
        const bodyBg = document.createElementNS(NS, 'rect');
        bodyBg.setAttribute('x', 0);
        bodyBg.setAttribute('y', bodyTop);
        bodyBg.setAttribute('width', bodyWidth);
        bodyBg.setAttribute('height', bodyHeight);
        bodyBg.setAttribute('rx', bodyRx);
        bodyBg.setAttribute('fill', '#16192a');
        bodyBg.setAttribute('stroke', '#30363d');
        bodyBg.setAttribute('stroke-width', 1.5);
        bodyBg.classList.add('device-body');
        g.appendChild(bodyBg);

        // Inner panel (slightly inset, lighter)
        const innerPanel = document.createElementNS(NS, 'rect');
        innerPanel.setAttribute('x', 3);
        innerPanel.setAttribute('y', bodyTop + 9);
        innerPanel.setAttribute('width', bodyWidth - 6);
        innerPanel.setAttribute('height', bodyHeight - 12);
        innerPanel.setAttribute('rx', bodyRx - 1);
        innerPanel.setAttribute('fill', '#1c2035');
        innerPanel.setAttribute('stroke', '#262a3d');
        innerPanel.setAttribute('stroke-width', 0.5);
        innerPanel.setAttribute('pointer-events', 'none');
        g.appendChild(innerPanel);

        // Top accent bar (thick, with rounded top corners)
        const accentBar = document.createElementNS(NS, 'rect');
        accentBar.setAttribute('x', 0);
        accentBar.setAttribute('y', bodyTop);
        accentBar.setAttribute('width', bodyWidth);
        accentBar.setAttribute('height', 7);
        accentBar.setAttribute('rx', bodyRx);
        accentBar.setAttribute('fill', accentColor);
        accentBar.setAttribute('pointer-events', 'none');
        g.appendChild(accentBar);
        // Square off bottom of accent bar
        const accentSquare = document.createElementNS(NS, 'rect');
        accentSquare.setAttribute('x', 0);
        accentSquare.setAttribute('y', bodyTop + 4);
        accentSquare.setAttribute('width', bodyWidth);
        accentSquare.setAttribute('height', 3);
        accentSquare.setAttribute('fill', accentColor);
        accentSquare.setAttribute('pointer-events', 'none');
        g.appendChild(accentSquare);

        // ---- BRANDING: centered MikroTik logo text in the body ----
        const brandY = bodyTop + 18; // right below accent bar, above port area
        const brand = document.createElementNS(NS, 'text');
        brand.setAttribute('x', bodyWidth / 2);
        brand.setAttribute('y', brandY);
        brand.setAttribute('text-anchor', 'middle');
        brand.setAttribute('font-size', '9');
        brand.setAttribute('fill', accentColor);
        brand.setAttribute('font-weight', '700');
        brand.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif');
        brand.setAttribute('opacity', '0.5');
        brand.setAttribute('pointer-events', 'none');
        brand.setAttribute('letter-spacing', '1.5');
        brand.textContent = 'MikroTik';
        g.appendChild(brand);

        // Decorative status LEDs (top-right of body)
        const ledColors = ['#4CAF50', '#FF9800'];
        ledColors.forEach((c, i) => {
            const led = document.createElementNS(NS, 'circle');
            led.setAttribute('cx', bodyWidth - 14 + i * 8);
            led.setAttribute('cy', bodyTop + 14);
            led.setAttribute('r', 2);
            led.setAttribute('fill', c);
            led.setAttribute('opacity', '0.4');
            led.setAttribute('pointer-events', 'none');
            g.appendChild(led);
        });

        // Category icon (small, top-left of body next to accent bar)
        const iconX = 12;
        const iconY = bodyTop + 14;
        if (isRouter) {
            // Small router icon: circle with crosshair
            const ic = document.createElementNS(NS, 'circle');
            ic.setAttribute('cx', iconX); ic.setAttribute('cy', iconY);
            ic.setAttribute('r', 4);
            ic.setAttribute('fill', 'none');
            ic.setAttribute('stroke', accentColor);
            ic.setAttribute('stroke-width', 0.8);
            ic.setAttribute('opacity', '0.4');
            ic.setAttribute('pointer-events', 'none');
            g.appendChild(ic);
            const cross = document.createElementNS(NS, 'path');
            cross.setAttribute('d', `M${iconX},${iconY - 3}v6 M${iconX - 3},${iconY}h6`);
            cross.setAttribute('stroke', accentColor);
            cross.setAttribute('stroke-width', 0.6);
            cross.setAttribute('opacity', '0.3');
            cross.setAttribute('fill', 'none');
            cross.setAttribute('pointer-events', 'none');
            g.appendChild(cross);
        } else {
            // Small switch icon: two stacked lines
            for (let i = 0; i < 2; i++) {
                const row = document.createElementNS(NS, 'rect');
                row.setAttribute('x', iconX - 4);
                row.setAttribute('y', iconY - 3 + i * 5);
                row.setAttribute('width', 8);
                row.setAttribute('height', 3);
                row.setAttribute('rx', 1);
                row.setAttribute('fill', 'none');
                row.setAttribute('stroke', accentColor);
                row.setAttribute('stroke-width', 0.7);
                row.setAttribute('opacity', '0.4');
                row.setAttribute('pointer-events', 'none');
                g.appendChild(row);
            }
        }

        // ---- LABEL (above body) ----
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', bodyWidth / 2);
        label.setAttribute('y', LABEL_HEIGHT - 6);
        label.classList.add('device-label-text');
        label.textContent = instance.label;
        g.appendChild(label);

        // ---- PORTS (inside body, near bottom edge) ----
        let portX = BODY_PADDING;
        const groups = groupPortsByGroup(catalog.ports);
        const groupKeys = Object.keys(groups);
        const portCount = catalog.ports.length;

        instance._portPositions = {};

        groupKeys.forEach((key, gi) => {
            const groupPorts = groups[key];

            // Group separator line between port groups (subtle vertical divider)
            if (gi > 0 && groupPorts.length > 0) {
                const sep = document.createElementNS(NS, 'line');
                sep.setAttribute('x1', portX - GROUP_GAP / 2);
                sep.setAttribute('y1', portAreaTop + 2);
                sep.setAttribute('x2', portX - GROUP_GAP / 2);
                sep.setAttribute('y2', portAreaTop + PORT_HEIGHT - 2);
                sep.setAttribute('stroke', '#333');
                sep.setAttribute('stroke-width', 0.5);
                sep.setAttribute('pointer-events', 'none');
                g.appendChild(sep);
            }

            groupPorts.forEach(port => {
                const pw = getPortWidth(port.type);
                const color = getPortColor(port.type);
                const portCx = portX + pw / 2;
                const portCy = portAreaTop + PORT_HEIGHT / 2;

                // Port background (filled slot)
                const portSlot = document.createElementNS(NS, 'rect');
                portSlot.setAttribute('x', portX);
                portSlot.setAttribute('y', portAreaTop);
                portSlot.setAttribute('width', pw);
                portSlot.setAttribute('height', PORT_HEIGHT);
                portSlot.setAttribute('rx', 2);
                portSlot.setAttribute('fill', '#0d1117');
                portSlot.setAttribute('stroke', color);
                portSlot.setAttribute('stroke-width', 1.2);
                portSlot.classList.add('port-shape');
                portSlot.dataset.instanceId = instance.instanceId;
                portSlot.dataset.portId = port.id;

                const isConnected = state.connections.some(c =>
                    (c.sourceDeviceId === instance.instanceId && c.sourcePortId === port.id) ||
                    (c.targetDeviceId === instance.instanceId && c.targetPortId === port.id)
                );
                if (isConnected) portSlot.classList.add('connected');
                g.appendChild(portSlot);

                // Inner detail: small filled indicator inside the port
                const indicator = document.createElementNS(NS, 'rect');
                indicator.setAttribute('x', portX + 2);
                indicator.setAttribute('y', portAreaTop + 2);
                indicator.setAttribute('width', pw - 4);
                indicator.setAttribute('height', PORT_HEIGHT - 4);
                indicator.setAttribute('rx', 1);
                indicator.setAttribute('fill', color);
                indicator.setAttribute('opacity', isConnected ? '0.5' : '0.15');
                indicator.setAttribute('pointer-events', 'none');
                g.appendChild(indicator);

                // Port highlight ring
                const highlight = document.createElementNS(NS, 'rect');
                highlight.setAttribute('x', portX - 1);
                highlight.setAttribute('y', portAreaTop - 1);
                highlight.setAttribute('width', pw + 2);
                highlight.setAttribute('height', PORT_HEIGHT + 2);
                highlight.setAttribute('rx', 3);
                highlight.classList.add('port-highlight');
                g.appendChild(highlight);

                // Hitbox
                const hitbox = document.createElementNS(NS, 'rect');
                hitbox.setAttribute('x', portX - 2);
                hitbox.setAttribute('y', portAreaTop - 4);
                hitbox.setAttribute('width', pw + 4);
                hitbox.setAttribute('height', PORT_HEIGHT + 12);
                hitbox.setAttribute('fill', 'transparent');
                hitbox.setAttribute('cursor', 'crosshair');
                hitbox.classList.add('port-hitbox');
                hitbox.dataset.instanceId = instance.instanceId;
                hitbox.dataset.portId = port.id;
                g.appendChild(hitbox);

                // Port number label below the body
                const pLabel = document.createElementNS(NS, 'text');
                pLabel.setAttribute('x', portCx);
                pLabel.setAttribute('y', bodyTop + bodyHeight + 11);
                pLabel.setAttribute('text-anchor', 'middle');
                pLabel.setAttribute('font-size', portCount > 16 ? '5.5' : '7');
                pLabel.setAttribute('fill', color);
                pLabel.setAttribute('font-family', 'Consolas, Courier New, monospace');
                pLabel.setAttribute('font-weight', '600');
                pLabel.setAttribute('opacity', '0.7');
                pLabel.setAttribute('pointer-events', 'none');
                pLabel.classList.add('port-label-text');
                pLabel.textContent = shortPortLabel(port);
                g.appendChild(pLabel);

                // Store position for connection routing (below port labels)
                instance._portPositions[port.id] = {
                    localX: portCx,
                    localY: totalHeight
                };

                portX += pw + PORT_GAP;
            });

            if (gi < groupKeys.length - 1) portX += GROUP_GAP;
        });

        // Store device dimensions
        instance._width = bodyWidth;
        instance._height = totalHeight;

        return g;
    }

    // ======================== CLOUD (INTERNET) RENDERER ========================
    function renderCloudSVG(instance, catalog) {
        const cloudW = 160;
        const cloudH = 90;
        const labelY = 14;
        const portLabelH = 20;
        const totalW = cloudW;
        const totalH = labelY + cloudH + portLabelH;

        const g = document.createElementNS(NS, 'g');
        g.classList.add('canvas-device');
        g.dataset.instanceId = instance.instanceId;
        g.setAttribute('transform', `translate(${instance.x}, ${instance.y})`);

        // Selection rect
        const selRect = document.createElementNS(NS, 'rect');
        selRect.setAttribute('x', -4);
        selRect.setAttribute('y', -4);
        selRect.setAttribute('width', totalW + 8);
        selRect.setAttribute('height', totalH + 8);
        selRect.setAttribute('rx', 6);
        selRect.setAttribute('fill', 'transparent');
        selRect.setAttribute('stroke', 'transparent');
        selRect.setAttribute('stroke-width', 2);
        selRect.classList.add('device-selection-rect');
        g.appendChild(selRect);

        // Cloud shape path
        const cx = cloudW / 2;
        const cy = labelY + cloudH / 2;
        const cloud = document.createElementNS(NS, 'path');
        cloud.setAttribute('d',
            `M ${cx - 50},${cy + 15} ` +
            `C ${cx - 70},${cy + 15} ${cx - 75},${cy - 10} ${cx - 55},${cy - 20} ` +
            `C ${cx - 55},${cy - 40} ${cx - 30},${cy - 45} ${cx - 15},${cy - 35} ` +
            `C ${cx - 5},${cy - 50} ${cx + 20},${cy - 50} ${cx + 30},${cy - 35} ` +
            `C ${cx + 50},${cy - 45} ${cx + 70},${cy - 25} ${cx + 55},${cy - 10} ` +
            `C ${cx + 75},${cy - 5} ${cx + 70},${cy + 15} ${cx + 50},${cy + 15} Z`
        );
        cloud.setAttribute('fill', '#1a2440');
        cloud.setAttribute('stroke', '#4488aa');
        cloud.setAttribute('stroke-width', 1.5);
        cloud.classList.add('cloud-body');
        cloud.classList.add('device-body');
        g.appendChild(cloud);

        // Fixed "Internet" text inside cloud (doesn't change on rename)
        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '13');
        text.setAttribute('fill', '#88bbdd');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif');
        text.setAttribute('pointer-events', 'none');
        text.textContent = catalog.name;
        g.appendChild(text);

        // Globe icon inside cloud (above text)
        const globe = document.createElementNS(NS, 'g');
        globe.setAttribute('pointer-events', 'none');
        globe.setAttribute('opacity', '0.4');
        const gc = document.createElementNS(NS, 'circle');
        gc.setAttribute('cx', cx); gc.setAttribute('cy', cy - 18);
        gc.setAttribute('r', 8);
        gc.setAttribute('fill', 'none'); gc.setAttribute('stroke', '#88bbdd'); gc.setAttribute('stroke-width', 0.8);
        globe.appendChild(gc);
        const ge1 = document.createElementNS(NS, 'ellipse');
        ge1.setAttribute('cx', cx); ge1.setAttribute('cy', cy - 18);
        ge1.setAttribute('rx', 4); ge1.setAttribute('ry', 8);
        ge1.setAttribute('fill', 'none'); ge1.setAttribute('stroke', '#88bbdd'); ge1.setAttribute('stroke-width', 0.5);
        globe.appendChild(ge1);
        const gl1 = document.createElementNS(NS, 'line');
        gl1.setAttribute('x1', cx - 8); gl1.setAttribute('y1', cy - 18);
        gl1.setAttribute('x2', cx + 8); gl1.setAttribute('y2', cy - 18);
        gl1.setAttribute('stroke', '#88bbdd'); gl1.setAttribute('stroke-width', 0.5);
        globe.appendChild(gl1);
        g.appendChild(globe);

        // WAN port at bottom center (inside cloud body, above bottom edge)
        instance._portPositions = {};
        const port = catalog.ports[0];
        const pw = getPortWidth(port.type);
        const color = getPortColor(port.type);
        const portX = cx - pw / 2;
        const portY = labelY + cloudH - PORT_HEIGHT - 10;

        const portSlot = document.createElementNS(NS, 'rect');
        portSlot.setAttribute('x', portX);
        portSlot.setAttribute('y', portY);
        portSlot.setAttribute('width', pw);
        portSlot.setAttribute('height', PORT_HEIGHT);
        portSlot.setAttribute('rx', 2);
        portSlot.setAttribute('fill', '#0d1117');
        portSlot.setAttribute('stroke', color);
        portSlot.setAttribute('stroke-width', 1.2);
        portSlot.classList.add('port-shape');
        portSlot.dataset.instanceId = instance.instanceId;
        portSlot.dataset.portId = port.id;
        const isConnected = state.connections.some(c =>
            (c.sourceDeviceId === instance.instanceId && c.sourcePortId === port.id) ||
            (c.targetDeviceId === instance.instanceId && c.targetPortId === port.id)
        );
        if (isConnected) portSlot.classList.add('connected');
        g.appendChild(portSlot);

        // Port indicator
        const indicator = document.createElementNS(NS, 'rect');
        indicator.setAttribute('x', portX + 2);
        indicator.setAttribute('y', portY + 2);
        indicator.setAttribute('width', pw - 4);
        indicator.setAttribute('height', PORT_HEIGHT - 4);
        indicator.setAttribute('rx', 1);
        indicator.setAttribute('fill', color);
        indicator.setAttribute('opacity', isConnected ? '0.5' : '0.15');
        indicator.setAttribute('pointer-events', 'none');
        g.appendChild(indicator);

        // Port hitbox
        const hitbox = document.createElementNS(NS, 'rect');
        hitbox.setAttribute('x', portX - 2);
        hitbox.setAttribute('y', portY - 4);
        hitbox.setAttribute('width', pw + 4);
        hitbox.setAttribute('height', PORT_HEIGHT + 12);
        hitbox.setAttribute('fill', 'transparent');
        hitbox.setAttribute('cursor', 'crosshair');
        hitbox.classList.add('port-hitbox');
        hitbox.dataset.instanceId = instance.instanceId;
        hitbox.dataset.portId = port.id;
        g.appendChild(hitbox);

        // Port label below cloud
        const pLabel = document.createElementNS(NS, 'text');
        pLabel.setAttribute('x', cx);
        pLabel.setAttribute('y', labelY + cloudH + 11);
        pLabel.setAttribute('text-anchor', 'middle');
        pLabel.setAttribute('font-size', '7');
        pLabel.setAttribute('fill', color);
        pLabel.setAttribute('font-family', 'Consolas, Courier New, monospace');
        pLabel.setAttribute('font-weight', '600');
        pLabel.setAttribute('opacity', '0.7');
        pLabel.setAttribute('pointer-events', 'none');
        pLabel.textContent = port.label;
        g.appendChild(pLabel);

        // Device label (above cloud)
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', cx);
        label.setAttribute('y', labelY - 6);
        label.classList.add('device-label-text');
        label.textContent = instance.label;
        g.appendChild(label);

        // Store port position (below port label area)
        instance._portPositions[port.id] = {
            localX: cx,
            localY: totalH
        };

        instance._width = totalW;
        instance._height = totalH;

        return g;
    }

    function getPortWorldPosition(instance, portId) {
        if (!instance._portPositions || !instance._portPositions[portId]) return null;
        const local = instance._portPositions[portId];
        return {
            x: instance.x + local.localX,
            y: instance.y + local.localY
        };
    }

    // ======================== TEXT BOX MANAGEMENT ========================
    function addTextBox(x, y) {
        pushUndo();
        const tb = {
            textboxId: 'tb_' + state.nextId++,
            text: 'Text',
            x: snapToGrid(x),
            y: snapToGrid(y),
            fontSize: 14
        };
        state.textboxes.push(tb);
        const svgEl = renderTextBoxSVG(tb);
        if (svgEl) textboxesLayer.appendChild(svgEl);
        state.selectedTextboxId = tb.textboxId;
        updateSelectionVisuals();
        updateStatusBar();
        autoSave();
        // Immediately prompt for text
        startTextEdit(tb);
    }

    function renderTextBoxSVG(tb) {
        const g = document.createElementNS(NS, 'g');
        g.classList.add('canvas-textbox');
        g.dataset.textboxId = tb.textboxId;
        g.setAttribute('transform', `translate(${tb.x}, ${tb.y})`);

        // Split text into lines
        const lines = tb.text.split('\n');
        const lineHeight = tb.fontSize * 1.3;
        const charWidth = tb.fontSize * 0.6;
        const maxLineLen = Math.max(...lines.map(l => l.length), 4);
        const textW = maxLineLen * charWidth + 16;
        const textH = lines.length * lineHeight + 12;

        // Background rect (subtle, dashed border)
        const bg = document.createElementNS(NS, 'rect');
        bg.setAttribute('x', 0);
        bg.setAttribute('y', 0);
        bg.setAttribute('width', textW);
        bg.setAttribute('height', textH);
        bg.setAttribute('rx', 4);
        bg.setAttribute('fill', 'rgba(13, 17, 23, 0.6)');
        bg.setAttribute('stroke', '#30363d');
        bg.setAttribute('stroke-width', 1);
        bg.setAttribute('stroke-dasharray', '4,2');
        bg.classList.add('textbox-bg');
        g.appendChild(bg);

        // Text lines
        lines.forEach((line, i) => {
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('x', 8);
            t.setAttribute('y', 6 + tb.fontSize + i * lineHeight);
            t.setAttribute('font-size', tb.fontSize);
            t.setAttribute('fill', '#e6edf3');
            t.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif');
            t.textContent = line;
            g.appendChild(t);
        });

        // Store dimensions for bounds/selection
        tb._width = textW;
        tb._height = textH;

        return g;
    }

    function findTextBox(textboxId) {
        return state.textboxes.find(tb => tb.textboxId === textboxId);
    }

    function deleteTextBox(textboxId) {
        pushUndo();
        state.textboxes = state.textboxes.filter(tb => tb.textboxId !== textboxId);
        const el = textboxesLayer.querySelector(`[data-textbox-id="${textboxId}"]`);
        if (el) el.remove();
        if (state.selectedTextboxId === textboxId) state.selectedTextboxId = null;
        updateStatusBar();
        autoSave();
    }

    function rerenderTextBox(tb) {
        const old = textboxesLayer.querySelector(`[data-textbox-id="${tb.textboxId}"]`);
        if (old) old.remove();
        const svgEl = renderTextBoxSVG(tb);
        if (svgEl) textboxesLayer.appendChild(svgEl);
        updateSelectionVisuals();
    }

    function startTextEdit(tb) {
        const text = prompt('Enter text:', tb.text);
        if (text !== null && text.trim()) {
            pushUndo();
            tb.text = text.trim();
            rerenderTextBox(tb);
            autoSave();
        }
    }

    // ======================== CANVAS EVENTS ========================
    function setupCanvasEvents() {
        const container = document.getElementById('canvas-container');

        // Drag and drop from sidebar
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            const modelId = e.dataTransfer.getData('text/plain');
            if (!modelId) return;
            const pos = screenToCanvas(e.clientX, e.clientY);
            addDevice(modelId, snapToGrid(pos.x), snapToGrid(pos.y));
        });

        // Mouse events on SVG
        svg.addEventListener('mousedown', onCanvasMouseDown);
        svg.addEventListener('mousemove', onCanvasMouseMove);
        svg.addEventListener('mouseup', onCanvasMouseUp);
        svg.addEventListener('wheel', onCanvasWheel, { passive: false });
        svg.addEventListener('dblclick', onCanvasDblClick);
        svg.addEventListener('contextmenu', (e) => e.preventDefault());

        // Track mouse for status bar
        svg.addEventListener('mousemove', (e) => {
            const pos = screenToCanvas(e.clientX, e.clientY);
            document.getElementById('status-coords').textContent =
                `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
        });
    }

    function onCanvasMouseDown(e) {
        const pos = screenToCanvas(e.clientX, e.clientY);

        // Middle mouse or Space for pan
        if (e.button === 1) {
            startPan(e);
            return;
        }

        if (e.button !== 0) return;

        // Check if clicking a port hitbox
        const portHit = e.target.closest('.port-hitbox');
        if (portHit && (state.tool === 'connect' || state.tool === 'select')) {
            onPortClick(portHit.dataset.instanceId, portHit.dataset.portId);
            return;
        }

        // Check if clicking a device
        const deviceGroup = e.target.closest('.canvas-device');
        if (deviceGroup) {
            const instanceId = deviceGroup.dataset.instanceId;

            if (state.tool === 'delete') {
                deleteDevice(instanceId);
                return;
            }

            if (state.tool === 'select') {
                if (!e.shiftKey) {
                    if (!state.selectedDeviceIds.has(instanceId)) {
                        state.selectedDeviceIds.clear();
                        state.selectedConnectionId = null;
                    }
                }
                state.selectedTextboxId = null;
                state.selectedDeviceIds.add(instanceId);
                updateSelectionVisuals();
                startDeviceDrag(e, pos);
                return;
            }
            return;
        }

        // Check if clicking a text box
        const textboxGroup = e.target.closest('.canvas-textbox');
        if (textboxGroup) {
            const tbId = textboxGroup.dataset.textboxId;
            if (state.tool === 'delete') {
                deleteTextBox(tbId);
                return;
            }
            if (state.tool === 'select') {
                state.selectedDeviceIds.clear();
                state.selectedConnectionId = null;
                state.selectedTextboxId = tbId;
                updateSelectionVisuals();
                // Start text box drag
                const tb = findTextBox(tbId);
                if (tb) {
                    state.isDragging = true;
                    state.dragStart = {
                        mouseX: pos.x, mouseY: pos.y,
                        origins: [{ id: tbId, x: tb.x, y: tb.y, isTextbox: true }]
                    };
                    svg.classList.add('dragging-device');
                }
                return;
            }
            return;
        }

        // Check if clicking a connection line
        const connGroup = e.target.closest('.connection-group');
        if (connGroup) {
            const connId = connGroup.dataset.connectionId;
            if (state.tool === 'delete') {
                deleteConnection(connId);
                return;
            }
            state.selectedDeviceIds.clear();
            state.selectedConnectionId = connId;
            updateSelectionVisuals();
            return;
        }

        // Empty canvas click
        if (state.tool === 'text') {
            addTextBox(pos.x, pos.y);
            return;
        }

        if (state.tool === 'select') {
            if (!e.shiftKey) {
                state.selectedDeviceIds.clear();
                state.selectedConnectionId = null;
                state.selectedTextboxId = null;
                updateSelectionVisuals();
            }
            startSelectionRect(pos);
            return;
        }

        // Pan if no tool interaction
        if (state.pendingConnection) {
            cancelPendingConnection();
        }
    }

    function onCanvasMouseMove(e) {
        const pos = screenToCanvas(e.clientX, e.clientY);

        if (state.isPanning) {
            updatePan(e);
            return;
        }

        if (state.isDragging) {
            updateDeviceDrag(pos);
            return;
        }

        if (state.isSelecting) {
            updateSelectionRect(pos);
            return;
        }

        // Rubber-band line for pending connection
        if (state.pendingConnection) {
            updateRubberBand(pos);
        }

        // Port hover effects
        const portHit = e.target.closest('.port-hitbox');
        if (portHit) {
            svg.style.cursor = 'crosshair';
        } else if (e.target.closest('.canvas-textbox') && state.tool === 'select') {
            svg.style.cursor = 'move';
        } else if (e.target.closest('.canvas-device') && state.tool === 'select') {
            svg.style.cursor = 'move';
        }
    }

    function onCanvasMouseUp(e) {
        if (state.isPanning) {
            endPan();
            return;
        }

        if (state.isDragging) {
            endDeviceDrag();
            return;
        }

        if (state.isSelecting) {
            endSelectionRect();
            return;
        }
    }

    function onCanvasWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const mousePos = screenToCanvas(e.clientX, e.clientY);
        zoomAt(factor, mousePos);
    }

    function onCanvasDblClick(e) {
        const deviceGroup = e.target.closest('.canvas-device');
        if (deviceGroup) {
            const instance = findDevice(deviceGroup.dataset.instanceId);
            if (instance) startRename(instance);
            return;
        }
        const textboxGroup = e.target.closest('.canvas-textbox');
        if (textboxGroup) {
            const tb = findTextBox(textboxGroup.dataset.textboxId);
            if (tb) startTextEdit(tb);
        }
    }

    // ======================== PAN ========================
    function startPan(e) {
        state.isPanning = true;
        state.panStart = {
            x: e.clientX, y: e.clientY,
            vx: state.viewBox.x, vy: state.viewBox.y
        };
        svg.classList.add('panning');
    }

    function updatePan(e) {
        const rect = svg.getBoundingClientRect();
        const dx = (e.clientX - state.panStart.x) * (state.viewBox.w / rect.width);
        const dy = (e.clientY - state.panStart.y) * (state.viewBox.h / rect.height);
        state.viewBox.x = state.panStart.vx - dx;
        state.viewBox.y = state.panStart.vy - dy;
        updateViewBox();
    }

    function endPan() {
        state.isPanning = false;
        svg.classList.remove('panning');
    }

    // ======================== ZOOM ========================
    function updateViewBox() {
        svg.setAttribute('viewBox',
            `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);

        // Update grid patterns to scale
        const gridSmall = document.getElementById('grid-small');
        const gridLarge = document.getElementById('grid-large');
        if (gridSmall && gridLarge) {
            gridSmall.setAttribute('width', 20);
            gridSmall.setAttribute('height', 20);
            gridLarge.setAttribute('width', 100);
            gridLarge.setAttribute('height', 100);
        }
    }

    function zoomBy(factor) {
        const cx = state.viewBox.x + state.viewBox.w / 2;
        const cy = state.viewBox.y + state.viewBox.h / 2;
        zoomAt(factor, { x: cx, y: cy });
    }

    function zoomAt(factor, center) {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom * factor));
        const actualFactor = newZoom / state.zoom;
        state.zoom = newZoom;

        const newW = state.viewBox.w / actualFactor;
        const newH = state.viewBox.h / actualFactor;

        state.viewBox.x = center.x - (center.x - state.viewBox.x) / actualFactor;
        state.viewBox.y = center.y - (center.y - state.viewBox.y) / actualFactor;
        state.viewBox.w = newW;
        state.viewBox.h = newH;

        updateViewBox();
        updateZoomDisplay();
    }

    function zoomFit() {
        if (state.devices.length === 0 && state.textboxes.length === 0) {
            state.viewBox = { x: -200, y: -100, w: 1920, h: 1080 };
            state.zoom = 1;
            updateViewBox();
            updateZoomDisplay();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.devices.forEach(d => {
            minX = Math.min(minX, d.x);
            minY = Math.min(minY, d.y);
            maxX = Math.max(maxX, d.x + (d._width || 200));
            maxY = Math.max(maxY, d.y + (d._height || 100));
        });
        state.textboxes.forEach(tb => {
            minX = Math.min(minX, tb.x);
            minY = Math.min(minY, tb.y);
            maxX = Math.max(maxX, tb.x + (tb._width || 100));
            maxY = Math.max(maxY, tb.y + (tb._height || 30));
        });

        const padding = 100;
        const rect = svg.getBoundingClientRect();
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;
        const scaleX = rect.width / contentW;
        const scaleY = rect.height / contentH;
        const scale = Math.min(scaleX, scaleY, MAX_ZOOM);

        state.zoom = scale;
        state.viewBox.w = rect.width / scale;
        state.viewBox.h = rect.height / scale;
        state.viewBox.x = minX - padding - (state.viewBox.w - contentW) / 2;
        state.viewBox.y = minY - padding - (state.viewBox.h - contentH) / 2;

        updateViewBox();
        updateZoomDisplay();
    }

    function updateZoomDisplay() {
        const pct = Math.round(state.zoom * 100);
        document.getElementById('zoom-level').textContent = pct + '%';
        document.getElementById('status-zoom').textContent = 'Zoom: ' + pct + '%';
    }

    // ======================== COORDINATE HELPERS ========================
    function screenToCanvas(screenX, screenY) {
        const rect = svg.getBoundingClientRect();
        return {
            x: state.viewBox.x + ((screenX - rect.left) / rect.width) * state.viewBox.w,
            y: state.viewBox.y + ((screenY - rect.top) / rect.height) * state.viewBox.h
        };
    }

    function snapToGrid(val) {
        return Math.round(val / GRID_SIZE) * GRID_SIZE;
    }

    // ======================== DEVICE MANAGEMENT ========================
    function addDevice(modelId, x, y) {
        const catalog = getDeviceCatalogEntry(modelId);
        if (!catalog) return;

        pushUndo();

        const instance = {
            instanceId: 'dev_' + state.nextId++,
            modelId,
            label: catalog.name,
            x, y,
            _portPositions: {},
            _width: 0,
            _height: 0
        };

        state.devices.push(instance);
        const svgEl = renderDeviceSVG(instance);
        if (svgEl) devicesLayer.appendChild(svgEl);

        state.selectedDeviceIds.clear();
        state.selectedDeviceIds.add(instance.instanceId);
        updateSelectionVisuals();
        updateStatusBar();
        autoSave();
    }

    function findDevice(instanceId) {
        return state.devices.find(d => d.instanceId === instanceId);
    }

    function deleteDevice(instanceId) {
        pushUndo();

        // Remove connections involving this device
        const toRemove = state.connections.filter(c =>
            c.sourceDeviceId === instanceId || c.targetDeviceId === instanceId);
        toRemove.forEach(c => {
            const group = connectionsLayer.querySelector(`.connection-group[data-connection-id="${c.connectionId}"]`);
            if (group) group.remove();
        });
        state.connections = state.connections.filter(c =>
            c.sourceDeviceId !== instanceId && c.targetDeviceId !== instanceId);

        // Remove device
        state.devices = state.devices.filter(d => d.instanceId !== instanceId);
        const el = devicesLayer.querySelector(`[data-instance-id="${instanceId}"]`);
        if (el) el.remove();

        state.selectedDeviceIds.delete(instanceId);
        rebuildConnectionTable();
        updateStatusBar();
        autoSave();
    }

    function deleteSelectedDevices() {
        if (state.selectedTextboxId) {
            deleteTextBox(state.selectedTextboxId);
            return;
        }

        if (state.selectedDeviceIds.size === 0 && !state.selectedConnectionId) return;

        if (state.selectedConnectionId) {
            deleteConnection(state.selectedConnectionId);
            return;
        }

        const ids = [...state.selectedDeviceIds];
        ids.forEach(id => deleteDevice(id));
    }

    // ======================== DEVICE DRAGGING ========================
    function startDeviceDrag(e, pos) {
        state.isDragging = true;
        state.dragStart = {
            mouseX: pos.x, mouseY: pos.y,
            origins: [...state.selectedDeviceIds].map(id => {
                const d = findDevice(id);
                return { id, x: d.x, y: d.y };
            })
        };
        svg.classList.add('dragging-device');
    }

    function updateDeviceDrag(pos) {
        const dx = pos.x - state.dragStart.mouseX;
        const dy = pos.y - state.dragStart.mouseY;

        state.dragStart.origins.forEach(origin => {
            if (origin.isTextbox) {
                const tb = findTextBox(origin.id);
                if (!tb) return;
                tb.x = snapToGrid(origin.x + dx);
                tb.y = snapToGrid(origin.y + dy);
                const el = textboxesLayer.querySelector(`[data-textbox-id="${origin.id}"]`);
                if (el) el.setAttribute('transform', `translate(${tb.x}, ${tb.y})`);
                return;
            }
            const dev = findDevice(origin.id);
            if (!dev) return;
            dev.x = snapToGrid(origin.x + dx);
            dev.y = snapToGrid(origin.y + dy);

            const el = devicesLayer.querySelector(`[data-instance-id="${origin.id}"]`);
            if (el) el.setAttribute('transform', `translate(${dev.x}, ${dev.y})`);

            updateConnectionsForDevice(origin.id);
        });
    }

    function endDeviceDrag() {
        state.isDragging = false;
        svg.classList.remove('dragging-device');
        pushUndo();
        autoSave();
    }

    // ======================== SELECTION RECT ========================
    function startSelectionRect(pos) {
        state.isSelecting = true;
        state.selectionStart = { x: pos.x, y: pos.y };

        const rect = document.createElementNS(NS, 'rect');
        rect.classList.add('selection-rect');
        rect.setAttribute('x', pos.x);
        rect.setAttribute('y', pos.y);
        rect.setAttribute('width', 0);
        rect.setAttribute('height', 0);
        rect.id = 'active-selection';
        selectionLayer.appendChild(rect);
    }

    function updateSelectionRect(pos) {
        const rect = document.getElementById('active-selection');
        if (!rect) return;
        const x = Math.min(state.selectionStart.x, pos.x);
        const y = Math.min(state.selectionStart.y, pos.y);
        const w = Math.abs(pos.x - state.selectionStart.x);
        const h = Math.abs(pos.y - state.selectionStart.y);
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
    }

    function endSelectionRect() {
        state.isSelecting = false;
        const rect = document.getElementById('active-selection');
        if (!rect) return;

        const rx = parseFloat(rect.getAttribute('x'));
        const ry = parseFloat(rect.getAttribute('y'));
        const rw = parseFloat(rect.getAttribute('width'));
        const rh = parseFloat(rect.getAttribute('height'));

        if (rw > 5 && rh > 5) {
            state.devices.forEach(d => {
                const dw = d._width || 200;
                const dh = d._height || 100;
                if (d.x + dw > rx && d.x < rx + rw && d.y + dh > ry && d.y < ry + rh) {
                    state.selectedDeviceIds.add(d.instanceId);
                }
            });
            updateSelectionVisuals();
        }

        rect.remove();
    }

    function updateSelectionVisuals() {
        // Devices
        devicesLayer.querySelectorAll('.canvas-device').forEach(g => {
            g.classList.toggle('selected', state.selectedDeviceIds.has(g.dataset.instanceId));
        });

        // Connections
        connectionsLayer.querySelectorAll('.connection-line').forEach(line => {
            line.classList.toggle('selected', line.dataset.connectionId === state.selectedConnectionId);
        });

        // Text boxes
        textboxesLayer.querySelectorAll('.canvas-textbox').forEach(g => {
            g.classList.toggle('selected', g.dataset.textboxId === state.selectedTextboxId);
        });
    }

    // ======================== CONNECTION SYSTEM ========================
    function onPortClick(instanceId, portId) {
        if (isPortConnected(instanceId, portId)) {
            // If already connected, select the connection
            const conn = state.connections.find(c =>
                (c.sourceDeviceId === instanceId && c.sourcePortId === portId) ||
                (c.targetDeviceId === instanceId && c.targetPortId === portId));
            if (conn) {
                state.selectedConnectionId = conn.connectionId;
                state.selectedDeviceIds.clear();
                updateSelectionVisuals();
                highlightConnectionInTable(conn.connectionId);
            }
            return;
        }

        if (!state.pendingConnection) {
            // First click - start connection
            state.pendingConnection = { deviceId: instanceId, portId };
            const portEl = devicesLayer.querySelector(
                `.port-shape[data-instance-id="${instanceId}"][data-port-id="${portId}"]`);
            if (portEl) portEl.classList.add('pending');
            return;
        }

        // Second click - complete connection
        if (state.pendingConnection.deviceId === instanceId) {
            // Same device, cancel
            cancelPendingConnection();
            return;
        }

        createConnection(
            state.pendingConnection.deviceId,
            state.pendingConnection.portId,
            instanceId,
            portId
        );
        cancelPendingConnection();
    }

    function createConnection(srcDevId, srcPortId, tgtDevId, tgtPortId) {
        pushUndo();

        const conn = {
            connectionId: 'conn_' + state.nextId++,
            sourceDeviceId: srcDevId,
            sourcePortId: srcPortId,
            targetDeviceId: tgtDevId,
            targetPortId: tgtPortId,
            lineColor: '#0099CC',
            label: ''
        };

        state.connections.push(conn);
        renderConnectionLine(conn);
        rerenderAllConnectionPaths(); // recalc lanes for all siblings
        rebuildConnectionTable();
        refreshPortStates();
        updateStatusBar();
        autoSave();
    }

    function isPortConnected(instanceId, portId) {
        return state.connections.some(c =>
            (c.sourceDeviceId === instanceId && c.sourcePortId === portId) ||
            (c.targetDeviceId === instanceId && c.targetPortId === portId));
    }

    function deleteConnection(connId) {
        pushUndo();
        state.connections = state.connections.filter(c => c.connectionId !== connId);

        // Remove SVG elements (connection group contains shadow + line + endpoints)
        const group = connectionsLayer.querySelector(`.connection-group[data-connection-id="${connId}"]`);
        if (group) group.remove();

        if (state.selectedConnectionId === connId) state.selectedConnectionId = null;

        rerenderAllConnectionPaths(); // recalc lanes for remaining siblings
        rebuildConnectionTable();
        refreshPortStates();
        updateStatusBar();
        autoSave();
    }

    function cancelPendingConnection() {
        if (state.pendingConnection) {
            const portEl = devicesLayer.querySelector(
                `.port-shape[data-instance-id="${state.pendingConnection.deviceId}"][data-port-id="${state.pendingConnection.portId}"]`);
            if (portEl) portEl.classList.remove('pending');
        }
        state.pendingConnection = null;
        clearRubberBand();
    }

    function refreshPortStates() {
        devicesLayer.querySelectorAll('.port-shape').forEach(portEl => {
            const instId = portEl.dataset.instanceId;
            const portId = portEl.dataset.portId;
            portEl.classList.toggle('connected', isPortConnected(instId, portId));
        });
    }

    // ======================== CONNECTION RENDERING ========================
    function renderConnectionLine(conn) {
        const srcDev = findDevice(conn.sourceDeviceId);
        const tgtDev = findDevice(conn.targetDeviceId);
        if (!srcDev || !tgtDev) return;

        const srcPos = getPortWorldPosition(srcDev, conn.sourcePortId);
        const tgtPos = getPortWorldPosition(tgtDev, conn.targetPortId);
        if (!srcPos || !tgtPos) return;

        const { pairLane, wideLane, groupBounds } = getConnectionLaneInfo(conn);
        const d = calculateConnectionPath(srcPos, tgtPos, srcDev, tgtDev, pairLane, wideLane, groupBounds);

        // Connection group
        const connGroup = document.createElementNS(NS, 'g');
        connGroup.dataset.connectionId = conn.connectionId;
        connGroup.classList.add('connection-group');

        // Shadow stroke
        const shadow = document.createElementNS(NS, 'path');
        shadow.setAttribute('d', d);
        shadow.setAttribute('stroke', '#0d1117');
        shadow.setAttribute('stroke-width', 6);
        shadow.setAttribute('fill', 'none');
        shadow.setAttribute('stroke-linecap', 'round');
        shadow.setAttribute('stroke-linejoin', 'round');
        shadow.classList.add('connection-shadow');
        connGroup.appendChild(shadow);

        // Main line
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', conn.lineColor);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.classList.add('connection-line');
        path.dataset.connectionId = conn.connectionId;
        connGroup.appendChild(path);

        // Endpoint circles
        [srcPos, tgtPos].forEach(pos => {
            const circle = document.createElementNS(NS, 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', conn.lineColor);
            circle.setAttribute('stroke', '#0d1117');
            circle.setAttribute('stroke-width', 2);
            circle.setAttribute('pointer-events', 'none');
            circle.dataset.connEndpoint = conn.connectionId;
            connGroup.appendChild(circle);
        });

        connectionsLayer.appendChild(connGroup);
    }

    // Recalculate and update all connection paths (used after add/delete to fix lane assignments)
    function rerenderAllConnectionPaths() {
        state.connections.forEach(conn => {
            const srcDev = findDevice(conn.sourceDeviceId);
            const tgtDev = findDevice(conn.targetDeviceId);
            if (!srcDev || !tgtDev) return;
            const srcPos = getPortWorldPosition(srcDev, conn.sourcePortId);
            const tgtPos = getPortWorldPosition(tgtDev, conn.targetPortId);
            if (!srcPos || !tgtPos) return;

            const { pairLane, wideLane, groupBounds } = getConnectionLaneInfo(conn);
            const d = calculateConnectionPath(srcPos, tgtPos, srcDev, tgtDev, pairLane, wideLane, groupBounds);

            const connGroup = connectionsLayer.querySelector(`.connection-group[data-connection-id="${conn.connectionId}"]`);
            if (connGroup) {
                const pathEl = connGroup.querySelector('.connection-line');
                const shadowEl = connGroup.querySelector('.connection-shadow');
                if (pathEl) pathEl.setAttribute('d', d);
                if (shadowEl) shadowEl.setAttribute('d', d);
            }
        });
    }

    // Calculate lane indices for parallel connections
    function getConnectionLaneInfo(conn) {
        // Pair-based: only connections between the exact same two devices
        const pairKey = [conn.sourceDeviceId, conn.targetDeviceId].sort().join('|');
        const pairSiblings = state.connections.filter(c => {
            const k = [c.sourceDeviceId, c.targetDeviceId].sort().join('|');
            return k === pairKey;
        });
        const pairIdx = pairSiblings.findIndex(c => c.connectionId === conn.connectionId);
        const pairTotal = pairSiblings.length;
        const pairLane = pairIdx - Math.floor(pairTotal / 2);

        // Wide-based: all connections sharing any device (for side routing Case 3)
        const wideSiblings = state.connections.filter(c =>
            c.sourceDeviceId === conn.sourceDeviceId ||
            c.targetDeviceId === conn.sourceDeviceId ||
            c.sourceDeviceId === conn.targetDeviceId ||
            c.targetDeviceId === conn.targetDeviceId
        );
        const wideIdx = wideSiblings.findIndex(c => c.connectionId === conn.connectionId);
        const wideTotal = wideSiblings.length;
        const wideLane = wideIdx;  // 0-based (not centered) so offsets always push away from devices

        // Group bounds from all wide siblings for side routing
        const deviceIds = new Set();
        wideSiblings.forEach(c => {
            deviceIds.add(c.sourceDeviceId);
            deviceIds.add(c.targetDeviceId);
        });

        let left = Infinity, right = -Infinity;
        deviceIds.forEach(id => {
            const dev = findDevice(id);
            if (!dev) return;
            left = Math.min(left, dev.x);
            right = Math.max(right, dev.x + (dev._width || 200));
        });

        return { pairLane, wideLane, groupBounds: { left, right } };
    }

    function calculateConnectionPath(src, tgt, srcDev, tgtDev, pairLane, wideLane, groupBounds) {
        const STUB = 30;
        const MARGIN = 25;
        const LANE_SPACING = 14;
        const BEND_R = 8;

        const pairOffset = (pairLane || 0) * LANE_SPACING;

        // Get device bounding boxes
        const srcRight = srcDev.x + (srcDev._width || 200);
        const srcBottom = srcDev.y + (srcDev._height || 100);
        const tgtRight = tgtDev.x + (tgtDev._width || 200);
        const tgtBottom = tgtDev.y + (tgtDev._height || 100);

        // Exit points (below ports)
        const srcExit = { x: src.x, y: src.y + STUB };
        const tgtExit = { x: tgt.x, y: tgt.y + STUB };

        // Case 1: devices roughly on the same horizontal line - use pairLane
        const vertDist = Math.abs(src.y - tgt.y);
        if (vertDist < 30) {
            const midY = Math.max(srcExit.y, tgtExit.y) + MARGIN + Math.abs(pairOffset);
            return buildOrthogonalPath([
                src, { x: src.x, y: midY }, { x: tgt.x, y: midY }, tgt
            ], BEND_R);
        }

        // Check if there's horizontal overlap between devices
        const overlapLeft = Math.max(srcDev.x, tgtDev.x);
        const overlapRight = Math.min(srcRight, tgtRight);
        const hasOverlap = overlapLeft < overlapRight;

        // Case 2: no overlap - route through gap - use pairLane
        if (!hasOverlap) {
            const topBottom = Math.min(srcBottom, tgtBottom);
            const botTop = Math.max(srcDev.y, tgtDev.y);
            const midY = (topBottom + botTop) / 2 + pairOffset;
            return buildOrthogonalPath([
                src, { x: src.x, y: midY }, { x: tgt.x, y: midY }, tgt
            ], BEND_R);
        }

        // Case 3: devices overlap horizontally - route to the side - use wideLane
        // Use group bounds so all connections sharing a device share the same reference edge
        const allLeft = groupBounds ? groupBounds.left : Math.min(srcDev.x, tgtDev.x);
        const allRight = groupBounds ? groupBounds.right : Math.max(srcRight, tgtRight);

        const portAvgX = (src.x + tgt.x) / 2;
        const distToLeft = portAvgX - allLeft;
        const distToRight = allRight - portAvgX;

        let sideX;
        const sideSpacing = (wideLane || 0) * LANE_SPACING;
        if (distToRight <= distToLeft) {
            sideX = allRight + MARGIN + sideSpacing;
        } else {
            sideX = allLeft - MARGIN - sideSpacing;
        }

        return buildOrthogonalPath([
            src,
            { x: src.x, y: srcExit.y },
            { x: sideX, y: srcExit.y },
            { x: sideX, y: tgtExit.y },
            { x: tgt.x, y: tgtExit.y },
            tgt
        ], BEND_R);
    }

    // Build orthogonal SVG path with rounded corners
    function buildOrthogonalPath(points, radius) {
        if (points.length < 2) return '';

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (len1 === 0 || len2 === 0) {
                d += ` L ${curr.x} ${curr.y}`;
                continue;
            }

            const r = Math.min(radius, len1 / 2, len2 / 2);

            const startX = curr.x - (dx1 / len1) * r;
            const startY = curr.y - (dy1 / len1) * r;
            const endX = curr.x + (dx2 / len2) * r;
            const endY = curr.y + (dy2 / len2) * r;

            d += ` L ${startX} ${startY}`;
            d += ` Q ${curr.x} ${curr.y} ${endX} ${endY}`;
        }

        const last = points[points.length - 1];
        d += ` L ${last.x} ${last.y}`;

        return d;
    }

    function updateConnectionsForDevice(instanceId) {
        // Recompute port positions for the device
        const dev = findDevice(instanceId);
        if (!dev) return;
        const catalog = getDeviceCatalogEntry(dev.modelId);
        if (!catalog) return;

        // Recalculate port positions
        let portX = BODY_PADDING / 2;
        const groups = groupPortsByGroup(catalog.ports);
        const groupKeys = Object.keys(groups);
        dev._portPositions = {};

        groupKeys.forEach((key, gi) => {
            groups[key].forEach(port => {
                const pw = getPortWidth(port.type);
                dev._portPositions[port.id] = {
                    localX: portX + pw / 2,
                    localY: LABEL_HEIGHT + 50 + PORT_HEIGHT / 2
                };
                portX += pw + PORT_GAP;
            });
            if (gi < groupKeys.length - 1) portX += GROUP_GAP;
        });

        // Update connection lines
        state.connections.forEach(conn => {
            if (conn.sourceDeviceId !== instanceId && conn.targetDeviceId !== instanceId) return;

            const srcDev = findDevice(conn.sourceDeviceId);
            const tgtDev = findDevice(conn.targetDeviceId);
            if (!srcDev || !tgtDev) return;

            const srcPos = getPortWorldPosition(srcDev, conn.sourcePortId);
            const tgtPos = getPortWorldPosition(tgtDev, conn.targetPortId);
            if (!srcPos || !tgtPos) return;

            const { pairLane, wideLane, groupBounds } = getConnectionLaneInfo(conn);
            const d = calculateConnectionPath(srcPos, tgtPos, srcDev, tgtDev, pairLane, wideLane, groupBounds);

            const connGroup = connectionsLayer.querySelector(`.connection-group[data-connection-id="${conn.connectionId}"]`);
            if (connGroup) {
                const pathEl = connGroup.querySelector('.connection-line');
                const shadowEl = connGroup.querySelector('.connection-shadow');
                if (pathEl) pathEl.setAttribute('d', d);
                if (shadowEl) shadowEl.setAttribute('d', d);

                // Update endpoints
                const endpoints = connGroup.querySelectorAll(`[data-conn-endpoint="${conn.connectionId}"]`);
                if (endpoints.length >= 2) {
                    endpoints[0].setAttribute('cx', srcPos.x);
                    endpoints[0].setAttribute('cy', srcPos.y);
                    endpoints[1].setAttribute('cx', tgtPos.x);
                    endpoints[1].setAttribute('cy', tgtPos.y);
                }
            }
        });
    }

    // ======================== RUBBER-BAND LINE ========================
    function updateRubberBand(mousePos) {
        clearRubberBand();
        if (!state.pendingConnection) return;

        const dev = findDevice(state.pendingConnection.deviceId);
        if (!dev) return;
        const srcPos = getPortWorldPosition(dev, state.pendingConnection.portId);
        if (!srcPos) return;

        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', srcPos.x);
        line.setAttribute('y1', srcPos.y);
        line.setAttribute('x2', mousePos.x);
        line.setAttribute('y2', mousePos.y);
        line.classList.add('rubber-band-line');
        line.id = 'rubber-band';
        tempLineLayer.appendChild(line);
    }

    function clearRubberBand() {
        const el = document.getElementById('rubber-band');
        if (el) el.remove();
    }

    // ======================== CONNECTION TABLE PANEL ========================
    function setupConnectionPanel() {
        document.getElementById('toggle-panel').addEventListener('click', () => {
            document.getElementById('connection-panel').classList.toggle('collapsed');
        });

        document.getElementById('connection-filter').addEventListener('input', (e) => {
            filterConnectionTable(e.target.value.toLowerCase());
        });
    }

    function rebuildConnectionTable() {
        const body = connectionTableBody;
        body.innerHTML = '';

        if (state.connections.length === 0) {
            body.innerHTML = `
                <div class="empty-state">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/>
                    </svg>
                    <div>No connections yet</div>
                    <div>Use the Connect tool (C) to link ports</div>
                </div>`;
            connectionCount.textContent = '0';
            return;
        }

        // Group by device
        const deviceConns = {};
        state.connections.forEach(conn => {
            [conn.sourceDeviceId, conn.targetDeviceId].forEach(devId => {
                if (!deviceConns[devId]) deviceConns[devId] = [];
                deviceConns[devId].push(conn);
            });
        });

        // Sort devices alphabetically
        const sortedDevIds = Object.keys(deviceConns).sort((a, b) => {
            const da = findDevice(a);
            const db = findDevice(b);
            return (da?.label || '').localeCompare(db?.label || '');
        });

        sortedDevIds.forEach(devId => {
            const dev = findDevice(devId);
            if (!dev) return;

            const conns = deviceConns[devId];
            const group = document.createElement('div');
            group.className = 'conn-group';

            const header = document.createElement('div');
            header.className = 'conn-group-header';
            header.innerHTML = `
                <span class="arrow">&#9660;</span>
                <span>${dev.label}</span>
                <span class="conn-group-count">(${conns.length})</span>
            `;

            const items = document.createElement('div');
            items.className = 'conn-group-items';

            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
                items.classList.toggle('collapsed');
            });

            // Sort connections by local port
            const sorted = [...conns].sort((a, b) => {
                const aPort = a.sourceDeviceId === devId ? a.sourcePortId : a.targetPortId;
                const bPort = b.sourceDeviceId === devId ? b.sourcePortId : b.targetPortId;
                return naturalSort(aPort, bPort);
            });

            sorted.forEach(conn => {
                const isSource = conn.sourceDeviceId === devId;
                const localPort = isSource ? conn.sourcePortId : conn.targetPortId;
                const remotePort = isSource ? conn.targetPortId : conn.sourcePortId;
                const remoteDevId = isSource ? conn.targetDeviceId : conn.sourceDeviceId;
                const remoteDev = findDevice(remoteDevId);

                const row = document.createElement('div');
                row.className = 'conn-row';
                row.dataset.connectionId = conn.connectionId;
                row.innerHTML = `
                    <span class="conn-color-swatch" style="background:${conn.lineColor}" title="Change color"></span>
                    <span class="conn-port local">${localPort}</span>
                    <span class="conn-arrow">&harr;</span>
                    <span class="conn-port remote">${remotePort}</span>
                    <span class="conn-device-name">${remoteDev?.label || 'Unknown'}</span>
                `;

                // Color swatch click -> open color picker
                const swatch = row.querySelector('.conn-color-swatch');
                swatch.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = swatch.getBoundingClientRect();
                    showColorPicker(conn.connectionId, rect.left, rect.bottom + 4);
                });

                // Hover: highlight on canvas
                row.addEventListener('mouseenter', () => {
                    highlightConnectionOnCanvas(conn.connectionId, true);
                    row.classList.add('highlighted');
                });
                row.addEventListener('mouseleave', () => {
                    highlightConnectionOnCanvas(conn.connectionId, false);
                    row.classList.remove('highlighted');
                });

                // Click: select and zoom to connection
                row.addEventListener('click', () => {
                    state.selectedDeviceIds.clear();
                    state.selectedConnectionId = conn.connectionId;
                    state.selectedDeviceIds.add(conn.sourceDeviceId);
                    state.selectedDeviceIds.add(conn.targetDeviceId);
                    updateSelectionVisuals();
                });

                items.appendChild(row);
            });

            group.appendChild(header);
            group.appendChild(items);
            body.appendChild(group);
        });

        connectionCount.textContent = state.connections.length.toString();
    }

    function filterConnectionTable(query) {
        document.querySelectorAll('.conn-row').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
        document.querySelectorAll('.conn-group').forEach(group => {
            const visible = group.querySelectorAll('.conn-row:not([style*="display: none"])');
            group.style.display = visible.length > 0 ? '' : 'none';
        });
    }

    function highlightConnectionOnCanvas(connId, highlight) {
        const group = connectionsLayer.querySelector(`.connection-group[data-connection-id="${connId}"]`);
        if (group) {
            const line = group.querySelector('.connection-line');
            if (line) line.classList.toggle('highlighted', highlight);
        }
    }

    function highlightConnectionInTable(connId) {
        document.querySelectorAll('.conn-row').forEach(row => {
            row.classList.toggle('highlighted', row.dataset.connectionId === connId);
        });
    }

    function naturalSort(a, b) {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    // ======================== RENAME ========================
    function startRename(instance) {
        const label = prompt('Rename device:', instance.label);
        if (label && label.trim()) {
            instance.label = label.trim();
            rerenderDevice(instance);
            rebuildConnectionTable();
            autoSave();
        }
    }

    function rerenderDevice(instance) {
        const old = devicesLayer.querySelector(`[data-instance-id="${instance.instanceId}"]`);
        if (old) old.remove();
        const svgEl = renderDeviceSVG(instance);
        if (svgEl) devicesLayer.appendChild(svgEl);
        updateSelectionVisuals();
    }

    // ======================== UNDO / REDO ========================
    function pushUndo() {
        const snapshot = serializeState();
        state.undoStack.push(snapshot);
        if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
        state.redoStack = [];
    }

    function undo() {
        if (state.undoStack.length === 0) return;
        state.redoStack.push(serializeState());
        const snapshot = state.undoStack.pop();
        restoreState(snapshot);
    }

    function redo() {
        if (state.redoStack.length === 0) return;
        state.undoStack.push(serializeState());
        const snapshot = state.redoStack.pop();
        restoreState(snapshot);
    }

    function serializeState() {
        return JSON.stringify({
            devices: state.devices.map(d => ({
                instanceId: d.instanceId,
                modelId: d.modelId,
                label: d.label,
                x: d.x,
                y: d.y
            })),
            connections: state.connections.map(c => ({
                connectionId: c.connectionId,
                sourceDeviceId: c.sourceDeviceId,
                sourcePortId: c.sourcePortId,
                targetDeviceId: c.targetDeviceId,
                targetPortId: c.targetPortId,
                lineColor: c.lineColor,
                label: c.label
            })),
            textboxes: state.textboxes.map(tb => ({
                textboxId: tb.textboxId,
                text: tb.text,
                x: tb.x,
                y: tb.y,
                fontSize: tb.fontSize
            })),
            nextId: state.nextId
        });
    }

    function restoreState(json) {
        const data = JSON.parse(json);

        // Clear canvas
        devicesLayer.innerHTML = '';
        connectionsLayer.innerHTML = '';
        textboxesLayer.innerHTML = '';

        state.devices = [];
        state.connections = [];
        state.textboxes = [];
        state.nextId = data.nextId || 1;
        state.selectedDeviceIds.clear();
        state.selectedConnectionId = null;
        state.selectedTextboxId = null;

        // Restore devices
        data.devices.forEach(d => {
            const instance = {
                instanceId: d.instanceId,
                modelId: d.modelId,
                label: d.label,
                x: d.x,
                y: d.y,
                _portPositions: {},
                _width: 0,
                _height: 0
            };
            state.devices.push(instance);
            const svgEl = renderDeviceSVG(instance);
            if (svgEl) devicesLayer.appendChild(svgEl);
        });

        // Restore connections - push all to state first, then render
        // (lane calculation needs the complete list to assign correct offsets)
        data.connections.forEach(c => {
            state.connections.push({
                connectionId: c.connectionId,
                sourceDeviceId: c.sourceDeviceId,
                sourcePortId: c.sourcePortId,
                targetDeviceId: c.targetDeviceId,
                targetPortId: c.targetPortId,
                lineColor: c.lineColor || '#0099CC',
                label: c.label || ''
            });
        });
        state.connections.forEach(conn => renderConnectionLine(conn));

        // Restore text boxes
        (data.textboxes || []).forEach(tb => {
            const textbox = {
                textboxId: tb.textboxId,
                text: tb.text,
                x: tb.x,
                y: tb.y,
                fontSize: tb.fontSize || 14
            };
            state.textboxes.push(textbox);
            const svgEl = renderTextBoxSVG(textbox);
            if (svgEl) textboxesLayer.appendChild(svgEl);
        });

        refreshPortStates();
        rebuildConnectionTable();
        updateStatusBar();
    }

    // ======================== SAVE / LOAD ========================
    function saveToFile() {
        const json = serializeState();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'network-diagram.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadFromFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                pushUndo();
                restoreState(ev.target.result);
                autoSave();
            } catch (err) {
                alert('Error loading file: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function autoSave() {
        try {
            localStorage.setItem('mikrotik-diagram', serializeState());
        } catch (e) { /* ignore */ }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('mikrotik-diagram');
            if (saved) restoreState(saved);
        } catch (e) { /* ignore */ }
    }

    // ======================== EXPORT ========================
    // ======================== COMPANY LOGO ========================
    let companyLogo = null; // { dataUrl, width, height }

    function setupLogo() {
        const logoInput = document.getElementById('logo-input');
        document.getElementById('btn-logo').addEventListener('click', () => {
            if (companyLogo) {
                // Show menu: change or remove
                const btn = document.getElementById('btn-logo');
                const r = btn.getBoundingClientRect();
                showContextMenu(r.left, r.bottom + 4, [
                    { label: 'Change Logo', action: () => logoInput.click() },
                    { label: 'Remove Logo', action: () => {
                        companyLogo = null;
                        localStorage.removeItem('mikrotik-logo');
                        document.getElementById('logo-btn-text').textContent = 'Logo';
                    }},
                ]);
            } else {
                logoInput.click();
            }
        });

        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    // Convert to JPEG always (for PDF compatibility)
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const cx = c.getContext('2d');
                    cx.fillStyle = '#ffffff';
                    cx.fillRect(0, 0, c.width, c.height);
                    cx.drawImage(img, 0, 0);
                    const jpegUrl = c.toDataURL('image/jpeg', 0.92);
                    companyLogo = { dataUrl: jpegUrl, width: img.width, height: img.height };
                    localStorage.setItem('mikrotik-logo', JSON.stringify(companyLogo));
                    document.getElementById('logo-btn-text').textContent = 'Logo \u2713';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            logoInput.value = '';
        });

        // Load saved logo
        try {
            const saved = localStorage.getItem('mikrotik-logo');
            if (saved) {
                companyLogo = JSON.parse(saved);
                document.getElementById('logo-btn-text').textContent = 'Logo \u2713';
            }
        } catch (e) {}
    }

    // ======================== EXPORT PDF ========================
    function exportPDF() {
        if (state.devices.length === 0) return;

        const EXPORT_PADDING = 60;
        const bounds = getContentBounds();
        const contentW = bounds.maxX - bounds.minX + EXPORT_PADDING * 2;
        const contentH = bounds.maxY - bounds.minY + EXPORT_PADDING * 2;
        const vbX = bounds.minX - EXPORT_PADDING;
        const vbY = bounds.minY - EXPORT_PADDING;

        const scale = 2;
        const exportW = Math.max(800, contentW * scale);
        const exportH = Math.max(400, contentH * scale);

        const svgString = buildExportSVG(vbX, vbY, contentW, contentH, exportW, exportH);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = exportW;
            canvas.height = exportH;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            buildMultiPagePDF(canvas);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
    }

    function buildExportSVG(vbX, vbY, contentW, contentH, exportW, exportH) {
        const root = getComputedStyle(document.documentElement);
        const resolveVar = (name) => root.getPropertyValue(name).trim();

        const embeddedCSS = `
            .canvas-device { cursor: default; }
            .device-label-text {
                font-size: 12px; font-weight: 700;
                fill: ${resolveVar('--text-primary')};
                text-anchor: middle; letter-spacing: 0.3px;
            }
            .device-model-text { font-size: 8px; fill: ${resolveVar('--text-secondary')}; text-anchor: middle; }
            .port-highlight { opacity: 0; }
            .port-hitbox { fill: transparent; }
            .port-label-text { pointer-events: none; }
            .connection-shadow { opacity: 0.8; }
            .connection-line { fill: none; stroke-width: 2.5; }
            .device-selection-rect { fill: transparent; stroke: transparent; }
            .selection-rect { display: none; }
            .canvas-device.selected .device-body { stroke: transparent; stroke-dasharray: none; }
            .canvas-textbox { cursor: default; }
            .canvas-textbox .textbox-bg { stroke: #30363d; stroke-dasharray: 4,2; }
            .canvas-textbox.selected .textbox-bg { stroke: #30363d; stroke-dasharray: 4,2; }
            .canvas-textbox text { fill: ${resolveVar('--text-primary')}; }
            .cloud-body { transition: none; }
            .canvas-device.selected .cloud-body { stroke: #4488aa; stroke-dasharray: none; }
        `;

        const svgClone = svg.cloneNode(true);
        const gridBg = svgClone.querySelector('#grid-bg');
        if (gridBg) gridBg.remove();
        const tempLayer = svgClone.querySelector('#temp-line-layer');
        if (tempLayer) tempLayer.innerHTML = '';
        const selLayer = svgClone.querySelector('#selection-layer');
        if (selLayer) selLayer.innerHTML = '';
        svgClone.querySelectorAll('.canvas-device.selected').forEach(el => el.classList.remove('selected'));
        svgClone.querySelectorAll('.canvas-textbox.selected').forEach(el => el.classList.remove('selected'));

        const styleEl = document.createElementNS(NS, 'style');
        styleEl.textContent = embeddedCSS;
        const defs = svgClone.querySelector('defs');
        if (defs) defs.appendChild(styleEl);

        svgClone.setAttribute('viewBox', `${vbX} ${vbY} ${contentW} ${contentH}`);
        svgClone.setAttribute('width', exportW);
        svgClone.setAttribute('height', exportH);
        svgClone.setAttribute('xmlns', NS);

        return new XMLSerializer().serializeToString(svgClone);
    }

    // ---- Multi-page PDF builder ----
    // Uses canvas rendering for both diagram page and connection table page
    function buildMultiPagePDF(diagramCanvas) {
        // Page 1: diagram (landscape A4)
        const pageW = 842, pageH = 595;
        const margin = 36;
        const logoAreaH = companyLogo ? 50 : 0;

        // Render connection table to a canvas (page 2, portrait A4)
        const p2W = 595, p2H = 842;
        const tableCanvas = renderConnectionTableCanvas(p2W, p2H, margin, logoAreaH);

        // Get diagram JPEG
        const diagJpeg = diagramCanvas.toDataURL('image/jpeg', 0.92);
        const diagBytes = base64ToBytes(diagJpeg.split(',')[1]);

        // Get table JPEG
        const tableJpeg = tableCanvas.toDataURL('image/jpeg', 0.95);
        const tableBytes = base64ToBytes(tableJpeg.split(',')[1]);

        // Logo bytes (if any, always JPEG from upload conversion)
        let logoBytes = null;
        if (companyLogo) {
            const parts = companyLogo.dataUrl.split(',');
            logoBytes = base64ToBytes(parts[1]);
        }

        // Assemble PDF with multiple pages and images
        assemblePDF({
            pageW, pageH, p2W, p2H, margin, logoAreaH,
            diagramCanvas, diagBytes,
            tableCanvas, tableBytes,
            logoBytes
        });
    }

    function renderConnectionTableCanvas(pageW, pageH, margin, logoAreaH) {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = pageW * scale;
        canvas.height = pageH * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, pageW, pageH);

        const x = margin;
        let y = margin;
        const contentW = pageW - margin * 2;

        // Title
        ctx.fillStyle = '#e6edf3';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
        ctx.fillText('Connection Table', x, y + 16);
        y += 30;

        // Date
        ctx.fillStyle = '#8b949e';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText('Generated: ' + new Date().toLocaleString(), x, y + 10);
        y += 20;

        // Summary
        ctx.fillStyle = '#8b949e';
        ctx.fillText('Total Connections: ' + state.connections.length + '  |  Total Devices: ' + state.devices.length, x, y + 10);
        y += 25;

        if (state.connections.length === 0) {
            ctx.fillStyle = '#484f58';
            ctx.font = '12px -apple-system, sans-serif';
            ctx.fillText('No connections to display.', x, y + 12);
            return canvas;
        }

        // Table header
        const colDevA = x;
        const colPortA = x + contentW * 0.25;
        const colArrow = x + contentW * 0.42;
        const colPortB = x + contentW * 0.48;
        const colDevB = x + contentW * 0.65;
        const colColor = x + contentW * 0.9;
        const rowH = 20;

        // Header row
        ctx.fillStyle = '#161b22';
        ctx.fillRect(x, y, contentW, rowH + 4);
        ctx.fillStyle = '#0099CC';
        ctx.font = 'bold 10px -apple-system, sans-serif';
        ctx.fillText('Device A', colDevA + 6, y + 14);
        ctx.fillText('Port A', colPortA + 4, y + 14);
        ctx.fillText('', colArrow, y + 14);
        ctx.fillText('Port B', colPortB + 4, y + 14);
        ctx.fillText('Device B', colDevB + 4, y + 14);
        ctx.fillText('Color', colColor + 4, y + 14);
        y += rowH + 6;

        // Separator
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + contentW, y);
        ctx.stroke();
        y += 4;

        // Deduplicate connections (each connection appears once)
        const maxY = pageH - margin - logoAreaH - 10;
        const printed = new Set();

        state.connections.forEach(conn => {
            if (printed.has(conn.connectionId)) return;
            printed.add(conn.connectionId);

            if (y + rowH > maxY) return; // page overflow

            const srcDev = findDevice(conn.sourceDeviceId);
            const tgtDev = findDevice(conn.targetDeviceId);
            const srcName = srcDev ? srcDev.label : 'Unknown';
            const tgtName = tgtDev ? tgtDev.label : 'Unknown';

            // Alternating row background
            if (printed.size % 2 === 0) {
                ctx.fillStyle = '#161b22';
                ctx.fillRect(x, y - 2, contentW, rowH);
            }

            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillStyle = '#e6edf3';
            ctx.fillText(truncText(ctx, srcName, contentW * 0.16), colDevA + 6, y + 12);

            ctx.fillStyle = '#8b949e';
            ctx.font = '10px Consolas, Courier New, monospace';
            ctx.fillText(conn.sourcePortId, colPortA + 4, y + 12);

            ctx.fillStyle = '#484f58';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillText('\u2194', colArrow + 4, y + 12);

            ctx.fillStyle = '#8b949e';
            ctx.font = '10px Consolas, Courier New, monospace';
            ctx.fillText(conn.targetPortId, colPortB + 4, y + 12);

            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillStyle = '#e6edf3';
            ctx.fillText(truncText(ctx, tgtName, contentW * 0.24), colDevB + 4, y + 12);

            // Color swatch
            ctx.fillStyle = conn.lineColor || '#0099CC';
            const swX = colColor + 4, swY = y + 3, swW = 30, swH = 12, swR = 3;
            ctx.beginPath();
            ctx.moveTo(swX + swR, swY);
            ctx.lineTo(swX + swW - swR, swY);
            ctx.quadraticCurveTo(swX + swW, swY, swX + swW, swY + swR);
            ctx.lineTo(swX + swW, swY + swH - swR);
            ctx.quadraticCurveTo(swX + swW, swY + swH, swX + swW - swR, swY + swH);
            ctx.lineTo(swX + swR, swY + swH);
            ctx.quadraticCurveTo(swX, swY + swH, swX, swY + swH - swR);
            ctx.lineTo(swX, swY + swR);
            ctx.quadraticCurveTo(swX, swY, swX + swR, swY);
            ctx.closePath();
            ctx.fill();

            y += rowH;
        });

        return canvas;
    }

    function truncText(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        while (text.length > 3 && ctx.measureText(text + '...').width > maxW) {
            text = text.slice(0, -1);
        }
        return text + '...';
    }

    function base64ToBytes(b64) {
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }

    function assemblePDF(opts) {
        const { pageW, pageH, p2W, p2H, margin, logoAreaH,
                diagramCanvas, diagBytes, tableCanvas, tableBytes,
                logoBytes } = opts;

        // PDF coordinate helper (PDF origin is bottom-left)
        const objTexts = []; // text parts of each object
        const objBinaries = []; // binary data attached after text (or null)

        function addObj(text, binary) {
            objTexts.push(text);
            objBinaries.push(binary || null);
            return objTexts.length; // 1-based object number
        }

        // Page 1 diagram image sizing
        const p1AvailH = pageH - margin * 2 - logoAreaH;
        const p1AvailW = pageW - margin * 2;
        const dAspect = diagramCanvas.width / diagramCanvas.height;
        let dW, dH;
        if (dAspect > p1AvailW / p1AvailH) { dW = p1AvailW; dH = p1AvailW / dAspect; }
        else { dH = p1AvailH; dW = p1AvailH * dAspect; }
        const dX = margin + (p1AvailW - dW) / 2;
        const dY = pageH - margin - (p1AvailH - dH) / 2 - dH;

        // Page 2 table image sizing
        const p2AvailH = p2H - margin * 2 - logoAreaH;
        const p2AvailW = p2W - margin * 2;
        const tAspect = tableCanvas.width / tableCanvas.height;
        let tW, tH;
        if (tAspect > p2AvailW / p2AvailH) { tW = p2AvailW; tH = p2AvailW / tAspect; }
        else { tH = p2AvailH; tW = p2AvailH * tAspect; }
        const tX = margin + (p2AvailW - tW) / 2;
        const tY = p2H - margin - tH;

        // 1: Catalog
        addObj('<< /Type /Catalog /Pages 2 0 R >>');

        // 2: Pages (will reference page objects)
        // placeholder - we'll fix kid refs after
        const pagesIdx = addObj('PLACEHOLDER');

        // 3: Font
        addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

        // 4: Diagram image XObject
        addObj(
            `<< /Type /XObject /Subtype /Image /Width ${diagramCanvas.width} /Height ${diagramCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${diagBytes.length} >>\nstream\n`,
            diagBytes
        );

        // 5: Table image XObject
        addObj(
            `<< /Type /XObject /Subtype /Image /Width ${tableCanvas.width} /Height ${tableCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${tableBytes.length} >>\nstream\n`,
            tableBytes
        );

        // 6: Logo image (if any, always JPEG)
        let logoObjNum = 0;
        let logoDrawW = 0, logoDrawH = 0;
        if (logoBytes && companyLogo) {
            const maxLogoH = 35;
            const logoScale = maxLogoH / companyLogo.height;
            logoDrawW = companyLogo.width * logoScale;
            logoDrawH = maxLogoH;
            logoObjNum = addObj(
                `<< /Type /XObject /Subtype /Image /Width ${companyLogo.width} /Height ${companyLogo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`,
                logoBytes
            );
        }

        // 7: Page 1 content stream
        let p1Stream = `q ${dW.toFixed(2)} 0 0 ${dH.toFixed(2)} ${dX.toFixed(2)} ${dY.toFixed(2)} cm /Img0 Do Q\n`;
        // Title text on page 1
        p1Stream += `BT /F1 14 Tf 0.9 0.93 0.95 rg ${margin} ${(pageH - margin + 8).toFixed(2)} Td (Network Diagram) Tj ET\n`;
        // Date
        p1Stream += `BT /F1 8 Tf 0.55 0.58 0.62 rg ${(pageW - margin - 120).toFixed(2)} ${(pageH - margin + 8).toFixed(2)} Td (${new Date().toLocaleDateString()}) Tj ET\n`;
        // Logo on page 1
        if (logoObjNum) {
            const lx = (pageW - logoDrawW) / 2;
            const ly = 14;
            p1Stream += `q ${logoDrawW.toFixed(2)} 0 0 ${logoDrawH.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)} cm /Logo Do Q\n`;
        }
        const p1StreamIdx = addObj(`<< /Length ${p1Stream.length} >>\nstream\n${p1Stream}\nendstream`);

        // 8: Page 1
        let p1Resources = '/Font << /F1 3 0 R >> /XObject << /Img0 4 0 R';
        if (logoObjNum) p1Resources += ` /Logo ${logoObjNum} 0 R`;
        p1Resources += ' >>';
        const page1Idx = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${p1StreamIdx} 0 R /Resources << ${p1Resources} >> >>`);

        // 9: Page 2 content stream
        let p2Stream = `q ${tW.toFixed(2)} 0 0 ${tH.toFixed(2)} ${tX.toFixed(2)} ${tY.toFixed(2)} cm /Img1 Do Q\n`;
        // Logo on page 2
        if (logoObjNum) {
            const lx = (p2W - logoDrawW) / 2;
            const ly = 14;
            p2Stream += `q ${logoDrawW.toFixed(2)} 0 0 ${logoDrawH.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)} cm /Logo Do Q\n`;
        }
        const p2StreamIdx = addObj(`<< /Length ${p2Stream.length} >>\nstream\n${p2Stream}\nendstream`);

        // 10: Page 2
        let p2Resources = '/Font << /F1 3 0 R >> /XObject << /Img1 5 0 R';
        if (logoObjNum) p2Resources += ` /Logo ${logoObjNum} 0 R`;
        p2Resources += ' >>';
        const page2Idx = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p2W} ${p2H}] /Contents ${p2StreamIdx} 0 R /Resources << ${p2Resources} >> >>`);

        // Fix Pages object
        objTexts[1] = `<< /Type /Pages /Kids [${page1Idx} 0 R ${page2Idx} 0 R] /Count 2 >>`;

        // Serialize all objects to bytes
        const parts = [];
        const xrefOffsets = [];
        let header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
        parts.push(new TextEncoder().encode(header));

        let runningLen = header.length;
        const totalObjects = objTexts.length;

        for (let i = 0; i < totalObjects; i++) {
            const objNum = i + 1;
            xrefOffsets.push(runningLen);
            const objStart = `${objNum} 0 obj\n${objTexts[i]}`;
            if (objBinaries[i]) {
                // Has binary stream
                const startBytes = new TextEncoder().encode(objStart);
                parts.push(startBytes);
                runningLen += startBytes.length;

                parts.push(objBinaries[i]);
                runningLen += objBinaries[i].length;

                const endBytes = new TextEncoder().encode('\nendstream\nendobj\n');
                parts.push(endBytes);
                runningLen += endBytes.length;
            } else {
                const full = objStart + '\nendobj\n';
                const bytes = new TextEncoder().encode(full);
                parts.push(bytes);
                runningLen += bytes.length;
            }
        }

        // Xref table
        const xrefStart = runningLen;
        let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
        for (let i = 0; i < totalObjects; i++) {
            xref += String(xrefOffsets[i]).padStart(10, '0') + ' 00000 n \n';
        }
        xref += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        parts.push(new TextEncoder().encode(xref));

        // Combine all byte arrays
        let totalLen = 0;
        parts.forEach(p => totalLen += p.length);
        const pdfArray = new Uint8Array(totalLen);
        let offset = 0;
        parts.forEach(p => { pdfArray.set(p, offset); offset += p.length; });

        const pdfBlob = new Blob([pdfArray], { type: 'application/pdf' });
        downloadBlob(pdfBlob, 'network-diagram.pdf');
    }

    function downloadBlob(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function getContentBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        state.devices.forEach(dev => {
            const catalog = getDeviceCatalogEntry(dev.modelId);
            if (!catalog) return;
            const w = dev._width || calculateDeviceWidth(catalog);
            const h = dev._height || (LABEL_HEIGHT + 56 + 20);
            minX = Math.min(minX, dev.x);
            minY = Math.min(minY, dev.y);
            maxX = Math.max(maxX, dev.x + w);
            maxY = Math.max(maxY, dev.y + h);
        });

        // Include text boxes
        state.textboxes.forEach(tb => {
            const w = tb._width || 100;
            const h = tb._height || 30;
            minX = Math.min(minX, tb.x);
            minY = Math.min(minY, tb.y);
            maxX = Math.max(maxX, tb.x + w);
            maxY = Math.max(maxY, tb.y + h);
        });

        // Include connection paths
        connectionsLayer.querySelectorAll('.connection-line').forEach(path => {
            try {
                const bbox = path.getBBox();
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            } catch (e) {}
        });

        if (minX === Infinity) {
            return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
        }
        return { minX, minY, maxX, maxY };
    }

    // ======================== CLEAR ========================
    function clearCanvas() {
        if (state.devices.length === 0 && state.textboxes.length === 0) return;
        if (!confirm('Clear all devices, connections, and text boxes?')) return;
        pushUndo();
        devicesLayer.innerHTML = '';
        connectionsLayer.innerHTML = '';
        textboxesLayer.innerHTML = '';
        state.devices = [];
        state.connections = [];
        state.textboxes = [];
        state.selectedDeviceIds.clear();
        state.selectedConnectionId = null;
        state.selectedTextboxId = null;
        rebuildConnectionTable();
        updateStatusBar();
        autoSave();
    }

    // ======================== KEYBOARD ========================
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'v':
                    setTool('select');
                    break;
                case 'c':
                    if (!e.ctrlKey && !e.metaKey) setTool('connect');
                    break;
                case 'delete':
                case 'backspace':
                    deleteSelectedDevices();
                    break;
                case 't':
                    if (!e.ctrlKey && !e.metaKey) setTool('text');
                    break;
                case 'escape':
                    cancelPendingConnection();
                    state.selectedDeviceIds.clear();
                    state.selectedConnectionId = null;
                    state.selectedTextboxId = null;
                    updateSelectionVisuals();
                    setTool('select');
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) redo(); else undo();
                    }
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        redo();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        saveToFile();
                    }
                    break;
                case '=':
                case '+':
                    zoomBy(1.2);
                    break;
                case '-':
                    zoomBy(0.8);
                    break;
                case 'a':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        state.devices.forEach(d => state.selectedDeviceIds.add(d.instanceId));
                        updateSelectionVisuals();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    if (!state.isPanning) {
                        svg.classList.add('tool-pan');
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                svg.classList.remove('tool-pan');
            }
        });

        // Space+drag for pan
        svg.addEventListener('mousedown', (e) => {
            if (e.button === 0 && svg.classList.contains('tool-pan')) {
                startPan(e);
            }
        });
    }

    // ======================== CONTEXT MENU ========================
    function setupContextMenu() {
        const menu = document.getElementById('context-menu');

        svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const deviceGroup = e.target.closest('.canvas-device');
            const connGroup = e.target.closest('.connection-group');
            const textboxGroup = e.target.closest('.canvas-textbox');

            if (deviceGroup) {
                const instanceId = deviceGroup.dataset.instanceId;
                state.selectedDeviceIds.clear();
                state.selectedDeviceIds.add(instanceId);
                updateSelectionVisuals();

                showContextMenu(e.clientX, e.clientY, [
                    { label: 'Rename', action: () => startRename(findDevice(instanceId)) },
                    { label: 'Duplicate', action: () => duplicateDevice(instanceId) },
                    null,
                    { label: 'Delete', action: () => deleteDevice(instanceId) },
                ]);
            } else if (textboxGroup) {
                const tbId = textboxGroup.dataset.textboxId;
                state.selectedTextboxId = tbId;
                updateSelectionVisuals();
                showContextMenu(e.clientX, e.clientY, [
                    { label: 'Edit Text', action: () => startTextEdit(findTextBox(tbId)) },
                    null,
                    { label: 'Delete', action: () => deleteTextBox(tbId) },
                ]);
            } else if (connGroup) {
                const connId = connGroup.dataset.connectionId;
                showContextMenu(e.clientX, e.clientY, [
                    { label: 'Change Color', action: () => showColorPicker(connId, e.clientX, e.clientY) },
                    null,
                    { label: 'Delete Connection', action: () => deleteConnection(connId) },
                ]);
            }
        });

        document.addEventListener('click', () => {
            menu.classList.add('hidden');
        });
    }

    function showContextMenu(x, y, items) {
        const menu = document.getElementById('context-menu');
        menu.innerHTML = '';
        items.forEach(item => {
            if (!item) {
                const sep = document.createElement('div');
                sep.className = 'context-separator';
                menu.appendChild(sep);
                return;
            }
            const el = document.createElement('div');
            el.className = 'context-item';
            el.textContent = item.label;
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.add('hidden');
                item.action();
            });
            menu.appendChild(el);
        });
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
    }

    function duplicateDevice(instanceId) {
        const dev = findDevice(instanceId);
        if (!dev) return;
        addDevice(dev.modelId, dev.x + 40, dev.y + 40);
    }

    // ======================== CONNECTION COLOR PICKER ========================
    const CONNECTION_COLORS = [
        '#0099CC', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
        '#E91E63', '#00BCD4', '#8BC34A', '#FF5722', '#3F51B5',
        '#FFEB3B', '#795548', '#607D8B', '#FFFFFF', '#FF4081',
    ];

    function showColorPicker(connId, x, y) {
        // Remove any existing picker
        const old = document.getElementById('color-picker-popup');
        if (old) old.remove();

        const picker = document.createElement('div');
        picker.id = 'color-picker-popup';
        picker.className = 'color-picker-popup';

        CONNECTION_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            // Highlight current color
            const conn = state.connections.find(c => c.connectionId === connId);
            if (conn && conn.lineColor === color) {
                swatch.classList.add('active');
            }
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                changeConnectionColor(connId, color);
                picker.remove();
            });
            picker.appendChild(swatch);
        });

        // Position near click
        picker.style.left = x + 'px';
        picker.style.top = y + 'px';
        document.body.appendChild(picker);

        // Adjust if off-screen
        const rect = picker.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            picker.style.left = (window.innerWidth - rect.width - 8) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            picker.style.top = (window.innerHeight - rect.height - 8) + 'px';
        }

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closePicker() {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }, { once: true });
        }, 0);
    }

    function changeConnectionColor(connId, color) {
        pushUndo();
        const conn = state.connections.find(c => c.connectionId === connId);
        if (!conn) return;

        conn.lineColor = color;

        // Update SVG elements
        const connGroup = connectionsLayer.querySelector(`.connection-group[data-connection-id="${connId}"]`);
        if (connGroup) {
            const line = connGroup.querySelector('.connection-line');
            if (line) line.setAttribute('stroke', color);

            const endpoints = connGroup.querySelectorAll(`[data-conn-endpoint="${connId}"]`);
            endpoints.forEach(ep => ep.setAttribute('fill', color));
        }

        rebuildConnectionTable();
        autoSave();
    }

    // ======================== STATUS BAR ========================
    function updateStatusBar() {
        document.getElementById('status-devices').textContent = 'Devices: ' + state.devices.length;
        document.getElementById('status-connections').textContent = 'Connections: ' + state.connections.length;
    }

    // ======================== FULL RE-RENDER (for load/undo) ========================
    function rerenderAll() {
        devicesLayer.innerHTML = '';
        connectionsLayer.innerHTML = '';
        textboxesLayer.innerHTML = '';
        state.devices.forEach(d => {
            const svgEl = renderDeviceSVG(d);
            if (svgEl) devicesLayer.appendChild(svgEl);
        });
        state.connections.forEach(c => renderConnectionLine(c));
        state.textboxes.forEach(tb => {
            const svgEl = renderTextBoxSVG(tb);
            if (svgEl) textboxesLayer.appendChild(svgEl);
        });
        refreshPortStates();
        rebuildConnectionTable();
        updateStatusBar();
    }

})();
