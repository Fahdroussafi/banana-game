import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

const STEP = 10;
const BANANA_SIZE = 100;
const MIN_DISTANCE_FROM_PLAYER = 200;
const MIN_DISTANCE_BETWEEN_BANANAS = 200;

const App = () => {
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(200);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [bananas, setBananas] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [plusThreeElement, setPlusThreeElement] = useState(false);
  const timerRef = useRef(null);

  const [ws, setWs] = useState(null);

  const [playerList, setPlayerList] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const handleStartGame = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "ASSIGN_PLAYER_ID_REQUEST" }));
    }
  };

  useEffect(() => {
    const socket = new WebSocket("ws://192.168.70.30:8080");

    socket.onopen = () => {
      console.log("Connected to server");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      if (message.type === "ASSIGN_PLAYER_ID_RESPONSE") {
        setPlayerId(message.playerId);
      }
      if (message.type === "UPDATE_PLAYER_LIST") {
        setPlayerList(message.playerList);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Connection closed");
    };

    return () => {
      console.log("Returning from useEffect");
      socket.close();
    };
  }, []);

  useEffect(() => {
    const windowSize = { width: window.innerWidth, height: window.innerHeight };
    setPlayerPosition({
      x: windowSize.width / 2 - 25,
      y: windowSize.height / 2 - 25,
    });
    InjectBanana();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case "ArrowUp":
          setPlayerPosition((prevPosition) => ({
            ...prevPosition,
            y: Math.max(0, prevPosition.y - STEP),
          }));
          break;
        case "ArrowDown":
          setPlayerPosition((prevPosition) => ({
            ...prevPosition,
            y: Math.min(window.innerHeight - 120, prevPosition.y + STEP),
          }));
          break;
        case "ArrowLeft":
          setPlayerPosition((prevPosition) => ({
            ...prevPosition,
            x: Math.max(0, prevPosition.x - STEP),
          }));
          break;
        case "ArrowRight":
          setPlayerPosition((prevPosition) => ({
            ...prevPosition,
            x: Math.min(window.innerWidth - 120, prevPosition.x + STEP),
          }));
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [playerPosition]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime > 0) {
          if (prevTime === 1) {
            setIsGameOver(true);
            setBananas([]);
          }
          return prevTime - 1;
        } else {
          clearInterval(timerRef.current);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isGameOver]);

  const addTime = (time) => {
    setTimeRemaining((prevTime) => prevTime + time);
    showPlusThree();
  };

  const showPlusThree = () => {
    setPlusThreeElement(true);
    setTimeout(() => {
      setPlusThreeElement(false);
    }, 1000);
  };

  useEffect(() => {
    const playerRect = {
      left: playerPosition.x,
      right: playerPosition.x + 50,
      top: playerPosition.y,
      bottom: playerPosition.y + 50,
    };

    for (const banana of bananas) {
      const bananaRect = {
        left: banana.x,
        right: banana.x + BANANA_SIZE,
        top: banana.y,
        bottom: banana.y + BANANA_SIZE,
      };

      if (
        playerRect.left < bananaRect.right &&
        playerRect.right > bananaRect.left &&
        playerRect.top < bananaRect.bottom &&
        playerRect.bottom > bananaRect.top
      ) {
        setScore((prevScore) => prevScore + 1);
        setBananas((prevBananas) =>
          prevBananas.filter((prevBanana) => prevBanana !== banana)
        );
        addTime(3);
        setTimeout(() => InjectBanana(), 200);
      }
    }
  }, [playerPosition, bananas]);

  const InjectBanana = () => {
    let playerPos = playerPosition;
    let newBananas = [];

    let top, left;
    let isPositionValid = false;

    while (!isPositionValid) {
      top = Math.floor(Math.random() * (window.innerHeight - BANANA_SIZE));
      left = Math.floor(Math.random() * (window.innerWidth - BANANA_SIZE));
      isPositionValid = true;

      if (
        Math.abs(playerPos.x - left) < MIN_DISTANCE_FROM_PLAYER &&
        Math.abs(playerPos.y - top) < MIN_DISTANCE_FROM_PLAYER
      ) {
        isPositionValid = false;
      }

      for (const banana of bananas) {
        if (
          Math.abs(banana.x - left) < MIN_DISTANCE_BETWEEN_BANANAS &&
          Math.abs(banana.y - top) < MIN_DISTANCE_BETWEEN_BANANAS
        ) {
          isPositionValid = false;
          break;
        }
      }

      newBananas.push({ x: left, y: top });
    }
    setBananas(newBananas);
  };

  const PlayAgain = () => {
    setIsGameOver(false);
    setScore(0);
    setTimeRemaining(10);
    setBananas([]);
    InjectBanana();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime > 0) {
          if (prevTime === 1) {
            setIsGameOver(true);
            setBananas([]);
          }
          return prevTime - 1;
        } else {
          clearInterval(timerRef.current);
          return 0;
        }
      });
    }, 1000);
  };
  return (
    <>
      {playerId ? (
        <div className="body">
          <div className="game-container">
            <div className="mx-5 flex justify-between items-center opacity-65">
              <div className="text-center mt-2 rounded-xl bg-black text-white p-3 size-20 w-36 shadow-lg">
                Score: {score}
              </div>
              <div className="text-center mt-2 rounded-xl bg-black text-white p-3 size-20 w-36 shadow-lg">
                Time: {timeRemaining}{" "}
                <span className="text-green-500 font-bold text-base">
                  {plusThreeElement ? "+3" : ""}
                </span>
              </div>
            </div>
            {playerList &&
              playerList.length > 0 &&
              playerList.map((player, index) => {
                return (
                  <img
                    className="item"
                    src="/avatar.png"
                    key={player.playerId}
                    id={player.playerId}
                    alt="Monkey"
                    style={{
                      top:
                        Math.max(
                          0,
                          Math.min(playerPosition.y, window.innerWidth - 50)
                        ) +
                        index * 50,
                      left: Math.max(
                        0,
                        Math.min(playerPosition.x, window.innerWidth - 50)
                      ),
                    }}
                  />
                );
              })}

            {bananas.map((banana, index) => (
              <img
                style={{ top: banana.y, left: banana.x, position: "absolute" }}
                key={index}
                className="banana"
                src="/banana.png"
                alt="Banana"
              />
            ))}

            <Transition appear show={isGameOver}>
              <Dialog
                as="div"
                className="w-[600px] relative z-10 focus:outline-none"
                onClose={() => {
                  setIsGameOver(false);
                  setScore(0);
                  setTimeRemaining(10);
                  setBananas([]);
                  InjectBanana();
                }}>
                <div className="fixed inset-0 flex items-center justify-center z-10 overflow-y-auto bg-black bg-opacity-50">
                  <div className="flex min-h-screen items-center justify-center p-4">
                    <TransitionChild
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 transform scale-95"
                      enterTo="opacity-100 transform scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 transform scale-100"
                      leaveTo="opacity-0 transform scale-95">
                      <DialogPanel className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
                        <DialogTitle
                          as="h3"
                          className="text-lg font-medium text-gray-900">
                          Game Over
                        </DialogTitle>
                        <p className="mt-2 text-sm text-gray-500">
                          <h2>Your Score: {score}</h2>
                        </p>
                        <div className="mt-4">
                          <Button
                            onClick={PlayAgain}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
                            Play Again
                          </Button>
                        </div>
                      </DialogPanel>
                    </TransitionChild>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <Button
            onClick={handleStartGame}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
            Start Game
          </Button>
        </div>
      )}
    </>
  );
};

export default App;
