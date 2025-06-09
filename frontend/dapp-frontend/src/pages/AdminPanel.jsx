import React, { useEffect, useState } from "react";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
import "../styles/AdminPanel.css";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const AdminPanel = () => {
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [electionId, setElectionId] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [candidates, setCandidates] = useState([]);

  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidateURI, setCandidateURI] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [activeTab, setActiveTab] = useState("controls");
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const abi = await getAbi(contractAddress);
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const user = await signer.getAddress();
        const voteContract = new Contract(contractAddress, abi, signer);

        const owner = await voteContract.owner();
        setUserAddress(user);
        setOwnerAddress(owner);

        if (user.toLowerCase() === owner.toLowerCase()) {
          setAccessGranted(true);
          setContract(voteContract);

          const eid = await voteContract.electionId();
          const e = await voteContract.elections(eid);
          setElectionId(Number(eid));
          setIsPaused(e.isPaused);

          fetchCandidates(voteContract, eid);
        }
      } catch (err) {
        console.error("Admin init error:", err);
      }
    };

    init();
  }, []);

  const fetchCandidates = async (contract, eid) => {
    try {
      const count = await contract.getActiveCandidateCount(eid);
      const list = [];
      for (let i = 1; i <= count; i++) {
        const [name, id, party, voteCount, uri, isDeleted] = await contract.getCandidate(eid, i);
        if (!isDeleted) {
          list.push({ name, id: Number(id), party, voteCount: Number(voteCount), uri });
        }
      }
      setCandidates(list);
    } catch (err) {
      console.error("Candidate fetch error:", err);
    }
  };

  const addCandidate = async () => {
    try {
      await contract.addCandidate(electionId, candidateName, candidateParty, candidateURI);
      setCandidateName("");
      setCandidateParty("");
      setCandidateURI("");
      fetchCandidates(contract, electionId);
    } catch (err) {
      console.error("Add candidate error:", err);
    }
  };

  const deleteCandidate = async (id) => {
    try {
      await contract.deleteCandidate(electionId, id);
      fetchCandidates(contract, electionId);
    } catch (err) {
      console.error("Delete candidate error:", err);
    }
  };

  const setDates = async () => {
    try {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      const end = Math.floor(new Date(endDate).getTime() / 1000);
      await contract.setDates(start, end);
      const eid = await contract.electionId();
      setElectionId(Number(eid));
    } catch (err) {
      console.error("Set dates error:", err);
    }
  };

  const resetDates = async () => {
    try {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      const end = Math.floor(new Date(endDate).getTime() / 1000);
      await contract.resetDates(electionId, start, end);
    } catch (err) {
      console.error("Reset dates error:", err);
    }
  };

  const togglePause = async () => {
    try {
      await contract.togglePause(electionId);
      const e = await contract.elections(electionId);
      setIsPaused(e.isPaused);
    } catch (err) {
      console.error("Pause toggle failed:", err);
    }
  };

  const getWinner = async () => {
    try {
      const [name, party, voteCount] = await contract.getWinner(electionId);
      setWinner({ name, party, voteCount: Number(voteCount) });
      setShowWinner(true);
    } catch (err) {
      console.warn("Winner fetch error:", err);
    }
  };

  if (!contract) {
    return <div className="admin-loading-screen fade-in"><div className="loading-spinner"></div><h1>Verifying Admin Access</h1></div>;
  }

  if (!accessGranted) {
    return (
      <div className="admin-wrapper">
        <div className="admin-denied">
          <h2>Access Denied</h2>
          <div className="address-info">
            <p><strong>Connected:</strong> <code>{userAddress}</code></p>
            <p><strong>Owner:</strong> <code>{ownerAddress}</code></p>
          </div>
          <p>This panel is only accessible to the contract owner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div style={{ padding: "2rem", color: "#fff" }}>
          <h1>Welcome to the Admin Dashboard</h1>
          <h3>Election ID: {electionId}</h3>
        </div>
        <div className={`status-badge ${isPaused ? "paused" : "active"}`}>
          {isPaused ? "Voting Paused" : "Voting Active"}
        </div>
      </div>

      <div className="tab-buttons">
        <button onClick={() => setActiveTab("controls")} className={activeTab === "controls" ? "active-tab" : ""}>Voting Controls</button>
        <button onClick={() => setActiveTab("add")} className={activeTab === "add" ? "active-tab" : ""}>Add Candidate</button>
        <button onClick={() => setActiveTab("dates")} className={activeTab === "dates" ? "active-tab" : ""}>Voting Period</button>
        <button onClick={() => setActiveTab("list")} className={activeTab === "list" ? "active-tab" : ""}>Candidates</button>
      </div>

      <div className="tab-content">
        {activeTab === "controls" && (
          <section className="admin-card">
            <h2>Voting Controls</h2>
            <button className={`admin-button ${isPaused ? "activate" : "pause"}`} onClick={togglePause}>
              {isPaused ? "Activate Voting" : "Pause Voting"}
            </button>
            <button className="admin-button" onClick={getWinner}>Get Winner</button>
          </section>
        )}

        {activeTab === "add" && (
          <section className="admin-card">
            <h2>Add Candidate</h2>
            <div className="admin-input-group">
              <input placeholder="Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
              <input placeholder="Party" value={candidateParty} onChange={(e) => setCandidateParty(e.target.value)} />
              <input placeholder="Metadata URI" value={candidateURI} onChange={(e) => setCandidateURI(e.target.value)} />
              <button className="admin-button" onClick={addCandidate}>Add Candidate</button>
            </div>
          </section>
        )}

        {activeTab === "dates" && (
          <section className="admin-card">
            <h2>{isPaused ? "Reset" : "Set"} Voting Period</h2>
            <div className="admin-input-group">
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button className="admin-button" onClick={isPaused ? resetDates : setDates}>
                {isPaused ? "Reset Dates" : "Start New Election"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "list" && (
          <section className="admin-card candidates-section">
            <h2>Candidates ({candidates.length})</h2>
            <div className="candidates-grid">
              {candidates.map((c) => (
                <div key={c.id} className="candidate-card">
                  <h3>{c.name}</h3>
                  <p className="party">{c.party}</p>
                  <p className="tx-hash">Votes: {c.voteCount}</p>
                  <button className="admin-button pause" onClick={() => deleteCandidate(c.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showWinner && winner && (
        <div className="drawer-overlay" onClick={() => setShowWinner(false)}>
          <div className="drawer-container winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-content">
              <h2 className="modal-title">🎉 Winner Declared!</h2>
              <p className="modal-desc">Candidate: <strong>{winner.name}</strong></p>
              <p>Party: {winner.party}</p>
              <p>Total Votes: {winner.voteCount}</p>
              <button className="admin-submit-btn" onClick={() => setShowWinner(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
