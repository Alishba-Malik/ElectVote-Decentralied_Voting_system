// src/pages/LeaderboardPanel.jsx

import React, { useEffect, useState } from "react";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
import styles from "../styles/bubble.module.css";
import "../styles/LeaderboardPanel.css";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const LeaderboardPanel = () => {
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionId, setElectionId] = useState(0);
  const [winner, setWinner] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const abi = await getAbi(contractAddress);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const voteContract = new Contract(contractAddress, abi, signer);
      setContract(voteContract);

      const eid = await voteContract.electionId();
      setElectionId(Number(eid));

      updateCandidates(voteContract, Number(eid));
      const interval = setInterval(() => updateCandidates(voteContract, Number(eid)), 5000);

      return () => clearInterval(interval);
    };

    init();
  }, []);

  const updateCandidates = async (contract, electionId) => {
    try {
      const count = await contract.getActiveCandidateCount(electionId);
      const temp = [];

      for (let i = 1; i <= count; i++) {
        const [name, id, party, voteCount, , isDeleted] = await contract.getCandidate(electionId, i);
        if (!isDeleted) {
          temp.push({ id, name, party, voteCount: Number(voteCount) });
        }
      }

      temp.sort((a, b) => b.voteCount - a.voteCount);
      setCandidates(temp);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
  };

  const fetchWinner = async () => {
    try {
      const [name, party, voteCount] = await contract.getWinner(electionId);
      setWinner({ name, party, voteCount: Number(voteCount) });
      setOpenModal(true);
    } catch (err) {
      setWinner({ name: null });
      setOpenModal(true);
    }
  };

  return (
    <div className="leaderboard-wrapper">
            <h1 className="title-fit-text">
        {"Leaderboard".split("").map((char, i) => (
          <span key={i} className={styles.hoverText}>{char}</span>
        ))}
      </h1>
      <h3 className="election-id"> Election ID: {electionId}</h3>

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

      <button className="winner-btn" onClick={fetchWinner}>
         View Winner
      </button>

      {openModal && (
        <div className="drawer-overlay" onClick={() => setOpenModal(false)}>
          <div className="drawer-container winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle-wrapper">
              <div className="drawer-handle"></div>
            </div>
            <div className="drawer-content">
              {winner?.name ? (
                <>
                    <h2 className="modal-title"> {"Winner".split("").map((char, i) => (
                    <span key={i} className={styles.hoverText}>{char}</span>
                    ))}
                  </h2>
                  <p className="modal-desc">Candidate:</p>
                  <h3>{winner.name}</h3>
                  <p>Party: {winner.party}</p>
                  <p>Total Votes: {winner.voteCount}</p>
                </>
              ) : (
                <>
                  <h2 className="modal-title">No Winner Yet </h2>
                  <p className="modal-desc">Voting might still be active or no votes cast.</p>
                </>
              )}
              <button className="admin-submit-btn" onClick={() => setOpenModal(false)}>
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
