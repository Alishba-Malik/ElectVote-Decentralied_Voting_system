import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
import styles from "../styles/bubble.module.css";
import "../styles/PublicPanel.css";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const PublicPanel = () => {
  const [activeTab, setActiveTab] = useState("Candidates");
  const [cursor, setCursor] = useState({ left: 0, width: 0, opacity: 0 });
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [electionId, setElectionId] = useState(0);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [user, setUser] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const abi = await getAbi(contractAddress);
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddr = await signer.getAddress();
        setUser(userAddr);

        const voteContract = new Contract(contractAddress, abi, signer);
        setContract(voteContract);

        const eid = await voteContract.electionId();
        setElectionId(Number(eid));

        const [start, end] = await voteContract.getDates(eid);
        const voted = await voteContract.checkVote(eid);
        const eData = await voteContract.elections(eid);

        setStartTime(Number(start));
        setEndTime(Number(end));
        setIsPaused(eData.isPaused);
        setHasVoted(voted);

        await fetchCandidates(voteContract, Number(eid));

        setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
      } catch (err) {
        console.error("Init Error:", err);
      }
    };

    init();
  }, []);

  const fetchCandidates = async (contract, eid) => {
    try {
      const count = await contract.getActiveCandidateCount(eid);
      let total = 0;
      const temp = [];

      for (let i = 1; i <= count; i++) {
        const [name, id, party, voteCount, uri, isDeleted] = await contract.getCandidate(eid, i);
        if (!isDeleted) {
          const vc = Number(voteCount);
          total += vc;
          temp.push({ name, id: Number(id), party, voteCount: vc, uri });
        }
      }

      setCandidates(temp);
      setTotalVotes(total);
    } catch (err) {
      console.error("fetchCandidates failed:", err);
    }
  };

  const castVote = async (candidateId) => {
    if (!contract) return;
    try {
      await contract.vote(electionId, candidateId);
      setHasVoted(true);
      setVoteSuccess(true);
    } catch (err) {
      console.error("Vote failed:", err);
      setVoteSuccess(false);
    } finally {
      setShowDrawer(true);
    }
  };

  const canVote = !isPaused && currentTime >= startTime && currentTime <= endTime && !hasVoted;

  const formatCountdown = (timestamp) => {
    const seconds = Math.max(timestamp - currentTime, 0);
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const getStatus = () => {
    if (isPaused) return "⏸ Paused";
    if (currentTime < startTime) return " Upcoming";
    if (currentTime >= startTime && currentTime <= endTime) return " Ongoing";
    return " Ended";
  };

  const tabs = ["Candidates", "Vote Status", "Stats", "Voting Window"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Candidates":
        return candidates.length === 0 ? (
          <p>No candidates found.</p>
        ) : (
          <div className="card-grid">
            {candidates.map((c) => (
              <div className="candidate-card" key={c.id}>
                <h2>{c.name}</h2>
                <p>Party: {c.party}</p>
                {canVote && (
                  <button onClick={() => castVote(c.id)} disabled={hasVoted}>
                    {hasVoted ? "Voted" : "Vote"}
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      case "Vote Status":
        return (
          <div className="status-info">
            <p><strong> Wallet:</strong> <code>{user}</code></p>
            <p><strong> Election ID:</strong> {electionId}</p>
            <p><strong> Status:</strong> {hasVoted ? " You have voted" : " Not voted"}</p>
            <p><strong> Election:</strong> {getStatus()}</p>
          </div>
        );
      case "Stats":
        return (
          <div className="status-info">
            <h3> Total Votes Cast: {totalVotes}</h3>
            <div className="card-grid">
              {candidates.map((c) => (
                <div key={c.id} className="candidate-card">
                  <h2>{c.name}</h2>
                  <p>Party: {c.party}</p>
                  <p>Votes: {c.voteCount}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "Voting Window":
        return (
          <div className="status-info">
            <p> Voting starts: {new Date(startTime * 1000).toLocaleString()}</p>
            <p> Voting ends: {new Date(endTime * 1000).toLocaleString()}</p>
            <p> Current time: {new Date(currentTime * 1000).toLocaleString()}</p>
            <p> Countdown: <strong>{formatCountdown(endTime)}</strong></p>
            <p><strong>Status:</strong> {getStatus()}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="public-panel-wrapper">
        <h1 className="main-heading">
        {"Public Voting Panel".split("").map((char, i) => (
            <span key={i} className={styles.hoverText}>
            {char === " " ? "\u00A0" : char}
            </span>
        ))}
        </h1>

      <ul
        onMouseLeave={() => setCursor((pv) => ({ ...pv, opacity: 0 }))}
        className="tab-bar"
      >
        {tabs.map((label) => (
          <Tab
            key={label}
            label={label}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setCursor={setCursor}
          />
        ))}
        <Cursor position={cursor} />
      </ul>

      <div className="tab-content">{renderTabContent()}</div>

      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer-container winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle-wrapper">
              <div className="drawer-handle" />
            </div>
            <div className="drawer-content">
              <h2 className="modal-title">
                {voteSuccess ? " Vote Casted Successfully!" : " Vote Failed"}
              </h2>
              <p className="modal-desc">
                {voteSuccess ? "Thank you for participating." : "Something went wrong. Try again."}
              </p>
              <button className="admin-submit-btn" onClick={() => setShowDrawer(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Tab = ({ label, activeTab, setActiveTab, setCursor }) => {
  const ref = useRef(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setCursor({ left: ref.current.offsetLeft, width, opacity: 1 });
      }}
      onClick={() => setActiveTab(label)}
      className={`tab-item ${activeTab === label ? "active" : ""}`}
    >
      {label}
    </li>
  );
};

const Cursor = ({ position }) => {
  return (
    <motion.li
      animate={{ ...position }}
      className="tab-cursor"
    />
  );
};

export default PublicPanel;
