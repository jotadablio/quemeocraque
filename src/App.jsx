import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion,
  collection,
  addDoc
} from 'firebase/firestore';

// --- 1B. BASE DE DADOS INTERNA ---
// A base de dados está incluída aqui para ser um ficheiro único e robusto.
const allPlayers = [
  {
    name: "Messi",
    img: "https://placehold.co/150x150/87CEEB/FFFFFF?text=Messi",
    color: "#87CEEB", // Cor da Argentina
    textColor: "#FFFFFF"
  },
  {
    name: "C. Ronaldo",
    img: "https://placehold.co/150x150/FF0000/FFFFFF?text=CR7",
    color: "#D2232A", // Cor de Portugal
    textColor: "#FFFFFF"
  },
  {
    name: "Pelé",
    img: "https://placehold.co/150x150/FFFF00/000000?text=Pel%C3%A9",
    color: "#FFDF00", // Cor do Brasil
    textColor: "#008026"
  },
  {
    name: "Maradona",
    img: "https://placehold.co/150x150/87CEEB/FFFFFF?text=Maradona",
    color: "#87CEEB", // Cor da Argentina
    textColor: "#FFFFFF"
  },
  {
    name: "Mbappé",
    img: "https://placehold.co/150x150/0000FF/FFFFFF?text=Mbapp%C3%A9",
    color: "#0055A4", // Cor da França
    textColor: "#FFFFFF"
  },
  {
    name: "Haaland",
    img: "https://placehold.co/150x150/ADD8E6/000000?text=Haaland",
    color: "#99D9EA", // Cor do Man City
    textColor: "#000000"
  },
  {
    name: "Neymar",
    img: "https://placehold.co/150x150/008000/FFFFFF?text=Neymar",
    color: "#009B3A", // Cor do Brasil (alternativa)
    textColor: "#FFFFFF"
  },
  {
    name: "Zidane",
    img: "https://placehold.co/150x150/0000FF/FFFFFF?text=Zidane",
    color: "#0055A4", // Cor da França
    textColor: "#FFFFFF"
  },
  {
    name: "Ronaldinho",
    img: "https://placehold.co/150x150/FFFFE0/000000?text=Ronaldinho",
    color: "#A50044", // Cor do Barcelona (alternativa)
    textColor: "#FFFFFF"
  },
  {
    name: "Vini. Jr",
    img: "https://placehold.co/150x150/FFFFFF/000000?text=Vini+Jr",
    color: "#FEBE10", // Cor do Real Madrid
    textColor: "#000000"
  }
];


// --- 2. CONFIGURAÇÃO DO FIREBASE ---

// As suas chaves do Firebase (confirmado que estão corretas)
const firebaseConfig = {
  apiKey: "AIzaSyDXuNhUFz4z6x-SoI8jm1j9yuOhnNFRl1o",
  authDomain: "jogoquemecraque.firebaseapp.com",
  projectId: "jogoquemecraque",
  storageBucket: "jogoquemecraque.firebasestorage.app",
  messagingSenderId: "703914878271",
  appId: "1:703914878271:web:7b16fc1d02e6acdf8a"
};

// --- 3. INICIALIZAÇÃO DA APLICAÇÃO ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 4. O COMPONENTE PRINCIPAL (APP) ---

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efeito para autenticar o utilizador
  useEffect(() => {
    // Tenta fazer o login anónimo
    signInAnonymously(auth).catch(err => {
      // Se falhar (ex: Auth Anónima desligada), define o erro
      console.error("Erro ao autenticar anonimamente:", err);
      setError("Não foi possível ligar ao servidor. Verifique as suas chaves do Firebase e as regras de segurança.");
    });

    // Ouve as mudanças de estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Sucesso!
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // Não é um erro, apenas significa que o utilizador não está logado
        setUser(null);
        setIsLoading(true);
      }
    });

    // Limpa o "ouvinte" quando o componente "desmonta"
    return () => unsubscribe();
  }, []);

  // --- RENDERIZAÇÃO ---

  if (error) {
    // ECRÃ VERMELHO DE ERRO
    // (Aparece se o signInAnonymously falhar)
    return (
      <div className="flex items-center justify-center h-full text-white bg-red-800 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Erro de Configuração</h1>
          <p className="text-lg">{error}</p>
          <p className="mt-4 text-sm">Por favor, verifique se copiou e colou corretamente as suas chaves do Firebase no ficheiro `src/App.jsx` e se ativou a 'Autenticação Anónima' e o 'Firestore (Modo de Teste)' no seu painel do Firebase.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    // Ecrã de carregamento enquanto autentica
    return (
      <div className="flex items-center justify-center h-full text-white">
        A ligar ao servidor...
      </div>
    );
  }

  // Se estiver tudo OK, mostra o Jogo
  return <GameController user={user} />;
}

