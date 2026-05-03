import { useState } from "react"
import { demoData } from "./demo/demoData"

function ArrayInput({ algorithm, onStepsLoaded }) {
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080" // env for hosting

    async function handleVisualize() { // async to pause and resume without hanging the webpage
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                // make an http request to haskell backend, just like curl but from js
                // await pauses execution until request is received
                `${BASE_URL}/sort/${algorithm}?input=${inputValue}`
            )
            if (!response.ok) { // response.ok true if http returns 200-299. if haskell returns 400 (missing input), throw this manually:
                throw new Error("Invalid Input - make sure numbers are entered seperated by commas ','")
            }

            const steps = await response.json() // wait to receieve steps from backend
            onStepsLoaded(steps)
        } catch (err) {
            const demo = demoData[algorithm]
            if (demo) {
                onStepsLoaded(demo.steps)
                setError("Backend unavailable, showing demo")
            }
            else {
                setError(err.message) // catch and throw error
            }
        } finally { // runs regardless, turn the loading state off
            setLoading(false)
        }
    }
    /*
        disabled = loading || !inputValue : disables the button when loading or if the input is empty, prevents false submission
        error && <...> : conditional rendering, if error is null, nothing renders. if error has a message, <p> renders
    */
    return (
        <div className="array-input">
            <input
                type="text"
                placeholder="1,2,3,4,5,6,7,8"
                value={inputValue}
                // when input changes, update inputValue state with new one
                // e = event object, e.target = input element, e.target.value = thing currently typed in
                onChange={(e) => setInputValue(e.target.value)}
            />
            <button onClick={handleVisualize} disabled={loading || !inputValue}>
                {loading ? "Loading..." : "Visualize"}
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    )
}

export default ArrayInput