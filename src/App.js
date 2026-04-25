import { useState } from "react"
import AlgorithmPicker from "./AlgorithmPicker"
import ArrayInput from "./ArrayInput"
import Visualizer from "./Visualizer"

function App() {
    // const [curVal, setVal] = useState(initial_val)
    const [algorithm, setAlgorithm] = useState("bubble")
    const [steps, setSteps] = useState([])
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)

    function handleStepsLoaded(newSteps) {
        setSteps(newSteps)      // store steps in state
        setCurrentStepIndex(0)  // reset step index
        setIsPlaying(false)     // paused by default
    }

    const isComplete = steps.length > 0 && currentStepIndex === steps.length - 1 // true when at last step, if it exists 

    return (
        <div className="app">
            <h1>Algorithm Visualizer</h1>
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
            />
        </div>
    )
}

export default App