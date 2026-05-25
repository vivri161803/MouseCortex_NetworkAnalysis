import os
import shutil
import json
import xml.etree.ElementTree as ET

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(BASE_DIR, 'src', 'data')
PUBLIC_ASSETS_DIR = os.path.join(BASE_DIR, 'public', 'assets')

# Ensure directories exist
os.makedirs(SRC_DATA_DIR, exist_ok=True)
os.makedirs(PUBLIC_ASSETS_DIR, exist_ok=True)

def process_graphml():
    print("Processing GraphML...")
    graphml_file = os.path.join(BASE_DIR, 'mouse_visual.cortex_2.graphml')
    output_json = os.path.join(SRC_DATA_DIR, 'graph_data.json')
    
    if not os.path.exists(graphml_file):
        print(f"GraphML file not found: {graphml_file}")
        return

    # Parse GraphML
    tree = ET.parse(graphml_file)
    root = tree.getroot()
    ns = {'g': 'http://graphml.graphdrawing.org/xmlns'}
    
    nodes = []
    links = []
    
    # Very basic parsing, adapt based on actual graphml attributes
    for node in root.findall('.//g:node', ns):
        node_id = node.get('id')
        nodes.append({'id': node_id, 'label': f'Node {node_id}'})
        
    for edge in root.findall('.//g:edge', ns):
        source = edge.get('source')
        target = edge.get('target')
        links.append({'source': source, 'target': target})
        
    # Write JSON
    with open(output_json, 'w') as f:
        json.dump({'nodes': nodes, 'links': links}, f, indent=2)
    print(f"Saved {output_json}")

def organize_assets():
    print("Organizing assets (PDFs, CSVs)...")
    output_dir = os.path.join(BASE_DIR, 'output')
    
    if not os.path.exists(output_dir):
        print("Output directory not found. Skipping assets organization.")
        return
        
    # Copy all CSVs to src/data and PDFs to public/assets
    for root_dir, _, files in os.walk(output_dir):
        for file in files:
            source_path = os.path.join(root_dir, file)
            if file.endswith('.csv'):
                dest_path = os.path.join(SRC_DATA_DIR, file)
                shutil.copy2(source_path, dest_path)
            elif file.endswith('.pdf'):
                dest_path = os.path.join(PUBLIC_ASSETS_DIR, file)
                shutil.copy2(source_path, dest_path)
    print("Assets organized successfully.")

def main():
    print("Starting data processing...")
    process_graphml()
    organize_assets()
    print("Done!")

if __name__ == "__main__":
    main()
