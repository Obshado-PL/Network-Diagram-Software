// ============================================================
// MikroTik Device Catalog - Complete Router & Switch Database
// ============================================================

// Port factory helpers
function ethPorts(count, type = 'ge', startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `ether${startIndex + i}`,
        type,
        label: `E${startIndex + i}`,
        group: 'ethernet'
    }));
}

function sfpPorts(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `sfp${startIndex + i}`,
        type: 'sfp',
        label: `SFP${startIndex + i}`,
        group: 'sfp'
    }));
}

function sfpPlusPorts(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `sfp-plus${startIndex + i}`,
        type: 'sfp+',
        label: `SFP+${startIndex + i}`,
        group: 'sfp'
    }));
}

function sfp28Ports(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `sfp28-${startIndex + i}`,
        type: 'sfp28',
        label: `SFP28-${startIndex + i}`,
        group: 'sfp'
    }));
}

function qsfpPlusPorts(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `qsfp-plus${startIndex + i}`,
        type: 'qsfp+',
        label: `QSFP+${startIndex + i}`,
        group: 'qsfp'
    }));
}

function qsfp28Ports(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `qsfp28-${startIndex + i}`,
        type: 'qsfp28',
        label: `QSFP28-${startIndex + i}`,
        group: 'qsfp'
    }));
}

function qsfp56ddPorts(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `qsfp56dd-${startIndex + i}`,
        type: 'qsfp56dd',
        label: `QSFP-DD${startIndex + i}`,
        group: 'qsfp'
    }));
}

function comboPorts(count, startIndex = 1) {
    return Array.from({ length: count }, (_, i) => ({
        id: `combo${startIndex + i}`,
        type: 'combo',
        label: `C${startIndex + i}`,
        group: 'combo'
    }));
}

