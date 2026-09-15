const detectedSVGs = new WeakSet();

const SVG_NS = "http://www.w3.org/2000/svg";

const svgStates = new WeakMap();

let svgCounter = 0;

// Set to true only while debugging.
const DEBUG = false;

const lineStyles = [
    "",             // solid
    "10 6",         // dashed
    "2 4",          // dotted
    "12 4 2 4"      // dash-dot
];


// --------------------------------------------------
// BASIC COLOR HELPERS
// --------------------------------------------------

function isValidColor(color) {

    return (
        color &&
        color !== "none" &&
        color !== "transparent" &&
        color !== "rgba(0, 0, 0, 0)"
    );
}


function normalizeColor(color) {

    return color
        .replace(/\s+/g, "")
        .toLowerCase();
}


function parseRGB(color) {

    const match = color.match(
        /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/
    );

    if (!match) {
        return null;
    }

    return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a:
            match[4] !== undefined
                ? Number(match[4])
                : 1
    };
}


function isNeutralColor(color) {

    const rgb = parseRGB(color);

    if (!rgb) {
        return false;
    }

    const { r, g, b, a } = rgb;

    if (a === 0) {
        return true;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const colorDifference = max - min;

    const nearWhite =
        r > 235 &&
        g > 235 &&
        b > 235;

    const nearBlack =
        r < 40 &&
        g < 40 &&
        b < 40;

    const grayLike =
        colorDifference < 20;

    return (
        nearWhite ||
        nearBlack ||
        grayLike
    );
}


// --------------------------------------------------
// SVG STATE
// --------------------------------------------------

function getSVGState(svg) {

    if (!svgStates.has(svg)) {

        svgStates.set(svg, {
            colorMap: new Map(),

            /*
            Stores:
            red   -> solid
            green -> dashed
            blue  -> dotted
            */
            lineSeriesStyles: new Map()
        });
    }

    return svgStates.get(svg);
}


// --------------------------------------------------
// BAR PATTERN CREATION
// --------------------------------------------------

function createPattern(
    defs,
    id,
    color,
    type
) {

    const pattern =
        document.createElementNS(
            SVG_NS,
            "pattern"
        );

    pattern.setAttribute("id", id);

    pattern.setAttribute(
        "width",
        "8"
    );

    pattern.setAttribute(
        "height",
        "8"
    );

    pattern.setAttribute(
        "patternUnits",
        "userSpaceOnUse"
    );

    pattern.dataset.colorkeyGenerated =
        "true";


    // Preserve original bar colour.

    const background =
        document.createElementNS(
            SVG_NS,
            "rect"
        );

    background.setAttribute(
        "width",
        "8"
    );

    background.setAttribute(
        "height",
        "8"
    );

    background.setAttribute(
        "fill",
        color
    );

    background.dataset.colorkeyGenerated =
        "true";

    pattern.appendChild(background);


    // Pattern 0: diagonal stripes

    if (type === 0) {

        const stripe =
            document.createElementNS(
                SVG_NS,
                "path"
            );

        stripe.setAttribute(
            "d",
            "M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6"
        );

        stripe.setAttribute(
            "stroke",
            "black"
        );

        stripe.setAttribute(
            "stroke-width",
            "1.5"
        );

        stripe.dataset.colorkeyGenerated =
            "true";

        pattern.appendChild(stripe);
    }


    // Pattern 1: dots

    else if (type === 1) {

        const dot =
            document.createElementNS(
                SVG_NS,
                "circle"
            );

        dot.setAttribute(
            "cx",
            "4"
        );

        dot.setAttribute(
            "cy",
            "4"
        );

        dot.setAttribute(
            "r",
            "1.5"
        );

        dot.setAttribute(
            "fill",
            "black"
        );

        dot.dataset.colorkeyGenerated =
            "true";

        pattern.appendChild(dot);
    }


    // Pattern 2: cross hatch

    else if (type === 2) {

        const cross =
            document.createElementNS(
                SVG_NS,
                "path"
            );

        cross.setAttribute(
            "d",
            "M0,0 L8,8 M8,0 L0,8"
        );

        cross.setAttribute(
            "stroke",
            "black"
        );

        cross.setAttribute(
            "stroke-width",
            "1"
        );

        cross.dataset.colorkeyGenerated =
            "true";

        pattern.appendChild(cross);
    }


    // Pattern 3: horizontal lines

    else {

        const horizontal =
            document.createElementNS(
                SVG_NS,
                "path"
            );

        horizontal.setAttribute(
            "d",
            "M0,4 L8,4"
        );

        horizontal.setAttribute(
            "stroke",
            "black"
        );

        horizontal.setAttribute(
            "stroke-width",
            "1.5"
        );

        horizontal.dataset.colorkeyGenerated =
            "true";

        pattern.appendChild(horizontal);
    }


    defs.appendChild(pattern);
}


// --------------------------------------------------
// LINE-CHART LEGEND CREATION
// --------------------------------------------------

function createLegendLine(
    rect,
    color,
    dashStyle
) {

    const x =
        parseFloat(
            rect.getAttribute("x")
        ) || 0;

    const y =
        parseFloat(
            rect.getAttribute("y")
        ) || 0;

    const width =
        parseFloat(
            rect.getAttribute("width")
        ) || 0;

    const height =
        parseFloat(
            rect.getAttribute("height")
        ) || 0;


    const line =
        document.createElementNS(
            SVG_NS,
            "line"
        );


    line.setAttribute(
        "x1",
        x
    );

    line.setAttribute(
        "x2",
        x + width
    );

    line.setAttribute(
        "y1",
        y + height / 2
    );

    line.setAttribute(
        "y2",
        y + height / 2
    );

    line.setAttribute(
        "stroke",
        color
    );

    line.setAttribute(
        "stroke-width",
        "4"
    );

    line.setAttribute(
        "stroke-linecap",
        "round"
    );


    if (dashStyle) {

        line.setAttribute(
            "stroke-dasharray",
            dashStyle
        );
    }


    line.dataset.colorkeyGenerated =
        "true";


    rect.parentNode.insertBefore(
        line,
        rect.nextSibling
    );
}


// --------------------------------------------------
// MAIN SVG ACCESSIBILITY TRANSFORMATION
// --------------------------------------------------

function enhanceSVG(svg) {

    if (!svg.dataset.colorkeyId) {

        svg.dataset.colorkeyId =
            `svg-${svgCounter++}`;
    }


    const svgId =
        svg.dataset.colorkeyId;


    const state =
        getSVGState(svg);


    const colorMap =
        state.colorMap;


    const lineSeriesStyles =
        state.lineSeriesStyles;


    let defs =
        svg.querySelector("defs");


    if (!defs) {

        defs =
            document.createElementNS(
                SVG_NS,
                "defs"
            );

        defs.dataset.colorkeyGenerated =
            "true";

        svg.insertBefore(
            defs,
            svg.firstChild
        );
    }


    function getColorIndex(color) {

        const normalized =
            normalizeColor(color);


        if (!colorMap.has(normalized)) {

            colorMap.set(
                normalized,
                colorMap.size
            );
        }


        return colorMap.get(
            normalized
        );
    }


    // ==================================================
    // STEP 1:
    // PROCESS LINE SERIES FIRST
    // ==================================================

    const paths =
        svg.querySelectorAll("path");


    paths.forEach((path) => {

        if (
            path.dataset.colorkeyGenerated ===
            "true"
        ) {
            return;
        }


        if (
            path.dataset.colorkeyProcessed ===
            "true"
        ) {
            return;
        }


        const style =
            getComputedStyle(path);


        const strokeColor =
            style.stroke;


        if (
            !isValidColor(strokeColor) ||
            isNeutralColor(strokeColor)
        ) {
            return;
        }


        const strokeWidth =
            parseFloat(
                style.strokeWidth
            ) || 0;


        /*
        Thin paths are often:
        grid lines,
        decoration,
        borders, etc.
        */

        if (strokeWidth < 2) {
            return;
        }


        const colorIndex =
            getColorIndex(
                strokeColor
            );


        const dashStyle =
            lineStyles[
                colorIndex %
                lineStyles.length
            ];


        const normalizedColor =
            normalizeColor(
                strokeColor
            );


        /*
        Remember the accessibility style
        assigned to this series.
        */

        lineSeriesStyles.set(
            normalizedColor,
            dashStyle
        );


        if (dashStyle) {

            path.style.strokeDasharray =
                dashStyle;
        }


        path.style.strokeLinecap =
            "round";


        path.dataset.colorkeyProcessed =
            "true";


        if (DEBUG) {

            console.log(
                "[ColorKey] Line series:",
                normalizedColor,
                dashStyle || "solid"
            );
        }
    });


    // ==================================================
    // STEP 2:
    // PROCESS RECTANGLES
    // ==================================================

    const rectangles =
        svg.querySelectorAll("rect");


    rectangles.forEach((rect) => {

        if (
            rect.dataset.colorkeyGenerated ===
            "true"
        ) {
            return;
        }


        if (
            rect.dataset.colorkeyProcessed ===
            "true"
        ) {
            return;
        }


        const style =
            getComputedStyle(rect);


        const fillColor =
            style.fill;


        if (
            !isValidColor(fillColor) ||
            isNeutralColor(fillColor)
        ) {
            return;
        }


        const width =
            parseFloat(
                rect.getAttribute("width")
            ) || 0;


        const height =
            parseFloat(
                rect.getAttribute("height")
            ) || 0;


        if (
            width < 10 ||
            height < 10
        ) {
            return;
        }


        const normalizedColor =
            normalizeColor(
                fillColor
            );


        // --------------------------------------
        // IS THIS A LINE-CHART LEGEND MARKER?
        // --------------------------------------

        const isLegendMarker =

            width <= 30 &&

            height <= 30 &&

            lineSeriesStyles.has(
                normalizedColor
            );


        if (isLegendMarker) {

            const dashStyle =
                lineSeriesStyles.get(
                    normalizedColor
                );


            /*
            Hide the old colored legend square.
            */

            rect.setAttribute(
                "fill",
                "none"
            );


            createLegendLine(
                rect,
                fillColor,
                dashStyle
            );


            rect.dataset.colorkeyProcessed =
                "true";


            if (DEBUG) {

                console.log(
                    "[ColorKey] Legend synced:",
                    normalizedColor,
                    dashStyle || "solid"
                );
            }


            return;
        }


        // --------------------------------------
        // OTHERWISE TREAT IT LIKE A BAR
        // --------------------------------------

        const colorIndex =
            getColorIndex(
                fillColor
            );


        const patternType =
            colorIndex % 4;


        const patternId =
            `colorkey-${svgId}-pattern-${colorIndex}`;


        if (
            !svg.querySelector(
                `#${patternId}`
            )
        ) {

            createPattern(
                defs,
                patternId,
                fillColor,
                patternType
            );
        }


        rect.setAttribute(
            "fill",
            `url(#${patternId})`
        );


        rect.dataset.colorkeyProcessed =
            "true";


        if (DEBUG) {

            console.log(
                "[ColorKey] Bar patterned:",
                normalizedColor
            );
        }
    });
}


// --------------------------------------------------
// SVG SCANNING
// --------------------------------------------------

function scanForSVGs() {

    const svgs =
        document.querySelectorAll("svg");


    svgs.forEach(
        (svg, index) => {


            if (
                !detectedSVGs.has(svg)
            ) {

                detectedSVGs.add(svg);


                svg.setAttribute(
                    "data-colorkey-detected",
                    "true"
                );


                if (DEBUG) {

                    console.log(
                        `[ColorKey] SVG detected #${index + 1}`,
                        svg
                    );


                    svg.style.outline =
                        "3px dashed purple";
                }
            }


            /*
            Run every time because an existing
            SVG may receive new chart elements
            dynamically.
            */

            enhanceSVG(svg);
        }
    );
}


// --------------------------------------------------
// INITIAL SCAN
// --------------------------------------------------

scanForSVGs();


// --------------------------------------------------
// WATCH FOR DYNAMIC CHARTS
// --------------------------------------------------

const observer =
    new MutationObserver(() => {

        scanForSVGs();
    });


observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);