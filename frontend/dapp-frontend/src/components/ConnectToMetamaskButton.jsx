import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "../styles/ConnectToMetamaskButton.css";
const ConnectToMetamaskButton = ({ onClick }) => {

  const btnRef = useRef(null);
  const spanRef = useRef(null);
  const intervalRef = useRef(null);
  const cursorRef = useRef(null);

  const FIXED_FOX = "🦊";
  const TARGET_TEXT = "Connect to MetaMask";

  const CYCLES_PER_LETTER = 2;
  const SHUFFLE_TIME = 50;
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  const [text, setText] = useState(TARGET_TEXT);


  const scramble = () => {
    let pos = 0;
    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split("").map((char, index) => {
        if (pos / CYCLES_PER_LETTER > index) return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join("");
      setText(scrambled);
      pos++;
      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
    }, SHUFFLE_TIME);
  };

  const stopScramble = () => {
    clearInterval(intervalRef.current || undefined);
    setText(TARGET_TEXT);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      const { width } = btnRef.current.getBoundingClientRect();
      const offset = e.offsetX;
      const left = `${(offset / width) * 100}%`;
      spanRef.current?.animate({ left }, { duration: 250, fill: "forwards" });
    };

    const handleMouseLeave = () => {
      spanRef.current?.animate({ left: "50%" }, { duration: 100, fill: "forwards" });
    };

    const btn = btnRef.current;
    if (btn) {
      btn.addEventListener("mousemove", handleMouseMove);
      btn.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (btn) {
        btn.removeEventListener("mousemove", handleMouseMove);
        btn.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.975 }}
        onMouseEnter={scramble}
        onMouseLeave={stopScramble}
        ref={btnRef}
        className="metamask-button"
      >
        <span className="text">
          <span className="fox">{FIXED_FOX}</span> {text}
        </span>
        <span ref={spanRef} className="spotlight" />
      </motion.button>

      {/* Transparent magnifying cursor */}

    </>
  );
};

export default ConnectToMetamaskButton;


  