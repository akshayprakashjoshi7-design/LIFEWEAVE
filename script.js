/* =====================================================
   LIFEWEAVE ENGINE
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const DATASETS = {

    spotify: {
        name: "Spotify History",
        path: "./data/spotify_history.csv",
        type: "music"
    },

    household: {
        name: "Daily Household Transactions",
        path: "./data/Daily Household Transactions.csv",
        type: "purchase"
    },

    india: {
        name: "India Transactions",
        path: "./data/Augmented_IndiaTransactMultiFacet2024.csv",
        type: "transaction"
    }

};


const state = {

    view: "overview",

    receipts: [],

    allReceipts: [],

    connections: [],

    stories: [],

    history: [],

    datasets: [],

    filter: "all",

    search: "",

    dark: false,

    user: null

};


/* =====================================================
   DOM
===================================================== */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    [...document.querySelectorAll(selector)];


/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadPreferences();

    bindEvents();

    loadDemoDatasets();

});


/* =====================================================
   EVENTS
===================================================== */

function bindEvents() {

    /* Sidebar */

    $("#menuBtn").addEventListener("click", openSidebar);

    $("#closeSidebar").addEventListener(
        "click",
        closeSidebar
    );

    $("#sidebarOverlay").addEventListener(
        "click",
        closeSidebar
    );


    /* Navigation */

    $$(".nav-item").forEach(button => {

        button.addEventListener("click", () => {

            const view =
                button.dataset.view;

            setView(view);

            closeSidebar();

        });

    });


    /* Theme */

    $("#themeBtn").addEventListener(
        "click",
        toggleTheme
    );

    $("#topThemeBtn").addEventListener(
        "click",
        toggleTheme
    );


    /* Import */

    $("#topImportBtn").addEventListener(
        "click",
        openImport
    );

    $("#importSidebarBtn").addEventListener(
        "click",
        openImport
    );

    $("#chooseFilesBtn").addEventListener(
        "click",
        () => $("#fileInput").click()
    );

    $("#fileInput").addEventListener(
        "change",
        handleFiles
    );


    /* Drag & Drop */

    const drop =
        $("#dropZone");

    drop.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            drop.classList.add("dragover");

        }
    );

    drop.addEventListener(
        "dragleave",
        () => {

            drop.classList.remove(
                "dragover"
            );

        }
    );

    drop.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            drop.classList.remove(
                "dragover"
            );

            handleFiles({
                target: {
                    files: event.dataTransfer.files
                }
            });

        }
    );


    /* Login */

    $("#loginBtn").addEventListener(
        "click",
        openLogin
    );

    $("#loginForm").addEventListener(
        "submit",
        handleLogin
    );


    /* Reset */

    $("#resetBtn").addEventListener(
        "click",
        resetDemo
    );


    /* Search */

    $("#globalSearch").addEventListener(
        "input",
        event => {

            state.search =
                event.target.value
                    .trim()
                    .toLowerCase();

            render();

        }
    );


    /* Keyboard shortcut */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                $("#globalSearch").focus();

            }

            if (event.key === "Escape") {

                closeAllModals();

            }

        }
    );


    /* Modal close buttons */

    $$("[data-close]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.close;

                closeModal(id);

            }
        );

    });


    /* Click outside modal */

    $$(".modal").forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    });

}


/* =====================================================
   SIDEBAR
===================================================== */

function openSidebar() {

    $("#sidebar")
        .classList.add("open");

    $("#sidebarOverlay")
        .classList.add("show");

}


function closeSidebar() {

    $("#sidebar")
        .classList.remove("open");

    $("#sidebarOverlay")
        .classList.remove("show");

}


/* =====================================================
   VIEW
===================================================== */

function setView(view) {

    state.view = view;

    $$(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.view === view
        );

    });


    const titles = {

        overview: "Overview",

        receipts: "Receipts Explorer",

        timeline: "Life Timeline",

        connections: "Connections",

        stories: "Life Stories",

        datasets: "Datasets",

        history: "Activity History",

        insights: "Insights"

    };


    $("#viewTitle").textContent =
        titles[view] || "Overview";


    render();

    addHistory(
        "Viewed",
        titles[view] || view
    );

}


/* =====================================================
   DEMO DATA LOADING
===================================================== */

async function loadDemoDatasets() {

    state.receipts = [];

    state.allReceipts = [];

    state.datasets = [];


    const configs =
        Object.values(DATASETS);


    for (const dataset of configs) {

        try {

            const response =
                await fetch(dataset.path);

            if (!response.ok) {

                throw new Error(
                    "File not found"
                );

            }


            const text =
                await response.text();


            const rows =
                parseCSV(text);


            if (!rows.length) {

                continue;

            }


            const normalized =
                normalizeRows(
                    rows,
                    dataset
                );


            state.receipts.push(
                ...normalized
            );


            state.datasets.push({

                name: dataset.name,

                type: dataset.type,

                records: normalized.length,

                source: "Demo dataset",

                status: "Loaded"

            });


        } catch (error) {

            console.warn(
                dataset.name,
                error
            );


            state.datasets.push({

                name: dataset.name,

                type: dataset.type,

                records: 0,

                source: "Demo dataset",

                status: "Unavailable"

            });

        }

    }


    state.allReceipts =
        [...state.receipts];


    finishDataProcessing();


    toast(
        "Demo datasets ready",
        "✓"
    );

}


/* =====================================================
   CSV PARSER
===================================================== */

