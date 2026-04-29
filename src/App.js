import { useState } from "react"
import AlgorithmPicker from "./AlgorithmPicker"
import ArrayInput from "./ArrayInput"
import Visualizer from "./Visualizer"
import StepControls from "./StepControls"

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

    function handleNext() {
        setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1)) // increment and bound values to avoid oob
    }

    function handlePrev() {
        setCurrentStepIndex((i) => Math.max(i - 1, 0)) // index 0 = steps[0] ^^ bound values
    }

    const isComplete = steps.length > 0 && currentStepIndex === steps.length - 1 // at end of steps

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
            <StepControls
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onNext={handleNext}
                onPrev={handlePrev}
                onFirst={() => setCurrentStepIndex(0)}
                onLast={() => setCurrentStepIndex(steps.length - 1)}
                onScrub={setCurrentStepIndex}
            />
        </div>
    )
}

export default App