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
    }

    uint256 public countCandidates;
    uint256 public votingStart;
    uint256 public votingEnd;
    bool public isPaused;
    uint public leadingCandidateId;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;

    event CandidateAdded(uint id, string name, string party);
    event Voted(address indexed voter, uint candidateID);
    event VotingDatesSet(uint startDate, uint endDate);
    event Paused(bool isPaused);

    modifier votingActive {
        require(!isPaused, "Contract is paused");
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting is not active");
        _;
    }

    constructor() Ownable(msg.sender) {
        isPaused = false;
        leadingCandidateId = 0;
    }

    // ========== ADMIN FUNCTIONS ========== //
    function addCandidate(string memory name, string memory party, string memory uri) public onlyOwner {
        require(bytes(name).length > 0, "Candidate name required");
        require(bytes(party).length > 0, "Party name required");

        countCandidates++;
        candidates[countCandidates] = Candidate(name, countCandidates, party, 0, uri);

        emit CandidateAdded(countCandidates, name, party);
    }

    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require(votingStart == 0 && votingEnd == 0, "Dates already set");
        require(_startDate > block.timestamp, "Start must be in future");
        require(_endDate > _startDate, "End must be after start");

        votingStart = _startDate;
        votingEnd = _endDate;
        emit VotingDatesSet(votingStart, votingEnd);
    }

    function togglePause() public onlyOwner {
        isPaused = !isPaused;
        emit Paused(isPaused);
    }

    // ========== PUBLIC FUNCTIONS ========== //
    function vote(uint candidateID) public votingActive {
        require(candidateID > 0 && candidateID <= countCandidates, "Invalid candidate ID");
        require(!voters[msg.sender], "Already voted");

        voters[msg.sender] = true;
        candidates[candidateID].voteCount++;

        if (candidates[candidateID].voteCount > candidates[leadingCandidateId].voteCount) {
            leadingCandidateId = candidateID;
        }

        emit Voted(msg.sender, candidateID);
    }

    // ========== VIEW FUNCTIONS ========== //
    function getCandidate(uint candidateID) public view returns (
        string memory, uint, string memory, uint, string memory
    ) {
        require(candidateID > 0 && candidateID <= countCandidates, "Invalid candidate ID");
        Candidate memory c = candidates[candidateID];
        return (c.name, c.id, c.party, c.voteCount, c.metadataURI);
    }

    function getDates() public view returns (uint256, uint256) {
        return (votingStart, votingEnd);
    }

    function checkVote() public view returns (bool) {
        return voters[msg.sender];
    }

    function getWinner() public view returns (string memory, string memory, uint) {
        require(block.timestamp > votingEnd, "Voting not ended");
        require(leadingCandidateId != 0, "No votes cast");

        Candidate memory winner = candidates[leadingCandidateId];
        return (winner.name, winner.party, winner.voteCount);
    }
}