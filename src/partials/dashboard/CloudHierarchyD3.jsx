import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import awsIcon from "/src/images/aws.svg";
import { useD3Zoom } from "../../utils/useD3Zoom"; // Custom hook for D3 zooming

// Color mapping for node types
const nodeColors = {
  cloud: "#1f77b4",
  aws: "#ff7f0e",
  gcp: "#2ca02c",
  saas: "#9467bd",
  service: "#d62728",
};

// Icon mapping (FontAwesome or image) for node types
const nodeIcons = {
  cloud: "\uf0c2",
  aws: awsIcon,
  gcp: "\uf0c2",
  saas: "\uf0ac",
  service: "\uf233",
};

// Determines circle color based on alert severity
function getSeverityColor(alerts) {
  if (alerts >= 100) return "#D32F2F"; // High
  if (alerts >= 50) return "#F57C00"; // Medium
  if (alerts > 0) return "#FBC02D"; // Low
  return "#9E9E9E"; // None
}

// Converts flat node-edge data into a tree structure
function buildHierarchy(data) {
  const map = new Map();
  data.nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
  data.edges.forEach(({ source, target }) => {
    const parent = map.get(source);
    const child = map.get(target);
    if (parent && child) parent.children.push(child);
  });
  return map.get("cloud"); // Root node
}

