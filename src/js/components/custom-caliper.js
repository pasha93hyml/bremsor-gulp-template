/**
 * Class representing an annotation system for product images
 * @class
 */
export class ImageAnnotationSystem {
  /**
   * Create an annotation system
   * @param {Object} options - Configuration options
   * @param {string} options.imageContainerClass - ID of the container holding the image
   * @param {Array<Object>} options.annotations - Array of annotation configurations
   * @param {string} options.svgId - ID of the SVG element for drawing lines
   */
  constructor(options) {
    this.imageContainerClass =
      options.imageContainerClass || "js-custom-caliper-container";
    this.annotations = options.annotations || [];
    this.svgId = options.svgId || "annotation-svg";
    this.lines = [];
    this.endDots = [];
    this.initialized = false;
  }

  /**
   * Initialize the annotation system
   * @returns {this}
   */
  initialize() {
    this.container = document.querySelector(`.${this.imageContainerClass}`);
    if (!this.container) {
      console.error("Container element not found");
      return this;
    }

    this.svg = document.getElementById(this.svgId);
    if (!this.svg) {
      console.error("SVG element not found");
      return this;
    }

    this.annotations.forEach((annotation, index) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("id", `line-${index}`);
      line.setAttribute("stroke", annotation.lineColor || "white");
      line.setAttribute("stroke-width", annotation.lineWidth || 1);
      this.svg.appendChild(line);
      this.lines.push(line);

      const endDot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      endDot.setAttribute("id", `end-dot-${index}`);
      endDot.setAttribute("r", "5");
      endDot.setAttribute("fill", annotation.lineColor || "white");
      this.svg.appendChild(endDot);
      this.endDots.push(endDot);
    });

    this.initialized = true;

    this.updateLines();

    window.addEventListener("resize", this.handleResize.bind(this));

    return this;
  }

  /**
   * Handle window resize event
   * @returns {void}
   */
  handleResize() {
    this.updateLines();
  }

  /**
   * Calculate the position of a dot element relative to the SVG
   * @param {HTMLElement} dotElement - The dot element
   * @param {DOMRect} svgRect - The bounding rectangle of the SVG
   * @returns {Object} The x and y coordinates
   */
  calculateDotPosition(dotElement, svgRect) {
    const dotRect = dotElement.getBoundingClientRect();
    return {
      x: dotRect.left + dotRect.width / 2 - svgRect.left,
      y: dotRect.top + dotRect.height / 2 - svgRect.top,
    };
  }

  /**
   * Calculate the target point on the image
   * @param {Object} dotPosition - The position of the dot
   * @param {Object} targetOffset - The offset to apply
   * @returns {Object} The target x and y coordinates
   */
  calculateTargetPoint(dotPosition, targetOffset) {
    return {
      x: dotPosition.x + (targetOffset.x || 0),
      y: dotPosition.y + (targetOffset.y || 0),
    };
  }

  /**
   * Update the positions of all annotation lines
   * @returns {void}
   */
  updateLines() {
    if (!this.initialized) {
      return;
    }

    const svgRect = this.svg.getBoundingClientRect();

    this.annotations.forEach((annotation, index) => {
      const dotElement = document.getElementById(annotation.dotId);
      const line = this.lines[index];
      const endDot = this.endDots[index];

      if (!dotElement || !line || !endDot) {
        return;
      }

      const dotPosition = this.calculateDotPosition(dotElement, svgRect);
      const targetPoint = this.calculateTargetPoint(
        dotPosition,
        annotation.targetOffset,
      );

      line.setAttribute("x1", dotPosition.x);
      line.setAttribute("y1", dotPosition.y);
      line.setAttribute("x2", targetPoint.x);
      line.setAttribute("y2", targetPoint.y);
      endDot.setAttribute("cx", targetPoint.x);
      endDot.setAttribute("cy", targetPoint.y);
    });
  }

  /**
   * Destroy the annotation system and clean up event listeners
   * @returns {void}
   */
  destroy() {
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.lines.forEach((line) => {
      if (line.parentNode) {
        line.parentNode.removeChild(line);
      }
    });
    this.endDots.forEach(dot => {
      if(dot.parentNode) {
        dot.parentNode.removeChild(dot)
      }
    })
    this.lines = [];
    this.endDots = [];
    this.initialized = false;
  }
}
