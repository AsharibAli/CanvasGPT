"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";
import { registerCanvasWallet } from "@dscvr-one/canvas-wallet-adapter";
import CanvasGPT from "@/components/CanvasGPT";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { signerIdentity, generateSigner } from "@metaplex-foundation/umi";
import { setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox";
import base58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { umiUseNoopSigner } from "@/lib/umiUtils";

export default function UnlockCanvas() {
  const [isReady, setIsReady] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const canvasClientRef = useRef<CanvasClient | null>(null);
  const umiRef = useRef<any>(null);

  useEffect(() => {
    console.log("Initializing CanvasClient...");
    const client = new CanvasClient();
    registerCanvasWallet(client);
    canvasClientRef.current = client;
    console.log("CanvasClient initialized and wallet registered:", client);

    const startClient = async () => {
      console.log("Waiting for CanvasClient to be ready...");
      const response = await client.ready();
      if (response) {
        console.log("CanvasClient is ready:", response);
        setIsReady(true);

        const user: any = response.untrusted.user;
        console.log("User information:", user);
        setUsername(user.username || "User");
      }
    };

    startClient();

    return () => {
      console.log("Destroying CanvasClient...");
      client.destroy();
    };
  }, []);

  useEffect(() => {
    console.log("Checking stored data for previous NFT minting...");
    const storedToken = localStorage.getItem("nftToken");
    const storedAddress = localStorage.getItem("userAddress");
    if (storedToken && storedAddress === address) {
      if (validateToken(storedToken)) {
        console.log("Access granted based on valid token.");
        setAccessGranted(true);
      } else {
        console.warn("Invalid token. Access denied.");
      }
    }
  }, [address]);

  const validateToken = (token: string): boolean => {
    return !!token;
  };

  const generateUniqueToken = (): string => {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return base58.encode(randomBytes);
  };

  const handleConnectWallet = async () => {
    if (!canvasClientRef.current) {
      console.error("CanvasClient is not initialized");
      setErrorMessage("CanvasClient is not initialized. Please try again.");
      return;
    }

    try {
      console.log("Connecting wallet...");
      const response = await canvasClientRef.current.connectWallet(
        "solana:103"
      );
      console.log("Wallet connect response:", response);
      if (response && response.untrusted.success) {
        const publicKey = new PublicKey(response.untrusted.address);
        console.log("Connected wallet public key:", publicKey.toString());
        setAddress(publicKey.toString());
        localStorage.setItem("userAddress", publicKey.toString());
        setErrorMessage(null);

        console.log("Initializing Umi with NoopSigner...");
        const umi = createUmi("https://api.devnet.solana.com")
          .use(mplCore())
          .use(signerIdentity(umiUseNoopSigner(publicKey.toString())));

        umiRef.current = umi;
        console.log("Umi initialized:", umi);
      } else {
        console.error("Failed to connect wallet.");
        setErrorMessage("Failed to connect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setErrorMessage("Failed to connect wallet. Please try again.");
    }
  };

  const mintNFT = async () => {
    if (!address) {
      console.error("No wallet connected. Cannot mint NFT.");
      setErrorMessage(
        "Wallet is not connected. Please connect your wallet first."
      );
      return;
    }

    console.log("Starting NFT minting process...");
    setTransactionStatus("Minting NFT...");
    setErrorMessage(null);

    try {
      console.log("Generating signer for asset...");
      const assetAddress = generateSigner(umiRef.current);
      console.log("Asset address:", assetAddress);

      console.log("Building transaction...");
      let transactionBuilder = await create(umiRef.current, {
        asset: assetAddress,
        name: "CanvasGPT NFT",
        uri: "ipfs://bafybeiahfsvde7tjzr3rkk26ullka4w7kajxu3uisbf2yau4ud36vm257q",
      });
      console.log("Transaction builder created:", transactionBuilder);

      transactionBuilder = transactionBuilder.prepend(
        setComputeUnitPrice(umiRef.current, {
          microLamports: 10_000,
        })
      );
      console.log("Compute unit price set on transaction.");

      console.log("Building and signing the transaction...");
      const tx = await transactionBuilder.buildAndSign(umiRef.current);
      console.log("Transaction built and signed:", tx);

      console.log("Serializing transaction...");
      const serializedTx = umiRef.current?.transactions.serialize(tx);
      console.log("Serialized transaction:", serializedTx);

      console.log("Encoding transaction in base58...");
      const base58EncodedTx = base58.encode(serializedTx);
      console.log("Base58 encoded transaction:", base58EncodedTx);

      console.log("Sending transaction to DSCVR...");
      const results = await canvasClientRef.current?.signAndSendTransaction({
        unsignedTx: base58EncodedTx,
        awaitCommitment: "confirmed",
        chainId: "solana:103",
      });
      console.log("Transaction sent. Results:", results);

      if (results?.untrusted.success) {
        console.log("NFT minted successfully:", results);
        const token = generateUniqueToken();
        localStorage.setItem("nftToken", token);
        setTransactionStatus("NFT minted successfully!");
        setTimeout(() => {
          setAccessGranted(true);
          setTransactionStatus(null);
        }, 3000);
      } else {
        throw new Error("Transaction failed.");
      }
    } catch (error: any) {
      console.error("Minting error:", error);
      console.log("Detailed error stack trace:", error.stack);
      setTransactionStatus("Minting failed.");
      setErrorMessage(
        "An error occurred during the minting process. Please try again."
      );
    }
  };

  if (!isReady) {
    return <p className="text-center">Loading...</p>;
  }

  if (accessGranted) {
    return <CanvasGPT />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">
        💗 Welcome {username ? username : "User"} to the CanvasGPT 🤖
      </h1>
      <h2 className="text-2xl mb-4">➡️ powered by Metaplex Core 🙌</h2>
      {address ? (
        <h3 className="text-sm mb-4 text-gray-500">
          <strong>Connected Wallet Address:</strong> {address}
        </h3>
      ) : (
        <p className="text-sm mb-4 text-red-500">
          Please connect your wallet to proceed.
        </p>
      )}
      {!address ? (
        <Button onClick={handleConnectWallet}>Connect Wallet</Button>
      ) : (
        <>
          <Button
            onClick={mintNFT}
            disabled={transactionStatus === "Minting NFT..."}
          >
            Mint NFT
          </Button>
        </>
      )}

      {transactionStatus && (
        <p
          className={`mt-4 ${transactionStatus.includes("successfully")
              ? "text-green-500"
              : "text-red-500"
            }`}
        >
          {transactionStatus}
        </p>
      )}

      {errorMessage && <p className="mt-2 text-red-500">{errorMessage}</p>}
    </div>
  );
}
