import { Contract,providers, utils } from 'ethers'
import Head from "next/head";
import React, { useEffect, useRef, useState } from 'react'
import Web3Modal from "web3modal";
import {
  abi,
  NFT_CONTRACT_ADDRESS
} from '../constants'
import styles from "../styles/Home.module.css";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState('0')
  const web3ModalRef = useRef()

  const startPresale = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the startPresale from the contract
      const tx = await nftContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  }

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      )
      const tx = await nftContract.presaleMint({
        value: utils.parseEther('0.01')
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You successfully minted a Crypto Dev!")
    } catch (err) {
      console.error(err)
    }
  }

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const tx = await nftContract.mint({
        value: utils.parseEther('0.01')
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You successfully minted a Crypto Dev!")
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (err) {
      console.error(err)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner()
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      const _presaleStarted = await nftContract.presaleStarted()
      if (!_presaleStarted) {
        await getOwner()
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'sepolia',
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()

      const _presaleStarted = checkIfPresaleStarted()
      if (_presaleStarted) {
        checkIfPresaleEnded()
      }

      getTokenIdsMinted()

      // const presaleEndedInterval = setInterval(async function () {
      //   const _presaleStarted = await checkIfPresaleStarted();
      //   if (_presaleStarted) {
      //     const _presaleEnded = await checkIfPresaleEnded();
      //     if (_presaleEnded) {
      //       clearInterval(presaleEndedInterval);
      //     }
      //   }
      // }, 5 * 1000);

      // setInterval(async function () {
      //   await getTokenIdsMinted();
      // }, 5 * 1000);
    }
  }, [walletConnected])

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name='description' content='Whitelist-Dapp' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src='./cryptodevs/0.svg' />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}