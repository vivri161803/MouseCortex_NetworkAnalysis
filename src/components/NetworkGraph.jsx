import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import { drag as d3Drag } from 'd3-drag';
import graphRaw from '../data/graph_data.json';

// Color map for type1
const TYPE1_COLORS = {
  'Characterized pyramidal neuron': '#0071e3', // Apple blue
  'Cell body in EM volume': '#34c759',          // Apple green
  'Dendritic fragment': '#aeaeb2',              // Apple grey
};
const DEFAULT_COLOR = '#8e8e93';

const TYPE1_LABELS = Object.keys(TYPE1_COLORS);

function getColor(type1) {
  return TYPE1_COLORS[type1] || DEFAULT_COLOR;
}

export default function NetworkGraph() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const transformRef = useRef(zoomIdentity);
  const [tooltip, setTooltip] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // Deep clone data so D3 can mutate it
  const { nodes, links } = useMemo(() => {
    const n = graphRaw.nodes.map(d => ({ ...d }));
    const l = graphRaw.links.map(d => ({ ...d }));
    return { nodes: n, links: l };
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
    linksRef.current = links;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const width = canvas.parentElement.getBoundingClientRect().width;
    const height = canvas.parentElement.getBoundingClientRect().height;

    // D3 Force Simulation
    const sim = forceSimulation(nodes)
      .force('link', forceLink(links).id(d => d.id).distance(60).strength(0.3))
      .force('charge', forceManyBody().strength(-80))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(8))
      .alphaDecay(0.02);

    simRef.current = sim;

    // Zoom
    const zoomBehavior = d3Zoom()
      .scaleExtent([0.3, 5])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
      });

    select(canvas).call(zoomBehavior);

    // Drag
    const dragBehavior = d3Drag()
      .subject((event) => {
        const [mx, my] = transformRef.current.invert([event.x, event.y]);
        return sim.find(mx, my, 15);
      })
      .on('start', (event) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        if (event.subject) {
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
      })
      .on('drag', (event) => {
        if (event.subject) {
          const [mx, my] = transformRef.current.invert([event.x, event.y]);
          event.subject.fx = mx;
          event.subject.fy = my;
        }
      })
      .on('end', (event) => {
        if (!event.active) sim.alphaTarget(0);
        if (event.subject) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      });

    select(canvas).call(dragBehavior);

    // Draw function
    function draw() {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.save();
      ctx.clearRect(0, 0, w, h);

      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Draw edges
      ctx.strokeStyle = '#d2d2d7';
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.5;

      for (const link of linksRef.current) {
        const src = link.source;
        const tgt = link.target;
        if (!src.x || !tgt.x) continue;
        const srcHidden = hiddenTypes.has(src.type1);
        const tgtHidden = hiddenTypes.has(tgt.type1);
        if (srcHidden || tgtHidden) continue;

        const isHighlighted = selectedNode && (src.id === selectedNode || tgt.id === selectedNode);
        ctx.globalAlpha = isHighlighted ? 1 : 0.25;
        ctx.strokeStyle = isHighlighted ? '#0071e3' : '#d2d2d7';
        ctx.lineWidth = isHighlighted ? 1.5 : 0.6;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();

        // Arrowhead for directed edges
        if (isHighlighted) {
          const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
          const arrowLen = 6;
          const ax = tgt.x - Math.cos(angle) * 6;
          const ay = tgt.y - Math.sin(angle) * 6;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - arrowLen * Math.cos(angle - 0.4), ay - arrowLen * Math.sin(angle - 0.4));
          ctx.lineTo(ax - arrowLen * Math.cos(angle + 0.4), ay - arrowLen * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fillStyle = '#0071e3';
          ctx.fill();
        }
      }

      // Draw nodes
      ctx.globalAlpha = 1;
      for (const node of nodesRef.current) {
        if (!node.x) continue;
        if (hiddenTypes.has(node.type1)) continue;

        const isSelected = node.id === selectedNode;
        const isNeighbor = selectedNode && linksRef.current.some(
          l => (l.source.id === selectedNode && l.target.id === node.id) ||
               (l.target.id === selectedNode && l.source.id === node.id)
        );
        const dimmed = selectedNode && !isSelected && !isNeighbor;

        ctx.beginPath();
        const r = isSelected ? 7 : 4.5;
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dimmed ? '#e5e5ea' : getColor(node.type1);
        ctx.globalAlpha = dimmed ? 0.3 : 1;
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#1d1d1f';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      ctx.restore();
      requestAnimationFrame(draw);
    }

    sim.on('tick', () => {});
    requestAnimationFrame(draw);

    return () => {
      sim.stop();
      window.removeEventListener('resize', resize);
    };
  }, [nodes, links, selectedNode, hiddenTypes]);

  // Mouse move for tooltip
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const [mx, my] = t.invert([e.clientX - rect.left, e.clientY - rect.top]);

    let found = null;
    for (const node of nodesRef.current) {
      if (!node.x || hiddenTypes.has(node.type1)) continue;
      const dx = node.x - mx;
      const dy = node.y - my;
      if (dx * dx + dy * dy < 64) {
        found = node;
        break;
      }
    }

    if (found) {
      setTooltip({
        x: e.clientX - canvasRef.current.parentElement.getBoundingClientRect().left + 12,
        y: e.clientY - canvasRef.current.parentElement.getBoundingClientRect().top - 10,
        node: found,
      });
      canvas.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      canvas.style.cursor = 'grab';
    }
  }, [hiddenTypes]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const [mx, my] = t.invert([e.clientX - rect.left, e.clientY - rect.top]);

    let found = null;
    for (const node of nodesRef.current) {
      if (!node.x || hiddenTypes.has(node.type1)) continue;
      const dx = node.x - mx;
      const dy = node.y - my;
      if (dx * dx + dy * dy < 64) {
        found = node;
        break;
      }
    }

    setSelectedNode(found ? (found.id === selectedNode ? null : found.id) : null);
  }, [selectedNode, hiddenTypes]);

  const toggleType = (type) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 rounded-xl px-4 py-3 shadow-lg text-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>
            {tooltip.node.id}
          </div>
          <div style={{ color: '#6e6e73', fontSize: 12 }}>
            <span style={{ color: getColor(tooltip.node.type1), fontWeight: 500 }}>●</span>{' '}
            {tooltip.node.type1}
          </div>
          <div style={{ color: '#6e6e73', fontSize: 12 }}>
            {tooltip.node.type2 !== 'NA' ? tooltip.node.type2 : 'No type2 classification'}
          </div>
        </div>
      )}

      {/* Legend + Filters */}
      <div
        className="absolute bottom-4 left-4 z-20 rounded-2xl px-5 py-4 text-sm space-y-2"
        style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Neuron Type Filter
        </div>
        {TYPE1_LABELS.map(type => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '2px 0',
              opacity: hiddenTypes.has(type) ? 0.35 : 1,
              transition: 'opacity 0.2s',
              textDecoration: hiddenTypes.has(type) ? 'line-through' : 'none',
              color: '#1d1d1f',
              fontSize: 13,
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: TYPE1_COLORS[type],
              display: 'inline-block',
            }} />
            {type}
          </button>
        ))}
        <div style={{ fontSize: 11, color: '#86868b', marginTop: 6 }}>
          {graphRaw.nodes.length} nodes · {graphRaw.links.length} edges
        </div>
      </div>
    </div>
  );
}
