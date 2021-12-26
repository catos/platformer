import Player from "./player.js";
const throwIfNull = (value, failureMessage) => {
    if (value === null) {
        throw new Error(failureMessage);
    }
    return value;
};
// ---------------------------------------------
const canvas = throwIfNull(document.body.querySelector("#canvas1"), "Canvas could not be found");
canvas.width = 800;
canvas.height = 600;
const context = throwIfNull(canvas.getContext("2d"), "Canvas context is missing!");
// ---------------------------------------------
const player = new Player(canvas.width / 2, canvas.height / 2);
// ---------------------------------------------
let lastTime = 0;
function loop(time) {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // ...
    player.update(deltaTime);
    player.draw(context);
    requestAnimationFrame(loop);
}
loop(0);
