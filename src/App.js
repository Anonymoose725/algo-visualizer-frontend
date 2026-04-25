import { useState } from "react"

function App() {
    const [algorithm, setAlgorithm] = useState("bubble")
    const [steps, setSteps] = useState([])
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)

    return (
        <div className="app">
            <h1>Algorithm Visualizer</h1>
        </div>
    )
}

export default App