function parseCSV(text) {

    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];

        const next =
            text[i + 1];


        if (char === '"' && insideQuotes && next === '"') {

            value += '"';

            i++;

            continue;

        }


        if (char === '"') {

            insideQuotes =
                !insideQuotes;

            continue;

        }


        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(value);

            value = "";

            continue;

        }


        if (
            (char === "\n" ||
             char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }


            row.push(value);

            value = "";


            if (
                row.some(
                    item =>
                        item.trim() !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

            continue;

        }


        value += char;

    }


    if (value.length || row.length) {

        row.push(value);

        rows.push(row);

    }


    if (!rows.length) {

        return [];

    }


    const headers =
        makeUniqueHeaders(
            rows[0]
        );


    return rows
        .slice(1)
        .map(row => {

            const object = {};

            headers.forEach(
                (header, index) => {

                    object[header] =
                        (row[index] ?? "")
                            .trim();

                }
            );

            return object;

        })
        .filter(row =>
            Object.values(row)
                .some(value =>
                    String(value).trim()
                )
        );

}


function makeUniqueHeaders(headers) {

    const used = {};

    return headers.map(
        (header, index) => {

            let name =
                String(header || "")
                    .trim()
                    .replace(/\s+/g, "_");


            if (!name) {

                name =
                    `column_${index + 1}`;

            }


            const base = name;

            used[base] =
                (used[base] || 0) + 1;


            if (used[base] > 1) {

                name =
                    `${base}_${used[base]}`;

            }


            return name;

        }
    );

}


/* =====================================================
   NORMALIZATION
===================================================== */

function normalizeRows(rows, config) {

    return rows.map(
        (row, index) => {

            const keys =
                Object.keys(row);


            const date =
                findValue(
                    row,
                    [
                        "date",
                        "datetime",
                        "timestamp",
                        "time",
                        "played_at",
                        "transaction_date",
                        "created_at"
                    ]
                );


            const title =
                findValue(
                    row,
                    [
                        "track_name",
                        "track",
                        "song",
                        "name",
                        "description",
                        "category",
                        "item",
                        "product",
                        "merchant",
                        "subcategory"
                    ]
                );


            const category =
                findValue(
                    row,
                    [
                        "category",
                        "type",
                        "transaction_type",
                        "mode",
                        "genre",
                        "platform"
                    ]
                );


            const amount =
                findValue(
                    row,
                    [
                        "amount",
                        "price",
                        "cost",
                        "value",
                        "total",
                        "debit",
                        "credit"
                    ]
                );


            const artist =
                findValue(
                    row,
                    [
                        "artist_name",
                        "artist",
                        "performer"
                    ]
                );


            const album =
                findValue(
                    row,
                    [
                        "album_name",
                        "album"
                    ]
                );


            let type =
                config.type;


            if (
                config.type === "music"
            ) {

                type = "music";

            } else if (
                /household|transaction/i
                    .test(config.name)
            ) {

                type = "purchase";

            }


            const cleanTitle =
                title ||
                `${config.name} record ${index + 1}`;


            return {

                id:
                    `${slug(config.name)}-${index}-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 7)}`,

                type,

                date:
                    normalizeDate(date),

                title:
                    cleanTitle,

                subtitle:
                    buildSubtitle(
                        row,
                        artist,
                        album,
                        amount,
                        category
                    ),

                source:
                    config.name,

                amount:
                    parseNumber(amount),

                category:
                    category || type,

                raw:
                    row

            };

        }
    );

}


function findValue(row, possible) {

    const entries =
        Object.entries(row);


    for (const wanted of possible) {

        const exact =
            entries.find(
                ([key, value]) =>
                    key
                        .toLowerCase()
                        .replace(/[\s-]/g, "_")
                    === wanted
                    &&
                    value !== ""
            );


        if (exact) {

            return exact[1];

        }

    }


    for (const wanted of possible) {

        const partial =
            entries.find(
                ([key, value]) =>
                    key
                        .toLowerCase()
                        .includes(wanted)
                    &&
                    value !== ""
            );


        if (partial) {

            return partial[1];

        }

    }


    return "";

}


function buildSubtitle(
    row,
    artist,
    album,
    amount,
    category
) {

    const parts = [];

    if (artist) {

        parts.push(artist);

    }

    if (album) {

        parts.push(album);

    }

    if (amount) {

        parts.push(amount);

    }

    if (
        category &&
        !parts.includes(category)
    ) {

        parts.push(category);

    }


    if (!parts.length) {

        const values =
            Object.values(row)
                .filter(Boolean)
                .slice(1, 3);

        return values.join(" • ");

    }


    return parts.join(" • ");

}


/* =====================================================
   DATE
===================================================== */

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return date
            .toISOString();

    }


    return String(value);

}


