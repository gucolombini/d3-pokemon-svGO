const svg = d3.select("#pokebola")
    .attr("width", 600)
    .attr("height", 600);

let drag = false;
const shinyRate = 30;
const shinyRoll = Math.round(Math.random()*shinyRate);
console.log(shinyRoll)
const trapinchFile = shinyRoll === 0 ? "assets/trapinch shiny.svg" : "assets/trapinch.svg";

const startPos = [150, 150]; // INFLUENCIA POSIÇÃO INICIAL NA TELA

const ballStartPos = [150, 230];
let pokeballRot = 0;
let pokeballRotVelocity = 0;
let trapinchRot = 0;
let lastMousePos = [];
let lastAngle = 0;
let deltaXMean = 0;
let deltaYMean = 0;
let ballThrown = false;
let isCatchSequence = false;

const group = svg.append("g").attr("transform", `translate(${startPos[0]}, ${startPos[1]})`);

const sparkleContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
sparkleContainer.id = "sparkle-container";
group.node().appendChild(sparkleContainer);

fetch(trapinchFile)
    .then(response => response.text())
    .then(data => {
        const parser = new DOMParser();
        const trapinch = parser.parseFromString(data, "image/svg+xml").documentElement;
        group.node().appendChild(trapinch);
        
        const head = d3.select(trapinch).select("#head");
        const body = d3.select(trapinch).select("#body");      
        const frontLegs = d3.select(trapinch).select("#front_legs");
        const backLegs = d3.select(trapinch).select("#back_legs");
        idleAnimation(head, body, frontLegs);
        loadPokeball();
    });

function idleAnimation(head, body, frontLegs) {
    animateHead(head);
    animateBody(body);
    animateLegs(frontLegs);
    if(shinyRoll == 0) {
        shinySparkle();
    }
}

function animateHead(head) {
    head.transition()
        .ease(d3.easeSin)
        .duration(500)
        .attr("transform", "rotate(-5, 150, 150)")
        .transition()
        .ease(d3.easeBounce)
        .duration(700)
        .attr("transform", "rotate(0, 250, 200)")
        .on("end", () => animateHead(head));
}

function animateBody(body) {
    body.transition()
        .ease(d3.easeSin)
        .duration(500)
        .attr("transform", "rotate(-2, 150, 150)")
        .transition()
        .ease(d3.easeBackOut.overshoot(4))
        .duration(700)
        .attr("transform", "rotate(0, 250, 200)")
        .on("end", () => animateBody(body));
}

function animateLegs(legs) {
        legs.transition()
        .ease(d3.easeSin)
        .duration(500)
        .attr("transform", "rotate(-1, 150, 150)")
        .transition()
        .ease(d3.easeBackOut.overshoot(4))
        .duration(700)
        .attr("transform", "rotate(0, 250, 200)")
        .on("end", () => animateLegs(legs));
}

function shinySparkle() {
    setTimeout(function() {
        if(!isCatchSequence){
            createSparkle(120, 90, 0, ["#ffffff"], 1.5)
        }
        shinySparkle();
      }, 60);
}

function loadPokeball() {
    fetch("assets/pokeball.svg")
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const pokeball = parser.parseFromString(data, "image/svg+xml").documentElement;

            const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
            wrapper.appendChild(pokeball);
            group.node().appendChild(wrapper);
            const ball = d3.select(pokeball).select("#ball");

            ball.on("tick", rotatePokeball(ball));

            d3.select(wrapper).attr("transform", `translate(${ballStartPos[0]-35}, ${ballStartPos[1]-35})`)
            .call(d3.drag()
            .on("start", function(event) {
                lastMousePos = [event.x, event.y]
                lastAngle = Math.atan2(dy, dx);
            })
            .on("drag", function(event) {
                if(!isCatchSequence){
                    const dx = event.x - lastMousePos[0];
                    const dy = event.y - lastMousePos[1];
                    const newAngle = Math.atan2(dy, dx);
                    if (lastMousePos) {
                        let deltaX = event.x - lastMousePos[0];
                        let deltaY = event.y - lastMousePos[1];
                        let speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                        let angleDiff = newAngle - lastAngle;
                        pokeballRotVelocity += angleDiff * speed * 1; // Adjust rotation speed
                        deltaYMean = deltaYMean*0.7 + deltaY
                        deltaXMean = deltaXMean*0.7 + deltaX
                        console.log(deltaXMean)
                        if (Math.abs(speed) > 30) {
                            createSparkle(event.x, event.y, 100, null, 0);
                        }
                    }
                    lastMousePos = [event.x, event.y]
                    lastAngle = newAngle;
                
                    d3.select(this)
                        .attr("transform", `translate(${event.x-35}, ${event.y-35})`)
                }
            })
            .on("end", function(event) {
                if(!isCatchSequence){
                    pokeballRot = 0;
                    if (deltaYMean < -80) {
                        console.log("throw!")
                        throwBall(d3.select(this), event.x-35, event.y-35);
                    } else {
                        deltaYMean = 0;
                        d3.select(this)
                            .transition()
                            .attr("transform", `translate(${ballStartPos[0]-35}, ${ballStartPos[1]-35})`);
                    }
                }
                
            })
            );
        });
}

function rotatePokeball(ball) {
    if (!isCatchSequence){
        pokeballRot += pokeballRotVelocity
        pokeballRotVelocity = pokeballRotVelocity*0.97
        if(pokeballRot >= 360) {
            while(pokeballRot > 360) {
                pokeballRot -= 360;
            }
        } else if(pokeballRot < 0) {
            while(pokeballRot < 0) {
                pokeballRot += 360;
            }
        }
        ball.transition()
            .duration(12)
            .attr("transform", `rotate(${pokeballRot}, 35, 35)`)
            .on("end", () => rotatePokeball(ball));
    }
}

