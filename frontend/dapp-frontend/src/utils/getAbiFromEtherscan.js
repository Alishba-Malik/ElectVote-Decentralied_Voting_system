const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

export async function getAbi(contractAddress) {
  const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
      return JSON.parse(data.result); // ABI as usable JSON
    } else {
      throw new Error(data.result);
    }
  } catch (err) {
    console.error("Error fetching ABI from Etherscan:", err);
    return null;
  }
}
