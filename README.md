# MusicTrivia App 
This is a multiplayer trivia game that uses multiple screens. It was built using socket.io and express. The trivia questions are all music related. Each round is 20 questions .

### Dependencies
- express
- socket.io
- jquery
- path

### Install
1. Install the dependencies
2. run it by typing node index.js into console
3. visit localhost:1000
4. play the game! :) 


## How to Play
#### Setup
1. Ensure all the screens have access to the same local server
2. Run the code
3. On the screen you want the questions to be on visit localhost:1000 and click CREATE
4. On the player screens visit loclhost:1000 and click JOIN
5. Follow the instructions on the Join screen to enter the game
#### Playing
1. A question will appear on the main screen
2. Each player can pick an answer until someone gets it right
3. If you get it wrong its -3 pts
4. The first person to get it right gets +5 points
5. Each round is 20 question the person with the most points at the end wins 
