// actions
// |<< jump to first step
// |< last step
// > or || pause and play
// >| next step
// >>| jump to last step
// slider to scrub to any step
// step counter

// we make use of the useEffect hook to create a timer side effect while isPlaying

import { steps } from "framer-motion"
import { useEffect } from "react"

function StepControls({ currentStepIndex, totalSteps, isPlaying, onPlay, onPause, onNext, onPrev, onFirst, onLast, onScrub }) {

    useEffect(() => {
        if (!isPlaying) return // nothing to do
        if (currentStepIndex >= totalSteps - 1) { // reach end
            onPause()
            return
        }

        const timer = setInterval(() => {
            onNext()
        }, 500)

        return () => clearInterval(timer) // cleanup
    }, [isPlaying, currentStepIndex, totalSteps, onNext, onPause]) // dependency array

    if (totalSteps === 0) {
        return null // hide component unless there are steps to visualize!
    }

    return (
        <div className="step-controls">
            <div className="step-buttons">
                <button onClick={onFirst} disabled={currentStepIndex === 0}>⏮</button>
                <button onClick={onPrev} disabled={currentStepIndex === 0}>◀</button>
                <button onClick={isPlaying ? onPause : onPlay}
                    disabled={currentStepIndex === totalSteps - 1 && !isPlaying}>
                    {isPlaying ? "⏸" : "►"}
                </button>
                <button onClick={onNext} disabled={currentStepIndex === totalSteps - 1}>►</button>
                <button onClick={onLast} disabled={currentStepIndex === totalSteps - 1}>⏭</button>
            </div>

            <input
                type="range"
                min={0}
                max={totalSteps - 1}
                value={currentStepIndex}
                onChange={(e) => onScrub(Number(e.target.value))}
            />

            <p className="step-counter">
                Step {currentStepIndex + 1} of {totalSteps}
            </p>
        </div>
    )
}

export default StepControls