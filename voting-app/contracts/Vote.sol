// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Vote is Ownable2Step {
    struct Candidate {
        string name;
        uint id;
        string party;
        uint voteCount;
        string metadataURI;
        bool isDeleted;
    }

    struct Election {
        uint id;
        uint256 start;
        uint256 end;
        bool isPaused;
        uint leadingCandidateId;
        uint countCandidates;
        mapping(uint => Candidate) candidates;
        mapping(address => bool) hasVoted;
    }

    uint public electionId;
    mapping(uint => Election) public elections;

    event CandidateAdded(uint electionId, uint id, string name, string party);
    event CandidateDeleted(uint electionId, uint id);
    event Voted(uint electionId, address indexed voter, uint candidateID);
    event VotingDatesSet(uint electionId, uint startDate, uint endDate);
    event VotingDatesReset(uint electionId, uint startDate, uint endDate);
    event Paused(uint electionId, bool isPaused);

    modifier votingActive(uint _electionId) {
        Election storage e = elections[_electionId];
        require(!e.isPaused, "Contract is paused");
        require(block.timestamp >= e.start && block.timestamp <= e.end, "Voting is not active");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ========== ADMIN FUNCTIONS ========== //

    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require(_startDate > block.timestamp, "Start must be in future");
        require(_endDate > _startDate, "End must be after start");

        electionId += 1;
        Election storage e = elections[electionId];
        e.id = electionId;
        e.start = _startDate;
        e.end = _endDate;
        e.isPaused = false;

        emit VotingDatesSet(electionId, _startDate, _endDate);
    }

    function resetDates(uint256 _electionId, uint256 _startDate, uint256 _endDate) public onlyOwner {
        Election storage e = elections[_electionId];
        require(e.isPaused, "Pause contract to reset dates");
        require(_startDate > block.timestamp, "Start must be in future");
        require(_endDate > _startDate, "End must be after start");

        e.start = _startDate;
        e.end = _endDate;

        emit VotingDatesReset(_electionId, _startDate, _endDate);
    }

    function togglePause(uint _electionId) public onlyOwner {
        elections[_electionId].isPaused = !elections[_electionId].isPaused;
        emit Paused(_electionId, elections[_electionId].isPaused);
    }

    function addCandidate(uint _electionId, string memory name, string memory party, string memory uri) public onlyOwner {
        require(bytes(name).length > 0, "Candidate name required");
        require(bytes(party).length > 0, "Party name required");

        Election storage e = elections[_electionId];
        e.countCandidates++;
        e.candidates[e.countCandidates] = Candidate(name, e.countCandidates, party, 0, uri, false);

        emit CandidateAdded(_electionId, e.countCandidates, name, party);
    }

    function deleteCandidate(uint _electionId, uint candidateID) public onlyOwner {
        Election storage e = elections[_electionId];
        require(candidateID > 0 && candidateID <= e.countCandidates, "Invalid candidate ID");
        require(!e.candidates[candidateID].isDeleted, "Already deleted");

        e.candidates[candidateID].isDeleted = true;
        emit CandidateDeleted(_electionId, candidateID);
    }

    // ========== PUBLIC FUNCTIONS ========== //

    function vote(uint _electionId, uint candidateID) public votingActive(_electionId) {
        Election storage e = elections[_electionId];

        require(candidateID > 0 && candidateID <= e.countCandidates, "Invalid candidate ID");
        require(!e.candidates[candidateID].isDeleted, "Candidate has been removed");
        require(!e.hasVoted[msg.sender], "Already voted");

        e.hasVoted[msg.sender] = true;
        e.candidates[candidateID].voteCount++;

        if (e.candidates[candidateID].voteCount > e.candidates[e.leadingCandidateId].voteCount) {
            e.leadingCandidateId = candidateID;
        }

        emit Voted(_electionId, msg.sender, candidateID);
    }

    // ========== VIEW FUNCTIONS ========== //

    function getCandidate(uint _electionId, uint candidateID) public view returns (
        string memory, uint, string memory, uint, string memory, bool
    ) {
        Election storage e = elections[_electionId];
        require(candidateID > 0 && candidateID <= e.countCandidates, "Invalid candidate ID");
        Candidate memory c = e.candidates[candidateID];
        return (c.name, c.id, c.party, c.voteCount, c.metadataURI, c.isDeleted);
    }

    function getActiveCandidateCount(uint _electionId) public view returns (uint256) {
        Election storage e = elections[_electionId];
        uint256 activeCount = 0;
        for (uint i = 1; i <= e.countCandidates; i++) {
            if (!e.candidates[i].isDeleted) {
                activeCount++;
            }
        }
        return activeCount;
    }

    function getDates(uint _electionId) public view returns (uint256, uint256) {
        Election storage e = elections[_electionId];
        return (e.start, e.end);
    }

    function checkVote(uint _electionId) public view returns (bool) {
        return elections[_electionId].hasVoted[msg.sender];
    }

    function getWinner(uint _electionId) public view returns (string memory, string memory, uint) {
        Election storage e = elections[_electionId];
        require(block.timestamp > e.end, "Voting not ended");
        require(e.leadingCandidateId != 0, "No votes cast");

        Candidate memory winner = e.candidates[e.leadingCandidateId];
        return (winner.name, winner.party, winner.voteCount);
    }
}
