import React from "react"

const WIDTH = 680
const LEVEL_HEIGHT = 90
const NODE_RADIUS = 24

function computeLayout(nodes, edges) {
    if (!nodes.length) return {}

    // adjacency map
    const children = {}
    nodes.forEach(n => children[n.nodeID] = [])
    edges.forEach(e => children[e.fromNode].push(e.toNode))

    // find root
    const toNodes = new Set(edges.map(e => e.toNode))
    const root = nodes.find(n => !toNodes.has(n.nodeID)) // indegree = 0

    // BFS
    const depths = {}
    const queue = [root.nodeID]
    depths[root.nodeID] = 0

    while (queue.length) { // while !q.isEmpty
        const cur = queue.shift() // poll
        for (const child of children[cur]) {
            depths[child] = depths[cur] + 1
            queue.push(child)
        }
    }

    // group by level
    const levels = {}
    nodes.forEach(n => {
        const depth = depths[n.nodeID] ?? 0
        if (!levels[depth]) levels[depth] = []
        levels[depth].push(n.nodeID)
    })

    // assign x positions, spreading evenly
    const positions = {}
    Object.entries(levels).forEach(([depth, ids]) => {
        const count = ids.length
        ids.forEach((id, i) => {
            positions[id] = {
                x: (WIDTH / (count + 1)) * (i + 1),
                y: parseInt(depth) * LEVEL_HEIGHT + 60
            }
        })
    })

    return positions
}


// calculate SVG (vector graphic!) height based on max level
function computeHeight(positions) {
    if (!Object.keys(positions).length) return 200
    const maxY = Math.max(...Object.values(positions).map(p => p.y))
    return maxY + 80 // offset
}

// find edgepoints on a circle's circumference so nodes dont interfere
function edgeEndpoints(x1, y1, x2, y2, r) {
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt((dx * dx) + (dy * dy)) // vector distance
    if (dist === 0) return { x1, y1, x2, y2 }
    const ux = dx / dist // normalize length
    const uy = dy / dist
    return {
        x1: x1 + ux * r,
        y1: y1 + uy * r,
        x2: x2 - ux * r,
        y2: y2 - uy * r
    }
}

function getNodeColor(id, highlightedNodes, isComplete) {
    if (isComplete) return { fill: "#EAF3DE", stroke: "#3B6D11", text: "#3B6D11" }
    if (!highlightedNodes || !highlightedNodes.length)
        return { fill: "rgb(31, 75, 104)", stroke: "rgb(21, 55, 80)", text: "#ffffff" }
    const idx = highlightedNodes.indexOf(id)
    if (idx === -1)
        return { fill: "rgb(31, 75, 104)", stroke: "rgb(21, 55, 80)", text: "#ffffff" }
    if (idx === highlightedNodes.length - 1)
        return { fill: "#EAF3DE", stroke: "#3B6D11", text: "#3B6D11" }
    return { fill: "#E6F1FB", stroke: "#185FA5", text: "#185FA5" }
}

function GraphVisualizer({ graphData, currentStepIndex, isComplete }) {
    if (!graphData) {
        return (
            <div className="visualizer-empty">
                Enter an array and click Visualize
            </div>
        )
    }

    const { nodes, edges, steps } = graphData // deconstruct
    const positions = computeLayout(nodes, edges)
    const svgHeight = computeHeight(positions)

    const currentStep = steps && steps.length > 0 ? steps[currentStepIndex] : null
    const highlightedNodes = currentStep ? currentStep.highlightedNodes : isComplete ? nodes.map(n => n.nodeID) : []

    return (
        <div className="graph-visualizer">
            <svg
                width="100%"
                viewBox={`0 0 ${WIDTH} ${svgHeight}`}
                style={{ overflow: "visible" }}
            >
                <defs>
                    <marker
                        id="graph-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path
                            d="M2 1L8 5L2 9"
                            fill="none"
                            stroke="#8A7f6E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                </defs>

                {/* Edges */}
                {edges.map((edge, i) => {
                    const from = positions[edge.fromNode]
                    const to = positions[edge.toNode]
                    if (!from || !to) return null // no arrow here
                    const edgepoint = edgeEndpoints(from.x, from.y, to.x, to.y, NODE_RADIUS)
                    return (
                        <line
                            key={i}
                            x1={edgepoint.x1}
                            y1={edgepoint.y1}
                            x2={edgepoint.x2}
                            y2={edgepoint.y2}
                            stroke="#8A7F6E"
                            strokeWidth="1.5"
                            markerEnd="url(#graph-arrow)"
                        />
                    )
                })}

                {/* Nodes */}
                {nodes.map(node => {
                    const pos = positions[node.nodeID]
                    if (!pos) return null
                    const { fill, stroke, text } = getNodeColor(node.nodeID, highlightedNodes, isComplete)
                    return (
                        <g key={node.nodeID}>
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={NODE_RADIUS}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth="2"
                                style={{ transition: "fill 0.3s, stroke 0.3s" }}
                            />
                            <text
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                    fontSize: "14px", fontWeight: "500",
                                    fill: text, fontFamily: "monospace", userSelect: "none"
                                }}
                            >
                                {node.nodeValue}
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

export default GraphVisualizer