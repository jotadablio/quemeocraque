⚽ Quem é o Craque? ⚽

Bem-vindo ao repositório do "Quem é o Craque?", uma versão web moderna e online do clássico jogo "Cara-a-Cara" (Guess Who?), totalmente focada em lendas e estrelas do futebol!

Este projeto foi criado como um MVP (Minimum Viable Product) funcional, construído inteiramente num único ficheiro HTML, utilizando JavaScript puro e Tailwind CSS para a estilização.

🎯 O Conceito

A ideia é simples: permitir que dois ou mais amigos joguem "Cara-a-Cara" remotamente. O jogo é desenhado para ser jogado em simultâneo com uma ligação de voz (Discord, WhatsApp, Zoom, etc.), onde os jogadores fazem as suas perguntas de "sim" ou "não".

A aplicação web serve como o "tabuleiro virtual", permitindo que cada jogador elimine suspeitos e acompanhe o seu jogador secreto.

🎮 Como Jogar

A lógica para sincronizar o jogo entre os jogadores é simples e eficaz, baseada num "Seed" (Semente).

Combine um "Seed": Antes de começar, todos os jogadores devem combinar uma palavra-chave ou número. Pode ser qualquer coisa, como copa2002 ou champions123.

Insira o Seed: Todos os jogadores abrem o link do jogo e inserem exatamente o mesmo "Seed da Partida" no campo indicado.

Gere o Tabuleiro: Ao clicar em "Gerar Tabuleiro", o JavaScript usa o "Seed" para embaralhar a lista de 300 jogadores e selecionar os mesmos 25 jogadores para todos os participantes.

Receba o seu Secreto: O sistema irá então sortear localmente um "Jogador Secreto" para si, diferente para cada jogador.

Importante: O jogador que vê é o SEU jogador. É este que os seus amigos têm de adivinhar. Você deve usá-lo para responder "sim" ou "não" às perguntas deles.

Comece a Perguntar: Use a sua chamada de voz para fazer perguntas (ex: "O seu jogador joga na Europa?", "O seu jogador é brasileiro?").

Elimine os Suspeitos: Conforme recebe as respostas, clique nos cards dos jogadores no seu tabuleiro para os eliminar (eles ficarão a cinzento).

Vença o Jogo: O primeiro a adivinhar corretamente o jogador secreto do adversário vence!

🚀 Status do Projeto: MVP

Esta é a Versão 3 (v3), um MVP totalmente funcional.

Frontend: HTML5

Estilização: Tailwind CSS

Lógica: JavaScript (Vanilla JS)

Base de Dados: Um array local de 300 jogadores (lendas e atuais).

Funcionalidades Atuais:

Geração de tabuleiro sincronizado via "Seed".

Sorteio de jogador secreto individual.

Interface de eliminação por clique.

Design responsivo (desktop e mobile).

Placeholders coloridos baseados nas cores dos times/seleções.

🛣️ Próximos Passos (Roadmap)

O objetivo é transformar este MVP num produto mais polido.

[ ] UI/UX Melhorada: Substituir os placeholders por fotos reais dos jogadores.

[ ] App Mobile (PWA): Adicionar um "Service Worker" e "Manifest" para permitir que o site seja "instalado" no ecrã principal (Progressive Web App).

[ ] App Mobile (Nativo): Explorar o "empacotamento" do site num app real (via Capacitor ou React Native Webview) para publicação nas lojas (App Store e Play Store).

[ ] Backend (Opcional): Para uma V4 ou V5, criar um sistema de "salas" com backend (provavelmente Firebase/Firestore) para eliminar a necessidade do "Seed" manual e gerir as partidas automaticamente.

Sinta-se à vontade para testar, reportar bugs (Issues) ou sugerir melhorias!
