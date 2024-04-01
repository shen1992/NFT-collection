import Head from "next/head";
import React, { useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'

import {
  abi,
  NFT_CONTRACT_ADDRESS
} from '../constants'
import styles from "../styles/Home.module.css";

export default function Home() {
  const [wallet, setWallet] = useState('')
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState('0')
  const providerRef = useRef()
  const signerRef = useRef()

  const initialEthers = async () => {
    if (window.ethereum == null) {
      console.log("MetaMask not installed; using read-only defaults")
      providerRef.current = ethers.getDefaultProvider()
    } else {
      providerRef.current = new ethers.BrowserProvider(window.ethereum)
      // providerRef.current = new ethers.JsonRpcProvider()
    }
    signerRef.current = await providerRef.current.getSigner()
  }

  const startPresale = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signerRef.current
      )
      const tx = await NFTToken.startPresale()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      const _presaleStarted = await checkIfPresaleStarted()
      if (_presaleStarted) {
        checkIfPresaleEnded()
      }
    } catch (err) {
      console.log('startPresale get err', err)
    }
  }

  const onPresaleMint = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signerRef.current
      )
      const tx = await NFTToken.presaleMint({
        value: ethers.parseEther('0.01')
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You successfully minted a Crypto Dev!")
    } catch (err) {
      console.error('onPresaleMint get err:', err)
    }
  }

  const publicMint = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signerRef.current
      )
      const tx = await NFTToken.mint({
        value: ethers.parseEther('0.01')
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert('You successfully minted a Crypto Dev!')
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        providerRef.current
      )
      const wallet = await NFTToken.getAddress()
      if (!!wallet) {
        setWallet(wallet)
      }
    } catch (err) {
      console.log('connectWallet get err', err)
    }
  }

  const getOwner = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        providerRef.current
      )
      const _owner = await NFTToken.owner()
      const address = await signerRef.current.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        providerRef.current
      )
      const _presaleStarted = await NFTToken.presaleStarted()
      if (!_presaleStarted) {
        await getOwner()
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error('checkIfPresaleStarted get err:', err);
      return false;
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        providerRef.current
      )
      const _presaleEnded = await NFTToken.presaleEnded()

      const hasEnded = Number(_presaleEnded) < Math.floor(Date.now() / 1000)
      if (hasEnded) {
        setPresaleEnded(true)
      } else {
        setPresaleEnded(false)
      }
    } catch (err) {
      console.log('checkIfPresaleEnded get err', err)
    }
  }

  const getTokenIdsMinted = async () => {
    try {
      const NFTToken = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        providerRef.current
      )
      NFTToken.on('CurrentTokenIds', (tokenIds) => {
        setTokenIdsMinted(Number(tokenIds))
      })
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    initialEthers()
    getTokenIdsMinted()
  }, [])

  useEffect(() => {
    if (wallet) {
      async function handlePresaleStatus() {
        const _presaleStarted = await checkIfPresaleStarted()
        if (_presaleStarted) {
          checkIfPresaleEnded()
        }
      }
      handlePresaleStatus()
    } else {
      connectWallet()
    }
  }, [wallet])

  const renderButton = () => {
    if (!wallet) {
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
          <button className={styles.button} onClick={onPresaleMint}>
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
          {
            wallet && <div className={styles.description}>{`your wallet address: ${wallet}`}</div>
          }
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