// ============================================================
// DEVICE CATALOG
// ============================================================
const DEVICE_CATALOG = [

    // ==================== ROUTERS ====================

    // --- hAP Series ---
    {
        modelId: 'hap-be3-media',
        name: 'hAP be3 Media',
        model: 'MA53UG+HbeH',
        category: 'routers',
        subcategory: 'hap',
        description: 'Wi-Fi 7 tri-band, 5x 2.5G Ethernet',
        ports: [...ethPorts(5, '2.5ge')]
    },
    {
        modelId: 'hap-ax3',
        name: 'hAP ax3',
        model: 'C53UiG+5HPaxD2HPaxD',
        category: 'routers',
        subcategory: 'hap',
        description: 'Wi-Fi 6, 4x GbE, 1x 2.5G',
        ports: [
            ...ethPorts(4, 'ge'),
            { id: 'ether5', type: '2.5ge', label: 'E5', group: 'ethernet' }
        ]
    },
    {
        modelId: 'hap-ax2',
        name: 'hAP ax2',
        model: 'C52iG-5HaxD2HaxD-TC',
        category: 'routers',
        subcategory: 'hap',
        description: 'Wi-Fi 6, 5x Gigabit Ethernet',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'hap-ax-lite',
        name: 'hAP ax lite',
        model: 'L41G-2axD',
        category: 'routers',
        subcategory: 'hap',
        description: 'Wi-Fi 6 2.4GHz, 4x Gigabit',
        ports: [...ethPorts(4, 'ge')]
    },
    {
        modelId: 'hap-ax-lite-lte6',
        name: 'hAP ax lite LTE6',
        model: 'L41G-2axD&FG621-EA',
        category: 'routers',
        subcategory: 'hap',
        description: 'Wi-Fi 6 + LTE CAT6, 4x Gigabit',
        ports: [...ethPorts(4, 'ge')]
    },
    {
        modelId: 'hap-ac3',
        name: 'hAP ac3',
        model: 'RBD53iG-5HacD2HnD',
        category: 'routers',
        subcategory: 'hap',
        description: 'Dual-band Wi-Fi 5, 5x Gigabit',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'hap-ac2',
        name: 'hAP ac2',
        model: 'RBD52G-5HacD2HnD-TC',
        category: 'routers',
        subcategory: 'hap',
        description: 'Dual-band Wi-Fi 5, 5x Gigabit',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'hap-ac',
        name: 'hAP ac',
        model: 'RB962UiGS-5HacT2HnT',
        category: 'routers',
        subcategory: 'hap',
        description: 'Dual-band Wi-Fi 5, 5x GbE, 1x SFP',
        ports: [
            ...ethPorts(5, 'ge'),
            ...sfpPorts(1)
        ]
    },
    {
        modelId: 'hap-ac-lite',
        name: 'hAP ac lite',
        model: 'RB952Ui-5ac2nD',
        category: 'routers',
        subcategory: 'hap',
        description: 'Dual-band Wi-Fi 5, 5x 10/100',
        ports: [...ethPorts(5, 'fe')]
    },
    {
        modelId: 'hap',
        name: 'hAP',
        model: 'RB951Ui-2nD',
        category: 'routers',
        subcategory: 'hap',
        description: '2.4GHz Wi-Fi, 5x 10/100',
        ports: [...ethPorts(5, 'fe')]
    },
    {
        modelId: 'hap-lite',
        name: 'hAP lite',
        model: 'RB941-2nD',
        category: 'routers',
        subcategory: 'hap',
        description: '2.4GHz Wi-Fi, 4x 10/100',
        ports: [...ethPorts(4, 'fe')]
    },

    // --- hEX Series ---
    {
        modelId: 'hex-s-2025',
        name: 'hEX S (2025)',
        model: 'E60iUGS',
        category: 'routers',
        subcategory: 'hex',
        description: '5x GbE, 1x 2.5G SFP, USB 3.0',
        ports: [
            ...ethPorts(5, 'ge'),
            { id: 'sfp1', type: 'sfp', label: 'SFP1', group: 'sfp' }
        ]
    },
    {
        modelId: 'hex-s',
        name: 'hEX S',
        model: 'RB760iGS',
        category: 'routers',
        subcategory: 'hex',
        description: '5x GbE, 1x SFP, PoE out, USB',
        ports: [
            ...ethPorts(5, 'ge'),
            { id: 'sfp1', type: 'sfp', label: 'SFP1', group: 'sfp' }
        ]
    },
    {
        modelId: 'hex',
        name: 'hEX',
        model: 'RB750Gr3',
        category: 'routers',
        subcategory: 'hex',
        description: '5x Gigabit Ethernet, USB',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'hex-lite',
        name: 'hEX lite',
        model: 'RB750r2',
        category: 'routers',
        subcategory: 'hex',
        description: '5x 10/100 Ethernet',
        ports: [...ethPorts(5, 'fe')]
    },
    {
        modelId: 'hex-poe-lite',
        name: 'hEX PoE lite',
        model: 'RB750UPr2',
        category: 'routers',
        subcategory: 'hex',
        description: '5x 10/100, PoE out',
        ports: [...ethPorts(5, 'fe')]
    },

    // --- CCR2xxx Series ---
    {
        modelId: 'ccr2216-1g-12xs-2xq',
        name: 'CCR2216-1G-12XS-2XQ',
        model: 'CCR2216-1G-12XS-2XQ',
        category: 'routers',
        subcategory: 'ccr',
        description: '1x GbE, 12x SFP28, 2x QSFP28, 16-core',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfp28Ports(12),
            ...qsfp28Ports(2)
        ]
    },
    {
        modelId: 'ccr2116-12g-4s-plus',
        name: 'CCR2116-12G-4S+',
        model: 'CCR2116-12G-4S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '12x GbE, 4x SFP+, 16-core',
        ports: [
            ...ethPorts(12, 'ge'),
            ...sfpPlusPorts(4)
        ]
    },
    {
        modelId: 'ccr2004-16g-2s-plus',
        name: 'CCR2004-16G-2S+',
        model: 'CCR2004-16G-2S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '16x GbE, 2x SFP+, 4-core',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'ccr2004-16g-2s-plus-pc',
        name: 'CCR2004-16G-2S+PC',
        model: 'CCR2004-16G-2S+PC',
        category: 'routers',
        subcategory: 'ccr',
        description: '16x GbE, 2x SFP+, passive cooling',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },

    // --- CCR1xxx Series (Legacy) ---
    {
        modelId: 'ccr1036-12g-4s',
        name: 'CCR1036-12G-4S',
        model: 'CCR1036-12G-4S',
        category: 'routers',
        subcategory: 'ccr',
        description: '12x GbE, 4x SFP, 36-core',
        ports: [
            ...ethPorts(12, 'ge'),
            ...sfpPorts(4)
        ]
    },
    {
        modelId: 'ccr1036-8g-2s-plus',
        name: 'CCR1036-8G-2S+',
        model: 'CCR1036-8G-2S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '8x GbE, 2x SFP+, 36-core',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'ccr1016-12g',
        name: 'CCR1016-12G',
        model: 'CCR1016-12G',
        category: 'routers',
        subcategory: 'ccr',
        description: '12x GbE, 16-core, LCD',
        ports: [...ethPorts(12, 'ge')]
    },
    {
        modelId: 'ccr1016-12s-1s-plus',
        name: 'CCR1016-12S-1S+',
        model: 'CCR1016-12S-1S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '12x SFP, 1x SFP+, 16-core',
        ports: [
            ...sfpPorts(12),
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'ccr1009-7g-1c-1s-plus',
        name: 'CCR1009-7G-1C-1S+',
        model: 'CCR1009-7G-1C-1S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '7x GbE, 1x Combo, 1x SFP+, 9-core',
        ports: [
            ...ethPorts(7, 'ge'),
            ...comboPorts(1),
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'ccr1009-8g-1s-1s-plus',
        name: 'CCR1009-8G-1S-1S+',
        model: 'CCR1009-8G-1S-1S+',
        category: 'routers',
        subcategory: 'ccr',
        description: '8x GbE, 1x SFP, 1x SFP+, 9-core',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPorts(1),
            ...sfpPlusPorts(1)
        ]
    },

    // --- RB Series ---
    {
        modelId: 'rb5009ug-s-plus-in',
        name: 'RB5009UG+S+IN',
        model: 'RB5009UG+S+IN',
        category: 'routers',
        subcategory: 'rb',
        description: '7x GbE, 1x 2.5G, 1x SFP+',
        ports: [
            ...ethPorts(7, 'ge'),
            { id: 'ether8', type: '2.5ge', label: 'E8', group: 'ethernet' },
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'rb5009upr-s-plus-in',
        name: 'RB5009UPr+S+IN',
        model: 'RB5009UPr+S+IN',
        category: 'routers',
        subcategory: 'rb',
        description: '7x GbE, 1x 2.5G, 1x SFP+, PoE all ports',
        ports: [
            ...ethPorts(7, 'ge'),
            { id: 'ether8', type: '2.5ge', label: 'E8', group: 'ethernet' },
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'rb4011igs-plus-rm',
        name: 'RB4011iGS+RM',
        model: 'RB4011iGS+RM',
        category: 'routers',
        subcategory: 'rb',
        description: '10x GbE, 1x SFP+, rackmount',
        ports: [
            ...ethPorts(10, 'ge'),
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'rb4011igs-5hacq2hnd',
        name: 'RB4011 WiFi',
        model: 'RB4011iGS+5HacQ2HnD-IN',
        category: 'routers',
        subcategory: 'rb',
        description: '10x GbE, 1x SFP+, Wi-Fi 5',
        ports: [
            ...ethPorts(10, 'ge'),
            ...sfpPlusPorts(1)
        ]
    },
    {
        modelId: 'rb3011uias-rm',
        name: 'RB3011UiAS-RM',
        model: 'RB3011UiAS-RM',
        category: 'routers',
        subcategory: 'rb',
        description: '10x GbE, 1x SFP, LCD, rackmount',
        ports: [
            ...ethPorts(10, 'ge'),
            ...sfpPorts(1)
        ]
    },
    {
        modelId: 'rb2011uias-2hnd',
        name: 'RB2011UiAS-2HnD',
        model: 'RB2011UiAS-2HnD-IN',
        category: 'routers',
        subcategory: 'rb',
        description: '5x GbE, 5x FE, 1x SFP, Wi-Fi',
        ports: [
            ...ethPorts(5, 'ge'),
            ...ethPorts(5, 'fe', 6),
            ...sfpPorts(1)
        ]
    },
    {
        modelId: 'rb1100ahx4',
        name: 'RB1100AHx4',
        model: 'RB1100AHx4',
        category: 'routers',
        subcategory: 'rb',
        description: '13x GbE, quad-core, rackmount',
        ports: [...ethPorts(13, 'ge')]
    },
    {
        modelId: 'rb1100ahx4-de',
        name: 'RB1100AHx4 Dude',
        model: 'RB1100Dx4',
        category: 'routers',
        subcategory: 'rb',
        description: '13x GbE, 60GB SSD, Dude Edition',
        ports: [...ethPorts(13, 'ge')]
    },
    {
        modelId: 'rb450gx4',
        name: 'RB450Gx4',
        model: 'RB450Gx4',
        category: 'routers',
        subcategory: 'rb',
        description: '5x GbE, quad-core, PoE',
        ports: [...ethPorts(5, 'ge')]
    },

    // --- L009 Series ---
    {
        modelId: 'l009uigs-rm',
        name: 'L009UiGS-RM',
        model: 'L009UiGS-RM',
        category: 'routers',
        subcategory: 'rb',
        description: '8x GbE, 1x 2.5G SFP, rackmount',
        ports: [
            ...ethPorts(8, 'ge'),
            { id: 'sfp1', type: 'sfp', label: 'SFP1', group: 'sfp' }
        ]
    },
    {
        modelId: 'l009uigs-2haxd',
        name: 'L009UiGS-2HaxD',
        model: 'L009UiGS-2HaxD-IN',
        category: 'routers',
        subcategory: 'rb',
        description: '8x GbE, 1x 2.5G SFP, Wi-Fi 6',
        ports: [
            ...ethPorts(8, 'ge'),
            { id: 'sfp1', type: 'sfp', label: 'SFP1', group: 'sfp' }
        ]
    },

    // --- Chateau Series ---
    {
        modelId: 'chateau-lte12',
        name: 'Chateau LTE12',
        model: 'RBD53G-5HacD2HnD&R11e-LTE',
        category: 'routers',
        subcategory: 'chateau',
        description: 'Wi-Fi 5 + LTE CAT12, 5x GbE',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'chateau-lte6',
        name: 'Chateau LTE6',
        model: 'S53UG+5HacD2HnD-TC&FG621-EA',
        category: 'routers',
        subcategory: 'chateau',
        description: 'Wi-Fi 5 + LTE CAT6, 5x GbE',
        ports: [...ethPorts(5, 'ge')]
    },
    {
        modelId: 'chateau-lte18-ax',
        name: 'Chateau LTE18 ax',
        model: 'S53UG+5HaxD2HaxD-TC&EG18-EA',
        category: 'routers',
        subcategory: 'chateau',
        description: 'Wi-Fi 6 + LTE CAT18, 4x GbE, 1x 2.5G',
        ports: [
            ...ethPorts(4, 'ge'),
            { id: 'ether5', type: '2.5ge', label: 'E5', group: 'ethernet' }
        ]
    },
    {
        modelId: 'chateau-5g-ax',
        name: 'Chateau 5G ax',
        model: 'Chateau 5G ax',
        category: 'routers',
        subcategory: 'chateau',
        description: 'Wi-Fi 6 + 5G, 4x GbE, 1x 2.5G',
        ports: [
            ...ethPorts(4, 'ge'),
            { id: 'ether5', type: '2.5ge', label: 'E5', group: 'ethernet' }
        ]
    },

    // ==================== SWITCHES ====================

    // --- CRS1xx Series ---
    {
        modelId: 'crs106-1c-5s',
        name: 'CRS106-1C-5S',
        model: 'CRS106-1C-5S',
        category: 'switches',
        subcategory: 'crs1xx',
        description: '5x SFP, 1x Combo (GbE/SFP)',
        ports: [
            ...comboPorts(1),
            ...sfpPorts(5)
        ]
    },
    {
        modelId: 'crs112-8g-4s-in',
        name: 'CRS112-8G-4S-IN',
        model: 'CRS112-8G-4S-IN',
        category: 'switches',
        subcategory: 'crs1xx',
        description: '8x GbE, 4x SFP',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPorts(4)
        ]
    },
    {
        modelId: 'crs112-8p-4s-in',
        name: 'CRS112-8P-4S-IN',
        model: 'CRS112-8P-4S-IN',
        category: 'switches',
        subcategory: 'crs1xx',
        description: '8x GbE PoE, 4x SFP',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPorts(4)
        ]
    },

    // --- CRS3xx Series ---
    {
        modelId: 'crs304-4xg-in',
        name: 'CRS304-4XG-IN',
        model: 'CRS304-4XG-IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '4x 10G Ethernet, 1x GbE mgmt',
        ports: [
            ...ethPorts(4, '10ge'),
            { id: 'ether5', type: 'ge', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs305-1g-4s-plus-in',
        name: 'CRS305-1G-4S+IN',
        model: 'CRS305-1G-4S+IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '4x 10G SFP+, 1x GbE',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPlusPorts(4)
        ]
    },
    {
        modelId: 'crs309-1g-8s-plus-in',
        name: 'CRS309-1G-8S+IN',
        model: 'CRS309-1G-8S+IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '8x 10G SFP+, 1x GbE',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPlusPorts(8)
        ]
    },
    {
        modelId: 'crs310-1g-5s-4s-plus-in',
        name: 'CRS310-1G-5S-4S+IN',
        model: 'CRS310-1G-5S-4S+IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '5x SFP, 4x SFP+, 1x GbE',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPorts(5),
            ...sfpPlusPorts(4)
        ]
    },
    {
        modelId: 'crs310-8g-2s-plus-in',
        name: 'CRS310-8G+2S+IN',
        model: 'CRS310-8G+2S+IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '8x 2.5G Ethernet, 2x 10G SFP+',
        ports: [
            ...ethPorts(8, '2.5ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'crs312-4c-8xg-rm',
        name: 'CRS312-4C+8XG-RM',
        model: 'CRS312-4C+8XG-RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '8x 10G RJ45, 4x 10G Combo, rackmount',
        ports: [
            ...ethPorts(8, '10ge'),
            ...comboPorts(4),
            { id: 'mgmt', type: 'ge', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs317-1g-16s-plus-rm',
        name: 'CRS317-1G-16S+RM',
        model: 'CRS317-1G-16S+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '16x 10G SFP+, 1x GbE, rackmount',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPlusPorts(16)
        ]
    },
    {
        modelId: 'crs320-8p-8b-4s-plus-rm',
        name: 'CRS320-8P-8B-4S+RM',
        model: 'CRS320-8P-8B-4S+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '8x GbE PoE, 8x GbE PoE++, 4x SFP+',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(4),
            { id: 'mgmt', type: 'ge', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs326-24g-2s-plus-in',
        name: 'CRS326-24G-2S+IN',
        model: 'CRS326-24G-2S+IN',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '24x GbE, 2x SFP+, desktop',
        ports: [
            ...ethPorts(24, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'crs326-24g-2s-plus-rm',
        name: 'CRS326-24G-2S+RM',
        model: 'CRS326-24G-2S+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '24x GbE, 2x SFP+, rackmount',
        ports: [
            ...ethPorts(24, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'crs326-24s-2q-plus-rm',
        name: 'CRS326-24S+2Q+RM',
        model: 'CRS326-24S+2Q+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '24x 10G SFP+, 2x 40G QSFP+, rackmount',
        ports: [
            ...sfpPlusPorts(24),
            ...qsfpPlusPorts(2),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs326-4c-20g-2q-plus-rm',
        name: 'CRS326-4C+20G+2Q+RM',
        model: 'CRS326-4C+20G+2Q+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '20x 2.5G, 4x Combo 2.5G/SFP+, 2x QSFP+',
        ports: [
            ...ethPorts(20, '2.5ge'),
            ...comboPorts(4),
            ...qsfpPlusPorts(2),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs328-24p-4s-plus-rm',
        name: 'CRS328-24P-4S+RM',
        model: 'CRS328-24P-4S+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '24x GbE PoE, 4x SFP+, rackmount',
        ports: [
            ...ethPorts(24, 'ge'),
            ...sfpPlusPorts(4)
        ]
    },
    {
        modelId: 'crs328-4c-20s-4s-plus-rm',
        name: 'CRS328-4C-20S-4S+RM',
        model: 'CRS328-4C-20S-4S+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '20x SFP, 4x SFP+, 4x Combo, rackmount',
        ports: [
            ...sfpPorts(20),
            ...sfpPlusPorts(4),
            ...comboPorts(4)
        ]
    },
    {
        modelId: 'crs354-48g-4s-plus-2q-plus-rm',
        name: 'CRS354-48G-4S+2Q+RM',
        model: 'CRS354-48G-4S+2Q+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '48x GbE, 4x SFP+, 2x QSFP+, rackmount',
        ports: [
            ...ethPorts(48, 'ge'),
            ...sfpPlusPorts(4),
            ...qsfpPlusPorts(2),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs354-48p-4s-plus-2q-plus-rm',
        name: 'CRS354-48P-4S+2Q+RM',
        model: 'CRS354-48P-4S+2Q+RM',
        category: 'switches',
        subcategory: 'crs3xx',
        description: '48x GbE PoE, 4x SFP+, 2x QSFP+',
        ports: [
            ...ethPorts(48, 'ge'),
            ...sfpPlusPorts(4),
            ...qsfpPlusPorts(2)
        ]
    },

    // --- CRS4xx Series ---
    {
        modelId: 'crs418-8p-8g-2s-plus-rm',
        name: 'CRS418-8P-8G-2S+RM',
        model: 'CRS418-8P-8G-2S+RM',
        category: 'switches',
        subcategory: 'crs4xx',
        description: '8x GbE PoE, 8x GbE, 2x SFP+, rackmount',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(2),
            { id: 'mgmt', type: 'ge', label: 'Mgmt', group: 'mgmt' }
        ]
    },

    // --- CRS5xx / High-End ---
    {
        modelId: 'crs504-4xq-in',
        name: 'CRS504-4XQ-IN',
        model: 'CRS504-4XQ-IN',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '4x 100G QSFP28, desktop',
        ports: [
            ...qsfp28Ports(4),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs504-4xq-out',
        name: 'CRS504-4XQ-OUT',
        model: 'CRS504-4XQ-OUT',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '4x 100G QSFP28, outdoor IP66',
        ports: [
            ...qsfp28Ports(4),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs510-8xs-2xq-in',
        name: 'CRS510-8XS-2XQ-IN',
        model: 'CRS510-8XS-2XQ-IN',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '8x 25G SFP28, 2x 100G QSFP28',
        ports: [
            ...sfp28Ports(8),
            ...qsfp28Ports(2),
            { id: 'mgmt', type: 'fe', label: 'Mgmt', group: 'mgmt' }
        ]
    },
    {
        modelId: 'crs518-16xs-2xq-rm',
        name: 'CRS518-16XS-2XQ-RM',
        model: 'CRS518-16XS-2XQ-RM',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '16x 25G SFP28, 2x 100G QSFP28, rackmount',
        ports: [
            ...sfp28Ports(16),
            ...qsfp28Ports(2)
        ]
    },
    {
        modelId: 'crs520-4xs-16xq-rm',
        name: 'CRS520-4XS-16XQ-RM',
        model: 'CRS520-4XS-16XQ-RM',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '16x 100G QSFP28, 4x 25G SFP28, 2x 10GbE',
        ports: [
            ...qsfp28Ports(16),
            ...sfp28Ports(4),
            ...ethPorts(2, '10ge')
        ]
    },
    {
        modelId: 'crs804-ddq',
        name: 'CRS804 DDQ',
        model: 'CRS804-4DDQ-hRM',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '4x 400G QSFP56-DD, 2x 10GbE',
        ports: [
            ...qsfp56ddPorts(4),
            ...ethPorts(2, '10ge')
        ]
    },
    {
        modelId: 'crs812-ddq',
        name: 'CRS812 DDQ',
        model: 'CRS812-8DS-2DQ-2DDQ-RM',
        category: 'switches',
        subcategory: 'crs5xx',
        description: '8x 50G SFP56, 2x 200G QSFP56, 2x 400G QSFP-DD',
        ports: [
            ...sfp28Ports(8),  // SFP56 uses sfp28 visually
            ...qsfp28Ports(2), // QSFP56 uses qsfp28 visually
            ...qsfp56ddPorts(2),
            ...ethPorts(2, '10ge')
        ]
    },

    // --- CSS Series ---
    {
        modelId: 'css106-5g-1s',
        name: 'CSS106-5G-1S',
        model: 'CSS106-5G-1S (RB260GS)',
        category: 'switches',
        subcategory: 'css',
        description: '5x GbE, 1x SFP',
        ports: [
            ...ethPorts(5, 'ge'),
            ...sfpPorts(1)
        ]
    },
    {
        modelId: 'css106-1g-4p-1s',
        name: 'CSS106-1G-4P-1S',
        model: 'CSS106-1G-4P-1S (RB260GSP)',
        category: 'switches',
        subcategory: 'css',
        description: '5x GbE (4x PoE), 1x SFP',
        ports: [
            ...ethPorts(5, 'ge'),
            ...sfpPorts(1)
        ]
    },
    {
        modelId: 'css318-16g-2s-plus-in',
        name: 'CSS318-16G-2S+IN',
        model: 'CSS318-16G-2S+IN',
        category: 'switches',
        subcategory: 'css',
        description: '16x GbE, 2x SFP+',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'css326-24g-2s-plus-rm',
        name: 'CSS326-24G-2S+RM',
        model: 'CSS326-24G-2S+RM',
        category: 'switches',
        subcategory: 'css',
        description: '24x GbE, 2x SFP+, rackmount',
        ports: [
            ...ethPorts(24, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'css610-8g-2s-plus-in',
        name: 'CSS610-8G-2S+IN',
        model: 'CSS610-8G-2S+IN',
        category: 'switches',
        subcategory: 'css',
        description: '8x GbE, 2x SFP+',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'css610-8p-2s-plus-in',
        name: 'CSS610-8P-2S+IN',
        model: 'CSS610-8P-2S+IN',
        category: 'switches',
        subcategory: 'css',
        description: '8x GbE PoE, 2x SFP+',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },

    // --- netPower / Outdoor ---
    {
        modelId: 'netpower-16p',
        name: 'netPower 16P',
        model: 'CRS318-16P-2S+OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '16x GbE PoE, 2x SFP+, outdoor',
        ports: [
            ...ethPorts(16, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'netpower-15fr',
        name: 'netPower 15FR',
        model: 'CRS318-1Fi-15Fr-2S-OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '16x FE (reverse PoE), 2x SFP, outdoor',
        ports: [
            ...ethPorts(16, 'fe'),
            ...sfpPorts(2)
        ]
    },
    {
        modelId: 'netpower-lite-8p',
        name: 'netPower Lite 8P',
        model: 'CSS610-8P-2S+OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '8x GbE PoE, 2x SFP+, outdoor, UPS',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'netpower-lite-7r',
        name: 'netPower Lite 7R',
        model: 'CSS610-1Gi-7R-2S+OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '7x GbE (reverse PoE), 1x GbE, 2x SFP+, outdoor',
        ports: [
            ...ethPorts(8, 'ge'),
            ...sfpPlusPorts(2)
        ]
    },
    {
        modelId: 'netfiber-9',
        name: 'netFiber 9',
        model: 'CRS310-1G-5S-4S+OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '5x SFP, 4x SFP+, 1x GbE, outdoor',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPorts(5),
            ...sfpPlusPorts(4)
        ]
    },
    {
        modelId: 'fiberbox-plus',
        name: 'FiberBox Plus',
        model: 'CRS305-1G-4S+OUT',
        category: 'switches',
        subcategory: 'netpower',
        description: '4x SFP+, 1x GbE, outdoor IP66',
        ports: [
            ...ethPorts(1, 'ge'),
            ...sfpPlusPorts(4)
        ]
    },
];

// ==================== ACCESS POINTS ====================

const AP_CATALOG = [
    {
        modelId: 'cap-ax',
        name: 'cAP ax',
        model: 'CAPGi-5HaxD2HaxD',
        category: 'wireless',
        subcategory: 'cap',
        description: 'Wi-Fi 6 ceiling AP, 2x GbE',
        ports: [...ethPorts(2, 'ge')]
    },
    {
        modelId: 'cap-ac',
        name: 'cAP ac',
        model: 'RBcAPGi-5acD2nD',
        category: 'wireless',
        subcategory: 'cap',
        description: 'Wi-Fi 5 ceiling AP, 2x GbE',
        ports: [...ethPorts(2, 'ge')]
    },
    {
        modelId: 'cap-lite',
        name: 'cAP lite',
        model: 'RBcAPL-2nD',
        category: 'wireless',
        subcategory: 'cap',
        description: 'Wi-Fi 4 ceiling AP, 1x FE',
        ports: [...ethPorts(1, 'fe')]
    },
    {
        modelId: 'cap-xl-ac',
        name: 'cAP XL ac',
        model: 'RBcAPGi-5acD2nD-XL',
        category: 'wireless',
        subcategory: 'cap',
        description: 'Wi-Fi 5 high-power ceiling AP, 2x GbE',
        ports: [...ethPorts(2, 'ge')]
    },
    {
        modelId: 'wap-ax',
        name: 'wAP ax',
        model: 'RBwAPGR-5HacD2HnD',
        category: 'wireless',
        subcategory: 'wap',
        description: 'Wi-Fi 6 outdoor AP, 1x GbE',
        ports: [...ethPorts(1, 'ge')]
    },
    {
        modelId: 'wap-ac',
        name: 'wAP ac',
        model: 'RBwAPG-5HacD2HnD',
        category: 'wireless',
        subcategory: 'wap',
        description: 'Wi-Fi 5 outdoor AP, 1x GbE',
        ports: [...ethPorts(1, 'ge')]
    },
    {
        modelId: 'wap-r-ac',
        name: 'wAP R ac',
        model: 'RBwAPGR-5HacD2HnD',
        category: 'wireless',
        subcategory: 'wap',
        description: 'Wi-Fi 5 outdoor AP with LTE, 1x GbE',
        ports: [...ethPorts(1, 'ge')]
    },
    {
        modelId: 'audience',
        name: 'Audience',
        model: 'RBD25G-5HPacQD2HPnD',
        category: 'wireless',
        subcategory: 'other-ap',
        description: 'Tri-band mesh AP, 2x GbE',
        ports: [...ethPorts(2, 'ge')]
    },
    {
        modelId: 'cube-60pro-ac',
        name: 'Cube 60Pro ac',
        model: 'CubeG-5ac60adpair',
        category: 'wireless',
        subcategory: 'other-ap',
        description: '60GHz + 5GHz failover PtP, 1x GbE',
        ports: [...ethPorts(1, 'ge')]
    },
    {
        modelId: 'generic-ap',
        name: 'Access Point',
        category: 'wireless',
        subcategory: 'other-ap',
        description: 'Generic MikroTik wireless access point',
        ports: [...ethPorts(1, 'ge')]
    },
    {
        modelId: 'generic-ap-other',
        name: 'Access Point',
        brand: 'generic',
        category: 'wireless',
        subcategory: 'other-ap',
        description: 'Generic non-MikroTik wireless access point',
        ports: [...ethPorts(1, 'ge')]
    },
];

DEVICE_CATALOG.push(...AP_CATALOG);

// ==================== UTILITIES ====================

const UTILITY_CATALOG = [
    {
        modelId: 'internet-cloud',
        name: 'Internet',
        category: 'utilities',
        subcategory: 'generic',
        description: 'Internet / WAN cloud',
        ports: [{ id: 'wan1', type: 'ge', label: 'WAN', group: 'ethernet' }]
    },
];

// Merge utilities into DEVICE_CATALOG
DEVICE_CATALOG.push(...UTILITY_CATALOG);

// ============================================================
// SIDEBAR CATEGORIES
// ============================================================
const SIDEBAR_CATEGORIES = [
    {
        id: 'routers',
        label: 'Routers',
        subcategories: [
            { id: 'hap', label: 'hAP Series' },
            { id: 'hex', label: 'hEX Series' },
            { id: 'ccr', label: 'CCR Series' },
            { id: 'rb', label: 'RB / L009 Series' },
            { id: 'chateau', label: 'Chateau LTE/5G' },
        ]
    },
    {
        id: 'switches',
        label: 'Switches',
        subcategories: [
            { id: 'crs1xx', label: 'CRS 1xx' },
            { id: 'crs3xx', label: 'CRS 3xx' },
            { id: 'crs4xx', label: 'CRS 4xx' },
            { id: 'crs5xx', label: 'CRS 5xx / High-End' },
            { id: 'css', label: 'CSS Series' },
            { id: 'netpower', label: 'netPower / Outdoor' },
        ]
    },
    {
        id: 'wireless',
        label: 'Wireless / APs',
        subcategories: [
            { id: 'cap', label: 'cAP Series' },
            { id: 'wap', label: 'wAP Series' },
            { id: 'other-ap', label: 'Other APs' },
        ]
    },
    {
        id: 'utilities',
        label: 'Utilities',
        subcategories: [
            { id: 'generic', label: 'Generic' },
        ]
    }
];

// Helper to look up catalog entries
function getDeviceCatalogEntry(modelId) {
    return DEVICE_CATALOG.find(d => d.modelId === modelId);
}

function getDevicesBySubcategory(subcatId) {
    return DEVICE_CATALOG.filter(d => d.subcategory === subcatId);
}

// Port color mapping
const PORT_COLORS = {
    'fe': '#888888',
    'ge': '#4CAF50',
    '2.5ge': '#8BC34A',
    '10ge': '#FF9800',
    'sfp': '#2196F3',
    'sfp+': '#FF5722',
    'sfp28': '#9C27B0',
    'qsfp+': '#E91E63',
    'qsfp28': '#F44336',
    'qsfp56dd': '#D50000',
    'combo': '#00BCD4'
};

function getPortColor(portType) {
    return PORT_COLORS[portType] || '#888';
}

// Port type display names
const PORT_TYPE_NAMES = {
    'fe': '10/100M',
    'ge': '1G',
    '2.5ge': '2.5G',
    '10ge': '10G',
    'sfp': 'SFP',
    'sfp+': 'SFP+',
    'sfp28': 'SFP28',
    'qsfp+': 'QSFP+',
    'qsfp28': 'QSFP28',
    'qsfp56dd': 'QSFP-DD',
    'combo': 'Combo'
};

// Port widths for rendering (wider for bigger connectors)
const PORT_WIDTHS = {
    'fe': 14,
    'ge': 14,
    '2.5ge': 14,
    '10ge': 16,
    'sfp': 16,
    'sfp+': 16,
    'sfp28': 16,
    'qsfp+': 24,
    'qsfp28': 24,
    'qsfp56dd': 30,
    'combo': 16
};

function getPortWidth(portType) {
    return PORT_WIDTHS[portType] || 12;
}
