import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConnectToMetamaskButton from "../components/ConnectToMetamaskButton";
import { motion } from "framer-motion";
import "../styles/Landing.css";
import styles from "../styles/bubble.module.css";
import "../App.css";

const Landing = () => {
  const navigate = useNavigate();


  useEffect(() => {
    const updateCursor = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateCursor);
    return () => window.removeEventListener("mousemove", updateCursor);
  }, []);

  const handleConnect = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        navigate("/dashboard");
      } catch (err) {
        console.error("Connection rejected", err);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use ElectVote.");
    }
  };

  return (
    <div className="landing-wrapper">
      <h1 className="title-fit-text">
        {"ElectVote".split("").map((char, i) => (
          <span key={i} className={styles.hoverText}>
            {char}
          </span>
        ))}
      </h1>

      <motion.p
        className="landing-tagline"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Revolutionizing voting with blockchain technology. Connect your wallet to get started!
      </motion.p>

      <motion.div
        onClick={handleConnect}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <ConnectToMetamaskButton />
      </motion.div>


    </div>
  );
};

export default Landing;