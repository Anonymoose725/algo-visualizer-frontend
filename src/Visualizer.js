import { motion } from "framer-motion"

function Visualizer({ step, isComplete, algorithm, sortedBoundary }) {
    if (!step) { // gaurd against empty input
        return (
            <div className="visualizer-empty">
                Enter an array and click Visualize
            </div>
        )
    }


    const { currentState, comparingIndices } = step
    const maxValue = Math.max(...currentState) // shorthand like list comprehensions in haskell : 'spread operator'

    // find indices of two elements being compared at step
    const comparedIndices = [comparingIndices[0], comparingIndices[1]]

    function getBarColour(index) {
        if (isComplete) return "green"
        if (comparedIndices.includes(index)) return "red"
        if (algorithm === "insertion" && index <= sortedBoundary) return "green"
        return "steelblue"
    }

    return (
        <div className="visualizer">

            {/* Bars - note this is a comment in react JSX to make it distinct from html */}
            <div className="bars">
                {currentState.map((value, index) => ( // map is as is in haskell : transform each element a->b
                    <div
                        key={index} // react requires a unique key prop on elements inside a map. here we use the array index
                        className="bar-col"
                    >
                        {/* <div
                            className="bar"
                            style={{ // inline styles in react jsx use double curly brace
                                height: `${(value / maxValue) * 200}px`,
                                backgroundColor: getBarColour(index)
                            }}
                        /> */}
                        <motion.div
                            className="bar"
                            initial={{
                                height: `${(value / maxValue) * 200}px`,
                                backgroundColor: getBarColour(index)
                            }}
                            animate={{
                                height: `${(value / maxValue) * 200}px`,
                                backgroundColor: getBarColour(index)
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                ))}
            </div>

            {/* Boxes */}
            <div className="boxes">
                {currentState.map((value, index) => (
                    <div
                        key={index}
                        className="box-col"
                    >
                        <div
                            className="box"
                            style={{
                                borderColor: getBarColour(index),
                                color: getBarColour(index)
                            }}
                        >
                            {value}
                        </div>
                        {/* arrow below box : points to compared-to entries */}
                        {comparedIndices.includes(index) && ( // conditional rendering : only render the arrows on compared-to elements
                            <div className="arrow">↑</div>
                        )}
                    </div>
                ))}
            </div>

            {/* partition brackets */}
            <div className="brackets">

                {algorithm === "merge" && step.partitionInfo && (
                    <>
                        <BracketBar
                            lo={step.partitionInfo.leftRange[0]}
                            hi={step.partitionInfo.rightRange[1]}
                            totalElements={currentState.length}
                            color="red"
                            label="left"
                        />
                        <BracketBar
                            lo={step.partitionInfo.leftRange[0]}
                            hi={step.partitionInfo.rightRange[1]}
                            totalElements={currentState.length}
                            color="steelblue"
                            label="right"
                        />
                    </>
                )}

                {algorithm === "insertion" && sortedBoundary >= 0 && (
                    <>
                        <BracketBar
                            lo={0}
                            hi={sortedBoundary}
                            totalElements={currentState.length}
                            color="green"
                            label="sorted"
                        />
                        <BracketBar
                            lo={sortedBoundary + 1}
                            hi={currentState.length - 1}
                            totalElements={currentState.length}
                            color="#888"
                            label="unsorted"
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function BracketBar({ lo, hi, totalElements, color, label }) {
    const BOX_WIDTH = 40
    const BOX_GAP = 4
    const left = lo * (BOX_WIDTH + BOX_GAP)
    const width = (hi - lo + 1) * (BOX_WIDTH + BOX_GAP) - BOX_GAP

    return (
        <div className="bracket-bar" style={{ marginLeft: `${left}px`, width: `$(width)px` }}>
            <div className="bracket-line" style={{ borderColor: color }}>
                <div className="left-bracket-tick" style={{ borderColor: color }} />
                <div className="right-bracket-tick" style={{ borderColor: color }} />
            </div>
            <span className="bracket-label" style={{ color }}>{label}</span>
        </div>
    )
}

export default Visualizer