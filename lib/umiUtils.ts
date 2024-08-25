import {
    createNoopSigner,
    createSignerFromKeypair,
    keypairIdentity,
    Umi,
    publicKey,
    UmiPlugin,
  } from "@metaplex-foundation/umi";
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
  import {
    Connection,
    Signer,
    VersionedTransaction,
  } from "@solana/web3.js";
  import base58 from "bs58";
  
  /**
   * Build Umi instance with Bundlr uploader and specific plugins.
   * @param rpcUrl - The RPC URL to connect to.
   * @param plugins - Array of Umi plugins to use.
   * @returns Umi instance.
   */
  export const buildUmi = (rpcUrl: string, plugins: UmiPlugin[]): Umi => {
    const umi = createUmi(rpcUrl);
    plugins.forEach((plugin) => umi.use(plugin));
    return umi;
  };
  
  /**
   * Load a keypair into the Umi instance using the provided secret key.
   * @param umi - The Umi instance.
   * @param secretKey - The secret key as Uint8Array.
   * @returns The Umi instance with the loaded keypair.
   */
  export const loadUmiKeypair = (umi: Umi, secretKey: Uint8Array): Umi => {
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const signer = createSignerFromKeypair(umi, keypair);
    return umi.use(keypairIdentity(signer));
  };
  
  /**
   * Create and use a NoopSigner for Umi using the provided wallet address.
   * @param walletAddress - The public key address of the wallet.
   * @returns NoopSigner instance for Umi.
   */
  export const umiUseNoopSigner = (walletAddress: string) => {
    return createNoopSigner(publicKey(walletAddress));
  };
  
  /**
   * Send a signed transaction to the blockchain.
   * @param connection - The Solana connection object.
   * @param tx - The serialized transaction in base58 format.
   * @param signers - Array of signers for the transaction.
   * @returns Transaction details after sending and confirmation.
   */
  export const sendTransaction = async (
    connection: Connection,
    tx: string,
    signers: Signer[]
  ) => {
    const txUint8Array = base58.decode(tx);
    let versionedTx = VersionedTransaction.deserialize(txUint8Array);
    versionedTx.sign(signers);
    let sig = await connection.sendTransaction(versionedTx);
    console.log("Transaction sent", sig);
    return await getTxDetails(connection, sig);
  };
  
  /**
   * Get details of a transaction using its signature.
   * @param connection - The Solana connection object.
   * @param sig - The transaction signature.
   * @returns Transaction details.
   */
  export const getTxDetails = async (connection: Connection, sig: string) => {
    const latestBlockHash = await connection.getLatestBlockhash("processed");
  
    await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: sig,
      },
      "confirmed"
    );
  
    return await connection.getTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  };
  