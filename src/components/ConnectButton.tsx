import { useState, useEffect, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { injected } from "../config/wallets";
import abi from "./abi.json";
import { ethers } from "ethers";
import { Web3ReactContextInterface } from "@web3-react/core/dist/types";

declare global {
  interface Window {
    ethereum: any;
  }
}

const babyContract = "0x28017936E4e95CcAfe2d3d89C222bF470e58965E";

export default function ConnectButton() {
  const { account, active, activate, library, deactivate } =
    useWeb3React<ethers.providers.Web3Provider>() as Required<
      Web3ReactContextInterface<ethers.providers.Web3Provider>
    >;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [gasFee, setGasFee] = useState<string>("");
  const [gasLimit, setGasLimit] = useState<number>(0);
  const toast = useToast();

  function handleConnectWallet() {
    connected ? deactivate() : activate(injected);
    setConnected(!connected);
  }

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }

  function handleChangeAddress(event: any) {
    setRecieverAdd(event.target.value);
  }

  function handleChangeAmount(event: any) {
    setSendAmount(event.target.value);
  }

  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === 0) {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }

    setGasLimit(mode === "BNB" ? 21000 : 500000);

    const gasPrice = await library.getGasPrice();
    setGasFee(ethers.utils.formatEther(gasPrice));

    onOpen();
  }

  const sendBNB = useCallback(async () => {
    if (account) {
      const tx = {
        from: account,
        to: recieverAdd,
        value: ethers.utils.parseEther(sendAmount.toString()),
        nonce: await library.getTransactionCount(account, "latest"),
        gasLimit: ethers.utils.hexlify(gasLimit),
        gasPrice: ethers.utils.parseEther(gasFee),
      };
      library
        .getSigner()
        .sendTransaction(tx)
        .then((txn) => {
          saveTransaction(account, txn.hash, mode, sendAmount);
        });
    }
  }, [account, library, gasLimit, gasFee, sendAmount, recieverAdd, mode]);

  const sendBaby = useCallback(async () => {
    if (account) {
      const contract = new ethers.Contract(babyContract, abi, library);
      contract
        .connect(library.getSigner())
        .transfer(
          recieverAdd,
          ethers.BigNumber.from(sendAmount).mul(
            ethers.BigNumber.from(10).pow(9)
          )
        )
        .then((txn: any) => {
          saveTransaction(account, txn.hash, mode, sendAmount);
        });
    }
  }, [account, library, recieverAdd, sendAmount]);

  const sendAction = useCallback(async () => {
    if (mode === "BNB") {
      await sendBNB();
    } else {
      sendBaby();
    }
    onClose();
    valueload();
  }, [sendBNB, sendBaby]);

  const saveTransaction = (
    address: string,
    hash: string,
    currency: string,
    amount: number
  ) => {
    fetch(process.env.REACT_APP_BACKEND_URL + "/api/v1/transaction/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        hash,
        currency,
        amount,
      }),
    });
  };

  const valueload = useCallback(async () => {
    const contract = new ethers.Contract(babyContract, abi, library);
    if (account) {
      const balance = await library.getBalance(account);
      const balanceInEther = ethers.utils.formatEther(balance);
      setBalance(balanceInEther);

      const balanceBaby = await contract.balanceOf(account);
      setBabyBalance(
        balanceBaby.div(ethers.BigNumber.from(10).pow(9)).toString()
      );
    }
  }, [account, library]);

  useEffect(() => {
    active && valueload();
  }, [account, active, valueload]);

  return (
    <>
    <h1 className="title">Metamask login demo from Enva Division</h1>
      {account ? (
        <Box
          display="block"
          alignItems="center"
          background="white"
          borderRadius="xl"
          p="4"
          width="300px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              Account:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {`${account.slice(0, 6)}...${account.slice(
                account.length - 4,
                account.length
              )}`}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BabyDoge Balance :
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {babyBalance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB Balance:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {balance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB / BabyDoge
            </Text>
            <Switch size="md" value={mode} onChange={handleMode} />
          </Box>
          <Box
            display="block"
            justifyContent="space-between"
            alignItems="center"
            mb="4"
          >
            <Text color="#158DE8" fontWeight="medium">
              Send {mode}:
            </Text>
            <Input
              bg="#EBEBEB"
              size="lg"
              value={recieverAdd}
              onChange={handleChangeAddress}
            />
          </Box>
          <Box display="flex" alignItems="center" mb="4">
            <Input
              bg="#EBEBEB"
              size="lg"
              value={sendAmount}
              onChange={handleChangeAmount}
            />
            <Button
              onClick={handleOpenModal}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              ml="2"
              border="1px solid transparent"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Send
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Button
              onClick={handleConnectWallet}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              border="1px solid transparent"
              width="300px"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Disconnect Wallet
            </Button>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Are you Sure?</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div>
                  Are you sure {sendAmount} {mode} to {recieverAdd} user?
                </div>
                <div>Gas Limit: {gasLimit}</div>
                <div>Gas Price: {gasFee}</div>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button variant="ghost" onClick={sendAction}>
                  Send
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      ) : (
        <Box bg="white" p="4" borderRadius="xl">
          <Button
            onClick={handleConnectWallet}
            bg="#158DE8"
            color="white"
            fontWeight="medium"
            borderRadius="xl"
            border="1px solid transparent"
            width="300px"
            _hover={{
              borderColor: "blue.700",
              color: "gray.800",
            }}
            _active={{
              backgroundColor: "blue.800",
              borderColor: "blue.700",
            }}
          >
            Connect Wallet
          </Button>
        </Box>
      )}
    </>
  );
}
