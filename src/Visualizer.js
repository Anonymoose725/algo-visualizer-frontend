import { motion } from "framer-motion"

function Visualizer({ step, isComplete }) {
    if (!step) { // gaurd against empty input
        return (
            <div className="visualizer-empty">
                Enter an array and click Visualize
            </div>
        )
    }

    const { currentState, comparing } = step
    const maxValue = Math.max(...currentState) // shorthand like list comprehensions in haskell : 'spread operator'

    // find indices of two elements being compared at step
    const comparedIndices = getComparedIndices(currentState, comparing)

    function getBarColour(index) {
        if (isComplete) return "green"
        if (comparedIndices.includes(index)) return "red"
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

        </div>
    )
}

// logic
function getComparedIndices(state, comparing) {
    const [a, b] = comparing
    const indices = []

    // arrow 1
    for (let i = 0; i < state.length; i++) {
        if (state[i] === a && !indices.includes(i)) {
            // break and avoid duplicates, match values only once
            indices.push(i)
            break
        }
    }

    // arrow 2
    for (let i = 0; i < state.length; i++) {
        if (state[i] === b && !indices.includes(i)) {
            indices.push(i)
            break
        }
    }

    return indices
}

export default Visualizer