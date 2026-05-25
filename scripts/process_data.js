import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.dirname(__dirname);
const SRC_DATA_DIR = path.join(BASE_DIR, 'src', 'data');
const PUBLIC_ASSETS_DIR = path.join(BASE_DIR, 'public', 'assets');

// Ensure directories exist
if (!fs.existsSync(SRC_DATA_DIR)) fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_ASSETS_DIR)) fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });

function processGraphML() {
    console.log("Processing GraphML...");
    const graphmlFile = path.join(BASE_DIR, 'analysis_output', 'mouse_visual.cortex_2.graphml');
    const outputJson = path.join(SRC_DATA_DIR, 'graph_data.json');
    
    if (!fs.existsSync(graphmlFile)) {
        console.log(`GraphML file not found: ${graphmlFile}`);
        return;
    }

    const xmlData = fs.readFileSync(graphmlFile, 'utf8');
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });
    const parsed = parser.parse(xmlData);

    const nodes = [];
    const links = [];

    // Build key-id → attr-name map from <key> definitions
    const keyDefs = parsed.graphml?.key;
    const keyMap = {};
    if (keyDefs) {
        const keys = Array.isArray(keyDefs) ? keyDefs : [keyDefs];
        for (const k of keys) {
            keyMap[k['@_id']] = k['@_attr.name'];
        }
    }

    // Helper: extract data elements into a flat object keyed by attr name
    function extractData(dataElems) {
        const result = {};
        if (!dataElems) return result;
        const arr = Array.isArray(dataElems) ? dataElems : [dataElems];
        for (const d of arr) {
            const attrName = keyMap[d['@_key']] || d['@_key'];
            result[attrName] = d['#text'] ?? '';
        }
        return result;
    }

    // Navigate to the graph element (assuming standard GraphML structure)
    const graph = parsed.graphml?.graph;
    if (graph) {
        const rawNodes = Array.isArray(graph.node) ? graph.node : [graph.node].filter(Boolean);
        const rawEdges = Array.isArray(graph.edge) ? graph.edge : [graph.edge].filter(Boolean);

        for (const node of rawNodes) {
            const attrs = extractData(node.data);
            nodes.push({
                id: node['@_id'],
                label: `Node ${node['@_id']}`,
                type1: attrs.type1 || 'Unknown',
                type2: attrs.type2 || 'Unknown',
            });
        }

        for (const edge of rawEdges) {
            const attrs = extractData(edge.data);
            links.push({
                source: edge['@_source'],
                target: edge['@_target'],
                weight: parseFloat(attrs.weight) || 1,
            });
        }
    }
    
    fs.writeFileSync(outputJson, JSON.stringify({ nodes, links }, null, 2));
    console.log(`Saved ${outputJson}`);
}

function organizeAssets() {
    console.log("Organizing assets (PDFs, CSVs)...");
    const outputDir = path.join(BASE_DIR, 'analysis_output', 'output');
    
    if (!fs.existsSync(outputDir)) {
        console.log("Output directory not found. Skipping assets organization.");
        return;
    }
    
    function walkDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walkDir(fullPath);
            } else {
                if (file.endsWith('.csv')) {
                    fs.copyFileSync(fullPath, path.join(SRC_DATA_DIR, file));
                } else if (file.endsWith('.pdf')) {
                    fs.copyFileSync(fullPath, path.join(PUBLIC_ASSETS_DIR, file));
                }
            }
        }
    }
    
    walkDir(outputDir);
    console.log("Assets organized successfully.");
}

function main() {
    console.log("Starting data processing...");
    processGraphML();
    organizeAssets();
    console.log("Done!");
}

main();
