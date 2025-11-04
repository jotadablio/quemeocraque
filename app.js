import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
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

// Importa a nossa micro-base de dados de jogadores
import { allPlayers } from './database.js';

// --- 2. CONFIGURAÇÃO DO FIREBASE ---

// PASSO CRUCIAL: COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI!
// (Copie e cole do seu projeto Firebase - Passo 2 que fizemos antes)
const firebaseConfig = {
  apiKey: "AIzaSyDXuNhUFz4z6x-SoI8jmlj9yuOhnNfRI1o",
  authDomain: "jogoquemeocraque.firebaseapp.com",
  projectId: "jogoquemeocraque",
  storageBucket: "jogoquemeocraque.firebasestorage.app",
  messagingSenderId: "703914878271",
  appId: "1:703914878271:web:7b16fc1d02e6ac46acdf8a",
  measurementId: "G-B339KXCEC1"
};

// --- 3. INICIALIZAÇÃO DA APLICAÇÃO ---

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Informa o ID da aplicação (substitua por 'default-app-id' se __app_id não estiver definido)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 4. O COMPONENTE PRINCIPAL (APP) ---

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efeito para autenticar o utilizador
  useEffect(() => {
    // Tenta autenticar-se anonimamente
    signInAnonymously(auth).catch(err => {
      console.error("Erro ao autenticar anonimamente:", err);
      setError("Não foi possível ligar ao servidor. Verifique as suas chaves do Firebase.");
    });

    // Observador para quando o estado de autenticação muda
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(true);
      }
    });

    // Limpa o observador quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  // --- RENDERIZAÇÃO ---

  if (error) {
    // Se houver um erro (ex: chaves do Firebase erradas)
    return (
      <div className="flex items-center justify-center h-full text-white bg-red-800 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Erro de Configuração</h1>
          <p className="text-lg">{error}</p>
          <p className="mt-4 text-sm">Por favor, verifique se copiou e colou corretamente as suas chaves do Firebase no ficheiro `app.js`.</p>
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

  // Efeito para "ouvir" as atualizações do jogo no Firestore
  useEffect(() => {
    if (!gameId) {
      setGameData(null);
      return; // Se não estamos numa sala, não há nada para ouvir
    }

    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);

    // onSnapshot: Ouve em tempo real!
    const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      } else {
        setGameData(null);
        setGameId(null);
        alert("A sala de jogo foi fechada ou não existe.");
      }
    }, (err) => {
      console.error("Erro ao ouvir o jogo:", err);
    });

    // Limpa o "ouvinte"
    return () => unsubscribe();
  }, [gameId]); // Re-executa se o gameId mudar

  // --- Funções de Ações do Jogo ---

  const handleCreateGame = async () => {
    const newGameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, newGameId);
    
    const newGameData = {
      status: 'lobby', // 'lobby', 'playing', 'finished'
      hostId: user.uid,
      players: [user.uid], // Lista de UIDs
      board: [], // Tabuleiro de 25 jogadores
      secretPlayers: {}, // Mapa de { userId: playerName }
      winners: [] // Lista de UIDs
    };

    try {
      await setDoc(gameDocRef, newGameData);
      setGameId(newGameId);
    } catch (err) {
      console.error("Erro ao criar jogo:", err);
    }
  };

  const handleJoinGame = async (idToJoin) => {
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, idToJoin);
    
    try {
      const docSnap = await getDoc(gameDocRef);
      if (docSnap.exists() && docSnap.data().status === 'lobby') {
        // Adiciona o jogador à lista
        await updateDoc(gameDocRef, {
          players: arrayUnion(user.uid)
        });
        setGameId(idToJoin);
      } else {
        alert("Sala não encontrada ou o jogo já começou.");
      }
    } catch (err) {
      console.error("Erro ao entrar no jogo:", err);
    }
  };

  const handleLeaveGame = () => {
    setGameId(null);
    setGameData(null);
    // (Numa versão completa, também removeríamos o jogador da lista no Firestore)
  };

  const handleStartGame = async () => {
    if (!gameData || gameData.hostId !== user.uid || gameData.players.length === 0) {
      return;
    }

    // 1. Embaralha e seleciona 25 jogadores para o tabuleiro
    // (A nossa micro-base só tem 10, por isso vamos usar todos)
    const shuffledAll = [...allPlayers].sort(() => 0.5 - Math.random());
    const boardPlayers = shuffledAll.slice(0, Math.min(25, allPlayers.length));

    // 2. Sorteia um jogador secreto para CADA jogador na sala
    const shuffledBoard = [...boardPlayers].sort(() => 0.5 - Math.random());
    const secretPlayers = {};
    gameData.players.forEach((playerId, index) => {
      const playerIndex = index % shuffledBoard.length;
      secretPlayers[playerId] = shuffledBoard[playerIndex].name;
    });

    // 3. Atualiza o Firestore
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
    await updateDoc(gameDocRef, {
      status: 'playing',
      board: boardPlayers.map(p => p.name), // Guarda só os nomes no board
      secretPlayers: secretPlayers
    });
  };

  const handleMakeGuess = async (guessName) => {
    if (!gameData) return;

    const mySecretName = gameData.secretPlayers[user.uid];
    
    if (guessName === mySecretName) {
      // Acertou!
      const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
      await updateDoc(gameDocRef, {
        winners: arrayUnion(user.uid)
      });
      alert("BOA! Você acertou!");
    } else {
      // Errou!
      alert("Errado! Tente novamente.");
    }
  };

  // --- RENDERIZAÇÃO DO CONTROLADOR ---

  if (!gameId || !gameData) {
    // Se não está num jogo, mostra o LOBBY
    return <Lobby onCreate={handleCreateGame} onJoin={handleJoinGame} />;
  }

  if (gameData.status === 'lobby') {
    // Se está no lobby, mostra a sala de espera
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
    // Se o jogo começou, mostra o JOGO
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
  
  // (Poderíamos adicionar um ecrã de 'finished' aqui)
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

  // Ecrã da Sala de Espera (dentro do lobby)
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
          disabled={gameData.players.length < 1} // Mínimo de 1 para testar
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
  const [eliminated, setEliminated] = useState({}); // Estado local de eliminação
  const [showGuessModal, setShowGuessModal] = useState(false);

  // O meu jogador secreto (o que eu tenho de adivinhar)
  const mySecretName = gameData.secretPlayers[user.uid];

  // Os jogadores secretos dos outros (para eu ver)
  const otherPlayersSecrets = useMemo(() => {
    return Object.keys(gameData.secretPlayers)
      .filter(playerId => playerId !== user.uid)
      .map((playerId, index) => {
        const playerIndex = gameData.players.indexOf(playerId) + 1 || index + 2;
        return {
          id: playerId,
          name: gameData.secretPlayers[playerId],
          title: `Jogador ${playerIndex}`
        };
      });
  }, [gameData, user.uid]);
  
  // Os 25 (ou 10) jogadores do tabuleiro
  const boardPlayers = useMemo(() => {
    // Mapeia os nomes do 'board' para os objetos completos da nossa 'allPlayers'
    return gameData.board.map(playerName => {
      return allPlayers.find(p => p.name === playerName);
    }).filter(Boolean); // Filtra caso algum não seja encontrado
  }, [gameData.board]);

  const toggleEliminated = (playerName) => {
    setEliminated(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };
  
  const handleGuess = (guessName) => {
    setShowGuessModal(false);
    onGuess(guessName);
  };
  
  const iAmWinner = gameData.winners.includes(user.uid);

  return (
    <div className="flex flex-col h-full text-white p-4">
      {/* Cabeçalho do Jogo */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sala: {gameId}</h1>
        <button
          onClick={onLeave}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          Sair do Jogo
        </button>
      </header>

      {/* Painel de Segredos (O que eu vejo) */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* O Meu Secreto (Escondido) */}
        <div className="flex-1 bg-gray-800 p-4 rounded-lg border-2 border-yellow-400">
          <h2 className="text-sm text-yellow-400 mb-2">O SEU JOGADOR SECRETO (Quem você é)</h2>
          {iAmWinner ? (
             <p className="text-3xl font-bold text-green-400">{mySecretName}</p>
          ) : (
             <p className="text-3xl font-bold">???</p>
          )}
          <p className="text-xs text-gray-300">Pergunte aos seus amigos "sim/não" para adivinhar!</p>
        </div>
        
        {/* O Secreto dos Outros (Visível) */}
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

      {/* Tabuleiro de Eliminação */}
      <div className="flex-1 grid grid-cols-5 gap-2 overflow-y-auto pr-2">
        {boardPlayers.map(player => (
          <PlayerCard
            key={player.name}
            player={player}
            isEliminated={!!eliminated[player.name]}
            onClick={() => toggleEliminated(player.name)}
          />
        ))}
      </div>
      
      {/* Botão de Palpite */}
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

      {/* Modal de Palpite */}
      {showGuessModal && (
        <GuessModal
          players={boardPlayers}
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuess}
        />
      )}
    </div>
  );
}

// --- 8. COMPONENTES DE UI (Pequenos) ---

// Card do Jogador no Tabuleiro
function PlayerCard({ player, isEliminated, onClick }) {
  if (!player) return null; // Segurança
  
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
        onError={(e) => e.target.src = 'https://placehold.co/150x150/cccccc/000000?text=Erro'}
      />
      <span className="block text-sm font-semibold p-1 truncate">
        {player.name}
      </span>
    </div>
  );
}

// Modal para dar o palpite final
function GuessModal({ players, onClose, onGuess }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full">
        <h2 className="text-2xl font-bold mb-4">Quem é você?</h2>
        <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
          {players.map(player => (
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
              />
              <span className="block text-sm font-semibold p-1 truncate">
                {player.name}
              </span>
            </div>
          ))}
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

// --- 9. INICIALIZAÇÃO DO REACT ---
// Encontra a div 'root' no index.html e renderiza a aplicação
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
