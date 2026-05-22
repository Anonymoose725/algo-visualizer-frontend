import { useState, useRef } from "react"

const CANVAS_WIDTH = /*680*/820
const CANVAS_HEIGHT = /*450*/430
const NODE_RADIUS = 22
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function generateNextLabel(nodes) {
    const used = new Set(nodes.map(n => n.label))
    return LABELS.split("").find(l => !used.has(l)) ?? "?"
}

// node is the full node object with .label (string) and .id (int)
// highlightedNodes contains label strings
function getNodeColor(node, selectedNode, dijkstraSource, dijkstraResult, dfsSource, dfsResult, currentStepIndex) {
    // dijkstra source handle
    if (dijkstraResult && dijkstraSource === node.id) {
        return { fill: "#E8893C", stroke: "#B05510", text: "#ffffff" }
    }
    // dfs source handle
    if (dfsResult && dfsSource === node.id) {
        return { fill: "#E8893C", stroke: "#B05510", text: "#ffffff" }
    }

    const curResult = dijkstraResult || dfsResult

    if (curResult) {
        const step = curResult.steps[currentStepIndex]
        if (step) {
            const highlighted = step.highlightedNodes ?? []
            const idx = highlighted.indexOf(node.label)  // label comparison
            if (idx !== -1) {
                if (idx === highlighted.length - 1)
                    return { fill: "#EAF3DE", stroke: "#3B6D11", text: "#3B6D11" }
                return { fill: "#E6F1FB", stroke: "#185FA5", text: "#185FA5" }
            }
        }
        return { fill: "rgb(31,75,104)", stroke: "rgb(21,55,80)", text: "#ffffff" }
    }
    if (selectedNode === node.id) {
        return { fill: "#F0C040", stroke: "#B08000", text: "#1a1a1a" }
    }
    return { fill: "rgb(31,75,104)", stroke: "rgb(21,55,80)", text: "#ffffff" }
}

function getEdgeColor(edge, gnodes, dijkstraResult, dfsResult, currentStepIndex) {
    const curResult = dijkstraResult || dfsResult
    if (!curResult) return "#8A7F6E"
    const step = curResult.steps[currentStepIndex]
    if (!step) return "#8A7F6E"

    const highlighted = step.highlightedEdges ?? []
    const fromNode = gnodes.find(n => n.id === edge.from)
    const toNode = gnodes.find(n => n.id === edge.to)

    if (!fromNode || !toNode) return "#8A7F6E"
    const isHighlighted = highlighted.some(([f, t]) =>
        f === fromNode.label && t === toNode.label
    )

    return isHighlighted ? "#185FA5" : "#8A7F6E"
}

function edgeMidpoint(x1, y1, x2, y2) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 } // find midpoint of edge in canvas for weight label and delete spot
}

function edgeEndpoints(x1, y1, x2, y2, r, offset = 0) { // offset for two edges between same nodes
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt((dx * dx) + (dy * dy))

    if (dist === 0) {
        return { x1, y1, x2, y2 }
    }

    const ux = dx / dist // unit normalize
    const uy = dy / dist

    // perpendicular unit vectors
    const px = -uy
    const py = ux
    return {
        x1: x1 + ux * r + px * offset, // px * offset = 0 if offset = 0
        y1: y1 + uy * r + py * offset,
        x2: x2 - ux * r + px * offset,
        y2: y2 - uy * r + py * offset
    }
}

const MODE_HINTS = {
    addNode: "Click canvas to place a node. Drag existing nodes to reposition.",
    addEdge: "Click a source node, then a destination to create an edge.",
    delete: "Click an existing edge or node to delete it.",
    dijkstra: "Click a source node to run Dijkstra's Shortest Path algorithm.",
    dfs: "Click a source node to run depth-first search traversal"
}


