"use client"
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Loader from '@/components/Loader'
import ABI from './abi/ABI.json'
import TokenABI from './abi/TokenABI.json'
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
const ethers = require("ethers")

export default function Home() {
  const [option, setOption] = useState(4)
  const [coin, setCoin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [num, setNum] = useState('00')
  const [l_value, setLabel] = useState('Connect')
  const [Flag, setFlag] = useState(0);
  const [adminFlag, setAdminFlag] = useState(false)
  const [WalletConnection, setWalletConnection] = useState(false)
  const [balance, setBalance] = useState(0);
  const options = ['Number Greater Than 5', 'Number Less Than 5', 'Number Equal To 5']

  const callOption = (opt) => {
    setOption(opt)
  }

  const owner = "0x36918aF185cC830E225b0726426686a626fA158e"
  async function startGame() {
    try {
      if (coin == 0) {
        console.log("called");
        throw new Error("Please select Coin amount");
      }
      const contractAddress = '0xD76430bebB84EB7dE10F01AE2Bb341b1211B3EfD';
      const TokenAddress = '0x783adA73A6202083C03A90970e9d4C58cC275e6a'
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const walletAddress = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(contractAddress, ABI, signer);
      const TokenContract = new ethers.Contract(TokenAddress, TokenABI, signer);

      const balanceBefore = await TokenContract.balanceOf(walletAddress[0]);
      const allowance = await TokenContract.allowance(walletAddress[0], contractAddress);

      if (allowance < coin) {
        setLoading(true)
        const tx = await TokenContract.approve(contractAddress, coin);
        await tx.wait();
        setLoading(false)
      }
      setLoading(true)

      const tx = await contract.bet(Number(option), BigInt(coin));
      await tx.wait();

      const balanceAfter = await TokenContract.balanceOf(walletAddress[0]);
      const number = await contract.number()
      setNum(Number(number))
      setLoading(false)
      fireToast("success", "Transaction Successful")
      setFlag(Flag + 1);
      if (balanceBefore < balanceAfter) {
        setResult("you are win and get 2X Token");
      }
      else if (balanceBefore > balanceAfter)
        setResult("You Lose..Better Luck Next Time");
    }

    catch (e) {
      let msg = e.message;
      if (await msg.includes("execution reverted: Currently Betting is risky.")) {
        fireToast("error", "Currently Betting is risky.")
      }
      if ((e.toString()).includes('user rejected transaction')) {
        fireToast("error", "User Reject Transaction")
      }
      if (await msg.includes("execution reverted: Invalid argument")) {
        fireToast("error", "Please Select  valid Option.")
      }
      if (await e.toString().includes("Error: Please select Coin amount")) {
        fireToast("error", "Please select Coin amount")
      }
      else
        console.log(e)

    }

    finally {
      setLoading(false)
    }
  }

  async function withdraw() {
    try {
      tx = await Contract.collectTokenOwner();
      await tx.await()
      fireToast("success", "Collection of token Success.")
    }
    catch (e) {
      console.log(e);
    }
  }

  function fireToast(type, msg) {
    if (type == 'error') {
      toast.error(msg, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
    }
    if (type == 'success') {
      toast.success(msg, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
    }
    if (type == 'warn') {
      toast.warn(msg, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }
  async function connectWallet() {
    try {
      const acc = await window.ethereum.request({ method: "eth_requestAccounts" });
      const start = acc[0].substring(0, 6);
      const end = acc[0].substring(acc[0].length - 4);
      const Short_acc = `${start}...${end}`
      if ((acc[0].toString()).toLowerCase() == owner.toLowerCase())
        setAdminFlag(true);
      else {
        setAdminFlag(false);
      }
      setWalletConnection(true);
      WalletConnection ? setLabel(Short_acc) : setLabel("Connect")
    }
    catch (e) {
      setLabel("Connect")
      let msg = e.message;
      if (await msg.includes("Request of type 'wallet_requestPermissions' already pending fo")) {
        fireToast("warn", "Request Alredy Pending, open metamask manually. ")
      }
      if (await msg.includes("User rejected the request.")) {
        fireToast("warn", "You rejected the request.")
      }

    }
  }
  useEffect(() => {

    (WalletConnection) ? connectWallet() : connectWallet();
    async function getBalance() {

      const TokenAddress = '0x783adA73A6202083C03A90970e9d4C58cC275e6a'
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const walletAddress = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const TokenContract = new ethers.Contract(TokenAddress, TokenABI, signer);
      const balanceOfUser = (parseInt(await TokenContract.balanceOf(walletAddress[0]))) / 1e18;
      return balanceOfUser;
    }

    setBalance(getBalance())

  }, [Flag]);
  const window = globalThis.window;
  window.addEventListener('load', () => {
    setFlag(Flag + 1);
  });

  const style = {
    coinNumber: `text-black`
  }


  useEffect(() => {
    if (!WalletConnection)
      fireToast("warn", "Wallet Disconnected.")
    if (WalletConnection)
      fireToast("success", "Wallet Connected Successfuly")
  }, [WalletConnection])

  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length == 0) {
      setLabel("Connect");
      setFlag(Flag + 1);
      setWalletConnection(false);

    }
    else {
      setLabel(accounts[0]);
      if (accounts[0].toLowerCase() == owner.toLowerCase())
        setAdminFlag(true)
      setWalletConnection(true);
      setFlag(Flag + 1);
    }
  })


  return (
    <div className='grid grid-cols-1 w-full text-center p-10 bg-white'>
      <ToastContainer />
      <div className='justify-self-center grid grid-cols-4 w-full h-80 bg-red-500 rounded-lg'>
        <div><p className='m-4 font-casino text-white font-bold text-3xl drop-shadow-lg'>CASINO</p></div>
        <div className='col-span-2 pt-10'>
          <p className='text-2xl pt-10 font-casino'>
            Your Bet
          </p>
          <p className='bg-black text-white rounded-lg font-casino'>Option : {options[option - 1]} | Amount : {Number(coin) / 1e18} </p>
          <p className='text-9xl font-casino'>{num}</p>
          <p className="bg-white rounded-full font-sans text-black font-casino">{result}</p>
        </div>
        <div className='justify-self-end grid grid-cols-2'>
          <div>
            <p className='bg-black rounded-full w-fit flex items-center m-4 text-white content-center font-casino'>
              <Image
                src="/10.png"
                width={40}
                height={40}
                alt="Picture of the author"
                className='items-centerr pr-2'
              />
              <>
                {balance}
              </>
            </p>
          </div>
          <div>
            <button className='bg-black rounded-lg m-4 text-white p-2 font-casino' onClick={connectWallet}>{WalletConnection ? l_value : "Connect"}</button>
          </div>
        </div>

      </div>
      {
        loading
          ?
          <div className='flex justify-center'><Loader /></div>
          :
          <>
            <div className='grid grid-cols-3 h-48 rounded py-10 '>
              <div className='bg-green-500 rounded-lg' >
                <p className='font-casino text-xl m-4'>
                  Number is greter than 5
                </p>
                <button className='bg-black text-white rounded-lg p-2 font-casino' onClick={() => callOption(1)}>Select</button>
              </div>
              <div className='bg-yellow-300 rounded-lg mx-10'>
                <p className='font-casino text-xl m-4'>
                  Number is Equal to 5
                </p>
                <button className='bg-black text-white rounded-lg p-2 font-casino' onClick={() => callOption(3)}>Select</button>
              </div>
              <div className='bg-blue-500 rounded-lg '>
                <p className='font-casino text-xl m-4'>
                  Number is less than 5
                </p>
                <button className='bg-black text-white rounded-lg p-2 font-casino' onClick={() => callOption(2)}>Select</button>
              </div>
            </div>
            <div className='grid grid-cols-5 py-10 '>
              <div className='rounded-full mx-6 grid grid-cols-1 justify-items-center h-fit'>
                <Image
                  src="/10.png"
                  width={150}
                  height={150}
                  alt="Picture of the author"
                  className='items-centerr'
                  onClick={() => setCoin((10 * 1e18))} />

              </div>
              <div className='rounded-full mx-6 grid grid-cols-1 justify-items-center h-fit'>
                <Image
                  src="/100.png"
                  width={150}
                  height={150}
                  alt="Picture of the author"
                  className='items-centerr'
                  onClick={() => setCoin((100 * 1e18))} />

              </div>
              <div className='rounded-full mx-6 grid grid-cols-1 justify-items-center  h-fit'>
                <Image
                  src="/200.png"
                  width={150}
                  height={150}
                  alt="Picture of the author"
                  className='items-centerr'
                  onClick={() => setCoin((200 * 1e18))} />

              </div>
              <div className='rounded-full  mx-6 grid grid-cols-1 justify-items-center  h-fit'>
                <Image
                  src="/500.png"
                  width={150}
                  height={150}
                  alt="Picture of the author"
                  className='items-centerr'
                  onClick={() => setCoin((500 * 1e18))} />

              </div>
              <div className='rounded-full mx-6 grid grid-cols-1 justify-items-center  h-fit'>
                <Image
                  src="/1000.png"
                  width={150}
                  height={150}
                  alt="Picture of the author"
                  className='items-centerr'
                  onClick={() => setCoin(BigInt(1000 * 1e18))} />

              </div>
            </div>
            <div>
              <button className='bg-black text-white rounded-full p-4 px-10 mx-6 font-casino' onClick={startGame}>Start</button>
              {adminFlag &&
                adminFlag
                ?
                <>
                  <button className='bg-black text-white rounded-full p-4 px-10 mx-6 font-casino' onClick={withdraw}>Withdraw</button>
                </>
                :
                <></>
              }

            </div>
          </>
      }
    </div>
  )
}