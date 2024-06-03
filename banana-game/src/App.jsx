import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

let STEP = 10;
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
  const [step, setStep] = useState(STEP);

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
      if (socket.readyState === 1) {
        socket.close();
      }
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
      let newPosition = { ...playerPosition };
      switch (event.key) {
        case "ArrowUp":
          newPosition = {
            ...newPosition,
            y: Math.max(0, newPosition.y - step),
          };
          break;
        case "ArrowDown":
          newPosition = {
            ...newPosition,
            y: Math.min(window.innerHeight - 120, newPosition.y + step),
          };
          break;
        case "ArrowLeft":
          newPosition = {
            ...newPosition,
            x: Math.max(0, newPosition.x - step),
          };
          break;
        case "ArrowRight":
          newPosition = {
            ...newPosition,
            x: Math.min(window.innerWidth - 120, newPosition.x + step),
          };
          break;
        default:
          break;
      }

      setPlayerPosition(newPosition);

      // Send the new position to the server
      if (ws && playerId) {
        ws.send(
          JSON.stringify({
            type: "UPDATE_PLAYER_POSITION",
            playerId,
            position: newPosition,
          })
        );
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
    let newBananas = [];
    for (let i = 0; i < 1; i++) {
      let banana = {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      };

      if (
        Math.abs(banana.x - playerPosition.x) < MIN_DISTANCE_FROM_PLAYER &&
        Math.abs(banana.y - playerPosition.y) < MIN_DISTANCE_FROM_PLAYER
      ) {
        banana = {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        };
      }

      if (i !== 0) {
        for (let j = 0; j < newBananas.length; j++) {
          if (
            Math.abs(banana.x - newBananas[j].x) <
              MIN_DISTANCE_BETWEEN_BANANAS &&
            Math.abs(banana.y - newBananas[j].y) < MIN_DISTANCE_BETWEEN_BANANAS
          ) {
            banana = {
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            };
          }
        }
      }

      newBananas.push(banana);
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

  // increase step by 10 every 5 score
  useEffect(() => {
    if (score % 5 === 0 && score !== 0) {
      setStep((prevStep) => prevStep + 20);
    }
  }, [score]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        if (message.type === "ASSIGN_PLAYER_ID_RESPONSE") {
          setPlayerId(message.playerId);
        } else if (message.type === "UPDATE_PLAYER_LIST") {
          setPlayerList(message.playerList);
        } else if (message.type === "UPDATE_PLAYER_POSITIONS") {
          const newPositions = message.positions.reduce(
            (acc, { playerId, position }) => {
              acc[playerId] = position;
              return acc;
            },
            {}
          );
          setPlayerList(newPositions);
        }
      };
    }
  }, [ws]);

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
                {/* // show same time in all players */}
                Time: {timeRemaining}{" "}
                <span className="text-green-500 font-bold text-base">
                  {plusThreeElement ? "+3" : ""}
                </span>
              </div>
            </div>
            {Object.entries(playerList).map(([id, position]) => (
              <img
                className="item"
                src="/avatar.png"
                key={id}
                id={id}
                alt="Monkey"
                style={{
                  top: position.y,
                  left: position.x,
                  position: "absolute",
                }}
              />
            ))}

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
        <div className="bg-gray-600 flex items-center justify-center h-screen">
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
