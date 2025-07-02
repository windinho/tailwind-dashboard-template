import { useRef, useCallback } from "react";
import * as d3 from "d3";

/**
 * Custom hook to enable D3 zooming and panning on an SVG element.
 * @param {object} svgRef - Ref to the SVG element
 * @param {object} contentRef - Ref to the inner content group to transform
 */
export function useD3Zoom(svgRef, contentRef) {
  const zoomRef = useRef({
    zoom: null,
    svg: null,
    content: null,
    currentTransform: d3.zoomIdentity,
  });

  /**
   * Initializes the D3 zoom behavior and attaches it to the SVG.
   */
  const setupZoom = useCallback(() => {
    if (!svgRef.current || !contentRef.current) return;

    const svg = d3.select(svgRef.current);
    const content = d3.select(contentRef.current);

    const zoom = d3.zoom().scaleExtent([0.5, 5]);

    // Apply zoom transform and hide tooltip if present
    zoom.on("zoom", (event) => {
      if (event.sourceEvent) {
        d3.select(".tooltip").style("opacity", 0);
      }
      content.attr("transform", event.transform);
      zoomRef.current.currentTransform = event.transform;
    });

    // Attach zoom to SVG and disable scroll/double-click zoom
    svg.call(zoom).on("wheel.zoom", null).on("dblclick.zoom", null);

    zoomRef.current = {
      zoom,
      svg,
      content,
      currentTransform: d3.zoomIdentity,
    };
  }, [svgRef, contentRef]);

  /**
   * Manually sets the current zoom transform (useful for custom transitions).
   */
  const setCurrentTransform = useCallback((transform) => {
    zoomRef.current.currentTransform = transform;
  }, []);

  /**
   * Zooms in by scaling up (max 5x).
   */
  const zoomIn = useCallback(() => {
    const { svg, zoom } = zoomRef.current;
    if (!svg || !zoom) return;

    const current = d3.zoomTransform(svgRef.current);
    const newScale = Math.min(current.k * 1.2, 5);
    const newTransform = d3.zoomIdentity
      .translate(current.x, current.y)
      .scale(newScale);

    svg.transition().duration(300).call(zoom.transform, newTransform);
  }, [svgRef]);

  /**
   * Zooms out by scaling down (min 0.5x).
   */
  const zoomOut = useCallback(() => {
    const { svg, zoom } = zoomRef.current;
    if (!svg || !zoom) return;

    const current = d3.zoomTransform(svgRef.current);
    const newScale = Math.max(current.k * 0.8, 0.5);
    const newTransform = d3.zoomIdentity
      .translate(current.x, current.y)
      .scale(newScale);

    svg.transition().duration(300).call(zoom.transform, newTransform);
  }, [svgRef]);

  return {
    setupZoom,
    zoomIn,
    zoomOut,
    setCurrentTransform,
    zoomRef,
  };
}
