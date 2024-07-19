import React from 'react';
import * as d3 from 'd3';
import { useRef, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function NetworkGraph({ data }) {
    const gdkTheme = Cookies.get('gdkTheme');
    let template;
    if (gdkTheme == 'dark') {
        template = {
            label: "white",
            node: "#c1c1c1",
            stroke: "#999"
        };
    } else {
        template = {
            label: '#1c1c1c',
            node: '#444',
            stroke: "#444"
        };
    }
    const svgRef = useRef(null);

    useEffect(() => {
        const width = 800;
        const height = 600;
        // Create an svg container
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);
        // Clear out previous nodes
        svg.selectAll("*").remove();

        if (data.nodes.length == 0) {
            svg.append('text')
                .text('Empty data passed to the graph')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('fill', 'gray');
            return;
        }
        // Use d3-force to create the network graph
        const simulation = d3
            .forceSimulation()
            // Allocate coordinates for the vertices
            .nodes(data.nodes)
            // Link
            .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(d => {
                return -10 * (d.size | 10);
            }))
            // For setting the center of gravity of the system
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(20));

        // Create links
        const links = svg.append('g')
            .selectAll('line')
            .data(data.links)
            .enter()
            .append('line')
            .attr("stroke", template.stroke)
            .attr("stroke-opacity", 0.6)
            .attr('stroke-width', 1);

        // Create nodes
        const nodes = svg.append('g')
            .selectAll('circle')
            .data(data.nodes)
            .enter()
            .append('circle')
            .attr('r', d => (d.size ? d.size : 10))
            .attr('fill', template.node);

        // Add labels to nodes
        const labels = svg.append('g')
            .selectAll('text')
            .data(data.nodes)
            .enter()
            .append('text')
            .text(d => d.id.toUpperCase())
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', template.label);

        // Define tick function for the simulation
        function ticked() {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y - (d.size || 10) - 5);
        }

        function clamp(x, lo, hi) {
            return x < lo ? lo : x > hi ? hi : x;
        }
        function click(event, d) {
            delete d.fx;
            delete d.fy;
            d3.select(this).classed("fixed", false);
            simulation.alpha(1).restart();
        }

        function dragstart() {
            d3.select(this).classed("fixed", true);
        }

        function dragged(event, d) {
            d.fx = clamp(event.x, 0, width);
            d.fy = clamp(event.y, 0, height);
            simulation.alpha(1).restart();
        }
        const drag = d3
            .drag()
            .on("start", dragstart)
            .on("drag", dragged);

        nodes.call(drag).on("click", click);
        simulation.on('tick', ticked);
    }, [data]);

    return (
        <svg ref={svgRef}>
            {/* Render the graph here */}
        </svg>
    )
}