function throwBall(ball, lastPosX, lastPosY) {
    ballThrown = true;
    let currentX = lastPosX;
    let currentY = lastPosY;
    const targetX = 20+Math.random()*100;
    const targetY = -60+Math.random()*50;
    
    const stepAmount = 50;
    const stepX = (currentX - targetX) / stepAmount;
    let currSteps = 0;
    
    const initialVelocityY = -15;
    const gravity = 0.5;
    let velocityY = initialVelocityY;
    
    console.log("Starting throw from", currentX, currentY, "to", targetX, targetY);
    stepCounter();
    
    function stepCounter() {
        createSparkle(currentX+35+(Math.random()-0.5)*10, currentY+35+(Math.random()-0.5)*10, 0, null, 0);
        currentX = currentX - stepX + deltaXMean*((stepAmount/2)-currSteps)/500;
        velocityY += gravity;
        currentY += velocityY;

        const remainingSteps = stepAmount - currSteps;
        if (remainingSteps > 0) {
            const correction = (targetY - currentY) / remainingSteps;
            currentY += correction * 0.3;
        }
        
        ball.transition()
            .duration(10)
            .attr("transform", `translate(${currentX}, ${currentY})`)
            .on("end", function() {
                currSteps++;
                if (currSteps < stepAmount) {
                    stepCounter();
                } else {
                    console.log("Ball landed at", targetX, targetY);
                    pokeballRot = 0;
                    pokeballRotVelocity = 0;
                    isCatchSequence = true;
                    trapinchDisappear(currentX-35, currentY-35);
                    d3.select(pokeball).select("#ball").transition()
                        .ease(d3.easeLinear)
                        .duration(10)
                        .attr("transform", `rotate(0, 35, 35)`)
                    ball.transition()
                        .ease(d3.easeBounce)
                        .duration(1500)
                        .attr("transform", `translate(${currentX}, ${currentY})`)
                        .transition()
                        .duration(1000)
                        .attr("transform", `translate(${currentX}, ${ballStartPos[1]-35})`)
                        .on("end", function() { catchSequence(currentX, 0); })
                }
            });
    }

    function catchSequence(currentX, shakeCount) {
        console.log("COMMENCE SHAKING")
        const fleeChance = 0.3 // 30% per shake
        d3.select(pokeball).select("#ball").transition()
            .ease(d3.easeBounceOut)
            .duration(200)
            .attr("transform", `rotate(-10, 35, 35)`)
            .transition()
            .duration(200)
            .attr("transform", `rotate(12, 35, 35)`)
            .transition()
            .duration(1000)
            .attr("transform", `rotate(0, 35, 35)`)
            .on("end", function() {
                if (Math.random() < fleeChance) {
                    console.log("not caught!")
                    ball.select("#light").transition().attr("stop-color", "#ff0000")
                    ball.select("#light2").transition().attr("stop-color", "#ff0000")
                    trapinchReappear();
                } else {
                    if (shakeCount < 2) {
                        catchSequence(currentX, shakeCount+1);
                    } else {
                        console.log("caught!")
                        ball.select("#light").transition().attr("stop-color", "#00eeff")
                        ball.select("#light2").transition().attr("stop-color", "#00eeff")
                    }
                }
            });
    }
}

function trapinchDisappear(ballX, ballY) {
    d3.select(trapinch).selectAll("*").interrupt();
    d3.select(trapinch)
    .style("transform-origin", "center center")
    .transition()
    .ease(d3.easeSin)
    .duration(1000)
    .attr("transform", `translate(${ballX}, ${ballY}) scale(0, 0) translate(${-ballX}, ${-ballY})`)
}

function trapinchReappear() {
    const pokemon = d3.select(trapinch);
    idleAnimation(pokemon.select("#head"), pokemon.select("#body"), pokemon.select("#front_legs"))
    pokemon
    .style("transform-origin", "center center")
    .transition()
    .ease(d3.easeSin)
    .duration(10)
    .attr("transform", "translate(0, 0) scale(0, 0) translate(0, 0)")
    .transition()
    .ease(d3.easeSin)
    .duration(1000)
    .attr("transform", "translate(0, 0) scale(1, 1) translate(0, 0)")
    ballThrown = false;
    isCatchSequence = false;
    rotatePokeball(d3.select(pokeball).select("#ball"));
}

function createSparkle(x, y, gravity, colorsArray, randomness) {
    const sparkleContainer = d3.select("#sparkle-container");
    const yGrav = gravity;

    const numParticles = (Math.floor(Math.random() * 3) + 1);

    let colors = ["#ffcc00", "#fffdc0", "#fffb87"];
    if(colorsArray) {
        colors = colorsArray;
    }
    let randomValue = 1;
    if(randomness || randomness === 0) {
        randomValue = randomness;
    }
    
    for (let i = 0; i < numParticles; i++) {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const size = Math.random() * 5 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const sparkle = sparkleContainer.append("circle")
            .attr("cx", x + offsetX*randomValue)
            .attr("cy", y + offsetY*randomValue)
            .attr("r", size)
            .attr("fill", color)
            .attr("opacity", 0.8);

        sparkle.transition()
            .duration(800)
            .attr("r", size * 0.2)
            .attr("cx", x + offsetX*randomValue + (Math.random() - 0.5) * 50)
            .attr("cy", y + offsetY*randomValue + yGrav + (Math.random() - 0.5) * 50)
            .attr("opacity", 0)
            .ease(d3.easeQuadOut)
            .on("end", function() {
                sparkle.remove();
            });
    }
}