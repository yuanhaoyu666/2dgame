import "./styles.css";
import { Game } from "./systems/Game.js";

const canvas = document.querySelector("#game");
const hud = document.querySelector("#hud");

const game = new Game(canvas, hud);
game.start();
