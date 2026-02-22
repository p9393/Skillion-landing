"use client";

import { useEffect, useState } from "react";

const PHRASE = "Your discipline is your edge. Your edge is your capital.";

export default function AurionTypewriter() {
    const [displayed, setDisplayed] = useState("");
    const [cursor, setCursor] = useState(true);

    useEffect(() => {
        let i = 0;

        // Start typing after 600ms delay
        const startTimer = setTimeout(() => {
            const interval = setInterval(() => {
                i++;
                setDisplayed(PHRASE.slice(0, i));
                if (i >= PHRASE.length) {
                    clearInterval(interval);
                }
            }, 38);

            return () => clearInterval(interval);
        }, 600);

        // Blinking cursor
        const blink = setInterval(() => setCursor(c => !c), 550);

        return () => {
            clearTimeout(startTimer);
            clearInterval(blink);
        };
    }, []);

    return (
        <div className="font-mono text-sm text-cyan-300/80 leading-relaxed">
            <span className="text-white/25 mr-2">Aurion →</span>
            {displayed}
            <span
                className="inline-block w-[2px] h-4 bg-cyan-400 ml-0.5 align-middle"
                style={{ opacity: cursor ? 1 : 0, transition: "opacity 0.1s" }}
            />
        </div>
    );
}
