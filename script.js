const svg = d3.select("#pokebola")
    .attr("width", 600)
    .attr("height", 600);

const pokeballPos = [150, 150]; // POSIÇÃO DA POKEBOLA NA TELA

const group = svg.append("g").attr("transform", `translate(${pokeballPos[0]}, ${pokeballPos[1]})`);

const ball = group.append("ellipse")
    .attr("cx", 150)
    .attr("cy", 150)
    .attr("rx", 35)
    .attr("ry", 35)
    .attr("fill", "gray")
    .attr("stroke", "black")
    .attr("stroke-width", 5)
    .call(d3.drag()
    .on("start", function(event) {
        d3.select(this).attr("fill", "red");
        })
        .on("drag", function(event) {
        d3.select(this)
            .attr("cx", event.x)
            .attr("cy", event.y);
        })
        .on("end", function(event) {
        d3.select(this).attr("fill", "gray")
        .transition()
        .attr("cx", 150)
        .attr("cy", 150);
        })
    );