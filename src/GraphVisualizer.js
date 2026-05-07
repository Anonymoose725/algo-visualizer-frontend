import { useState, useRef } from "react"

const WIDTH = 680
const LEVEL_HEIGHT = 75
const NODE_RADIUS = 24

// revision for correctness: nodes must be placed with awareness of parent, so that children are placed on left/right correctly
function computeLayout(nodes, edges) {
    if (!nodes.length) return {}

    const children = {}
    nodes.forEach(n => children[n.nodeID] = [])
    edges.forEach(e => children[e.fromNode].push(e.toNode))

    const toNodes = new Set(edges.map(e => e.toNode))
    const root = nodes.find(n => !toNodes.has(n.nodeID))
    if (!root) return {}

    const positions = {}

    function layout(nodeId, lo, hi, depth) {
        const mid = (lo + hi) / 2
        positions[nodeId] = {
            x: mid,
            y: depth * LEVEL_HEIGHT + 60
        }
        const kids = children[nodeId] || []

        // figure out which child is left and which is right
        // left child has a smaller value than current node (always!!!)
        const nodeValue = nodes.find(n => n.nodeID === nodeId)?.nodeValue
        const leftChild = kids.find(id => nodes.find(n => n.nodeID === id)?.nodeValue < nodeValue)
        const rightChild = kids.find(id => nodes.find(n => n.nodeID === id)?.nodeValue >= nodeValue)

        if (leftChild !== undefined) layout(leftChild, lo, mid, depth + 1)
        if (rightChild !== undefined) layout(rightChild, mid, hi, depth + 1)
    }

    layout(root.nodeID, 40, WIDTH - 40, 0)
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
    const idx = highlightedNodes.indexOf(String(id))
    if (idx === -1)
        return { fill: "rgb(31, 75, 104)", stroke: "rgb(21, 55, 80)", text: "#ffffff" }
    if (idx === highlightedNodes.length - 1)
        return { fill: "#EAF3DE", stroke: "#3B6D11", text: "#3B6D11" }
    return { fill: "#E6F1FB", stroke: "#185FA5", text: "#185FA5" }
}

function GraphVisualizer({ graphData, currentStepIndex, isComplete, bstMode }) {

    // for zoom, pan
    const [zoom, setZoom] = useState(1)
    const [panX, setPanX] = useState(0)
    const [panY, setPanY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0 }) // provides a ref, mutable state, so we dont need to re-render when drag position updates

    if (!graphData) {
        return (
            <div className="visualizer-empty">
                Enter an array and click Visualize
            </div>
        )
    }

    const { nodes, edges, steps } = graphData // deconstruct

    function getVisibleNodes(nodes, steps, currentStepIndex) {
        if (!steps || !steps.length) return new Set(nodes.map(n => String(n.nodeID)))
        const visible = new Set()
        for (let i = 0; i <= currentStepIndex; i++) {
            const h = steps[i].highlightedNodes
            if (h.length > 0) {
                visible.add(Number(h[h.length - 1]))  // convert string to number
            }
        }
        return visible
    }

    const visibleNodeIds = bstMode === "insert"
        ? getVisibleNodes(nodes, steps, currentStepIndex)
        : new Set(nodes.map(n => n.nodeID))

    const nodesToRender = nodes.filter(n => visibleNodeIds.has(n.nodeID))
    const edgesToRender = edges.filter(e =>
        visibleNodeIds.has(e.fromNode) && visibleNodeIds.has(e.toNode))

    const positions = computeLayout(nodesToRender, edgesToRender)
    const svgHeight = computeHeight(positions)

    const currentStep = steps && steps.length > 0 ? steps[currentStepIndex] : null
    const highlightedNodes = currentStep
        ? currentStep.highlightedNodes // strings from backend like ["0", "1"]
        : isComplete ? nodes.map(n => String(n.nodeID)) : []

    // viewbox
    const viewBoxWidth = WIDTH / zoom
    const viewBoxHeight = svgHeight / zoom
    const viewBox = `${panX} ${panY} ${viewBoxWidth} ${viewBoxHeight}`

    function zoomIn() { setZoom(z => Math.min(z * 1.5, 8)) }
    function zoomOut() { setZoom(z => Math.max(z / 1.5, 0.5)) }
    function resetView() { setZoom(1); setPanX(0); setPanY(0) }

    function handleMouseDown(e) {
        setIsDragging(true)
        dragStart.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
    }

    function handleMouseMove(e) {
        if (!isDragging) return
        const dx = (e.clientX - dragStart.current.x) / zoom
        const dy = (e.clientY - dragStart.current.y) / zoom
        setPanX(x => x - dx) // offset by panned amount
        setPanY(y => y - dy)
        dragStart.current = { x: e.clientX, y: e.clientY }
    }

    function handleMouseUp() {
        setIsDragging(false)
    }


    // DEBUG
    console.log("visibleNodeIds:", [...visibleNodeIds])
    console.log("node IDs:", nodes.map(n => n.nodeID), "as strings:", nodes.map(n => String(n.nodeID)))
    console.log("nodesToRender count:", nodesToRender.length)

    console.log("highlightedNodes:", highlightedNodes)

    return (
        <div className="graph-visualizer">

            {/* zoom controls */}
            <div className="zoom-controls">
                <button onClick={zoomOut}>-</button>
                <button onClick={resetView}>reset</button>
                <button onClick={zoomIn}>+</button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
            </div>

            <svg
                width="100%"
                viewBox={viewBox}
                style={{
                    overflow: "hidden",
                    cursor: isDragging ? "grabbing" : "grab",
                    height: "320px",
                    display: "block"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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
                {edgesToRender.map((edge, i) => {
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
                {nodesToRender.map(node => {
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
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fill: text,
                                    fontFamily: "monospace",
                                    userSelect: "none",
                                    pointerEvents: "none" // prevents text from interfering with drag events on the SVG
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