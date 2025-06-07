// File: src/pages/LeaderboardPanel.jsx
import React, { useEffect, useState } from "react";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
import Confetti from "react-confetti";
import styles from "../styles/bubble.module.css";
import "../styles/LeaderboardPanel.css";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const LeaderboardPanel = () => {
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  useEffect(() => {
    const fetchContractAndCandidates = async () => {
      const abi = await getAbi(contractAddress);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const voteContract = new Contract(contractAddress, abi, signer);
      setContract(voteContract);

      const interval = setInterval(() => updateCandidates(voteContract), 5000);
      updateCandidates(voteContract);
      fetchWinner(voteContract);

      return () => clearInterval(interval);
    };

    fetchContractAndCandidates();
  }, []);

  const updateCandidates = async (voteContract) => {
    try {
      const count = await voteContract.countCandidates();
      const temp = [];

      for (let i = 1; i <= count; i++) {
        const [name, id, party, voteCount] = await voteContract.getCandidate(i);
        temp.push({ id, name, party, voteCount: Number(voteCount) });
      }

      temp.sort((a, b) => b.voteCount - a.voteCount);
      setCandidates(temp);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const fetchWinner = async (voteContract) => {
    try {
      const [name, id, party, voteCount] = await voteContract.getWinner();
      setWinner({ name, id, party, voteCount: Number(voteCount) });
      setShowWinnerModal(true);
    } catch (err) {
      console.warn("Winner not yet determined or unavailable.");
    }
  };

  return (
    <div className="leaderboard-wrapper">
      <h1 className="title-fit-text">
        {"Leaderboard".split("").map((char, i) => (
          <span key={i} className={styles.hoverText}>{char}</span>
        ))}
      </h1>

      <div className="leaderboard-list">
        {candidates.map((c, idx) => (
          <div
            key={c.id}
            className={`leaderboard-card ${idx < 3 ? "top" : "regular"}`}
          >
            <div className="rank">#{idx + 1}</div>
            <div className="info">
              <h2>{c.name}</h2>
              <p>Party: {c.party}</p>
              <p>Votes: {c.voteCount}</p>
            </div>
          </div>
        ))}
      </div>

      {showWinnerModal && winner && (
        <div className="drawer-overlay" onClick={() => setShowWinnerModal(false)}>
          <Confetti />
          <div className="drawer-container winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-content">
              <h2 className="modal-title">🎉 Winner Announced!</h2>
              <p className="modal-desc">The winner is:</p>
              <h3>{winner.name}</h3>
              <p>Party: {winner.party}</p>
              <p>Total Votes: {winner.voteCount}</p>
              <button className="admin-submit-btn" onClick={() => setShowWinnerModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPanel;