function dateObject(value) {

    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function formatDate(value) {

    const date =
        dateObject(value);


    if (!date) {

        return value || "Unknown date";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatDateTime(value) {

    const date =
        dateObject(value);


    if (!date) {

        return value || "Unknown time";

    }


    return date.toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =====================================================
   NUMBER
===================================================== */

function parseNumber(value) {

    if (!value) {

        return null;

    }


    const clean =
        String(value)
            .replace(/[^0-9.-]/g, "");


    const number =
        Number(clean);


    return Number.isFinite(number)
        ? number
        : null;

}


/* =====================================================
   PROCESSING
===================================================== */

function finishDataProcessing() {

    state.receipts =
        deduplicate(
            state.receipts
        );


    state.allReceipts =
        [...state.receipts];


    state.connections =
        buildConnections(
            state.receipts
        );


    state.stories =
        buildStories(
            state.receipts
        );


    render();

}


/* =====================================================
   DEDUPLICATION
===================================================== */

function deduplicate(items) {

    const seen = new Set();

    return items.filter(
        item => {

            const key =
                [
                    item.source,
                    item.date,
                    item.title,
                    item.subtitle
                ]
                .join("|")
                .toLowerCase();


            if (seen.has(key)) {

                return false;

            }


            seen.add(key);

            return true;

        }
    );

}


/* =====================================================
   CONNECTION ENGINE
===================================================== */

function buildConnections(receipts) {

    const sorted =
        [...receipts]
            .filter(item =>
                dateObject(item.date)
            )
            .sort(
                (a,b) =>
                    dateObject(a.date) -
                    dateObject(b.date)
            );


    const connections = [];


    for (
        let i = 0;
        i < sorted.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < Math.min(
                i + 5,
                sorted.length
            );
            j++
        ) {

            const a =
                sorted[i];

            const b =
                sorted[j];


            const dateA =
                dateObject(a.date);

            const dateB =
                dateObject(b.date);


            const minutes =
                Math.abs(
                    dateB - dateA
                ) /
                60000;


            let reason = "";


            if (
                a.type !== b.type &&
                minutes <= 180
            ) {

                reason =
                    "Different types of activity happened within the same time window.";

            } else if (
                a.category &&
                b.category &&
                a.category
                    .toLowerCase() ===
                b.category
                    .toLowerCase()
            ) {

                reason =
                    "Both receipts share a similar category.";

            } else if (
                dateA.toDateString() ===
                dateB.toDateString()
            ) {

                reason =
                    "These moments happened on the same day.";

            }


            if (reason) {

                connections.push({

                    id:
                        `connection-${connections.length + 1}`,

                    from: a,

                    to: b,

                    reason,

                    minutes

                });

            }


            if (
                connections.length >= 60
            ) {

                return connections;

            }

        }

    }


    return connections;

}


/* =====================================================
   STORY ENGINE
===================================================== */

function buildStories(receipts) {

    const dated =
        receipts
            .filter(
                item =>
                    dateObject(item.date)
            )
            .sort(
                (a,b) =>
                    dateObject(a.date) -
                    dateObject(b.date)
            );


    if (!dated.length) {

        return [];

    }


    const groups = [];

    let current = [];

    let previous = null;


    dated.forEach(item => {

        const currentDate =
            dateObject(item.date);


        if (
            previous &&
            Math.abs(
                currentDate - previous
            ) >
            1000 * 60 * 60 * 24 * 2
        ) {

            if (current.length) {

                groups.push(current);

            }

            current = [];

        }


        current.push(item);

        previous = currentDate;

    });


    if (current.length) {

        groups.push(current);

    }


    return groups
        .filter(
            group => group.length >= 2
        )
        .slice(0, 12)
        .map(
            (group, index) => {

                const types =
                    [...new Set(
                        group.map(
                            item => item.type
                        )
                    )];


                const first =
                    group[0];

                const last =
                    group[group.length - 1];


                return {

                    id:
                        `story-${index + 1}`,

                    title:
                        generateStoryTitle(
                            group,
                            index
                        ),

                    description:
                        generateStoryDescription(
                            group,
                            types
                        ),

                    start:
                        first.date,

                    end:
                        last.date,

                    items:
                        group.slice(0, 20),

                    types

                };

            }
        );

}


function generateStoryTitle(
    group,
    index
) {

    const type =
        group[0].type;


    const names = {

        music:
            "A Musical Chapter",

        purchase:
            "A Spending Chapter",

        transaction:
            "A Transaction Chapter"

    };


    return (
        names[type] ||
        "A New Life Chapter"
    )
    +
    ` ${index + 1}`;

}


function generateStoryDescription(
    group,
    types
) {

    return (
        `${group.length} recorded moments across `
        +
        `${types.length} activity type`
        +
        (types.length > 1 ? "s" : "")
        +
        `. This chapter was grouped from nearby records in your dataset.`
    );

}


/* =====================================================
   RENDER
===================================================== */

function render() {

    const container =
        $("#viewContainer");


    switch (state.view) {

        case "overview":

            container.innerHTML =
                renderOverview();

            break;


        case "receipts":

            container.innerHTML =
                renderReceiptsPage();

            break;


        case "timeline":

            container.innerHTML =
                renderTimelinePage();

            break;


        case "connections":

            container.innerHTML =
                renderConnectionsPage();

            break;


        case "stories":

            container.innerHTML =
                renderStoriesPage();

            break;


        case "datasets":

            container.innerHTML =
                renderDatasetsPage();

            break;


        case "history":

            container.innerHTML =
                renderHistoryPage();

            break;


        case "insights":

            container.innerHTML =
                renderInsightsPage();

            break;


        default:

            container.innerHTML =
                renderOverview();

    }


    bindDynamicEvents();

}


/* =====================================================
   FILTERED DATA
===================================================== */

function getVisibleReceipts() {

    let data =
        [...state.receipts];


    if (state.filter !== "all") {

        data =
            data.filter(
                item =>
                    item.type ===
                    state.filter
            );

    }


    if (state.search) {

        data =
            data.filter(item => {

                const text =
                    [
                        item.title,
                        item.subtitle,
                        item.source,
                        item.category,
                        item.type,
                        JSON.stringify(item.raw)
                    ]
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    state.search
                );

            });

    }


    return data;

}


/* =====================================================
   OVERVIEW
===================================================== */

function renderOverview() {

    const receipts =
        getVisibleReceipts();


    const music =
        state.receipts.filter(
            r => r.type === "music"
        ).length;


    const purchases =
        state.receipts.filter(
            r =>
                r.type === "purchase" ||
                r.type === "transaction"
        ).length;


    const amount =
        state.receipts
            .map(r => r.amount)
            .filter(
                n =>
                    typeof n === "number"
            )
            .reduce(
                (a,b) => a + b,
                0
            );


    return `

        <section class="hero">

            <span class="eyebrow">
                YOUR LIFE, IN RECEIPTS
            </span>

            <h1>
                Turn scattered data into
                a story of your life.
            </h1>

            <p>
                LifeWeave transforms your raw activity
                records into searchable receipts,
                timelines, possible connections and
                automatically grouped life stories.
            </p>

            <div class="hero-actions">

                <button
                    class="primary-btn"
                    data-action="explore">
                    Explore receipts
                </button>

                <button
                    class="secondary-btn"
                    data-action="stories">
                    ✦ Open Life Stories
                </button>

                <button
                    class="secondary-btn"
                    data-action="import">
                    ↑ Import data
                </button>

            </div>

        </section>


        <section class="stats-grid">

            ${statCard(
                "Total receipts",
                state.receipts.length,
                "▣",
                "All loaded records"
            )}

            ${statCard(
                "Music moments",
                music,
                "♫",
                "Spotify records"
            )}

            ${statCard(
                "Transactions",
                purchases,
                "₹",
                "Detected records"
            )}

            ${statCard(
                "Connections",
                state.connections.length,
                "⌁",
                "Possible relationships"
            )}

        </section>


        <section class="two-grid">

            <div>

                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h2>
                                Recent receipts
                            </h2>

                            <p>
                                Your latest imported moments
                            </p>
                        </div>

                        <button
                            class="secondary-btn"
                            data-action="receipts">
                            View all
                        </button>

                    </div>

                    <div class="receipt-list">

                        ${renderReceiptList(
                            receipts
                                .slice()
                                .sort(
                                    newestFirst
                                )
                                .slice(0, 6)
                        )}

                    </div>

                </div>


                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h2>
                                Activity mix
                            </h2>

                            <p>
                                How your records are distributed
                            </p>
                        </div>

                    </div>

                    ${renderActivityBars()}

                </div>

            </div>


            <div>

                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h2>
                                Life Stories
                            </h2>

                            <p>
                                Automatically discovered chapters
                            </p>
                        </div>

                    </div>

                    ${renderStoryMini()}

                </div>


                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h2>
                                Possible connections
                            </h2>

                            <p>
                                Click any connection to inspect it
                            </p>
                        </div>

                    </div>

                    ${renderConnectionMini()}

                </div>

            </div>

        </section>

    `;

}


/* =====================================================
   STAT CARD
===================================================== */

function statCard(
    title,
    value,
    icon,
    note
) {

    return `

        <div class="stat-card">

            <div class="stat-top">

                <span>${title}</span>

                <div class="stat-icon">
                    ${icon}
                </div>

            </div>

            <strong>
                ${formatNumber(value)}
            </strong>

            <small>
                ${note}
            </small>

        </div>

    `;

}


/* =====================================================
   RECEIPTS PAGE
===================================================== */

function renderReceiptsPage() {

    const receipts =
        getVisibleReceipts()
            .sort(
                newestFirst
            );


    const types =
        [
            "all",
            ...new Set(
                state.receipts.map(
                    r => r.type
                )
            )
        ];


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        Receipts Explorer
                    </h2>

                    <p>
                        ${receipts.length}
                        records currently visible
                    </p>
                </div>

            </div>


            <div class="filter-row">

                ${types.map(
                    type => `

                    <button
                        class="filter-btn ${
                            state.filter === type
                                ? "active"
                                : ""
                        }"
                        data-filter="${type}">
                        ${capitalize(type)}
                    </button>

                `).join("")}

            </div>


            <div class="receipt-list">

                ${renderReceiptList(
                    receipts.slice(0, 150)
                )}

            </div>

        </div>

    `;

}


/* =====================================================
   RECEIPT LIST
===================================================== */

function renderReceiptList(
    receipts
) {

    if (!receipts.length) {

        return `

            <div class="empty">

                <strong>
                    No receipts found
                </strong>

                <span>
                    Try another search or import a dataset.
                </span>

            </div>

        `;

    }


    return receipts.map(
        receipt => `

            <article
                class="receipt-card"
                data-receipt-id="${receipt.id}">

                <div class="receipt-row">

                    <div class="receipt-icon">
                        ${typeIcon(receipt.type)}
                    </div>

                    <div class="receipt-main">

                        <strong>
                            ${escapeHTML(
                                receipt.title
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                receipt.subtitle ||
                                receipt.source
                            )}
                        </span>

                    </div>

                    <div class="receipt-date">

                        ${formatDate(
                            receipt.date
                        )}

                    </div>

                </div>

            </article>

        `
    ).join("");

}


/* =====================================================
   TIMELINE
===================================================== */

function renderTimelinePage() {

    const receipts =
        [...getVisibleReceipts()]
            .sort(
                oldestFirst
            )
            .slice(0, 250);


    if (!receipts.length) {

        return emptyPage(
            "No timeline yet",
            "Import or load a dataset containing date information."
        );

    }


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        Your Life Timeline
                    </h2>

                    <p>
                        ${receipts.length}
                        chronological records
                    </p>
                </div>

            </div>


            <div class="timeline">

                ${receipts.map(
                    item => `

                    <div class="timeline-item">

                        <div class="timeline-date">
                            ${formatDateTime(
                                item.date
                            )}
                        </div>

                        ${receiptCompact(
                            item
                        )}

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}


/* =====================================================
   CONNECTIONS
===================================================== */

function renderConnectionsPage() {

    const connections =
        state.connections;


    if (!connections.length) {

        return emptyPage(
            "No connections detected",
            "Connections appear when records share time, category or other observable context."
        );

    }


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        Possible Connections
                    </h2>

                    <p>
                        These are data-based relationships,
                        not claims of causality.
                    </p>
                </div>

                <span class="badge">
                    ${connections.length} found
                </span>

            </div>


            ${connections.map(
                connection => `

                <article
                    class="connection-card"
                    data-connection-id="${connection.id}">

                    <div class="connection-line">

                        ${connectionNode(
                            connection.from
                        )}

                        <div class="connection-arrow">
                            →
                        </div>

                        ${connectionNode(
                            connection.to
                        )}

                    </div>

                    <div class="connection-reason">

                        ${escapeHTML(
                            connection.reason
                        )}

                        · Click to inspect

                    </div>

                </article>

            `).join("")}

        </div>

    `;

}


function connectionNode(item) {

    return `

        <div class="connection-node">

            <strong>
                ${escapeHTML(
                    truncate(
                        item.title,
                        45
                    )
                )}
            </strong>

            <span>
                ${formatDateTime(
                    item.date
                )}
            </span>

        </div>

    `;

}


/* =====================================================
   STORIES
===================================================== */

function renderStoriesPage() {

    if (!state.stories.length) {

        return emptyPage(
            "Life Stories need more connected records",
            "Once enough dated records are loaded, LifeWeave groups nearby activity into chapters."
        );

    }


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        ✦ Life Stories
                    </h2>

                    <p>
                        Chapters generated from your observable data patterns
                    </p>
                </div>

            </div>


            <div class="story-grid">

                ${state.stories.map(
                    (story, index) => `

                    <article
                        class="story-card"
                        data-story-id="${story.id}">

                        <div class="story-number">
                            ${String(
                                index + 1
                            ).padStart(2, "0")}
                        </div>

                        <h3>
                            ${escapeHTML(
                                story.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                story.description
                            )}
                        </p>

                        <div class="story-meta">

                            <span class="badge">
                                ${story.items.length}
                                moments
                            </span>

                            <span class="badge">
                                ${formatDate(
                                    story.start
                                )}
                            </span>

                            <span class="badge">
                                ${story.types.join(
                                    " • "
                                )}
                            </span>

                        </div>

                    </article>

                `).join("")}

            </div>

        </div>

    `;

}


/* =====================================================
   DATASETS
===================================================== */

function renderDatasetsPage() {

    return `

        <div class="hero">

            <span class="eyebrow">
                DATA LAB
            </span>

            <h1>
                Your datasets.
                Your story.
            </h1>

            <p>
                Demo datasets are automatically loaded
                from the project's data folder.
                You can also import your own CSV/TSV files.
            </p>

            <div class="hero-actions">

                <button
                    class="primary-btn"
                    data-action="import">
                    ↑ Import dataset
                </button>

                <button
                    class="secondary-btn"
                    data-action="reset">
                    ↻ Reload demo
                </button>

            </div>

        </div>


        <div class="dataset-grid">

            ${state.datasets.map(
                dataset => `

                <div class="dataset-card">

                    <strong>
                        ${escapeHTML(
                            dataset.name
                        )}
                    </strong>

                    <span>
                        <i class="status-dot"
                           style="background:${
                               dataset.status === "Loaded"
                                   ? "var(--success)"
                                   : "var(--danger)"
                           }"></i>

                        ${dataset.status}
                    </span>

                    <span>
                        ${dataset.records}
                        records detected
                    </span>

                    <span>
                        ${dataset.source}
                    </span>

                </div>

            `).join("")}

        </div>

    `;

}


/* =====================================================
   HISTORY
===================================================== */

function renderHistoryPage() {

    if (!state.history.length) {

        return emptyPage(
            "No activity yet",
            "Your LifeWeave navigation and data actions will appear here."
        );

    }


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        Activity History
                    </h2>

                    <p>
                        Stored locally in this browser
                    </p>
                </div>

                <button
                    class="secondary-btn"
                    data-action="clear-history">
                    Clear
                </button>

            </div>


            ${state.history.map(
                item => `

                <div class="history-item">

                    <div class="history-icon">
                        ${item.icon || "•"}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.action
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                item.detail
                            )}
                            ·
                            ${formatDateTime(
                                item.time
                            )}
                        </span>

                    </div>

                </div>

            `).join("")}

        </div>

    `;

}


/* =====================================================
   INSIGHTS
===================================================== */

function renderInsightsPage() {

    const receipts =
        state.receipts;


    const dates =
        receipts
            .map(
                r =>
                    dateObject(r.date)
            )
            .filter(Boolean);


    const earliest =
        dates.length
            ? new Date(
                Math.min(
                    ...dates
                )
            )
            : null;


    const latest =
        dates.length
            ? new Date(
                Math.max(
                    ...dates
                )
            )
            : null;


    const uniqueSources =
        new Set(
            receipts.map(
                r => r.source
            )
        ).size;


    const uniqueTypes =
        new Set(
            receipts.map(
                r => r.type
            )
        ).size;


    const amountValues =
        receipts
            .map(r => r.amount)
            .filter(
                Number.isFinite
            );


    const totalAmount =
        amountValues.reduce(
            (a,b) => a + b,
            0
        );


    return `

        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        Data Insights
                    </h2>

                    <p>
                        Derived from the currently loaded records
                    </p>
                </div>

            </div>


            <div class="stats-grid">

                ${statCard(
                    "Sources",
                    uniqueSources,
                    "▤",
                    "Dataset sources"
                )}

                ${statCard(
                    "Activity types",
                    uniqueTypes,
                    "◉",
                    "Detected types"
                )}

                ${statCard(
                    "Stories",
                    state.stories.length,
                    "✦",
                    "Generated chapters"
                )}

                ${statCard(
                    "Numeric total",
                    formatAmount(
                        totalAmount
                    ),
                    "₹",
                    "Detected numeric values"
                )}

            </div>


            <div class="detail-grid">

                <div class="detail-field">

                    <span>
                        Earliest record
                    </span>

                    <strong>
                        ${
                            earliest
                                ? formatDate(
                                    earliest
                                )
                                : "Not available"
                        }
                    </strong>

                </div>


                <div class="detail-field">

                    <span>
                        Latest record
                    </span>

                    <strong>
                        ${
                            latest
                                ? formatDate(
                                    latest
                                )
                                : "Not available"
                        }
                    </strong>

                </div>

            </div>

        </div>


        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>
                        How LifeWeave finds patterns
                    </h2>

                    <p>
                        Transparent, data-driven processing
                    </p>
                </div>

            </div>


            ${infoBox(
                "1. Normalize",
                "Different dataset formats are converted into one common receipt structure."
            )}

            ${infoBox(
                "2. Connect",
                "Nearby dates, shared categories and compatible record types can produce possible connections."
            )}

            ${infoBox(
                "3. Weave",
                "Related dated records can be grouped into Life Stories."
            )}

            ${infoBox(
                "4. Explore",
                "Search, timeline, receipts, stories and connection details make the dataset interactive."
            )}

        </div>

    `;

}


function infoBox(
    title,
    text
) {

    return `

        <div class="detail-section">

            <h4>
                ${title}
            </h4>

            <p>
                ${text}
            </p>

        </div>

    `;

}


/* =====================================================
   MINI COMPONENTS
===================================================== */

function renderStoryMini() {

    if (!state.stories.length) {

        return `
            <div class="empty">
                <strong>
                    Stories will appear here
                </strong>
                <span>
                    Load dated records to generate chapters.
                </span>
            </div>
        `;

    }


    return state.stories
        .slice(0, 3)
        .map(
            story => `

            <article
                class="story-card"
                data-story-id="${story.id}">

                <div class="story-number">
                    ✦
                </div>

                <h3>
                    ${escapeHTML(
                        story.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        story.description
                    )}
                </p>

            </article>

        `
        )
        .join("");

}


function renderConnectionMini() {

    if (!state.connections.length) {

        return `
            <div class="empty">
                <strong>
                    No connections yet
                </strong>
                <span>
                    More records can reveal more relationships.
                </span>
            </div>
        `;

    }


    return state.connections
        .slice(0, 3)
        .map(
            connection => `

            <article
                class="connection-card"
                data-connection-id="${connection.id}">

                <div class="connection-line">

                    ${connectionNode(
                        connection.from
                    )}

                    <div class="connection-arrow">
                        →
                    </div>

                    ${connectionNode(
                        connection.to
                    )}

                </div>

                <div class="connection-reason">
                    ${escapeHTML(
                        connection.reason
                    )}
                </div>

            </article>

        `
        )
        .join("");

}


function renderActivityBars() {

    const counts = {};


    state.receipts.forEach(
        item => {

            counts[item.type] =
                (counts[item.type] || 0)
                + 1;

        }
    );


    const max =
        Math.max(
            1,
            ...Object.values(
                counts
            )
        );


    return Object.entries(
        counts
    )
    .slice(0, 8)
    .map(
        ([type,count]) => `

        <div class="bar-row">

            <div class="bar-meta">

                <span>
                    ${capitalize(type)}
                </span>

                <span>
                    ${count}
                </span>

            </div>

            <div class="bar">

                <div
                    class="bar-fill"
                    style="width:${
                        count / max * 100
                    }%">
                </div>

            </div>

        </div>

    `).join("");

}


function receiptCompact(item) {

    return `

        <article
            class="receipt-card"
            data-receipt-id="${item.id}">

            <div class="receipt-row">

                <div class="receipt-icon">
                    ${typeIcon(item.type)}
                </div>

                <div class="receipt-main">

                    <strong>
                        ${escapeHTML(
                            item.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.subtitle ||
                            item.source
                        )}
                    </span>

                </div>

            </div>

        </article>

    `;

}


/* =====================================================
   DYNAMIC EVENTS
===================================================== */

function bindDynamicEvents() {

    /* Receipt click */

    $$("[data-receipt-id]")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const receipt =
                        state.receipts.find(
                            item =>
                                item.id ===
                                card.dataset.receiptId
                        );


                    if (receipt) {

                        showReceiptDetail(
                            receipt
                        );

                    }

                }
            );

        });


    /* Connection click */

    $$("[data-connection-id]")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const connection =
                        state.connections.find(
                            item =>
                                item.id ===
                                card.dataset.connectionId
                        );


                    if (connection) {

                        showConnectionDetail(
                            connection
                        );

                    }

                }
            );

        });


    /* Story click */

    $$("[data-story-id]")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const story =
                        state.stories.find(
                            item =>
                                item.id ===
                                card.dataset.storyId
                        );


                    if (story) {

                        showStoryDetail(
                            story
                        );

                    }

                }
            );

        });


    /* Filters */

    $$("[data-filter]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.filter =
                        button.dataset.filter;

                    render();

                }
            );

        });


    /* Generic actions */

    $$("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    handleAction(
                        button.dataset.action
                    );

                }
            );

        });

}


/* =====================================================
   ACTIONS
===================================================== */

function handleAction(action) {

    switch (action) {

        case "explore":

        case "receipts":

            setView("receipts");

            break;


        case "stories":

            setView("stories");

            break;


        case "import":

            openImport();

            break;


        case "reset":

            resetDemo();

            break;


        case "clear-history":

            state.history = [];

            savePreferences();

            render();

            toast(
                "History cleared",
                "✓"
            );

            break;

    }

}


/* =====================================================
   IMPORT
===================================================== */

function openImport() {

    $("#importModal")
        .classList.remove("hidden");

}


async function handleFiles(event) {

    const files =
        [...event.target.files];


    if (!files.length) {

        return;

    }


    $("#importStatus")
        .textContent =
        `Reading ${files.length} file(s)...`;


    let imported = 0;


    for (const file of files) {

        const name =
            file.name.toLowerCase();


        if (
            !name.endsWith(".csv") &&
            !name.endsWith(".tsv")
        ) {

            continue;

        }


        try {

            const text =
                await file.text();


            const rows =
                parseCSV(
                    text.replace(
                        /\t/g,
                        ","
                    )
                );


            const config = {

                name: file.name,

                type:
                    detectType(
                        file.name
                    )

            };


            const normalized =
                normalizeRows(
                    rows,
                    config
                );


            if (
                normalized.length
            ) {

                state.receipts.push(
                    ...normalized
                );


                state.datasets.push({

                    name: file.name,

                    type: config.type,

                    records:
                        normalized.length,

                    source: "User import",

                    status: "Loaded"

                });


                imported++;

                addHistory(
                    "Imported dataset",
                    `${file.name} · ${normalized.length} records`
                );

            }

        } catch (error) {

            console.error(
                file.name,
                error
            );

        }

    }


    state.allReceipts =
        [...state.receipts];


    finishDataProcessing();


    $("#importStatus")
        .textContent =
        imported
            ? `${imported} dataset(s) imported successfully.`
            : "No supported records were found.";


    toast(
        imported
            ? `${imported} dataset(s) imported`
            : "Import failed",
        imported ? "✓" : "!"
    );


    event.target.value = "";

}


/* =====================================================
   TYPE DETECTION
===================================================== */

function detectType(filename) {

    const name =
        filename.toLowerCase();


    if (
        name.includes("spotify")
    ) {

        return "music";

    }


    if (
        name.includes("household")
    ) {

        return "purchase";

    }


    if (
        name.includes("transaction")
    ) {

        return "transaction";

    }


    return "dataset";

}


/* =====================================================
   DETAIL MODALS
===================================================== */

function showReceiptDetail(
    receipt
) {

    $("#detailEyebrow")
        .textContent =
        `${receipt.type.toUpperCase()} RECEIPT`;


    $("#detailTitle")
        .textContent =
        receipt.title;


    const fields =
        Object.entries(
            receipt.raw || {}
        )
        .filter(
            ([,value]) =>
                String(value).trim()
        )
        .slice(0, 30);


    $("#detailBody").innerHTML = `

        <div class="detail-section">

            <h4>
                Receipt overview
            </h4>

            <p>
                This record comes from
                <strong>
                    ${escapeHTML(
                        receipt.source
                    )}
                </strong>.
                LifeWeave has normalized it into
                a common receipt format.
            </p>

        </div>


        <div class="detail-grid">

            <div class="detail-field">

                <span>
                    Date
                </span>

                <strong>
                    ${formatDateTime(
                        receipt.date
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Category
                </span>

                <strong>
                    ${escapeHTML(
                        receipt.category ||
                        "Not detected"
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Source
                </span>

                <strong>
                    ${escapeHTML(
                        receipt.source
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Amount
                </span>

                <strong>
                    ${
                        receipt.amount !== null
                            ? formatAmount(
                                receipt.amount
                            )
                            : "Not detected"
                    }
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h4>
                Original dataset fields
            </h4>

            <div class="detail-grid">

                ${fields.map(
                    ([key,value]) => `

                    <div class="detail-field">

                        <span>
                            ${escapeHTML(
                                key
                            )}
                        </span>

                        <strong>
                            ${escapeHTML(
                                String(value)
                            )}
                        </strong>

                    </div>

                `).join("")}

            </div>

        </div>

    `;


    $("#detailModal")
        .classList.remove("hidden");

}


function showConnectionDetail(
    connection
) {

    $("#detailEyebrow")
        .textContent =
        "POSSIBLE CONNECTION";


    $("#detailTitle")
        .textContent =
        "Why these moments are connected";


    $("#detailBody").innerHTML = `

        <div class="detail-section">

            <h4>
                Observed relationship
            </h4>

            <p>
                ${escapeHTML(
                    connection.reason
                )}
            </p>

        </div>


        <div class="detail-grid">

            <div class="detail-field">

                <span>
                    First receipt
                </span>

                <strong>
                    ${escapeHTML(
                        connection.from.title
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Second receipt
                </span>

                <strong>
                    ${escapeHTML(
                        connection.to.title
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    First timestamp
                </span>

                <strong>
                    ${formatDateTime(
                        connection.from.date
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Second timestamp
                </span>

                <strong>
                    ${formatDateTime(
                        connection.to.date
                    )}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h4>
                Interpretation
            </h4>

            <p>
                LifeWeave identifies this as a
                <strong>possible data connection</strong>
                based on observable fields such as
                time or category. It does not claim
                that one event caused the other.
            </p>

        </div>

    `;


    $("#detailModal")
        .classList.remove("hidden");

}


function showStoryDetail(
    story
) {

    $("#detailEyebrow")
        .textContent =
        "LIFE STORY";


    $("#detailTitle")
        .textContent =
        story.title;


    $("#detailBody").innerHTML = `

        <div class="detail-section">

            <h4>
                Chapter description
            </h4>

            <p>
                ${escapeHTML(
                    story.description
                )}
            </p>

        </div>


        <div class="detail-grid">

            <div class="detail-field">

                <span>
                    Start
                </span>

                <strong>
                    ${formatDate(
                        story.start
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    End
                </span>

                <strong>
                    ${formatDate(
                        story.end
                    )}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Moments
                </span>

                <strong>
                    ${story.items.length}
                </strong>

            </div>


            <div class="detail-field">

                <span>
                    Activity types
                </span>

                <strong>
                    ${escapeHTML(
                        story.types.join(", ")
                    )}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h4>
                Moments in this chapter
            </h4>

            <div class="receipt-list">

                ${story.items
                    .slice(0, 10)
                    .map(
                        item =>
                            receiptCompact(
                                item
                            )
                    )
                    .join("")}

            </div>

        </div>

    `;


    $("#detailModal")
        .classList.remove("hidden");

}


/* =====================================================
   LOGIN
===================================================== */

function openLogin() {

    $("#loginModal")
        .classList.remove("hidden");

}


function handleLogin(event) {

    event.preventDefault();


    const name =
        $("#loginName")
            .value
            .trim();


    const email =
        $("#loginEmail")
            .value
            .trim();


    if (!name || !email) {

        return;

    }


    state.user = {

        name,

        email

    };


    savePreferences();

    updateUserUI();

    closeModal(
        "loginModal"
    );


    addHistory(
        "Login",
        `Signed in as ${name}`
    );


    toast(
        `Welcome, ${name}`,
        "✓"
    );

}


function updateUserUI() {

    if (!state.user) {

        $("#userName")
            .textContent =
            "Guest";

        $("#userEmail")
            .textContent =
            "Demo Mode";

        $("#userAvatar")
            .textContent =
            "G";

        $("#loginBtn")
            .textContent =
            "Login";

        return;

    }


    $("#userName")
        .textContent =
        state.user.name;


    $("#userEmail")
        .textContent =
        state.user.email;


    $("#userAvatar")
        .textContent =
        state.user.name
            .charAt(0)
            .toUpperCase();


    $("#loginBtn")
        .textContent =
        "Profile";

}


/* =====================================================
   THEME
===================================================== */

function toggleTheme() {

    state.dark =
        !state.dark;


    applyTheme();


    addHistory(
        "Theme changed",
        state.dark
            ? "Dark mode"
            : "Light mode"
    );

}


function applyTheme() {

    document.body.classList.toggle(
        "dark",
        state.dark
    );


    $("#themeIcon")
        .textContent =
        state.dark
            ? "☀"
            : "☾";


    $("#themeText")
        .textContent =
        state.dark
            ? "Light mode"
            : "Dark mode";


    localStorage.setItem(
        "lifeweave_theme",
        state.dark
            ? "dark"
            : "light"
    );

}


/* =====================================================
   PREFERENCES
===================================================== */

function loadPreferences() {

    state.dark =
        localStorage.getItem(
            "lifeweave_theme"
        ) === "dark";


    try {

        state.user =
            JSON.parse(
                localStorage.getItem(
                    "lifeweave_user"
                ) || "null"
            );

    } catch {

        state.user = null;

    }


    try {

        state.history =
            JSON.parse(
                localStorage.getItem(
                    "lifeweave_history"
                ) || "[]"
            );

    } catch {

        state.history = [];

    }


    applyTheme();

    updateUserUI();

}


function savePreferences() {

    localStorage.setItem(
        "lifeweave_user",
        JSON.stringify(
            state.user
        )
    );


    localStorage.setItem(
        "lifeweave_history",
        JSON.stringify(
            state.history.slice(0, 100)
        )
    );

}


/* =====================================================
   HISTORY
===================================================== */

function addHistory(
    action,
    detail
) {

    state.history.unshift({

        action,

        detail,

        time:
            new Date().toISOString(),

        icon:
            historyIcon(action)

    });


    state.history =
        state.history.slice(
            0,
            100
        );


    savePreferences();

}


function historyIcon(action) {

    if (
        action
            .toLowerCase()
            .includes("import")
    ) {

        return "↑";

    }


    if (
        action
            .toLowerCase()
            .includes("login")
    ) {

        return "●";

    }


    if (
        action
            .toLowerCase()
            .includes("theme")
    ) {

        return "◐";

    }


    return "•";

}


/* =====================================================
   RESET
===================================================== */

async function resetDemo() {

    const okay =
        confirm(
            "Reload demo datasets and remove imported records?"
        );


    if (!okay) {

        return;

    }


    state.receipts = [];

    state.datasets = [];

    state.filter = "all";

    state.search = "";

    $("#globalSearch").value = "";


    await loadDemoDatasets();


    addHistory(
        "Reset",
        "Demo datasets restored"
    );


    toast(
        "Demo data restored",
        "✓"
    );

}


/* =====================================================
   MODALS
===================================================== */

function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


function closeAllModals() {

    $$(".modal").forEach(
        modal =>
            modal.classList.add(
                "hidden"
            )
    );

}


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function toast(
    message,
    icon = "✓"
) {

    $("#toastMessage")
        .textContent =
        message;


    $("#toastIcon")
        .textContent =
        icon;


    const element =
        $("#toast");


    element.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            2400
        );

}


/* =====================================================
   HELPERS
===================================================== */

function typeIcon(type) {

    const icons = {

        music: "♫",

        purchase: "₹",

        transaction: "▤",

        dataset: "◉"

    };


    return icons[type] || "•";

}


function newestFirst(a,b) {

    const dateA =
        dateObject(a.date);

    const dateB =
        dateObject(b.date);


    if (!dateA && !dateB) {

        return 0;

    }


    if (!dateA) {

        return 1;

    }


    if (!dateB) {

        return -1;

    }


    return dateB - dateA;

}


function oldestFirst(a,b) {

    return -newestFirst(a,b);

}


function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString();

}


function formatAmount(number) {

    if (
        !Number.isFinite(number)
    ) {

        return "—";

    }


    return "₹" +
        number.toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2
            }
        );

}


function capitalize(text) {

    return String(text)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function slug(text) {

    return String(text)
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );

}


function truncate(
    text,
    length
) {

    text =
        String(text || "");


    return text.length > length
        ? text.slice(0, length) + "..."
        : text;

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function emptyPage(
    title,
    description
) {

    return `

        <div class="panel">

            <div class="empty">

                <strong>
                    ${title}
                </strong>

                <span>
                    ${description}
                </span>

            </div>

        </div>

    `;

}