const CloudHierarchyD3 = ({ rawData }) => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const contentRef = useRef();
  const [useSeverityColors, setUseSeverityColors] = useState(false);
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Hook to manage zooming
  const { setupZoom, zoomIn, zoomOut, setCurrentTransform, zoomRef } =
    useD3Zoom(svgRef, contentRef);

  useEffect(() => {
    const data = buildHierarchy(rawData);
    if (!data) return;

    const containerWidth = size.width;
    const containerHeight = size.height;
    if (!containerWidth || !containerHeight) return;

    const margin = { top: 160, right: 160, bottom: 20, left: 120 };
    const centerY = margin.top + containerHeight / 2;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const defs = svg.append("defs");

    // svg
    //   .style("border-radius", "50px")
    //   .style("background", "linear-gradient(145deg, #97cbec, #7fabc7)")
    //   .style("box-shadow", "20px 20px 60px #78a2bc, -20px -20px 60px #a2dbfe");

    const gradientTypes = Object.keys(nodeColors);
    gradientTypes.forEach((type) => {
      const gradient = defs
        .append("radialGradient")
        .attr("id", `radial-${type}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(nodeColors[type]).brighter(1.5));

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", nodeColors[type]);
    });

    // Drop shadow filter
    const filter = defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const content = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${centerY})`);
    contentRef.current = content.node();

    setupZoom();

    // Create tree layout
    const tree = d3
      .tree()
      .nodeSize([140, 300])
      .separation(() => 1);

    const root = d3.hierarchy(data, (d) => d.children);
    root.x0 = 0;
    root.y0 = 0;

    root.descendants().forEach((d) => {
      d.x0 = d.x || 0;
      d.y0 = d.y || 0;
    });

    // Collapse all child nodes initially
    root.children?.forEach(collapse);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("transition", "opacity 0.3s ease");

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function expand(d) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    }

    // Renders alert or misconfig badge using HTML inside SVG
    function renderBadgeWithForeignObject(selection, type = "alert") {
      const isAlert = type === "alert";
      const width = 50;
      const icon = isAlert ? "\uf071" : "\uf1de";
      const labelKey = isAlert ? "alerts" : "misconfigs";

      selection
        .append("foreignObject")
        .attr("class", "badge")
        .attr("width", width)
        .attr("height", 40)
        .attr("x", isAlert ? -width - 5 : 5)
        .attr("y", -46)
        .append("xhtml:div")
        .attr("class", "badge-div")
        .html(
          (d) => `
      <div class="badge-content">
        <span class="fa-icon ${
          isAlert ? "badge-icon-alert" : "badge-icon-misconfig"
        }">${icon}</span>
        <span>${d.data[labelKey]}</span>
      </div>
    `
        );
    }

    function update(source) {
      tree(root);
      const nodes = root.descendants();
      const links = root.links();

      const yExtent = d3.extent(nodes, (d) => d.x);
      const layoutHeight = yExtent[1] - yExtent[0];
      const yOffset = -yExtent[0] + (containerHeight - layoutHeight) / 2;

      // Center tree vertically
      const newTransform = d3.zoomIdentity.translate(margin.left, yOffset);
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.zoom.transform, newTransform);

      defs.selectAll("linearGradient").remove();

      // Generate gradients for links
      links.forEach((link) => {
        const gradientId = `gradient-${link.source.data.id}-${link.target.data.id}`;
        const gradient = defs
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", link.source.y)
          .attr("y1", link.source.x)
          .attr("x2", link.target.y)
          .attr("y2", link.target.x);

        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", nodeColors[link.source.data.type] || "#999");
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", nodeColors[link.target.data.type] || "#ccc");
      });

      // Render nodes
      const node = content.selectAll("g.node").data(nodes, (d) => d.data.id);

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0},${source.x0})`)
        .style("cursor", (d) =>
          d.children || d._children ? "pointer" : "default"
        )
        .on("click", (ev, d) => {
          d.children ? collapse(d) : expand(d);
          update(d);
        })
        .on("mouseover", (ev, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${d.data.label}</strong><br/>Alerts: ${d.data.alerts}<br/>Misconfigs: ${d.data.misconfigs}`
            );
        })
        .on("mousemove", (ev) => {
          const [x, y] = d3.pointer(ev, document.body);
          tooltip.style("left", `${x}px`).style("top", `${y - 60}px`);
          d3.select(ev.currentTarget)
            .selectAll(".badge")
            .style("visibility", "hidden");
        })
        .on("mouseout", (ev) => {
          tooltip.style("opacity", 0);
          d3.select(ev.currentTarget)
            .selectAll(".badge")
            .style("visibility", "visible");
        });

      renderBadgeWithForeignObject(nodeEnter, "alert");
      renderBadgeWithForeignObject(nodeEnter, "misconfig");

      nodeEnter
        .append("circle")
        .attr("r", 0)
        .style("filter", "url(#drop-shadow)") // Apply shadow
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr("r", 20)
        .attr("fill", (d) =>
          useSeverityColors
            ? getSeverityColor(d.data.alerts)
            : `url(#radial-${d.data.type})`
        )
        .attr("stroke", "#333")
        .attr("stroke-opacity", 0.8);

      // Append node icons (SVG image or FontAwesome text)
      nodeEnter.each(function (d) {
        const group = d3.select(this);
        if (d.data.type === "aws") {
          group
            .append("image")
            .attr("href", nodeIcons[d.data.type])
            .attr("x", -12)
            .attr("y", -12)
            .attr("width", 24)
            .attr("height", 24);
        } else {
          group
            .append("text")
            .attr("class", "fa-icon node-icon")
            .attr("x", 0)
            .attr("y", 6)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "black")
            .text(nodeIcons[d.data.type] || "\uf059");
        }

        group
          .on("mouseenter", function () {
            d3.select(this)
              .select("circle")
              .transition()
              .duration(600)
              .ease(d3.easeElasticOut.period(0.2))
              .attr("r", 24)
              .attr("stroke-width", 2)
              .style("filter", "brightness(1.1)");
          })
          .on("mouseleave", function () {
            d3.select(this)
              .select("circle")
              .transition()
              .duration(200)
              .ease(d3.easeCubicOut) // smooth out on leave
              .attr("r", 20)
              .attr("stroke-width", 1)
              .style("filter", "url(#drop-shadow)");
          });
      });

      nodeEnter
        .append("text")
        .attr("dy", 40)
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .text((d) => d.data.label)
        .style("font-family", "Roboto, sans-serif")
        .style("font-weight", "bold")
        .style("font-size", "13px");

      // Update nodes
      const nodeUpdate = nodeEnter.merge(node);
      nodeEnter
        .transition()
        .delay((d, i) => i * 50)
        .duration(800)
        .ease(d3.easeBackOut)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .attr("fill", (d) =>
          useSeverityColors
            ? getSeverityColor(d.data.alerts)
            : `url(#radial-${d.data.type})`
        );

      nodeUpdate.select(".node-label").text((d) => d.data.label);

      // Exit old nodes
      node
        .exit()
        .transition()
        .duration(750)
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .remove()
        .select("circle")
        .attr("r", 1e-6);

      // Render links
      const link = content
        .selectAll("path.link")
        .data(links, (d) => d.target.data.id);

      const linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr(
          "stroke",
          (d) => `url(#gradient-${d.source.data.id}-${d.target.data.id})`
        )
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      linkEnter
        .attr("stroke-dasharray", "6,6")
        .attr("stroke-dashoffset", 100)
        .transition()
        .duration(1000)
        .ease(d3.easeSin)
        .attr("stroke-dashoffset", 0)
        .attr("d", (d) => diagonal(d.source, d.target));

      linkEnter
        .attr("stroke-dasharray", "6,6")
        .attr("stroke-dashoffset", 12)
        .style("animation", "dashMove .3s linear infinite");

      link
        .exit()
        .transition()
        .duration(750)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      // Save positions for next update
      nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Custom path generator for curved links
    function diagonal(s, d, offset = 100) {
      const midY = (s.y + d.y) / 2 + offset; // push control points horizontally

      return `
        M ${s.y} ${s.x}
        C ${midY} ${s.x},
          ${midY} ${d.x},
          ${d.y} ${d.x}
      `;
    }

    update(root);

    return () => {
      tooltip.remove();
    };
  }, [setupZoom, useSeverityColors, size]);

  return (
    <>
      <div ref={wrapperRef} className="container">
        <p>Distribution of Alerts and Misconfigurations</p>
        <div className="menubar">
          <label className="custom-checkbox">
            <input
              name="severity"
              type="checkbox"
              checked={useSeverityColors}
              onChange={(e) => setUseSeverityColors(e.target.checked)}
            />
            <span></span>
            Show Severity Colors
          </label>
          <div>
            <button onClick={zoomIn}>+</button>{" "}
            <button onClick={zoomOut}>-</button>{" "}
          </div>
        </div>
        <div className="svg-wrapper">
          <svg
            ref={svgRef}
            className="d3-svg"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        </div>
      </div>
    </>
  );
};

export default CloudHierarchyD3;
