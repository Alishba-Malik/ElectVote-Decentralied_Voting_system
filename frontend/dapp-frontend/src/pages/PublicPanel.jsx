import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
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
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [user, setUser] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const abi = await getAbi(contractAddress);
        console.log("✅ ABI fetched:", abi);

        if (!abi) return alert("❌ Failed to fetch ABI!");

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddr = await signer.getAddress();
        setUser(userAddr);

        const voteContract = new Contract(contractAddress, abi, signer);
        setContract(voteContract);

        const paused = await voteContract.isPaused();
        const [start, end] = await voteContract.getDates();
        const voted = await voteContract.checkVote(); // 🔥 Fixed here

        console.log("Paused:", paused, "Start:", start.toString(), "End:", end.toString(), "Voted:", voted);

        setIsPaused(paused);
        setStartTime(Number(start));
        setEndTime(Number(end));
        setHasVoted(voted);

        await fetchCandidates(voteContract);
        setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
      } catch (err) {
        console.error("Init Error:", err);
      }
    };

    init();
  }, []);

  const fetchCandidates = async (contract) => {
    try {
      const count = await contract.countCandidates();
      console.log("Candidate count:", count.toString());

      const temp = [];
      let total = 0;

      for (let i = 1; i <= count; i++) { // 🔥 contract indexing starts at 1
        const [name, id, party, voteCount, uri] = await contract.getCandidate(i);
        console.log(`Candidate ${i}:`, { name, id: id.toString(), party, voteCount: voteCount.toString() });

        const countNum = Number(voteCount);
        total += countNum;
        temp.push({ name, id: Number(id), party, voteCount: countNum, uri });
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
      await contract.vote(candidateId);
      alert("✅ Vote cast successfully!");
      setHasVoted(true);
    } catch (err) {
      console.error("Vote failed:", err);
      alert("❌ Vote failed.");
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
                <button disabled={!canVote} onClick={() => castVote(c.id)}>
                  {hasVoted ? "Voted" : canVote ? "Vote" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        );
      case "Vote Status":
        return (
          <div className="status-info">
            <p><strong>👛 Wallet:</strong> <code>{user}</code></p>
            <p><strong>🗳️ Status:</strong> {hasVoted ? "✅ You have voted" : "❌ You have not voted"}</p>
            <p><strong>🚦 Voting is currently:</strong> {isPaused ? "⏸️ Paused" : "🟢 Active"}</p>
          </div>
        );
      case "Stats":
        return (
          <div className="status-info">
            <h3>📊 Total Votes Cast: {totalVotes}</h3>
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
            <p>🕒 Voting starts: {new Date(startTime * 1000).toLocaleString()}</p>
            <p>🕒 Voting ends: {new Date(endTime * 1000).toLocaleString()}</p>
            <p>🕐 Current time: {new Date(currentTime * 1000).toLocaleString()}</p>
            <div className="countdown">
              {currentTime < startTime && <p>⏳ Voting begins in: <span>{formatCountdown(startTime)}</span></p>}
              {currentTime >= startTime && currentTime <= endTime && <p>✅ Voting ends in: <span>{formatCountdown(endTime)}</span></p>}
              {currentTime > endTime && <p>⚠️ Voting has ended.</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="public-panel-wrapper">
      <h1 className="main-heading">🗳️ Public Voting Panel</h1>
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
