import { useState } from "react"

function InfoPanel() {
    const [open, setOpen] = useState(false) // closed by default

    return (
        <>
            {/* toggle */}
            <button
                className="info-toggle"
                onClick={() => setOpen(o => !o)}
                title="About this project"
            >
                i
            </button>

            {!open && (
                <span className="info-hint" onClick={() => setOpen(true)}>
                    click me!
                </span>
            )}

            {/* panel */}
            <div className={`info-panel ${open ? "open" : ""}`}>
                <button className="info-close" onClick={() => setOpen(false)}>✕</button>

                <h2>Algorithm Visualizer <span className="info-version">v0.90</span></h2>

                <p className="info-blurb">
                    Designed to educate on classic algorithms, built to explore functional programming.
                    The backend is written entirely in Haskell, purely functional and self-taught. Made by Ethan Gat.
                </p>

                <div className="info-section">
                    <h3>Stack</h3>
                    <ul>
                        <li><span className="info-tag">Haskell</span> backend logic + step trace generation</li>
                        <li><span className="info-tag">Servant</span> type-safe HTTP API</li>
                        <li><span className="info-tag">React</span> frontend</li>
                        <li><span className="info-tag">Framer Motion</span> animations</li>
                        <li><span className="info-tag">Vercel</span> hosting</li>
                    </ul>
                </div>

                <div className="info-section">
                    <h3>Links</h3>
                    <div className="info-links">
                        <a href="https://github.com/Anonymoose725/algo-visualizer" target="_blank" rel="noreferrer">
                            GitHub — Backend
                        </a>
                        <a href="https://github.com/Anonymoose725/algo-visualizer-frontend" target="_blank" rel="noreferrer">
                            GitHub — Frontend
                        </a>
                        <a href="https://linkedin.com/in/ethan-gat" target="_blank" rel="noreferrer">
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}

export default InfoPanel