// --- 5. O CONTROLADOR DO JOGO ---

function GameController({ user }) {
  const [gameId, setGameId] = useState(null); // ID da sala (ex: ABC12)
  const [gameData, setGameData] = useState(null); // Dados do jogo (do Firestore)

  // Efeito para "ouvir" a sala de jogo
  useEffect(() => {
    if (!gameId) {
      setGameData(null);
      return; 
    }

    // O caminho correto: coleção "games", documento "gameId"
    const gameDocRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      } else {
        // A sala foi apagada ou não existe
        setGameData(null);
        setGameId(null);
        console.warn("A sala de jogo foi fechada ou não existe.");
      }
    }, (err) => {
      console.error("Erro ao ouvir o jogo:", err);
    });

    return () => unsubscribe();
  }, [gameId]); 

  // Função para CRIAR um jogo
  const handleCreateGame = async () => {
    const newGameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const gameDocRef = doc(db, "games", newGameId);
    
    const newGameData = {
      status: 'lobby', 
      hostId: user.uid,
      players: [user.uid], 
      board: [], 
      secretPlayers: {}, 
      winners: [] 
    };

    try {
      await setDoc(gameDocRef, newGameData);
      setGameId(newGameId);
    } catch (err) {
      console.error("Erro ao criar jogo:", err);
      // (As suas REGRAS DO FIRESTORE podem estar a bloquear isto)
    }
  };

  // Função para ENTRAR num jogo
  const handleJoinGame = async (idToJoin) => {
    if (!idToJoin) return;

    const gameDocRef = doc(db, "games", idToJoin);
    
    try {
      const docSnap = await getDoc(gameDocRef);
      if (docSnap.exists() && docSnap.data().status === 'lobby') {
        // Adiciona o utilizador à lista de jogadores
        await updateDoc(gameDocRef, {
          players: arrayUnion(user.uid)
        });
        setGameId(idToJoin);
      } else {
        console.warn("Sala não encontrada ou o jogo já começou.");
      }
    } catch (err) {
      console.error("Erro ao entrar no jogo:", err);
    }
  };

  // Função para SAIR do jogo (voltar ao Lobby)
  const handleLeaveGame = () => {
    setGameId(null);
    setGameData(null);
  };

  // Função para COMEÇAR o jogo (só o Host)
  const handleStartGame = async () => {
    if (!gameData || gameData.hostId !== user.uid || gameData.players.length === 0) {
      return;
    }

    // Embaralha a base de dados
    const shuffledAll = [...allPlayers].sort(() => 0.5 - Math.random());
    // Pega nos primeiros 25 (ou menos, se a BD for pequena)
    const boardPlayers = shuffledAll.slice(0, Math.min(25, allPlayers.length));

    // Atribui um jogador secreto a cada um
    const shuffledBoard = [...boardPlayers].sort(() => 0.5 - Math.random());
    const secretPlayers = {};
    gameData.players.forEach((playerId, index) => {
      const playerIndex = index % shuffledBoard.length;
      secretPlayers[playerId] = shuffledBoard[playerIndex].name;
    });

    const gameDocRef = doc(db, "games", gameId);
    await updateDoc(gameDocRef, {
      status: 'playing',
      board: boardPlayers.map(p => p.name), 
      secretPlayers: secretPlayers
    });
  };

  // Função para DAR PALPITE
  const handleMakeGuess = async (guessName) => {
    if (!gameData) return;

    const mySecretName = gameData.secretPlayers[user.uid];
    
    if (guessName === mySecretName) {
      // Acertou!
      const gameDocRef = doc(db, "games", gameId);
      await updateDoc(gameDocRef, {
        winners: arrayUnion(user.uid)
      });
      console.log("BOA! Você acertou!");
    } else {
      console.warn("Errado! Tente novamente.");
    }
  };

  // --- Renderização do Controlador ---

  if (!gameId || !gameData) {
    return <Lobby onCreate={handleCreateGame} onJoin={handleJoinGame} />;
  }
  if (gameData.status === 'lobby') {
    return (
      <Lobby
        gameId={gameId}
        gameData={gameData}
        user={user}
        onLeave={handleLeaveGame}
        onStart={handleStartGame}
      />
    );
  }
  if (gameData.status === 'playing') {
    return (
      <Game
        gameId={gameId}
        gameData={gameData}
        user={user}
        onGuess={handleMakeGuess}
        onLeave={handleLeaveGame}
      />
    );
  }
  
  return <div>Jogo terminado.</div>;
}