function GraphBuilder({ onGraphReady }) {
    const [gnodes, setGnodes] = useState([])
    const [gedges, setGedges] = useState([])

    const [graphMode, setGraphMode] = useState("addNode")
    const [selectedNode, setSelectedNode] = useState(null)
    const [pendingEdge, setPendingEdge] = useState(null)

    const [dijkstraSource, setDijkstraSource] = useState(null)
    const [dijkstraResult, setDijkstraResult] = useState(null)

    const [dfsSource, setDfsSource] = useState(null)
    const [dfsResult, setDfsResult] = useState(null)

    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    //const [isPlaying, setIsPlaying] = useState(false)
    const [error, setError] = useState("")

    // references for SVG comps
    const dragging = useRef(null) // dragging = { nodeID, offsetX, offsetY }
    const svgRef = useRef(null)
    //const weightInput = useRef(null)
    const nextID = useRef(0)

    function svgCoordsConvert(e) { // mouse event => svg coordinates
        const rect = svgRef.current.getBoundingClientRect() // retrieves size of svg and position relative to viewport
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function handleCanvasClick(e) {
        if (graphMode !== "addNode") return // only interactable when in add mode
        if (dragging.current) return // dont want to place node at the end of dragging action (release of click)

        const { x, y } = svgCoordsConvert(e) // mouse click relative to svg canvas (from top-left)

        const nodeHit = gnodes.find(n => Math.sqrt((n.x - x) * (n.x - x) + (n.y - y) * (n.y - y)) < NODE_RADIUS)
        if (nodeHit) return // dont place nodes where ones already exist

        const label = generateNextLabel(gnodes)
        if (label === "?") {
            setError("Reached max 26 nodes")
            return
        }
        setError("")
        setGnodes(ns => [...ns, { id: nextID.current++, label, x, y }]) // add node!
    }

    function handleNodeClick(e, node) {
        e.stopPropagation() // code doesnt run higher in DOM
        setError("")

        if (graphMode === "delete") {
            setGnodes(ns => ns.filter(n => n.id !== node.id)) // all except our selected node
            setGedges(es => es.filter(e => e.from !== node.id && e.to !== node.id)) // if selected node is to or from any edge, delete the edge
            if (selectedNode === node.id) {
                setSelectedNode(null)
            }
            return
        }

        if (graphMode === "addEdge") {
            if (selectedNode === null) {
                setSelectedNode(node.id) // default
            }
            else if (selectedNode === node.id) {
                setSelectedNode(null) // deselect
            }
            else {
                // check if the edge already exists, because we don't want multiple
                const exists = gedges.find(e => e.from === selectedNode && e.to === node.id)
                if (exists) {
                    setError("Edge already exists!")
                    setSelectedNode(null) // deselect
                    return
                }

                // get positions for the weight query popup, CAD style
                const fromNode = gnodes.find(n => n.id === selectedNode)
                const mid = edgeMidpoint(fromNode.x, fromNode.y, node.x, node.y)
                setPendingEdge({
                    from: selectedNode,
                    to: node.id,
                    x: mid.x,
                    y: mid.y
                })
                setSelectedNode(null) // deselect after edge generated
            }
            return
        }

        // not in add edge mode, not in delete mode, check if we're running
        if (graphMode === "dijkstra") {
            runDijkstra(node.id)
            return
        }

        if (graphMode === "dfs") {
            runDFS(node.id)
            return
        }
    }

    function handleEdgeClick(e, edge) {
        e.stopPropagation()
        if (graphMode === "delete") {
            setGedges(es => es.filter(edg => edg.id !== edge.id))
        }
    }

    function confirmEdgeWeight(w) {
        const weight = parseInt(w)
        if (isNaN(weight) || weight <= 0) { // if is not a number or is <=0 (dijkstra's doesnt work)
            setError("Weight must be non-zero positive")
            return
        }
        if (!pendingEdge) return // null guard

        setGedges(es => [...es, {
            id: nextID.current++,
            from: pendingEdge.from,
            to: pendingEdge.to,
            weight: weight
        }])

        setPendingEdge(null) // confirmed, no longer pending
        setError("")
    }

    function cancelPendingEdge() {
        setPendingEdge(null)
    }

    // handle dragging, after a first click

    function handleNodeMouseDown(e, node) {
        if (graphMode !== "addNode") return // disallow

        e.stopPropagation()
        const { x, y } = svgCoordsConvert(e)
        dragging.current = {
            nodeID: node.id,
            offsetX: x - node.x,
            offsetY: y - node.y
        }
    }

    function handleMouseMove(e) {
        const drag = dragging.current
        if (!drag) return

        const { x, y } = svgCoordsConvert(e)
        setGnodes(ns => {
            // verify the node still exists before mapping it, null guard
            const nodeExists = ns.some(n => n.id === drag.nodeID)
            if (!nodeExists) {
                dragging.current = null
                return ns
            }
            return ns.map(n =>
                n.id === drag.nodeID ? { ...n, x: x - drag.offsetX, y: y - drag.offsetY } : n
            )
        })
    }

    function handleMouseUp() {
        dragging.current = null // release
    }

    async function runDijkstra(sourceId) { // async to wait for backend
        if (gnodes.length < 2) {
            setError("Please add at least 2 nodes to run Dijkstra's!") // early exit, result is 0
            return
        }
        if (gedges.length === 0) {
            setError("Please add at least 1 edge to run Dijkstra's!") // early exit, result ambiguous
        }

        setDijkstraResult(null)
        setDijkstraSource(sourceId)
        setCurrentStepIndex(0)

        // build adjacency list for backend, like in BST
        const sourceLabel = gnodes.find(n => n.id === sourceId).label
        const edgeList = gedges.map(e => {
            const from = gnodes.find(n => n.id === e.from).label
            const to = gnodes.find(n => n.id === e.to).label
            return `${from},${to},${e.weight}`
        }).join(";") // seperate by semicolons e.g. (1, 2, 10);(2,1,5) => {edge 1->2 weight 10, edge 2->1 weight 5}

        const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080"

        try {
            const response = await fetch(`${BASE_URL}/graph/dijkstra?edges=${encodeURIComponent(edgeList)}&source=${sourceLabel}`)
            // call backend! encode so ; and , arent lost, should be decoded by servant automatically
            if (!response.ok) {
                throw new Error("Backend err") // catch
            }
            const steps = await response.json()
            setDijkstraResult(steps)
            setCurrentStepIndex(0)
            setError("")

        } catch (err) {
            await loadDijkstraDemo()
            setError("Backend unavailable — showing demo graph")
        }
    }

    async function runDFS(sourceId) {
        if (gnodes.length < 1) {
            setError("Please  add at least 1 node to run DFS")
        }

        setDfsResult(null)
        setDfsSource(sourceId)
        setCurrentStepIndex(0)

        // adjacency list for backend
        const sourceLabel = gnodes.find(n => n.id === sourceId).label
        const edgeList = gedges.map(e => {
            const from = gnodes.find(n => n.id === e.from).label
            const to = gnodes.find(n => n.id === e.to).label
            return `${from},${to},${e.weight}`
        }).join(";")

        const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080"

        try {
            const response = await fetch(`${BASE_URL}/graph/dfs?edges=${encodeURIComponent(edgeList)}&source=${sourceLabel}`)
            if (!response.ok) {
                throw new Error("Backend err")
            }
            const steps = await response.json()
            setDfsResult(steps)
            setCurrentStepIndex(0)
            setError("")
        } catch (err) {
            await loadDfsDemo()
            setError("Backend unavailable - showing demo graph")
        }
    }

    function switchMode(m) {
        setGraphMode(m)
        setSelectedNode(null)
        setPendingEdge(null)
        setDijkstraResult(null)
        setDijkstraSource(null)
        setDfsResult(null)
        setDfsSource(null)
        setError("")
    }

    function clearCanvas() {
        setGnodes([])
        setGedges([])
        switchMode("addNode") // do all the standard resetting above
        nextID.current = 0
    }

    const totalSteps = graphMode === "dijkstra"
        ? dijkstraResult?.steps?.length ?? 0
        : dfsResult?.steps?.length ?? 0


    async function loadDijkstraDemo() {
        const { demoData } = await import("./demo/demoData")
        const demo = demoData["dijkstra"]
        if (!demo) return

        const demoResponse = demo.response
        const n = demoResponse.nodes.length
        const cx = CANVAS_WIDTH / 2
        const cy = CANVAS_HEIGHT / 2
        const radius = 150

        const demoNodes = demoResponse.nodes.map((node, i) => ({
            id: i,
            label: node.nodeLabel,
            x: cx + radius * Math.cos((2 * Math.PI * i) / n),
            y: cy + radius * Math.sin((2 * Math.PI * i) / n)
        }))

        const demoEdges = demoResponse.edges.map((e, i) => ({
            id: i + 100,
            from: e.fromNode,
            to: e.toNode,
            weight: e.weight
        }))

        setGnodes(demoNodes)
        setGedges(demoEdges)
        setDijkstraResult(demoResponse)
        setDijkstraSource(demoNodes[0].id)  // source = first node (A)
        setCurrentStepIndex(0)
        setError("")
        setGraphMode("dijkstra")
    }

    async function loadDfsDemo() { // UPDATE WITH DIFFERENT DEMO DATA.
        const { demoData } = await import("./demo/demoData")
        const demo = demoData["dfs"]
        if (!demo) return

        const demoResponse = demo.response
        const n = demoResponse.nodes.length
        const cx = CANVAS_WIDTH / 2
        const cy = CANVAS_HEIGHT / 2
        const radius = 150

        const demoNodes = demoResponse.nodes.map((node, i) => ({
            id: i,
            label: node.nodeLabel,
            x: cx + radius * Math.cos((2 * Math.PI * i) / n),
            y: cy + radius * Math.sin((2 * Math.PI * i) / n)
        }))

        const demoEdges = demoResponse.edges.map((e, i) => ({
            id: i + 100,
            from: e.fromNode,
            to: e.toNode,
            weight: e.weight
        }))

        setGnodes(demoNodes)
        setGedges(demoEdges)
        setDfsResult(demoResponse)
        setDfsSource(demoNodes[0].id)
        setCurrentStepIndex(0)
        setError("")
        setGraphMode("dfs")
    }

    return (
        <div className="graph-builder">
            {/* mode menu */}
            <div className="graph-toolbar">
                <div className="algorithm-picker">
                    {["addNode", "addEdge", "delete", "dijkstra", "dfs"].map(m => (
                        <button
                            key={m}
                            className={graphMode === m ? "active" : ""}
                            onClick={() => switchMode(m)}
                        >
                            {m === "addNode" ? "Add Node"
                                : m === "addEdge" ? "Add Edge"
                                    : m === "delete" ? "Delete"
                                        : m === "dijkstra" ? "Run Dijkstra's"
                                            : "Run DFS"}
                        </button>
                    ))}
                </div>
            </div>
            <div className="graph-toolbar">
                <button className="graph-clear" onClick={clearCanvas}>Clear</button>
                <button className="graph-demo" onClick={loadDijkstraDemo}>Load Dijkstra's demo</button>
                <button className="graph-demo" onClick={loadDfsDemo}>Load DFS demo</button>
            </div>
            {/* hints */}
            <p className="graph-hint">Hint: {MODE_HINTS[graphMode]}</p>

            {error && <p className="error">{error}</p>}

            {/* canvas svg */}
            <svg
                ref={svgRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="graph-canvas"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                    <marker
                        id="graphbuild-arrow"
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
                            stroke="#8A7F6E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                    <marker
                        id="graphbuild-arrow-blue"
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
                            stroke="#185FA5"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                </defs>

                {/* edges */}
                {gedges.map(edge => {
                    const from = gnodes.find(n => n.id === edge.from)
                    const to = gnodes.find(n => n.id === edge.to)
                    if (!from || !to) return null

                    // check if there is a forward and a reverse edge
                    const hasReverse = gedges.some(e => e.from === edge.to && e.to === edge.from)
                    const offset = hasReverse ? 8 : 0 // pad if there are two edges

                    const ep = edgeEndpoints(from.x, from.y, to.x, to.y, NODE_RADIUS, offset)

                    const dx = to.x - from.x
                    const dy = to.y - from.y
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1
                    const px = -dy / dist  // perpendicular x
                    const py = dx / dist  // perpendicular y

                    const mid = offset === 0
                        ? edgeMidpoint(from.x, from.y, to.x, to.y) // calculate traditionally if there is no offset
                        : { // offset midpoints with perpendicular comps
                            x: (from.x + to.x) / 2 + px * offset,
                            y: (from.y + to.y) / 2 + py * offset
                        }
                    const color = getEdgeColor(edge, gnodes, dijkstraResult, dfsResult, currentStepIndex)
                    const markerId = color === "#185FA5" ? "graphbuild-arrow-blue" : "graphbuild-arrow"
                    return (
                        <g key={edge.id} onClick={e => handleEdgeClick(e, edge)}
                            style={{ cursor: graphMode === "delete" ? "pointer" : "default" }}>
                            {/* make invisible thick line for clicking on */}
                            <line
                                x1={ep.x1} y1={ep.y1} x2={ep.x2} y2={ep.y2}
                                stroke="transparent" strokeWidth="12"
                            />
                            <line
                                x1={ep.x1} y1={ep.y1} x2={ep.x2} y2={ep.y2}
                                stroke={color} strokeWidth="1.5"
                                markerEnd={`url(#${markerId})`}
                                style={{ transition: "stroke 0.3s" }}
                            />
                            {/* weight label */}
                            <rect
                                x={mid.x - 10} y={mid.y - 10}
                                width="20" height="18" rx="3"
                                fill="var(--primary-offwhite)"
                            />
                            <text
                                x={mid.x} y={mid.y + 4}
                                textAnchor="middle"
                                style={{
                                    fontSize: "11px",
                                    fill: "#555",
                                    fontFamily: "monospace",
                                    userSelect: "none"
                                }}
                            >
                                {edge.weight}
                            </text>
                        </g>

                    )
                })}

                {/* nodes */}
                {gnodes.map(node => {
                    const { fill, stroke, text } = getNodeColor(node, selectedNode, dijkstraSource, dijkstraResult, dfsSource, dfsResult, currentStepIndex)
                    return (
                        <g
                            key={node.id}
                            onClick={e => handleNodeClick(e, node)}
                            onMouseDown={e => handleNodeMouseDown(e, node)}
                            style={{ cursor: graphMode === "addNode" ? "grab" : "pointer" }}
                        >
                            <circle
                                cx={node.x} cy={node.y} r={NODE_RADIUS}
                                fill={fill} stroke={stroke} strokeWidth="2"
                                style={{ transition: "fill 0.3s, stroke 0.3s" }}
                            />
                            <text
                                x={node.x} y={node.y}
                                textAnchor="middle" dominantBaseline="central"
                                style={{
                                    fontSize: "14px", fontWeight: "600",
                                    fill: text, fontFamily: "monospace",
                                    userSelect: "none", pointerEvents: "none"
                                }}
                            >
                                {node.label}
                            </text>

                            {/* current shortest computed distances. note, only render on dijkstraResult */}
                            {dijkstraResult && (() => { // IIFE = immediately invoked function expression
                                const step = dijkstraResult.steps[currentStepIndex]
                                if (!step) return null
                                const distEntry = step.distances?.find(([label]) => label === node.label)
                                const dist = distEntry ? distEntry[1] : null
                                const distText = dist === null ? "∞" : `δ=${dist}` // delta = distance from origin
                                const boxWidth = distText.length * 7 + 8 // 7px per char, 8px padding
                                return ( // recall <g> is an SVG element, like a <div> in html but for SVGs
                                    <g>
                                        <rect // background for clarity
                                            x={node.x - boxWidth / 2}
                                            y={node.y - NODE_RADIUS - 20}
                                            width={boxWidth}
                                            height={16}
                                            rx="3"
                                            fill="var(--primary-offwhite)"
                                            stroke="var(--primary-blue)"
                                            strokeWidth="0.5"
                                            opacity="0.9"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y - NODE_RADIUS - 8}
                                            textAnchor="middle"
                                            style={{
                                                fontSize: "11px",
                                                fill: "var(--primary-blue)",
                                                fontFamily: "monospace",
                                                userSelect: "none",
                                                pointerEvents: "none"
                                            }}
                                        >
                                            {dist === null ? "∞" : dist}
                                        </text>
                                    </g>
                                )
                            })()}
                        </g>
                    )
                })}

                {/* pending edge preview */}
                {selectedNode !== null && graphMode === "addEdge" && (() => {
                    const from = gnodes.find(n => n.id === selectedNode)
                    if (!from) return null
                    return (
                        <circle
                            cx={from.x}
                            cy={from.y}
                            r={NODE_RADIUS + 4}
                            fill="none"
                            stroke="#F0C040"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />
                    )
                })()} {/* <-- immediately invoked function expression (IIFE) */}
            </svg>

            {/* weight input query */}
            {pendingEdge && (
                <WeightPopup
                    x={pendingEdge.x}
                    y={pendingEdge.y}
                    onConfirm={confirmEdgeWeight}
                    onCancel={cancelPendingEdge}
                />
            )}

            {/* algorithm step controls */}
            {(dijkstraResult || dfsResult) && (
                <GraphStepControls
                    currentStepIndex={currentStepIndex}
                    totalSteps={totalSteps}
                    onNext={() => setCurrentStepIndex(i => Math.min(i + 1, totalSteps - 1))}
                    onPrev={() => setCurrentStepIndex(i => Math.max(i - 1, 0))}
                    onFirst={() => setCurrentStepIndex(0)}
                    onLast={() => setCurrentStepIndex(totalSteps - 1)}
                    onScrub={setCurrentStepIndex}
                />
            )}
        </div>
    )
}

function WeightPopup({ x, y, onConfirm, onCancel }) {
    const [value, setValue] = useState("1") // we treat 1 as default weight. shortest path problem becomes trivial fewest edges

    function handleKeyDown(e) {
        if (e.key === "Enter") onConfirm(value)
        if (e.key === "Escape") onCancel()
    }

    return (
        <div className="weight-popup" style={{ left: `${x}px`, top: `${y + 20}px` }}>
            <span>Weight:</span>
            <input
                type="number"
                min="1"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
            />
            <button onClick={() => onConfirm(value)}>✓</button>
            <button onClick={onCancel}>✕</button>
        </div>
    )
}

function GraphStepControls({ currentStepIndex, totalSteps, onNext, onPrev, onFirst, onLast, onScrub }) {
    return (
        <div className="step-controls" style={{ marginTop: "16px" }}>
            <div className="step-buttons">
                <button onClick={onFirst} disabled={currentStepIndex === 0}>⏮</button>
                <button onClick={onPrev} disabled={currentStepIndex === 0}>◀</button>
                <button onClick={onNext} disabled={currentStepIndex === totalSteps - 1}>▶</button>
                <button onClick={onLast} disabled={currentStepIndex === totalSteps - 1}>⏭</button>
            </div>
            <input
                type="range" min={0} max={totalSteps - 1}
                value={currentStepIndex}
                onChange={e => onScrub(Number(e.target.value))}
            />
            <p className="step-counter">Step {currentStepIndex + 1} of {totalSteps}</p>
        </div>
    )
}


export default GraphBuilder