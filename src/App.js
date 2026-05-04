import { useState } from "react"
import AlgorithmPicker from "./AlgorithmPicker"
import ArrayInput from "./ArrayInput"
import Visualizer from "./Visualizer"
import StepControls from "./StepControls"
import GraphVisualizer from "./GraphVisualizer"
import ModePicker from "./ModePicker"
import BSTControls from "./BSTControls"

function App() {
    // const [curVal, setVal] = useState(initial_val)
    const [algorithm, setAlgorithm] = useState("bubble")
    const [steps, setSteps] = useState([])
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)

    // for selecting mode
    const [mode, setMode] = useState("sort") // sort | graph | tree | more later maybe
    const [bstMode, setBstMode] = useState("insert") // bst | more types later
    const [bstTarget, setBstTarget] = useState("")
    const [graphData, setGraphData] = useState(null)

    // error catching
    const [bstError, setBstError] = useState("")


    function handleStepsLoaded(newSteps) {
        setSteps(newSteps)      // store steps in state
        setCurrentStepIndex(0)  // reset step index
        setIsPlaying(false)     // paused by default
    }

    function handleNext() {
        const total = mode === "sort" ? steps.length : graphData?.steps?.length ?? 0
        setCurrentStepIndex((i) => Math.min(i + 1, total - 1)) // increment and bound values to avoid oob
    }

    function handlePrev() {
        setCurrentStepIndex((i) => Math.max(i - 1, 0)) // index 0 = steps[0] ^^ bound values
    }

    const isComplete = mode === "sort"
        ? steps.length > 0 && currentStepIndex === steps.length - 1 // at end of steps
        : graphData?.steps?.length > 0 && currentStepIndex === graphData.steps.length - 1

    function handleModeSwitch(m) {
        setMode(m)
        setSteps([])
        setGraphData(null)
        setCurrentStepIndex(0)
        setIsPlaying(false)
    }

    // for insertion sort - not so efficient...
    function getSortedBoundary(steps, index) {
        if (!steps.length) return -1;
        let maxRightIndex = 0;
        for (let i = 0; i <= index; i++) {
            const rightIndex = steps[i].comparingIndices[1]
            if (rightIndex > maxRightIndex) {
                maxRightIndex = rightIndex
            }
        }
        return maxRightIndex - 1
    }

    const sortedBoundary = algorithm === "insertion" // only do calculation if insertionsort selected
        ? getSortedBoundary(steps, currentStepIndex)
        : -1


    async function handleBstVisualize(inputStr) {

        // validate before fetching
        if (bstMode === "search" && !bstTarget) {
            setBstError("Please enter a target value to search for")
            return
        }
        setBstError("")

        const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080"

        let response
        try {
            let url
            if (bstMode === "insert") {
                url = `${BASE_URL}/tree/bst/insert?input=${inputStr}`
            }
            else if (bstMode === "search") {
                url = `${BASE_URL}/tree/bst/search?input=${inputStr}&target=${bstTarget}`
            }
            else {
                url = `${BASE_URL}/tree/bst?input=${inputStr}`
            }
            response = await fetch(url)

        } catch (err) {
            // backend unreachable, fall back to demo
            const { demoData } = await import("./demo/demoData")
            const demo = bstMode === "search"
                ? demoData["bst-search"]
                : demoData["bst-insert"]
            setGraphData(demo.response)
            setCurrentStepIndex(0)
            setBstError("")
            return
        }

        // backend responded, check status
        if (!response.ok) {
            setGraphData(null)
            if (bstMode === "search") {
                setBstError("Invalid input, check for duplicates or invalid target")
            }
            else {
                setBstError("Duplicate values are not supported")
            }
            return
        }

        setBstError("")
        const data = await response.json()
        setGraphData(data)
        setCurrentStepIndex(0)
        setIsPlaying(false)
    }

    const totalSteps = mode === "sort" ? steps.length : graphData?.steps?.length ?? 0


    return (
        <div className="app">
            <h1>Algorithm Visualizer</h1>

            <ModePicker
                mode={mode}
                onSelect={handleModeSwitch}
            />

            {mode === "sort" && (
                <>
                    <AlgorithmPicker
                        algorithm={algorithm}
                        onSelect={setAlgorithm}
                    />
                    <ArrayInput
                        algorithm={algorithm}
                        onStepsLoaded={handleStepsLoaded}
                    />
                    <Visualizer
                        step={steps[currentStepIndex]}
                        isComplete={isComplete}
                        algorithm={algorithm}
                        sortedBoundary={sortedBoundary}
                    />
                </>
            )}

            {mode === "tree" && (
                <>
                    {/* tree subtype picker */}
                    <div className="tree-subtype">
                        <button className="active">BST</button>
                    </div>

                    <BSTControls
                        bstMode={bstMode}
                        setBstMode={setBstMode}
                        bstTarget={bstTarget}
                        setBstTarget={setBstTarget}
                        onVisualize={handleBstVisualize}
                    />

                    {bstError && <p className="error">{bstError}</p>}
                    {!bstError && (
                        <GraphVisualizer
                            graphData={graphData}
                            currentStepIndex={currentStepIndex}
                            isComplete={isComplete}
                            bstMode={bstMode}
                        />
                    )}
                </>
            )}

            {mode === "graph" && (
                <div className="visualizer-empty">
                    Graph algorithms on the way, check back later!
                </div>
            )}

            <StepControls
                currentStepIndex={currentStepIndex}
                totalSteps={totalSteps}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onNext={handleNext}
                onPrev={handlePrev}
                onFirst={() => setCurrentStepIndex(0)}
                onLast={() => setCurrentStepIndex(totalSteps - 1)}
                onScrub={setCurrentStepIndex}
            />
        </div>
    )
}

export default App