// --- 6. COMPONENTES DE UI (LOBBY) ---

function Lobby({ gameId, gameData, user, onCreate, onJoin, onLeave, onStart }) {
  const [joinInput, setJoinInput] = useState('');

  if (!gameId) {
    // Ecrã inicial para Criar ou Entrar
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <h1 className="text-5xl font-bold mb-10">Quem é o Craque?</h1>
        <button
          onClick={onCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-2xl"
        >
          Criar Novo Jogo
        </button>
        <div className="my-8 text-gray-400">ou</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            placeholder="Código da Sala"
            maxLength={5}
            className="p-3 rounded-lg text-xl text-black"
          />
          <button
            onClick={() => onJoin(joinInput)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // Ecrã da Sala de Espera
  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-8">
      <h2 className="text-2xl text-gray-400 mb-2">Código da Sala:</h2>
      <div className="text-6xl font-bold text-yellow-400 mb-8 tracking-widest">{gameId}</div>
      <h3 className="text-xl font-semibold mb-4">Jogadores na Sala:</h3>
      <ul className="text-lg mb-8">
        {gameData.players.map((playerId, index) => (
          <li key={playerId} className="mb-1">
            Jogador {index + 1} {playerId === user.uid ? "(Você)" : ""}
          </li>
        ))}
      </ul>
      {gameData.hostId === user.uid ? (
        <button
          onClick={onStart}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-2xl mb-4"
          disabled={gameData.players.length < 1} // Pode mudar para 2 se quiser min 2 jogadores
        >
          Começar Jogo!
        </button>
      ) : (
        <div className="text-xl text-gray-300 mb-4">A aguardar o Host começar o jogo...</div>
      )}
      <button
        onClick={onLeave}
        className="text-sm text-gray-400 hover:text-red-500"
      >
        Sair da Sala
      </button>
    </div>
  );
}

// --- 7. COMPONENTES DE UI (JOGO) ---

function Game({ gameId, gameData, user, onGuess, onLeave }) {
  const [eliminated, setEliminated] = useState({}); 
  const [showGuessModal, setShowGuessModal] = useState(false);

  const mySecretName = gameData.secretPlayers[user.uid];

  const otherPlayersSecrets = useMemo(() => {
    return Object.keys(gameData.secretPlayers)
      .filter(playerId => playerId !== user.uid)
      .map((playerId, index) => {
        const playerIndex = gameData.players.indexOf(playerId);
        const playerTitle = playerIndex !== -1 ? `Jogador ${playerIndex + 1}` : `Jogador ${index + 2}`;
        
        return {
          id: playerId,
          name: gameData.secretPlayers[playerId],
          title: playerTitle
        };
      });
  }, [gameData, user.uid]);
  
  const boardPlayers = useMemo(() => {
    return gameData.board.map(playerName => {
      return allPlayers.find(p => p.name === playerName);
    }).filter(Boolean); 
  }, [gameData.board]);

  const toggleEliminated = (playerName) => {
    setEliminated(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };
  
  const handleGuess = (guessName) => {
    setShowGuessModal(false);
    onGuess(guessName);
  };
  
  const iAmWinner = gameData.winners.includes(user.uid);

  const handleError = (e) => {
    e.target.src = 'https://placehold.co/150x150/cccccc/000000?text=Erro';
  };

  return (
    <div className="flex flex-col h-full text-white p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sala: {gameId}</h1>
        <button
          onClick={onLeave}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          Sair do Jogo
        </button>
      </header>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 bg-gray-800 p-4 rounded-lg border-2 border-yellow-400">
          <h2 className="text-sm text-yellow-400 mb-2">O SEU JOGADOR SECRETO (Quem você é)</h2>
          {iAmWinner ? (
             <p className="text-3xl font-bold text-green-400">{mySecretName}</p>
          ) : (
             <p className="text-3xl font-bold">???</p>
          )}
          <p className="text-xs text-gray-300">Pergunte aos seus amigos "sim/não" para adivinhar!</p>
        </div>
        <div className="flex-1 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400 mb-2">QUEM OS OUTROS SÃO</h2>
          {otherPlayersSecrets.length > 0 ? (
            otherPlayersSecrets.map(p => (
              <p key={p.id} className="text-lg font-semibold">
                {p.title}: <span className="text-blue-300">{p.name}</span>
              </p>
            ))
          ) : (
            <p className="text-gray-500">A aguardar outros jogadores...</p>
          )}
        </div>
      </div>
      <div className="flex-1 grid grid-cols-5 gap-2 overflow-y-auto pr-2">
        {boardPlayers.map(player => (
          <PlayerCard
            key={player.name}
            player={player}
            isEliminated={!!eliminated[player.name]}
            onClick={() => toggleEliminated(player.name)}
            handleError={handleError}
          />
        ))}
      </div>
      {!iAmWinner && (
        <button
          onClick={() => setShowGuessModal(true)}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
        >
          Dar Palpite!
        </button>
      )}
      {iAmWinner && (
         <div className="mt-4 w-full bg-green-900 text-green-300 font-bold py-4 px-8 rounded-lg text-xl text-center">
          🎉 Você Venceu! A aguardar os outros...
        </div>
      )}
      {showGuessModal && (
        <GuessModal
          players={boardPlayers}
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuess}
          handleError={handleError}
        />
      )}
    </div>
  );
}

// --- 8. COMPONENTES DE UI (Pequenos) ---

function PlayerCard({ player, isEliminated, onClick, handleError }) {
  if (!player) return null; 
  
  const style = {
    backgroundColor: player.color,
    color: player.textColor || '#000000',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg shadow-md overflow-hidden text-center cursor-pointer transition-all duration-300 ${isEliminated ? 'opacity-20 filter grayscale' : 'hover:scale-105'}`}
      style={style}
    >
      <img
        src={player.img}
        alt={player.name}
        className="w-full h-20 md:h-24 object-cover object-top"
        onError={handleError}
      />
      <span className="block text-sm font-semibold p-1 truncate">
        {player.name}
      </span>
    </div>
  );
}

function GuessModal({ players, onClose, onGuess, handleError }) {
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full">
        <h2 className="text-2xl font-bold mb-4">Quem é você?</h2>
        <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
          {players.map(player => {
            return (
              <div
                key={player.name}
                onClick={() => onGuess(player.name)}
                className="rounded-lg shadow-md overflow-hidden text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:border-2 hover:border-yellow-400"
                style={{ backgroundColor: player.color, color: player.textColor }}
              >
                <img
                  src={player.img}
                  alt={player.name}
                  className="w-full h-20 md:h-24 object-cover object-top"
                  onError={handleError}
                />
                <span className="block text-sm font-semibold p-1 truncate">
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
