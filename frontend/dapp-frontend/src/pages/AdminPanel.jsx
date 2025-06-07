import React, { useEffect, useState } from "react";
import { getAbi } from "../utils/getAbiFromEtherscan";
import { BrowserProvider, Contract } from "ethers";
import "../styles/AdminPanel.css";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const subgraphEndpoint = import.meta.env.VITE_SUBGRAPH_URL;

const AdminPanel = () => {
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [candidates, setCandidates] = useState([]);

  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidateURI, setCandidateURI] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("controls");

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
          setIsPaused(await voteContract.isPaused());
          fetchCandidates();
        }
      } catch (err) {
        console.error("Error initializing admin panel:", err);
      }
    };

    init();
  }, []);

  const fetchCandidates = async () => {
    const query = `
      {
        candidateAddeds(first: 100, orderBy: internal_id, orderDirection: asc) {
          internal_id
          name
          party
          transactionHash
        }
      }
    `;

    try {
      const res = await fetch(subgraphEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const { data } = await res.json();
      setCandidates(data.candidateAddeds);
    } catch (err) {
      console.error("Subgraph fetch error:", err);
    }
  };

  const addCandidate = async () => {
    try {
      await contract.addCandidate(candidateName, candidateParty, candidateURI);
      setCandidateName("");
      setCandidateParty("");
      setCandidateURI("");
      fetchCandidates();
    } catch (err) {
      console.error("Add candidate failed:", err);
    }
  };

  const setDates = async () => {
    try {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      const end = Math.floor(new Date(endDate).getTime() / 1000);
      await contract.setDates(start, end);
    } catch (err) {
      console.error("Set dates error:", err);
    }
  };

  const togglePause = async () => {
    try {
      await contract.togglePause();
      const status = await contract.isPaused();
      setIsPaused(status);
    } catch (err) {
      console.error("Pause toggle failed:", err);
    }
  };

  if (!contract) {
    return (
      <div className="admin-loading-screen fade-in">
        <div className="loading-spinner"></div>
        <h1>Verifying Admin Access...</h1>
      </div>
    );
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
      <div style={{ padding: "2rem", color: "#fff", }}>
      <h1>Welcome to the Admin Dashboard</h1>
      <h3>This is a protected admin area.</h3>
    </div>
        <div className={`status-badge ${isPaused ? 'paused' : 'active'}`}>
          {isPaused ? 'Voting Paused' : 'Voting Active'}
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
            <button 
              className={`admin-button ${isPaused ? 'activate' : 'pause'}`}
              onClick={togglePause}
            >
              {isPaused ? 'Activate Voting' : 'Pause Voting'}
            </button>
          </section>
        )}

        {activeTab === "add" && (
          <section className="admin-card">
            <h2>Add Candidate</h2>
            <div className="admin-input-group">
              <input
                type="text"
                placeholder="Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Party"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
              />
              <input
                type="text"
                placeholder="Metadata URI"
                value={candidateURI}
                onChange={(e) => setCandidateURI(e.target.value)}
              />
              <button className="admin-button" onClick={addCandidate}>
                Add Candidate
              </button>
            </div>
          </section>
        )}

        {activeTab === "dates" && (
          <section className="admin-card">
            <h2>Set Voting Period</h2>
            <div className="admin-input-group">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button className="admin-button" onClick={setDates}>
                Set Dates
              </button>
            </div>
          </section>
        )}

        {activeTab === "list" && (
          <section className="admin-card candidates-section">
            <h2>Candidates ({candidates.length})</h2>
            <div className="candidates-grid">
              {candidates.map((c) => (
                <div key={c.internal_id} className="candidate-card">
                  <h3>{c.name}</h3>
                  <p className="party">{c.party}</p>
                  <p className="tx-hash">Tx: {c.transactionHash.slice(0, 10)}...</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
